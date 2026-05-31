use serde::{Deserialize, Serialize};

use crate::models::tag::Tag;

#[derive(Debug, Serialize, Deserialize)]
pub struct Note {
    pub id: String,
    pub notebook_id: Option<String>,
    pub title: String,
    pub excerpt: Option<String>,
    pub word_count: i64,
    pub is_pinned: bool,
    pub is_trashed: bool,
    pub trashed_at: Option<i64>,
    pub created_at: i64,
    pub updated_at: i64,
    pub tags: Vec<Tag>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NoteWithContent {
    pub id: String,
    pub notebook_id: Option<String>,
    pub title: String,
    pub excerpt: Option<String>,
    pub word_count: i64,
    pub is_pinned: bool,
    pub is_trashed: bool,
    pub trashed_at: Option<i64>,
    pub created_at: i64,
    pub updated_at: i64,
    pub content: String,
    pub tags: Vec<Tag>,
}

#[derive(Debug, Deserialize)]
pub struct CreateNotePayload {
    pub notebook_id: Option<String>,
    pub title: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateNotePayload {
    pub title: Option<String>,
    pub content: Option<String>,
    pub is_pinned: Option<bool>,
}
