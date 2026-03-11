import genAI from "../config/openai.js";

export async function extractFieldsWithAI(text, fields = []) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: { responseMimeType: "application/json", temperature: 0 }
  });

  const fieldList = fields.map((f, i) => `${i + 1}. "${f}"`).join("\n");
  const jsonTemplate = JSON.stringify(Object.fromEntries(fields.map(f => [f, ""])), null, 2);

  const prompt = `
You are extracting structured data from a scanned document. The text below was produced by OCR and may contain noise or garbled characters.

Extract the following fields for EVERY record/transaction found:
${fieldList}

Rules:
- Extract ALL records found.
- Multiple values → return as array. Single value → return as string. Missing → null.
- Return ONLY a JSON array, no explanation, no markdown.

JSON format:
[
  ${jsonTemplate}
]

OCR Text:
${text.slice(0, 12000)}
`;

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }]
  });

  const raw = result.response.text().trim();
  console.log("RAW:", raw);
  const clean = raw.replace(/^```json?\n?/, "").replace(/```$/, "").trim();
  return JSON.parse(clean);
}
