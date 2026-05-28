use crate::{db::Db, error::AppError, error::AppResult, models::note::*};
use chrono::Utc;
use rusqlite::params;
use tauri::State;
use uuid::Uuid;

fn now_ms() -> i64 {
    Utc::now().timestamp_millis()
}

fn compute_excerpt(content: &str) -> String {
    content.chars().take(200).collect()
}

fn count_words(content: &str) -> i64 {
    content.split_whitespace().count() as i64
}

#[tauri::command]
pub fn get_notes(
    db: State<'_, Db>,
    notebook_id: Option<String>,
    trashed: Option<bool>,
) -> AppResult<Vec<Note>> {
    let conn = db.0.lock().unwrap();
    let is_trashed = trashed.unwrap_or(false) as i64;

    let mut stmt = conn.prepare(
        "SELECT id, notebook_id, title, excerpt, word_count,
                is_pinned, is_trashed, trashed_at, created_at, updated_at
         FROM notes
         WHERE (notebook_id = ?1 OR ?1 IS NULL)
           AND is_trashed = ?2
         ORDER BY is_pinned DESC, updated_at DESC",
    )?;

    let notes = stmt
        .query_map(params![notebook_id, is_trashed], |row| {
            Ok(Note {
                id: row.get(0)?,
                notebook_id: row.get(1)?,
                title: row.get(2)?,
                excerpt: row.get(3)?,
                word_count: row.get(4)?,
                is_pinned: row.get::<_, i64>(5)? != 0,
                is_trashed: row.get::<_, i64>(6)? != 0,
                trashed_at: row.get(7)?,
                created_at: row.get(8)?,
                updated_at: row.get(9)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;

    Ok(notes)
}

#[tauri::command]
pub fn get_note(db: State<'_, Db>, id: String) -> AppResult<NoteWithContent> {
    let conn = db.0.lock().unwrap();

    let note = conn
        .query_row(
            "SELECT n.id, n.notebook_id, n.title, n.excerpt, n.word_count,
                n.is_pinned, n.is_trashed, n.trashed_at, n.created_at, n.updated_at,
                COALESCE(nc.content, '')
         FROM notes n
         LEFT JOIN note_contents nc ON nc.note_id = n.id
         WHERE n.id = ?1",
            params![id],
            |row| {
                Ok(NoteWithContent {
                    id: row.get(0)?,
                    notebook_id: row.get(1)?,
                    title: row.get(2)?,
                    excerpt: row.get(3)?,
                    word_count: row.get(4)?,
                    is_pinned: row.get::<_, i64>(5)? != 0,
                    is_trashed: row.get::<_, i64>(6)? != 0,
                    trashed_at: row.get(7)?,
                    created_at: row.get(8)?,
                    updated_at: row.get(9)?,
                    content: row.get(10)?,
                })
            },
        )
        .map_err(|_| AppError::NotFound(format!("Note {} introuvable", id)))?;

    Ok(note)
}

#[tauri::command]
pub fn create_note(db: State<'_, Db>, payload: CreateNotePayload) -> AppResult<NoteWithContent> {
    let conn = db.0.lock().unwrap();
    let id = Uuid::new_v4().to_string();
    let now = now_ms();
    let title = payload.title.unwrap_or_else(|| "Sans titre".to_string());

    conn.execute(
        "INSERT INTO notes (id, notebook_id, title, excerpt, word_count,
                            is_pinned, is_trashed, created_at, updated_at)
         VALUES (?1, ?2, ?3, '', 0, 0, 0, ?4, ?4)",
        params![id, payload.notebook_id, title, now],
    )?;

    conn.execute(
        "INSERT INTO note_contents (note_id, content) VALUES (?1, '')",
        params![id],
    )?;

    // On drop le lock avant d'appeler get_note
    drop(conn);
    get_note(db, id)
}

#[tauri::command]
pub fn update_note(
    db: State<'_, Db>,
    id: String,
    payload: UpdateNotePayload,
) -> AppResult<NoteWithContent> {
    let conn = db.0.lock().unwrap();
    let now = now_ms();

    if let Some(ref content) = payload.content {
        let excerpt = compute_excerpt(content);
        let word_count = count_words(content);

        conn.execute(
            "UPDATE note_contents SET content = ?1 WHERE note_id = ?2",
            params![content, id],
        )?;

        conn.execute(
            "UPDATE notes SET excerpt = ?1, word_count = ?2, updated_at = ?3 WHERE id = ?4",
            params![excerpt, word_count, now, id],
        )?;
    }

    if let Some(ref title) = payload.title {
        conn.execute(
            "UPDATE notes SET title = ?1, updated_at = ?2 WHERE id = ?3",
            params![title, now, id],
        )?;
    }

    if let Some(is_pinned) = payload.is_pinned {
        conn.execute(
            "UPDATE notes SET is_pinned = ?1, updated_at = ?2 WHERE id = ?3",
            params![is_pinned as i64, now, id],
        )?;
    }

    drop(conn);
    get_note(db, id)
}

#[tauri::command]
pub fn trash_note(db: State<'_, Db>, id: String) -> AppResult<()> {
    let conn = db.0.lock().unwrap();
    let now = now_ms();
    conn.execute(
        "UPDATE notes SET is_trashed = 1, trashed_at = ?1, updated_at = ?1 WHERE id = ?2",
        params![now, id],
    )?;
    Ok(())
}

#[tauri::command]
pub fn restore_note(db: State<'_, Db>, id: String) -> AppResult<()> {
    let conn = db.0.lock().unwrap();
    let now = now_ms();
    conn.execute(
        "UPDATE notes SET is_trashed = 0, trashed_at = NULL, updated_at = ?1 WHERE id = ?2",
        params![now, id],
    )?;
    Ok(())
}

#[tauri::command]
pub fn delete_note(db: State<'_, Db>, id: String) -> AppResult<()> {
    let conn = db.0.lock().unwrap();
    conn.execute("DELETE FROM notes WHERE id = ?1", params![id])?;
    Ok(())
}

#[tauri::command]
pub fn search_notes(db: State<'_, Db>, query: String) -> AppResult<Vec<Note>> {
    let conn = db.0.lock().unwrap();
    let fts_query = format!("{}*", query);

    let mut stmt = conn.prepare(
        "SELECT n.id, n.notebook_id, n.title, n.excerpt, n.word_count,
                n.is_pinned, n.is_trashed, n.trashed_at, n.created_at, n.updated_at
         FROM notes n
         JOIN note_contents nc ON nc.note_id = n.id
         JOIN notes_fts fts ON fts.rowid = nc.rowid
         WHERE notes_fts MATCH ?1 AND n.is_trashed = 0
         ORDER BY rank",
    )?;

    let notes = stmt
        .query_map(params![fts_query], |row| {
            Ok(Note {
                id: row.get(0)?,
                notebook_id: row.get(1)?,
                title: row.get(2)?,
                excerpt: row.get(3)?,
                word_count: row.get(4)?,
                is_pinned: row.get::<_, i64>(5)? != 0,
                is_trashed: row.get::<_, i64>(6)? != 0,
                trashed_at: row.get(7)?,
                created_at: row.get(8)?,
                updated_at: row.get(9)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;

    Ok(notes)
}
