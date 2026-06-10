from datetime import datetime, timezone
from typing import Optional, Tuple
from dateutil.parser import isoparse
from dateutil.tz import gettz
from temporalio.client import ScheduleSpec, ScheduleState

from src.api.utils.temporal.models import ScheduleConfig
from src.api.utils.temporal.builders import ScheduleSpecFactory

def parse_date_string(date_str: Optional[str], tz_name: str) -> Optional[datetime]:
    """
    Parses an ISO-8601 date string and localizes/converts it to the target timezone.
    """
    if not date_str:
        return None
        
    try:
        dt = isoparse(str(date_str))
    except Exception as e:
        raise ValueError(f"Invalid date format: '{date_str}'. Expected ISO-8601 format.") from e
        
    tz = gettz(tz_name)
    if tz is None:
        raise ValueError(f"Invalid timezone name: '{tz_name}'")
        
    if dt.tzinfo is not None:
        return dt.astimezone(tz)
    else:
        return dt.replace(tzinfo=tz)

def merge_date_and_time(dt: datetime, time_str: Optional[str]) -> datetime:
    """
    Overrides the hour and minute of a datetime with the values from a HH:MM time string.
    """
    if not time_str:
        return dt
        
    try:
        parts = time_str.split(":")
        hour = int(parts[0])
        minute = int(parts[1])
    except Exception as e:
        raise ValueError(f"Invalid time format: '{time_str}'. Expected 'HH:MM'.") from e
        
    return dt.replace(hour=hour, minute=minute, second=0, microsecond=0)

def parse_schedule_to_spec_and_state(config: ScheduleConfig) -> Tuple[ScheduleSpec, ScheduleState]:
    """
    Converts a validated ScheduleConfig model into Temporal ScheduleSpec and ScheduleState objects.
    Enforces cross-field validations and business logic.
    """
    # 1. Resolve Timezone
    tz = gettz(config.timezone)
    if tz is None:
        raise ValueError(f"Invalid timezone name: '{config.timezone}'")

    # 2. Parse Start Date and apply Time of Day
    if config.start_date:
        start_at = parse_date_string(config.start_date, config.timezone)
    else:
        start_at = datetime.now(tz)

    if config.time:
        start_at = merge_date_and_time(start_at, config.time)

    # 3. Parse End Date
    end_at = parse_date_string(config.end_date, config.timezone)

    # 4. Enforce Start/End sequence check
    if start_at and end_at and end_at <= start_at:
        raise ValueError("Schedule end date must be strictly after the start date.")

    # 5. Generate Temporal ScheduleSpec
    spec = ScheduleSpecFactory.create_spec(config, start_at, end_at)

    # 6. Generate Temporal ScheduleState (including max occurrences/remaining actions limit)
    if config.occurrences is not None:
        state = ScheduleState(
            paused=False,
            limited_actions=True,
            remaining_actions=config.occurrences
        )
    else:
        state = ScheduleState(
            paused=False,
            limited_actions=False,
            remaining_actions=0
        )

    return spec, state
