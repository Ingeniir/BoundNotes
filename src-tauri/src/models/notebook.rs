use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Notebook {
    pub id: String,
    pub parent_id: Option<String>,
    pub name: String,
    pub icon: Option<String>,
    pub position: i64,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Deserialize)]
pub struct CreateNotebookPayload {
    pub name: String,
    pub icon: Option<String>,
    pub parent_id: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateNotebookPayload {
    pub name: Option<String>,
    pub icon: Option<String>,
    pub parent_id: Option<Option<String>>,
}
