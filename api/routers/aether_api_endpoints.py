# api/routers/aether_api_endpoints.py

from fastapi import APIRouter, Depends, HTTPException, Request, Body
from utils import verify_token, get_user, save_user, save_function, find_user_by_api_key, find_function_by_api_and_function_key, is_version_tree_enabled
from evaluation import evaluate_output
from models import ParameterUpdateRequest, CreateCallRequest, UpdateCallRequest, EvaluateCallInput
from typing import Any
from datetime import datetime
import uuid

router = APIRouter()


@router.get("/function_data/{function_key}")
def get_function_data(function_key: str, request: Request):
    # Get the API key from headers
    api_key = request.headers.get("X-API-Key")
    if not api_key:
        raise HTTPException(status_code=401, detail="API key required")

    # Find the user with the given API key
    user_data = find_user_by_api_key(api_key)
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid API key")

    # Find the function with the given function_key
    function = next(
        (f for f in user_data.get("functions", []) if f.get("function_key") == function_key),
        None,
    )
    if not function:
        raise HTTPException(status_code=404, detail="Function not found")

    return function

@router.get("/function_params/{function_key}/{version}")
def get_parameters(
    function_key: str, version: str, request: Request
):
    api_key = request.headers.get("X-API-Key")
    user_data = find_user_by_api_key(api_key)
    
    function = next(
        (f for f in user_data.get("functions", []) if f.get("function_key") == function_key),
        None,
    )
    if not function:
        raise HTTPException(status_code=404, detail="Function not found")

    version_data = function["version_map"].get(version)
    if not version_data:
        raise HTTPException(status_code=404, detail="Version not found")

    parameters = version_data.get("parameters", {})
    parameters["output_schema"] = function.get("output_schema", {})
    return {"parameters": parameters}


@router.get("/function_param/{function_key}/{parameter}/{version}")
@router.get("/function_param/{function_key}/{parameter}")
def get_parameter(
    function_key: str,
    version: str,
    parameter: str,
    request: Request,
):
    api_key = request.headers.get("X-API-Key")
    user_data = find_user_by_api_key(api_key)
    function = next(
        (f for f in user_data.get("functions", []) if f.get("function_key") == function_key),
        None,
    )
    if not function:
        raise HTTPException(status_code=404, detail="Function not found")

    version_data = function["version_map"].get(version)
    if not version_data:
        raise HTTPException(status_code=404, detail="Version not found")

    param_value = version_data.get("parameters", {}).get(parameter)
    if param_value is None:
        raise HTTPException(status_code=404, detail="Parameter not found")

    return {"parameter": param_value}


@router.post("/function_params/{function_key}/{version}/{parameter}")
def set_parameter(
    function_key: str,
    version: str,
    parameter: str,
    request: ParameterUpdateRequest,
    
):
    api_key = request.headers.get("X-API-Key")
    user_data = find_user_by_api_key(api_key)
    function = next(
        (f for f in user_data.get("functions", []) if f.get("function_key") == function_key),
        None,
    )
    if not function:
        raise HTTPException(status_code=404, detail="Function not found")

    version_data = function["version_map"].get(version)
    if not version_data:
        raise HTTPException(status_code=404, detail="Version not found")

    version_data.setdefault("parameters", {})[parameter] = request.value
    save_user(user_data)

    return {"message": "Parameter updated successfully"}

@router.post("/create_call/{function_key}/{version}")
def create_call(
    function_key: str,
    version: str,
    request: Request,
    call_data: CreateCallRequest,
):
    # Get the API key from headers
    api_key = request.headers.get("X-API-Key")
    if not api_key:
        raise HTTPException(status_code=401, detail="API key required")

    # Find the user with the given API key
    user_data = find_user_by_api_key(api_key)
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid API key")

    # Find the function with the given function_key
    function = next(
        (f for f in user_data.get("functions", []) if f.get("function_key") == function_key),
        None,
    )
    if not function:
        raise HTTPException(status_code=404, detail="Function not found")

    # Get the version data
    version_data = function["version_map"].get(version)
    if not version_data:
        raise HTTPException(status_code=404, detail="Version not found")

    # Create a new call
    call_key = uuid.uuid4().hex
    call = {
        "call_key": call_key,
        "inputs": call_data.inputs,
        "outputs": call_data.outputs,
        "logs": call_data.logs if call_data.logs else [],
        "evaluation": {},
        "status": "pending",
        "timestamp": datetime.utcnow().isoformat(),
    }
    # Add call to version's calls
    version_data.setdefault("calls", []).append(call)

    # Save user data
    save_user(user_data)

    return {"message": "Call created successfully", "call_key": call_key}

@router.post("/update_call/{call_key}")
def update_call(call_key: str, request: Request, call_data: UpdateCallRequest = Body(...)):
    # Get the API key from headers
    api_key = request.headers.get("X-API-Key")
    if not api_key:
        raise HTTPException(status_code=401, detail="API key required")

    # Find the user with the given API key
    function = find_function_by_api_and_function_key(api_key, call_data.function_key)
    call = function["version_map"][call_data.version]["calls"]
    call = next((c for c in call if c.get("call_key") == call_key), None)
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")


    if call_data.inputs is not None:
        call['inputs'] = call_data.inputs
    if call_data.outputs is not None:
        call['outputs'] = call_data.outputs
    if call_data.logs is not None:
        call['logs'] = call_data.logs
    if call_data.evaluation is not None:
        call['evaluation'] = call_data.evaluation
    if call_data.status is not None:
        call['status'] = call_data.status

    # Save user data
    save_function(api_key, function)

    return {"message": "Call updated successfully"}

@router.post("/evaluate_call/{function_key}/{version}/{call_key}")
def evaluate_call(
    function_key: str,
    version: str,
    call_key: str,
    request: Request,
    data: UpdateCallRequest = Body(...),
):
    # Get the API key from headers
    api_key = request.headers.get("X-API-Key")
    if not api_key:
        raise HTTPException(status_code=401, detail="API key required")
    
    # get tier and if version tree is enabled
    user_data = find_user_by_api_key(api_key)
    tier = user_data.get("tier", "free")
    if not is_version_tree_enabled(tier):
        return {"evaluation": {}, "message": "Evaluation not allowed for this tier"}
    function = find_function_by_api_and_function_key(api_key, function_key)

    # Get the version data
    version_data = function["version_map"].get(version)
    if not version_data:
        raise HTTPException(status_code=404, detail="Version not found")
    
    # Evaluate the output if not a custom function and tier allows it
    eval = evaluate_output(
        function["task"],
        function["metrics"],
        data.inputs,
        data.outputs,
    )
    
    # save function_data
    # find call with call_key
    calls = version_data.get("calls", [])
    call = next((c for c in calls if c.get("call_key") == call_key), None)
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    
    if data.inputs is not None:
        call['inputs'] = data.inputs
    if data.outputs is not None:
        call['outputs'] = data.outputs
    if data.logs is not None:
        call['logs'] = data.logs
    if data.status is not None:
        call['status'] = data.status
    call['evaluation'] = eval
    
    # Save user data
    save_function(api_key, function)
    return {"evaluation": eval}