import os
from dataclasses import dataclass
from functools import lru_cache


def _cors_origins() -> tuple[str, ...]:
    configured = os.getenv("CORS_ORIGINS", "")
    if configured.strip():
        return tuple(origin.strip() for origin in configured.split(",") if origin.strip())
    return ("http://localhost:5173", "http://127.0.0.1:5173")


@dataclass(frozen=True)
class Settings:
    app_name: str = "FCO - Forest Carbon Online"
    fia_api_base_url: str = os.getenv("FIA_API_BASE_URL", "https://apps.fs.usda.gov/fiadb-api")
    fia_default_evaluation_year: int = int(os.getenv("FIA_DEFAULT_EVALUATION_YEAR", "2023"))
    fia_timeout_seconds: float = float(os.getenv("FIA_TIMEOUT_SECONDS", "30"))
    cors_origins: tuple[str, ...] = _cors_origins()


@lru_cache
def get_settings() -> Settings:
    return Settings()
