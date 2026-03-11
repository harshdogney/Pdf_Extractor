import { useState } from "react";
import UploadForm from "../components/UploadForm.jsx";
import ResultViewer from "../components/ResultViewer.jsx";

export default function Home() {
  const [documentId, setDocumentId] = useState(null);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Title */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900">PDF Extractor</h1>
          <p className="mt-2 text-gray-500">Upload a PDF and let AI extract structured data instantly</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {!documentId ? (
            <UploadForm onUploaded={setDocumentId} />
          ) : (
            <ResultViewer documentId={documentId} onReset={() => setDocumentId(null)} />
          )}
        </div>
      </div>
    </main>
  );
}
