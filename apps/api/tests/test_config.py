from hospital_api.config import Settings


def test_defaults() -> None:
    settings = Settings()

    assert settings.environment == "local"
    assert settings.api_prefix == "/api/v1"
    assert "http://localhost:5173" in settings.cors_allow_origins


def test_environment_override() -> None:
    settings = Settings(environment="production")

    assert settings.environment == "production"
