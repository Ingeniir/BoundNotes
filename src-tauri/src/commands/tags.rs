use crate::{db::Db, error::AppResult, models::tag::*};
use rusqlite::params;
use tauri::State;
use uuid::Uuid;

#[tauri::command]
pub fn get_tags(db: State<'_, Db>) -> AppResult<Vec<Tag>> {
    let conn = db.0.lock().unwrap();
    let mut stmt =
        conn.prepare("SELECT id, name, color, position FROM tags ORDER BY position ASC, name ASC")?;

    let tags = stmt
        .query_map([], |row| {
            Ok(Tag {
                id: row.get(0)?,
                name: row.get(1)?,
                color: row.get(2)?,
                position: row.get(3)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;

    Ok(tags)
}

#[tauri::command]
pub fn create_tag(db: State<'_, Db>, payload: CreateTagPayload) -> AppResult<Tag> {
    let conn = db.0.lock().unwrap();
    let id = Uuid::new_v4().to_string();

    let position: i64 = conn.query_row(
        "SELECT COALESCE(MAX(position), 0) + 1 FROM tags",
        [],
        |row| row.get(0),
    )?;

    conn.execute(
        "INSERT OR IGNORE INTO tags (id, name, color, position) VALUES (?1, ?2, ?3, ?4)",
        params![id, payload.name, payload.color, position],
    )?;

    // Retourne le tag existant ou nouvellement créé
    let tag = conn.query_row(
        "SELECT id, name, color, position FROM tags WHERE name = ?1",
        params![payload.name],
        |row| {
            Ok(Tag {
                id: row.get(0)?,
                name: row.get(1)?,
                color: row.get(2)?,
                position: row.get(3)?,
            })
        },
    )?;

    Ok(tag)
}

#[tauri::command]
pub fn add_tag_to_note(db: State<'_, Db>, note_id: String, tag_id: String) -> AppResult<()> {
    let conn = db.0.lock().unwrap();
    conn.execute(
        "INSERT OR IGNORE INTO note_tags (note_id, tag_id) VALUES (?1, ?2)",
        params![note_id, tag_id],
    )?;
    Ok(())
}

#[tauri::command]
pub fn remove_tag_from_note(db: State<'_, Db>, note_id: String, tag_id: String) -> AppResult<()> {
    let conn = db.0.lock().unwrap();
    conn.execute(
        "DELETE FROM note_tags WHERE note_id = ?1 AND tag_id = ?2",
        params![note_id, tag_id],
    )?;
    Ok(())
}

#[tauri::command]
pub fn get_tags_for_note(db: State<'_, Db>, note_id: String) -> AppResult<Vec<Tag>> {
    let conn = db.0.lock().unwrap();
    let mut stmt = conn.prepare(
        "SELECT t.id, t.name, t.color, t.position
         FROM tags t
         JOIN note_tags nt ON nt.tag_id = t.id
         WHERE nt.note_id = ?1",
    )?;

    let tags = stmt
        .query_map(params![note_id], |row| {
            Ok(Tag {
                id: row.get(0)?,
                name: row.get(1)?,
                color: row.get(2)?,
                position: row.get(3)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;

    Ok(tags)
}

#[tauri::command]
pub fn remove_tag(db: State<'_, Db>, tag_id: String) -> AppResult<()> {
    let conn = db.0.lock().unwrap();
    conn.execute("DELETE FROM tags WHERE id = ?1", params![tag_id])?;
    Ok(())
}
