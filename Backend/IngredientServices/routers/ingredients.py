from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import date
import httpx
from database import get_db_connection
import logging

# config logging
logger = logging.getLogger(__name__)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="http://localhost:4000/auth/token")
router = APIRouter(prefix="/ingredients", tags=["ingredients"])

# helper functions
def row_to_dict(row: Optional[Any]) -> Optional[Dict[str, Any]]:
    """Converts a pyodbc.Row object to a dictionary."""
    if row is None:
        return None
    return dict(zip([column[0] for column in row.cursor_description], row))

# threshold for stock status
thresholds = {
    "g": 50, "kg": 0.5, "ml": 100, "l": 0.5,
}

def get_status(amount: float, measurement: str):
    # ensure measurement is a string and handle potential none values
    meas_lower = (measurement or "").lower()
    if amount <= 0: return "Not Available"
    if amount <= thresholds.get(meas_lower, 1): return "Low Stock"
    return "Available"

# models
class IngredientCreate(BaseModel):
    IngredientName: str
    Amount: float
    Measurement: str
    BestBeforeDate: date
    ExpirationDate: date

class IngredientUpdate(BaseModel):
    IngredientName: str
    Amount: float
    Measurement: str
    BestBeforeDate: date
    ExpirationDate: date

class IngredientOut(BaseModel):
    IngredientID: int
    IngredientName: str
    Amount: float
    Measurement: str
    BestBeforeDate: date
    ExpirationDate: date
    Status: str

# authentication
async def validate_token_and_roles(token: str, allowed_roles: List[str]):
    USER_SERVICE_ME_URL = "http://localhost:4000/auth/users/me"
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(USER_SERVICE_ME_URL, headers={"Authorization": f"Bearer {token}"})
            response.raise_for_status()
        except httpx.HTTPStatusError as e:
            error_detail = f"Ingredients Auth service error: {e.response.status_code}"
            try: error_detail += f" - {e.response.json().get('detail', e.response.text)}"
            except: error_detail += f" - {e.response.text}"
            logger.error(error_detail)
            raise HTTPException(status_code=e.response.status_code, detail=error_detail)
        except httpx.RequestError as e:
            logger.error(f"Ingredients Auth service unavailable: {e}")
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=f"Ingredients Auth service unavailable: {e}")

    user_data = response.json()
    user_role = user_data.get("userRole")
    if user_role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied. Required role not met. User has role: '{user_role}'"
        )

# get ingredients
@router.get("/", response_model=List[IngredientOut])
async def get_all_ingredients(token: str = Depends(oauth2_scheme)):
    await validate_token_and_roles(token, ["admin", "manager", "staff", "cashier"])
    
    conn = None
    try:
        conn = await get_db_connection()
        async with conn.cursor() as cursor:
            await cursor.execute("""
                SELECT IngredientID, IngredientName, Amount, Measurement, 
                       BestBeforeDate, ExpirationDate, Status 
                FROM Ingredients
            """)
            rows = await cursor.fetchall()
            return [IngredientOut(**row_to_dict(row)) for row in rows]
    finally:
        if conn: await conn.close()

# create ingredients
@router.post("/", response_model=IngredientOut, status_code=status.HTTP_201_CREATED)
async def add_ingredient(ingredient: IngredientCreate, token: str = Depends(oauth2_scheme)):
    await validate_token_and_roles(token, ["admin", "manager", "staff"])
    conn = None
    try:
        conn = await get_db_connection()
        async with conn.cursor() as cursor:
            await cursor.execute("SELECT 1 FROM Ingredients WHERE IngredientName COLLATE Latin1_General_CI_AS = ?", ingredient.IngredientName)
            if await cursor.fetchone():
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Ingredient name already exists.")

            status_val = get_status(ingredient.Amount, ingredient.Measurement)
            
            await cursor.execute("""
                INSERT INTO Ingredients (IngredientName, Amount, Measurement, BestBeforeDate, ExpirationDate, Status)
                OUTPUT INSERTED.IngredientID, INSERTED.IngredientName, INSERTED.Amount, INSERTED.Measurement, 
                       INSERTED.BestBeforeDate, INSERTED.ExpirationDate, INSERTED.Status
                VALUES (?, ?, ?, ?, ?, ?)
            """, ingredient.IngredientName, ingredient.Amount, ingredient.Measurement,
                ingredient.BestBeforeDate, ingredient.ExpirationDate, status_val)
            
            row = await cursor.fetchone()
            await conn.commit()
            return IngredientOut(**row_to_dict(row))
    finally:
        if conn: await conn.close()

# update ingredients
@router.put("/{ingredient_id}", response_model=IngredientOut)
async def update_ingredient(ingredient_id: int, ingredient: IngredientUpdate, token: str = Depends(oauth2_scheme)):
    await validate_token_and_roles(token, ["admin", "manager", "staff"])
    conn = None

    try:
        conn = await get_db_connection()
        async with conn.cursor() as cursor:

            # duplicate check
            await cursor.execute("""
                SELECT 1 FROM Ingredients
                WHERE IngredientName COLLATE Latin1_General_CI_AS = ?
                AND IngredientID != ?
            """, ingredient.IngredientName, ingredient_id)
            if await cursor.fetchone():
                raise HTTPException(status_code=400, detail="Ingredient name already exists.")

            status_val = get_status(ingredient.Amount, ingredient.Measurement)

            await cursor.execute("""
                UPDATE Ingredients
                SET IngredientName = ?, Amount = ?, Measurement = ?, BestBeforeDate = ?, ExpirationDate = ?, Status = ?
                WHERE IngredientID = ?
            """, ingredient.IngredientName, ingredient.Amount, ingredient.Measurement,
                ingredient.BestBeforeDate, ingredient.ExpirationDate, status_val, ingredient_id)

            await cursor.execute("SELECT * FROM Ingredients WHERE IngredientID = ?", ingredient_id)
            row = await cursor.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Ingredient not found")

            return {
                "IngredientID": row.IngredientID,
                "IngredientName": row.IngredientName,
                "Amount": row.Amount,
                "Measurement": row.Measurement,
                "BestBeforeDate": row.BestBeforeDate,
                "ExpirationDate": row.ExpirationDate,
                "Status": row.Status
            }
    finally:
        if conn: await conn.close()

# delete ingredient
@router.delete("/{ingredient_id}", status_code=status.HTTP_200_OK)
async def delete_ingredient(ingredient_id: int, token: str = Depends(oauth2_scheme)):
    await validate_token_and_roles(token, ["admin", "manager", "staff"])
    conn = None

    try:
        conn = await get_db_connection()
        async with conn.cursor() as cursor:
            await cursor.execute("DELETE FROM Ingredients WHERE IngredientID = ?", ingredient_id)

        return {"message": "Ingredient deleted successfully"}
    finally:
        if conn: await conn.close()

# get ingredient count
@router.get("/count")
async def get_ingredient_count(token: str = Depends(oauth2_scheme)):
    await validate_token_and_roles(token, ["admin", "manager", "staff", "cashier"])
    conn = None
    try:
        conn = await get_db_connection()
        async with conn.cursor() as cursor:
            await cursor.execute("SELECT COUNT(*) as count FROM Ingredients")
            row = await cursor.fetchone()
            return {"count": row.count if row else 0}
    finally:
        if conn: await conn.close()

# get stock status counts
@router.get("/stock-status-counts")
async def get_stock_status_counts(token: str = Depends(oauth2_scheme)):
    await validate_token_and_roles(token, ["admin", "manager", "staff", "cashier"])
    conn = None
    try:
        conn = await get_db_connection()
        async with conn.cursor() as cursor:
            await cursor.execute("""
                SELECT
                    SUM(CASE WHEN Status = 'Available' THEN 1 ELSE 0 END) AS available_count,
                    SUM(CASE WHEN Status = 'Low Stock' THEN 1 ELSE 0 END) AS low_stock_count,
                    SUM(CASE WHEN Status = 'Not Available' THEN 1 ELSE 0 END) AS not_available_count
                FROM Ingredients
            """)
            row = await cursor.fetchone()
            return {
                "available": row.available_count or 0,
                "low_stock": row.low_stock_count or 0,
                "not_available": row.not_available_count or 0
            }
    finally:
        if conn: await conn.close()

# get low stock alerts
@router.get("/low-stock-alerts")
async def get_low_stock_alerts(token: str = Depends(oauth2_scheme)):
    await validate_token_and_roles(token, ["admin", "manager", "staff", "cashier"])
    conn = None
    try:
        conn = await get_db_connection()
        async with conn.cursor() as cursor:
            await cursor.execute("""
                SELECT IngredientName as name, 'Ingredient' as category, Amount as inStock, 
                       5 as reorderLevel, NULL as lastRestocked, Status as status
                FROM Ingredients
                WHERE Status = 'Low Stock'
            """)
            rows = await cursor.fetchall()
            return [dict(zip([column[0] for column in row.cursor_description], row)) for row in rows]
    finally:
        if conn: await conn.close()