# api/models.py

from pydantic import BaseModel
from typing import List, Dict, Any, Optional


class EvaluationInput(BaseModel):
    task: str
    input: Dict[str, Any]
    output_schema: Dict[str, Any]
    output: Dict[str, Any]
    version: str
    function_key: str
    api_key: str


class GenerateTestsRequest(BaseModel):
    in_schema: Dict[str, Any]
    num_tests: int = 1
    task: str


class Attribute(BaseModel):
    name: str
    type: str
    metrics: Optional[List[str]] = None
    properties: Optional[List[Any]] = None
    items: Optional[List[Any]] = None


class FunctionSchema(BaseModel):
    name: str
    task: str
    type: str  # 'chat_completion' or 'custom_function'
    input_schema: Optional[Dict[str, Any]] = None
    output_schema: Optional[Dict[str, Any]] = None
    parameters: Optional[Dict[str, Any]] = None  # For custom functions
    test_set: Optional[List[Dict[str, Any]]] = None
    model: Optional[str] = None
    prompt: Optional[str] = None
    temperature: Optional[float] = None
    metrics: Optional[List[str]] = None


class UpdateParametersSchema(BaseModel):
    new_prompt: Optional[str] = None
    new_model: Optional[str] = None
    new_temperature: Optional[float] = None
    new_parameters: Optional[Dict[str, Any]] = None  # For custom functions
    version: Optional[str] = None


class DeployVersionSchema(BaseModel):
    version: str


class EnterpriseUpgradeRequest(BaseModel):
    email: str
    message: str


class CheckoutMetaData(BaseModel):
    tier: str


class ParameterUpdateRequest(BaseModel):
    value: Any

class EvaluationOutput(BaseModel):
    analysis: str
    scores: Dict[str, int]

class EvaluateCallInput(BaseModel):
    input: Dict[str, Any]
    output: Dict[str, Any]

class CreateCallRequest(BaseModel):
    inputs: Dict[str, Any]
    outputs: Dict[str, Any]
    logs: Optional[List[Dict[str, Any]]] = None

class UpdateCallRequest(BaseModel):
    inputs: Optional[Dict[str, Any]] = None
    outputs: Optional[Dict[str, Any]] = None
    logs: Optional[List[Dict[str, Any]]] = None
    evaluation: Optional[Dict[str, Any]] = None
    status: Optional[str] = None
    timestamp: Optional[str] = None
    function_key: Optional[str] = None
    version: Optional[str] = None
