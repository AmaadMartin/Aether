from decimal import Decimal


def evaluate_function(function, version, tests):
    return [
        {
            "input": test["input"],
            "output": {
                "test_output": {
                    "value": "test",
                    "scores": {
                        "test_prop": Decimal(str(0.5)),
                    },
                }
            },
        }
        for test in tests
    ]
