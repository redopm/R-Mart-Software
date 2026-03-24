from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
import uuid
import models, schemas
from database import get_db
from auth import get_current_user

router = APIRouter(prefix="/api/sales", tags=["Sales"])

def generate_invoice_no():
    return f"INV-{uuid.uuid4().hex[:8].upper()}"

@router.post("/", response_model=schemas.SaleResponse)
def create_sale(sale: schemas.SaleCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # 1. Customer Verification (if provided or if Udhaar)
    customer = None
    if sale.customer_id:
        customer = db.query(models.Customer).filter(models.Customer.id == sale.customer_id).first()
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found!")
            
    if sale.payment_mode == models.PaymentMode.UDHAAR and not customer:
        raise HTTPException(status_code=400, detail="Customer ID is required for Udhaar (Credit) sales!")

    # 2. Setup Sale Record
    invoice_no = generate_invoice_no()
    db_sale = models.Sale(
        invoice_no=invoice_no,
        user_id=current_user.id,
        customer_id=sale.customer_id,
        sale_type=sale.sale_type,
        discount=sale.discount,
        payment_mode=sale.payment_mode,
        total_amount=0.0,
        final_amount=0.0
    )
    db.add(db_sale)
    db.flush() # Get sale ID before committing

    total_amount = 0.0

    # 3. Process Items
    for item in sale.items:
        product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product ID {item.product_id} not found!")

        if product.stock_qty < item.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {product.name}. Available: {product.stock_qty}")

        # Determine price based on Wholesale / Retail
        price_to_use = product.wholesale_price if sale.sale_type == models.SaleType.WHOLESALE else product.retail_price
        
        # Deduct Product Stock
        product.stock_qty -= item.quantity
        
        # Deduct Batch Stock (if batch provided)
        if item.batch_id:
            batch = db.query(models.Batch).filter(models.Batch.id == item.batch_id).first()
            if batch and batch.quantity >= item.quantity:
                batch.quantity -= item.quantity

        line_total = price_to_use * item.quantity
        total_amount += line_total

        # Create SaleItem
        db_item = models.SaleItem(
            sale_id=db_sale.id,
            product_id=product.id,
            batch_id=item.batch_id,
            quantity=item.quantity,
            price_used=price_to_use
        )
        db.add(db_item)

    # 4. Finalize Sale Amounts
    db_sale.total_amount = total_amount
    db_sale.final_amount = total_amount - sale.discount

    # 5. Handle Udhaar Khata (Credit)
    if sale.payment_mode == models.PaymentMode.UDHAAR and customer:
        customer.pending_balance += db_sale.final_amount

    db.commit()
    db.refresh(db_sale)
    return db_sale

@router.get("/", response_model=List[schemas.SaleResponse])
def list_sales(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    # Add descending order by default to show latest sales first
    return db.query(models.Sale).order_by(models.Sale.created_at.desc()).offset(skip).limit(limit).all()

@router.get("/{sale_id}", response_model=schemas.SaleResponse)
def get_sale(sale_id: int, db: Session = Depends(get_db)):
    sale = db.query(models.Sale).filter(models.Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    return sale
