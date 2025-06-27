from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import date, datetime
import httpx
from database import get_db_connection
import logging

# configure logging
logger = logging.getLogger(__name__)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="http://localhost:4000/auth/token")
router = APIRouter(prefix="/ingredient-batches", tags=["ingredient batches"])

# auth validation
async def validate_token_and_roles(token: str, allowed_roles: List[str]):
    USER_SERVICE_ME_URL = "http://localhost:4000/auth/users/me"
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(USER_SERVICE_ME_URL, headers={"Authorization": f"Bearer {token}"})
            response.raise_for_status()
        except httpx.HTTPStatusError as e:
            error_detail = f"Auth service error: {e.response.status_code}"
            try: error_detail += f" - {e.response.json().get('detail', e.response.text)}"
            except: error_detail += f" - {e.response.text}"
            logger.error(error_detail)
            raise HTTPException(status_code=e.response.status_code, detail=error_detail)
        except httpx.RequestError as e:
            logger.error(f"Auth service unavailable: {e}")
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=f"Auth service unavailable: {e}")

    user_data = response.json()
    user_role = user_data.get("userRole")
    if user_role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied. Required role not met. User has role: '{user_role}'"
        )
    
class IngredientBatchCreate(BaseModel):
    ingredient_id: int
    quantity: float
    unit: str
    batch_date: date
    expiration_date: date
    logged_by: str
    notes: Optional[str] = None

class IngredientBatchUpdate(BaseModel):
    quantity: Optional[float]
    unit: Optional[str]
    batch_date: Optional[date]
    expiration_date: Optional[date]
    logged_by: Optional[str]
    notes: Optional[str]

class IngredientBatchOut(BaseModel):
    batch_id: int
    ingredient_id: int
    ingredient_name: str
    quantity: float
    unit: str
    batch_date: date
    expiration_date: date
    restock_date: datetime
    logged_by: str
    notes: Optional[str]
    status: str

# restock ingredients
@router.post("/", response_model=IngredientBatchOut)
async def create_batch(batch: IngredientBatchCreate, token: str = Depends(oauth2_scheme)):
    await validate_token_and_roles(token, ["admin", "manager", "staff"])
    conn = await get_db_connection()
    try:
        async with conn.cursor() as cursor:
            status = "Available"
            if batch.expiration_date <= date.today():
                status = "Expired"
            elif batch.quantity == 0:
                status = "Used"

            # insert batch
            await cursor.execute("""
                INSERT INTO IngredientBatches 
                (IngredientID, Quantity, Unit, BatchDate, ExpirationDate, RestockDate, LoggedBy, Notes, Status)
                OUTPUT INSERTED.*
                VALUES (?, ?, ?, ?, ?, GETDATE(), ?, ?, ?)
            """, batch.ingredient_id, batch.quantity, batch.unit,
                 batch.batch_date, batch.expiration_date, batch.logged_by, batch.notes, status)

            inserted = await cursor.fetchone()
            if not inserted:
                raise HTTPException(status_code=500, detail="Batch insert failed.")
            
            # fetch ingredient name
            await cursor.execute("SELECT IngredientName FROM Ingredients WHERE IngredientID = ?", inserted.IngredientID)
            ingredient_row = await cursor.fetchone()
            if not ingredient_row:
                raise HTTPException(status_code=404, detail="Ingredient not found")

            ingredient_name = ingredient_row.IngredientName


            # update stock
            await cursor.execute("""
                UPDATE Ingredients SET Amount = Amount + ? WHERE IngredientID = ?
            """, batch.quantity, batch.ingredient_id)

            await conn.commit()

            return IngredientBatchOut(
                batch_id=inserted.BatchID,
                ingredient_id=inserted.IngredientID,
                ingredient_name=ingredient_name, 
                quantity=inserted.Quantity,
                unit=inserted.Unit,
                batch_date=inserted.BatchDate,
                expiration_date=inserted.ExpirationDate,
                restock_date=inserted.RestockDate,
                logged_by=inserted.LoggedBy,
                notes=inserted.Notes,
                status=inserted.Status,
            )
    finally:
        await conn.close()

# get all batches
@router.get("/", response_model=List[IngredientBatchOut])
async def get_all_batches(token: str = Depends(oauth2_scheme)):
    await validate_token_and_roles(token, ["admin", "manager", "staff"])
    conn = await get_db_connection()
    try:
        async with conn.cursor() as cursor:
            await cursor.execute("""
                SELECT 
                    ib.BatchID,
                    ib.IngredientID,
                    i.IngredientName,
                    ib.Quantity,
                    ib.Unit,
                    ib.BatchDate,
                    ib.ExpirationDate,
                    ib.RestockDate,
                    ib.LoggedBy,
                    ib.Notes,
                    ib.Status
                FROM IngredientBatches ib
                JOIN Ingredients i ON ib.IngredientID = i.IngredientID
            """)

            rows = await cursor.fetchall()

            # auto-update status if expired or used
            now = datetime.now()
            for row in rows:
                new_status = row.Status
                if row.Quantity == 0:
                    new_status = "Used"
                elif row.ExpirationDate and row.ExpirationDate < now.date():
                    new_status = "Expired"

                # only update if status actually changed
                if new_status != row.Status:
                    await cursor.execute("""
                        UPDATE IngredientBatches SET Status = ? WHERE BatchID = ?
                    """, new_status, row.BatchID)
                    row.Status = new_status # reflect in output

            await conn.commit()

            return [
                IngredientBatchOut(
                    batch_id=row.BatchID,
                    ingredient_id=row.IngredientID,
                    ingredient_name=row.IngredientName,
                    quantity=row.Quantity,
                    unit=row.Unit,
                    batch_date=row.BatchDate,
                    expiration_date=row.ExpirationDate,
                    restock_date=row.RestockDate,
                    logged_by=row.LoggedBy,
                    notes=row.Notes,
                    status=row.Status,
                ) for row in rows
            ]
    finally:
        await conn.close()

# get all batches by id
@router.get("/{ingredient_id}", response_model=List[IngredientBatchOut])
async def get_batches_for_ingredient(ingredient_id: int, token: str = Depends(oauth2_scheme)):
    await validate_token_and_roles(token, ["admin", "manager", "staff"])
    conn = await get_db_connection()
    try:
        async with conn.cursor() as cursor:
            await cursor.execute("""
                SELECT BatchID, IngredientID, Quantity, Unit, BatchDate, ExpirationDate, RestockDate, LoggedBy, Notes, Status
                FROM IngredientBatches
                WHERE IngredientID = ?
            """, ingredient_id)

            rows = await cursor.fetchall()

            # auto-update status if expired or used
            now = datetime.now()
            for row in rows:
                new_status = row.Status
                if row.Quantity == 0:
                    new_status = "Used"
                elif row.ExpirationDate and row.ExpirationDate < now.date():
                    new_status = "Expired"
                
                # only update if status actually changed
                if new_status != row.Status:
                    await cursor.execute("""
                        UPDATE IngredientBatches SET Status = ? WHERE BatchID = ?
                    """, new_status, row.BatchID)
                    row.Status = new_status  # reflect in output

            await conn.commit()

            return [
                IngredientBatchOut(
                    batch_id=row.BatchID,
                    ingredient_id=row.IngredientID,
                    quantity=row.Quantity,
                    unit=row.Unit,
                    batch_date=row.BatchDate,
                    expiration_date=row.ExpirationDate,
                    restock_date=row.RestockDate,
                    logged_by=row.LoggedBy,
                    notes=row.Notes,
                    status=row.Status,
                ) for row in rows
            ]
    finally:
        await conn.close()

# update restock
@router.put("/{batch_id}", response_model=IngredientBatchOut)
async def update_batch(batch_id: int, data: IngredientBatchUpdate, token: str = Depends(oauth2_scheme)):
    await validate_token_and_roles(token, ["admin", "manager", "staff"])
    conn = await get_db_connection()
    try:
        async with conn.cursor() as cursor:
            # get old data
            await cursor.execute("SELECT Quantity, IngredientID FROM IngredientBatches WHERE BatchID = ?", batch_id)
            old_row = await cursor.fetchone()
            if not old_row:
                raise HTTPException(status_code=404, detail="Batch not found.")
            old_quantity = float(old_row.Quantity)
            ingredient_id = old_row.IngredientID

            updates = []
            values = []

            field_to_column = {
                "quantity": "Quantity",
                "unit": "Unit",
                "batch_date": "BatchDate",
                "expiration_date": "ExpirationDate",
                "logged_by": "LoggedBy",
                "notes": "Notes"
            }

            for key, value in data.dict(exclude_unset=True).items():
                column = field_to_column.get(key)
                if column:
                    updates.append(f"{column} = ?")
                    values.append(value)

            if not updates:
                raise HTTPException(status_code=400, detail="No fields to update.")

            values.append(batch_id)

            # perform update
            await cursor.execute(f"""
                UPDATE IngredientBatches SET {', '.join(updates)} WHERE BatchID = ?
            """, *values)

            # sync total stock if quantity changed
            if "quantity" in data.dict(exclude_unset=True):
                diff = float(data.quantity) - old_quantity
                await cursor.execute("""
                    UPDATE Ingredients SET Amount = Amount + ? WHERE IngredientID = ?
                """, diff, ingredient_id)

            # re-fetch and apply status rules
            await cursor.execute("SELECT * FROM IngredientBatches WHERE BatchID = ?", batch_id)
            row = await cursor.fetchone()
            new_status = row.Status  # default
            if row.ExpirationDate <= date.today():
                new_status = "Expired"
            elif row.Quantity == 0:
                new_status = "Used"
            else:
                new_status = "Available"

            # update status if needed
            await cursor.execute(
                "UPDATE IngredientBatches SET Status = ? WHERE BatchID = ?",
                new_status, batch_id
            )

            await conn.commit()

            return IngredientBatchOut(
                batch_id=row.BatchID,
                ingredient_id=row.IngredientID,
                quantity=row.Quantity,
                unit=row.Unit,
                batch_date=row.BatchDate,
                expiration_date=row.ExpirationDate,
                restock_date=row.RestockDate,
                logged_by=row.LoggedBy,
                notes=row.Notes,
                status=new_status,
            )
    finally:
        await conn.close()