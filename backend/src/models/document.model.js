import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    file_url: { type: String, required: true },
    status: { type: String, required: true, default: "uploaded" },
    raw_text: { type: String, default: null },
    extracted_data: { type: mongoose.Schema.Types.Mixed, default: null },
    created_at: { type: Date, default: Date.now },
  },
  { collection: "documents", versionKey: false }
);

const Document = mongoose.models.Document || mongoose.model("Document", documentSchema);

function normalizeDocument(doc) {
  if (!doc) return null;
  const plain = doc.toObject ? doc.toObject() : doc;
  return {
    id: plain._id.toString(),
    file_url: plain.file_url,
    status: plain.status,
    raw_text: plain.raw_text,
    extracted_data: plain.extracted_data,
    created_at: plain.created_at,
  };
}

export async function createDocument(fileUrl) {
  const doc = await Document.create({ file_url: fileUrl, status: "uploaded" });
  return normalizeDocument(doc);
}

export async function getDocument(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  const doc = await Document.findById(id);
  return normalizeDocument(doc);
}

export async function updateDocument(id, fields) {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  const doc = await Document.findByIdAndUpdate(id, { $set: fields }, { new: true });
  return normalizeDocument(doc);
}
