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
router = APIRouter(prefix="/merchandise-batches", tags=["merchandise batches"])

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

class MerchandiseBatchCreate(BaseModel):
    merchandise_id: int
    quantity: float
    unit: str
    batch_date: date
    logged_by: str
    notes: Optional[str] = None

class MerchandiseBatchUpdate(BaseModel):
    quantity: Optional[float]
    unit: Optional[str]
    batch_date: Optional[date]
    logged_by: Optional[str]
    notes: Optional[str]

class MerchandiseBatchOut(BaseModel):
    batch_id: int
    merchandise_id: int
    merchandise_name: str
    quantity: float
    unit: str
    batch_date: date
    restock_date: datetime
    logged_by: str
    notes: Optional[str]
    status: str

# restock merchandise
@router.post("/", response_model=MerchandiseBatchOut)
async def create_batch(batch: MerchandiseBatchCreate, token: str = Depends(oauth2_scheme)):
    await validate_token_and_roles(token, ["admin", "manager", "staff"])
    conn = await get_db_connection()
    try:
        async with conn.cursor() as cursor:
            status = "Available"
            if batch.quantity == 0:
                status = "Used"
            # insert batch
            await cursor.execute("""
                INSERT INTO MerchandiseBatches 
                (MerchandiseID, Quantity, Unit, BatchDate, RestockDate, LoggedBy, Notes, Status)
                OUTPUT 
                    INSERTED.BatchID,
                    INSERTED.MerchandiseID,
                    INSERTED.Quantity,
                    INSERTED.Unit,
                    INSERTED.BatchDate,
                    INSERTED.RestockDate,
                    INSERTED.LoggedBy,
                    INSERTED.Notes,
                    INSERTED.Status
                VALUES (?, ?, ?, ?, GETDATE(), ?, ?, ?)
            """, batch.merchandise_id, batch.quantity, batch.unit, batch.batch_date, batch.logged_by, batch.notes, status)
            inserted = await cursor.fetchone()
            if not inserted:
                raise HTTPException(status_code=500, detail="Batch insert failed.")

            # fetch merchandise name
            await cursor.execute("SELECT MerchandiseName FROM Merchandise WHERE MerchandiseID = ?", inserted.MerchandiseID)
            merchandise_row = await cursor.fetchone()
            if not merchandise_row:
                raise HTTPException(status_code=404, detail="Merchandise not found")

            merchandise_name = merchandise_row.MerchandiseName

            await cursor.execute("""
                UPDATE Merchandise SET MerchandiseQuantity = MerchandiseQuantity + ? WHERE MerchandiseID = ?
            """, batch.quantity, batch.merchandise_id)
            await conn.commit()
            return MerchandiseBatchOut(
                batch_id=inserted.BatchID,
                merchandise_id=inserted.MerchandiseID,
                merchandise_name=merchandise_name,
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
@router.get("/", response_model=List[MerchandiseBatchOut])
async def get_all_merchandise_batches(token: str = Depends(oauth2_scheme)):
    await validate_token_and_roles(token, ["admin", "manager", "staff"])
    conn = await get_db_connection()
    try:
        async with conn.cursor() as cursor:
            await cursor.execute("""
                SELECT 
                    ib.BatchID,
                    ib.MerchandiseID,
                    i.MerchandiseName,
                    ib.Quantity,
                    ib.Unit,
                    ib.BatchDate,
                    ib.RestockDate,
                    ib.LoggedBy,
                    ib.Notes,
                    ib.Status
                FROM MerchandiseBatches ib
                JOIN Merchandise i ON ib.MerchandiseID = i.MerchandiseID
            """)
            rows = await cursor.fetchall()

            for row in rows:
                new_status = "Used" if row.Quantity == 0 else "Available"
                if new_status != row.Status:
                    await cursor.execute("""
                        UPDATE MerchandiseBatches SET Status = ? WHERE BatchID = ?
                    """, new_status, row.BatchID)
                    row.Status = new_status

            await conn.commit()

            return [
                MerchandiseBatchOut(
                    batch_id=row.BatchID,
                    merchandise_id=row.MerchandiseID,
                    merchandise_name=row.MerchandiseName,
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
@router.get("/{merchandise_id}", response_model=List[MerchandiseBatchOut])
async def get_batches(merchandise_id: int, token: str = Depends(oauth2_scheme)):
    await validate_token_and_roles(token, ["admin", "manager", "staff"])
    conn = await get_db_connection()
    try:
        async with conn.cursor() as cursor:
            await cursor.execute("""
                SELECT BatchID, MerchandiseID, Quantity, Unit, BatchDate, RestockDate, LoggedBy, Notes, Status
                FROM MerchandiseBatches WHERE MerchandiseID = ?
            """, merchandise_id)
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
                        UPDATE MerchandiseBatches SET Status = ? WHERE BatchID = ?
                    """, new_status, row.BatchID)
                    row.Status = new_status  # reflect in output

            return [
                MerchandiseBatchOut(
                    batch_id=row.BatchID,
                    merchandise_id=row.MerchandiseID,
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
@router.put("/{batch_id}", response_model=MerchandiseBatchOut)
async def update_batch(batch_id: int, data: MerchandiseBatchUpdate, token: str = Depends(oauth2_scheme)):
    await validate_token_and_roles(token, ["admin", "manager", "staff"])
    conn = await get_db_connection()
    try:
        async with conn.cursor() as cursor:
            await cursor.execute("SELECT Quantity, MerchandiseID FROM MerchandiseBatches WHERE BatchID = ?", batch_id)
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
            await cursor.execute(f"UPDATE MerchandiseBatches SET {', '.join(updates)} WHERE BatchID = ?", *values)
            if "quantity" in data.dict(exclude_unset=True):
                diff = float(data.quantity) - float(old.Quantity)
                await cursor.execute("UPDATE Merchandise SET MerchandiseQuantity = MerchandiseQuantity + ? WHERE MerchandiseID = ?", diff, old.MerchandiseID)
            await cursor.execute("""
                SELECT BatchID, MerchandiseID, Quantity, Unit, BatchDate, RestockDate, LoggedBy, Notes, Status
                FROM MerchandiseBatches WHERE BatchID = ?
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
                    "UPDATE MerchandiseBatches SET Status = ? WHERE BatchID = ?",
                    new_status, batch_id
                )
                updated.Status = new_status

            await conn.commit()
            return MerchandiseBatchOut(
                batch_id=updated.BatchID,
                merchandise_id=updated.MerchandiseID,
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