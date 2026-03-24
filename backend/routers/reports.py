from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import datetime
from sqlalchemy import func
import models
from database import get_db

router = APIRouter(prefix="/api/reports", tags=["Reports"])

@router.get("/daily-sales")
def get_daily_sales(db: Session = Depends(get_db)):
    today = datetime.date.today()
    today_start = datetime.datetime.combine(today, datetime.time.min)
    today_end = datetime.datetime.combine(today, datetime.time.max)

    sales_query = db.query(models.Sale).filter(
        models.Sale.created_at >= today_start,
        models.Sale.created_at <= today_end
    )
    
    all_sales = sales_query.all()
    total_revenue = sum(sale.final_amount for sale in all_sales)
    total_sales = len(all_sales)

    breakdown = {}
    for sale in all_sales:
        mode = sale.payment_mode.value
        breakdown[mode] = breakdown.get(mode, 0) + sale.final_amount

    return {
        "date": today,
        "total_revenue": total_revenue,
        "total_sales_count": total_sales,
        "payment_breakdown": breakdown
    }

@router.get("/low-stock")
def get_low_stock(db: Session = Depends(get_db)):
    # Returns items where stock_qty <= min_stock_alert
    low_stock_items = db.query(models.Product).filter(
        models.Product.stock_qty <= models.Product.min_stock_alert
    ).all()
    
    return [
        {
            "id": p.id,
            "name": p.name,
            "barcode": p.barcode,
            "stock_qty": p.stock_qty,
            "alert_level": p.min_stock_alert
        }
        for p in low_stock_items
    ]
