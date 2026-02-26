// @generated automatically by Diesel CLI.

diesel::table! {
    order_items (id) {
        id -> Int4,
        order_id -> Int4,
        product_id -> Int4,
        quantity -> Int4,
        #[max_length = 20]
        status -> Varchar,
        note -> Nullable<Text>,
        created_at -> Timestamp,
    }
}

diesel::table! {
    orders (id) {
        id -> Int4,
        table_id -> Nullable<Int4>,
        #[max_length = 255]
        session_token -> Varchar,
        #[max_length = 20]
        status -> Varchar,
        total_price -> Numeric,
        created_at -> Timestamp,
    }
}

diesel::table! {
    products (id) {
        id -> Int4,
        #[max_length = 255]
        name -> Varchar,
        #[max_length = 50]
        category -> Nullable<Varchar>,
        price -> Numeric,
        is_available -> Bool,
        image_url -> Nullable<Text>,
    }
}

diesel::table! {
    tables (id) {
        id -> Int4,
        #[max_length = 10]
        table_number -> Varchar,
        #[max_length = 255]
        current_session_token -> Nullable<Varchar>,
        #[max_length = 20]
        status -> Nullable<Varchar>,
        session_started_at -> Nullable<Timestamp>,
    }
}

diesel::joinable!(order_items -> orders (order_id));
diesel::joinable!(order_items -> products (product_id));
diesel::joinable!(orders -> tables (table_id));

diesel::allow_tables_to_appear_in_same_query!(order_items, orders, products, tables,);
