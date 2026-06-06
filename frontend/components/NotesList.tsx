"use client";

import { Note } from "@/lib/api";

interface Props {
  notes: Note[];
  loading: boolean;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function NotesList({ notes, loading }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        Your Notes{" "}
        {!loading && (
          <span className="text-sm font-normal text-gray-400">({notes.length})</span>
        )}
      </h2>

      {loading ? (
        <div className="text-sm text-gray-400">Loading…</div>
      ) : notes.length === 0 ? (
        <div className="text-sm text-gray-400">No notes yet. Add one above!</div>
      ) : (
        <ul className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
          {notes.map((note) => (
            <li
              key={note.id}
              className="p-4 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-medium text-gray-800 truncate">
                  {note.title ?? "Untitled"}
                </span>
                <span
                  className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                    note.embedded
                      ? "bg-green-100 text-green-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {note.embedded ? "indexed" : "not indexed"}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500 line-clamp-2 leading-relaxed">
                {note.content_preview}
              </p>
              <p className="mt-2 text-xs text-gray-300">{formatDate(note.created_at)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
