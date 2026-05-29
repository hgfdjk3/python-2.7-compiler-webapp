from typing import Dict, Any, List, Optional
import uuid
from src.api.utils.db import get_collection

class ProjectsService:
    @staticmethod
    def get_all_projects() -> List[Dict[str, Any]]:
        coll = get_collection("projects")
        result = []
        for doc in coll.find():
            if "_id" in doc:
                doc["id"] = doc.pop("_id")
            result.append(doc)
        return result

    @staticmethod
    def get_project(project_id: str) -> Optional[Dict[str, Any]]:
        coll = get_collection("projects")
        doc = coll.find_one({"_id": project_id})
        if doc:
            doc["id"] = doc.pop("_id")
        return doc

    @staticmethod
    def create_project(data: Dict[str, Any]) -> Dict[str, Any]:
        coll = get_collection("projects")
        
        if "id" not in data:
            data["id"] = f"p{uuid.uuid4().hex[:8]}"
            
        db_dict = data.copy()
        db_dict["_id"] = db_dict.pop("id")
        
        coll.insert_one(db_dict)
        return data

    @staticmethod
    def update_project(project_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        coll = get_collection("projects")
        
        existing = coll.find_one({"_id": project_id})
        if not existing:
            return None
            
        for key, value in data.items():
            if key not in ["id", "_id"]:
                existing[key] = value
                
        existing["id"] = project_id
        
        db_dict = existing.copy()
        db_dict["_id"] = db_dict.pop("id")
        
        coll.replace_one({"_id": project_id}, db_dict)
        return existing

    @staticmethod
    def delete_project(project_id: str) -> bool:
        coll = get_collection("projects")
        result = coll.delete_one({"_id": project_id})
        return result.deleted_count > 0

