import models, schemas
from database import engine, get_db
from sqlalchemy.orm import Session
from sqlalchemy import MetaData, Table, func, create_engine, inspect, select, text
from fastapi import FastAPI, Depends, HTTPException
from fastapi.encoders import jsonable_encoder
from fastapi.security import OAuth2PasswordRequestForm
import auth
from typing import List, Optional
import hashlib
import json
import datetime
from urllib.parse import quote_plus

# models.Base.metadata.drop_all(bind=engine)
models.Base.metadata.create_all(bind=engine)

# Migration: adiciona role_id à tabela users se ainda não existir
with engine.connect() as _conn:
    _conn.execute(text(
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id INTEGER REFERENCES roles(id) ON DELETE SET NULL"
    ))
    _conn.commit()

app = FastAPI()


def parse_server_host_port(server: str):
    server = (server or "").strip()
    if not server:
        raise HTTPException(status_code=400, detail="Servidor é obrigatório")

    if ":" in server:
        host, port_str = server.rsplit(":", 1)
        try:
            port = int(port_str)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail="Porta inválida no servidor") from exc
        return host, port

    return server, 5432


def split_schema_and_table(table_name: Optional[str], db_type: str):
    if not table_name:
        raise HTTPException(status_code=400, detail="Tabela é obrigatória quando não há query personalizada")

    if "." in table_name:
        schema_name, raw_table_name = table_name.split(".", 1)
        return schema_name, raw_table_name
    default_schema = "dbo" if db_type == "sqlserver" else "public"
    return default_schema, table_name


def normalize_db_type(db_type: str):
    normalized = (db_type or "postgresql").strip().lower()
    if normalized in ["postgres", "postgresql", "pgsql"]:
        return "postgresql"
    if normalized in ["sqlserver", "mssql", "sql_server"]:
        return "sqlserver"
    raise HTTPException(status_code=400, detail="Tipo de banco não suportado. Use postgresql ou sqlserver")


def build_external_db_url(db_type: str, server: str, username: str, password: str, database_name: str):
    normalized_type = normalize_db_type(db_type)
    server = (server or "").strip()

    if normalized_type == "sqlserver":
        driver = "ODBC Driver 17 for SQL Server"
        odbc_connect = (
            f"DRIVER={{{driver}}};"
            f"SERVER={server};"
            f"DATABASE={database_name};"
            f"UID={username};"
            f"PWD={password};"
            "TrustServerCertificate=yes;"
        )
        return f"mssql+pyodbc:///?odbc_connect={quote_plus(odbc_connect)}"

    if server.startswith("postgresql://"):
        return server

    host, port = parse_server_host_port(server)
    return f"postgresql+psycopg2://{username}:{password}@{host}:{port}/{database_name}"


def serialize_database_config(config: models.DatabaseConfig):
    connection_data = config.connection_data or {}
    return {
        "id": config.id,
        "name": config.name,
        "db_type": connection_data.get("db_type", "postgresql"),
        "server": connection_data.get("server", ""),
        "username": connection_data.get("username", ""),
        "database_name": connection_data.get("database_name", ""),
        "table_name": connection_data.get("table_name", ""),
        "custom_query": connection_data.get("custom_query", ""),
        "has_password": bool(connection_data.get("password")),
        "selected_fields": connection_data.get("selected_fields", []),
        "distinct_column": connection_data.get("distinct_column"),
        "order_detail_fields": connection_data.get("order_detail_fields", []),
        "order_item_fields": connection_data.get("order_item_fields", []),
        "created_at": config.created_at,
        "updated_at": config.updated_at,
    }


def get_config_password(config_payload, db: Session):
    password = config_payload.password or ""
    if not password and getattr(config_payload, "config_id", None):
        existing_config = db.query(models.DatabaseConfig).filter(models.DatabaseConfig.id == config_payload.config_id).first()
        if not existing_config:
            raise HTTPException(status_code=404, detail="Configuração não encontrada")
        password = (existing_config.connection_data or {}).get("password", "")

    if not password:
        raise HTTPException(status_code=400, detail="Senha é obrigatória para testar conexão")

    return password


def _is_cte_query(query: str) -> bool:
    """Returns True if the query (after stripping comments) starts with WITH (CTE)."""
    import re
    stripped = re.sub(r"/\*.*?\*/", "", query, flags=re.DOTALL)
    stripped = re.sub(r"--[^\n]*", "", stripped).strip().lower()
    return stripped.startswith("with")


def _build_zero_row_preview(query: str, db_type: str) -> str:
    """Build a query that returns 0 rows but exposes all columns for schema inspection."""
    if _is_cte_query(query):
        # CTEs cannot be wrapped in a subquery.
        # For SQL Server: wrap with TOP 0 applied to the outer CTE reference.
        # Strategy: SELECT TOP 0 * FROM (<CTE query>) AS _p does NOT work in T-SQL.
        # Safest cross-dialect approach: return the query untouched and let the caller
        # fetch with fetchmany(0) / just read keys – but SQLAlchemy still needs execution.
        # For PostgreSQL, append LIMIT 0. For SQL Server, use SET ROWCOUNT 0 trick:
        # Actually the simplest cross-version way for SQL Server is to add WHERE 1=0
        # to the final query block. We detect whether there's already a WHERE clause
        # in the final SELECT and append AND 1=0 or WHERE 1=0 accordingly.
        if db_type == "sqlserver":
            import re
            # Add a wrapping SELECT TOP 0 by converting the CTE into a named outer query
            # T-SQL allows: WITH ... SELECT ... is a complete statement; not nestable.
            # Most reliable: just run with fetchmany(0) after connect – handled in caller.
            return query  # caller will use fetchmany(0)
        else:
            return f"{query} LIMIT 0"
    return f"SELECT * FROM ({query}) AS _preview WHERE 1 = 0"


def _strip_sql_comments(query: str) -> str:
    """Remove block comments (/* ... */) and line comments (-- ...) from SQL."""
    import re
    # Remove block comments
    query = re.sub(r"/\*.*?\*/", "", query, flags=re.DOTALL)
    # Remove line comments
    query = re.sub(r"--[^\n]*", "", query)
    return query.strip()


def normalize_custom_query(custom_query: Optional[str]):
    query = (custom_query or "").strip()
    if not query:
        return ""

    stripped = _strip_sql_comments(query).lower()
    if not (stripped.startswith("select") or stripped.startswith("with")):
        raise HTTPException(
            status_code=400,
            detail="A query personalizada deve iniciar com SELECT ou WITH (CTE)"
        )

    if ";" in query[:-1]:
        raise HTTPException(status_code=400, detail="A query personalizada deve conter apenas um comando")

    return query.rstrip(";")


def validate_source_input(table_name: Optional[str], custom_query: Optional[str]):
    has_table = bool((table_name or "").strip())
    has_custom_query = bool((custom_query or "").strip())

    if has_table and has_custom_query:
        raise HTTPException(status_code=400, detail="Informe apenas tabela ou query personalizada, não ambos")

    if not has_table and not has_custom_query:
        raise HTTPException(status_code=400, detail="Informe uma tabela ou uma query personalizada")


def _safe_str(value):
    if value is None:
        return ""
    return str(value).strip()


def _compute_order_key(config_id: int, distinct_value: str):
    raw = f"{config_id}:{distinct_value}".encode("utf-8")
    return hashlib.sha1(raw).hexdigest()


def _build_external_orders_payload(rows: List[dict], connection_data: dict, config_id: int):
    selected_fields = connection_data.get("selected_fields", []) or []
    detail_fields = connection_data.get("order_detail_fields", []) or []
    item_fields = connection_data.get("order_item_fields", []) or []
    distinct_column = connection_data.get("distinct_column")

    if not selected_fields:
        raise HTTPException(status_code=400, detail="Selecione ao menos um campo para a tela principal")

    if not rows:
        return []

    available_fields = list(rows[0].keys())

    if not distinct_column:
        # fallback seguro para manter usabilidade quando a coluna ainda não foi configurada
        distinct_column = selected_fields[0]

    if distinct_column not in available_fields:
        raise HTTPException(status_code=400, detail=f"A coluna de deduplicação '{distinct_column}' não existe na fonte")

    detail_fields = [field for field in detail_fields if field in available_fields]
    item_fields = [field for field in item_fields if field in available_fields]

    grouped = {}
    order_sequence = []

    for row in rows:
        distinct_value = _safe_str(row.get(distinct_column))
        if not distinct_value:
            continue

        order_key = _compute_order_key(config_id, distinct_value)
        if order_key not in grouped:
            grouped[order_key] = {
                "_order_key": order_key,
                "_distinct_value": distinct_value,
                "_details": {field: row.get(field) for field in detail_fields} if detail_fields else {field: row.get(field) for field in selected_fields},
                "_items": [],
                "_row": {field: row.get(field) for field in selected_fields},
            }
            order_sequence.append(order_key)

        if item_fields:
            grouped[order_key]["_items"].append({field: row.get(field) for field in item_fields})

    payload_rows = []
    for order_key in order_sequence:
        order_data = grouped[order_key]
        merged_row = {
            **order_data["_row"],
            "_order_key": order_data["_order_key"],
            "_details": order_data["_details"],
            "_items": order_data["_items"],
        }
        payload_rows.append(merged_row)

    return payload_rows


def _validate_external_orders(rows: List[dict]):
    issues = []
    valid_count = 0

    for row in rows:
        order_key = _safe_str(row.get("_order_key"))
        if not order_key:
            issues.append({"order_key": "", "reason": "Pedido sem identificador interno"})
            continue

        details = row.get("_details")
        if details is not None and not isinstance(details, dict):
            issues.append({"order_key": order_key, "reason": "Detalhes do pedido em formato inválido"})
            continue

        items = row.get("_items") or []
        if items and not isinstance(items, list):
            issues.append({"order_key": order_key, "reason": "Itens do pedido em formato inválido"})
            continue

        valid_count += 1

    return {
        "valid_count": valid_count,
        "invalid_count": len(issues),
        "issues": issues,
    }


@app.get("/configs/", response_model=list[schemas.DatabaseConfigOut])
def get_configs(db: Session = Depends(get_db)):
    configs = db.query(models.DatabaseConfig).order_by(models.DatabaseConfig.name.asc()).all()
    return [serialize_database_config(config) for config in configs]


@app.get("/configs/{config_id}", response_model=schemas.DatabaseConfigOut)
def get_config(config_id: int, db: Session = Depends(get_db)):
    config = db.query(models.DatabaseConfig).filter(models.DatabaseConfig.id == config_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="Configuração não encontrada")

    return serialize_database_config(config)


@app.post("/configs/", response_model=schemas.DatabaseConfigOut)
def create_config(config: schemas.DatabaseConfigCreate, db: Session = Depends(get_db)):
    existing_config = db.query(models.DatabaseConfig).filter(models.DatabaseConfig.name == config.name).first()
    if existing_config:
        raise HTTPException(status_code=400, detail="Já existe uma configuração com esse nome")

    normalized_query = normalize_custom_query(config.custom_query)
    validate_source_input(config.table_name, normalized_query)

    new_config = models.DatabaseConfig(
        name=config.name,
        connection_data={
            "db_type": normalize_db_type(config.db_type),
            "server": config.server,
            "username": config.username,
            "password": config.password,
            "database_name": config.database_name,
            "table_name": (config.table_name or "").strip(),
            "custom_query": normalized_query,
            "selected_fields": getattr(config, "selected_fields", []),
            "distinct_column": getattr(config, "distinct_column", None),
            "order_detail_fields": getattr(config, "order_detail_fields", []),
            "order_item_fields": getattr(config, "order_item_fields", []),
        },
    )

    db.add(new_config)
    db.commit()
    db.refresh(new_config)
    return serialize_database_config(new_config)


@app.put("/configs/{config_id}", response_model=schemas.DatabaseConfigOut)
def update_config(config_id: int, config: schemas.DatabaseConfigUpdate, db: Session = Depends(get_db)):
    db_config = db.query(models.DatabaseConfig).filter(models.DatabaseConfig.id == config_id).first()
    if not db_config:
        raise HTTPException(status_code=404, detail="Configuração não encontrada")

    existing_config = (
        db.query(models.DatabaseConfig)
        .filter(models.DatabaseConfig.name == config.name, models.DatabaseConfig.id != config_id)
        .first()
    )
    if existing_config:
        raise HTTPException(status_code=400, detail="Já existe uma configuração com esse nome")

    normalized_query = normalize_custom_query(config.custom_query)
    validate_source_input(config.table_name, normalized_query)

    current_connection_data = db_config.connection_data or {}
    password = config.password if config.password else current_connection_data.get("password", "")

    db_config.name = config.name
    db_config.connection_data = {
        "db_type": normalize_db_type(config.db_type),
        "server": config.server,
        "username": config.username,
        "password": password,
        "database_name": config.database_name,
        "table_name": (config.table_name or "").strip(),
        "custom_query": normalized_query,
        "selected_fields": getattr(config, "selected_fields", []),
        "distinct_column": getattr(config, "distinct_column", None),
        "order_detail_fields": getattr(config, "order_detail_fields", []),
        "order_item_fields": getattr(config, "order_item_fields", []),
    }

    db.commit()
    db.refresh(db_config)
    return serialize_database_config(db_config)


@app.post("/configs/preview-fields", response_model=schemas.DatabaseConfigFieldsPreviewResponse)
def preview_config_fields(payload: schemas.DatabaseConfigFieldsPreviewRequest, db: Session = Depends(get_db)):
    normalized_query = normalize_custom_query(payload.custom_query)
    validate_source_input(payload.table_name, normalized_query)

    password = get_config_password(payload, db)

    normalized_type = normalize_db_type(payload.db_type)
    database_url = build_external_db_url(
        normalized_type,
        payload.server,
        payload.username,
        password,
        payload.database_name,
    )

    external_engine = None
    try:
        external_engine = create_engine(database_url, pool_pre_ping=True)
        if normalized_query:
            preview_sql = _build_zero_row_preview(normalized_query, normalized_type)
            with external_engine.connect() as connection:
                result = connection.execute(text(preview_sql))
                # For SQL Server CTEs the query is run as-is; fetch at most 1 row
                # just to get the column metadata, then discard the rows.
                result.fetchmany(1)
                field_names = list(result.keys())
        else:
            schema_name, table_name = split_schema_and_table(payload.table_name, normalized_type)
            inspector = inspect(external_engine)
            columns = inspector.get_columns(table_name, schema=schema_name)
            field_names = [column.get("name") for column in columns if column.get("name")]

        if not field_names:
            raise HTTPException(status_code=404, detail="Nenhum campo encontrado para a tabela informada")

        return {"fields": field_names}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Falha ao conectar/tabela inválida: {str(exc)}") from exc
    finally:
        if external_engine is not None:
            external_engine.dispose()


@app.get("/orders/external/", response_model=schemas.ExternalOrdersResponse)
def get_external_orders(db: Session = Depends(get_db)):
    active_config = db.query(models.DatabaseConfig).order_by(models.DatabaseConfig.updated_at.desc()).first()
    if not active_config:
        raise HTTPException(status_code=404, detail="Nenhuma configuração de banco cadastrada")

    connection_data = active_config.connection_data or {}
    custom_query = normalize_custom_query(connection_data.get("custom_query", ""))
    table_name_value = connection_data.get("table_name", "")
    validate_source_input(table_name_value, custom_query)

    selected_fields = connection_data.get("selected_fields", [])
    detail_fields = connection_data.get("order_detail_fields", []) or []
    item_fields = connection_data.get("order_item_fields", []) or []
    distinct_column = connection_data.get("distinct_column")

    if not selected_fields:
        raise HTTPException(status_code=400, detail="Selecione ao menos um campo na configuração antes de carregar os pedidos")

    all_requested_fields = []
    for field in selected_fields + detail_fields + item_fields + ([distinct_column] if distinct_column else []):
        if field and field not in all_requested_fields:
            all_requested_fields.append(field)

    normalized_type = normalize_db_type(connection_data.get("db_type", "postgresql"))
    password = connection_data.get("password", "")
    if not password:
        raise HTTPException(status_code=400, detail="A configuração selecionada não possui senha salva")

    database_url = build_external_db_url(
        normalized_type,
        connection_data.get("server", ""),
        connection_data.get("username", ""),
        password,
        connection_data.get("database_name", ""),
    )

    external_engine = None
    try:
        external_engine = create_engine(database_url, pool_pre_ping=True)
        if custom_query:
            with external_engine.connect() as connection:
                result = connection.execute(text(custom_query))
                all_rows = [dict(row._mapping) for row in result]
                available_fields = list(result.keys())

            query_fields = [field for field in all_requested_fields if field in available_fields]
            if not query_fields:
                raise HTTPException(status_code=404, detail="Os campos selecionados não existem no resultado da query personalizada")

            rows = [{field: row.get(field) for field in query_fields} for row in all_rows]
        else:
            schema_name, table_name = split_schema_and_table(table_name_value, normalized_type)
            metadata = MetaData()
            external_table = Table(table_name, metadata, autoload_with=external_engine, schema=schema_name)

            available_columns = {column.name: column for column in external_table.columns}
            query_columns = [available_columns[field] for field in all_requested_fields if field in available_columns]
            if not query_columns:
                raise HTTPException(status_code=404, detail="Os campos selecionados não existem mais na tabela configurada")

            query = select(*query_columns)
            with external_engine.connect() as connection:
                result = connection.execute(query)
                rows = [dict(row._mapping) for row in result]

            query_fields = [column.name for column in query_columns]

        enriched_rows = _build_external_orders_payload(rows, connection_data, active_config.id)

        return jsonable_encoder({
            "config_id": active_config.id,
            "config_name": active_config.name,
            "fields": [field for field in selected_fields if field in query_fields],
            "rows": enriched_rows,
        })
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Falha ao consultar pedidos externos: {str(exc)}") from exc
    finally:
        if external_engine is not None:
            external_engine.dispose()


@app.post("/orders/external/validate", response_model=schemas.ExternalOrdersValidationResponse)
def validate_external_orders(payload: schemas.ImportOrdersRequest, db: Session = Depends(get_db)):
    config = db.query(models.DatabaseConfig).filter(models.DatabaseConfig.id == payload.config_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="Configuração não encontrada")

    validation_result = _validate_external_orders(payload.orders or [])
    return validation_result


@app.post("/orders/import/", response_model=schemas.ImportOrdersResponse)
def import_orders(request: schemas.ImportOrdersRequest, db: Session = Depends(get_db)):
    """Importar pedidos selecionados do externo para o banco interno"""
    config = db.query(models.DatabaseConfig).filter(models.DatabaseConfig.id == request.config_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="Configuração não encontrada")

    validation_result = _validate_external_orders(request.orders or [])

    imported_count = 0
    skipped_count = 0

    for order in request.orders or []:
        order_key = _safe_str(order.get("_order_key"))
        if not order_key:
            continue

        existing = db.query(models.ImportedOrder).filter(
            models.ImportedOrder.external_id == order_key,
            models.ImportedOrder.config_id == request.config_id,
        ).first()

        if existing:
            skipped_count += 1
            continue

        new_order = models.ImportedOrder(
            external_id=order_key,
            config_id=request.config_id,
            order_data=order.get("_details") or {},
            order_items=order.get("_items") or [],
            import_status="pending",
        )
        db.add(new_order)
        imported_count += 1

    db.commit()

    return {
        "imported_count": imported_count,
        "skipped_count": skipped_count,
        "invalid_count": validation_result["invalid_count"],
        "detail": f"{imported_count} pedidos importados, {skipped_count} ignorados (já existentes), {validation_result['invalid_count']} inválidos.",
    }


@app.get("/orders/imported/", response_model=list[schemas.ImportedOrderOut])
def list_imported_orders(db: Session = Depends(get_db)):
    """Listar pedidos que foram importados"""
    return db.query(models.ImportedOrder).order_by(models.ImportedOrder.created_at.desc()).all()


@app.get("/orders/imported/{order_id}", response_model=schemas.ImportedOrderOut)
def get_imported_order(order_id: int, db: Session = Depends(get_db)):
    """Obter detalhes de um pedido importado específico"""
    order = db.query(models.ImportedOrder).filter(models.ImportedOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido importado não encontrado")
    return order


@app.post("/orders/imported/{order_id}/queue-production", response_model=schemas.ImportedOrderOut)
def queue_order_for_production(order_id: int, db: Session = Depends(get_db)):
    order = db.query(models.ImportedOrder).filter(models.ImportedOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido importado não encontrado")

    order.import_status = "processing"
    db.commit()
    db.refresh(order)
    return order


@app.post("/orders/imported/{order_id}/complete", response_model=schemas.ImportedOrderOut)
def complete_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(models.ImportedOrder).filter(models.ImportedOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido importado não encontrado")

    order.import_status = "completed"
    db.commit()
    db.refresh(order)
    return order


@app.get("/orders/reports/summary", response_model=schemas.OrdersReportSummary)
def orders_report_summary(db: Session = Depends(get_db)):
    total = db.query(func.count(models.ImportedOrder.id)).scalar() or 0
    pending = db.query(func.count(models.ImportedOrder.id)).filter(models.ImportedOrder.import_status == "pending").scalar() or 0
    processing = db.query(func.count(models.ImportedOrder.id)).filter(models.ImportedOrder.import_status == "processing").scalar() or 0
    completed = db.query(func.count(models.ImportedOrder.id)).filter(models.ImportedOrder.import_status == "completed").scalar() or 0
    error = db.query(func.count(models.ImportedOrder.id)).filter(models.ImportedOrder.import_status == "error").scalar() or 0

    today_start = datetime.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_imported = (
        db.query(func.count(models.ImportedOrder.id))
        .filter(models.ImportedOrder.created_at >= today_start)
        .scalar()
        or 0
    )

    return {
        "total_imported": total,
        "pending": pending,
        "processing": processing,
        "completed": completed,
        "error": error,
        "today_imported": today_imported,
    }


# --- ROTAS DE FUNÇÕES (ROLES) ---

@app.get("/roles/", response_model=list[schemas.RoleOut])
def list_roles(db: Session = Depends(get_db)):
    return db.query(models.Role).order_by(models.Role.name.asc()).all()

@app.post("/roles/", response_model=schemas.RoleOut)
def create_role(role: schemas.RoleCreate, db: Session = Depends(get_db)):
    if db.query(models.Role).filter(models.Role.name == role.name).first():
        raise HTTPException(status_code=400, detail="Função já cadastrada")
    new_role = models.Role(name=role.name, permissions=role.permissions)
    db.add(new_role)
    db.commit()
    db.refresh(new_role)
    return new_role

@app.put("/roles/{role_id}", response_model=schemas.RoleOut)
def update_role(role_id: int, role: schemas.RoleUpdate, db: Session = Depends(get_db)):
    db_role = db.query(models.Role).filter(models.Role.id == role_id).first()
    if not db_role:
        raise HTTPException(status_code=404, detail="Função não encontrada")
    existing = db.query(models.Role).filter(models.Role.name == role.name, models.Role.id != role_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Já existe uma função com esse nome")
    db_role.name = role.name
    db_role.permissions = role.permissions
    db.commit()
    db.refresh(db_role)
    return db_role

@app.delete("/roles/{role_id}")
def delete_role(role_id: int, db: Session = Depends(get_db)):
    db_role = db.query(models.Role).filter(models.Role.id == role_id).first()
    if not db_role:
        raise HTTPException(status_code=404, detail="Função não encontrada")
    db.delete(db_role)
    db.commit()
    return {"detail": "Função deletada"}

# --- ROTAS DE USUÁRIOS ---

@app.get("/users/", response_model=list[schemas.UserOut])
def get_users(db: Session = Depends(get_db)):
    users = db.query(models.User).all()
    results = []
    for user in users:
        role_obj = db.query(models.Role).filter(models.Role.id == user.role_id).first() if user.role_id else None
        results.append({
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "role": role_obj.name if role_obj else (user.role or ""),
            "role_id": user.role_id,
            "workstation_id": user.workstation_id,
            "permissions": role_obj.permissions if role_obj else [],
            "workstation_name": user.workstation.name if user.workstation else "Sem Setor"
        })
    return results

@app.get("/users/{user_id}", response_model=schemas.UserOut)
def get_user(user_id: int, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    role_obj = db.query(models.Role).filter(models.Role.id == db_user.role_id).first() if db_user.role_id else None
    return {
        "id": db_user.id,
        "username": db_user.username,
        "full_name": db_user.full_name,
        "role": role_obj.name if role_obj else (db_user.role or ""),
        "role_id": db_user.role_id,
        "workstation_id": db_user.workstation_id,
        "permissions": role_obj.permissions if role_obj else [],
        "workstation_name": db_user.workstation.name if db_user.workstation else "Sem Setor"
    }

@app.post("/users/", response_model=schemas.UserOut)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username already registered")

    workstation = db.query(models.Workstation).filter(models.Workstation.id == user.workstation_id).first()
    if not workstation:
        raise HTTPException(status_code=404, detail="Workstation not found")

    role_obj = None
    if user.role_id:
        role_obj = db.query(models.Role).filter(models.Role.id == user.role_id).first()
        if not role_obj:
            raise HTTPException(status_code=404, detail="Função não encontrada")

    new_user = models.User(
        username=user.username,
        full_name=user.full_name,
        password_hash=auth.get_psw_hash(user.password),
        workstation_id=user.workstation_id,
        role=role_obj.name if role_obj else "",
        role_id=user.role_id,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "id": new_user.id,
        "username": new_user.username,
        "full_name": new_user.full_name,
        "role": role_obj.name if role_obj else "",
        "role_id": new_user.role_id,
        "workstation_id": new_user.workstation_id,
        "permissions": role_obj.permissions if role_obj else [],
        "workstation_name": workstation.name,
    }

@app.put("/users/{user_id}", response_model=schemas.UserOut)
def update_user(user_id: int, user: schemas.UserUpdate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    existing = (
        db.query(models.User)
        .filter(models.User.username == user.username, models.User.id != user_id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Username already registered")

    workstation = db.query(models.Workstation).filter(models.Workstation.id == user.workstation_id).first()
    if not workstation:
        raise HTTPException(status_code=404, detail="Workstation not found")

    role_obj = None
    if user.role_id:
        role_obj = db.query(models.Role).filter(models.Role.id == user.role_id).first()
        if not role_obj:
            raise HTTPException(status_code=404, detail="Função não encontrada")

    db_user.username = user.username
    db_user.full_name = user.full_name
    db_user.workstation_id = user.workstation_id
    db_user.role_id = user.role_id
    db_user.role = role_obj.name if role_obj else ""

    if user.password:
        db_user.password_hash = auth.get_psw_hash(user.password)

    db.commit()
    db.refresh(db_user)
    return {
        "id": db_user.id,
        "username": db_user.username,
        "full_name": db_user.full_name,
        "role": role_obj.name if role_obj else (db_user.role or ""),
        "role_id": db_user.role_id,
        "workstation_id": db_user.workstation_id,
        "permissions": role_obj.permissions if role_obj else [],
        "workstation_name": workstation.name,
    }

@app.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    db.delete(db_user)
    db.commit()
    return {"detail": "Usuário deletado"}

# --- ROTAS DE SETORES (WORKSTATIONS) ---

@app.get("/workstations/")
def list_workstations(db: Session = Depends(get_db)):
    # Lista todos os setores da fábrica
    return db.query(models.Workstation).all()

@app.post("/workstations/", response_model=schemas.WorkstationOut)
def create_workstation(workstation: schemas.WorkstationCreate, db: Session = Depends(get_db)):
    db_workstation = db.query(models.Workstation).filter(models.Workstation.name == workstation.name).first()
    if db_workstation:
        raise HTTPException(status_code=400, detail="Setor já cadastrado")
    
    new_workstation = models.Workstation(**workstation.model_dump())
    db.add(new_workstation)
    db.commit()
    db.refresh(new_workstation)
    return new_workstation

@app.delete("/workstations/{workstation_id}")
def delete_workstation(workstation_id: int, db: Session = Depends(get_db)):
    db_workstation = db.query(models.Workstation).filter(models.Workstation.id == workstation_id).first()
    if not db_workstation:
        raise HTTPException(status_code=404, detail="Setor não encontrado")
    
    db.delete(db_workstation)
    db.commit()
    return {"detail": "Setor deletado"}

@app.get("/departments/")
def get_departments(db: Session = Depends(get_db)):
    return db.query(models.Workstation).all()

# --- ROTAS DE PRODUTOS ---

@app.post("/products/", response_model=schemas.ProductOut)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):
    if db.query(models.Product).filter(models.Product.cod == product.cod).first():
        raise HTTPException(status_code=400, detail="cod product already registered")

    new_product = models.Product(
        cod=product.cod,
        desc=product.desc,
        line=product.line,
        base_points=product.base_points,
        product_data={}
    )
    db.add(new_product)
    db.commit()
    db.refresh(new_product)

    return {
        "id": new_product.id,
        "cod": new_product.cod,
        "desc": new_product.desc,
        "line": new_product.line,
        "base_points": new_product.base_points,
        "product_data": new_product.product_data
    }

@app.put("/products/{product_id}", response_model=schemas.ProductOut)
def update_product(product_id: int, product: schemas.ProductUpdate, db: Session = Depends(get_db)):
    db_products = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not db_products:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    existing = (
        db.query(models.Product)
        .filter(models.Product.cod == product.cod, models.Product.id != product_id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="cod product already registered")

    db_products.cod = product.cod
    db_products.desc = product.desc
    db_products.line = product.line
    db_products.base_points = product.base_points

    db.commit()
    db.refresh(db_products)
    return {
        "id": db_products.id,
        "cod": db_products.cod,
        "desc": db_products.desc,
        "line": db_products.line,
        "base_points": db_products.base_points
    }

@app.get("/products/", response_model=List[schemas.ProductOut])
def list_products(db: Session = Depends(get_db)):
    return db.query(models.Product).all()

# --- ROTA DE REGISTRO DE PRODUÇÃO ---

@app.post("/production/log/")
def log_production(log: schemas.ProductionLogCreate, db: Session = Depends(get_db)):
    # 1. Verificar se o produto existe para pegar os pontos
    product = db.query(models.Product).filter(models.Product.id == log.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    # 2. Criar o registro
    new_log = models.ProductionLog(
        user_id=log.user_id,
        workstation_id=log.workstation_id,
        product_id=log.product_id,
        quantity=log.quantity
    )
    
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    return {"message": "Produção registrada com sucesso!", "id": new_log.id}

@app.post("/production/finish/")
def finish_production(log_id: int, db: Session = Depends(get_db)):
    db_log = db.query(models.ProductionLog).filter(models.ProductionLog.id == log_id).first()
    
    if not db_log:
        raise HTTPException(status_code=404, detail="Registro de produção não encontrado")
    
    if db_log.status == "finished":
        raise HTTPException(status_code=400, detail="Esta peça já foi contabilizada como finalizada")

    db_log.status = "finished"
    
    user = db.query(models.User).filter(models.User.id == db_log.user_id).first()
    product = db.query(models.Product).filter(models.Product.id == db_log.product_id).first()
    
    points_earned = product.base_points * db_log.quantity
    user.total_points += points_earned

    db.commit()
    return {
        "status": "Sucesso", 
        "message": f"Produto finalizado. {points_earned} pontos atribuídos ao operador {user.username}."
    }

# --- ROTA DE AUTENTICAÇÃO ---

@app.post("/token")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()

    if not user or not auth.verify_psw(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Usuário ou senha incorretos")

    permissions: List[str] = []
    if user.role_id:
        role = db.query(models.Role).filter(models.Role.id == user.role_id).first()
        if role:
            permissions = role.permissions or []

    access_token = auth.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer", "permissions": permissions}

# --- ROTA DE RANKINGS ---

@app.get("/ranking/") # Verifique se tem a barra aqui
def get_ranking(db: Session = Depends(get_db)):
    ranking = (
        db.query(
            models.User.username,
            func.sum(models.Product.base_points * models.ProductionLog.quantity).label("total_points")
        )
        .join(models.ProductionLog, models.User.id == models.ProductionLog.user_id)
        .join(models.Product, models.Product.id == models.ProductionLog.product_id)
        # .filter(models.ProductionLog.status == "finished")
        .group_by(models.User.username)
        .order_by(func.sum(models.Product.base_points * models.ProductionLog.quantity).desc())
        .all()
    )
    return [{"username": r.username, "points": r.total_points} for r in ranking]

# --- ROTA DE PEDIDOS ---

@app.get("/orders/")
def get_orders(db: Session = Depends(get_db)):
    return db.query(models.Orders).all()