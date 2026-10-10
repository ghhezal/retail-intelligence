
BEGIN;

-- Purchase orders
INSERT INTO purchase_orders (
    supplier_id, branch_id, status, created_at, received_at
)
SELECT
    s.supplier_id,
    b.branch_id,
    'received',
    NOW() - INTERVAL '13 months',
    NOW() - INTERVAL '12 months 15 days'
FROM suppliers s
CROSS JOIN branches b;

-- Purchase order items
INSERT INTO purchase_order_items (
    purchase_order_id, product_id, quantity, unit_cost
)
SELECT
    po.purchase_order_id,
    sp.product_id,
    10,
    sp.supplier_price
FROM purchase_orders po
JOIN supplier_products sp
    ON po.supplier_id = sp.supplier_id;

-- Add purchased products to inventory
UPDATE inventory i
SET quantity = i.quantity + purchased.total
FROM (
    SELECT
        po.branch_id,
        poi.product_id,
        SUM(poi.quantity) AS total
    FROM purchase_orders po
    JOIN purchase_order_items poi
        ON po.purchase_order_id = poi.purchase_order_id
    GROUP BY po.branch_id, poi.product_id
) purchased
WHERE i.branch_id = purchased.branch_id
  AND i.product_id = purchased.product_id;


-- Historical sales
INSERT INTO sales (
    branch_id, customer_id, sold_at, payment_method
)
SELECT
    ((n - 1) % 3) + 1,

    CASE
        WHEN n % 4 = 0 THEN NULL
        ELSE ((n - 1) % 150) + 1
    END,

    NOW() - INTERVAL '12 months'
        + (n - 1) * INTERVAL '4 hours 20 minutes',

    CASE
        WHEN n % 5 = 0 THEN 'bank_transfer'
        WHEN n % 2 = 0 THEN 'card'
        ELSE 'cash'
    END
FROM generate_series(1, 2000) AS n;


-- First product in each sale
INSERT INTO sale_items (
    sale_id, product_id, quantity, unit_price, unit_cost
)
SELECT
    s.sale_id,
    p.product_id,

    CASE
        WHEN s.sale_id % 5 = 0 THEN 2
        ELSE 1
    END,

    p.selling_price,
    p.cost_price
FROM sales s
JOIN products p
    ON p.product_id = ((s.sale_id - 1) / 3) % 150 + 1;


-- Second product in some sales
INSERT INTO sale_items (
    sale_id, product_id, quantity, unit_price, unit_cost
)
SELECT
    s.sale_id,
    p.product_id,
    1,
    p.selling_price,
    p.cost_price
FROM sales s
JOIN products p
    ON p.product_id = (((s.sale_id - 1) / 3 + 50) % 150) + 1
WHERE s.sale_id % 2 = 0;


-- Deduct sold products from inventory
UPDATE inventory i
SET quantity = i.quantity - sold.total
FROM (
    SELECT
        s.branch_id,
        si.product_id,
        SUM(si.quantity) AS total
    FROM sales s
    JOIN sale_items si
        ON s.sale_id = si.sale_id
    GROUP BY s.branch_id, si.product_id
) sold
WHERE i.branch_id = sold.branch_id
  AND i.product_id = sold.product_id;


-- Stock transfers
INSERT INTO stock_transfers (
    from_branch_id, to_branch_id,
    status, created_at, completed_at
)
SELECT
    ((n - 1) % 3) + 1,
    (n % 3) + 1,
    'completed',
    NOW() - INTERVAL '3 days' + n * INTERVAL '1 hour',
    NOW() - INTERVAL '3 days' + (n + 1) * INTERVAL '1 hour'
FROM generate_series(1, 30) AS n;


-- First product in each transfer
INSERT INTO stock_transfer_items (
    transfer_id, product_id, quantity
)
SELECT
    transfer_id,
    (transfer_id % 150) + 1,
    2
FROM stock_transfers;


-- Second product in each transfer
INSERT INTO stock_transfer_items (
    transfer_id, product_id, quantity
)
SELECT
    transfer_id,
    ((transfer_id + 50) % 150) + 1,
    1
FROM stock_transfers;


-- Remove stock from source branches
UPDATE inventory i
SET quantity = i.quantity - moved.total
FROM (
    SELECT
        st.from_branch_id AS branch_id,
        sti.product_id,
        SUM(sti.quantity) AS total
    FROM stock_transfers st
    JOIN stock_transfer_items sti
        ON st.transfer_id = sti.transfer_id
    GROUP BY st.from_branch_id, sti.product_id
) moved
WHERE i.branch_id = moved.branch_id
  AND i.product_id = moved.product_id;


-- Add stock to destination branches
UPDATE inventory i
SET quantity = i.quantity + moved.total
FROM (
    SELECT
        st.to_branch_id AS branch_id,
        sti.product_id,
        SUM(sti.quantity) AS total
    FROM stock_transfers st
    JOIN stock_transfer_items sti
        ON st.transfer_id = sti.transfer_id
    GROUP BY st.to_branch_id, sti.product_id
) moved
WHERE i.branch_id = moved.branch_id
  AND i.product_id = moved.product_id;

COMMIT;