# api/utils.py

from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import boto3
from boto3.dynamodb.conditions import Attr
import os
import secrets
from config import GOOGLE_CLIENT_ID, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
from typing import Any, Dict


oauth2_scheme = HTTPBearer()
session = boto3.Session(
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
)
dynamodb = session.resource("dynamodb", region_name="us-east-1")
user_table = dynamodb.Table("userbase")



def verify_token(credentials: HTTPAuthorizationCredentials = Depends(oauth2_scheme)):
    try:
        token = credentials.credentials
        idinfo = id_token.verify_oauth2_token(
            token, google_requests.Request(), GOOGLE_CLIENT_ID
        )
        email = idinfo["email"].lower()
        return email
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        )

def get_user(username: str):
    response = user_table.get_item(Key={"username": username})
    if "Item" not in response:
        return None
    return response["Item"]


def save_user(user_data: Dict[str, Any]):
    # print("Saving user data:", user_data["functions"][10])
    user_table.put_item(Item=user_data)


def save_function(api_key, function):
    user_data = find_user_by_api_key(api_key)
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid API key")

    functions = user_data.get("functions", [])
    function_index = next(
        (
            i
            for i, f in enumerate(functions)
            if f.get("function_key") == function["function_key"]
        ),
        None,
    )

    if function_index is not None:
        functions[function_index] = function
    else:
        functions.append(function)

    user_data["functions"] = functions
    save_user(user_data)


def get_max_tests(tier: str) -> int:
    if tier == "free":
        return 5
    elif tier == "pro":
        return 50
    elif tier == "enterprise":
        return float("inf")  # No limit
    else:
        return 5  # Default to free limits


def is_version_tree_enabled(tier: str) -> bool:
    return tier in ["pro", "enterprise"]


def generate_api_key():
    return secrets.token_hex(16)


# Add the new function
def find_user_by_api_key(api_key: str):
    scan_kwargs = {
        "FilterExpression": Attr("api_key").eq(api_key),
    }
    response = user_table.scan(**scan_kwargs)
    if "Items" not in response or len(response["Items"]) == 0:
        return None
    return response["Items"][0]


def find_function_by_api_and_function_key(api_key: str, function_key: str):
    user_data = find_user_by_api_key(api_key)
    if not user_data:
        return None
    functions = user_data.get("functions", [])
    function = next(
        (f for f in functions if f.get("function_key") == function_key), None
    )
    return function
