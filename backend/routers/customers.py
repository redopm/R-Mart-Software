from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models, schemas
from database import get_db

router = APIRouter(prefix="/api/customers", tags=["Customers"])

@router.post("/", response_model=schemas.CustomerResponse)
def create_customer(customer: schemas.CustomerCreate, db: Session = Depends(get_db)):
    if customer.phone_number:
        existing = db.query(models.Customer).filter(models.Customer.phone_number == customer.phone_number).first()
        if existing:
            raise HTTPException(status_code=400, detail="Phone number already registered!")
            
    db_customer = models.Customer(**customer.dict())
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

@router.get("/", response_model=List[schemas.CustomerResponse])
def get_customers(search: str = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    query = db.query(models.Customer)
    if search:
        query = query.filter(models.Customer.name.ilike(f"%{search}%") | models.Customer.phone_number.ilike(f"%{search}%"))
    return query.offset(skip).limit(limit).all()

@router.get("/{customer_id}", response_model=schemas.CustomerResponse)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found!")
    return customer

@router.post("/{customer_id}/pay")
def pay_dues(customer_id: int, payment: schemas.PaymentCreate, db: Session = Depends(get_db)):
    customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found!")
        
    if payment.amount <= 0:
        raise HTTPException(status_code=400, detail="Payment must be greater than 0")
        
    if payment.amount > customer.pending_balance:
        raise HTTPException(status_code=400, detail="Payment amount exceeds pending balance!")
        
    customer.pending_balance -= payment.amount
    db.commit()
    db.refresh(customer)
    return {"message": f"Payment of {payment.amount} recorded.", "remaining_balance": customer.pending_balance}
