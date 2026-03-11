import { useRef, useState } from "react";
import { getDocument } from "../services/api.js";

const STATUS_STYLES = {
  uploaded:   "bg-gray-100 text-gray-600",
  processing: "bg-yellow-100 text-yellow-700",
  completed:  "bg-green-100 text-green-700",
  failed:     "bg-red-100 text-red-600",
};

export default function ResultViewer({ documentId, onReset }) {
  const [doc, setDoc] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);

  async function fetchResult() {
    setLoading(true);
    setError("");
    let active = true;
    async function poll() {
      try {
        const { data } = await getDocument(documentId);
        if (!active) return;
        setDoc(data);
        if (data.status !== "completed" && data.status !== "failed") {
          timerRef.current = setTimeout(poll, 3000);
        } else {
          setLoading(false);
        }
      } catch {
        if (active) { setError("Failed to fetch document status."); setLoading(false); }
      }
    }
    poll();
    return () => { active = false; clearTimeout(timerRef.current); };
  }

  const extracted = doc?.extracted_data;
  const isArray = Array.isArray(extracted);
  const fields = !isArray ? extracted : null;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Extraction Result</h2>
        <button onClick={onReset} className="text-sm text-blue-500 hover:underline">Upload another</button>
      </div>

      {/* Initial button — no fetch yet */}
      {!doc && !loading && (
        <button
          onClick={fetchResult}
          className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Get Extraction Result
        </button>
      )}

      {error && <p className="text-red-500 text-center text-sm">{error}</p>}

      {/* Polling spinner */}
      {loading && (
        <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <svg className="animate-spin h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span className="text-sm text-yellow-700">AI is processing your document…</span>
        </div>
      )}

      {doc && (
        <span className={`text-xs font-medium px-3 py-1 rounded-full capitalize ${STATUS_STYLES[doc.status] || STATUS_STYLES.uploaded}`}>
          {doc.status}
        </span>
      )}

      {/* Extracted fields — array of transaction rows */}
      {doc?.status === "completed" && isArray && extracted.length > 0 && (() => {
        const headers = Object.keys(extracted[0]);
        return (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
              <p className="text-sm font-medium text-gray-600">Extracted Transactions ({extracted.length})</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">#</th>
                    {headers.map(h => (
                      <th key={h} className="px-4 py-2 text-left text-xs font-medium text-gray-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {extracted.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                      {headers.map(h => (
                        <td key={h} className="px-4 py-3 text-gray-800 break-words max-w-xs">
                          {Array.isArray(row[h])
                            ? row[h].join(", ")
                            : row[h] ?? <span className="text-gray-400 italic">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* Extracted fields — flat object */}
      {doc?.status === "completed" && fields && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
            <p className="text-sm font-medium text-gray-600">Extracted Fields</p>
          </div>
          <dl className="divide-y divide-gray-100">
            {Object.entries(fields).map(([key, val]) => (
              <div key={key} className="flex px-5 py-3 gap-4">
                <dt className="w-36 shrink-0 text-sm font-medium text-gray-500 capitalize">{key.replace(/_/g, " ")}</dt>
                <dd className="text-sm text-gray-800 break-all">{Array.isArray(val) ? val.join(", ") : val || <span className="text-gray-400 italic">—</span>}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {/* Failed state */}
      {doc?.status === "failed" && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          Processing failed. Please try uploading the document again.
        </div>
      )}

      {/* Raw text */}
      {doc?.raw_text && (
        <details>
          <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 select-none">
            View raw extracted text
          </summary>
          <pre className="mt-2 p-4 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 whitespace-pre-wrap max-h-64 overflow-y-auto">
            {doc.raw_text}
          </pre>
        </details>
      )}
    </div>
  );
}
