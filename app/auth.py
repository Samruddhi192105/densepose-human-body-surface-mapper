from __future__ import annotations

import os

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase import Client, create_client


SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_PUBLISHABLE_KEY = os.getenv("SUPABASE_PUBLISHABLE_KEY")

if not SUPABASE_URL:
    raise RuntimeError("SUPABASE_URL is not configured.")

if not SUPABASE_PUBLISHABLE_KEY:
    raise RuntimeError(
        "SUPABASE_PUBLISHABLE_KEY is not configured."
    )


supabase: Client = create_client(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
)

security = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
):
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication scheme.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        response = supabase.auth.get_user(
            credentials.credentials
        )

        if response is None or response.user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token.",
            )

        return response.user

    except HTTPException:
        raise

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
        )