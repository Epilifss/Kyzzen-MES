from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from database import Base
import datetime


class DatabaseConfig(Base):
    __tablename__ = "database_configs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    connection_data = Column(JSONB, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(
        DateTime,
        default=datetime.datetime.utcnow,
        onupdate=datetime.datetime.utcnow,
    )

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    full_name = Column(String)
    password_hash = Column(String)
    workstation_id = Column(Integer, ForeignKey("workstations.id"))
    workstation = relationship("Workstation")
    role = Column(String)
    total_points = Column(Integer, default=0)

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    cod = Column(String, index=True)
    desc = Column(String, index=True)
    line = Column(String, index=True)
    score = Column(Integer, default=0)
    material_types = Column(JSONB, index=True)
    components = Column(String, index=True)

class MaterialTypes(Base):
    __tablename__= "material_types"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)

class MaterialStock(Base):
    __tablename__= "material_stock"
    id = Column(Integer, primary_key=True, index=True)
    material_id = Column(Integer, index=True)
    um = Column(String, index=True)


class Component(Base):
    __tablename__ = "components"
    id = Column(Integer, primary_key=True, index=True)
    cod = Column(String, unique=True, index=True)
    desc = Column(String)
    material_id = Column(JSONB)
    current_stock = Column(Float, default=0)
    min_stock = Column(Float, default=0)

class Workstation(Base):
    __tablename__ = "workstations"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)
    head = Column(String, unique=False)

class Orders(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    op = Column(Integer, unique=True)
    pedido = Column(String, unique=False)
    dt_emissao = Column(DateTime, unique=False)
    dt_entrega = Column(String, unique=False)
    cliente = Column(String, unique=False)
    cod_cliente = Column(Integer, unique=False)
    cod_tidelli = Column(String, unique=False)
    descricao = Column(String, unique=False)
    linha = Column(String, unique=False)
    quant = Column(Integer, unique=False)
    obs = Column(String, unique=False)
    semana = Column(String, unique=False)
    tecido = Column(String, unique=False)
    aluminio = Column(Integer, unique=False)
    acabamento = Column(Integer, unique=False)
    filial = Column(String, unique=False)

class ProductionLog(Base):
    __tablename__ = "production_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    workstation_id = Column(Integer, ForeignKey("workstations.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Float)
    status = Column(String, default="Em produção.") # "pending" ou "finished"
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)