use rusqlite::Connection;

pub fn run(conn: &Connection) -> rusqlite::Result<()> {
    // Activation des pragmas essentiels
    conn.execute_batch(
        "
        PRAGMA journal_mode = WAL;
        PRAGMA foreign_keys = ON;
    ",
    )?;

    // Table de versioning
    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version     INTEGER PRIMARY KEY,
            applied_at  INTEGER NOT NULL,
            description TEXT
        );
    ",
    )?;

    // Version courante
    let current_version: i64 = conn.query_row(
        "SELECT COALESCE(MAX(version), 0) FROM schema_migrations",
        [],
        |row| row.get(0),
    )?;

    // Liste des migrations dans l'ordre
    let migrations: &[(i64, &str, &str)] = &[
        (1, "initial_schema", MIGRATION_001),
        (2, "notebooks_parent_id", MIGRATION_002),
    ];

    for (version, description, sql) in migrations {
        if current_version < *version {
            conn.execute_batch(sql)?;
            conn.execute(
                "INSERT INTO schema_migrations (version, applied_at, description)
                 VALUES (?1, ?2, ?3)",
                rusqlite::params![version, chrono::Utc::now().timestamp_millis(), description],
            )?;
        }
    }

    Ok(())
}

const MIGRATION_001: &str = "
    CREATE TABLE IF NOT EXISTS notebooks (
        id          TEXT PRIMARY KEY,
        name        TEXT NOT NULL,
        icon        TEXT,
        position    INTEGER NOT NULL DEFAULT 0,
        created_at  INTEGER NOT NULL,
        updated_at  INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notes (
        id           TEXT PRIMARY KEY,
        notebook_id  TEXT REFERENCES notebooks(id) ON DELETE SET NULL,
        title        TEXT NOT NULL DEFAULT 'Sans titre',
        excerpt      TEXT,
        word_count   INTEGER NOT NULL DEFAULT 0,
        is_pinned    INTEGER NOT NULL DEFAULT 0,
        is_trashed   INTEGER NOT NULL DEFAULT 0,
        trashed_at   INTEGER,
        created_at   INTEGER NOT NULL,
        updated_at   INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS note_contents (
        note_id  TEXT PRIMARY KEY REFERENCES notes(id) ON DELETE CASCADE,
        content  TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS tags (
        id       TEXT PRIMARY KEY,
        name     TEXT NOT NULL UNIQUE,
        color    TEXT,
        position INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS note_tags (
        note_id TEXT REFERENCES notes(id) ON DELETE CASCADE,
        tag_id  TEXT REFERENCES tags(id)  ON DELETE CASCADE,
        PRIMARY KEY (note_id, tag_id)
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
        title,
        content,
        content='note_contents',
        content_rowid='rowid'
    );

    CREATE TRIGGER IF NOT EXISTS notes_fts_insert
    AFTER INSERT ON note_contents BEGIN
        INSERT INTO notes_fts(rowid, title, content)
        SELECT new.rowid, n.title, new.content
        FROM notes n WHERE n.id = new.note_id;
    END;

    CREATE TRIGGER IF NOT EXISTS notes_fts_update
    AFTER UPDATE ON note_contents BEGIN
        INSERT INTO notes_fts(notes_fts, rowid, title, content)
        VALUES('delete', old.rowid, '', '');
        INSERT INTO notes_fts(rowid, title, content)
        SELECT new.rowid, n.title, new.content
        FROM notes n WHERE n.id = new.note_id;
    END;

    CREATE TRIGGER IF NOT EXISTS notes_fts_delete
    AFTER DELETE ON note_contents BEGIN
        INSERT INTO notes_fts(notes_fts, rowid, title, content)
        VALUES('delete', old.rowid, '', '');
    END;

    CREATE INDEX IF NOT EXISTS idx_notes_notebook_id ON notes(notebook_id);
    CREATE INDEX IF NOT EXISTS idx_notes_updated_at  ON notes(updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_notes_trashed     ON notes(is_trashed, trashed_at);
    CREATE INDEX IF NOT EXISTS idx_note_tags_note    ON note_tags(note_id);
    CREATE INDEX IF NOT EXISTS idx_note_tags_tag     ON note_tags(tag_id);
";

const MIGRATION_002: &str = "
    ALTER TABLE notebooks ADD COLUMN parent_id TEXT REFERENCES notebooks(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_notebooks_parent_id ON notebooks(parent_id);
";
