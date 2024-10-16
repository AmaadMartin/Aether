# main.py

from fastapi import FastAPI, HTTPException, Depends, status, Request, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import boto3
from datetime import datetime
import uuid
from google.oauth2 import id_token
from google.auth.transport import requests
from dotenv import load_dotenv
import os
import uvicorn
from Evaluation import evaluate_function, grade_output
from TestGeneration import generate_tests_from_schema
import secrets
from decimal import Decimal
load_dotenv()

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

session = boto3.Session(
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
)

# Initialize DynamoDB resource
dynamodb = session.resource('dynamodb', region_name='us-east-1')
user_table = dynamodb.Table('userbase')

# Your Google Client ID
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

oauth2_scheme = HTTPBearer()

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(oauth2_scheme)):
    try:
        token = credentials.credentials
        idinfo = id_token.verify_oauth2_token(token, requests.Request(), GOOGLE_CLIENT_ID)
        email = idinfo['email']
        return email
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid token')

class GenerateTestsRequest(BaseModel):
    in_schema: dict
    num_tests: int = 1
    task: str

# Models for creating a function
class Attribute(BaseModel):
    name: str
    type: str
    desired_properties: list = None
    properties: list = None
    items: list = None

class FunctionSchema(BaseModel):
    name: str
    task: str
    input_schema: dict
    output_schema: dict
    test_set: list = None
    model: str
    prompt: str
    temperature: float

# Model for updating parameters
class UpdateParametersSchema(BaseModel):
    current_version_name: str
    new_prompt: str
    new_model: str
    new_temperature: float

# Model for deploying a version
class DeployVersionSchema(BaseModel):
    version_name: str

class EvaluationInput(BaseModel):
    task: str
    input: dict
    output_schema: dict
    output: dict
    version: str
    function_key: str
    api_key: str

# Authentication endpoint
@app.post('/auth/login')
def login(data: dict):
    token = data.get("token")
    if not token:
        raise HTTPException(status_code=400, detail="Token is required")

    try:
        # Verify the token
        idinfo = id_token.verify_oauth2_token(
            token, requests.Request(), os.getenv("GOOGLE_CLIENT_ID")
        )

        # Get user info
        email = idinfo["email"]
        email = email.lower()
        print(email)

        # Check if user exists
        response = user_table.get_item(Key={'username': email})
        if 'Item' not in response:
            # Create a new user
            user_api_key = secrets.token_hex(16)
            user_data = {
                'username': email,
                'functions': [],
                'api_key': user_api_key
            }
            user_table.put_item(Item=user_data)
        else:
            user_data = response['Item']
            if 'api_key' not in user_data:
                # Generate API key for existing user if not present
                user_api_key = secrets.token_hex(16)
                user_data['api_key'] = user_api_key
                user_table.put_item(Item=user_data)
            else:
                user_api_key = user_data['api_key']
        return {"email": email, "api_key": user_api_key}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
    
@app.post('/generate_tests')
def generate_tests_endpoint(request: GenerateTestsRequest):
    input_schema = request.in_schema
    num_tests = request.num_tests
    task = request.task
    generated_tests = generate_tests_from_schema(task, input_schema, num_tests)
    return {"tests": generated_tests}

# Endpoint to create a new function
@app.post('/users/{username}/functions')
def create_function(username: str, function: FunctionSchema):
    # Fetch user data
    response = user_table.get_item(Key={'username': username})
    if 'Item' not in response:
        # If user does not exist, create new user
        user_data = {'username': username, 'functions': []}
    else:
        user_data = response['Item']

    functions = user_data.get('functions', [])

    # Check if function name already exists
    if any(f['name'] == function.name for f in functions):
        raise HTTPException(status_code=400, detail="Function name already exists")

    # Create the initial version tree with a random UUID
    version_tree = {
        'name': uuid.uuid4().hex,
        'date': datetime.now().isoformat(),
        'prompt': function.prompt,
        'model': function.model,
        'temperature': Decimal(str(function.temperature)),
        'children': [],
        'evals': []
    }
    versionId = version_tree['name']

    # Generate function key (used as API key for the function)
    function_key = secrets.token_hex(16)

    # Add the new function
    new_function = {
        'name': function.name,
        'task': function.task,
        'input_schema': function.input_schema,
        'output_schema': function.output_schema,
        'test_set': function.test_set,
        'version_tree': version_tree,
        'function_key': function_key,
        'current_version': versionId  # Set the current version to the first version created
    }

    functions.append(new_function)
    func_id = len(functions) - 1

    # Update the user data
    user_data['functions'] = functions
    user_table.put_item(Item=user_data)

    return {"message": "Function created successfully", "functionId": func_id, "versionId": versionId, "function_key": function_key}

@app.get('/users/{username}/function/{index}')
def get_function(username: str, index: int):
    response = user_table.get_item(Key={'username': username})
    if 'Item' not in response:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_data = response['Item']
    functions = user_data.get('functions', [])
    if index >= len(functions):
        raise HTTPException(status_code=404, detail="Function not found")
    
    response = {
        "function": functions[index]
    }
    return response

# Endpoint to update parameters and add a new version
@app.post('/users/{username}/functions/{function_index}/update_parameters')
def update_parameters(username: str, function_index: int, update: UpdateParametersSchema):
    # Fetch user data
    response = user_table.get_item(Key={'username': username})
    if 'Item' not in response:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_data = response['Item']
    functions = user_data.get('functions', [])

    # Find the function
    if function_index >= len(functions):
        raise HTTPException(status_code=404, detail="Function not found")
    function = functions[function_index]

    # Navigate to the current version node
    def find_version_node(node, name):
        if node['name'] == name:
            return node
        for child in node.get('children', []):
            result = find_version_node(child, name)
            if result:
                return result
        return None

    current_version = find_version_node(function['version_tree'], update.current_version_name)
    if not current_version:
        raise HTTPException(status_code=404, detail="Version not found")

    # Generate new version name using UUID
    new_version_name = uuid.uuid4().hex

    # Create new version node with updated parameters
    new_version = {
        'name': new_version_name,
        'date': datetime.now().isoformat(),
        'prompt': update.new_prompt,
        'model': update.new_model,
        'temperature': Decimal(str(update.new_temperature)),
        'children': [],
        'evals': []
    }

    # Add new version as child
    current_version.setdefault('children', []).append(new_version)

    # Update DynamoDB
    user_table.put_item(Item=user_data)

    # # evaluate funciton and update versions evals   
    # tests = function['test_set']
    # if not tests:
    #     raise HTTPException(status_code=400, detail="Test set is empty")
    
    # eval_data = evaluate_function(function, new_version, tests, user_data['api_key'])
    # print("Eval data: ", eval_data)
    # def update_version_node(node, name, eval_data):
    #     if node['name'] == name:
    #         node['evals'] += eval_data
    #         return True
    #     for child in node.get('children', []):
    #         result = update_version_node(child, name, eval_data)
    #         if result:
    #             return True
    #     return False
    
    # update_version_node(function['version_tree'], new_version_name, eval_data)

    return {"message": "Parameters updated, new version created, and evaluation added successfully", "version": new_version_name}

# Endpoint to deploy a version
@app.post('/users/{username}/functions/{function_index}/deploy_version')
def deploy_version(username: str, function_index: int, deploy: DeployVersionSchema):
    # Fetch user data
    response = user_table.get_item(Key={'username': username})
    if 'Item' not in response:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_data = response['Item']
    functions = user_data.get('functions', [])

    # Find the function
    if function_index >= len(functions):
        raise HTTPException(status_code=404, detail="Function not found")
    function = functions[function_index]

    # Navigate to the version node to ensure it exists
    def find_version_node(node, name):
        if node['name'] == name:
            return node
        for child in node.get('children', []):
            result = find_version_node(child, name)
            if result:
                return result
        return None

    version_node = find_version_node(function['version_tree'], deploy.version_name)
    if not version_node:
        raise HTTPException(status_code=404, detail="Version not found")

    # Set the function's current_version to the specified version
    function['current_version'] = deploy.version_name

    # Update DynamoDB
    user_table.put_item(Item=user_data)

    return {"message": f"Version {deploy.version_name} deployed successfully"}

# Endpoint to get user data
@app.get('/users/{username}')
def get_user_data(username: str):
    print("Getting user data for: ", username)
    response = user_table.get_item(Key={'username': username})
    if 'Item' not in response:
        raise HTTPException(status_code=404, detail="User not found")
    return response['Item']

# Evaluate function version
@app.post('/users/{username}/function/{func_index}/version/{version_name}/evaluate')
def evaluate_function_version(username: str, func_index: int, version_name: str):
    response = user_table.get_item(Key={'username': username})
    if 'Item' not in response:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_data = response['Item']
    functions = user_data.get('functions', [])
    if func_index >= len(functions):
        raise HTTPException(status_code=404, detail="Function not found")
    
    function = functions[func_index]
    version_tree = function['version_tree']
    def find_version_node(node, name):
        if node['name'] == name:
            return node
        for child in node.get('children', []):
            result = find_version_node(child, name)
            if result:
                return result
        return None

    # current_version = find_version_node(version_tree, version_name)
    # if not current_version:
    #     raise HTTPException(status_code=404, detail="Version not found")
    
    tests = function['test_set']
    if not tests:
        raise HTTPException(status_code=400, detail="Test set is empty")
    
    eval_data = evaluate_function(function, version_name, tests, user_data['api_key'])
    print("Eval data: ", eval_data)
    def update_version_node(node, name, eval_data):
        if node['name'] == name:
            node['evals'] += eval_data
            return True
        for child in node.get('children', []):
            result = update_version_node(child, name, eval_data)
            if result:
                return True
        return False
    
    update_version_node(version_tree, version_name, eval_data)

    user_table.put_item(Item=user_data)

    return {"message": "Evaluation added successfully"}

# Endpoint to evaluate single input output pair
@app.post('/evaluate')
def evaluate_input_output_pair(input_data: EvaluationInput):
    # print(dict(input_data))
    task = input_data.task
    input = input_data.input
    output_schema = input_data.output_schema
    output = input_data.output
    version = input_data.version
    function_key = input_data.function_key
    api_key = input_data.api_key
    # print("params: ", task, input, output_schema, output, version, function_key, api_key)
    eval = grade_output(task, input, output_schema, output)
    # print("Eval: ", eval)

    # add eval to version node
    def add_eval(node, name, eval_data):
        if node['name'] == name:
            node['evals'].append(eval_data)
            return True
        for child in node.get('children', []):
            result = add_eval(child, name, eval_data)
            if result:
                return True
        return False
    
    # find user with api_key
    scan_kwargs = {
        'FilterExpression': 'api_key = :api_key',
        'ExpressionAttributeValues': {
            ':api_key': api_key
        }
    }
    response = user_table.scan(**scan_kwargs)
    if 'Items' not in response or len(response['Items']) == 0:
        print("Invalid API key")
        raise HTTPException(status_code=401, detail="Invalid API key")
    user_data = response['Items'][0]

    functions = user_data.get('functions', [])
    function = next((f for f in functions if f.get('function_key') == function_key), None)
    if not function:
        print("Function not found")
        raise HTTPException(status_code=404, detail="Function not found")
    
    version_tree = function['version_tree']
    
    add_eval(version_tree, version, eval)

    # if input not in function's test_set add it
    input_exists = False
    for index, other_input in enumerate(function['test_set']):
        print("other_input", other_input)
        print("input", input)
        print("types", type(other_input), type(input))
        if other_input == input:
            input_exists = True
            break
        if type(other_input) == str:
            # remove string inputs
            function['test_set'].pop(index)
    if not input_exists:
        # add input to test_set using aws sdk
        function['test_set'].append({
            'input': input,
        })
        print("input added to test_set", input)

    # update function in user_data
    user_table.put_item(Item=user_data)

    

    print("done evaluating")
    
    # add evaluation to version node
    return {"message": "success"}

# Endpoint to get function parameters for function call
@app.get('/function_call/{function_key}/{version}')
@app.get('/function_call/{function_key}')
def get_function_parameters(function_key: str, request: Request, version: str = None):
    api_key = request.headers.get('X-API-Key')
    if not api_key:
        raise HTTPException(status_code=401, detail="API key missing")
    
    # Find the user with this API key
    scan_kwargs = {
        'FilterExpression': 'api_key = :api_key',
        'ExpressionAttributeValues': {
            ':api_key': api_key
        }
    }
    response = user_table.scan(**scan_kwargs)
    if 'Items' not in response or len(response['Items']) == 0:
        raise HTTPException(status_code=401, detail="Invalid API key")
    user_data = response['Items'][0]

    # Find the function with this function_key
    functions = user_data.get('functions', [])
    function = next((f for f in functions if f.get('function_key') == function_key), None)
    if not function:
        raise HTTPException(status_code=404, detail="Function not found")

    # Determine the version to use
    version_name = version if version != "None" else function.get('current_version')

    if not version_name:
        raise HTTPException(status_code=400, detail="Version not specified and no current version set")

    # Navigate to the version node
    def find_version_node(node, name):
        if node['name'] == name:
            return node
        for child in node.get('children', []):
            result = find_version_node(child, name)
            if result:
                return result
        return None

    version_node = find_version_node(function['version_tree'], version_name)
    if not version_node:
        raise HTTPException(status_code=404, detail="Version not found")

    # Return the function parameters from the version node
    return {
        'prompt': version_node['prompt'],
        'model': version_node['model'],
        'temperature': version_node['temperature'],
        'input_schema': function['input_schema'],
        'output_schema': function['output_schema'],
        'version': version_name,
        'task': function['task']
    }

if __name__ == "__main__":
    uvicorn.run(app, host=os.getenv("HOST"), port=int(os.getenv("PORT")))