from fastapi import Header
from typing import Optional

def get_current_user(x_username: Optional[str] = Header(None)) -> str:
    """
    Extracts the current user from the x-username header.
    Defaults to 'default_user' if not provided to maintain backward compatibility.
    """
    return x_username if x_username else "default_user"
