# /backend/app/api/routes_auth.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.db.engine import get_session
from app.models.models import User, UserRole
from app.core.security import hash_password, verify_password, create_access_token
from app.core.dependencies import get_current_user, require_role, ROLE_HIERARCHY

router = APIRouter()


# ── Schemas ───────────────────────────────────────────────────────────────────

class LoginInput(BaseModel):
    email    : str
    password : str

class RegisterInput(BaseModel):
    email: str
    password: str
    role: UserRole = UserRole.USER

class CreateUserInput(BaseModel):
    email    : str
    password : str
    role     : UserRole = UserRole.USER

class UpdateUserInput(BaseModel):
    email    : str | None = None
    password : str | None = None
    role     : UserRole | None = None

class UserOut(BaseModel):
    id    : int
    email : str
    role  : UserRole


# ── Helpers ───────────────────────────────────────────────────────────────────

def _can_manage_target(actor_role: str, target_role: str) -> bool:
    """
    Returns True if actor is allowed to create/edit/delete a user with target_role.
    Rules:
      - superuser can manage everyone including other superusers
      - admin can manage users and admins but NOT superusers
      - user cannot manage anyone
    """
    actor_level  = ROLE_HIERARCHY.get(actor_role, -1)
    target_level = ROLE_HIERARCHY.get(target_role, -1)

    if actor_role == "superuser":
        return True
    if actor_role == "admin":
        return target_role in ("user", "admin")
    return False


# ── Public endpoints ──────────────────────────────────────────────────────────

@router.post("/login")
async def login(
    payload : LoginInput,
    session : AsyncSession = Depends(get_session),
):
    result = await session.execute(select(User).where(User.email == payload.email))
    user   = result.scalars().first()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Email ou mot de passe invalide")

    token = create_access_token({"sub": user.email, "role": user.role.value})

    return {
        "access_token" : token,
        "token_type"   : "bearer",
        "role"         : user.role.value,
        "user_id"      : user.id,
        "email"        : user.email,
    }

@router.post("/register")
async def register(
    payload: RegisterInput,
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(select(User).where(User.email == payload.email))
    existing = result.scalars().first()

    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email           = payload.email,
        hashed_password = hash_password(payload.password),
        role            = UserRole.USER,   # hardcoded, ignore payload.role
    )

    session.add(user)
    await session.commit()
    await session.refresh(user)

    return {
        "id": user.id,
        "email": user.email,
        "role": user.role,
    }


# ── Protected: get current user ───────────────────────────────────────────────

@router.get("/me", response_model=UserOut)
async def get_me(
    current : dict          = Depends(get_current_user),
    session : AsyncSession  = Depends(get_session),
):
    result = await session.execute(select(User).where(User.email == current["sub"]))
    user   = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    return user


# ── Protected: list users (admin + superuser) ─────────────────────────────────

@router.get("/users", response_model=list[UserOut])
async def list_users(
    current : dict         = Depends(require_role("admin", "superuser")),
    session : AsyncSession = Depends(get_session),
):
    """
    Admin sees only users and admins.
    Superuser sees everyone.
    """
    q = select(User)
    if current["role"] == "admin":
        q = q.where(User.role.in_([UserRole.USER, UserRole.ADMIN]))

    result = await session.execute(q.order_by(User.created_at))
    return result.scalars().all()


# ── Protected: create user (admin + superuser) ────────────────────────────────

@router.post("/users", response_model=UserOut, status_code=201)
async def create_user(
    payload : CreateUserInput,
    current : dict            = Depends(require_role("admin", "superuser")),
    session : AsyncSession    = Depends(get_session),
):
    if not _can_manage_target(current["role"], payload.role.value):
        raise HTTPException(
            status_code=403,
            detail=f"Un {current['role']} ne peut pas créer un {payload.role.value}"
        )

    result = await session.execute(select(User).where(User.email == payload.email))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Email déjà utilisé")

    user = User(
        email           = payload.email,
        hashed_password = hash_password(payload.password),
        role            = payload.role,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


# ── Protected: update user (admin + superuser) ────────────────────────────────

@router.patch("/users/{user_id}", response_model=UserOut)
async def update_user(
    user_id : int,
    payload : UpdateUserInput,
    current : dict            = Depends(require_role("admin", "superuser")),
    session : AsyncSession    = Depends(get_session),
):
    result = await session.execute(select(User).where(User.id == user_id))
    target = result.scalars().first()
    if not target:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    # Check actor can manage this target's current role
    if not _can_manage_target(current["role"], target.role.value):
        raise HTTPException(status_code=403, detail="Accès refusé")

    # If role is being changed, check actor can assign the new role too
    if payload.role and not _can_manage_target(current["role"], payload.role.value):
        raise HTTPException(
            status_code=403,
            detail=f"Un {current['role']} ne peut pas assigner le rôle {payload.role.value}"
        )

    if payload.email:
        target.email = payload.email
    if payload.password:
        target.hashed_password = hash_password(payload.password)
    if payload.role:
        target.role = payload.role

    session.add(target)
    await session.commit()
    await session.refresh(target)
    return target


# ── Protected: delete user (admin + superuser) ────────────────────────────────

@router.delete("/users/{user_id}", status_code=204)
async def delete_user(
    user_id : int,
    current : dict           = Depends(require_role("admin", "superuser")),
    session : AsyncSession   = Depends(get_session),
):
    result = await session.execute(select(User).where(User.id == user_id))
    target = result.scalars().first()
    if not target:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    # Prevent self-deletion
    if target.email == current["sub"]:
        raise HTTPException(status_code=400, detail="Vous ne pouvez pas supprimer votre propre compte")

    if not _can_manage_target(current["role"], target.role.value):
        raise HTTPException(status_code=403, detail="Accès refusé")

    await session.delete(target)
    await session.commit()