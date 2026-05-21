import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL")
OPENAI_API_BASE = os.getenv("OPENAI_API_BASE")

# If an NVIDIA API key is used, auto-configure the base URL endpoints
if OPENAI_API_KEY and OPENAI_API_KEY.startswith("nvapi-"):
    if not OPENAI_BASE_URL:
        OPENAI_BASE_URL = "https://integrate.api.nvidia.com/v1"
        os.environ["OPENAI_BASE_URL"] = OPENAI_BASE_URL
    if not OPENAI_API_BASE:
        OPENAI_API_BASE = "https://integrate.api.nvidia.com/v1"
        os.environ["OPENAI_API_BASE"] = OPENAI_API_BASE
