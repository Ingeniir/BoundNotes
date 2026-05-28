pub mod migrations;

use rusqlite::Connection;
use std::{path::Path, sync::Mutex};

pub struct Db(pub Mutex<Connection>);

pub fn init(db_path: &Path) -> rusqlite::Result<Db> {
    if let Some(parent) = db_path.parent() {
        std::fs::create_dir_all(parent)
            .expect("Impossible de créer le dossier de la base de données");
    }

    let conn = Connection::open(db_path)?;
    migrations::run(&conn)?;

    Ok(Db(Mutex::new(conn)))
}
