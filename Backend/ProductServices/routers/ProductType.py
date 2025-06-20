from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import httpx
from pydantic import BaseModel
from database import get_db_connection 

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="http://localhost:4000/auth/token") 
router = APIRouter()

# models
class ProductTypeCreateRequest(BaseModel):
    productTypeName: str
    SizeRequired: int 

class ProductTypeUpdateRequest(BaseModel):
    productTypeName: str
    SizeRequired: int 

# auth check
async def verify_admin(token: str = Depends(oauth2_scheme)):
    USER_SERVICE_ME_URL = "http://localhost:4000/auth/users/me" 
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                USER_SERVICE_ME_URL,
                headers={"Authorization": f"Bearer {token}"}
            )
            response.raise_for_status() 
        except httpx.HTTPStatusError as e:
            print(f"Auth service error: {e.response.status_code} - {e.response.text}")
            detail = "Invalid or expired token"
            if e.response.status_code == 401:
                detail = "Authentication failed: Invalid or expired token."
            elif e.response.status_code == 403:
                detail = "Authentication failed: Insufficient permissions."
            else:
                detail = f"Authentication service error: {e.response.status_code}"
            raise HTTPException(status_code=e.response.status_code, detail=detail)
        except httpx.RequestError as e:
            print(f"Auth service request error: {e}")
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Authentication service is unavailable.")

    user_data = response.json()
    if user_data.get('userRole') != 'manager':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied: manager role required.")
    return user_data


# create product type
@router.post("/create")
async def create_product_type(
    request: ProductTypeCreateRequest,
    admin_user: dict = Depends(verify_admin)
):
    conn = await get_db_connection()
    cursor = await conn.cursor()
    new_product_type_id = None
    try:
        await cursor.execute("""
            SELECT 1 FROM ProductType
            WHERE productTypeName COLLATE Latin1_General_CI_AS = ?
        """, request.productTypeName)
        if await cursor.fetchone():
            raise HTTPException(status_code=400, detail="Product type name already exists.")

        sql_insert = """
        INSERT INTO ProductType (productTypeName, SizeRequired)
        OUTPUT INSERTED.productTypeID 
        VALUES (?, ?);
        """
        await cursor.execute(sql_insert, request.productTypeName, request.SizeRequired)
        id_row = await cursor.fetchone()
        
        if id_row and id_row[0] is not None:
            new_product_type_id = int(id_row[0])
        else:
            await conn.rollback()
            raise HTTPException(status_code=500, detail="Failed to retrieve ID after insert.")

        await conn.commit()
        print(f"Product type '{request.productTypeName}' (ID: {new_product_type_id}) created successfully.")

    except Exception as e:
        await conn.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to save to DB: {str(e)}")
    finally:
        if cursor: await cursor.close()
        if conn: await conn.close()

    return {
        "message": "Product type created successfully.",
        "productTypeID": new_product_type_id,
        "productTypeName": request.productTypeName,
        "SizeRequired": request.SizeRequired
    }

# get product type
@router.get("/")
async def get_product_types(_: str = Depends(oauth2_scheme)):
    conn = await get_db_connection()
    cursor = await conn.cursor()
    try:
        await cursor.execute("SELECT productTypeID, productTypeName, SizeRequired FROM ProductType ORDER BY productTypeName")
        rows = await cursor.fetchall()
        return [
            {"productTypeID": row[0], "productTypeName": row[1], "SizeRequired": int(row[2]) if row[2] is not None else 0}
            for row in rows
        ]
    finally:
        if cursor:
            await cursor.close()
        if conn:
            await conn.close()

# edit product type
@router.put("/{product_type_id}")
async def update_product_type(
    product_type_id: int,
    request: ProductTypeUpdateRequest,
    admin_user: dict = Depends(verify_admin),
    token: str = Depends(oauth2_scheme)
):
    conn = await get_db_connection()
    cursor = await conn.cursor()
    local_update_success = False
    try:
        await cursor.execute("SELECT 1 FROM ProductType WHERE productTypeID = ?", (product_type_id,))
        if not await cursor.fetchone():
            raise HTTPException(status_code=404, detail="Product type not found in primary service (8001) for update.")

        await cursor.execute("""
            SELECT 1 FROM ProductType
            WHERE productTypeName COLLATE Latin1_General_CI_AS = ? AND productTypeID != ?
        """, (request.productTypeName, product_type_id))
        if await cursor.fetchone():
            raise HTTPException(status_code=400, detail="Product type name already exists for another type.")

        await cursor.execute(
            "UPDATE ProductType SET productTypeName = ?, SizeRequired = ? WHERE productTypeID = ?",
            (request.productTypeName, request.SizeRequired, product_type_id)
        )
        if cursor.rowcount == 0:
             raise HTTPException(status_code=404, detail="Product type not found during update execution or no changes were made.")
        
        await conn.commit()
        local_update_success = True
        print(f"Product type ID {product_type_id} updated to '{request.productTypeName}', SizeRequired: {request.SizeRequired} in primary service (8001)")
    
    except HTTPException:
        raise 
    except Exception as e:
        try:
            await conn.rollback()
        except Exception as rb_exc:
            print(f"Rollback failed during update exception: {rb_exc}")
        print(f"Error updating in primary service (8001) for ID {product_type_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update in primary DB: {str(e)}")
    finally:
        if cursor:
            await cursor.close()
        if conn:
            await conn.close()

    sync_message_update = ""
    # send to POS
    if local_update_success:
        SECONDARY_SERVICE_UPDATE_URL = f"http://localhost:9001/ProductType/{product_type_id}"
        async with httpx.AsyncClient() as client_to_9001:
            try:
                payload_to_9001 = {
                    "productTypeName": request.productTypeName,
                    "SizeRequired": request.SizeRequired
                }
                headers_to_9001 = {"Authorization": f"Bearer {token}"}
                
                print(f"Attempting to sync update to POS (port 9001) for ID {product_type_id}: {payload_to_9001}")
                response_from_9001 = await client_to_9001.put(
                    SECONDARY_SERVICE_UPDATE_URL,
                    json=payload_to_9001,
                    headers=headers_to_9001
                )
                response_from_9001.raise_for_status()
                sync_message_update = f"Product type update also synced to POS (9001) for ID {product_type_id}."
                print(sync_message_update)
            except httpx.HTTPStatusError as e_sync:
                sync_message_update = f"HTTP error syncing update to POS (9001) for ID {product_type_id}: {e_sync.response.status_code} - {e_sync.response.text}"
                print(sync_message_update)
            except httpx.RequestError as e_req:
                sync_message_update = f"Request error syncing update to POS (9001) for ID {product_type_id}: {str(e_req)}"
                print(sync_message_update)
            except Exception as e_gen:
                sync_message_update = f"An unexpected error occurred during update sync to POS (9001) for ID {product_type_id}: {str(e_gen)}"
                print(sync_message_update)
    
    return {"message": f"Product type updated successfully in primary service (8001). {sync_message_update}".strip()}

# delete
@router.delete("/{product_type_id}")
async def delete_product_type(
    product_type_id: int,
    admin_user: dict = Depends(verify_admin),
    token: str = Depends(oauth2_scheme)
):
    conn = await get_db_connection()
    cursor = await conn.cursor()
    local_delete_success = False
    try:
        await cursor.execute("SELECT 1 FROM ProductType WHERE productTypeID = ?", (product_type_id,))
        if not await cursor.fetchone():
            raise HTTPException(status_code=404, detail="Product type not found in primary service (8001) for deletion.")

        await cursor.execute("DELETE FROM ProductType WHERE productTypeID = ?", (product_type_id,))
        if cursor.rowcount == 0: 
            raise HTTPException(status_code=404, detail="Product type not found during delete execution, though it existed moments ago.")
        
        await conn.commit()
        local_delete_success = True
        print(f"Product type ID {product_type_id} deleted successfully from primary service (8001)")
    except HTTPException:
        raise 
    except Exception as e:
        try:
            await conn.rollback()
        except Exception as rb_exc:
            print(f"Rollback failed during delete exception: {rb_exc}")
        
        if "FOREIGN KEY constraint" in str(e) or "constraint failed" in str(e).lower():
             print(f"Error deleting from primary service (8001) for ID {product_type_id}: FK constraint - {e}")
             raise HTTPException(status_code=409, detail=f"Cannot delete product type: It is currently in use by one or more products.")
        print(f"Error deleting from primary service (8001) for ID {product_type_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete from primary DB: {str(e)}")
    finally:
        if cursor:
            await cursor.close()
        if conn:
            await conn.close()

    sync_message_delete = ""
    # send to POS
    if local_delete_success:
        SECONDARY_SERVICE_DELETE_URL = f"http://localhost:9001/ProductType/{product_type_id}"
        async with httpx.AsyncClient() as client_to_9001:
            try:
                headers_to_9001 = {"Authorization": f"Bearer {token}"}
                print(f"Attempting to sync delete to POS (port 9001) for ID {product_type_id}")
                response_from_9001 = await client_to_9001.delete(
                    SECONDARY_SERVICE_DELETE_URL,
                    headers=headers_to_9001
                )
                response_from_9001.raise_for_status()
                sync_message_delete = f"Product type delete also synced to POS (9001) for ID {product_type_id}."
                print(sync_message_delete)
            except httpx.HTTPStatusError as e_sync:
                sync_message_delete = f"HTTP error syncing delete to POS (9001) for ID {product_type_id}: {e_sync.response.status_code} - {e_sync.response.text}"
                if e_sync.response.status_code == 404:
                    sync_message_delete += " (POS reported not found, which might be acceptable)."
                print(sync_message_delete)
            except httpx.RequestError as e_req:
                sync_message_delete = f"Request error syncing delete to POS (9001) for ID {product_type_id}: {str(e_req)}"
                print(sync_message_delete)
            except Exception as e_gen:
                sync_message_delete = f"An unexpected error occurred during delete sync to POS (9001) for ID {product_type_id}: {str(e_gen)}"
                print(sync_message_delete)

    return {"message": f"Product type deleted successfully from primary service (8001). {sync_message_delete}".strip()}