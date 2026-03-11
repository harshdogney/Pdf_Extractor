# AI PDF Extractor

Upload a scanned PDF → OCR extracts text (MuPDF + Tesseract) → Gemini AI parses structured fields → stored in PostgreSQL → displayed in React UI.

---

## Architecture

```
React (Vite + Tailwind)
  └─ POST /api/upload ──► Express ──► Cloudinary (store PDF)
                                  └─► PostgreSQL (create record)
                                  └─► BullMQ (enqueue job)
                                         └─► Worker
                                               ├─ MuPDF (render pages → PNG)
                                               ├─ Tesseract.js (OCR on PNG)
                                               ├─ Gemini 2.5 Flash (field extraction)
                                               └─ PostgreSQL (save results)
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | Node.js (ESM), Express |
| Queue | BullMQ + Redis |
| OCR | MuPDF (PDF → PNG), Tesseract.js |
| AI | Google Gemini 2.5 Flash (`@google/generative-ai`) |
| Storage | Cloudinary (PDF files) |
| Database | PostgreSQL |

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 20 |
| PostgreSQL | ≥ 14 |
| Redis | ≥ 7 |

---

## 1. Environment Setup

### `backend/.env`
```env
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/pdf_extractor
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
GEMINI_API_KEY=your_gemini_api_key
REDIS_HOST=localhost
REDIS_PORT=6379
```

### `frontend/.env`
```env
VITE_API_BASE_URL=http://localhost:5000
```

---

## 2. Database Setup

```sql
-- Run in psql
CREATE DATABASE pdf_extractor;
```

The `documents` table is auto-created on server start via `initDB()`.

---

## 3. Start Redis

**macOS (Homebrew):**
```bash
brew install redis
brew services start redis
```



---

## 4. Install & Run

### Backend — API server
```bash
cd backend
npm install
npm run dev
# → http://localhost:5000
```

### Backend — Worker (separate terminal)
```bash
cd backend
npm run worker
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

---

## 5. How It Works

### Upload flow
1. User adds custom field names (e.g. `"Document No. & Year"`, `"Nature"`) in the UI
2. PDF is uploaded via `POST /api/upload` with the fields list
3. Express uploads the PDF to Cloudinary, creates a DB record, and enqueues a BullMQ job
4. Response returns `{ documentId, status: "uploaded" }` immediately

### Processing flow (Worker)
1. Worker picks up the job and marks the document as `processing`
2. MuPDF renders each PDF page to a high-resolution PNG (3× scale for accuracy)
3. Tesseract.js runs OCR on each PNG — currently `eng+tam` (English + Tamil)
4. All page texts are joined and sent to Gemini 2.5 Flash with the user-defined fields
5. Gemini returns a JSON array of extracted records
6. Results are saved to PostgreSQL and status is set to `completed`

### Polling flow
- Frontend polls `GET /api/document/:id` every 3 seconds until status is `completed` or `failed`

## 7. Document Status Flow

```
uploaded → processing → completed
                     └→ failed
```

---

## 8. File Size & Limits

- Max upload size: **10 MB**
- OCR text sent to Gemini: first **12,000 characters**
- Worker concurrency: **3 jobs** in parallel

---
