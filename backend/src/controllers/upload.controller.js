import cloudinary from "../config/cloudinary.js";
import { createDocument, getDocument } from "../models/document.model.js";
import documentQueue from "../queue/document.queue.js";
import { Readable } from "stream";

// Upload buffer to Cloudinary as a raw resource (PDF)
function uploadToCloudinary(buffer, originalName) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: "raw", folder: "pdf-extractor", public_id: originalName, access_mode: "public" },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    Readable.from(buffer).pipe(stream);
  });
}

export async function uploadDocument(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    // 1. Upload to Cloudinary
    const cloudResult = await uploadToCloudinary(req.file.buffer, req.file.originalname);
    
    // 2. Create DB record
    const doc = await createDocument(cloudResult.secure_url);
    
    // 3. Enqueue processing job
    const fields = req.body.fields ? JSON.parse(req.body.fields) : [];
    await documentQueue.add("process", {
      documentId: doc.id,
      fileUrl: cloudResult.secure_url,
      fileBuffer: req.file.buffer.toString("base64"),
      fields,
    });

    res.status(202).json({ documentId: doc.id, status: doc.status });
  } catch (err) {
    console.error("[upload]", err);
    res.status(500).json({ error: "Upload failed", detail: err.message });
  }
}

export async function getDocumentById(req, res) {
  try {
    const doc = await getDocument(req.params.id);
    if (!doc) return res.status(404).json({ error: "Document not found" });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: "Fetch failed", detail: err.message });
  }
}
