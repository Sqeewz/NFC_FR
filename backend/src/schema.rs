// @generated automatically by Diesel CLI.

diesel::table! {
    tables (id) {
        id -> Int4,
        table_number -> Varchar,
        current_session_token -> Nullable<Varchar>,
        status -> Nullable<Varchar>,
        session_started_at -> Nullable<Timestamp>,
    }
}

diesel::table! {
    products (id) {
        id -> Int4,
        name -> Varchar,
        category -> Nullable<Varchar>,
        price -> Numeric,
        is_available -> Bool,
        image_url -> Nullable<Text>,
    }
}

diesel::table! {
    orders (id) {
        id -> Int4,
        table_id -> Nullable<Int4>,
        session_token -> Varchar,
        status -> Varchar,
        total_price -> Numeric,
        created_at -> Timestamp,
    }
}

diesel::table! {
    order_items (id) {
        id -> Int4,
        order_id -> Int4,
        product_id -> Int4,
        quantity -> Int4,
        status -> Varchar,
        note -> Nullable<Text>,
        created_at -> Timestamp,
    }
}

diesel::joinable!(orders -> tables (table_id));
diesel::joinable!(order_items -> orders (order_id));
diesel::joinable!(order_items -> products (product_id));

diesel::allow_tables_to_appear_in_same_query!(
    tables,
    products,
    orders,
    order_items,
);
