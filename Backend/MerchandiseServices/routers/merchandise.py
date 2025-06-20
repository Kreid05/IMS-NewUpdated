from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import date
import httpx
from database import get_db_connection
import logging

# configure logging
logger = logging.getLogger(__name__)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="http://localhost:4000/auth/token")
router = APIRouter(prefix="/merchandise", tags=["merchandise"])

# helper function
def row_to_dict(row: Optional[Any]) -> Optional[Dict[str, Any]]:
    """Converts a pyodbc.Row object to a dictionary."""
    if row is None:
        return None
    return dict(zip([column[0] for column in row.cursor_description], row))

# threshold for stock status
def get_status(quantity: int) -> str:
    if quantity == 0:
        return "Not Available"
    elif quantity < 10:
        return "Low Stock"
    else:
        return "Available"

# auth validation
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

# models
class MerchandiseCreate(BaseModel):
    MerchandiseName: str
    MerchandiseQuantity: int
    MerchandiseDateAdded: date

class MerchandiseUpdate(BaseModel):
    MerchandiseName: str
    MerchandiseQuantity: int
    MerchandiseDateAdded: date

class MerchandiseOut(BaseModel):
    MerchandiseID: int
    MerchandiseName: str
    MerchandiseQuantity: int
    MerchandiseDateAdded: date
    Status: str

# get merch
@router.get("/", response_model=List[MerchandiseOut])
async def get_all_merchandise(token: str = Depends(oauth2_scheme)):
    await validate_token_and_roles(token, ["admin", "manager", "staff"])
    conn = None

    try:
        conn = await get_db_connection()
        async with conn.cursor() as cursor:
            await cursor.execute("SELECT * FROM Merchandise")
            rows = await cursor.fetchall()
            return [
                {
                    "MerchandiseID": row.MerchandiseID,
                    "MerchandiseName": row.MerchandiseName,
                    "MerchandiseQuantity": row.MerchandiseQuantity,
                    "MerchandiseDateAdded": row.MerchandiseDateAdded,
                    "Status": row.Status
                }
                for row in rows
            ]
    finally:
        if conn: await conn.close()

# create merch
@router.post("/", response_model=MerchandiseOut)
async def add_merchandise(data: MerchandiseCreate, token: str = Depends(oauth2_scheme)):
    await validate_token_and_roles(token, ["admin", "manager", "staff"])
    conn = None

    status_value = get_status(data.MerchandiseQuantity)

    try:
        conn = await get_db_connection()
        async with conn.cursor() as cursor:
            
            # duplicate check
            await cursor.execute("""
                SELECT 1 FROM Merchandise
                WHERE MerchandiseName COLLATE Latin1_General_CI_AS = ?
            """, data.MerchandiseName)
            if await cursor.fetchone():
                raise HTTPException(status_code=400, detail="Merchandise name already exists.")

            await cursor.execute("""
                INSERT INTO Merchandise (MerchandiseName, MerchandiseQuantity, MerchandiseDateAdded, Status)
                OUTPUT INSERTED.*
                VALUES (?, ?, ?, ?)
            """, data.MerchandiseName, data.MerchandiseQuantity, data.MerchandiseDateAdded, status_value)

            row = await cursor.fetchone()
            return {
                "MerchandiseID": row.MerchandiseID,
                "MerchandiseName": row.MerchandiseName,
                "MerchandiseQuantity": row.MerchandiseQuantity,
                "MerchandiseDateAdded": row.MerchandiseDateAdded,
                "Status": row.Status
            }
    finally:
        if conn: await conn.close()

# update merch
@router.put("/{merchandise_id}", response_model=MerchandiseOut)
async def update_merchandise(merchandise_id: int, data: MerchandiseUpdate, token: str = Depends(oauth2_scheme)):
    await validate_token_and_roles(token, ["admin", "manager", "staff"])
    conn = None

    status_value = get_status(data.MerchandiseQuantity)
    try: 
        conn = await get_db_connection()
        async with conn.cursor() as cursor:
        
        # duplicate check
            await cursor.execute("""
                SELECT 1 FROM Merchandise
                WHERE MerchandiseName COLLATE Latin1_General_CI_AS = ? 
                AND MerchandiseID != ?
            """, data.MerchandiseName, merchandise_id)
            if await cursor.fetchone():
                raise HTTPException(status_code=400, detail="Merchandise name already exists.")

            await cursor.execute("""
                UPDATE Merchandise
                SET MerchandiseName = ?, MerchandiseQuantity = ?, MerchandiseDateAdded = ?, Status = ?
                WHERE MerchandiseID = ?
            """, data.MerchandiseName, data.MerchandiseQuantity, data.MerchandiseDateAdded, status_value, merchandise_id)

            await cursor.execute("SELECT * FROM Merchandise WHERE MerchandiseID = ?", merchandise_id)
            row = await cursor.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Merchandise not found")

            return {
                "MerchandiseID": row.MerchandiseID,
                "MerchandiseName": row.MerchandiseName,
                "MerchandiseQuantity": row.MerchandiseQuantity,
                "MerchandiseDateAdded": row.MerchandiseDateAdded,
                "Status": row.Status
            }
    finally:
        if conn: await conn.close()

# delete merch
@router.delete("/{merchandise_id}", response_model=dict)
async def delete_merchandise(merchandise_id: int, token: str = Depends(oauth2_scheme)):
    await validate_token_and_roles(token, ["admin", "manager", "staff"])
    conn = None

    try:
        conn = await get_db_connection()
        async with conn.cursor() as cursor:
            await cursor.execute("DELETE FROM Merchandise WHERE MerchandiseID = ?", merchandise_id)

        return {"message": "Merchandise deleted successfully"}
    finally:
        if conn: await conn.close()

# get merchandise count
@router.get("/count")
async def get_merchandise_count(token: str = Depends(oauth2_scheme)):
    await validate_token_and_roles(token, ["admin", "manager", "staff"])
    conn = None
    try:
        conn = await get_db_connection()
        async with conn.cursor() as cursor:
            await cursor.execute("SELECT COUNT(*) as count FROM Merchandise")
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
                FROM Merchandise
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
            await cursor.execute(
                "SELECT MerchandiseName as name, 'Merchandise' as category, MerchandiseQuantity as inStock, "
                "5 as reorderLevel, NULL as lastRestocked, Status as status "
                "FROM Merchandise WHERE Status = 'Low Stock'"
            )
            rows = await cursor.fetchall()
            return [dict(zip([column[0] for column in row.cursor_description], row)) for row in rows]
    finally:
        if conn: await conn.close()