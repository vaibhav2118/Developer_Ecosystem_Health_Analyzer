from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from pydantic import BaseModel, EmailStr
from typing import List, Optional

from backend.app.database.session import get_db
from backend.app.database.models import User, Role, AuditLog
from backend.app.auth.auth import (
    get_password_hash, verify_password, create_access_token, create_refresh_token, get_current_user
)
from backend.app.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])

class UserRegister(BaseModel):
    username: str
    email: Optional[EmailStr] = None
    password: str
    roles: Optional[List[str]] = ["Executive Viewer"] # Default role

class UserResponse(BaseModel):
    id: int
    username: str
    email: Optional[str]
    roles: List[str]
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    user: UserResponse

class TokenRefreshRequest(BaseModel):
    refresh_token: str

class TokenRefreshResponse(BaseModel):
    access_token: str
    token_type: str

@router.post("/register", response_model=UserResponse)
def register_user(user_in: UserRegister, db: Session = Depends(get_db)):
    # Check if username exists
    existing_user = db.query(User).filter(User.username == user_in.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
        
    # Check roles and fetch from DB
    db_roles = []
    if user_in.roles:
        for r_name in user_in.roles:
            role = db.query(Role).filter(Role.name == r_name).first()
            if role:
                db_roles.append(role)
            else:
                # If role doesn't exist, create it (seeding safety)
                role = Role(name=r_name, description=f"System {r_name} role")
                db.add(role)
                db.flush()
                db_roles.append(role)
                
    hashed_pwd = get_password_hash(user_in.password)
    user = User(
        username=user_in.username,
        email=user_in.email,
        password_hash=hashed_pwd,
        roles=db_roles
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Log audit event
    audit = AuditLog(
        user_id=user.id,
        username=user.username,
        action="register",
        target_type="user",
        target_id=str(user.id),
        details="User registered successfully"
    )
    db.add(audit)
    db.commit()
    
    # Format roles response
    role_names = [r.name for r in user.roles]
    return UserResponse(id=user.id, username=user.username, email=user.email, roles=role_names)

@router.post("/login", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    # Generate tokens
    access_token = create_access_token(data={"sub": user.username})
    refresh_token = create_refresh_token(data={"sub": user.username})
    
    # Log audit event
    audit = AuditLog(
        user_id=user.id,
        username=user.username,
        action="login",
        target_type="user",
        target_id=str(user.id),
        details="User logged in successfully"
    )
    db.add(audit)
    db.commit()
    
    role_names = [r.name for r in user.roles]
    user_res = UserResponse(id=user.id, username=user.username, email=user.email, roles=role_names)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user_res
    }

@router.post("/refresh", response_model=TokenRefreshResponse)
def refresh_access_token(payload: TokenRefreshRequest, db: Session = Depends(get_db)):
    from jose import jwt, JWTError
    try:
        token_data = jwt.decode(payload.refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = token_data.get("sub")
        token_type: str = token_data.get("type")
        if username is None or token_type != "refresh":
            raise HTTPException(status_code=401, detail="Invalid refresh token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
        
    user = db.query(User).filter(User.username == username).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User is inactive or not found")
        
    access_token = create_access_token(data={"sub": user.username})
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    role_names = [r.name for r in current_user.roles]
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        roles=role_names
    )
