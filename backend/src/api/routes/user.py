import json
import os
from fastapi import APIRouter, Depends
from typing import Dict, List, Any, Optional
from pydantic import BaseModel

from src.api.dependencies.auth import get_current_user

router = APIRouter()

routes_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.abspath(os.path.join(routes_dir, "..", "..", ".."))
USER_CONFIGS_FILE = os.path.join(backend_dir, "user_configs.json")

class UserConfig(BaseModel):
    enabled_connectors: List[str] = []
    header_values: Dict[str, Dict[str, str]] = {}

def load_all_user_configs() -> Dict[str, Any]:
    if os.path.exists(USER_CONFIGS_FILE):
        try:
            with open(USER_CONFIGS_FILE, "r") as f:
                return json.load(f)
        except Exception:
            pass
    return {}

def save_all_user_configs(configs: Dict[str, Any]):
    try:
        with open(USER_CONFIGS_FILE, "w") as f:
            json.dump(configs, f, indent=2)
    except Exception:
        pass

def get_user_config_dict(username: str) -> Dict[str, Any]:
    all_configs = load_all_user_configs()
    return all_configs.get(username, {"enabled_connectors": [], "header_values": {}})

@router.get("/user/config", response_model=UserConfig)
async def get_user_config(username: str = Depends(get_current_user)):
    return get_user_config_dict(username)

@router.post("/user/config", response_model=UserConfig)
async def update_user_config(config: UserConfig, username: str = Depends(get_current_user)):
    all_configs = load_all_user_configs()
    all_configs[username] = config.model_dump()
    save_all_user_configs(all_configs)
    return config
