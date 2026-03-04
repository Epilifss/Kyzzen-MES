import models, schemas
from database import engine, get_db
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
import auth
from typing import List

# models.Base.metadata.drop_all(bind=engine) 
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

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