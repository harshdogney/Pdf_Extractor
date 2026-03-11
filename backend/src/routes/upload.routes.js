import { Router } from "express";
import multer from "multer";
import { uploadDocument, getDocumentById } from "../controllers/upload.controller.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 20 MB
  fileFilter: (_, file, cb) =>
    file.mimetype === "application/pdf"
      ? cb(null, true)
      : cb(new Error("Only PDF files are allowed")),
});

router.post("/upload", upload.single("pdf"), uploadDocument);
router.get("/document/:id", getDocumentById);

export default router;
