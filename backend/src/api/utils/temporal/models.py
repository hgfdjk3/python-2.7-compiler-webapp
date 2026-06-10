from typing import List, Optional, Literal
from pydantic import BaseModel, Field, field_validator, model_validator
import re

# Regular expression for matching time in HH:MM format
TIME_REGEX = re.compile(r"^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$")

# Supported days mapping for weekly schedules
WEEKDAYS_MAP = {
    "sunday": 0, "sun": 0,
    "monday": 1, "mon": 1,
    "tuesday": 2, "tue": 2,
    "wednesday": 3, "wed": 3,
    "thursday": 4, "thu": 4,
    "friday": 5, "fri": 5,
    "saturday": 6, "sat": 6,
}

class ScheduleConfig(BaseModel):
    frequency: Literal["hours", "days", "weeks", "months"]
    interval: int = Field(default=1, ge=1, description="Interval spacing for the selected frequency")
    by_days: Optional[List[str]] = Field(default=None, alias="byDays", description="List of weekdays for weekly frequency")
    occurrences: Optional[int] = Field(default=None, ge=1, description="Optional maximum executions for the schedule")
    start_date: Optional[str] = Field(default=None, alias="startDate", description="ISO-8601 start date or datetime string")
    end_date: Optional[str] = Field(default=None, alias="endDate", description="ISO-8601 end date or datetime string")
    time: Optional[str] = Field(default=None, description="Time of day in HH:MM format")
    timezone: str = Field(default="UTC", description="IANA timezone name, e.g. America/New_York")

    model_config = {
        "populate_by_name": True,
        "extra": "ignore"
    }

    @field_validator("frequency", mode="before")
    @classmethod
    def normalize_frequency(cls, v: str) -> str:
        if isinstance(v, str):
            v_clean = v.strip().lower()
            if v_clean in ("hour", "hourly"):
                return "hours"
            if v_clean in ("day", "daily"):
                return "days"
            if v_clean in ("week", "weekly"):
                return "weeks"
            if v_clean in ("month", "monthly"):
                return "months"
            return v_clean
        return v

    @field_validator("time")
    @classmethod
    def validate_time(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v_str = str(v).strip()
            if not TIME_REGEX.match(v_str):
                raise ValueError("Time must be in 'HH:MM' format (24-hour clock)")
            return v_str
        return v

    @field_validator("by_days")
    @classmethod
    def validate_by_days(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        if v is not None:
            cleaned_days = []
            for day in v:
                day_clean = str(day).strip().lower()
                if day_clean not in WEEKDAYS_MAP:
                    raise ValueError(f"Invalid weekday name: '{day}'. Expected one of: {list(WEEKDAYS_MAP.keys())}")
                cleaned_days.append(day_clean)
            return cleaned_days
        return v

    @model_validator(mode="after")
    def validate_frequency_specific_rules(self) -> "ScheduleConfig":
        # Rule: byDays can only be specified for weekly schedules
        if self.frequency != "weeks" and self.by_days is not None:
            raise ValueError("byDays/by_days can only be specified when frequency is 'weeks'")
        return self
