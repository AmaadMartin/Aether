import React from 'react';

const Docs = () => {
    return (
        <div className="docs-container">
            <section>
                <h2>Installation</h2>
                <pre>
                    <code>
                        pip install aetherllm
                    </code>
                </pre>
            </section>

            <section>
                <h2>Example Usage</h2>
                <p>
                    Get your API key from the bottom right of the Aether dashboard. Use the function key attached to the function you want to call.
                </p>

                <h3>Flows</h3>
                <pre>
                    <code>
                        {`
from aetherllm import Aether

# Initialize the Aether client
aether = Aether(AETHER_API_KEY)

# Initialize the flow
flow = aether(FLOW_KEY)

def custom_function(input_json):
    # Initialize the call
    call = flow.init_call()

    call.log("Running custom function")
    call.input("input", input_json)
    
    prompt = flow['prompt']
    output = "this is the prompt: " + prompt

    call.output("output", output)
    call.status("completed")

    call.eval()
    return output

custom_function("test_input")
            `}
                    </code>
                </pre>
                <p>
                    In this example, a flow is created by initializing the Aether client and linking it to a specific flow using the provided `FLOW_KEY`. This flow manages the entire process of logging, inputting, and outputting data to and from Aether's API.
                </p>
                <p>
                    - <strong>call.log()</strong> logs information directly to the flow.
                    <br />
                    - <strong>call.input()</strong> logs an input to the flow.
                    <br />
                    - The <strong>flow['prompt']</strong> accesses parameters (like 'prompt') from the Aether website, just like a dictionary.
                    <br />
                    - <strong>call.output()</strong> logs the output to the flow.
                    <br />
                    - <strong>call.status()</strong> logs the status of the flow (e.g., "completed").
                    <br />
                    - Finally, <strong>call.eval()</strong> evaluates the entire call that was just executed.
                </p>
            </section>

            <section>
                <h3>Functions</h3>
                <pre>
                    <code>
                        {`
from aetherllm import Aether

# Initialize the Aether client
aether = Aether(AETHER_API_KEY)

# Initialize the function
function = aether(FUNCTION_KEY, openai_key=OPENAI_API_KEY)

# Call the function
output = function({
    "Article": "This is an article...",
})
            `}
                    </code>
                </pre>
                <p>
                    This example shows how to initialize a function and call it directly by passing data (like an article in this case). You need the `FUNCTION_KEY` and an optional OpenAI key if you are working with OpenAI-based functions.
                </p>
            </section>
        </div>
    );
};

export default Docs;
