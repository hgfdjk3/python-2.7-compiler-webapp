from datetime import datetime
from typing import List, Dict, Any
from src.api.utils.db import get_collection

class ConversationsService:
    @staticmethod
    def get_collection():
        return get_collection("conversations")

    @staticmethod
    def create_conversation_metadata_if_not_exists(thread_id: str, project_id: str, username: str, title: str) -> None:
        if thread_id == "default_api_session":
            return
            
        coll = ConversationsService.get_collection()
        existing = coll.find_one({"_id": thread_id})
        
        if not existing:
            now = datetime.utcnow()
            doc = {
                "_id": thread_id,
                "project_id": project_id,
                "username": username,
                "title": title,
                "preview": title[:50] + "..." if len(title) > 50 else title,
                "isSaved": False,
                "created_at": now,
                "updated_at": now
            }
            coll.insert_one(doc)

    @staticmethod
    def get_conversations(project_id: str, username: str) -> List[Dict[str, Any]]:
        coll = ConversationsService.get_collection()
        cursor = coll.find({"project_id": project_id, "username": username}).sort("updated_at", -1)
        results = []
        for doc in cursor:
            doc["id"] = doc.pop("_id")
            results.append(doc)
        return results

    @staticmethod
    def get_conversation(thread_id: str, username: str) -> Dict[str, Any]:
        coll = ConversationsService.get_collection()
        doc = coll.find_one({"_id": thread_id, "username": username})
        if doc:
            doc["id"] = doc.pop("_id")
        return doc

    @staticmethod
    def update_conversation(thread_id: str, username: str, data: Dict[str, Any]) -> Dict[str, Any]:
        coll = ConversationsService.get_collection()
        data["updated_at"] = datetime.utcnow()
        coll.update_one(
            {"_id": thread_id, "username": username},
            {"$set": data}
        )
        return ConversationsService.get_conversation(thread_id, username)

    @staticmethod
    def delete_conversation(thread_id: str, username: str) -> bool:
        coll = ConversationsService.get_collection()
        result = coll.delete_one({"_id": thread_id, "username": username})
        return result.deleted_count > 0
