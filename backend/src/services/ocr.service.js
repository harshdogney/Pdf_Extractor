import mupdf from "mupdf";
import Tesseract from "tesseract.js";

export async function runOCR(buffer) {
  const doc = mupdf.Document.openDocument(buffer, "application/pdf");
  const pageCount = doc.countPages();
  const pageTexts = [];

  // Basic speed optimizations:
  // - Only OCR the first few pages (most docs have important info early).
  // - Stop once we have enough text for the AI step (~12k chars).
  // - Render at 2x instead of 3x for faster image generation.
  const MAX_PAGES = 5;
  const MAX_CHARS = 12000;

  for (let i = 0; i < pageCount && i < MAX_PAGES; i++) {
    const page = doc.loadPage(i);
    const pixmap = page.toPixmap(
      mupdf.Matrix.scale(2, 2),
      mupdf.ColorSpace.DeviceRGB,
      false,
      true
    );
    const pngBuffer = Buffer.from(pixmap.asPNG());
    const { data: { text } } = await Tesseract.recognize(pngBuffer, "eng+tam", {
      logger: () => {},
    });
    // "eng+tam" just for now will take dynamic 
    pageTexts.push(text.trim());

    const joined = pageTexts.join("\n\n");
    if (joined.length >= MAX_CHARS) {
      return joined.slice(0, MAX_CHARS);
    }
  }

  return pageTexts.join("\n\n");
}
