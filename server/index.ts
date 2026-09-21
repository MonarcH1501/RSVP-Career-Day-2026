import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { pool, testConnection } from './db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// 1. Health check & status database
app.get('/api/health', async (_req: Request, res: Response) => {
  const status = await testConnection();
  res.json({
    status: status.success ? 'ok' : 'error',
    database: 'MySQL',
    connected: status.success,
    message: status.message,
  });
});

// 2. Ambil Semua Data Tamu (Read)
app.get('/api/guests', async (_req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM rsvp_guests ORDER BY created_at DESC'
    );
    res.json({ data: rows, error: null });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ data: [], error: msg });
  }
});

// 3. Tambah Tamu Baru (Create)
app.post('/api/guests', async (req: Request, res: Response) => {
  try {
    const {
      institution_category,
      university_name,
      pic_name,
      pic_position,
      pic_phone,
      pic_email,
      attendance_status,
      attendee_count,
      additional_attendees,
      dietary_requirements,
      presentation_topic,
      needs_projector,
      notes,
    } = req.body;

    const id = crypto.randomUUID();
    const query = `
      INSERT INTO rsvp_guests 
      (id, institution_category, university_name, pic_name, pic_position, pic_phone, pic_email, attendance_status, attendee_count, additional_attendees, dietary_requirements, presentation_topic, needs_projector, notes, is_checked_in, checked_in_at, checked_in_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NULL, '')
    `;

    await pool.query(query, [
      id,
      institution_category || 'universitas',
      university_name,
      pic_name,
      pic_position || '',
      pic_phone || '',
      pic_email || '',
      attendance_status || 'hadir',
      attendance_status === 'tidak_hadir' ? 0 : (attendee_count || 1),
      additional_attendees || '',
      dietary_requirements || '',
      presentation_topic || '',
      needs_projector ? 1 : 0,
      notes || '',
    ]);

    const [createdRows] = await pool.query('SELECT * FROM rsvp_guests WHERE id = ?', [id]);
    const created = Array.isArray(createdRows) && createdRows.length > 0 ? createdRows[0] : null;

    res.status(201).json({ data: created, error: null });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ data: null, error: msg });
  }
});

// 4. Update Data Tamu (Update)
app.put('/api/guests/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      institution_category,
      university_name,
      pic_name,
      pic_position,
      pic_phone,
      pic_email,
      attendance_status,
      attendee_count,
      additional_attendees,
      dietary_requirements,
      presentation_topic,
      needs_projector,
      notes,
    } = req.body;

    const query = `
      UPDATE rsvp_guests SET
        institution_category = COALESCE(?, institution_category),
        university_name = COALESCE(?, university_name),
        pic_name = COALESCE(?, pic_name),
        pic_position = COALESCE(?, pic_position),
        pic_phone = COALESCE(?, pic_phone),
        pic_email = COALESCE(?, pic_email),
        attendance_status = COALESCE(?, attendance_status),
        attendee_count = COALESCE(?, attendee_count),
        additional_attendees = COALESCE(?, additional_attendees),
        dietary_requirements = COALESCE(?, dietary_requirements),
        presentation_topic = COALESCE(?, presentation_topic),
        needs_projector = COALESCE(?, needs_projector),
        notes = COALESCE(?, notes)
      WHERE id = ?
    `;

    await pool.query(query, [
      institution_category,
      university_name,
      pic_name,
      pic_position,
      pic_phone,
      pic_email,
      attendance_status,
      attendee_count,
      additional_attendees,
      dietary_requirements,
      presentation_topic,
      needs_projector !== undefined ? (needs_projector ? 1 : 0) : null,
      notes,
      id,
    ]);

    const [updatedRows] = await pool.query('SELECT * FROM rsvp_guests WHERE id = ?', [id]);
    const updated = Array.isArray(updatedRows) && updatedRows.length > 0 ? updatedRows[0] : null;

    res.json({ data: updated, error: null });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ data: null, error: msg });
  }
});

// 5. Presensi Check-In / Batal Check-In
app.patch('/api/guests/:id/checkin', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { is_checked_in, checked_in_by } = req.body;

    const checkedInAt = is_checked_in ? new Date() : null;
    const query = `
      UPDATE rsvp_guests 
      SET is_checked_in = ?, checked_in_at = ?, checked_in_by = ?
      WHERE id = ?
    `;

    await pool.query(query, [
      is_checked_in ? 1 : 0,
      checkedInAt,
      is_checked_in ? (checked_in_by || 'Panitia Restoran Gajah Mada') : '',
      id,
    ]);

    const [updatedRows] = await pool.query('SELECT * FROM rsvp_guests WHERE id = ?', [id]);
    const updated = Array.isArray(updatedRows) && updatedRows.length > 0 ? updatedRows[0] : null;

    res.json({ data: updated, error: null });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ data: null, error: msg });
  }
});

// 6. Hapus Data Tamu (Delete)
app.delete('/api/guests/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM rsvp_guests WHERE id = ?', [id]);
    res.json({ success: true, error: null });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

app.listen(PORT, () => {
  console.log(`Backend API Server berjalan di http://localhost:${PORT}`);
});
