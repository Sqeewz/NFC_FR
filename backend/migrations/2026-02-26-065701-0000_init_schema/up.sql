-- Table Status & Session Management
CREATE TABLE tables (
    id SERIAL PRIMARY KEY,
    table_number VARCHAR(10) NOT NULL,
    current_session_token VARCHAR(255),
    status VARCHAR(20) DEFAULT 'available',
    session_started_at TIMESTAMP
);

-- Master Menu Data
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50),
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    image_url TEXT
);

-- Order Headers
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    table_id INTEGER REFERENCES tables(id),
    session_token VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'open',
    total_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Detailed Order Items
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    note TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Sample Data
INSERT INTO tables (table_number, status) VALUES ('T1', 'available'), ('T2', 'available'), ('T3', 'available'), ('T4', 'available'), ('T5', 'available');

INSERT INTO products (name, category, price, is_available, image_url) VALUES 
('Spicy Miso Ramen', 'Ramen', 14.50, TRUE, '/menu/spicy_miso_ramen.png'),
('Tonkotsu Ramen', 'Ramen', 12.50, TRUE, '/menu/shoyu_ramen.png'),
('Shoyu Ramen', 'Ramen', 11.50, TRUE, '/menu/shoyu_ramen.png'),
('Black Garlic Ramen', 'Ramen', 15.00, TRUE, '/menu/black_garlic_ramen.png'),
('Veggie Tofu Ramen', 'Ramen', 12.00, TRUE, NULL),
('Premium Wagyu Don', 'Mains', 28.00, TRUE, '/menu/wagyu_don.png'),
('Unagi Kabayaki Don', 'Mains', 22.50, TRUE, '/menu/unagi_don.png'),
('Katsudon Pork', 'Mains', 13.50, TRUE, NULL),
('Salmon Teriyaki', 'Mains', 18.00, TRUE, NULL),
('Chicken Teriyaki Don', 'Mains', 12.00, TRUE, NULL),
('Salmon Sashimi (5pcs)', 'Sushi', 12.00, TRUE, '/menu/salmon_sashimi.png'),
('California Roll', 'Sushi', 9.50, TRUE, '/menu/california_roll.png'),
('Spicy Tuna Roll', 'Sushi', 10.50, TRUE, NULL),
('Dragon Roll', 'Sushi', 14.00, TRUE, NULL),
('Truffle Wagyu Gyoza', 'Sides', 9.00, TRUE, '/menu/truffle_gyoza.png'),
('Crispy Takoyaki', 'Sides', 7.50, TRUE, '/menu/takoyaki.png'),
('Shrimp Tempura', 'Sides', 11.00, TRUE, '/menu/tempura_platter.png'),
('Chicken Karaage', 'Sides', 8.50, TRUE, NULL),
('Steamed Edamame', 'Sides', 4.50, TRUE, '/menu/edamame.png'),
('Agedashi Tofu', 'Sides', 6.00, TRUE, NULL),
('Matcha Lava Cake', 'Dessert', 8.50, TRUE, '/menu/matcha_lava_cake.png'),
('Mochi Ice Cream Mix', 'Dessert', 6.50, TRUE, '/menu/mochi_ice_cream.png'),
('Yuzu Sparkling', 'Drinks', 5.50, TRUE, '/menu/yuzu_sparkling.png'),
('Premium Sake (Small)', 'Drinks', 12.00, TRUE, '/menu/sake_bottle.png'),
('Green Tea (Hot/Cold)', 'Drinks', 2.00, TRUE, NULL);
