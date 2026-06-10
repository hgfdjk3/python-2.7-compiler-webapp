from datetime import datetime, timedelta
from typing import Optional, List
from temporalio.client import (
    ScheduleSpec,
    ScheduleCalendarSpec,
    ScheduleIntervalSpec,
    ScheduleRange,
)
from src.api.utils.temporal.models import ScheduleConfig, WEEKDAYS_MAP

def build_hourly(
    config: ScheduleConfig,
    start_at: Optional[datetime],
    end_at: Optional[datetime]
) -> ScheduleSpec:
    """
    Builds an interval-based schedule spec for hourly frequency.
    Interval schedules are true elapsed-time schedules.
    """
    interval = timedelta(hours=config.interval)
    
    return ScheduleSpec(
        start_at=start_at,
        end_at=end_at,
        intervals=[ScheduleIntervalSpec(every=interval)],
        time_zone_name=config.timezone
    )

def build_daily(
    config: ScheduleConfig,
    start_at: Optional[datetime],
    end_at: Optional[datetime]
) -> ScheduleSpec:
    """
    Builds an interval-based schedule spec for daily frequency.
    Daily elapsed-time runs exactly every N days (interval * 24 hours).
    Aligns initial execution at start_at (which holds the merged date and time).
    """
    interval = timedelta(days=config.interval)
    
    return ScheduleSpec(
        start_at=start_at,
        end_at=end_at,
        intervals=[ScheduleIntervalSpec(every=interval)],
        time_zone_name=config.timezone
    )

def build_weekly(
    config: ScheduleConfig,
    start_at: Optional[datetime],
    end_at: Optional[datetime]
) -> ScheduleSpec:
    """
    Builds a calendar-based schedule spec for weekly frequency.
    Calendar schedules are aligned to weekdays and wall-clock times.
    """
    weekday_ints: List[int] = []
    
    if config.by_days:
        for day in config.by_days:
            # Already normalized to lowercase by Pydantic validator
            if day in WEEKDAYS_MAP:
                weekday_ints.append(WEEKDAYS_MAP[day])
    else:
        # Default to the weekday of start_at (if present) or Monday (1)
        if start_at:
            # start_at.weekday(): Mon=0, Tue=1, ..., Sun=6
            # WEEKDAYS_MAP: Sun=0, Mon=1, ..., Sat=6
            # Mapping: (start_at.weekday() + 1) % 7
            weekday_ints = [(start_at.weekday() + 1) % 7]
        else:
            weekday_ints = [1]  # Monday

    hour = start_at.hour if start_at else 0
    minute = start_at.minute if start_at else 0
    
    calendars = [
        ScheduleCalendarSpec(
            day_of_week=[ScheduleRange(day) for day in weekday_ints],
            hour=[ScheduleRange(hour)],
            minute=[ScheduleRange(minute)],
        )
    ]
    
    # Note: If interval > 1 for weeks, it is easy to extend here by using multiple
    # ScheduleIntervalSpec with phase offsets or mapping to custom intervals.
    return ScheduleSpec(
        start_at=start_at,
        end_at=end_at,
        calendars=calendars,
        time_zone_name=config.timezone
    )

def build_monthly(
    config: ScheduleConfig,
    start_at: Optional[datetime],
    end_at: Optional[datetime]
) -> ScheduleSpec:
    """
    Builds a calendar-based schedule spec for monthly frequency.
    Alignd to specific day of month and specific wall-clock time.
    """
    # Default to the day of start_at, or the 1st of the month
    day_val = start_at.day if start_at else 1
    hour = start_at.hour if start_at else 0
    minute = start_at.minute if start_at else 0
    
    start_month = start_at.month if start_at else 1
    interval = config.interval
    
    # Calculate target months starting from start_month
    months = [m for m in range(1, 13) if (m - start_month) % interval == 0]
    
    calendars = [
        ScheduleCalendarSpec(
            day_of_month=[ScheduleRange(day_val)],
            month=[ScheduleRange(m) for m in months],
            hour=[ScheduleRange(hour)],
            minute=[ScheduleRange(minute)],
        )
    ]
    
    return ScheduleSpec(
        start_at=start_at,
        end_at=end_at,
        calendars=calendars,
        time_zone_name=config.timezone
    )

class ScheduleSpecFactory:
    """
    Factory class that routes ScheduleConfig to the correct builder based on frequency.
    """
    
    _builders = {
        "hours": build_hourly,
        "days": build_daily,
        "weeks": build_weekly,
        "months": build_monthly,
    }

    @classmethod
    def create_spec(
        cls,
        config: ScheduleConfig,
        start_at: Optional[datetime],
        end_at: Optional[datetime]
    ) -> ScheduleSpec:
        builder = cls._builders.get(config.frequency)
        if not builder:
            raise ValueError(f"Unsupported schedule frequency: '{config.frequency}'")
        return builder(config, start_at, end_at)
