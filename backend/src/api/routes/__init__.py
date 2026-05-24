from fastapi import APIRouter
from src.api.routes.ask import router as ask_router
from src.api.routes.automations import router as automations_router

router = APIRouter()
router.include_router(ask_router)
router.include_router(automations_router)
