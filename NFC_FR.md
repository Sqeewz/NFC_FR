# 🍜 NFC Restaurant Ordering System (Tee Noi Model)
ระบบสั่งอาหารผ่านการสแกน NFC ประจำโต๊ะ โดยใช้เทคโนโลยีประสิทธิภาพสูง

---

## 1. Project Overview
ระบบบริหารจัดการร้านอาหารแบบ Self-Service ที่ให้ลูกค้าสแกน NFC เพื่อเข้าถึงเมนูผ่าน Web App (ไม่ต้องโหลดแอป) และมีระบบ Dashboard สำหรับพนักงานเพื่อจัดการออเดอร์และบิลแบบ Real-time

### Tech Stack
- **Frontend:** Next.js 15 (App Router), Tailwind CSS 4.0
- **Backend API:** Rust (Axum Framework)
- **Database/ORM:** PostgreSQL + Diesel ORM
- **Communication:** WebSockets (Real-time updates)

---

## 2. System Architecture & Workflow



1. **Staff:** เปิดโต๊ะในระบบ ระบบจะสร้าง `Session_Token` ใหม่
2. **Customer:** สแกน NFC Tag -> Browser เปิด URL `.../table/1?s=token`
3. **Order:** ลูกค้าเลือกอาหาร ข้อมูลถูกส่งไปที่ Rust API และบันทึกลง Postgres
4. **Real-time:** Rust ยิงข้อมูลผ่าน WebSockets ไปที่หน้าจอพนักงานทันที
5. **Billing:** พนักงานกดยืนยันการชำระเงิน ระบบจะล้างสถานะโต๊ะให้ว่าง

---

## 3. Database Schema (PostgreSQL)

```sql
-- สำหรับจัดการสถานะโต๊ะ
CREATE TABLE tables (
    id SERIAL PRIMARY KEY,
    table_number VARCHAR(10) NOT NULL,
    current_session_token VARCHAR(255),
    status VARCHAR(20) DEFAULT 'available' -- available, occupied, calling_bill
);

-- สำหรับหัวบิล
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    table_id INTEGER REFERENCES tables(id),
    session_token VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'open', -- open, paid
    total_price DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- รายการอาหารในแต่ละบิล
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id),
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, cooking, served
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

## 4. UI/UX Design Requirements
Customer Web App (Mobile First)
Menu Catalog: แยกหมวดหมู่ชัดเจน (เนื้อ, ผัก, ของทานเล่น)

Floating Cart: แสดงจำนวนรายการที่เลือกไว้ด้านล่างตลอดเวลา

Order History: หน้าจอเช็คสถานะว่าอาหารที่สั่ง "กำลังทำ" หรือ "เสิร์ฟแล้ว"

Staff Admin Dashboard (Tablet/Desktop)
Table Grid: ผังโต๊ะสีสันชัดเจน (เขียว = ว่าง, แดง = มีลูกค้า, เหลืองกะพริบ = เรียกเช็คบิล)

Order Monitor: หน้าจอคิวอาหารแบบ Kanban (Pending -> Preparing -> Served)

Billing Summary: แสดงรายการอาหารทั้งหมดพร้อมยอดรวมเงิน

## 5. Master Prompt for AI (Antigravity AI / Claude / GPT)
Copy the text below to generate the code:

Role: You are a Senior Full-Stack Engineer.
Objective: Build a restaurant ordering system using Next.js 15, Rust (Axum), Diesel ORM, and PostgreSQL.

Task 1: Backend (Rust/Axum)

Setup an Axum server with Diesel ORM integration.

Implement WebSocket broadcasting for a "Live Order Monitor".

Create API endpoints for:

Validating Table Session Tokens.

Placing new orders (inserting into order_items).

Updating order status (e.g., Pending to Served).

Task 2: Frontend (Next.js/Tailwind)

Create a dynamic route /table/[id] that reads session_token from URL parameters.

Design a high-contrast Admin Dashboard for staff using Tailwind CSS.

Use Lucide-react for icons and ensure the mobile ordering UI is extremely fast and intuitive.

Task 3: Logic & Security

Implement a check to prevent users without a valid session token from placing orders.

Ensure real-time state sync between the Customer app and Staff dashboard via WebSockets.

## 6. Hardware Implementation (NFC)
NFC Tag Type: NTAG213 (Sticker or Card).

URL Format: https://your-domain.com/table/{table_id}?s={session_token}

Security: เมื่อจบมื้อ (พนักงานปิดโต๊ะ) ระบบต้องเปลี่ยน Token ใน Database ทันทีเพื่อให้ URL เดิมใช้งานไม่ได้อีก