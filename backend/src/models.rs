use serde::{Deserialize, Serialize};
use diesel::prelude::*;
use bigdecimal::BigDecimal;
use chrono::NaiveDateTime;
use crate::schema::*;

#[derive(Queryable, Selectable, Insertable, Serialize, Deserialize, Debug, Clone)]
#[diesel(table_name = tables)]
pub struct Table {
    pub id: i32,
    pub table_number: String,
    pub current_session_token: Option<String>,
    pub status: Option<String>,
    pub session_started_at: Option<NaiveDateTime>,
}

#[derive(Queryable, Selectable, Insertable, Serialize, Deserialize, Debug, Clone)]
#[diesel(table_name = products)]
pub struct Product {
    pub id: i32,
    pub name: String,
    pub category: Option<String>,
    pub price: BigDecimal,
    pub is_available: bool,
    pub image_url: Option<String>,
}

#[derive(Queryable, Selectable, Insertable, Serialize, Deserialize, Debug, Clone)]
#[diesel(table_name = orders)]
pub struct Order {
    pub id: i32,
    pub table_id: Option<i32>,
    pub session_token: String,
    pub status: String,
    pub total_price: BigDecimal,
    pub created_at: NaiveDateTime,
}

#[derive(Queryable, Selectable, Insertable, Serialize, Deserialize, Debug, Clone)]
#[diesel(table_name = order_items)]
pub struct OrderItem {
    pub id: i32,
    pub order_id: i32,
    pub product_id: i32,
    pub quantity: i32,
    pub status: String,
    pub note: Option<String>,
    pub created_at: NaiveDateTime,
}

#[derive(Insertable, Deserialize)]
#[diesel(table_name = tables)]
pub struct NewTable {
    pub table_number: String,
    pub current_session_token: Option<String>,
    pub status: Option<String>,
    pub session_started_at: Option<NaiveDateTime>,
}

#[derive(Insertable, Deserialize)]
#[diesel(table_name = products)]
pub struct NewProduct {
    pub name: String,
    pub category: Option<String>,
    pub price: BigDecimal,
    pub is_available: bool,
    pub image_url: Option<String>,
}

#[derive(Insertable, Deserialize)]
#[diesel(table_name = orders)]
pub struct NewOrder {
    pub table_id: Option<i32>,
    pub session_token: String,
    pub status: String,
    pub total_price: BigDecimal,
}

#[derive(Insertable, Deserialize)]
#[diesel(table_name = order_items)]
pub struct NewOrderItem {
    pub order_id: i32,
    pub product_id: i32,
    pub quantity: i32,
    pub status: String,
    pub note: Option<String>,
}
