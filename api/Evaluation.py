# Evaluation.py

from decimal import Decimal
from openai import OpenAI
import os
from dotenv import load_dotenv
from Prompts import evaluation_prompt
import json
import sys
import concurrent.futures
sys.path.insert(0, "../library")
from Aether import AetherClient

load_dotenv()

client = OpenAI(api_key = os.getenv("OPENAI_API_KEY"))
MODEL = "gpt-4o-mini"

def evaluate_function(function, version, tests, user_api_key):
    output_schema = function['output_schema']
    BATCH_SIZE = 3  # Set the batch size as needed

    def process_test(test):
        aether = AetherClient(user_api_key, os.getenv("OPENAI_API_KEY"))
        input_data = test['input']
        # print("THIS IS THE INPUT DATA", input_data)
        output = aether(function["function_key"], input_data, version=version, for_eval=True)
        return grade_output(function, input_data, output_schema, output)

    output = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=BATCH_SIZE) as executor:
        for i in range(0, len(tests), BATCH_SIZE):
            batch = tests[i:i + BATCH_SIZE]
            output.extend(executor.map(process_test, batch))
    return output

def grade_output(task, input, output_schema, output):
    response_format = convert_output_schema_to_openai_function_definition(output_schema)

    # get random seed for prompt
    # seed = Decimal(os.urandom(2).hex()) / Decimal(0xFFFF)
        
    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": evaluation_prompt()},
            {"role": "user", "content": f"task:{str(task)}\n input: {str(input)} output: {str(output)}"}
        ],
        response_format={
            "type": "json_schema",
            "json_schema": response_format
        }
    )
    print("response", response)

    output = response.choices[0].message.content

    response = {
        "input": input,
        "output": json.loads(output)
    }
    print("formatted response", response)
    return response


def convert_output_schema_to_openai_function_definition(output_schema):
    # Remove 'metrics' fields and 'title'
    print('output_schema', output_schema)
    cleaned_schema = {}
    def clean_schema(schema):
        if isinstance(schema, dict):
            old_schema = schema.copy()
            schema = schema.copy()
            schema.pop('title', None)
            if 'description' in schema:
                schema['metrics'] = schema.pop('description')
            if 'desiredProperties' in schema:
                schema['metrics'] = schema.pop('desiredProperties')
            if 'properties' in schema:
                schema['properties'] = {k: clean_schema(v) for k, v in schema['properties'].items()}
            if 'items' in schema:
                schema['items'] = clean_schema(schema['items'])
            if 'required' not in schema and 'properties' in schema:
                schema['required'] = list(schema['properties'].keys())
                schema['properties']['reasoning'] = {'type': 'string'}
                schema['required']+= ['reasoning']
            if 'metrics' in schema :
                schema['type'] = 'object'
                schema['properties'] = {}
                schema['properties']['models_output'] = old_schema
                schema['properties']['scores'] = {'type': 'object'}
                schema['properties']['scores']['properties'] = {k: {'type': 'number'} for k in schema['metrics']}
                schema['properties']['scores']['additionalProperties'] = False
                schema['properties']['scores']['required'] = schema['metrics']
                schema.pop('metrics', None)
                schema['properties']['reasoning'] = {'type': 'string'}
                schema['required'] = ['scores', 'models_output', 'reasoning']
                schema['additionalProperties'] = False
            # if "type" in schema:
            #     if schema["type"] == "object":
            #         schema["additionalProperties"] = False
        return schema

    cleaned_schema['schema'] = clean_schema(output_schema)
    cleaned_schema['name'] = 'evaluation'
    cleaned_schema['strict'] = True
    print("evaluation schema", cleaned_schema)
    return cleaned_schema