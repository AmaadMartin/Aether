# AetherClient.py
import requests
import json
from openai import OpenAI
import jsonschema

class AetherClient:
    def __init__(self, api_key, openai_api_key, base_url="http://localhost:8000"):
        self.api_key = api_key
        self.openai_api_key = openai_api_key
        self.base_url = base_url
        self.openai = OpenAI(api_key = self.openai_api_key)

    def __call__(self, function_key, input_json):
        return self.call_function(function_key, input_json)

    def call_function(self, function_key, input_json):
        # Get function parameters
        headers = {'X-API-Key': self.api_key}
        response = requests.get(f"{self.base_url}/function_call/{function_key}", headers=headers)
        if response.status_code != 200:
            raise Exception(f"Error retrieving function parameters: {response.text}")
        function_params = response.json()

        # Validate input JSON against input schema
        input_schema = function_params['input_schema']
        try:
            jsonschema.validate(instance=input_json, schema=input_schema)
        except jsonschema.exceptions.ValidationError as e:
            raise Exception(f"Input validation error: {str(e)}")

        # Prepare OpenAI API call
        prompt = function_params['prompt']
        model = function_params['model']
        temperature = function_params['temperature']
        output_schema = function_params['output_schema']

        input = f"{json.dumps(input_json)}"

        # convert output schema format
        output_schema = self.convert_output_schema_to_openai_function_definition(output_schema)
        # print(output_schema)

        # Make OpenAI API call
        response = self.openai.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": input}
            ],
            temperature=temperature,
            response_format={
                "type": "json_schema",
                "json_schema": output_schema
            }
        )

        output = response.choices[0].message.content
        # print("message", response.choices[0].message.content)
        # print("parsed", json.loads(response.choices[0].message.content))
        return json.loads(output)
    
    def convert_output_schema_to_openai_function_definition(self, output_schema):
    # Remove 'metrics' fields and 'title'
        cleaned_schema = {}
        def clean_schema(schema):
            if isinstance(schema, dict):
                schema = schema.copy()
                schema.pop('metrics', None)
                schema.pop('title', None)
                schema.pop('description', None)
                schema.pop('metrics', None)
                if 'properties' in schema:
                    schema['properties'] = {k: clean_schema(v) for k, v in schema['properties'].items()}
                if 'items' in schema:
                    schema['items'] = clean_schema(schema['items'])
                if 'required' not in schema and 'properties' in schema:
                    schema['required'] = list(schema['properties'].keys())
                schema['additionalProperties'] = False
            return schema

        cleaned_schema['schema'] = clean_schema(output_schema)
        cleaned_schema['name'] = 'output'
        cleaned_schema['strict'] = True
        return cleaned_schema