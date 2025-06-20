from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import aioodbc
from database import get_db_connection  
import os
import uuid
from fastapi import BackgroundTasks
from email.message import EmailMessage
from dotenv import load_dotenv
from pydantic import EmailStr
from typing import List

load_dotenv()

# jwt config
SECRET_KEY = "15882913506880857248f72d1dbc38dd7d2f8f352786563ef5f23dc60987c632"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

router = APIRouter()

# models
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: str | None = None

class User(BaseModel):
    username: str
    userRole: str
    system: str
    disabled: bool | None = None

class UserInDB(User):
    hashed_password: str
    system: str

# hash password
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

# email helper for forgor pass
def send_reset_email(email_to: str, reset_link: str):
    SMTP_SERVER = os.getenv("SMTP_SERVER")
    SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
    SMTP_USERNAME = os.getenv("SMTP_USERNAME")
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
    EMAIL_FROM = os.getenv("EMAIL_FROM")

    msg = EmailMessage()
    msg['Subject'] = "Password Reset Request"
    msg['From'] = EMAIL_FROM
    msg['To'] = email_to
    msg.set_content(f"Please click the following link to reset your password:\n\n{reset_link}\n\nIf you did not request this, please ignore this email.")

    try:
        import smtplib
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)
    except Exception as e:
        print(f"Error sending email: {e}")

# get users 
async def get_users_from_db(username: str):
    conn = await get_db_connection()
    cursor = await conn.cursor()
    await cursor.execute(
        '''SELECT Username, UserPassword, UserRole, isDisabled, System FROM Users WHERE Username = ? AND isDisabled = 0''',
        (username,)
    )
    user_rows = await cursor.fetchall()
    await conn.close()

    users = []
    for row in user_rows:
        users.append(UserInDB(
            username=row[0],
            hashed_password=row[1],
            userRole=row[2],
            disabled=row[3] == 1,
            system=row[4]
        ))
    return users

# hash pass
def get_password_hash(password: str):
    return pwd_context.hash(password)

# ensure admin exists on startup
async def create_admin_user():
    admin_user = await get_users_from_db('superadmin')
    if not admin_user:
        hashed_password = get_password_hash('superadmin123')
        conn = await get_db_connection()
        cursor = await conn.cursor()
        try:
            await cursor.execute(
                '''INSERT INTO Users (UserPassword, Email, UserRole, isDisabled, System, Username, PhoneNumber, FirstName, MiddleName, LastName, Suffix) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
                (hashed_password, 'superadmin@example.com', 'superadmin' ,  0,  'AUTH', 'superadmin', '', 'Super', '', 'Admin', '',)
            )
            await conn.commit()
            print("Super Admin created.")
        finally:
            await cursor.close()
            await conn.close()
    else:
        print("Super Admin already exists.")

@router.on_event("startup")
async def on_startup():
    await create_admin_user()

# verify password
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

# authenticate user
async def authenticate_user(username: str, password: str):
    users = await get_users_from_db(username)
    for user in users:
        if verify_password(password, user.hashed_password):
            return user
    return None

# create jwt token
def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta if expires_delta else timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# get current user from token
async def get_current_user(token: str = Depends(oauth2_scheme)):
    credential_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"}
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credential_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credential_exception

    users = await get_users_from_db(token_data.username)
    if not users:
        raise credential_exception

    return users[0]

# validate active user
async def get_current_active_user(current_user: UserInDB = Depends(get_current_user)):
    if current_user.disabled:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

# role-based access control
def role_required(required_roles: List[str]):
    async def role_checker(current_user: UserInDB = Depends(get_current_active_user)):
        if current_user.userRole not in required_roles:
            raise HTTPException(status_code=403, detail="Access denied")
        return current_user
    return role_checker

# get current user info
@router.get("/users/me", response_model=User)
async def get_current_user_info(current_user: UserInDB = Depends(get_current_active_user)):
    return {
        "username": current_user.username,
        "userRole": current_user.userRole,
        "system": current_user.system, 
        "disabled": current_user.disabled
    }

# login endpoint — returns jwt token
@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    print("Attempting to authenticate user:", form_data.username)
    
    user = await authenticate_user(form_data.username, form_data.password)
    if not user:
        print("Authentication failed for user:", form_data.username)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"}
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "role": user.userRole, "system": user.system},
        expires_delta=access_token_expires
    )
    
    print("Authentication successful for:", user.username)
    return {"access_token": access_token, "token_type": "bearer"}

# admin-only test endpoint
@router.get("/superadmin-only", dependencies=[Depends(role_required(["superadmin"]))])
async def admin_only_route():
    return {"message": "This is restricted to super admin only"}

# forgor password
@router.post("/forgot-password")
async def forgot_password(email: EmailStr, background_tasks: BackgroundTasks):
    conn = await get_db_connection()
    cursor = await conn.cursor()
    await cursor.execute(
        "SELECT Username FROM Users WHERE Email = ? AND UserRole = 'user' AND System = 'OOS' AND isDisabled = 0",
        (email,)
    )
    user = await cursor.fetchone()
    if not user:
        await cursor.close()
        await conn.close()
        return {"message": "If this email is registered, a reset link has been sent."}

    # generate token and store in DB 
    reset_token = str(uuid.uuid4())
    expires_at = datetime.utcnow() + timedelta(minutes=int(os.getenv("RESET_TOKEN_EXP_MINUTES", 15)))
    await cursor.execute(
        "INSERT INTO tokensReset (email, token, expires_at) VALUES (?, ?, ?)",
        (email, reset_token, expires_at.strftime("%Y-%m-%d %H:%M:%S"))
    )
    await conn.commit()
    await cursor.close()
    await conn.close()

    reset_link = f"{os.getenv('RESET_LINK_BASE')}?token={reset_token}&email={email}"
    background_tasks.add_task(send_reset_email, email, reset_link)
    return {"message": "If this email is registered, a reset link has been sent."}

# reset password
@router.post("/reset-password")
async def reset_password(email: EmailStr, token: str, new_password: str):
    conn = await get_db_connection()
    cursor = await conn.cursor()
    await cursor.execute(
        "SELECT expires_at FROM tokensReset WHERE email = ? AND token = ?",
        (email, token)
    )
    row = await cursor.fetchone()
    if not row:
        await cursor.close()
        await conn.close()
        raise HTTPException(status_code=400, detail="Invalid or expired token.")

    expires_at = row[0]
    if isinstance(expires_at, str):
        expires_at = datetime.strptime(expires_at, "%Y-%m-%d %H:%M:%S")
    if datetime.utcnow() > expires_at:
        await cursor.execute("DELETE FROM tokensReset WHERE email = ? AND token = ?", (email, token))
        await conn.commit()
        await cursor.close()
        await conn.close()
        raise HTTPException(status_code=400, detail="Token expired.")

    # update pass
    hashed_password = pwd_context.hash(new_password)
    await cursor.execute(
        "UPDATE Users SET UserPassword = ? WHERE Email = ? AND UserRole = 'user' AND System = 'OOS' AND isDisabled = 0",
        (hashed_password, email)
    )
    await cursor.execute("DELETE FROM tokensReset WHERE email = ?", (email,))
    await conn.commit()
    await cursor.close()
    await conn.close()
    return {"message": "Password has been reset successfully."}