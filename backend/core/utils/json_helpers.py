"""
JSON helper utilities for handling both legacy (string) and new (dict/list) formats.

These utilities help with the transition from storing JSON as strings to storing
them as proper JSONB objects in the database.
"""

import json
from typing import Any, Union, Dict, List


def ensure_dict(value: Union[str, Dict[str, Any], None], default: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Ensure a value is a dictionary.
    
    Handles:
    - None -> returns default or {}
    - Dict -> returns as-is
    - JSON string -> parses and returns dict
    - Other -> returns default or {}
    
    Args:
        value: The value to ensure is a dict
        default: Default value if conversion fails
        
    Returns:
        A dictionary
    """
    if default is None:
        default = {}
        
    if value is None:
        return default
        
    if isinstance(value, dict):
        return value
        
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
            if isinstance(parsed, dict):
                return parsed
            return default
        except (json.JSONDecodeError, TypeError):
            return default
            
    return default


def ensure_list(value: Union[str, List[Any], None], default: List[Any] = None) -> List[Any]:
    """
    Ensure a value is a list.
    
    Handles:
    - None -> returns default or []
    - List -> returns as-is
    - JSON string -> parses and returns list
    - Other -> returns default or []
    
    Args:
        value: The value to ensure is a list
        default: Default value if conversion fails
        
    Returns:
        A list
    """
    if default is None:
        default = []
        
    if value is None:
        return default
        
    if isinstance(value, list):
        return value
        
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
            if isinstance(parsed, list):
                return parsed
            return default
        except (json.JSONDecodeError, TypeError):
            return default
            
    return default


def repair_truncated_json(json_str: str) -> tuple[Any, bool]:
    """
    [PROPHET CUSTOM] Attempt to repair truncated JSON from LLM token limits.
    
    When the LLM hits token limits mid-generation, JSON arguments get truncated.
    This function tries to close open brackets/braces to salvage the partial data.
    
    Args:
        json_str: Potentially truncated JSON string
        
    Returns:
        Tuple of (parsed_result, was_repaired)
        - parsed_result: Parsed dict/list if successful, original string if not
        - was_repaired: True if repair was attempted
    """
    if not json_str or not isinstance(json_str, str):
        return json_str, False
    
    # First, try normal parsing
    try:
        return json.loads(json_str), False
    except json.JSONDecodeError:
        pass
    
    repaired = json_str.rstrip()
    
    # Handle trailing colon (incomplete key-value pair) - remove it
    if repaired.endswith(':'):
        # Find the key and remove the whole "key": part
        last_quote = repaired.rfind('"', 0, len(repaired) - 1)
        if last_quote > 0:
            second_last_quote = repaired.rfind('"', 0, last_quote)
            if second_last_quote >= 0:
                # Check if there's a comma before the key
                prefix = repaired[:second_last_quote].rstrip()
                if prefix.endswith(','):
                    repaired = prefix[:-1]  # Remove the comma too
                else:
                    repaired = prefix
    
    # Handle trailing comma
    repaired = repaired.rstrip(',')
    
    # Count open brackets/braces (simple count, not accounting for strings)
    open_braces = repaired.count('{') - repaired.count('}')
    open_brackets = repaired.count('[') - repaired.count(']')
    
    # Check if we're inside a string by counting unescaped quotes
    # Need to handle escaped backslashes (\\) properly
    quote_count = 0
    i = 0
    while i < len(repaired):
        if repaired[i] == '"':
            # Count preceding backslashes
            num_backslashes = 0
            j = i - 1
            while j >= 0 and repaired[j] == '\\':
                num_backslashes += 1
                j -= 1
            # Quote is escaped only if preceded by odd number of backslashes
            if num_backslashes % 2 == 0:
                quote_count += 1
        i += 1
    in_string = quote_count % 2 == 1
    
    # If inside a string, close it
    if in_string:
        repaired += '"'
    
    # Close any open brackets/braces
    repaired += ']' * max(0, open_brackets)
    repaired += '}' * max(0, open_braces)
    
    # Try to parse the repaired JSON
    try:
        result = json.loads(repaired)
        return result, True
    except json.JSONDecodeError:
        # Try more aggressive repair - remove last incomplete key-value
        try:
            # Find last complete value (ends with ", or number, or true/false/null, or ]/})
            import re
            # Remove incomplete trailing content after last comma
            match = re.search(r',\s*"[^"]*"?\s*:?\s*[^,}\]]*$', repaired)
            if match:
                repaired = repaired[:match.start()]
                repaired += ']' * max(0, repaired.count('[') - repaired.count(']'))
                repaired += '}' * max(0, repaired.count('{') - repaired.count('}'))
                result = json.loads(repaired)
                return result, True
        except (json.JSONDecodeError, Exception):
            pass
        
        # If still failing, return original
        return json_str, False


def safe_json_parse(value: Union[str, Dict, List, Any], default: Any = None) -> Any:
    """
    Safely parse a value that might be JSON string or already parsed.
    
    This handles the transition period where some data might be stored as
    JSON strings (old format) and some as proper objects (new format).
    
    Args:
        value: The value to parse
        default: Default value if parsing fails
        
    Returns:
        Parsed value or default
    """
    if value is None:
        return default
        
    # If it's already a dict or list, return as-is
    if isinstance(value, (dict, list)):
        return value
        
    # If it's a string, try to parse it
    if isinstance(value, str):
        try:
            return json.loads(value)
        except (json.JSONDecodeError, TypeError):
            # If it's not valid JSON, return the string itself
            return value
            
    # For any other type, return as-is
    return value


def to_json_string(value: Any) -> str:
    """
    Convert a value to a JSON string if needed.
    
    This is used for backwards compatibility when yielding data that
    expects JSON strings.
    
    Args:
        value: The value to convert
        
    Returns:
        JSON string representation
    """
    if isinstance(value, str):
        # If it's already a string, check if it's valid JSON
        try:
            json.loads(value)
            return value  # It's already a JSON string
        except (json.JSONDecodeError, TypeError):
            # It's a plain string, encode it as JSON
            return json.dumps(value)
    
    # For all other types, convert to JSON
    return json.dumps(value)


def format_for_yield(message_object: Dict[str, Any]) -> Dict[str, Any]:
    """
    Format a message object for yielding, ensuring content and metadata are JSON strings.
    
    This maintains backward compatibility with clients expecting JSON strings
    while the database now stores proper objects.
    
    Args:
        message_object: The message object from the database
        
    Returns:
        Message object with content and metadata as JSON strings
    """
    if not message_object:
        return message_object
        
    # Create a copy to avoid modifying the original
    formatted = message_object.copy()
    
    # Ensure content is a JSON string
    if 'content' in formatted and not isinstance(formatted['content'], str):
        formatted['content'] = json.dumps(formatted['content'])
        
    # Ensure metadata is a JSON string
    if 'metadata' in formatted and not isinstance(formatted['metadata'], str):
        formatted['metadata'] = json.dumps(formatted['metadata'])
        
    return formatted 