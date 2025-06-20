from fastapi import APIRouter, HTTPException, Depends, status, Form
from datetime import datetime
from database import get_db_connection 
from routers.auth import get_current_active_user, role_required 
import bcrypt
from typing import Optional

router = APIRouter()

# create users
@router.post('/create', dependencies=[Depends(role_required(["superadmin"]))])
async def create_user(
    firstName: str = Form(...),
    middleName: Optional[str] = Form(None),
    lastName: str = Form(...),
    suffix: Optional[str] = Form(None),
    username: str = Form(...), 
    password: str = Form(...), 
    email: str = Form(...), 
    phoneNumber: Optional[str] = Form(None),
    userRole: str = Form(...),
    system: str = Form(...),

):
    if userRole not in ['admin', 'manager', 'staff', 'cashier', 'rider', 'super admin']:
        raise HTTPException(status_code=400, detail="Invalid role")
    if system not in ['IMS', 'POS', 'OOS', 'AUTH']:
        raise HTTPException(status_code=400, detail="Invalid system")
    if not password.strip(): 
        raise HTTPException(status_code=400, detail="Password is required")
    
    if not username.strip():
            raise HTTPException(status_code=400, detail="Username is required")

    conn = None 
    cursor = None
    try:
        conn = await get_db_connection()
        cursor = await conn.cursor()

        await cursor.execute("SELECT 1 FROM Users WHERE Email = ? AND isDisabled = 0", (email,))
        if await cursor.fetchone():
            raise HTTPException(status_code=400, detail="Email is already used")

        await cursor.execute("SELECT 1 FROM Users WHERE Username = ? AND isDisabled = 0", (username,))
        if await cursor.fetchone():
            raise HTTPException(status_code=400, detail=f"Username '{username}' is already taken.")

        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        await cursor.execute('''
            INSERT INTO Users (UserPassword, Email, UserRole, isDisabled, CreatedAt, System, Username, PhoneNumber, FirstName, MiddleName, LastName, Suffix)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (hashed_password, email, userRole, 0, datetime.utcnow(), system, username, phoneNumber, firstName, middleName, lastName, suffix))
        await conn.commit()

    except HTTPException: 
        raise
    except Exception as e:
        print(f"Error in create_user: {e}") 
        raise HTTPException(status_code=500, detail=f"An internal server error occurred during user creation.")
    finally:
        if cursor:
            await cursor.close()
        if conn:
            await conn.close()

    return {'message': f'{userRole.capitalize()} created successfully!'}

# get users
@router.get('/list-users', dependencies=[Depends(role_required(['superadmin']))])
async def list_users():
    conn = None
    cursor = None
    try:
        conn = await get_db_connection()
        cursor = await conn.cursor()
        await cursor.execute(''' 
            SELECT UserID, Email, UserRole, isDisabled, CreatedAt, System, Username, PhoneNumber, FirstName, MiddleName, LastName, Suffix
            FROM Users
        ''')
        users_db = await cursor.fetchall()
    except Exception as e:
        print(f"Error in list_users: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve user list.")
    finally:
        if cursor: await cursor.close()
        if conn: await conn.close()

    users_list = []
    for u in users_db:
        # concatenate
        first_name = u[8]
        middle_name = u[9]
        last_name = u[10]
        suffix = u[11]

        # list existing users
        name_parts = [first_name, middle_name, last_name, suffix]
        # Filter out any None or empty string parts and join them with a space
        full_name = ' '.join(part for part in name_parts if part)
        
        # use the full name in the user dictionary
        users_list.append({
            "userID": u[0],
            "fullName": full_name,  # concatenated full name
            "username": u[6],
            "email": u[1],
            "userRole": u[2],
            "createdAt": u[4].isoformat() if u[4] else None,
            "system": u[5],
            "phoneNumber": u[7],
            "isDisabled": bool(u[3])
        })
    return users_list

# update users
@router.put("/update/{user_id}", dependencies=[Depends(role_required(['superadmin']))])
async def update_user(
    user_id: int,
    firstName: Optional[str] = Form(None),
    middleName: Optional[str] = Form(None),
    lastName: Optional[str] = Form(None),
    suffix: Optional[str] = Form(None),
    username: Optional[str] = Form(None),
    password: Optional[str] = Form(None), 
    email: Optional[str] = Form(None),
    phoneNumber: Optional[str] = Form(None),
):
    conn = None
    cursor = None
    try:
        conn = await get_db_connection()
        cursor = await conn.cursor()
        await cursor.execute("SELECT UserRole FROM Users WHERE UserID = ?", (user_id,))
        if not await cursor.fetchone():
            raise HTTPException(status_code=404, detail="User not found")
        
        updates = []
        values = []


        if email:
            await cursor.execute("SELECT 1 FROM Users WHERE Email = ? AND UserID != ? AND isDisabled = 0", (email, user_id))
            if await cursor.fetchone():
                raise HTTPException(status_code=400, detail="Email is already used by another user")
            updates.append('Email = ?')
            values.append(email)
        
        if phoneNumber is not None:
            updates.append('PhoneNumber = ?')
            values.append(phoneNumber)

        if password:
            hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            updates.append('UserPassword = ?')
            values.append(hashed_password)  
        
        if firstName is not None:
            updates.append('FirstName = ?')
            values.append(firstName)

        if middleName is not None:
            updates.append('MiddleName = ?')
            values.append(middleName)

        if lastName is not None:
            updates.append('LastName = ?')
            values.append(lastName)

        if suffix is not None:
            updates.append('Suffix = ?')
            values.append(suffix)
        
        if username is not None:
            updates.append('Username = ?')
            values.append(username)

        if not updates:
            return {'message': 'No fields to update'}

        values.append(user_id)
        
        await cursor.execute(f"UPDATE Users SET {', '.join(updates)} WHERE UserID = ?", tuple(values))
        await conn.commit()
                
    except HTTPException: raise
    except Exception as e:
        print(f"Error in update_user: {e}")
        raise HTTPException(status_code=500, detail="An internal server error occurred during user update.")
    finally:
        if cursor: await cursor.close()
        if conn: await conn.close()

    return {'message': 'User updated successfully'}

# disable user
@router.put('/disable/{user_id}', dependencies=[Depends(role_required(['superadmin']))])
async def disable_user(user_id: int):
    conn = None
    cursor = None
    try:
        conn = await get_db_connection()
        cursor = await conn.cursor()
        await cursor.execute("SELECT 1 FROM Users WHERE UserID = ? AND isDisabled = 0", (user_id,))
        if not await cursor.fetchone():
            raise HTTPException(status_code=404, detail="User not found or already disabled.")
        await cursor.execute("UPDATE Users SET isDisabled = 1 WHERE UserID = ? ", (user_id,))
        await conn.commit()
    except HTTPException: raise
    except Exception as e:
        print(f"Error in disable_user: {e}")
        raise HTTPException(status_code=500, detail="An internal server error occurred during user deletion.")
    finally:
        if cursor: await cursor.close()
        if conn: await conn.close()

    return {'message': 'User disabled successfully'}

# oos signup
@router.post('/signup-oos')
async def signup_oos_user(
    firstName: str = Form(...),
    middleName: Optional[str] = Form(None),
    lastName: str = Form(...),
    suffix: Optional[str] = Form(None),
    username: str = Form(...),
    password: str = Form(...),
    email: str = Form(...),
    phoneNumber: str = Form(...),
):
    userRole = 'user'   
    system = 'OOS'     

    if not password.strip() or not username.strip():
        raise HTTPException(status_code=400, detail="Username and Password are required")

    conn = None
    cursor = None
    try:
        conn = await get_db_connection()
        cursor = await conn.cursor()

        await cursor.execute("SELECT 1 FROM Users WHERE Username = ? AND System = ? AND isDisabled = 0", (username, system))
        if await cursor.fetchone():
            raise HTTPException(status_code=400, detail="Username is already taken")
        await cursor.execute("SELECT 1 FROM Users WHERE Email = ? AND System = ? AND isDisabled = 0", (email, system))
        if await cursor.fetchone():
            raise HTTPException(status_code=400, detail="Email is already is used")

        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        await cursor.execute('''
            INSERT INTO Users (UserPassword, Email, UserRole, isDisabled, CreatedAt, System, Username, PhoneNumber, FirstName, MiddleName, LastName, Suffix)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (hashed_password, email, userRole, 0, datetime.utcnow(), system, username, phoneNumber, firstName, middleName, lastName, suffix))
        await conn.commit()
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in signup_oos_user: {e}")
        raise HTTPException(status_code=500, detail="An internal server error occurred during signup.")
    finally:
        if cursor: await cursor.close()
        if conn: await conn.close()

    return {'message': 'OOS user account created successfully!'}