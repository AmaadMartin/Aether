import random

eval_prompt = """
Given the task, input, and output schema outlining the metrics to grade for each item. Grade the output based on each metric and output the scores.

Instructions:

1. **Understand the metrics:**
   - For each item in the output schema, identify the metrics that the model's output should satisfy.

2. **Analyze Model Outputs:**
   - For each output item, compare the model's output against the metrics.
   - Use chain-of-thought reasoning to think step by step about how well the output satisfies each metric.

3. **Assign Scores:**
   - **Scoring Scale (0-100):**
     - **0-25:** The output does not satisfy the metric at all.
     - **26-75:** The output partially satisfies the metric.
     - **76-100:** The output fully satisfies the metric. THIS SHOULD BE RARE.
   - Ensure that you use the full range of scores to reflect varying degrees of satisfaction.
   - Aim for an average score of around 50 across all evaluations to maintain a balanced assessment.
   - Make sure the score is representative of how much a metric is satisfied. If it is a negative property, like how wrong an answer it is, make sure that a higher score represents a more wrong answer.

4. **Maintain Original Outputs:**
   - Keep the original model outputs exactly as they are provided.

5. **Output Format:**
   - Present your evaluation in the following JSON format:
     {
     "analysis": "Your analysis of the model's output",
      "scores": {
        "Metric1": score1,
        "Metric2": score2,
        ...
     }

6. **Chain-of-Thought Reasoning:**
   - Use step-by-step reasoning internally to arrive at your evaluations.
   - **Do not include** your reasoning in the final output.

---

**Examples:**

**Example 1:**

*Input:*
{
  "Prompt": "Write a short story about a robot learning emotions."
}

*Metrics:*
["Creative", "Emotionally engaging"]

*Model Outputs:*
{
  "Story": "Once upon a time, there was a robot named Alpha who wanted to understand human emotions..."
}

*Evaluation:*
{
  "analysis": "Creative (Score: 50): The story is somewhat creative in its premise of a robot learning emotions, but it lacks depth and originality. It follows a common trope of AI trying to understand human emotions, which is a bit cliched. Emotionally engaging (Score: 65): The story manages to evoke some emotional connection with the robot's desire to learn emotions, but it could be more engaging with richer descriptions and character development. Overall, the story is decent but could benefit from more creativity and emotional depth.",
  "scores": {
    "Creative": 50,
    "Emotionally engaging": 65
  }
}

**Example 2:**

*Input:*
{
  "Question": "What is the derivative of sin(x)?"
}

*Metrics:*
["Mathematically correct"]

*Model Outputs:*
{
  "Answer": "The derivative of sin(x) is cos(x)."
}

*Evaluation:*
{
  "scores": {
    "Mathematically correct": 90
  },
  "analysis": "Mathematically correct (Score: 90):
The answer provided, "The derivative of sin(x) is cos(x)," is mathematically correct. The concept is simple and straightforward, so the model correctly identifies the derivative. However, the score is 90 instead of 100 because there's no explanation or extra detail that might enhance understanding (e.g., mentioning that this result comes from differentiation rules). Though the answer is correct, the scoring reflects that there’s potential for a more comprehensive explanation that would increase the depth of the response."
}
"""


def evaluation_prompt(seed=None):
    return eval_prompt
    random.seed(seed)

    # Define multiple versions of the introduction
    introductions = [
        "Given the task, input, and output schema outlining the metrics to grade for each item. Grade the output based on each metric and output the scores.",
        "Your task is to evaluate the given outputs based on the provided task, input, and output schema. For each metric, assign scores reflecting how well the outputs meet the metrics.",
        "Evaluate the outputs by comparing them to the metrics outlined in the output schema. For each metric, provide scores based on your assessment.",
    ]

    # Choose an introduction randomly
    intro = random.choice(introductions)

    # Define instruction steps, each with multiple versions
    instructions_steps = [
        [
            "1. **Understand the metrics:**\n   - For each item in the output schema, identify the metrics that the model's output should satisfy.",
            "1. **Identify metrics:**\n   - Review the output schema to find the metrics for each item.",
            "1. **Review Output Schema:**\n   - Extract the metrics for each item from the output schema.",
        ],
        [
            "2. **Analyze Model Outputs:**\n   - For each output item, compare the model's output against the metrics.\n   - Use chain-of-thought reasoning to think step by step about how well the output satisfies each metric.",
            "2. **Evaluate Outputs:**\n   - Assess each output item against the metrics.\n   - Internally reason through how well each property is satisfied.",
            "2. **Assess Outputs:**\n   - Compare the outputs to the metrics step by step using chain-of-thought reasoning.",
        ],
        [
            "3. **Assign Scores:**\n   - **Scoring Scale (0-100):**\n     - **0-25:** The output does not satisfy the metric at all.\n     - **26-75:** The output partially satisfies the metric.\n     - **76-100:** The output fully satisfies the metric. THIS SHOULD BE RARE.\n   - Ensure that you use the full range of scores to reflect varying degrees of satisfaction.\n   - Aim for an average score of around 50 across all evaluations to maintain a balanced assessment.\n   - Make sure the score is representative of how much a metric is satisfied. If it is a negative property, like how wrong an answer it is, make sure that a higher score represents a more wrong answer.",
            "3. **Scoring:**\n   - **Scale (0-100):**\n     - **0-25:** metric not satisfied at all.\n     - **26-75:** metric partially satisfied.\n     - **76-100:** metric fully satisfied (rare).\n   - Use the entire range to show varying degrees.\n   - Target an average score of about 50 to keep assessments balanced.\n   - Ensure higher scores represent a greater degree of satisfaction or deviation, depending on the context.",
            "3. **Provide Scores:**\n   - **Score Range (0-100):**\n     - **0-25:** Does not meet the metric.\n     - **26-75:** Partially meets the metric.\n     - **76-100:** Fully meets the metric (should be uncommon).\n   - Use the full scoring spectrum for nuanced evaluations.\n   - Keep the average score around 50 for balance.\n   - Ensure scores accurately reflect satisfaction levels; for negative properties, higher scores indicate greater deviation.",
        ],
        [
            "4. **Maintain Original Outputs:**\n   - Keep the original model outputs exactly as they are provided.",
            "4. **Preserve Outputs:**\n   - Do not alter the original model outputs in any way.",
            "4. **Keep Outputs Unchanged:**\n   - Ensure that the model outputs remain exactly as given.",
        ],
        [
            '5. **Output Format:**\n   - Present your evaluation in the following JSON format:\n     {\n       "ItemName": {\n         "scores": {\n           "DesiredProperty1": score1,\n           "DesiredProperty2": score2,\n           ...\n         },\n         "models_output": "Original model output for ItemName"\n       },\n       ...\n     }',
            '5. **Formatting:**\n   - Output your evaluation using this JSON structure:\n     {\n       "ItemName": {\n         "scores": {\n           "DesiredProperty1": score1,\n           "DesiredProperty2": score2,\n           ...\n         },\n         "models_output": "Original model output for ItemName"\n       },\n       ...\n     }',
            '5. **Provide Evaluation in JSON:**\n   - Use the following JSON format for your evaluation:\n     {\n       "ItemName": {\n         "scores": {\n           "DesiredProperty1": score1,\n           "DesiredProperty2": score2,\n           ...\n         },\n         "models_output": "Original model output for ItemName"\n       },\n       ...\n     }',
        ],
        [
            "6. **Chain-of-Thought Reasoning:**\n   - Use step-by-step reasoning internally to arrive at your evaluations.\n   - **Do not include** your reasoning in the final output.",
            "6. **Internal Reasoning:**\n   - Employ chain-of-thought reasoning to evaluate.\n   - Do not include your reasoning in the output.",
            "6. **Reasoning Process:**\n   - Think through each evaluation step by step internally.\n   - **Exclude** your reasoning from the final output.",
        ],
    ]

    # Randomly shuffle the order of the instructions
    instruction_order = list(range(len(instructions_steps)))
    random.shuffle(instruction_order)

    # Build the instructions string
    instructions = []
    for idx in instruction_order:
        # For each step, randomly choose one version
        step_versions = instructions_steps[idx]
        step_text = random.choice(step_versions)
        instructions.append(step_text)

    instructions_text = "\n\n".join(instructions)

    # Now the examples
    # We can define multiple versions or variations of the examples
    examples = [
        {
            "example_text": """**Example 1:**

*Input:*
{
  "Prompt": "Write a short story about a robot learning emotions."
}

*Output Schema:*
{
  "title": "Output Schema",
  "type": "object",
  "properties": {
    "Story": {
      "type": "string",
      "desiredProperties": ["Creative", "Emotionally engaging"]
    }
  }
}

*Model Outputs:*
{
  "Story": "Once upon a time, there was a robot named Alpha who wanted to understand human emotions..."
}

*Evaluation:*
{
  "Story": {
    "scores": {
      "Creative": 50,
      "Emotionally engaging": 65
    },
    "models_output": "Once upon a time, there was a robot named Alpha who wanted to understand human emotions..."
    "reasoning": "Creative (Score: 50): The story is somewhat creative in its premise of a robot learning emotions, but it lacks depth and originality. It follows a common trope of AI trying to understand human emotions, which is a bit cliched. Emotionally engaging (Score: 65): The story manages to evoke some emotional connection with the robot's desire to learn emotions, but it could be more engaging with richer descriptions and character development. Overall, the story is decent but could benefit from more creativity and emotional depth."
  }
}""",
        },
        {
            "example_text": """**Example 2:**

*Input:*
{
  "Question": "What is the derivative of sin(x)?"
}

*Output Schema:*
{
  "title": "Output Schema",
  "type": "object",
  "properties": {
    "Answer": {
      "type": "string",
      "desiredProperties": ["Mathematically correct"]
    }
  }
}

*Model Outputs:*
{
  "Answer": "The derivative of sin(x) is cos(x)."
}

*Evaluation:*
{
  "Answer": {
    "scores": {
      "Mathematically correct": 90
    },
    "models_output": "The derivative of sin(x) is cos(x)."
    "reasoning": "Mathematically correct (Score: 90): The answer provided, 'The derivative of sin(x) is cos(x),' is mathematically correct. The concept is simple and straightforward, so the model correctly identifies the derivative. However, the score is 90 instead of 100 because there's no explanation or extra detail that might enhance understanding (e.g., mentioning that this result comes from differentiation rules). Though the answer is correct, the scoring reflects that there’s potential for a more comprehensive explanation that would increase the depth of the response."
  }
}""",
        },
        # Add more examples or variations if desired
    ]

    # Decide randomly whether to include examples, and which ones
    include_examples = random.choice([True, False])
    examples_text = ""
    if include_examples:
        # Decide how many examples to include (1 or 2)
        num_examples = random.choice([1, 2])
        # Randomly select examples
        selected_examples = random.sample(examples, num_examples)
        # Build examples text
        examples_text = "\n\n".join([ex["example_text"] for ex in selected_examples])

    # Assemble the prompt
    prompt = f"""{intro}

Instructions:

{instructions_text}

---

"""
    # Include examples if any
    if examples_text:
        prompt += f"**Examples:**\n\n{examples_text}"

    return prompt


test_generation_prompt = "Generate an example input that will be used for evaluation that matches the following input schema given the task. You want to generate inputs that would be indiciative of a user inputs. Try to get edge cases as well"
