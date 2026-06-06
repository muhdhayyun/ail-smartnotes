from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime
import uuid


class NoteCreate(BaseModel):
    title: Optional[str] = None
    content: str

    @field_validator("content")
    @classmethod
    def content_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("content must not be empty")
        return v


class NoteResponse(BaseModel):
    id: uuid.UUID
    title: Optional[str]
    content: str
    embedded: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class NoteListItem(BaseModel):
    id: uuid.UUID
    title: Optional[str]
    content_preview: str
    embedded: bool
    created_at: datetime


class EmbedResponse(BaseModel):
    id: uuid.UUID
    chunks_created: int


class ChatRequest(BaseModel):
    question: str


class Source(BaseModel):
    note_id: str
    chunk_index: int
    text: str


class ChatResponse(BaseModel):
    answer: str
    sources: list[Source]
