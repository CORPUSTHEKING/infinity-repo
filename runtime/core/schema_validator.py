#!/usr/bin/env python3

try:
    from jsonschema import Draft7Validator, ValidationError
    HAS_JSONSCHEMA = True
except Exception:
    HAS_JSONSCHEMA = False

def validate_envelope(envelope):
    # If jsonschema is not installed, skip validation
    if not HAS_JSONSCHEMA:
        return None

    try:
        Draft7Validator({}).validate(envelope)
    except Exception as e:
        return str(e)

    return None
