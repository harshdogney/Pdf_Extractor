import { useState, useRef } from "react";
import { uploadPDF } from "../services/api.js";

export default function UploadForm({ onUploaded }) {
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [fieldInput, setFieldInput] = useState("");
  const [fields, setFields] = useState([]);
  const inputRef = useRef();

  function addField() {
    const val = fieldInput.trim();
    if (val && !fields.includes(val)) setFields((f) => [...f, val]);
    setFieldInput("");
  }

  async function handleFile(file) {
    if (!file || file.type !== "application/pdf") {
      setError("Please select a valid PDF file.");
      return;
    }
    setError("");
    setUploading(true);
    setProgress(0);
    try {
      const { data } = await uploadPDF(file, setProgress, fields);
      onUploaded(data.documentId);
    } catch (e) {
      setError(e.response?.data?.error || "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Custom fields */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Fields to extract</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={fieldInput}
            onChange={(e) => setFieldInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addField())}
            placeholder="e.g. invoice_number"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button onClick={addField} type="button" className="px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600">
            Add
          </button>
        </div>
        {fields.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {fields.map((f) => (
              <span key={f} className="flex items-center gap-1 bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                {f}
                <button onClick={() => setFields((prev) => prev.filter((x) => x !== f))} className="hover:text-red-500">×</button>
              </span>
            ))}
          </div>
        )}
      </div>
      <div
        onClick={() => !uploading && inputRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors
          ${dragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"}
          ${uploading ? "pointer-events-none opacity-60" : ""}`}
      >
        <svg className="mx-auto mb-3 h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p className="text-gray-600 font-medium">
          {uploading ? "Uploading…" : "Drop your PDF here or click to browse"}
        </p>
        <p className="text-sm text-gray-400 mt-1">PDF only · max 20 MB</p>
        <input ref={inputRef} type="file" accept="application/pdf" className="hidden"
          onChange={(e) => handleFile(e.target.files[0])} />
      </div>

      {uploading && (
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-500 mb-1">
            <span>Uploading</span><span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
    </div>
  );
}
