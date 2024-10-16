
from decimal import Decimal
from openai import OpenAI
import os
from dotenv import load_dotenv
from Prompts import test_generation_prompt
import json

load_dotenv()

MODEL = "gpt-4o-mini"

def generate_tests_from_schema(task, input_schema, num_tests):
    # def generate_single_test():
    #     client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    #     print('input_schema', input_schema)
    #     cleaned_schema = convert_input_schema_to_openai_function_definition(input_schema)
    #     print('cleaned_schema', cleaned_schema)
    #     response = client.chat.completions.create(
    #         model=MODEL,
    #         messages=[
    #             {"role": "system", "content": test_generation_prompt},
    #             {"role": "user", "content": f"Task:\n{task}"}
    #         ],
    #         response_format={
    #             "type": "json_schema",
    #             "json_schema": cleaned_schema
    #         },
    #         temperature = 1
    #     )
    #     test_input = response.choices[0].message.content
    #     return json.loads(test_input)
    
    # with concurrent.futures.ThreadPoolExecutor() as executor:
    #     tests = list(executor.map(lambda _: generate_single_test(), range(num_tests)))
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    cleaned_schema = convert_input_schema_to_openai_function_definition(input_schema, num_tests)
    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": test_generation_prompt},
            {"role": "user", "content": f"Task:\n{task}"}
        ],
        response_format={
            "type": "json_schema",
            "json_schema": cleaned_schema
        },
        temperature = 1
    )
    tests = json.loads(response.choices[0].message.content)
    tests = [tests[f"test_{i}"] for i in range(num_tests)]
    return tests

def convert_input_schema_to_openai_function_definition(input_schema, num_tests=1):
    new_schema = {}
    def clean_schema(schema):
        if isinstance(schema, dict):
            schema = schema.copy()
            if "title" in schema:
                schema.pop("title", None)
            if 'desiredProperties' in schema:
                schema.pop('desiredProperties', None)
            if 'properties' in schema:
                schema['properties'] = {k: clean_schema(v) for k, v in schema['properties'].items()}
            if 'items' in schema:
                schema['items'] = clean_schema(schema['items'])
            if 'required' not in schema and 'properties' in schema:
                schema['required'] = list(schema['properties'].keys())
            schema['additionalProperties'] = False
        return schema
    
    cleaned_schema = clean_schema(input_schema)
    print(cleaned_schema)
    new_schema['schema'] = {
        "type": "object",
        "properties": {f"test_{i}": cleaned_schema for i in range(num_tests)},
        "required": [f"test_{i}" for i in range(num_tests)],
        "additionalProperties": False
    }
    # cleaned_schema = clean_schema(input_schema)
    new_schema['name'] = 'test_input'
    new_schema['strict'] = True
    return new_schema