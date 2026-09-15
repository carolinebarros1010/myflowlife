import os
from pathlib import Path
from typing import Literal

from dotenv import load_dotenv
from pydantic import BaseModel, ConfigDict, Field, SecretStr, ValidationError, model_validator


class Settings(BaseModel):
    model_config = ConfigDict(hide_input_in_errors=True)

    app_env: Literal["development", "test", "production"] = "development"
    app_host: str = Field(default="0.0.0.0", min_length=1)
    app_port: int = Field(default=8000, ge=1, le=65535)
    whatsapp_access_token: SecretStr = SecretStr("")
    whatsapp_phone_number_id: str = Field(default="", pattern=r"^\d*$")
    whatsapp_business_account_id: str = Field(default="", pattern=r"^\d*$")
    whatsapp_verify_token: SecretStr = SecretStr("")
    whatsapp_api_version: str = Field(default="v26.0", pattern=r"^v\d+\.\d+$")
    whatsapp_app_secret: SecretStr = SecretStr("")

    @model_validator(mode="after")
    def validate_production(self) -> "Settings":
        if self.app_env == "production" and not all((
            self.whatsapp_access_token.get_secret_value(),
            self.whatsapp_phone_number_id,
            self.whatsapp_verify_token.get_secret_value(),
            self.whatsapp_app_secret.get_secret_value(),
        )):
            raise ValueError("Configure as credenciais WhatsApp e o App Secret em produção")
        return self


def load_settings() -> Settings:
    load_dotenv(Path(__file__).resolve().parents[2] / ".env", override=False)
    values = {name: os.environ[name.upper()] for name in Settings.model_fields
              if name.upper() in os.environ}
    try:
        return Settings.model_validate(values)
    except ValidationError:
        raise RuntimeError("Configuração inválida; confira as variáveis do .env") from None
