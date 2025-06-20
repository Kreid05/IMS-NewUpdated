from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import date
import httpx
from database import get_db_connection
import logging

# congfigure logging
logger = logging.getLogger(__name__)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="http://localhost:4000/auth/token")
router = APIRouter(prefix="/materials", tags=["materials"])

# helper function
def row_to_dict(row: Optional[Any]) -> Optional[Dict[str, Any]]:
    """Converts a pyodbc.Row object to a dictionary."""
    if row is None:
        return None
    return dict(zip([column[0] for column in row.cursor_description], row))

# threshold for stock status
thresholds = {
    "pcs": 10,
    "box": 5,
    "pack": 5,
}

def get_status(quantity: float, measurement: str):
    meas_lower = (measurement or "").lower()
    if quantity <= 0: return "Not Available"
    if quantity <= thresholds.get(meas_lower, 1): return "Low Stock"
    return "Available"

# models
class MaterialCreate(BaseModel):
    MaterialName: str
    MaterialQuantity: float
    MaterialMeasurement: str
    DateAdded: date

class MaterialUpdate(BaseModel):
    MaterialName: str
    MaterialQuantity: float
    MaterialMeasurement: str
    DateAdded: date

class MaterialOut(BaseModel):
    MaterialID: int
    MaterialName: str
    MaterialQuantity: float
    MaterialMeasurement: str
    DateAdded: date
    Status: str

# auth validation
async def validate_token_and_roles(token: str, allowed_roles: List[str]):
    USER_SERVICE_ME_URL = "http://localhost:4000/auth/users/me"
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(USER_SERVICE_ME_URL, headers={"Authorization": f"Bearer {token}"})
            response.raise_for_status()
        except httpx.HTTPStatusError as e:
            error_detail = f"Materials Auth service error: {e.response.status_code}"
            try: error_detail += f" - {e.response.json().get('detail', e.response.text)}"
            except: error_detail += f" - {e.response.text}"
            logger.error(error_detail)
            raise HTTPException(status_code=e.response.status_code, detail=error_detail)
        except httpx.RequestError as e:
            logger.error(f"Materials Auth service unavailable: {e}")
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=f"Materials Auth service unavailable: {e}")

    user_data = response.json()
    user_role = user_data.get("userRole")
    if user_role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied. Required role not met. User has role: '{user_role}'"
        )
    
# get materials
@router.get("/", response_model=List[MaterialOut])
async def get_all_materials(token: str = Depends(oauth2_scheme)):
    await validate_token_and_roles(token, ["admin", "manager", "staff"])
    conn = None
    try :
        conn = await get_db_connection()
        async with conn.cursor() as cursor:
            await cursor.execute("SELECT * FROM Materials")
            rows = await cursor.fetchall()
            return [
                {
                    "MaterialID": row.MaterialID,
                    "MaterialName": row.MaterialName,
                    "MaterialQuantity": row.MaterialQuantity,
                    "MaterialMeasurement": row.MaterialMeasurement,
                    "DateAdded": row.DateAdded,
                    "Status": row.Status
                }
                for row in rows
            ]
    finally:
        if conn: await conn.close()

# create material
@router.post("/", response_model=MaterialOut, status_code=status.HTTP_201_CREATED)
async def add_material(material: MaterialCreate, token: str = Depends(oauth2_scheme)):
    await validate_token_and_roles(token, ["admin", "manager", "staff"])
    conn = None
    try:
        conn = await get_db_connection()
        async with conn.cursor() as cursor:
            await cursor.execute("""
                SELECT 1 FROM Materials
                WHERE MaterialName COLLATE Latin1_General_CI_AS = ?
            """, material.MaterialName)
            if await cursor.fetchone():
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Material name already exists.")

            status_val = get_status(material.MaterialQuantity, material.MaterialMeasurement)

            await cursor.execute("""
                INSERT INTO Materials (MaterialName, MaterialQuantity, MaterialMeasurement, DateAdded, Status)
                OUTPUT INSERTED.MaterialID, INSERTED.MaterialName, INSERTED.MaterialQuantity, 
                       INSERTED.MaterialMeasurement, INSERTED.DateAdded, INSERTED.Status
                VALUES (?, ?, ?, ?, ?)
            """, material.MaterialName, material.MaterialQuantity,
                 material.MaterialMeasurement, material.DateAdded, status_val)
            
            row = await cursor.fetchone()
            await conn.commit()
            return MaterialOut(**row_to_dict(row))
    finally:
        if conn: await conn.close()

# update material
@router.put("/{material_id}", response_model=MaterialOut)
async def update_material(material_id: int, material: MaterialUpdate, token: str = Depends(oauth2_scheme)):
    await validate_token_and_roles(token, ["admin", "manager", "staff"])
    conn = None

    try:
        conn = await get_db_connection()
        async with conn.cursor() as cursor:

            # duplicate check
            await cursor.execute("""
                SELECT 1 FROM Materials
                WHERE MaterialName COLLATE Latin1_General_CI_AS = ?
                AND MaterialID != ?
            """, material.MaterialName, material_id)
            if await cursor.fetchone():
                raise HTTPException(status_code=400, detail="Material name already exists.")

            status = get_status(material.MaterialQuantity, material.MaterialMeasurement)
            await cursor.execute("""
                UPDATE Materials
                SET MaterialName = ?, MaterialQuantity = ?, MaterialMeasurement = ?, DateAdded = ?, Status = ?
                WHERE MaterialID = ?
            """, material.MaterialName, material.MaterialQuantity,
                material.MaterialMeasurement, material.DateAdded, status, material_id)

            await cursor.execute("SELECT * FROM Materials WHERE MaterialID = ?", material_id)
            row = await cursor.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Material not found")

            return {
                "MaterialID": row.MaterialID,
                "MaterialName": row.MaterialName,
                "MaterialQuantity": row.MaterialQuantity,
                "MaterialMeasurement": row.MaterialMeasurement,
                "DateAdded": row.DateAdded,
                "Status": row.Status
            }
    finally:
        if conn: await conn.close()

# delete material
@router.delete("/{material_id}")
async def delete_material(material_id: int, token: str = Depends(oauth2_scheme)):
    await validate_token_and_roles(token, ["admin", "manager", "staff"])
    conn = None

    try:
        conn = await get_db_connection()
        async with conn.cursor() as cursor:
            await cursor.execute("DELETE FROM Materials WHERE MaterialID = ?", material_id)

        return {"message": "Material deleted successfully"}
    finally:
        if conn: await conn.close()

@router.get("/count")
async def get_material_count(token: str = Depends(oauth2_scheme)):
    await validate_token_and_roles(token, ["admin", "manager", "staff"])
    conn = None
    try:
        conn = await get_db_connection()
        async with conn.cursor() as cursor:
            await cursor.execute("SELECT COUNT(*) as count FROM Materials")
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
                FROM Materials
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
                "SELECT MaterialName as name, 'Material' as category, MaterialQuantity as inStock, "
                "5 as reorderLevel, NULL as lastRestocked, Status as status "
                "FROM Materials WHERE Status = 'Low Stock'"
            )
            rows = await cursor.fetchall()
            return [dict(zip([column[0] for column in row.cursor_description], row)) for row in rows]
    finally:
        if conn: await conn.close()