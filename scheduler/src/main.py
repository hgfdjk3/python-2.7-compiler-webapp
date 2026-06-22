import os
import time
from datetime import datetime, timedelta
import pymongo
import requests
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

client = pymongo.MongoClient(MONGO_URI)
db = client[MONGO_DB_NAME]
automations_collection = db["automations"]

def parse_time(time_str: str) -> tuple:
    """Parse HH:MM string to hours and minutes."""
    try:
        parts = time_str.split(":")
        return int(parts[0]), int(parts[1])
    except (ValueError, IndexError, AttributeError):
        return None, None

def check_and_run_automations():
    print(f"[{datetime.now().isoformat()}] Checking for scheduled automations...")
    # Find all automations with a schedule config and automation_type set to scheduled
    active_automations = list(automations_collection.find({
        "schedule_config": {"$ne": None},
        "automation_type": "scheduled"
    }))
    print(f"  -> Found {len(active_automations)} active scheduled automations.")
    
    now = datetime.now()
    
    for auto in active_automations:
        auto_id = auto["_id"]
        config = auto.get("schedule_config", {})
        creator = auto.get("creator")
        last_run = auto.get("last_run_at")
        
        if not config or not creator:
            continue
            
        frequency = config.get("frequency")
        interval = int(config.get("interval", 1))
        schedule_time = config.get("time") # HH:MM
        
        print(f"  -> Evaluating {auto_id} ('{auto.get('name')}') | Freq: {frequency}, Interval: {interval}, Time: {schedule_time}, Last Run: {last_run}")
        
        should_run = False
        
        if frequency == "minutes":
            if not last_run or (now - last_run).total_seconds() >= interval * 60:
                should_run = True
        elif frequency == "hours":
            if not last_run or (now - last_run).total_seconds() >= interval * 3600:
                should_run = True
        elif frequency == "days":
            h, m = parse_time(schedule_time)
            if h is not None and m is not None:
                target_today = now.replace(hour=h, minute=m, second=0, microsecond=0)
                # Ensure we only run if we passed the scheduled time today
                if now >= target_today:
                    # Ensure we haven't already run it for today
                    if not last_run or last_run < target_today:
                        start_date_str = config.get("startDate")
                        if start_date_str and interval > 1:
                            try:
                                # Extract date and calculate difference in days
                                start_date_str = start_date_str.replace("Z", "+00:00")
                                start_date = datetime.fromisoformat(start_date_str).replace(tzinfo=None)
                                days_diff = (target_today.date() - start_date.date()).days
                                if days_diff >= 0 and days_diff % interval == 0:
                                    should_run = True
                            except Exception as e:
                                print(f"Error parsing startDate for {auto_id}: {e}")
                                should_run = True # fallback
                            else:
                                print(f"    - Not running: days difference ({days_diff}) is not a multiple of interval ({interval})")
                        else:
                            should_run = True
            else:
                if not last_run or (now - last_run).total_seconds() >= interval * 86400:
                    should_run = True
        elif frequency == "weeks":
            h, m = parse_time(schedule_time)
            if h is not None and m is not None:
                target_today = now.replace(hour=h, minute=m, second=0, microsecond=0)
                if now >= target_today:
                    if not last_run or last_run < target_today:
                        start_date_str = config.get("startDate")
                        if start_date_str:
                            try:
                                start_date_str = start_date_str.replace("Z", "+00:00")
                                start_date = datetime.fromisoformat(start_date_str).replace(tzinfo=None)
                                days_diff = (target_today.date() - start_date.date()).days
                                if days_diff >= 0 and days_diff % 7 == 0:
                                    weeks_diff = days_diff // 7
                                    if weeks_diff % interval == 0:
                                        should_run = True
                            except Exception:
                                should_run = True
                        else:
                            if not last_run or (now - last_run).total_seconds() >= interval * 86400 * 7:
                                should_run = True
            else:
                if not last_run or (now - last_run).total_seconds() >= interval * 86400 * 7:
                    should_run = True
        
        if should_run:
            print(f"  [!] DECISION: Triggering automation {auto_id} ({auto.get('name')}) for user {creator}")
            # 1. Immediately update last_run_at in DB to prevent concurrent runs / race conditions
            automations_collection.update_one({"_id": auto_id}, {"$set": {"last_run_at": now}})
            
            # 2. Trigger the backend API
            try:
                headers = {"X-Username": creator}
                payload = {
                    "input_text": "Triggered by scheduler",
                    "stream": False
                }
                print(f"  [>] POST {BACKEND_URL}/api/v1/automations/{str(auto_id)}/run")
                res = requests.post(f"{BACKEND_URL}/api/v1/automations/{str(auto_id)}/run", json=payload, headers=headers)
                if res.status_code == 200:
                    print(f"  [V] Successfully triggered automation {auto_id}")
                else:
                    print(f"  [X] Failed to trigger automation {auto_id}: Status {res.status_code} | Response: {res.text}")
            except Exception as e:
                print(f"  [X] Error triggering automation {auto_id}: {e}")
        else:
            print(f"  [-] DECISION: Skip {auto_id} (not due yet)")

if __name__ == "__main__":
    print("Starting Scheduler Microservice...")
    print(f"Backend URL: {BACKEND_URL}")
    while True:
        try:
            check_and_run_automations()
        except Exception as e:
            print(f"Error in scheduler loop: {e}")
        time.sleep(30) # check every 30 seconds
