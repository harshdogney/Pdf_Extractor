import pool from "../config/db.js";

export async function createDocument(fileUrl) {
  const { rows } = await pool.query(
    `INSERT INTO documents (file_url, status) VALUES ($1, 'uploaded') RETURNING *`,
    [fileUrl]
  );
  return rows[0];
}

export async function getDocument(id) {
  const { rows } = await pool.query(`SELECT * FROM documents WHERE id = $1`, [id]);
  return rows[0] || null;
}

export async function updateDocument(id, fields) {
  const keys = Object.keys(fields);
  const values = Object.values(fields);
  const set = keys.map((k, i) => `${k} = $${i + 2}`).join(", ");
  const { rows } = await pool.query(
    `UPDATE documents SET ${set} WHERE id = $1 RETURNING *`,
    [id, ...values]
  );
  return rows[0];
}
