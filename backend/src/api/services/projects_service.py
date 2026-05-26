import json
import os
from typing import Dict, Any, List, Optional
import uuid

# Resolve path to projects.json in the backend directory
routes_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.abspath(os.path.join(routes_dir, "..", "..", ".."))
PROJECTS_FILE = os.path.join(backend_dir, "projects.json")

def load_projects() -> List[Dict[str, Any]]:
    if os.path.exists(PROJECTS_FILE):
        try:
            with open(PROJECTS_FILE, "r") as f:
                return json.load(f)
        except Exception:
            pass
    return []

def save_projects(projects: List[Dict[str, Any]]):
    try:
        with open(PROJECTS_FILE, "w") as f:
            json.dump(projects, f, indent=2)
    except Exception:
        pass

class ProjectsService:
    @staticmethod
    def get_all_projects() -> List[Dict[str, Any]]:
        return load_projects()

    @staticmethod
    def get_project(project_id: str) -> Optional[Dict[str, Any]]:
        projects = load_projects()
        for p in projects:
            if p.get("id") == project_id:
                return p
        return None

    @staticmethod
    def create_project(data: Dict[str, Any]) -> Dict[str, Any]:
        projects = load_projects()
        
        # ensure id
        if "id" not in data:
            data["id"] = f"p{uuid.uuid4().hex[:8]}"
            
        projects.append(data)
        save_projects(projects)
        return data

    @staticmethod
    def update_project(project_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        projects = load_projects()
        for i, p in enumerate(projects):
            if p.get("id") == project_id:
                updated = {**p, **data}
                # Ensure we don't overwrite id
                updated["id"] = project_id
                projects[i] = updated
                save_projects(projects)
                return updated
        return None

    @staticmethod
    def delete_project(project_id: str) -> bool:
        projects = load_projects()
        initial_length = len(projects)
        projects = [p for p in projects if p.get("id") != project_id]
        if len(projects) < initial_length:
            save_projects(projects)
            return True
        return False
