import "dotenv/config";
import express from "express";
import cors from "cors";
import { initDB } from "./config/db.js";
import uploadRoutes from "./routes/upload.routes.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use("/api", uploadRoutes);

// Health check
app.get("/health", (_, res) => res.json({ status: "ok" }));

// Multer error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message });
});

await initDB();
app.listen(PORT, () => console.log(`[server] Running on http://localhost:${PORT}`));
