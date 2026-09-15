from pydantic import BaseModel, ConfigDict, Field


class TextMessage(BaseModel):
    model_config = ConfigDict(strict=True)

    sender: str = Field(pattern=r"^[0-9]{5,20}$")
    name: str | None = None
    text: str = Field(min_length=1, max_length=4096)
    message_id: str = Field(min_length=1, max_length=512, pattern=r"^\S+$")
    phone_number_id: str = Field(pattern=r"^[0-9]+$")
    timestamp: str = Field(pattern=r"^[0-9]+$")
