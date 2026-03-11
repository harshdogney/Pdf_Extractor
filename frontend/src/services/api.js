import axios from "axios";

const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL});

export const uploadPDF = (file, onProgress, fields = []) => {
  const form = new FormData();
  form.append("pdf", file);
  if (fields.length) form.append("fields", JSON.stringify(fields));
  return api.post("/api/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => onProgress(Math.round((e.loaded * 100) / e.total)),
  });
};

export const getDocument = (id) => api.get(`/api/document/${id}`);
