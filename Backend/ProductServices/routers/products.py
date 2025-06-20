# is_products/main.py

from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import httpx
from database import get_db_connection
import os
from pathlib import Path
import uuid
import logging
import asyncio

logger = logging.getLogger(__name__)

# config
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="http://localhost:4000/auth/token")
router = APIRouter(prefix="/is_products", tags=["Products"])

# image storage config
ROUTER_BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIRECTORY_PHYSICAL = ROUTER_BASE_DIR / "static_files" / "product_images"
UPLOAD_DIRECTORY_PHYSICAL.mkdir(parents=True, exist_ok=True)
logger.info(f"IS: Physical image upload directory set to: {UPLOAD_DIRECTORY_PHYSICAL}")

IMAGE_DB_PATH_PREFIX = "/product_images"
IMAGE_URL_STATIC_PREFIX = "/static_files"
IS_EXTERNAL_BASE_URL = os.getenv("IS_EXTERNAL_URL", "http://localhost:8001")
logger.info(f"IS: External base URL for image links will be: {IS_EXTERNAL_BASE_URL}")

# models
class ProductOut(BaseModel):
    ProductID: int
    ProductName: str
    ProductTypeID: int
    ProductTypeName: str
    ProductCategory: str
    ProductDescription: Optional[str] = None
    ProductPrice: float
    ProductImage: Optional[str] = None
    ProductSizes: Optional[List[str]] = None
    ProductTypeSizeRequired: bool

class ProductSizeCreate(BaseModel):
    SizeName: str

class ProductSizeOut(BaseModel):
    SizeID: int
    ProductID: int
    SizeName: str

class ProductDetailWithStatusOut(BaseModel):
    ProductTypeName: str
    ProductCategory: str
    ProductName: str
    Description: Optional[str]
    Price: float
    Sizes: Optional[List[str]]
    Status: str  

# helper functions
async def validate_token_and_roles(token: str, allowed_roles: List[str]):
    USER_SERVICE_ME_URL = "http://localhost:4000/auth/users/me"
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(USER_SERVICE_ME_URL, headers={"Authorization": f"Bearer {token}"})
            response.raise_for_status()
        except httpx.HTTPStatusError as e:
            error_detail = f"IS Auth service error: {e.response.status_code} - {e.response.text}"
            logger.error(error_detail)
            raise HTTPException(status_code=e.response.status_code, detail=error_detail)
        except httpx.RequestError as e:
            logger.error(f"IS Auth service unavailable: {e}")
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=f"IS Auth service unavailable: {e}")

    user_data = response.json()
    if user_data.get("userRole") not in allowed_roles:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

def _construct_full_url_for_is_response(db_image_path: Optional[str]) -> Optional[str]:
    if db_image_path and db_image_path.startswith(IMAGE_DB_PATH_PREFIX):
        return f"{IS_EXTERNAL_BASE_URL}{IMAGE_URL_STATIC_PREFIX}{db_image_path}"
    return None

async def _get_product_type_details(conn, product_type_id: int) -> Optional[Dict[str, any]]:
    async with conn.cursor() as cursor_type:
        await cursor_type.execute("SELECT ProductTypeName, SizeRequired FROM ProductType WHERE ProductTypeID = ?", product_type_id)
        type_row = await cursor_type.fetchone()
        if type_row:
            return {"name": type_row.ProductTypeName, "size_required": bool(type_row.SizeRequired)}
        return None

# get all product details
@router.get("/products/details/", response_model=List[ProductDetailWithStatusOut], tags=["all product details"])
async def get_all_full_product_details(token: str = Depends(oauth2_scheme)):
    """
    Retrieves all products with a simplified 'Available' or 'Unavailable' status
    based on a direct database query of ingredient stock levels.
    """
    await validate_token_and_roles(token, ["admin", "manager", "staff", "cashier"])

    conn = await get_db_connection()
    try:
        async with conn.cursor() as cursor:
            await cursor.execute("""
                SELECT
                    p.ProductID,
                    p.ProductName,
                    p.ProductDescription,
                    p.ProductPrice,
                    p.ProductCategory,
                    pt.ProductTypeName,
                    CASE
                        WHEN EXISTS (
                            SELECT 1
                            FROM Recipes r
                            JOIN RecipeIngredients ri ON r.RecipeID = ri.RecipeID
                            JOIN Ingredients i ON ri.IngredientID = i.IngredientID
                            WHERE r.ProductID = p.ProductID AND i.Status != 'Available'
                        ) THEN 'Unavailable'
                        ELSE 'Available'
                    END AS Status
                FROM
                    Products p
                JOIN
                    ProductType pt ON p.ProductTypeID = pt.ProductTypeID
                ORDER BY
                    p.ProductName
            """)
            all_products_from_db = await cursor.fetchall()

            # get all sizes in a separate query for efficiency
            await cursor.execute("SELECT ProductID, SizeName FROM Size")
            all_sizes_from_db = await cursor.fetchall()

    except Exception as e:
        logger.error(f"Database error while fetching product details: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An error occurred while fetching product data.")
    finally:
        if conn: await conn.close()

    # lookup map for sizes
    sizes_by_product_id = {}
    for size in all_sizes_from_db:
        sizes_by_product_id.setdefault(size.ProductID, []).append(size.SizeName)

    # combine data into the final response model
    final_product_list = []
    for product in all_products_from_db:
        final_product_list.append(
            ProductDetailWithStatusOut(
                ProductTypeName=product.ProductTypeName,
                ProductCategory=product.ProductCategory,
                ProductName=product.ProductName,
                Description=product.ProductDescription,
                Price=float(product.ProductPrice),
                Sizes=sizes_by_product_id.get(product.ProductID),
                Status=product.Status
            )
        )

    return final_product_list

# get product details by id
@router.get("/products/{product_id}/details", response_model=ProductDetailWithStatusOut, tags=["product details by ID"])
async def get_full_product_details(product_id: int, token: str = Depends(oauth2_scheme)):
    """
    Retrieves a single product with a simplified 'Available' or 'Unavailable' status
    based on a direct database query.
    """
    await validate_token_and_roles(token, ["admin", "manager", "staff", "cashier"])

    conn = await get_db_connection()
    try:
        async with conn.cursor() as cursor:
            await cursor.execute("""
                SELECT
                    p.ProductName,
                    p.ProductDescription,
                    p.ProductPrice,
                    p.ProductCategory,
                    pt.ProductTypeName,
                    CASE
                        WHEN EXISTS (
                            SELECT 1
                            FROM Recipes r
                            JOIN RecipeIngredients ri ON r.RecipeID = ri.RecipeID
                            JOIN Ingredients i ON ri.IngredientID = i.IngredientID
                            WHERE r.ProductID = p.ProductID AND i.Status != 'Available'
                        ) THEN 'Unavailable'
                        ELSE 'Available'
                    END AS Status
                FROM
                    Products p
                JOIN
                    ProductType pt ON p.ProductTypeID = pt.ProductTypeID
                WHERE
                    p.ProductID = ?
            """, product_id)
            product_row = await cursor.fetchone()

            if not product_row:
                raise HTTPException(status_code=404, detail=f"Product with ID {product_id} not found.")

            # fetch sizes for this specific product
            await cursor.execute("SELECT SizeName FROM Size WHERE ProductID = ?", product_id)
            product_sizes = [row.SizeName for row in await cursor.fetchall()]

    except Exception as e:
        logger.error(f"Database error while fetching details for product {product_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An error occurred while fetching product data.")
    finally:
        if conn: await conn.close()
    
    return ProductDetailWithStatusOut(
        ProductTypeName=product_row.ProductTypeName,
        ProductCategory=product_row.ProductCategory,
        ProductName=product_row.ProductName,
        Description=product_row.ProductDescription,
        Price=float(product_row.ProductPrice),
        Sizes=product_sizes or None,
        Status=product_row.Status
    )

# get all products
@router.get("/products/", response_model=List[ProductOut])
async def get_all_products(token: str = Depends(oauth2_scheme)):
    """
    Retrieves basic product information without live stock status.
    This endpoint is used for building the main menu structure.
    """
    await validate_token_and_roles(token, ["admin", "manager", "staff", "cashier"])
    conn = await get_db_connection()
    try:
        async with conn.cursor() as cursor:
            await cursor.execute("""
                SELECT p.ProductID, p.ProductName, p.ProductTypeID, pt.ProductTypeName, pt.SizeRequired,
                       p.ProductCategory, p.ProductDescription, p.ProductPrice, p.ProductImage
                FROM Products p JOIN ProductType pt ON p.ProductTypeID = pt.ProductTypeID
                ORDER BY p.ProductName
            """)
            product_rows = await cursor.fetchall()
            if not product_rows: return []

            product_ids = [r.ProductID for r in product_rows]
            sizes_by_product_id = {}
            if product_ids:
                placeholders = ','.join(['?'] * len(product_ids))
                await cursor.execute(f"SELECT ProductID, SizeName FROM Size WHERE ProductID IN ({placeholders})", *product_ids)
                for sr in await cursor.fetchall():
                    sizes_by_product_id.setdefault(sr.ProductID, []).append(sr.SizeName)
            
            return [ProductOut(
                    ProductID=r.ProductID, ProductName=r.ProductName, ProductTypeID=r.ProductTypeID,
                    ProductTypeName=r.ProductTypeName, ProductCategory=r.ProductCategory,
                    ProductDescription=r.ProductDescription, ProductPrice=float(r.ProductPrice or 0.0),
                    ProductImage=_construct_full_url_for_is_response(r.ProductImage), 
                    ProductSizes=sizes_by_product_id.get(r.ProductID),
                    ProductTypeSizeRequired=bool(r.SizeRequired)
                ) for r in product_rows]
    finally:
        if conn: await conn.close()

# create product
@router.post("/products/", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
async def create_new_product(
    token: str = Depends(oauth2_scheme), ProductName: str = Form(...), ProductTypeID: int = Form(...),
    ProductCategory: str = Form(...), ProductDescription: Optional[str] = Form(None), ProductPrice: float = Form(...),
    ProductSize: Optional[str] = Form(None), ProductImageFile: Optional[UploadFile] = File(None)
):
    await validate_token_and_roles(token, ["admin", "manager", "staff"])
    conn = await get_db_connection()
    try:
        async with conn.cursor() as cursor:
            await cursor.execute("SELECT 1 FROM Products WHERE ProductName = ? AND ProductCategory = ?", ProductName, ProductCategory)
            if await cursor.fetchone():
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Product '{ProductName}' in '{ProductCategory}' already exists.")

            type_details = await _get_product_type_details(conn, ProductTypeID)
            if not type_details:
                 raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"ProductTypeID {ProductTypeID} not found.")

            is_db_image_path = None
            if ProductImageFile:
                if not ProductImageFile.content_type.startswith("image/"):
                    raise HTTPException(status_code=400, detail="Uploaded file is not a valid image.")
                ext = Path(ProductImageFile.filename).suffix.lower()
                if ext not in [".png", ".jpg", ".jpeg", ".gif", ".webp"]:
                    raise HTTPException(status_code=400, detail=f"Unsupported image extension: {ext}")
                
                unique_filename = f"{uuid.uuid4()}{ext}"
                physical_file_loc = UPLOAD_DIRECTORY_PHYSICAL / unique_filename
                with open(physical_file_loc, "wb") as f:
                    f.write(await ProductImageFile.read())
                is_db_image_path = f"{IMAGE_DB_PATH_PREFIX}/{unique_filename}"
                await ProductImageFile.close()

            await cursor.execute("""
                INSERT INTO Products (ProductName, ProductTypeID, ProductCategory, ProductDescription, ProductPrice, ProductImage)
                OUTPUT INSERTED.ProductID VALUES (?, ?, ?, ?, ?, ?)
            """, ProductName, ProductTypeID, ProductCategory, ProductDescription, ProductPrice, is_db_image_path)
            new_product_id = (await cursor.fetchone()).ProductID

            initial_product_size = None
            if ProductSize and ProductSize.strip():
                initial_product_size = ProductSize.strip()
                await cursor.execute("INSERT INTO Size (ProductID, SizeName) VALUES (?, ?)", new_product_id, initial_product_size)

            await conn.commit()
            return ProductOut(
                ProductID=new_product_id, ProductName=ProductName, ProductTypeID=ProductTypeID,
                ProductTypeName=type_details["name"], ProductCategory=ProductCategory, ProductDescription=ProductDescription,
                ProductPrice=ProductPrice, ProductImage=_construct_full_url_for_is_response(is_db_image_path),
                ProductSizes=[initial_product_size] if initial_product_size else None,
                ProductTypeSizeRequired=type_details["size_required"]
            )
    finally:
        if conn: await conn.close()

# update product
@router.put("/products/{product_id}", response_model=ProductOut)
async def update_product(
    product_id: int, token: str = Depends(oauth2_scheme), ProductName: str = Form(...), ProductTypeID: int = Form(...),
    ProductCategory: str = Form(...), ProductDescription: Optional[str] = Form(None), ProductPrice: float = Form(...),
    ProductSize: Optional[str] = Form(None), ProductImageFile: Optional[UploadFile] = File(None)
):
    await validate_token_and_roles(token, ["admin", "manager", "staff"])
    conn = await get_db_connection()
    try:
        type_details = await _get_product_type_details(conn, ProductTypeID)
        if not type_details:
            raise HTTPException(status_code=400, detail=f"ProductTypeID {ProductTypeID} not found.")

        async with conn.cursor() as cursor:
            await cursor.execute("SELECT ProductImage FROM Products WHERE ProductID = ?", product_id)
            current_product = await cursor.fetchone()
            if not current_product:
                raise HTTPException(status_code=404, detail="Product not found.")
            
            is_db_image_path_for_update = current_product.ProductImage
            if ProductImageFile:
                unique_filename = f"{uuid.uuid4()}{Path(ProductImageFile.filename).suffix.lower()}"
                physical_file_loc = UPLOAD_DIRECTORY_PHYSICAL / unique_filename
                with open(physical_file_loc, "wb") as f: f.write(await ProductImageFile.read())
                is_db_image_path_for_update = f"{IMAGE_DB_PATH_PREFIX}/{unique_filename}"
                await ProductImageFile.close()
                if current_product.ProductImage:
                    old_file_path = UPLOAD_DIRECTORY_PHYSICAL / Path(current_product.ProductImage).name
                    if old_file_path.exists(): os.remove(old_file_path)

            await cursor.execute("""
                UPDATE Products SET ProductName = ?, ProductTypeID = ?, ProductCategory = ?,
                ProductDescription = ?, ProductPrice = ?, ProductImage = ? WHERE ProductID = ?
            """, ProductName, ProductTypeID, ProductCategory, ProductDescription, ProductPrice, is_db_image_path_for_update, product_id)

            await cursor.execute("DELETE FROM Size WHERE ProductID = ?", product_id)
            product_sizes_for_response = None
            if ProductSize and ProductSize.strip():
                new_size = ProductSize.strip()
                await cursor.execute("INSERT INTO Size (ProductID, SizeName) VALUES (?, ?)", product_id, new_size)
                product_sizes_for_response = [new_size]
            await conn.commit()

            return ProductOut(
                ProductID=product_id, ProductName=ProductName, ProductTypeID=ProductTypeID, 
                ProductTypeName=type_details['name'], ProductCategory=ProductCategory,
                ProductDescription=ProductDescription, ProductPrice=float(ProductPrice),
                ProductImage=_construct_full_url_for_is_response(is_db_image_path_for_update),
                ProductSizes=product_sizes_for_response,
                ProductTypeSizeRequired=type_details["size_required"]
            )
    finally:
        if conn: await conn.close()

# delete product
@router.delete("/products/{product_id}", status_code=status.HTTP_200_OK)
async def delete_product(product_id: int, token: str = Depends(oauth2_scheme)):
    await validate_token_and_roles(token, ["admin", "manager"])
    conn = await get_db_connection()
    try:
        async with conn.cursor() as cursor:
            await cursor.execute("SELECT ProductImage FROM Products WHERE ProductID = ?", product_id)
            product_row = await cursor.fetchone()
            if not product_row:
                raise HTTPException(status_code=404, detail="Product not found.")
            
            await cursor.execute("DELETE FROM Size WHERE ProductID = ?", product_id)
            await cursor.execute("DELETE FROM Products WHERE ProductID = ?", product_id)
            await conn.commit()

            if product_row.ProductImage:
                physical_file = UPLOAD_DIRECTORY_PHYSICAL / Path(product_row.ProductImage).name
                if physical_file.exists(): os.remove(physical_file)

        return {"message": f"Product {product_id} and its assets deleted successfully."}
    finally:
        if conn: await conn.close()

# get product sizes
@router.get("/products/{product_id}/sizes", response_model=List[ProductSizeOut])
async def get_sizes_for_specific_product_is(product_id: int, token: str = Depends(oauth2_scheme)):
    await validate_token_and_roles(token, ["admin", "manager", "staff"])
    conn = await get_db_connection()
    try:
        async with conn.cursor() as cursor:
            await cursor.execute("SELECT 1 FROM Products WHERE ProductID = ?", product_id)
            if not await cursor.fetchone():
                raise HTTPException(status_code=404, detail=f"Product ID {product_id} not found.")
            await cursor.execute("SELECT SizeID, ProductID, SizeName FROM Size WHERE ProductID = ? ORDER BY SizeName", product_id)
            return [ProductSizeOut(**dict(zip([c[0] for c in r.cursor_description], r))) for r in await cursor.fetchall()]
    finally:
        if conn: await conn.close()

# add product sizes
@router.post("/products/{product_id}/sizes", response_model=ProductSizeOut, status_code=status.HTTP_201_CREATED)
async def add_size_to_existing_product(product_id: int, size_data: ProductSizeCreate, token: str = Depends(oauth2_scheme)):
    await validate_token_and_roles(token, ["admin", "manager", "staff"])
    conn = await get_db_connection()
    try:
        type_details = await _get_product_type_details(conn, product_id)
        if not type_details or not type_details['size_required']:
            raise HTTPException(status_code=400, detail="This product's type does not require sizes.")
        
        async with conn.cursor() as cursor:
            trimmed_size_name = size_data.SizeName.strip()
            if not trimmed_size_name:
                raise HTTPException(status_code=400, detail="SizeName cannot be empty.")
            
            await cursor.execute("SELECT 1 FROM Size WHERE ProductID = ? AND SizeName = ?", product_id, trimmed_size_name)
            if await cursor.fetchone():
                raise HTTPException(status_code=409, detail=f"Size '{trimmed_size_name}' already exists for this product.")
            
            await cursor.execute("INSERT INTO Size (ProductID, SizeName) OUTPUT INSERTED.SizeID VALUES (?, ?)", product_id, trimmed_size_name)
            new_size_id = (await cursor.fetchone()).SizeID
            await conn.commit()
            return ProductSizeOut(SizeID=new_size_id, ProductID=product_id, SizeName=trimmed_size_name)
    finally:
        if conn: await conn.close()

# delete product size
@router.delete("/products/{product_id}/sizes/{size_id}", status_code=status.HTTP_200_OK)
async def delete_specific_size_from_product_is(product_id: int, size_id: int, token: str = Depends(oauth2_scheme)):
    await validate_token_and_roles(token, ["admin", "manager"])
    conn = await get_db_connection()
    try:
        async with conn.cursor() as cursor:
            delete_op = await cursor.execute("DELETE FROM Size WHERE SizeID = ? AND ProductID = ?", size_id, product_id)
            if delete_op.rowcount == 0:
                raise HTTPException(status_code=404, detail=f"Size ID {size_id} not found for product ID {product_id}.")
            await conn.commit()
        return {"message": f"Size ID {size_id} deleted for product ID {product_id}."}
    finally:
        if conn: await conn.close()

@router.get("/count")
async def get_product_count(token: str = Depends(oauth2_scheme)):
    await validate_token_and_roles(token, ["admin", "manager", "staff"])
    conn = None
    try:
        conn = await get_db_connection()
        async with conn.cursor() as cursor:
            await cursor.execute("SELECT COUNT(*) as count FROM Products")
            row = await cursor.fetchone()
            return {"count": row.count if row else 0}
    finally:
        if conn: await conn.close()

# get inventory by category counts
@router.get("/inventory-by-category")
async def get_inventory_by_category(token: str = Depends(oauth2_scheme)):
    await validate_token_and_roles(token, ["admin", "manager", "staff", "cashier"])
    conn = None
    try:
        conn = await get_db_connection()
        async with conn.cursor() as cursor:
            await cursor.execute("""
                SELECT ProductCategory, COUNT(*) as count
                FROM Products
                GROUP BY ProductCategory
            """)
            rows = await cursor.fetchall()
            return [{"category": row.ProductCategory, "count": row.count} for row in rows]
    finally:
        if conn: await conn.close()