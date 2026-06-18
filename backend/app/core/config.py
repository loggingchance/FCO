import os
from dataclasses import dataclass
from functools import lru_cache


@dataclass(frozen=True)
class Settings:
    app_name: str = "FCO - Forest Carbon Online"
    enable_workbench: bool = os.getenv("ENABLE_WORKBENCH", "true").lower() == "true"
    fia_api_base_url: str = os.getenv("FIA_API_BASE_URL", "https://apps.fs.usda.gov/fiadb-api")
    fia_default_evaluation_year: int = int(os.getenv("FIA_DEFAULT_EVALUATION_YEAR", "2023"))
    fia_timeout_seconds: float = float(os.getenv("FIA_TIMEOUT_SECONDS", "30"))
    fvs_executable_path: str | None = os.getenv("FVS_EXECUTABLE_PATH") or None


@lru_cache
def get_settings() -> Settings:
    return Settings()
