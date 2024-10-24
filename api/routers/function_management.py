# api/routers/function_management.py

from fastapi import APIRouter, HTTPException, Depends, Body
from typing import Any
from models import (
    FunctionSchema,
    UpdateParametersSchema,
    DeployVersionSchema,
    EnterpriseUpgradeRequest,
)
from utils import verify_token, get_user, save_user, get_max_tests, is_version_tree_enabled, dynamodb
import uuid
from datetime import datetime
from decimal import Decimal
from Evaluation import evaluate_function
from config import AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY

router = APIRouter()

enterprise_table = dynamodb.Table("enterprise_requests")


@router.post("/users/{username}/functions")
def create_function(
    username: str,
    function: FunctionSchema,
    user_email: str = Depends(verify_token),
):
    if username != user_email:
        raise HTTPException(
            status_code=403, detail="Cannot create functions for other users."
        )

    user_data = get_user(username)
    tier = user_data.get("tier", "free")

    max_tests = get_max_tests(tier)
    if function.test_set and len(function.test_set) > max_tests:
        raise HTTPException(
            status_code=400,
            detail=f"Test set exceeds the maximum allowed for tier {tier}. Max tests: {int(max_tests) if max_tests != float('inf') else 'Unlimited'}",
        )

    functions = user_data.get("functions", [])

    # Check if function name already exists
    if any(f["name"] == function.name for f in functions):
        raise HTTPException(status_code=400, detail="Function name already exists")

    # Generate function key (used as API key for the function)
    function_key = uuid.uuid4().hex

    versionId = uuid.uuid4().hex

    if function.type == "flow":
        # Custom function logic
        version_tree = {"name": versionId, "children": []}
        version_map = {
            versionId: {
                "parameters": function.parameters or {},
                "calls": [],
                "date": datetime.now().isoformat(),
            }
        }
    else:
        # Chat completion function logic
        version_tree = {"name": versionId, "children": []}
        version_map = {
            versionId: {
                "parameters": {
                    "prompt": function.prompt,
                    "model": function.model,
                    "temperature": Decimal(str(function.temperature)),
                },
                "calls": [],
                "date": datetime.now().isoformat(),
            }
        }

    # Add the new function
    new_function = {
        "name": function.name,
        "task": function.task,
        "type": function.type,
        "input_schema": function.input_schema,
        "output_schema": function.output_schema,
        "test_set": function.test_set or [],
        "version_tree": version_tree,
        "version_map": version_map,
        "function_key": function_key,
        "current_version": versionId,  # Set the current version
        "metrics": function.metrics or [],
    }

    functions.append(new_function)
    func_id = len(functions) - 1

    # Update the user data
    user_data["functions"] = functions
    save_user(user_data)

    # Evaluate the new version if tests exist
    tests = new_function.get("test_set", [])
    if tests and function.type != "flow":
        eval_data = evaluate_function(new_function, versionId, tests, user_data["api_key"])
        new_function["version_map"][versionId]["calls"].extend(eval_data)
        # Update DynamoDB with evaluations
        save_user(user_data)

    return {
        "message": "Function created successfully",
        "functionId": func_id,
        "versionId": versionId,
        "function_key": function_key,
    }


@router.get("/users/{username}/function/{function_key}")
def get_function(
    username: str, function_key: str, user_email: str = Depends(verify_token)
):
    if username != user_email:
        raise HTTPException(
            status_code=403, detail="Cannot access functions of other users."
        )

    user_data = get_user(username)
    functions = user_data.get("functions", [])
    
    # Find the function
    function = next(
        (f for f in functions if f.get("function_key") == function_key), None
    )
    if not function:
        raise HTTPException(status_code=404, detail="Function not found")
    
    # print("function type", function["type"])

    return {"function": function}


@router.post("/users/{username}/functions/{function_key}/update_parameters")
def update_parameters(
    username: str,
    function_key: str,
    update: UpdateParametersSchema,
):

    user_data = get_user(username)
    functions = user_data.get("functions", [])

    # Find the function

    function_index = next(
        (i for i, f in enumerate(functions) if f.get("function_key") == function_key), None
    )
    if function_index is None:
        raise HTTPException(status_code=404, detail="Function not found")
    
    function = functions[function_index]

    tier = user_data.get("tier", "free")

    # print("tier", tier)
    if is_version_tree_enabled(tier):
        # Pro and Enterprise: Create a new version node
        versionId = uuid.uuid4().hex
        # print("versionId", versionId)

        def update_version_tree(node, name, new_node):
            if node["name"] == name:
                node["children"].append(new_node)
                return
            for child in node.get("children", []):
                update_version_tree(child, name, new_node)

        # Create new version node
        new_version_node = {"name": versionId, "children": []}

        # add version to children of current version node
        update_version_tree(function["version_tree"], update.version, new_version_node)
        

        # Create new version data
        for key, value in update.new_parameters.items():
            if type(value) == float:
                update.new_parameters[key] = Decimal(str(value))
        
        version_data = {
            "parameters": update.new_parameters or {},
            "calls": [],
            "date": datetime.now().isoformat(),
        }

        function["version_map"][versionId] = version_data


        # Evaluate the new version if tests exist
        tests = function.get("test_set", [])
        if tests and function["type"] != "flow":
            eval_data = evaluate_function(
                function, versionId, tests, user_data["api_key"]
            )
            function["version_map"][versionId]["calls"].extend(eval_data)
            # Update DynamoDB with evaluations
            
        save_user(user_data)
        return {
            "message": "Parameters updated, new version created successfully",
            "version": versionId,
        }
    else:
        # free tier: Update the existing version directly
        versionId = update.version
        version_data = function["version_map"].get(versionId)
        if not version_data:
            raise HTTPException(status_code=404, detail="Version not found")

        if function["type"] == "flow":
            version_data["parameters"] = update.new_parameters or version_data.get("parameters", {})
        else:
            version_data["prompt"] = update.new_prompt or version_data.get("prompt")
            version_data["model"] = update.new_model or version_data.get("model")
            version_data["temperature"] = update.new_temperature if update.new_temperature else version_data.get("temperature")

            # Evaluate the updated version if tests exist
            tests = function.get("test_set", [])
            if tests:
                eval_data = evaluate_function(
                    function, versionId, tests, user_data["api_key"]
                )
                version_data["calls"] = eval_data

        # Update DynamoDB
        save_user(user_data)

        return {"message": "Function parameters updated successfully"}


@router.post("/users/{username}/functions/{function_key}/deploy_version")
def deploy_version(
    username: str,
    function_key: str,
    version_data: DeployVersionSchema
    ):
    version = version_data.version
    user_data = get_user(username)
    functions = user_data.get("functions", [])

    # Find the function

    function = next(
        (f for f in functions if f.get("function_key") == function_key), None
    )
    if not function:
        raise HTTPException(status_code=404, detail="Function not found")

    tier = user_data.get("tier", "free")

    # Navigate to the version node to ensure it exists
    def find_version_node(node, name):
        if node["name"] == name:
            return node
        for child in node.get("children", []):
            result = find_version_node(child, name)
            if result:
                return result
        return None

    version_node = find_version_node(function["version_tree"], version)
    if not version_node:
        raise HTTPException(status_code=404, detail="Version not found")

    # Set the function's current_version to the specified version
    function["current_version"] = version

    # Update DynamoDB
    save_user(user_data)

    return {"message": f"Version {version} deployed successfully"}


@router.get("/users/{username}")
def get_user_data(username: str, user_email: str = Depends(verify_token)):
    if username != user_email:
        raise HTTPException(
            status_code=403, detail="Cannot access data of other users."
        )
    user_data = get_user(username)
    return user_data


@router.post("/upgrade-enterprise")
def upgrade_enterprise(request: EnterpriseUpgradeRequest):
    # Handle the enterprise upgrade request
    try:
        enterprise_table.put_item(
            Item={
                "request_id": uuid.uuid4().hex,
                "email": request.email,
                "message": request.message,
                "timestamp": datetime.utcnow().isoformat(),
            }
        )
        return {"message": "Enterprise upgrade request submitted successfully."}
    except Exception as e:
        print(e)
        raise HTTPException(
            status_code=500, detail="Failed to submit Enterprise upgrade request"
        )
