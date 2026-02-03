import models, schemas
from database import engine, get_db
from sqlalchemy.orm import Session
from fastapi import FastAPI, Depends, HTTPException
from typing import List

# ATENÇÃO: A linha abaixo apaga o banco para recriar com as novas colunas.
# models.Base.metadata.drop_all(bind=engine) 
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# --- ROTAS DE USUÁRIOS ---

@app.get("/users/", response_model=List[schemas.UserOut])
def list_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    # Lista todos os usuários cadastrados
    users = db.query(models.User).offset(skip).limit(limit).all()
    return users

@app.get("/users/{user_id}", response_model=schemas.UserOut)
def get_user(user_id: int, db: Session = Depends(get_db)):
    # Busca um usuário específico pelo ID
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return db_user

@app.post("/users/", response_model=schemas.UserOut)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Verifica se usuário já existe
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    new_user = models.User(
        username=user.username,
        full_name=user.full_name,
        password_hash=user.password,
        role=user.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

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
    # 1. Busca o log existente
    db_log = db.query(models.ProductionLog).filter(models.ProductionLog.id == log_id).first()
    
    if not db_log:
        raise HTTPException(status_code=404, detail="Registro de produção não encontrado")
    
    if db_log.status == "finished":
        raise HTTPException(status_code=400, detail="Esta peça já foi contabilizada como finalizada")

    # 2. Atualiza o status
    db_log.status = "finished"
    
    # 3. Lógica de Pontuação: 
    # Aqui poderíamos atualizar uma tabela de 'Ranking' ou 'TotalPoints' do usuário
    user = db.query(models.User).filter(models.User.id == db_log.user_id).first()
    product = db.query(models.Product).filter(models.Product.id == db_log.product_id).first()
    
    points_earned = product.base_points * db_log.quantity
    user.total_points += points_earned # Assume que adicionamos 'total_points' ao modelo User

    db.commit()
    return {
        "status": "Sucesso", 
        "message": f"Produto finalizado. {points_earned} pontos atribuídos ao operador {user.username}."
    }