use axum::{extract::{State, Path}, Json};
use diesel::prelude::*;
use crate::models::{Order, NewOrder, OrderItem, NewOrderItem};
use crate::schema::{orders, order_items};
use std::sync::Arc;
use serde::{Deserialize, Serialize};
use bigdecimal::BigDecimal;
use crate::AppState;

#[derive(Deserialize)]
pub struct CreateOrderRequest {
    pub table_id: i32,
    pub session_token: String,
    pub items: Vec<OrderItemRequest>,
}

#[derive(Deserialize)]
pub struct OrderItemRequest {
    pub product_id: i32,
    pub quantity: i32,
    pub note: Option<String>,
}

#[derive(Deserialize)]
pub struct UpdateOrderStatusRequest {
    pub status: String,
}

#[derive(Serialize)]
pub struct OrderWithItems {
    #[serde(flatten)]
    pub order: Order,
    pub table_number: String,
    pub items: Vec<OrderItemWithProduct>,
}

#[derive(Serialize)]
pub struct OrderItemWithProduct {
    #[serde(flatten)]
    pub item: OrderItem,
    pub product_name: String,
    pub product_price: BigDecimal,
}

pub async fn get_active_orders(
    State(state): State<Arc<AppState>>,
) -> Json<Vec<OrderWithItems>> {
    let mut conn = state.db_pool.get().expect("Couldn't get db connection from pool");
    
    let active_orders_with_tables = orders::table
        .inner_join(crate::schema::tables::table)
        .filter(orders::status.eq("open"))
        .select((orders::all_columns, crate::schema::tables::table_number))
        .load::<(Order, String)>(&mut conn)
        .expect("Error loading orders");

    let mut result = Vec::new();

    for (order, t_number) in active_orders_with_tables {
        let items = order_items::table
            .filter(order_items::order_id.eq(order.id))
            .inner_join(crate::schema::products::table)
            .select((order_items::all_columns, crate::schema::products::name, crate::schema::products::price))
            .load::<(OrderItem, String, BigDecimal)>(&mut conn)
            .expect("Error loading order items");

        result.push(OrderWithItems {
            order,
            table_number: t_number,
            items: items.into_iter().map(|(item, product_name, product_price)| OrderItemWithProduct { item, product_name, product_price }).collect(),
        });
    }

    Json(result)
}

use axum::http::StatusCode;
use crate::models::Product;

pub async fn create_order(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<CreateOrderRequest>,
) -> Result<Json<Order>, (StatusCode, String)> {
    let mut conn = state.db_pool.get().expect("Couldn't get db connection from pool");

    // 1. Validate Session Token
    let table = crate::schema::tables::table
        .find(payload.table_id)
        .first::<crate::models::Table>(&mut conn)
        .map_err(|_| (StatusCode::NOT_FOUND, "Table not found".to_string()))?;

    if table.current_session_token != Some(payload.session_token.clone()) {
        println!("SECURITY ALERT: Invalid session token attempt for Table {}", payload.table_id);
        return Err((StatusCode::UNAUTHORIZED, "Invalid session token".to_string()));
    }

    if table.status.as_deref() != Some("occupied") {
        println!("SECURITY ALERT: Order attempt on Table {} with status {:?}", payload.table_id, table.status);
        return Err((StatusCode::FORBIDDEN, "Table is not open for ordering".to_string()));
    }

    conn.transaction::<Json<Order>, diesel::result::Error, _>(|conn| {
        // 2. Calculate Total Price
        let mut total = BigDecimal::from(0);
        for item_req in &payload.items {
            let product = crate::schema::products::table
                .find(item_req.product_id)
                .first::<Product>(conn)?;
            
            let item_total = product.price * BigDecimal::from(item_req.quantity);
            total += item_total;
        }

        let new_order = NewOrder {
            table_id: Some(payload.table_id),
            session_token: payload.session_token,
            status: "open".to_string(),
            total_price: total,
        };

        let order: Order = diesel::insert_into(orders::table)
            .values(&new_order)
            .get_result(conn)?;

        for item in payload.items {
            let new_item = NewOrderItem {
                order_id: order.id,
                product_id: item.product_id,
                quantity: item.quantity,
                status: "pending".to_string(),
                note: item.note,
            };

            diesel::insert_into(order_items::table)
                .values(&new_item)
                .execute(conn)?;
        }

        // Broadcast via WebSocket
        let _ = state.tx.send(format!("New Order: {}", order.id));

        Ok(Json(order))
    }).map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))
}

pub async fn update_order_status(
    State(state): State<Arc<AppState>>,
    Path(oid): Path<i32>,
    Json(payload): Json<UpdateOrderStatusRequest>,
) -> Json<Order> {
    let mut conn = state.db_pool.get().expect("Couldn't get db connection from pool");

    let order = diesel::update(orders::table.find(oid))
        .set(orders::status.eq(payload.status))
        .get_result::<Order>(&mut conn)
        .expect("Error updating order status");

    // Broadcast change
    let _ = state.tx.send(format!("Order Update: {}", order.id));

    Json(order)
}

pub async fn update_order_item_status(
    State(state): State<Arc<AppState>>,
    Path(iid): Path<i32>,
    Json(payload): Json<UpdateOrderStatusRequest>,
) -> Json<OrderItem> {
    let mut conn = state.db_pool.get().expect("Couldn't get db connection from pool");

    let item = diesel::update(order_items::table.find(iid))
        .set(order_items::status.eq(payload.status))
        .get_result::<OrderItem>(&mut conn)
        .expect("Error updating order item status");

    // Broadcast change
    let _ = state.tx.send(format!("Item Update: {}", item.id));

    Json(item)
}
