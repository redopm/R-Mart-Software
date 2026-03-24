from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
import models, schemas
from database import get_db

router = APIRouter(prefix="/api/products", tags=["Products"])

@router.post("/", response_model=schemas.ProductResponse)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):
    # Check if barcode exists
    if product.barcode:
        existing = db.query(models.Product).filter(models.Product.barcode == product.barcode).first()
        if existing:
            raise HTTPException(status_code=400, detail="Barcode already registered!")
            
    db_product = models.Product(**product.dict())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

@router.get("/", response_model=List[schemas.ProductResponse])
def get_products(
    search: str = None, 
    category: str = None, 
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db)
):
    query = db.query(models.Product)
    
    if search:
        query = query.filter(models.Product.name.ilike(f"%{search}%") | models.Product.barcode.ilike(f"%{search}%"))
    if category:
        query = query.filter(models.Product.category == category)
        
    return query.offset(skip).limit(limit).all()

@router.get("/barcode/{barcode}", response_model=schemas.ProductResponse)
def get_product_by_barcode(barcode: str, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.barcode == barcode).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found in inventory!")
    return product

@router.get("/{product_id}", response_model=schemas.ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found!")
    return product

@router.put("/{product_id}", response_model=schemas.ProductResponse)
def update_product(product_id: int, product: schemas.ProductCreate, db: Session = Depends(get_db)):
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found!")
        
    for key, value in product.dict().items():
        setattr(db_product, key, value)
        
    db.commit()
    db.refresh(db_product)
    return db_product

@router.patch("/{product_id}/stock", response_model=schemas.ProductResponse)
def add_stock(product_id: int, stock: schemas.StockUpdate, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found!")
        
    product.stock_qty += stock.quantity
    db.commit()
    db.refresh(product)
    return product
