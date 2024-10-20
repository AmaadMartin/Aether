# api/routers/auth.py

from fastapi import APIRouter, HTTPException, Depends, status
from utils import get_user, save_user, generate_api_key
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from config import GOOGLE_CLIENT_ID

router = APIRouter()


@router.post("/auth/login")
def login(data: dict):
    token = data.get("token")
    if not token:
        raise HTTPException(status_code=400, detail="Token is required")

    try:
        # Verify the token
        idinfo = id_token.verify_oauth2_token(
            token, google_requests.Request(), GOOGLE_CLIENT_ID
        )

        # Get user info
        email = idinfo["email"]
        email = email.lower()

        # Check if user exists
        user_data = get_user(email)
        if not user_data:
            # Create a new user
            user_api_key = generate_api_key()
            user_data = {
                "username": email,
                "functions": [],
                "api_key": user_api_key,
                "tier": "free",  # Default tier
            }
            save_user(user_data)
        else:
            if "api_key" not in user_data:
                # Generate API key for existing user if not present
                user_api_key = generate_api_key()
                user_data["api_key"] = user_api_key
                save_user(user_data)
            if "tier" not in user_data:
                user_data["tier"] = "free"
                save_user(user_data)
            user_api_key = user_data["api_key"]

        return {
            "email": email,
            "api_key": user_api_key,
            "tier": user_data.get("tier", "free"),
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e)
        )
