use crate::{db::Db, error::AppError, error::AppResult, models::notebook::*};
use chrono::Utc;
use rusqlite::params;
use tauri::State;
use uuid::Uuid;

fn now_ms() -> i64 {
    Utc::now().timestamp_millis()
}

#[tauri::command]
pub fn get_notebooks(db: State<'_, Db>) -> AppResult<Vec<Notebook>> {
    let conn = db.0.lock().unwrap();
    let mut stmt = conn.prepare(
        "SELECT id, parent_id, name, icon, position, created_at, updated_at
         FROM notebooks ORDER BY position ASC, name ASC",
    )?;

    let notebooks = stmt
        .query_map([], |row| {
            Ok(Notebook {
                id: row.get(0)?,
                parent_id: row.get(1)?,
                name: row.get(2)?,
                icon: row.get(3)?,
                position: row.get(4)?,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;

    Ok(notebooks)
}

#[tauri::command]
pub fn create_notebook(db: State<'_, Db>, payload: CreateNotebookPayload) -> AppResult<Notebook> {
    let conn = db.0.lock().unwrap();
    let id = Uuid::new_v4().to_string();
    let now = now_ms();

    let position: i64 = conn.query_row(
        "SELECT COALESCE(MAX(position), 0) + 1 FROM notebooks WHERE parent_id IS ?1",
        rusqlite::params![payload.parent_id],
        |row| row.get(0),
    )?;

    conn.execute(
        "INSERT INTO notebooks (id, parent_id, name, icon, position, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?6)",
        params![
            id,
            payload.parent_id,
            payload.name,
            payload.icon,
            position,
            now
        ],
    )?;

    Ok(Notebook {
        id,
        parent_id: payload.parent_id,
        name: payload.name,
        icon: payload.icon,
        position,
        created_at: now,
        updated_at: now,
    })
}

#[tauri::command]
pub fn update_notebook(
    db: State<'_, Db>,
    id: String,
    payload: UpdateNotebookPayload,
) -> AppResult<Notebook> {
    let conn = db.0.lock().unwrap();
    let now = now_ms();

    if let Some(ref name) = payload.name {
        conn.execute(
            "UPDATE notebooks SET name = ?1, updated_at = ?2 WHERE id = ?3",
            params![name, now, id],
        )?;
    }

    if let Some(ref icon) = payload.icon {
        conn.execute(
            "UPDATE notebooks SET icon = ?1, updated_at = ?2 WHERE id = ?3",
            params![icon, now, id],
        )?;
    }

    conn.query_row(
        "SELECT id, parent_id, name, icon, position, created_at, updated_at FROM notebooks WHERE id = ?1",
        params![id],
        |row| {
            Ok(Notebook {
                id: row.get(0)?,
                parent_id: row.get(1)?,
                name: row.get(2)?,
                icon: row.get(3)?,
                position: row.get(4)?,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        },
    )
    .map_err(|_| AppError::NotFound(format!("Notebook {} introuvable", id)))
}

#[tauri::command]
pub fn delete_notebook(db: State<'_, Db>, id: String) -> AppResult<()> {
    let conn = db.0.lock().unwrap();
    conn.execute("DELETE FROM notebooks WHERE id = ?1", params![id])?;
    Ok(())
}
