use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Tag {
    pub id: String,
    pub name: String,
    pub color: Option<String>,
    pub position: i64,
}

#[derive(Debug, Deserialize)]
pub struct CreateTagPayload {
    pub name: String,
    pub color: Option<String>,
}
