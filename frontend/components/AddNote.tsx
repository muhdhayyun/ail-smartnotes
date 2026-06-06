"use client";

import { useState } from "react";
import { createNote, embedNote } from "@/lib/api";

type Status = "idle" | "saving" | "embedding" | "done" | "error";

interface Props {
  onNoteAdded: () => void;
}

export default function AddNote({ onNoteAdded }: Props) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setStatus("saving");
    setMessage("");

    try {
      const note = await createNote(title, content);
      setStatus("embedding");

      const result = await embedNote(note.id);
      setStatus("done");
      setMessage(`Saved and indexed (${result.chunks_created} chunks).`);
      setTitle("");
      setContent("");
      onNoteAdded();

      setTimeout(() => setStatus("idle"), 3000);
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  const busy = status === "saving" || status === "embedding";

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Add Note</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          placeholder="Title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={busy}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 placeholder:text-gray-400"
        />
        <textarea
          placeholder="Paste your study notes here…"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={busy}
          rows={6}
          required
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 placeholder:text-gray-400"
        />
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="submit"
            disabled={busy || !content.trim()}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {busy ? (
              <span className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {status === "saving" ? "Saving…" : "Embedding…"}
              </span>
            ) : (
              "Save Note"
            )}
          </button>

          {status === "done" && (
            <span className="text-sm text-green-600 font-medium">✓ {message}</span>
          )}
          {status === "error" && (
            <span className="text-sm text-red-500">{message}</span>
          )}
        </div>
      </form>
    </div>
  );
}
