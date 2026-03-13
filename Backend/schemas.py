from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class DatabaseConfigPayloadBase(BaseModel):
    db_type: str = "postgresql"
    server: str
    username: str
    database_name: str
    table_name: Optional[str] = None
    custom_query: Optional[str] = None


class DatabaseConfigCreate(DatabaseConfigPayloadBase):
    name: str
    password: str
    selected_fields: List[str] = []


class DatabaseConfigUpdate(DatabaseConfigPayloadBase):
    name: str
    password: Optional[str] = None
    selected_fields: List[str] = []


class DatabaseConfigOut(DatabaseConfigPayloadBase):
    id: int
    name: str
    has_password: bool
    selected_fields: List[str] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DatabaseConfigFieldsPreviewRequest(DatabaseConfigPayloadBase):
    config_id: Optional[int] = None
    password: Optional[str] = None


class DatabaseConfigFieldsPreviewResponse(BaseModel):
    fields: List[str]


class ExternalOrdersResponse(BaseModel):
    config_id: int
    config_name: str
    fields: List[str]
    rows: List[dict]

# Esquemas de Funções (Roles)
class RoleCreate(BaseModel):
    name: str
    permissions: List[str] = []

class RoleUpdate(BaseModel):
    name: str
    permissions: List[str] = []

class RoleOut(BaseModel):
    id: int
    name: str
    permissions: List[str] = []

    class Config:
        from_attributes = True

# Esquema para criar um Usuário
class UserCreate(BaseModel):
    username: str
    full_name: str
    password: str
    workstation_id: int
    role_id: Optional[int] = None

class UserUpdate(BaseModel):
    username: str
    full_name: str
    password: Optional[str] = None
    workstation_id: int
    role_id: Optional[int] = None

# Esquema para criar um setor
class WorkstationOut(BaseModel):
    id: int
    name: str
    head: str

    class Config:
        from_attributes = True

# Esquema para ler um Usuário (o que a API devolve)
class UserOut(BaseModel):
    id: int
    username: str
    full_name: str
    role: str
    role_id: Optional[int] = None
    workstation_id: Optional[int] = None
    permissions: List[str] = []
    workstation_name: str

    class Config:
        from_attributes = True

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

# Esquema para retorno de Setor
class WorkstationCreate(BaseModel):
    name: str
    head: str

class OrdersOut(BaseModel):
    op: int
    pedido: str
    dt_emisssao: str
    dt_entrega: str
    cliente: str
    cod_cliente: int
    cod_tidelli: str
    desc: str
    linha: str
    quant: int
    obs: str
    semana: str
    tecido: int
    aluminio: int
    acabamento: int
    filial: str

    class Config:
        from_attributes = True