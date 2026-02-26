use axum::{
    routing::{get, post, patch},
    Router,
};
use diesel::pg::PgConnection;
use diesel::r2d2::{self, ConnectionManager};
use dotenvy::dotenv;
use std::env;
use std::sync::Arc;
use tokio::sync::broadcast;
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;

mod handlers;
mod models;
mod schema;

pub struct AppState {
    pub db_pool: r2d2::Pool<ConnectionManager<PgConnection>>,
    pub tx: broadcast::Sender<String>,
}

#[tokio::main]
async fn main() {
    dotenv().ok();
    tracing_subscriber::fmt::init();

    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let manager = ConnectionManager::<PgConnection>::new(database_url);
    let pool = r2d2::Pool::builder()
        .build(manager)
        .expect("Failed to create pool.");

    let (tx, _rx) = broadcast::channel(100);

    let state = Arc::new(AppState {
        db_pool: pool,
        tx,
    });

    let app = Router::new()
        .route("/menu", get(handlers::menu::get_menu))
        .route("/orders", get(handlers::order::get_active_orders))
        .route("/order", post(handlers::order::create_order))
        .route("/order/{id}/status", patch(handlers::order::update_order_status))
        .route("/order-item/{id}/status", patch(handlers::order::update_order_item_status))
        .route("/tables", get(handlers::table::get_tables))
        .route("/table/{id}/status", patch(handlers::table::update_table_status))
        .route("/table/{id}/bill", get(handlers::table::get_table_bill))
        .route("/table/{id}/validate", get(handlers::table::validate_session))
        .route("/ws", get(handlers::ws::ws_handler))
        .layer(CorsLayer::permissive())
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    let addr = "0.0.0.0:8080";
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    println!("Backend listening on: {}", addr);
    axum::serve(listener, app).await.unwrap();
}
