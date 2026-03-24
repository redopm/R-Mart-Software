from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import models
from database import engine

# Import our new routers
from routers import products, customers, batches, sales, reports
from sqlalchemy.orm import Session

# Creates tables in chhotashop.db automatically based on the new schema
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="ChhotaShop ERP API", description="Wholesale & Retail dual-pricing POS system")

# CORS setup so React frontend can talk to us
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, lock this down!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connect Routers
app.include_router(products.router)
app.include_router(customers.router)
app.include_router(batches.router)
app.include_router(sales.router)
app.include_router(reports.router)

@app.get("/")
def read_root():
    return {"Message": "Welcome to ChhotaShop ERP Backend API"}
# Force uvicorn reload
