from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# Esquema para criar um Usuário
class UserCreate(BaseModel):
    username: str
    full_name: str
    password: str
    role: Optional[str] = "operator"

# Esquema para ler um Usuário (o que a API devolve)
class UserOut(BaseModel):
    id: int
    username: str
    full_name: str
    role: str

    class Config:
        from_attributes = True # Permite converter do SQLAlchemy para Pydantic

# Esquema para criar um Produto
class ProductCreate(BaseModel):
    sku: str
    name: str
    base_points: int

# Esquema para retorno de Produto
class ProductOut(BaseModel):
    id: int
    sku: str
    name: str
    base_points: int

    class Config:
        from_attributes = True

# Esquema para registrar produção (O que o operador envia)
class ProductionLogCreate(BaseModel):
    user_id: int
    workstation_id: int
    product_id: int
    quantity: float

# Esquema para criar um setor
class WorkstationOut(BaseModel):
    id: int
    name: str
    head: str

    class Config:
        from_attributes = True

# Esquema para retorno de Setor
class WorkstationCreate(BaseModel):
    name: str
    head: str