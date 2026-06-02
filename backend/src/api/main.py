import os
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Ensure the root backend directory is in the path to resolve imports correctly when run directly
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Remove src directory if it shadows packages
src_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
while src_dir in sys.path:
    sys.path.remove(src_dir)

from src.services.harness.runner import AgentRunner
from src.config import OPENAI_API_KEY
from src.api.routes import router as api_router
from src.api.routes.connectors import router as connectors_router
from src.api.routes.connectors import get_connectors_dict
from src.api.routes.projects import router as projects_router
from src.api.routes.user import router as user_router
from src.api.routes.conversations import router as conversations_router

# Determine model configuration
api_key = OPENAI_API_KEY or ""
default_model = "gpt-4o-mini"
if api_key.startswith("nvapi-"):
    default_model = "openai/gpt-oss-120b"

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Setup AgentRunner (connections are dynamically managed per request)
    app.state.agent_runner = AgentRunner(
        mcp_configs=get_connectors_dict(),
        model_name=default_model,
        temperature=0.7
    )
    yield

app = FastAPI(
    title="Atom LangGraph Agent API",
    description="Backend API exposing modular endpoints connected to the LangGraph agent",
    version="1.0.0",
    lifespan=lifespan
)

# CORS setup to connect to the Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this to specific origin (e.g. ["http://localhost:5173"]) in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the modular API routes
app.include_router(api_router, prefix="/api/v1")
app.include_router(connectors_router, prefix="/api/v1")
app.include_router(projects_router, prefix="/api/v1")
app.include_router(user_router, prefix="/api/v1")
app.include_router(conversations_router, prefix="/api/v1")

