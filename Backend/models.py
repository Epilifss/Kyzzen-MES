from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from database import Base
import datetime

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    full_name = Column(String)
    password_hash = Column(String)
    role = Column(String, default="operator")
    total_points = Column(Integer, default=0)

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String, unique=True, index=True)
    name = Column(String)
    base_points = Column(Integer, default=0)

class Component(Base):
    __tablename__ = "components"
    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String, unique=True, index=True)
    name = Column(String)
    current_stock = Column(Float, default=0)
    min_stock = Column(Float, default=0)

class Workstation(Base):
    __tablename__ = "workstations"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)
    head = Column(String, unique=False)

class ProductionLog(Base):
    __tablename__ = "production_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    workstation_id = Column(Integer, ForeignKey("workstations.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Float)
    status = Column(String, default="pending") # "pending" ou "finished"
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)