from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
from models import CustomerType, SaleType, PaymentMode, UserRole

# --- Auth Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class UserBase(BaseModel):
    username: str
    role: UserRole = UserRole.CASHIER

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    
    class Config:
        from_attributes = True

# --- Customer Schemas ---
class CustomerBase(BaseModel):
    name: str
    phone_number: Optional[str] = None
    customer_type: CustomerType = CustomerType.RETAIL

class CustomerCreate(CustomerBase):
    pass

class CustomerResponse(CustomerBase):
    id: int
    pending_balance: float
    
    class Config:
        from_attributes = True

# --- Batch Schemas ---
class BatchBase(BaseModel):
    batch_number: str
    mfg_date: Optional[date] = None
    expiry_date: Optional[date] = None
    quantity: int

class BatchCreate(BatchBase):
    pass

class BatchResponse(BatchBase):
    id: int
    product_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# --- Product Schemas ---
class ProductBase(BaseModel):
    barcode: Optional[str] = None
    name: str
    category: str
    unit: str = "pcs"
    cost_price: float
    retail_price: float
    wholesale_price: float
    stock_qty: int = 0
    min_stock_alert: int = 5

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: int
    batches: List[BatchResponse] = []
    
    class Config:
        from_attributes = True

class StockUpdate(BaseModel):
    quantity: int

# --- Sale Schemas ---
class SaleItemBase(BaseModel):
    product_id: int
    batch_id: Optional[int] = None
    quantity: int

class SaleItemCreate(SaleItemBase):
    pass # price_used will be calculated from Backend

class SaleItemResponse(SaleItemBase):
    id: int
    sale_id: int
    price_used: float
    
    class Config:
        from_attributes = True

class SaleBase(BaseModel):
    user_id: Optional[int] = None
    customer_id: Optional[int] = None
    sale_type: SaleType = SaleType.RETAIL
    discount: float = 0.0
    payment_mode: PaymentMode = PaymentMode.CASH

class SaleCreate(SaleBase):
    items: List[SaleItemCreate]

class SaleResponse(SaleBase):
    id: int
    invoice_no: str
    total_amount: float
    final_amount: float
    created_at: datetime
    items: List[SaleItemResponse] = []
    
    class Config:
        from_attributes = True

# --- Payment Schema ---
class PaymentCreate(BaseModel):
    amount: float