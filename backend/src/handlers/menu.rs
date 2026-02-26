use axum::{extract::State, Json};
use diesel::prelude::*;
use crate::models::Product;
use crate::schema::products::dsl::*;
use std::sync::Arc;
use crate::AppState;

pub async fn get_menu(State(state): State<Arc<AppState>>) -> Json<Vec<Product>> {
    let mut conn = state.db_pool.get().expect("Couldn't get db connection from pool");
    
    let results = products
        .filter(is_available.eq(true))
        .load::<Product>(&mut conn)
        .expect("Error loading products");

    Json(results)
}
