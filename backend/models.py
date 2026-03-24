import datetime
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Enum, Date
from sqlalchemy.orm import relationship
import enum
from database import Base

class CustomerType(str, enum.Enum):
    RETAIL = "retail"
    WHOLESALE = "wholesale"

class SaleType(str, enum.Enum):
    RETAIL = "retail"
    WHOLESALE = "wholesale"

class PaymentMode(str, enum.Enum):
    CASH = "Cash"
    UPI = "UPI"
    UDHAAR = "Udhaar"

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    CASHIER = "cashier"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(Enum(UserRole), default=UserRole.CASHIER)
    
    sales = relationship("Sale", back_populates="user")

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    phone_number = Column(String, unique=True, index=True, nullable=True)
    customer_type = Column(Enum(CustomerType), default=CustomerType.RETAIL)
    pending_balance = Column(Float, default=0.0)

    sales = relationship("Sale", back_populates="customer")

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    barcode = Column(String, unique=True, index=True, nullable=True) # Optional for some items
    name = Column(String, index=True)
    category = Column(String) 
    unit = Column(String, default="pcs") # pcs, kg, ltr
    
    cost_price = Column(Float)
    retail_price = Column(Float)     # New
    wholesale_price = Column(Float)  # New
    
    stock_qty = Column(Integer, default=0)
    min_stock_alert = Column(Integer, default=5)

    batches = relationship("Batch", back_populates="product")

class Batch(Base):
    """Handles grocery items with expiry dates and batched stock"""
    __tablename__ = "batches"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    batch_number = Column(String, index=True)
    mfg_date = Column(Date, nullable=True)
    expiry_date = Column(Date, nullable=True)
    quantity = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    product = relationship("Product", back_populates="batches")

class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)
    invoice_no = Column(String, unique=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False) # Cashier
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True) # None = Walk-in Cash
    
    sale_type = Column(Enum(SaleType), default=SaleType.RETAIL) # Determines which price was used
    
    total_amount = Column(Float, default=0.0)
    discount = Column(Float, default=0.0)
    final_amount = Column(Float, default=0.0)
    
    payment_mode = Column(Enum(PaymentMode), default=PaymentMode.CASH)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="sales")
    customer = relationship("Customer", back_populates="sales")
    items = relationship("SaleItem", back_populates="sale")

class SaleItem(Base):
    __tablename__ = "sale_items"

    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=True) # Helpful if tracking specific batch sold
    
    quantity = Column(Integer, nullable=False)
    price_used = Column(Float, nullable=False) # The actual rate applied at checkout
    
    sale = relationship("Sale", back_populates="items")