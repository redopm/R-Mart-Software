from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models, schemas
from database import get_db

router = APIRouter(prefix="/api/products/{product_id}/batches", tags=["Batches"])

@router.post("/", response_model=schemas.BatchResponse)
def create_batch(product_id: int, batch: schemas.BatchCreate, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found!")

    db_batch = models.Batch(**batch.dict(), product_id=product_id)
    db.add(db_batch)
    
    # Also update total product stock
    product.stock_qty += batch.quantity
    
    db.commit()
    db.refresh(db_batch)
    return db_batch

@router.get("/", response_model=List[schemas.BatchResponse])
def get_batches(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found!")
    return product.batches
