# main.py

from fastapi import FastAPI, HTTPException, Depends, status, Request, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import boto3
from datetime import datetime
import uuid
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from dotenv import load_dotenv
import os
import uvicorn
from Evaluation import evaluate_function, grade_output
from TestGeneration import generate_tests_from_schema
import secrets
from decimal import Decimal
import stripe
from fastapi.responses import JSONResponse

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

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")
STRIPE_PRICE_ID_PRO = os.getenv("STRIPE_PRICE_ID_PRO")
STRIPE_PRICE_ID_ENTERPRISE = os.getenv("STRIPE_PRICE_ID_ENTERPRISE")  # Add this for Enterprise pricing

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
        idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), GOOGLE_CLIENT_ID)
        email = idinfo['email'].lower()
        return email
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid token')

def get_user(username: str):
    response = user_table.get_item(Key={'username': username})
    if 'Item' not in response:
        raise HTTPException(status_code=404, detail="User not found")
    return response['Item']

def require_tier(tier_required: str):
    def decorator(username: str = Depends(verify_token)):
        user = get_user(username)
        tiers = ['free', 'Pro', 'Enterprise']
        user_tier = user.get('tier', 'free')
        if tiers.index(user_tier) < tiers.index(tier_required):
            raise HTTPException(
                status_code=403,
                detail=f"Requires {tier_required} tier."
            )
        return user
    return decorator

def get_max_tests(tier: str) -> int:
    if tier == 'free':
        return 5
    elif tier == 'Pro':
        return 50
    elif tier == 'Enterprise':
        return float('inf')  # No limit
    else:
        return 5  # Default to free limits

def is_version_tree_enabled(tier: str) -> bool:
    return tier in ['pro', 'enterprise']

def perform_prompt_optimization(prompt: str) -> str:
    import openai
    openai.api_key = os.getenv("OPENAI_API_KEY")
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "Optimize the following prompt for better performance:"},
            {"role": "user", "content": prompt}
        ],
        temperature=0.7,
    )
    optimized_prompt = response.choices[0].message.content.strip()
    return optimized_prompt

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

# Endpoint to handle Enterprise upgrade requests
class EnterpriseUpgradeRequest(BaseModel):
    email: str
    message: str

class CheckoutMetaData(BaseModel):
    tier: str

# Authentication endpoint
@app.post('/auth/login')
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
        response = user_table.get_item(Key={'username': email})
        if 'Item' not in response:
            # Create a new user
            user_api_key = secrets.token_hex(16)
            user_data = {
                'username': email,
                'functions': [],
                'api_key': user_api_key,
                'tier': 'free'  # Default tier
            }
            user_table.put_item(Item=user_data)
        else:
            user_data = response['Item']
            if 'api_key' not in user_data:
                # Generate API key for existing user if not present
                user_api_key = secrets.token_hex(16)
                user_data['api_key'] = user_api_key
                user_table.put_item(Item=user_data)
            if 'tier' not in user_data:
                user_data['tier'] = 'free'
                user_table.put_item(Item=user_data)
            user_api_key = user_data['api_key']
        return {
            "email": email,
            "api_key": user_api_key,
            "tier": user_data.get('tier', 'free')
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
    
@app.post('/create-checkout-session')
def create_checkout_session(user: str = Depends(verify_token), checkout_metadata: CheckoutMetaData = Body(...)):
    try:
        # Determine price ID based on tier
        if checkout_metadata.tier == 'pro':
            price_id = STRIPE_PRICE_ID_PRO
        else:
            raise HTTPException(status_code=400, detail="Invalid tier selected")
        
        # Create a Stripe Checkout Session
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[
                {
                    'price': price_id,
                    'quantity': 1,
                },
            ],
            mode='subscription',
            success_url=f"{os.getenv('FRONTEND_URL')}",
            cancel_url=f"{os.getenv('FRONTEND_URL')}",
            metadata={
                'username': user,
                'tier': checkout_metadata.tier
            }
        )
        return {"session": checkout_session}
    except Exception as e:
        print("ERROR:", repr(e), e)
        raise HTTPException(status_code=500, detail="Failed to create Stripe checkout session")
    
@app.post('/webhook')
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except stripe.error.SignatureVerificationError:
        print('Webhook signature verification failed.')
        return JSONResponse(status_code=400, content={"detail": "Invalid signature"})
    except Exception as e:
        print('Webhook error:', str(e))
        return JSONResponse(status_code=400, content={"detail": "Webhook error"})

    print('Webhook received:', event['type'])
    # Handle the checkout.session.completed event
    if event['type'] == 'checkout.session.completed':
        session_obj = event['data']['object']
        handle_checkout_session(session_obj)

    return JSONResponse(status_code=200, content={"detail": "Webhook received"})

def handle_checkout_session(session_obj):
    # Retrieve the metadata to get the username and tier
    username = session_obj.get('metadata', {}).get('username')
    tier = session_obj.get('metadata', {}).get('tier')
    print(f'Checkout session completed for {username} with tier {tier}')
    if not username or not tier:
        print('Username or tier not found in session metadata.')
        return

    try:
        # Update the user's tier in DynamoDB
        user_data = get_user(username)
        user_data['tier'] = tier
        user_table.put_item(Item=user_data)
        print(f'User {username} upgraded to {tier}.')
    except Exception as e:
        print(f'Error updating user tier: {str(e)}')

@app.post('/upgrade-enterprise')
def upgrade_enterprise(request: EnterpriseUpgradeRequest):
    # Handle the enterprise upgrade request
    try:
        enterprise_table = dynamodb.Table('enterprise_requests')
        enterprise_table.put_item(
            Item={
                'request_id': uuid.uuid4().hex,
                'email': request.email,
                'message': request.message,
                'timestamp': datetime.utcnow().isoformat()
            }
        )
        return {"message": "Enterprise upgrade request submitted successfully."}
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail="Failed to submit Enterprise upgrade request")
    
@app.post('/generate_tests')
def generate_tests_endpoint(request: GenerateTestsRequest, user: str = Depends(verify_token)):
    user_data = get_user(user)
    tier = user_data.get('tier', 'free')
    if tier != 'Enterprise':
        raise HTTPException(status_code=403, detail="Automated test generation is available for Enterprise tier only.")

    input_schema = request.in_schema
    num_tests = request.num_tests
    task = request.task
    generated_tests = generate_tests_from_schema(task, input_schema, num_tests)
    return {"tests": generated_tests}

# Endpoint to create a new function
@app.post('/users/{username}/functions')
def create_function(username: str, function: FunctionSchema, user_email: str = Depends(verify_token)):
    if username != user_email:
        raise HTTPException(status_code=403, detail="Cannot create functions for other users.")

    user_data = get_user(username)
    tier = user_data.get('tier', 'free')
    
    max_tests = get_max_tests(tier)
    if function.test_set and len(function.test_set) > max_tests:
        raise HTTPException(
            status_code=400,
            detail=f"Test set exceeds the maximum allowed for tier {tier}. Max tests: {int(max_tests) if max_tests != float('inf') else 'Unlimited'}"
        )

    functions = user_data.get('functions', [])

    # Check if function name already exists
    if any(f['name'] == function.name for f in functions):
        raise HTTPException(status_code=400, detail="Function name already exists")

    # Create the initial version tree or single version based on tier
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
        'test_set': function.test_set or [],
        'version_tree': version_tree,
        'function_key': function_key,
        'current_version': versionId  # Set the current version
    }

    functions.append(new_function)
    func_id = len(functions) - 1

    # Update the user data
    user_data['functions'] = functions
    user_table.put_item(Item=user_data)

    return {"message": "Function created successfully", "functionId": func_id, "versionId": versionId, "function_key": function_key}

@app.get('/users/{username}/function/{index}')
def get_function(username: str, index: int, user_email: str = Depends(verify_token)):
    if username != user_email:
        raise HTTPException(status_code=403, detail="Cannot access functions of other users.")
    
    user_data = get_user(username)
    functions = user_data.get('functions', [])
    if index >= len(functions):
        raise HTTPException(status_code=404, detail="Function not found")
    
    return {
        "function": functions[index]
    }

# Endpoint to update parameters and add a new version
@app.post('/users/{username}/functions/{function_index}/update_parameters')
def update_parameters(username: str, function_index: int, update: UpdateParametersSchema, user_email: str = Depends(verify_token)):
    if username != user_email:
        raise HTTPException(status_code=403, detail="Cannot update functions of other users.")
    
    user_data = get_user(username)
    functions = user_data.get('functions', [])

    # Find the function
    if function_index >= len(functions):
        raise HTTPException(status_code=404, detail="Function not found")
    function = functions[function_index]

    tier = user_data.get('tier', 'free')

    if is_version_tree_enabled(tier):
        print("VERSION TREE ENABLED")
        # Pro and Enterprise: Create a new version node
        def find_version_node(node, name):
            if node['name'] == name:
                return node
            for child in node.get('children', []):
                result = find_version_node(child, name)
                if result:
                    return result
            return None

        current_version_node = find_version_node(function['version_tree'], update.current_version_name)
        if not current_version_node:
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
        current_version_node.setdefault('children', []).append(new_version)

        # Update current_version to the new version
        function['current_version'] = new_version_name

        # Update DynamoDB
        user_table.put_item(Item=user_data)

        # Evaluate the new version if tests exist
        tests = function.get('test_set', [])
        if tests:
            print("TESTING", len(tests))
            eval_data = evaluate_function(function, new_version_name, tests, user_data['api_key'])
            def update_version_node(node, name, eval_data):
                if node['name'] == name:
                    node['evals'].extend(eval_data)
                    return True
                for child in node.get('children', []):
                    result = update_version_node(child, name, eval_data)
                    if result:
                        return True
                return False
            update_version_node(function['version_tree'], new_version_name, eval_data)

            # Update DynamoDB with evaluations
            user_table.put_item(Item=user_data)

        return {"message": "Parameters updated, new version created, and evaluation added successfully", "version": new_version_name}
    else:
        print("VERSION TREE DISABLED")
        # update specfic version

        # Find the version node
        def find_version_node(node, name):
            if node['name'] == name:
                return node
            for child in node.get('children', []):
                result = find_version_node(child, name)
                if result:
                    return result
            return None
        
        print("Current version name: ", update.current_version_name)
        
        version_node = find_version_node(function['version_tree'], update.current_version_name)
        if not version_node:
            raise HTTPException(status_code=404, detail="Version not found")
        
        # Update version node with new parameters
        version_node['prompt'] = update.new_prompt
        version_node['model'] = update.new_model
        version_node['temperature'] = Decimal(str(update.new_temperature))

        tests = function.get('test_set', [])
        if tests:
            eval_data = evaluate_function(function, update.current_version_name, tests, user_data['api_key'])
            version_node['evals']=eval_data

        # Update DynamoDB with evaluations
        user_table.put_item(Item=user_data)

        # Evaluate the updated version if tests exist


        return {"message": "Function parameters updated successfully"}

# Endpoint to deploy a version
@app.post('/users/{username}/functions/{function_index}/deploy_version')
def deploy_version(username: str, function_index: int, deploy: DeployVersionSchema, user_email: str = Depends(verify_token)):
    if username != user_email:
        raise HTTPException(status_code=403, detail="Cannot deploy functions of other users.")
    
    user_data = get_user(username)
    functions = user_data.get('functions', [])

    # Find the function
    if function_index >= len(functions):
        raise HTTPException(status_code=404, detail="Function not found")
    function = functions[function_index]

    tier = user_data.get('tier', 'free')

    if is_version_tree_enabled(tier):
        # Pro and Enterprise: Navigate to the version node to ensure it exists
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
    else:
        # free tier: Only 'main' version can be deployed
        # if deploy.version_name != 'main':
        #     raise HTTPException(status_code=400, detail="free tier can only deploy the main version.")
        
        # function['current_version'] = 'main'

        # Update DynamoDB
        user_table.put_item(Item=user_data)

        return {"message": "Main version deployed successfully"}

# Endpoint to get user data
@app.get('/users/{username}')
def get_user_data(username: str, user_email: str = Depends(verify_token)):
    if username != user_email:
        raise HTTPException(status_code=403, detail="Cannot access data of other users.")
    user_data = get_user(username)
    return user_data

# Evaluate function version
@app.post('/users/{username}/function/{func_index}/version/{version_name}/evaluate')
def evaluate_function_version(username: str, func_index: int, version_name: str, user_email: str = Depends(verify_token)):
    if username != user_email:
        raise HTTPException(status_code=403, detail="Cannot evaluate functions of other users.")
    
    user_data = get_user(username)
    functions = user_data.get('functions', [])
    if func_index >= len(functions):
        raise HTTPException(status_code=404, detail="Function not found")
    
    function = functions[func_index]
    version_tree = function.get('version_tree', {})
    
    def find_version_node(node, name):
        if node['name'] == name:
            return node
        for child in node.get('children', []):
            result = find_version_node(child, name)
            if result:
                return result
        return None

    version_node = find_version_node(version_tree, version_name)
    if not version_node:
        raise HTTPException(status_code=404, detail="Version not found")
    
    tests = function.get('test_set', [])
    if not tests:
        raise HTTPException(status_code=400, detail="Test set is empty")
    
    eval_data = evaluate_function(function, version_name, tests, user_data['api_key'])
    print("Eval data: ", eval_data)
    
    version_node['evals'].extend(eval_data)
    
    # Update DynamoDB
    user_table.put_item(Item=user_data)
    
    return {"message": "Evaluation added successfully"}

# Endpoint to evaluate single input output pair
@app.post('/evaluate')
def evaluate_input_output_pair(input_data: EvaluationInput):
    task = input_data.task
    input_payload = input_data.input
    output_schema = input_data.output_schema
    output_payload = input_data.output
    version = input_data.version
    function_key = input_data.function_key
    api_key = input_data.api_key

    # Find user with api_key
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

    # Add eval to version node
    def add_eval(node, name, eval_data):
        if node['name'] == name:
            node['evals'].append(eval_data)
            return True
        for child in node.get('children', []):
            result = add_eval(child, name, eval_data)
            if result:
                return True
        return False
    
    # if user if free only add the input and output to evals and return
    tier = user_data.get('tier', 'free')
    print(tier)
    if tier == 'free':
        log_data = {
            "input": input_payload,
            "output": output_payload,
        }
        version_tree = function.get('version_tree', {})
        add_eval(version_tree, version, log_data)
        user_table.put_item(Item=user_data)
        return {"message": "success"}

    eval_result = grade_output(task, input_payload, output_schema, output_payload)
    
    version_tree = function.get('version_tree', {})
    
    add_eval(version_tree, version, eval_result)
    
    # If input not in function's test_set, add it
    input_exists = False
    for index, other_input in enumerate(function.get('test_set', [])):
        if other_input['input'] == input_payload:
            input_exists = True
            break
    if not input_exists:
        # Add input to test_set
        function['test_set'].append({
            'input': input_payload,
        })
    
    # Update function in user_data
    user_table.put_item(Item=user_data)

    print("done evaluating")
    
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
    version_name = version if version and version.lower() != "none" else function.get('current_version')

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

    version_node = find_version_node(function.get('version_tree', {}), version_name)
    if not version_node:
        raise HTTPException(status_code=404, detail="Version not found")

    # Return the function parameters from the version node
    return {
        'prompt': version_node['prompt'],
        'model': version_node['model'],
        'temperature': float(version_node['temperature']),
        'input_schema': function['input_schema'],
        'output_schema': function['output_schema'],
        'version': version_name,
        'task': function['task']
    }

if __name__ == "__main__":
    uvicorn.run(app, host=os.getenv("HOST"), port=int(os.getenv("PORT")))
