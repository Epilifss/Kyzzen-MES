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

class Role(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    permissions = Column(JSONB, nullable=False, default=list)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    full_name = Column(String)
    password_hash = Column(String)
    workstation_id = Column(Integer, ForeignKey("workstations.id"))
    workstation = relationship("Workstation")
    role = Column(String)  # nome da função (legado + cache)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=True)
    role_obj = relationship("Role")
    total_points = Column(Integer, default=0)

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    cod = Column(String, index=True)
    desc = Column(String, index=True)
    line = Column(String, index=True)
    base_points = Column(Integer, default=0)
    product_data = Column(JSONB, nullable=True)

class MaterialTypes(Base):
    __tablename__= "material_types"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    workstation_id = Column(Integer, ForeignKey("workstations.id"), nullable=True)

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
    line = Column(String)
    material_id = Column(Integer, index=True, nullable=True)
    base_points = Column(Integer, default=0)
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

class ImportedOrder(Base):
    __tablename__ = "imported_orders"
    id = Column(Integer, primary_key=True, index=True)
    external_id = Column(String, unique=True, index=True, nullable=False)
    config_id = Column(Integer, ForeignKey("database_configs.id"), nullable=False)
    order_data = Column(JSONB, nullable=False)
    order_items = Column(JSONB, nullable=True, default=list)
    import_status = Column(String, default="pending")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class ProductionLog(Base):
    __tablename__ = "production_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    workstation_id = Column(Integer, ForeignKey("workstations.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Float)
    status = Column(String, default="Em produção.") # "pending" ou "finished"
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)


class ProductionTask(Base):
    __tablename__ = "production_tasks"

    id = Column(Integer, primary_key=True, index=True)
    imported_order_id = Column(Integer, ForeignKey("imported_orders.id"), nullable=False, index=True)
    external_order_id = Column(String, index=True, nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    component_id = Column(Integer, ForeignKey("components.id"), nullable=True, index=True)
    workstation_id = Column(Integer, ForeignKey("workstations.id"), nullable=False, index=True)
    assigned_user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    quantity = Column(Float, default=1)
    status = Column(String, default="queued", index=True)
    source_item = Column(JSONB, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    started_at = Column(DateTime, nullable=True)
    finished_at = Column(DateTime, nullable=True)


class MaterialRequisition(Base):
    __tablename__ = "material_requisitions"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("production_tasks.id"), nullable=False, index=True)
    requested_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    quantity = Column(Float, default=0)
    notes = Column(String, nullable=True)
    status = Column(String, default="pending", index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)