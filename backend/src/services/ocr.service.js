import mupdf from "mupdf";
import Tesseract from "tesseract.js";

export async function runOCR(buffer) {
  const doc = mupdf.Document.openDocument(buffer, "application/pdf");
  const pageCount = doc.countPages();
  const pageTexts = [];

  for (let i = 0; i < pageCount; i++) {
    const page = doc.loadPage(i);
    const pixmap = page.toPixmap(
      mupdf.Matrix.scale(3, 3),
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
  }

  return pageTexts.join("\n\n");
}
