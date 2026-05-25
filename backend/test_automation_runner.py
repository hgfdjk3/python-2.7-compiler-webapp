import asyncio
import httpx

async def test_automation_run():
    # Fetch existing automations to get an ID
    async with httpx.AsyncClient() as client:
        res = await client.get("http://localhost:8000/api/automations")
        automations = res.json()
        if not automations:
            print("No automations found. Create one first.")
            return
            
        automation_id = automations[0]["id"]
        print(f"Testing automation: {automation_id}")
        
        # Test Sync
        print("\n--- Sync Run ---")
        run_res = await client.post(
            f"http://localhost:8000/api/automations/{automation_id}/run",
            json={"input_text": "Run the weather update task", "stream": False},
            timeout=60.0
        )
        print(run_res.status_code)
        if run_res.status_code == 200:
            print("Sync Run Output:")
            for msg in run_res.json().get("messages", []):
                print(f"[{msg['type']}]: {msg['content']}")
        else:
            print(run_res.text)
            
        # Test Streaming
        print("\n--- Streaming Run ---")
        async with client.stream(
            "POST",
            f"http://localhost:8000/api/automations/{automation_id}/run",
            json={"input_text": "Run the weather update task", "stream": True},
            timeout=60.0
        ) as response:
            async for line in response.aiter_lines():
                if line:
                    print(line)

if __name__ == "__main__":
    asyncio.run(test_automation_run())
