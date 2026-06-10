import asyncio
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

import src.config  # Loads .env

from temporalio.client import Client
from temporalio.worker import Worker
from src.temporal_app.workflows import AutomationWorkflow, execute_langgraph_automation

async def main():
    client = await Client.connect("localhost:7233")
    worker = Worker(
        client,
        task_queue="automations-task-queue",
        workflows=[AutomationWorkflow],
        activities=[execute_langgraph_automation],
    )
    print("Starting Temporal Worker...")
    await worker.run()

if __name__ == "__main__":
    asyncio.run(main())
