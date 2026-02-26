use axum::{extract::{State, Path}, Json};
use diesel::prelude::*;
use crate::models::Table;
use crate::schema::tables::dsl::*;
use std::sync::Arc;
use serde::Deserialize;
use crate::AppState;

#[derive(Deserialize)]
pub struct UpdateTableStatusRequest {
    pub status: String,
    pub current_session_token: Option<String>,
}

pub async fn get_tables(
    State(state): State<Arc<AppState>>,
) -> Json<Vec<Table>> {
    let mut conn = state.db_pool.get().expect("Couldn't get db connection from pool");
    let all_tables = tables.order(crate::schema::tables::table_number.asc()).load::<Table>(&mut conn).expect("Error loading tables");
    Json(all_tables)
}

pub async fn update_table_status(
    State(state): State<Arc<AppState>>,
    Path(table_ident): Path<String>,
    Json(payload): Json<UpdateTableStatusRequest>,
) -> Json<Table> {
    let mut conn = state.db_pool.get().expect("Couldn't get db connection from pool");

    // Try finding by ID first if table_ident is numeric, otherwise find by table_number
    let result = if let Ok(tid) = table_ident.parse::<i32>() {
        tables.find(tid).first::<Table>(&mut conn)
    } else {
        tables.filter(table_number.eq(table_ident)).first::<Table>(&mut conn)
    };

    let table = match result {
        Ok(t) => t,
        Err(_) => return Json(Table { 
            id: 0, 
            table_number: "ERR".to_string(), 
            current_session_token: None, 
            status: Some("not_found".to_string()),
            session_started_at: None
        })
    };

    let (new_token, new_started_at) = if payload.status == "available" {
        (None, None)
    } else if payload.status == "occupied" && table.status.as_deref() == Some("available") {
        (payload.current_session_token.or(table.current_session_token), Some(chrono::Utc::now().naive_utc()))
    } else {
        (payload.current_session_token.or(table.current_session_token), table.session_started_at)
    };

    let updated_table = diesel::update(tables.find(table.id))
        .set((
            status.eq(payload.status),
            current_session_token.eq(new_token),
            session_started_at.eq(new_started_at)
        ))
        .get_result::<Table>(&mut conn)
        .expect("Error updating table status");

    // Broadcast via WebSocket
    let _ = state.tx.send(format!("Table Update: {}", updated_table.id));

    Json(updated_table)
}

pub async fn get_table_bill(
    State(state): State<Arc<AppState>>,
    Path(table_ident): Path<String>,
) -> Json<Vec<crate::handlers::order::OrderItemWithProduct>> {
    let mut conn = state.db_pool.get().expect("Couldn't get db connection from pool");
    
    // Attempt to find table
    let table_result = if let Ok(tid) = table_ident.parse::<i32>() {
        tables.find(tid).first::<Table>(&mut conn)
    } else {
        tables.filter(table_number.eq(table_ident)).first::<Table>(&mut conn)
    };

    let table = match table_result {
        Ok(t) => t,
        Err(_) => return Json(vec![])
    };
    
    if let Some(token) = table.current_session_token {
        use crate::schema::{orders, order_items, products};
        use bigdecimal::BigDecimal;
        
        let items = order_items::table
            .inner_join(orders::table)
            .inner_join(products::table)
            .filter(orders::table_id.eq(table.id)) // Use table.id
            .filter(orders::session_token.eq(token))
            .select((order_items::all_columns, products::name, products::price))
            .load::<(crate::models::OrderItem, String, BigDecimal)>(&mut conn)
            .expect("Error loading bill items");

        Json(items.into_iter().map(|(item, product_name, product_price)| crate::handlers::order::OrderItemWithProduct { 
            item, 
            product_name,
            product_price
        }).collect())
    } else {
        Json(vec![])
    }
}

use axum::extract::Query;
use serde::Serialize;

#[derive(Serialize)]
pub struct ValidateSessionResponse {
    pub valid: bool,
    pub table_id: Option<i32>,
    pub session_token: Option<String>,
}

#[derive(Deserialize)]
pub struct ValidateSessionQuery {
    pub s: Option<String>,
}

pub async fn validate_session(
    State(state): State<Arc<AppState>>,
    Path(table_ident): Path<String>,
    Query(params): Query<ValidateSessionQuery>,
) -> Json<ValidateSessionResponse> {
    let mut conn = state.db_pool.get().expect("Couldn't get db connection from pool");
    
    // Try finding by ID first if table_ident is numeric, otherwise find by table_number
    let result = if let Ok(tid) = table_ident.parse::<i32>() {
        tables.find(tid).first::<Table>(&mut conn)
    } else {
        tables.filter(table_number.eq(table_ident)).first::<Table>(&mut conn)
    };
    
    match result {
        Ok(t) => {
            // Logic for Auto-Fill:
            // 1. If 's' is provided, it MUST match the current session token.
            // 2. If 's' is NOT provided (missing/empty), we allow access IF the table is occupied.
            let provided_s = params.s.filter(|s| !s.is_empty());
            
            let is_occupied = t.status.as_deref() == Some("occupied");
            
            let is_valid = match provided_s {
                Some(s) => t.current_session_token == Some(s),
                None => is_occupied && t.current_session_token.is_some(),
            };

            if !is_valid {
                println!("SESSION DENIED: Table {} is status {:?}, token mismatch or empty", t.table_number, t.status);
            } else {
                println!("SESSION GRANTED: Table {} for token {:?}", t.table_number, t.current_session_token);
            }

            Json(ValidateSessionResponse {
                valid: is_valid,
                table_id: if is_valid { Some(t.id) } else { None },
                session_token: if is_valid { t.current_session_token } else { None },
            })
        },
        Err(_) => Json(ValidateSessionResponse {
            valid: false,
            table_id: None,
            session_token: None,
        })
    }
}
