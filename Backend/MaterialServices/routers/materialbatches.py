from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime
import httpx
from database import get_db_connection
import logging

logger = logging.getLogger(__name__)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="http://localhost:4000/auth/token")
router = APIRouter(prefix="/material-batches", tags=["material batches"])

async def validate_token_and_roles(token: str, allowed_roles: List[str]):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "http://localhost:4000/auth/users/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Auth failed")
    if response.json().get("userRole") not in allowed_roles:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")

class MaterialBatchCreate(BaseModel):
    material_id: int
    quantity: float
    unit: str
    batch_date: date
    logged_by: str
    notes: Optional[str] = None

class MaterialBatchUpdate(BaseModel):
    quantity: Optional[float]
    unit: Optional[str]
    batch_date: Optional[date]
    logged_by: Optional[str]
    notes: Optional[str]

class MaterialBatchOut(BaseModel):
    batch_id: int
    material_id: int
    material_name: str
    quantity: float
    unit: str
    batch_date: date
    restock_date: datetime
    logged_by: str
    notes: Optional[str]
    status: str

# restock materials
@router.post("/", response_model=MaterialBatchOut)
async def create_batch(batch: MaterialBatchCreate, token: str = Depends(oauth2_scheme)):
    await validate_token_and_roles(token, ["admin", "manager", "staff"])
    conn = await get_db_connection()
    try:
        async with conn.cursor() as cursor:
            status = "Available"
            if batch.quantity == 0:
                status = "Used"
            # insert batch
            await cursor.execute("""
                INSERT INTO MaterialBatches 
                (MaterialID, Quantity, Unit, BatchDate, RestockDate, LoggedBy, Notes, Status)
                OUTPUT 
                    INSERTED.BatchID,
                    INSERTED.MaterialID,
                    INSERTED.Quantity,
                    INSERTED.Unit,
                    INSERTED.BatchDate,
                    INSERTED.RestockDate,
                    INSERTED.LoggedBy,
                    INSERTED.Notes,
                    INSERTED.Status
                VALUES (?, ?, ?, ?, GETDATE(), ?, ?, ?)
            """, batch.material_id, batch.quantity, batch.unit, batch.batch_date, batch.logged_by, batch.notes, status)
            inserted = await cursor.fetchone()
            if not inserted:
                raise HTTPException(status_code=500, detail="Batch insert failed.")

            # fetch material name
            await cursor.execute("SELECT MaterialName FROM Materials WHERE MaterialID = ?", inserted.MaterialID)
            material_row = await cursor.fetchone()
            if not material_row:
                raise HTTPException(status_code=404, detail="Material not found")

            material_name = material_row.MaterialName

            # update stock
            await cursor.execute("""
                UPDATE Materials SET MaterialQuantity = MaterialQuantity + ? WHERE MaterialID = ?
            """, batch.quantity, batch.material_id)

            await conn.commit()

            return MaterialBatchOut(
                batch_id=inserted.BatchID,
                material_id=inserted.MaterialID,
                material_name=material_name,
                quantity=inserted.Quantity,
                unit=inserted.Unit,
                batch_date=inserted.BatchDate,
                restock_date=inserted.RestockDate,
                logged_by=inserted.LoggedBy,
                notes=inserted.Notes,
                status=inserted.Status,
            )
    finally:
        await conn.close()

# get all batches
@router.get("/", response_model=List[MaterialBatchOut])
async def get_all_material_batches(token: str = Depends(oauth2_scheme)):
    await validate_token_and_roles(token, ["admin", "manager", "staff"])
    conn = await get_db_connection()
    try:
        async with conn.cursor() as cursor:
            await cursor.execute("""
                SELECT 
                    ib.BatchID,
                    ib.MaterialID,
                    i.MaterialName,
                    ib.Quantity,
                    ib.Unit,
                    ib.BatchDate,
                    ib.RestockDate,
                    ib.LoggedBy,
                    ib.Notes,
                    ib.Status
                FROM MaterialBatches ib
                JOIN Materials i ON ib.MaterialID = i.MaterialID
            """)
            rows = await cursor.fetchall()

            for row in rows:
                new_status = "Used" if row.Quantity == 0 else "Available"
                if new_status != row.Status:
                    await cursor.execute("""
                        UPDATE MaterialBatches SET Status = ? WHERE BatchID = ?
                    """, new_status, row.BatchID)
                    row.Status = new_status

            await conn.commit()

            return [
                MaterialBatchOut(
                    batch_id=row.BatchID,
                    material_id=row.MaterialID,
                    material_name=row.MaterialName,
                    quantity=row.Quantity,
                    unit=row.Unit,
                    batch_date=row.BatchDate,
                    restock_date=row.RestockDate,
                    logged_by=row.LoggedBy,
                    notes=row.Notes,
                    status=row.Status,
                ) for row in rows
            ]
    finally:
        await conn.close()

# get all batches by id
@router.get("/{material_id}", response_model=List[MaterialBatchOut])
async def get_batches(material_id: int, token: str = Depends(oauth2_scheme)):
    await validate_token_and_roles(token, ["admin", "manager", "staff"])
    conn = await get_db_connection()
    try:
        async with conn.cursor() as cursor:
            await cursor.execute("""
                SELECT BatchID, MaterialID, Quantity, Unit, BatchDate, RestockDate, LoggedBy, Notes, Status
                FROM MaterialBatches WHERE MaterialID = ?
            """, material_id)
            rows = await cursor.fetchall()

            # auto-update status if used
            for row in rows:
                new_status = row.Status
                if row.Quantity == 0:
                    new_status = "Used"
                else:
                    new_status = "Available"
                # only update if status actually changed
                if new_status != row.Status:
                    await cursor.execute("""
                        UPDATE MaterialBatches SET Status = ? WHERE BatchID = ?
                    """, new_status, row.BatchID)
                    row.Status = new_status  # reflect in output

            await conn.commit()
            
            return [
                MaterialBatchOut(
                    batch_id=row.BatchID,
                    material_id=row.MaterialID,
                    material_name=row.MaterialName,
                    quantity=row.Quantity,
                    unit=row.Unit,
                    batch_date=row.BatchDate,
                    restock_date=row.RestockDate,
                    logged_by=row.LoggedBy,
                    notes=row.Notes,
                    status=row.Status,
                ) for row in rows
            ]
    finally:
        await conn.close()

# update restock
@router.put("/{batch_id}", response_model=MaterialBatchOut)
async def update_batch(batch_id: int, data: MaterialBatchUpdate, token: str = Depends(oauth2_scheme)):
    await validate_token_and_roles(token, ["admin", "manager", "staff"])
    conn = await get_db_connection()
    try:
        async with conn.cursor() as cursor:
            # get old data
            await cursor.execute("SELECT Quantity, MaterialID FROM MaterialBatches WHERE BatchID = ?", batch_id)
            old = await cursor.fetchone()
            if not old:
                raise HTTPException(status_code=404, detail="Batch not found")
            updates, values = [], []
            map_col = {
                "quantity": "Quantity",
                "unit": "Unit",
                "batch_date": "BatchDate",
                "logged_by": "LoggedBy",
                "notes": "Notes"
            }
            for k, v in data.dict(exclude_unset=True).items():
                updates.append(f"{map_col[k]} = ?")
                values.append(v)
            if not updates:
                raise HTTPException(status_code=400, detail="Nothing to update")
            values.append(batch_id)
            await cursor.execute(f"UPDATE MaterialBatches SET {', '.join(updates)} WHERE BatchID = ?", *values)
            if "quantity" in data.dict(exclude_unset=True):
                diff = float(data.quantity) - float(old.Quantity)
                await cursor.execute("UPDATE Materials SET MaterialQuantity = MaterialQuantity + ? WHERE MaterialID = ?", diff, old.MaterialID)
            await cursor.execute("""
                SELECT BatchID, MaterialID, Quantity, Unit, BatchDate, RestockDate, LoggedBy, Notes, Status
                FROM MaterialBatches WHERE BatchID = ?
            """, batch_id)
            updated = await cursor.fetchone()
            if not updated:
                raise HTTPException(status_code=404, detail="Batch not found after update.")
            
            # update status if needed
            new_status = updated.Status
            if updated.Quantity == 0:
                new_status = "Used"
            else:
                new_status = "Available"
            if new_status != updated.Status:
                await cursor.execute(
                    "UPDATE MaterialBatches SET Status = ? WHERE BatchID = ?",
                    new_status, batch_id
                )
                updated.Status = new_status
                        
            await conn.commit()
            return MaterialBatchOut(
                batch_id=updated.BatchID,
                material_id=updated.MaterialID,
                quantity=updated.Quantity,
                unit=updated.Unit,
                batch_date=updated.BatchDate,
                restock_date=updated.RestockDate,
                logged_by=updated.LoggedBy,
                notes=updated.Notes,
                status=updated.Status,
            )
    finally:
        await conn.close()