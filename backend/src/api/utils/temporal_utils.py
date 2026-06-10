from temporalio.client import ScheduleSpec
from src.api.utils.temporal.models import ScheduleConfig
from src.api.utils.temporal.parser import parse_schedule_to_spec_and_state

def parse_schedule_config(config: dict) -> ScheduleSpec:
    """
    Backward-compatible wrapper for parsing schedule configurations.
    Validates the configuration dict, generates a ScheduleSpec, and returns it.
    
    Raises:
        TypeError: If config is not a dictionary.
        ValueError: For any validation or formatting errors (e.g. invalid date/time/frequency/timezone).
    """
    if not isinstance(config, dict):
        raise TypeError(f"Schedule configuration must be a dictionary, got {type(config)}")

    try:
        # 1. Parse raw dict into our validated Pydantic model
        config_model = ScheduleConfig.model_validate(config)
        
        # 2. Extract schedule spec
        spec, _ = parse_schedule_to_spec_and_state(config_model)
        return spec
    except Exception as e:
        # If it's already a ValueError/TypeError, reraise it to maintain exact error contract,
        # otherwise wrap in a ValueError.
        if isinstance(e, (ValueError, TypeError)):
            raise e
        raise ValueError(f"Failed to parse schedule configuration: {str(e)}") from e
