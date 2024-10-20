# api/evaluation.py

from openai import OpenAI
from config import OPENAI_API_KEY
import json
import uuid
from datetime import datetime
from models import EvaluationOutput
from Prompts import eval_prompt

client = OpenAI()
client.api_key = OPENAI_API_KEY
MODEL = "gpt-4o-mini"


def evaluate_function(function, version, tests, user_api_key):
    output = []
    for test in tests:
        input_data = test["input"]
        # Here, you would call your function with input_data
        # Since we don't have the actual function implementation, we'll simulate it
        output_data = {}  # Simulated output
        evaluation_scores = evaluate_output(
            function["task"],
            function["version_map"][version].get("metrics", []),
            input_data,
            output_data,
        )
        call = {
            "call_key": str(uuid.uuid4()),
            "inputs": input_data,
            "outputs": output_data,
            "evaluation": evaluation_scores,
            "logs": [],
            "status": "evaluated",
            "timestamp": datetime.utcnow().isoformat(),
        }
        output.append(call)
    return output


def evaluate_output(task, metrics, input, output):
    # Use OpenAI API to evaluate the output based on desired properties
    evaluation_prompt = f"""
    Evaluate the following output based on the desired properties.
    Task: {task}
    Input: {input}
    Output: {output}
    Metrics: {', '.join(metrics)}
    Provide a score between 0 and 100 for each metric. ONLY provide scores for the metrics provided.
    """
    print(f"Evaluation prompt: {evaluation_prompt}")

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": eval_prompt},
            {"role": "user", "content": evaluation_prompt},
        ],
        response_format={
            "type": "json_schema",
            "json_schema": {
                "name": "evaluation",
                "schema": EvaluationOutput.model_json_schema(),
            },
        },
    )

    # Parse the response to extract evaluation scores
    # This is a placeholder; you'll need to adjust it based on the actual response format
    evaluation_scores = {}
    try:
        output = json.loads(response.choices[0].message.content)
        evaluation_scores = {"analysis": output["analysis"], "scores": output["scores"]}
    except json.JSONDecodeError:
        pass

    return evaluation_scores
