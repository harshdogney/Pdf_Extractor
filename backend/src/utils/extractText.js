import { runOCR } from "../services/ocr.service.js";

export async function extractText(buffer) {
  return runOCR(buffer);
}
