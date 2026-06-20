from typing import Dict, Any, List, Optional
import uuid
from src.api.utils.db import get_collection

class LibraryService:
    @staticmethod
    def get_entities(project_id: str) -> List[Dict[str, Any]]:
        coll = get_collection("library_entities")
        result = []
        for doc in coll.find({"project_id": project_id}):
            if "_id" in doc:
                doc["id"] = doc.pop("_id")
            result.append(doc)
        return result

    @staticmethod
    def get_library_stats(project_id: str) -> Dict[str, Any]:
        coll = get_collection("library_entities")
        pipeline = [
            {"$match": {"project_id": project_id, "current_state": {"$ne": None}}},
            {"$group": {"_id": "$type", "count": {"$sum": 1}}}
        ]
        results = list(coll.aggregate(pipeline))
        total = sum(r["count"] for r in results)
        by_type = {r["_id"]: r["count"] for r in results}
        return {"total": total, "by_type": by_type}

    @staticmethod
    def get_entity(project_id: str, entity_id: str) -> Optional[Dict[str, Any]]:
        coll = get_collection("library_entities")
        doc = coll.find_one({"_id": entity_id, "project_id": project_id})
        if doc:
            doc["id"] = doc.pop("_id")
            return doc
        return None

    @staticmethod
    def delete_entity(project_id: str, entity_id: str) -> bool:
        coll = get_collection("library_entities")
        result = coll.delete_one({"_id": entity_id, "project_id": project_id})
        return result.deleted_count > 0

    @staticmethod
    def search_entities(project_id: str, query: str) -> List[Dict[str, Any]]:
        coll = get_collection("library_entities")
        db_query = {
            "project_id": project_id,
            "current_state": {"$ne": None},
            "$or": [
                {"current_state.title": {"$regex": query, "$options": "i"}},
                {"current_state.description": {"$regex": query, "$options": "i"}}
            ]
        }
        result = []
        for doc in coll.find(db_query):
            if "_id" in doc:
                doc["id"] = doc.pop("_id")
            result.append(doc)
        return result

    @staticmethod
    def propose_changes(
        project_id: str,
        entity_id: Optional[str] = None,
        entity_type: Optional[str] = None,
        proposed_state: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        coll = get_collection("library_entities")
        
        if entity_id:
            existing = coll.find_one({"_id": entity_id, "project_id": project_id})
            if not existing:
                raise ValueError("Entity not found")
            
            # Update the existing document's proposed state and change status to pending
            existing["proposed_state"] = proposed_state
            existing["status"] = "pending"
            
            # Update type if provided (usually types don't change, but just in case)
            if entity_type:
                existing["type"] = entity_type
                
            coll.replace_one({"_id": entity_id}, existing)
            existing["id"] = existing.pop("_id")
            return existing
        else:
            # Create a new entity proposal
            if not proposed_state:
                raise ValueError("Cannot create a new entity without a proposed_state")
                
            new_id = f"ent_{uuid.uuid4().hex[:8]}"
            new_entity = {
                "_id": new_id,
                "project_id": project_id,
                "type": entity_type or "concept",
                "status": "pending",
                "current_state": None,
                "proposed_state": proposed_state
            }
            coll.insert_one(new_entity)
            new_entity["id"] = new_entity.pop("_id")
            return new_entity

    @staticmethod
    def edit_entity(
        project_id: str,
        entity_id: str,
        entity_type: Optional[str] = None,
        current_state: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        coll = get_collection("library_entities")
        existing = coll.find_one({"_id": entity_id, "project_id": project_id})
        if not existing:
            raise ValueError("Entity not found")
            
        if current_state:
            existing["current_state"] = current_state
        if entity_type:
            existing["type"] = entity_type
            
        coll.replace_one({"_id": entity_id}, existing)
        existing["id"] = existing.pop("_id")
        return existing

    @staticmethod
    def approve_proposal(entity_id: str) -> Optional[Dict[str, Any]]:
        coll = get_collection("library_entities")
        existing = coll.find_one({"_id": entity_id})
        if not existing:
                return None
            
        if existing.get("status") != "pending":
            existing["id"] = existing.pop("_id")
            return existing # Already approved or not pending
            
        # If proposed_state is None, it means the proposal was to delete the entity
        if not existing.get("proposed_state"):
            coll.delete_one({"_id": entity_id})
            return {"deleted": True, "id": entity_id}
            
        # Move proposed to current
        existing["current_state"] = existing.get("proposed_state")
        existing["proposed_state"] = None
        existing["status"] = "approved"
        
        coll.replace_one({"_id": entity_id}, existing)
        existing["id"] = existing.pop("_id")
        return existing

    @staticmethod
    def reject_proposal(entity_id: str) -> Optional[Dict[str, Any]]:
        coll = get_collection("library_entities")
        existing = coll.find_one({"_id": entity_id})
        if not existing:
            return None
            
        if existing.get("status") != "pending":
            existing["id"] = existing.pop("_id")
            return existing # Not pending
            
        # If it was a proposal to create a new entity (no current_state), just delete it
        if not existing.get("current_state"):
            coll.delete_one({"_id": entity_id})
            return {"deleted": True, "id": entity_id}
            
        # Otherwise, just revert the proposal
        existing["proposed_state"] = None
        existing["status"] = "approved"
        
        coll.replace_one({"_id": entity_id}, existing)
        existing["id"] = existing.pop("_id")
        return existing

    @staticmethod
    def approve_all_proposals(project_id: str) -> List[Dict[str, Any]]:
        coll = get_collection("library_entities")
        pending = coll.find({"project_id": project_id, "status": "pending"})
        results = []
        for doc in pending:
            entity_id = doc["_id"]
            approved = LibraryService.approve_proposal(entity_id)
            if approved:
                results.append(approved)
        return results

    @staticmethod
    def reject_all_proposals(project_id: str) -> List[Dict[str, Any]]:
        coll = get_collection("library_entities")
        pending = coll.find({"project_id": project_id, "status": "pending"})
        results = []
        for doc in pending:
            entity_id = doc["_id"]
            rejected = LibraryService.reject_proposal(entity_id)
            if rejected:
                results.append(rejected)
        return results
