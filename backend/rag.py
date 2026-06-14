import logging
import uuid
from typing import Optional

from openai import OpenAI
from sentence_transformers import SentenceTransformer
from sqlalchemy.orm import Session

from settings import settings

logger = logging.getLogger(__name__)

_embedding_model: Optional[SentenceTransformer] = None


def get_embedding_model() -> SentenceTransformer:
    global _embedding_model
    if _embedding_model is None:
        _embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
    return _embedding_model


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
    chunks = []
    start = 0
    while start < len(text):
        end = min(start + chunk_size, len(text))
        chunks.append(text[start:end])
        if end == len(text):
            break
        start = end - overlap
    return chunks


def embed_note(db: Session, note_id: str, content: str) -> int:
    from models import NoteChunk

    chunks = chunk_text(content)
    model = get_embedding_model()
    embeddings = model.encode(chunks)

    db.query(NoteChunk).filter(
        NoteChunk.note_id == uuid.UUID(note_id)
    ).delete(synchronize_session=False)

    for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
        db.add(NoteChunk(
            id=uuid.uuid4(),
            note_id=uuid.UUID(note_id),
            chunk_index=i,
            text=chunk,
            embedding=embedding.tolist(),
        ))

    db.commit()
    return len(chunks)


def delete_note_vectors(db: Session, note_id: str) -> None:
    from models import NoteChunk

    db.query(NoteChunk).filter(
        NoteChunk.note_id == uuid.UUID(note_id)
    ).delete(synchronize_session=False)
    db.commit()


def query_notes(db: Session, question: str, n_results: int = 3) -> list[dict]:
    from models import NoteChunk

    model = get_embedding_model()
    embedding = model.encode([question])[0].tolist()

    chunks = (
        db.query(NoteChunk)
        .order_by(NoteChunk.embedding.cosine_distance(embedding))
        .limit(n_results)
        .all()
    )

    return [
        {
            "note_id": str(chunk.note_id),
            "chunk_index": chunk.chunk_index,
            "text": chunk.text,
        }
        for chunk in chunks
    ]


def ask_llm(question: str, sources: list[dict]) -> str:
    if not sources:
        return (
            "I don't have any relevant notes to answer this question. "
            "Please add and embed some notes first."
        )

    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=settings.openrouter_api_key,
    )

    context = "\n\n".join(
        f"[Note {s['note_id']}, chunk {s['chunk_index']}]: {s['text']}"
        for s in sources
    )

    response = client.chat.completions.create(
        model=settings.llm_model,
        temperature=0.2,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a helpful study assistant. Answer questions ONLY from the "
                    "provided context from the user's notes. Always cite which note(s) you "
                    "used (by note_id). If the context is insufficient, say you don't know "
                    "based on the available notes."
                ),
            },
            {
                "role": "user",
                "content": f"Context from notes:\n\n{context}\n\nQuestion: {question}",
            },
        ],
    )
    return response.choices[0].message.content
