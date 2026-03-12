import models, schemas
from database import engine, get_db
from sqlalchemy.orm import Session
from sqlalchemy import MetaData, Table, func, create_engine, inspect, select, text
from fastapi import FastAPI, Depends, HTTPException
from fastapi.encoders import jsonable_encoder
from fastapi.security import OAuth2PasswordRequestForm
import auth
from typing import List, Optional
from urllib.parse import quote_plus

# models.Base.metadata.drop_all(bind=engine) 
models.Base.metadata.create_all(bind=engine)

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
    if not selected_fields:
        raise HTTPException(status_code=400, detail="Selecione ao menos um campo na configuração antes de carregar os pedidos")

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

            query_fields = [field for field in selected_fields if field in available_fields]
            if not query_fields:
                raise HTTPException(status_code=404, detail="Os campos selecionados não existem no resultado da query personalizada")

            rows = [{field: row.get(field) for field in query_fields} for row in all_rows]
        else:
            schema_name, table_name = split_schema_and_table(table_name_value, normalized_type)
            metadata = MetaData()
            external_table = Table(table_name, metadata, autoload_with=external_engine, schema=schema_name)

            available_columns = {column.name: column for column in external_table.columns}
            query_columns = [available_columns[field] for field in selected_fields if field in available_columns]
            if not query_columns:
                raise HTTPException(status_code=404, detail="Os campos selecionados não existem mais na tabela configurada")

            query = select(*query_columns)
            with external_engine.connect() as connection:
                result = connection.execute(query)
                rows = [dict(row._mapping) for row in result]

            query_fields = [column.name for column in query_columns]

        return jsonable_encoder({
            "config_id": active_config.id,
            "config_name": active_config.name,
            "fields": query_fields,
            "rows": rows,
        })
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Falha ao consultar pedidos externos: {str(exc)}") from exc
    finally:
        if external_engine is not None:
            external_engine.dispose()

# --- ROTAS DE USUÁRIOS ---

@app.get("/users/", response_model=list[schemas.UserOut])
def get_users(db: Session = Depends(get_db)):
    users = db.query(models.User).all()
    
    results = []
    for user in users:
        results.append({
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "role": user.role,
            "workstation_name": user.workstation.name if user.workstation else "Sem Setor"
        })
    
    return results

@app.get("/users/{user_id}", response_model=schemas.UserOut)
def get_user(user_id: int, db: Session = Depends(get_db)):
    # Busca um usuário específico pelo ID
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return db_user

@app.post("/users/", response_model=schemas.UserOut)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # 1. Verificar se o usuário já existe
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")

    # 2. Buscar a workstation no banco para pegar o nome dela
    workstation = db.query(models.Workstation).filter(models.Workstation.id == user.workstation_id).first()
    if not workstation:
        raise HTTPException(status_code=404, detail="Workstation not found")

    # 3. Criar o novo usuário (Salvando o ID no banco)
    new_user = models.User(
        username=user.username,
        full_name=user.full_name,
        password_hash=auth.get_psw_hash(user.password),
        workstation_id=user.workstation_id, # Salva o número 0, 1, 2...
        role=user.role
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # 4. Retornar os dados no formato que o UserOut espera (com o nome)
    return {
        "id": new_user.id,
        "username": new_user.username,
        "full_name": new_user.full_name,
        "role": new_user.role,
        "workstation_name": workstation.name # Aqui enviamos o "Nome" em vez do "ID"
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
    db_product = db.query(models.Product).filter(models.Product.sku == product.sku).first()
    if db_product:
        raise HTTPException(status_code=400, detail="SKU já cadastrado")
    
    new_product = models.Product(**product.model_dump())
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product

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
    
    access_token = auth.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

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