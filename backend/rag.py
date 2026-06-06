import logging
import chromadb
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction
from openai import OpenAI
from settings import settings

logger = logging.getLogger(__name__)

_collection = None


def get_collection():
    global _collection
    if _collection is None:
        client = chromadb.PersistentClient(path=settings.chroma_dir)
        ef = SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
        _collection = client.get_or_create_collection(
            name="notes",
            embedding_function=ef,
            metadata={"hnsw:space": "cosine"},
        )
    return _collection


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


def embed_note(note_id: str, content: str) -> int:
    collection = get_collection()

    existing = collection.get(where={"note_id": note_id})
    if existing["ids"]:
        collection.delete(ids=existing["ids"])

    chunks = chunk_text(content)
    ids = [f"{note_id}_chunk_{i}" for i in range(len(chunks))]
    metadatas = [{"note_id": note_id, "chunk_index": i} for i in range(len(chunks))]

    collection.add(ids=ids, documents=chunks, metadatas=metadatas)
    return len(chunks)


def query_notes(question: str, n_results: int = 3) -> list[dict]:
    collection = get_collection()

    count = collection.count()
    if count == 0:
        return []

    results = collection.query(
        query_texts=[question],
        n_results=min(n_results, count),
    )

    sources = []
    if results["documents"] and results["documents"][0]:
        for i, doc in enumerate(results["documents"][0]):
            metadata = results["metadatas"][0][i]
            sources.append({
                "note_id": metadata["note_id"],
                "chunk_index": int(metadata["chunk_index"]),
                "text": doc,
            })
    return sources


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
