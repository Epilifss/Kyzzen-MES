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
    distinct_column: Optional[str] = None
    order_detail_fields: List[str] = []
    order_item_fields: List[str] = []


class DatabaseConfigUpdate(DatabaseConfigPayloadBase):
    name: str
    password: Optional[str] = None
    selected_fields: List[str] = []
    distinct_column: Optional[str] = None
    order_detail_fields: List[str] = []
    order_item_fields: List[str] = []


class DatabaseConfigOut(DatabaseConfigPayloadBase):
    id: int
    name: str
    has_password: bool
    selected_fields: List[str] = []
    distinct_column: Optional[str] = None
    order_detail_fields: List[str] = []
    order_item_fields: List[str] = []
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


class ExternalOrdersValidationIssue(BaseModel):
    order_key: str
    reason: str


class ExternalOrdersValidationResponse(BaseModel):
    valid_count: int
    invalid_count: int
    issues: List[ExternalOrdersValidationIssue]


class ImportedOrderIn(BaseModel):
    external_id: str
    config_id: int
    order_data: dict
    order_items: Optional[List[dict]] = None


class ImportedOrderOut(BaseModel):
    id: int
    external_id: str
    config_id: int
    order_data: dict
    order_items: Optional[List[dict]] = None
    import_status: str
    created_at: datetime

    class Config:
        from_attributes = True


class ImportOrdersRequest(BaseModel):
    config_id: int
    orders: List[dict]


class ImportOrdersResponse(BaseModel):
    imported_count: int
    skipped_count: int
    invalid_count: int
    detail: str


class ImportedOrderStatusUpdate(BaseModel):
    import_status: str


class OrdersReportSummary(BaseModel):
    total_imported: int
    pending: int
    processing: int
    completed: int
    error: int
    today_imported: int

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
    cod: str
    desc: str
    line: str
    base_points: int
    product_data: Optional[dict] = None


class ProductUpdate(BaseModel):
    cod: str
    desc: str
    line: str
    base_points: int
    product_data: Optional[dict] = None

# Esquema para retorno de Produto


class ProductOut(BaseModel):
    id: int
    cod: str
    desc: str
    line: str
    base_points: int
    product_data: Optional[dict] = None

    class Config:
        from_attributes = True

class ComponentsOut(BaseModel):
    id: int
    cod: str
    desc: str
    line: str
    material_id: Optional[int] = None
    base_points: int
    product_data: Optional[dict] = None

    class Config:
        from_attributes = True

class ComponentCreate(BaseModel):
    cod: str
    desc: str
    line: str
    material_id: int
    base_points: int
    product_data: Optional[dict] = None


class ComponentUpdate(BaseModel):
    cod: str
    desc: str
    line: str
    material_id: int
    base_points: int
    product_data: Optional[dict] = None


class MaterialTypeCreate(BaseModel):
    name: str
    workstation_id: Optional[int] = None


class MaterialTypeUpdate(BaseModel):
    name: str
    workstation_id: Optional[int] = None

class MaterialTypeOut(BaseModel):
    id: int
    name: str
    workstation_id: Optional[int] = None


class ReleaseOrderForProductionResponse(BaseModel):
    imported_order_id: int
    created_tasks: int
    detail: str


class ProductionTaskOut(BaseModel):
    id: int
    imported_order_id: int
    external_order_id: str
    product_id: int
    component_id: Optional[int] = None
    workstation_id: int
    assigned_user_id: Optional[int] = None
    quantity: float
    status: str
    source_item: Optional[dict] = None
    created_at: datetime
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AssignProductionTaskPayload(BaseModel):
    user_id: int


class StartProductionTaskPayload(BaseModel):
    user_id: int


class FinishProductionTaskPayload(BaseModel):
    user_id: Optional[int] = None


class MaterialRequisitionCreate(BaseModel):
    task_id: int
    requested_by_user_id: int
    quantity: float
    notes: Optional[str] = None


class MaterialRequisitionOut(BaseModel):
    id: int
    task_id: int
    requested_by_user_id: int
    quantity: float
    notes: Optional[str] = None
    status: str
    created_at: datetime

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
