"use client";

import { useState } from "react";
import { askQuestion, Source } from "@/lib/api";

export default function AskQuestion() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sourcesOpen, setSourcesOpen] = useState(false);

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setError("");
    setAnswer("");
    setSources([]);
    setSourcesOpen(false);

    try {
      const result = await askQuestion(question);
      setAnswer(result.answer);
      setSources(result.sources);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Ask a Question</h2>
      <form onSubmit={handleAsk} className="space-y-3">
        <input
          type="text"
          placeholder="What do you want to know about your notes?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={loading}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 placeholder:text-gray-400"
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Thinking…
            </span>
          ) : (
            "Ask"
          )}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      {answer && (
        <div className="mt-4 space-y-3">
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
            {answer}
          </div>

          {sources.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setSourcesOpen((o) => !o)}
                className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
              >
                {sourcesOpen ? "▲ Hide" : "▼ Show"} sources ({sources.length})
              </button>
              {sourcesOpen && (
                <ul className="mt-2 space-y-2">
                  {sources.map((s, i) => (
                    <li
                      key={i}
                      className="p-3 bg-gray-50 border border-gray-100 rounded-lg"
                    >
                      <p className="text-xs font-mono text-gray-400 mb-1">
                        note {s.note_id.slice(0, 8)}… · chunk {s.chunk_index}
                      </p>
                      <p className="text-xs text-gray-600 leading-relaxed">{s.text}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {!answer && !error && !loading && (
        <p className="mt-4 text-xs text-gray-400">
          Ask anything about your embedded notes. The AI answers only from your content.
        </p>
      )}
    </div>
  );
}
