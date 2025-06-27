from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from typing import List, Dict, Any, Optional, Literal
from datetime import datetime
import httpx
from database import get_db_connection
import logging

# configure logging
logger = logging.getLogger(__name__)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="http://localhost:4000/auth/token")
router = APIRouter(prefix="/wastelogs", tags=["waste logs"])

# auth validation
async def validate_token_and_roles(token: str, allowed_roles: List[str]):
    USER_SERVICE_ME_URL = "http://localhost:4000/auth/users/me"
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(USER_SERVICE_ME_URL, headers={"Authorization": f"Bearer {token}"})
            response.raise_for_status()
        except httpx.HTTPStatusError as e:
            error_detail = f"Waste Auth service error: {e.response.status_code}"
            try: error_detail += f" - {e.response.json().get('detail', e.response.text)}"
            except: error_detail += f" - {e.response.text}"
            logger.error(error_detail)
            raise HTTPException(status_code=e.response.status_code, detail=error_detail)
        except httpx.RequestError as e:
            logger.error(f"Waste Auth service unavailable: {e}")
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=f"Waste Auth service unavailable: {e}")

    user_data = response.json()
    user_role = user_data.get("userRole")
    if user_role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied. Required role not met. User has role: '{user_role}'"
        )

class WasteCreate(BaseModel):
    item_type: Literal["ingredient", "material", "merchandise"]
    item_id: int
    amount: float
    unit: str
    waste_reason: str
    logged_by: str
    notes: Optional[str] = None

class WasteOut(BaseModel):
    WasteID: int
    ItemType: str
    ItemID: int
    BatchID: Optional[int]
    Amount: float
    Unit: str
    WasteReason: str
    WasteDate: datetime
    LoggedBy: str
    Notes: Optional[str]

# log waste
@router.post("/", response_model=List[WasteOut])
async def log_waste(waste: WasteCreate, token: str = Depends(oauth2_scheme)):
    await validate_token_and_roles(token, ["admin", "manager", "staff"])
    conn = await get_db_connection()
    results = []
    try:
        async with conn.cursor() as cursor:
            table_map = {
                "ingredient": ("Ingredients", "IngredientID", "Amount", "IngredientBatches", "BatchID"),
                "material": ("Materials", "MaterialID", "MaterialQuantity", "MaterialBatches", "BatchID"),
                "merchandise": ("Merchandise", "MerchandiseID", "MerchandiseQuantity", "MerchandiseBatches", "BatchID")
            }

            if waste.item_type not in table_map:
                raise HTTPException(status_code=400, detail="Invalid item_type.")

            main_table, id_col, qty_col, batch_table, batch_id_col = table_map[waste.item_type]

            # deduct from main stock
            await cursor.execute(
                f"UPDATE {main_table} SET {qty_col} = {qty_col} - ? WHERE {id_col} = ?",
                (waste.amount, waste.item_id)
            )

            # FIFO deduction from batches
            remaining = waste.amount
            await cursor.execute(
                f"""
                SELECT {batch_id_col}, Quantity 
                FROM {batch_table} 
                WHERE {id_col} = ? AND Quantity > 0 
                ORDER BY RestockDate ASC
                """,
                (waste.item_id,)
            )
            batches = await cursor.fetchall()
            for batch in batches:
                if remaining <= 0:
                    break

                batch_id = getattr(batch, batch_id_col)
                batch_qty = float(batch.Quantity)
                to_deduct = min(remaining, batch_qty)

                # deduct from batch
                await cursor.execute(
                    f"UPDATE {batch_table} SET Quantity = Quantity - ? WHERE {batch_id_col} = ?",
                    (to_deduct, batch_id)
                )

                # log waste for this batch
                await cursor.execute("""
                    INSERT INTO WasteManagement (
                        ItemType, ItemID, BatchID, Amount, Unit, WasteReason, WasteDate, LoggedBy, Notes
                    )
                    OUTPUT INSERTED.*
                    VALUES (?, ?, ?, ?, ?, ?, GETDATE(), ?, ?)
                """, (waste.item_type, waste.item_id, batch_id, to_deduct, waste.unit, waste.waste_reason, waste.logged_by, waste.notes))

                log = await cursor.fetchone()
                results.append(WasteOut(
                    WasteID=log.WasteID,
                    ItemType=log.ItemType,
                    ItemID=log.ItemID,
                    BatchID=log.BatchID,
                    Amount=log.Amount,
                    Unit=log.Unit,
                    WasteReason=log.WasteReason,
                    WasteDate=log.WasteDate,
                    LoggedBy=log.LoggedBy,
                    Notes=log.Notes,
                ))

                remaining -= to_deduct

            # f there are no batches or waste not fully covered by batches, log the leftover waste (no batch_id)
            if remaining > 0:
                await cursor.execute("""
                    INSERT INTO WasteManagement (
                        ItemType, ItemID, BatchID, Amount, Unit, WasteReason, WasteDate, LoggedBy, Notes
                    )
                    OUTPUT INSERTED.*
                    VALUES (?, ?, NULL, ?, ?, ?, GETDATE(), ?, ?)
                """, (waste.item_type, waste.item_id, remaining, waste.unit, waste.waste_reason, waste.logged_by, waste.notes))

                log = await cursor.fetchone()
                results.append(WasteOut(
                    WasteID=log.WasteID,
                    ItemType=log.ItemType,
                    ItemID=log.ItemID,
                    BatchID=None,
                    Amount=log.Amount,
                    Unit=log.Unit,
                    WasteReason=log.WasteReason,
                    WasteDate=log.WasteDate,
                    LoggedBy=log.LoggedBy,
                    Notes=log.Notes,
                ))

            await conn.commit()
            return results

    finally:
        await conn.close()

# get all waste logs
@router.get("/", response_model=List[WasteOut])
async def get_all_wastes(token: str = Depends(oauth2_scheme)):
    await validate_token_and_roles(token, ["admin", "manager", "staff"])
    conn = await get_db_connection()
    try:
        async with conn.cursor() as cursor:
            await cursor.execute("SELECT * FROM WasteManagement ORDER BY WasteDate DESC")
            logs = await cursor.fetchall()
            return [
                WasteOut(
                    WasteID=log.WasteID,
                    ItemType=log.ItemType,
                    ItemID=log.ItemID,
                    BatchID=log.BatchID,
                    Amount=log.Amount,
                    Unit=log.Unit,
                    WasteReason=log.WasteReason,
                    WasteDate=log.WasteDate,
                    LoggedBy=log.LoggedBy,
                    Notes=log.Notes,
                )
                for log in logs
            ]
    finally:
        await conn.close()
