import genAI from "../config/openai.js";

export async function extractFieldsWithAI(text, fields = []) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: { responseMimeType: "application/json", temperature: 0 },
  });

  const fieldList = fields.map((f, i) => `${i + 1}. "${f}"`).join("\n");
  const jsonTemplate = JSON.stringify(
    Object.fromEntries(fields.map((f) => [f, ""])),
    null,
    2,
  );

  const prompt = `
  You are a high-accuracy data extraction engine.
  
  The OCR text may contain noise, typos, or formatting issues.
  
  User Queries:
  ${fields.map((f, i) => `${i + 1}. ${f}`).join("\n")}
  
  Instructions:
  - For each query, extract the relevant information from the OCR text.
  - Convert each query into a short, meaningful snake_case key.
  - Return results in structured JSON.
  - If multiple results exist → return arrays.
  - If a single result → return a value.
  - If no result → return null.
  - Do NOT include explanations, markdown, or extra text.
  - Handle OCR noise intelligently.
  
  Output Format Example:
  {
    "customer_name": "...",
    "transaction_amounts": [...],
    "invoice_number": "..."
  }
  
  IMPORTANT:
  - The response must be valid JSON only.
  
  OCR Text:
  ${text.slice(0, 12000)}
  `;

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  const raw = result.response.text().trim();
  const clean = raw
    .replace(/^```json?\n?/, "")
    .replace(/```$/, "")
    .trim();
  return JSON.parse(clean);
}
