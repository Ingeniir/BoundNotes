mod commands;
mod db;
mod error;
mod models;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[cfg(debug_assertions)]
    let devtools = tauri_plugin_devtools::init();

    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_window_state::Builder::new().build());

    // Enable the Tauri devtools plugin in development builds
    #[cfg(debug_assertions)]
    {
        builder = builder.plugin(devtools);
    }

    builder
        .setup(|app| {
            let app_data_dir = app
                .path()
                .app_data_dir()
                .expect("Impossible de résoudre appDataDir");

            let db = db::init(&app_data_dir.join("notes.db")).expect("Échec initialisation SQLite");

            app.manage(db);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Notes
            commands::notes::get_notes,
            commands::notes::get_note,
            commands::notes::create_note,
            commands::notes::update_note,
            commands::notes::trash_note,
            commands::notes::restore_note,
            commands::notes::delete_note,
            commands::notes::search_notes,
            commands::notes::get_notes_by_tag,
            commands::notes::get_pinned_notes,
            commands::notes::toggle_note_pin,
            // Notebooks
            commands::notebooks::get_notebooks,
            commands::notebooks::create_notebook,
            commands::notebooks::update_notebook,
            commands::notebooks::delete_notebook,
            // Tags
            commands::tags::get_tags,
            commands::tags::create_tag,
            commands::tags::add_tag_to_note,
            commands::tags::remove_tag_from_note,
            commands::tags::get_tags_for_note,
            commands::tags::remove_tag,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
