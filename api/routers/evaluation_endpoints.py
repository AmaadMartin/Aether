# api/routers/evaluation_endpoints.py

from fastapi import APIRouter, HTTPException, Depends, Body, Request
from models import EvaluationInput
from utils import verify_token, get_user, save_user
from typing import Any
from evaluation import evaluate_output
import uuid
from datetime import datetime

router = APIRouter()


@router.post("/evaluate")
def evaluate_input_output_pair(input_data: EvaluationInput):
    task = input_data.task
    input_payload = input_data.input
    output_payload = input_data.output
    version = input_data.version
    function_key = input_data.function_key
    api_key = input_data.api_key

    # Find user with api_key
    user_table = get_user_table()
    scan_kwargs = {
        "FilterExpression": "api_key = :api_key",
        "ExpressionAttributeValues": {":api_key": api_key},
    }
    response = user_table.scan(**scan_kwargs)
    if "Items" not in response or len(response["Items"]) == 0:
        print("Invalid API key")
        raise HTTPException(status_code=401, detail="Invalid API key")
    user_data = response["Items"][0]

    functions = user_data.get("functions", [])
    function = next((f for f in functions if f.get("function_key") == function_key), None)
    if not function:
        print("Function not found")
        raise HTTPException(status_code=404, detail="Function not found")

    version_data = function["version_map"].get(version)
    if not version_data:
        raise HTTPException(status_code=404, detail="Version not found")

    # Create a new call
    call_key = uuid.uuid4().hex
    call = {
        "call_key": call_key,
        "inputs": input_payload,
        "outputs": output_payload,
        "logs": [],
        "evaluation": {},
        "status": "pending",
        "timestamp": datetime.utcnow().isoformat(),
    }

    # Evaluate the output if not a custom function and tier allows it
    tier = user_data.get("tier", "free")
    if function["type"] != "flow" and tier != "free":
        metrics = version_data.get("metrics", [])
        evaluation_scores = evaluate_output(
            task, metrics, input_payload, output_payload
        )
        call["evaluation"] = evaluation_scores
        call["status"] = "evaluated"
    else:
        call["status"] = "completed"

    # Add call to version's calls
    version_data["calls"].append(call)

    # Update function in user_data
    save_user(user_data)

    return {"message": "success"}
