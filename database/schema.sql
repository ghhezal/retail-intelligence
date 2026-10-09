
BEGIN;

-- Branches
CREATE TABLE branches (
    branch_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    city VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(30)
);

-- Categories
CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

-- Brands
CREATE TABLE brands (
    brand_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

-- Suppliers
CREATE TABLE suppliers (
    supplier_id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(30),
    address TEXT
);

-- Products
CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    category_id INT NOT NULL REFERENCES categories(category_id),
    brand_id INT NOT NULL REFERENCES brands(brand_id),

    sku VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT,

    cost_price NUMERIC(12, 2) NOT NULL CHECK (cost_price >= 0),
    selling_price NUMERIC(12, 2) NOT NULL CHECK (selling_price >= 0),

    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Supplier products
CREATE TABLE supplier_products (
    supplier_id INT NOT NULL REFERENCES suppliers(supplier_id),
    product_id INT NOT NULL REFERENCES products(product_id),

    supplier_sku VARCHAR(100),
    supplier_price NUMERIC(12, 2) NOT NULL CHECK (supplier_price >= 0),

    PRIMARY KEY (supplier_id, product_id)
);

-- Inventory
CREATE TABLE inventory (
    branch_id INT NOT NULL REFERENCES branches(branch_id),
    product_id INT NOT NULL REFERENCES products(product_id),

    quantity INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    reorder_level INT NOT NULL DEFAULT 5 CHECK (reorder_level >= 0),

    PRIMARY KEY (branch_id, product_id)
);

-- Customers
CREATE TABLE customers (
    customer_id SERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(30),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sales
CREATE TABLE sales (
    sale_id SERIAL PRIMARY KEY,
    branch_id INT NOT NULL REFERENCES branches(branch_id),
    customer_id INT REFERENCES customers(customer_id) ON DELETE SET NULL,

    sold_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    payment_method VARCHAR(30) NOT NULL
        CHECK (payment_method IN ('cash', 'card', 'bank_transfer'))
);

-- Sale items
CREATE TABLE sale_items (
    sale_item_id SERIAL PRIMARY KEY,
    sale_id INT NOT NULL REFERENCES sales(sale_id),
    product_id INT NOT NULL REFERENCES products(product_id),

    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    unit_cost NUMERIC(12, 2) NOT NULL CHECK (unit_cost >= 0),

    UNIQUE (sale_id, product_id)
);

-- Purchase orders
CREATE TABLE purchase_orders (
    purchase_order_id SERIAL PRIMARY KEY,
    supplier_id INT NOT NULL REFERENCES suppliers(supplier_id),
    branch_id INT NOT NULL REFERENCES branches(branch_id),

    status VARCHAR(20) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'received')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    received_at TIMESTAMPTZ
);

-- Purchase order items
CREATE TABLE purchase_order_items (
    purchase_order_item_id SERIAL PRIMARY KEY,
    purchase_order_id INT NOT NULL REFERENCES purchase_orders(purchase_order_id),
    product_id INT NOT NULL REFERENCES products(product_id),

    quantity INT NOT NULL CHECK (quantity > 0),
    unit_cost NUMERIC(12, 2) NOT NULL CHECK (unit_cost >= 0),

    UNIQUE (purchase_order_id, product_id)
);

-- Stock transfers
CREATE TABLE stock_transfers (
    transfer_id SERIAL PRIMARY KEY,
    from_branch_id INT NOT NULL REFERENCES branches(branch_id),
    to_branch_id INT NOT NULL REFERENCES branches(branch_id),

    status VARCHAR(20) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'completed')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,

    CHECK (from_branch_id <> to_branch_id)
);

-- Stock transfer items
CREATE TABLE stock_transfer_items (
    transfer_item_id SERIAL PRIMARY KEY,
    transfer_id INT NOT NULL REFERENCES stock_transfers(transfer_id),
    product_id INT NOT NULL REFERENCES products(product_id),

    quantity INT NOT NULL CHECK (quantity > 0),

    UNIQUE (transfer_id, product_id)
);

COMMIT;
