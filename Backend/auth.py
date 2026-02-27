from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from typing import Optional

SECRET_KEY = "admin123"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTE = 480

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_psw(plain_psw, hashed_psw):
    return pwd_context.verify(plain_psw, hashed_psw)

def get_psw_hash(psw):
    return pwd_context.hash(psw.strip())

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTE)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)