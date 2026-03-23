import "dotenv/config";
import { Worker } from "bullmq";
import redis from "../config/redis.js";
import { extractText } from "../utils/extractText.js";
import { extractFieldsWithAI } from "../services/ai.service.js";
import { updateDocument } from "../models/document.model.js";
import { initDB } from "../config/db.js";

await initDB();

/**
 * Worker flow:
 * 1. Mark document as "processing"
 * 2. Download PDF & extract text (OCR fallback for scanned PDFs)
 * 3. Send text to OpenAI for structured field extraction
 * 4. Save results and mark "completed"
 * 5. On error → mark "failed"
 */
const worker = new Worker(
  "document-processing",
  async (job) => {
    const { documentId, fileUrl, fileBuffer, fields } = job.data;
    console.log(`[worker] Processing job ${job.id} — document ${documentId}`);

    await updateDocument(documentId, { status: "processing" });

    const buffer = Buffer.from(fileBuffer, "base64");
    const text = await extractText(buffer);
    const extractedData = await extractFieldsWithAI(text, fields);

    await updateDocument(documentId, {
      status: "completed",
      raw_text: text,
      extracted_data: extractedData,
    });

    console.log(`[worker] Completed document ${documentId}`);
  },
  {
    connection: redis,
    concurrency: 3,
  }
);

worker.on("failed", async (job, err) => {
  console.error(`[worker] Job ${job?.id} failed:`, err.message);
  if (job?.data?.documentId) {
    await updateDocument(job.data.documentId, { status: "failed" }).catch(() => {});
  }
});

console.log("[worker] Listening for document-processing jobs...");
