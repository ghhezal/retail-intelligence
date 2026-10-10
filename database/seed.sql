
BEGIN;

-- Branches
INSERT INTO branches (name, city, address, phone) VALUES
('Algiers Central', 'Algiers', 'Central Algiers', '021000001'),
('Oran West', 'Oran', 'Central Oran', '041000002'),
('Constantine East', 'Constantine', 'Central Constantine', '031000003');

-- Categories
INSERT INTO categories (name, description) VALUES
('Laptops & PCs', 'Laptops and desktop computers'),
('PC Components', 'Computer parts and storage'),
('Accessories', 'Keyboards, mice and other accessories'),
('Monitors & Networking', 'Displays and network equipment');

-- Brands
INSERT INTO brands (name) VALUES
('Lenovo'),
('Dell'),
('HP'),
('ASUS'),
('Acer'),
('MSI'),
('Samsung'),
('Logitech'),
('Kingston'),
('TP-Link');

-- Suppliers
INSERT INTO suppliers (name, email, phone) VALUES
('NorthTech Distribution', 'northtech@example.com', '0550000001'),
('Digital Supply Co', 'digital@example.com', '0550000002'),
('Hardware Direct', 'hardware@example.com', '0550000003'),
('TechSource', 'techsource@example.com', '0550000004'),
('Global Components', 'components@example.com', '0550000005'),
('Computer Wholesale', 'wholesale@example.com', '0550000006'),
('Smart Distribution', 'smart@example.com', '0550000007'),
('ProTech Supplies', 'smart@example.com', '0550000008'),
('ElectroHub', 'electrohub@example.com', '0550000009'),
('NextGen Distribution', 'nextgen@example.com', '0550000010');

-- Products
INSERT INTO products (category_id, brand_id, sku, name, cost_price, selling_price) VALUES
(1, 1, 'LNV-TBK-A', 'Lenovo ThinkBook 14 - 8GB RAM / 256GB SSD', 520.00, 650.00),
(1, 1, 'LNV-TBK-B', 'Lenovo ThinkBook 14 - 16GB RAM / 512GB SSD', 640.00, 800.00),
(1, 1, 'LNV-TBK-C', 'Lenovo ThinkBook 14 - 32GB RAM / 1TB SSD', 800.00, 1000.00),
(1, 1, 'LNV-IDP-A', 'Lenovo IdeaPad Slim - 8GB RAM / 256GB SSD', 430.00, 537.50),
(1, 1, 'LNV-IDP-B', 'Lenovo IdeaPad Slim - 16GB RAM / 512GB SSD', 550.00, 687.50),
(1, 1, 'LNV-IDP-C', 'Lenovo IdeaPad Slim - 32GB RAM / 1TB SSD', 710.00, 887.50),
(1, 2, 'DEL-INS-A', 'Dell Inspiron 15 - 8GB RAM / 256GB SSD', 460.00, 575.00),
(1, 2, 'DEL-INS-B', 'Dell Inspiron 15 - 16GB RAM / 512GB SSD', 580.00, 725.00),
(1, 2, 'DEL-INS-C', 'Dell Inspiron 15 - 32GB RAM / 1TB SSD', 740.00, 925.00),
(1, 2, 'DEL-LAT-A', 'Dell Latitude 5440 - 8GB RAM / 256GB SSD', 670.00, 837.50),
(1, 2, 'DEL-LAT-B', 'Dell Latitude 5440 - 16GB RAM / 512GB SSD', 790.00, 987.50),
(1, 2, 'DEL-LAT-C', 'Dell Latitude 5440 - 32GB RAM / 1TB SSD', 950.00, 1187.50),
(1, 3, 'HP-PAV-A', 'HP Pavilion 15 - 8GB RAM / 256GB SSD', 480.00, 600.00),
(1, 3, 'HP-PAV-B', 'HP Pavilion 15 - 16GB RAM / 512GB SSD', 600.00, 750.00),
(1, 3, 'HP-PAV-C', 'HP Pavilion 15 - 32GB RAM / 1TB SSD', 760.00, 950.00),
(1, 3, 'HP-PRO-A', 'HP ProBook 450 - 8GB RAM / 256GB SSD', 610.00, 762.50),
(1, 3, 'HP-PRO-B', 'HP ProBook 450 - 16GB RAM / 512GB SSD', 730.00, 912.50),
(1, 3, 'HP-PRO-C', 'HP ProBook 450 - 32GB RAM / 1TB SSD', 890.00, 1112.50),
(1, 4, 'ASU-VIV-A', 'ASUS VivoBook 15 - 8GB RAM / 256GB SSD', 450.00, 562.50),
(1, 4, 'ASU-VIV-B', 'ASUS VivoBook 15 - 16GB RAM / 512GB SSD', 570.00, 712.50),
(1, 4, 'ASU-VIV-C', 'ASUS VivoBook 15 - 32GB RAM / 1TB SSD', 730.00, 912.50),
(1, 4, 'ASU-TUF-A', 'ASUS TUF Gaming - 8GB RAM / 256GB SSD', 800.00, 1000.00),
(1, 4, 'ASU-TUF-B', 'ASUS TUF Gaming - 16GB RAM / 512GB SSD', 920.00, 1150.00),
(1, 4, 'ASU-TUF-C', 'ASUS TUF Gaming - 32GB RAM / 1TB SSD', 1080.00, 1350.00),
(1, 5, 'ACE-ASP-A', 'Acer Aspire 5 - 8GB RAM / 256GB SSD', 420.00, 525.00),
(1, 5, 'ACE-ASP-B', 'Acer Aspire 5 - 16GB RAM / 512GB SSD', 540.00, 675.00),
(1, 5, 'ACE-ASP-C', 'Acer Aspire 5 - 32GB RAM / 1TB SSD', 700.00, 875.00),
(1, 5, 'ACE-NIT-A', 'Acer Nitro 5 - 8GB RAM / 256GB SSD', 790.00, 987.50),
(1, 5, 'ACE-NIT-B', 'Acer Nitro 5 - 16GB RAM / 512GB SSD', 910.00, 1137.50),
(1, 5, 'ACE-NIT-C', 'Acer Nitro 5 - 32GB RAM / 1TB SSD', 1070.00, 1337.50),
(1, 6, 'MSI-MOD-A', 'MSI Modern 15 - 8GB RAM / 256GB SSD', 570.00, 712.50),
(1, 6, 'MSI-MOD-B', 'MSI Modern 15 - 16GB RAM / 512GB SSD', 690.00, 862.50),
(1, 6, 'MSI-MOD-C', 'MSI Modern 15 - 32GB RAM / 1TB SSD', 850.00, 1062.50),
(1, 6, 'MSI-KAT-A', 'MSI Katana - 8GB RAM / 256GB SSD', 900.00, 1125.00),
(1, 6, 'MSI-KAT-B', 'MSI Katana - 16GB RAM / 512GB SSD', 1020.00, 1275.00),
(1, 6, 'MSI-KAT-C', 'MSI Katana - 32GB RAM / 1TB SSD', 1180.00, 1475.00),
(2, 7, 'SAM-990-500', 'Samsung 990 EVO SSD 500GB', 45.00, 58.50),
(2, 7, 'SAM-990-1000', 'Samsung 990 EVO SSD 1TB', 80.00, 104.00),
(2, 7, 'SAM-990-2000', 'Samsung 990 EVO SSD 2TB', 145.00, 188.50),
(2, 7, 'SAM-980-500', 'Samsung 980 PRO SSD 500GB', 55.00, 71.50),
(2, 7, 'SAM-980-1000', 'Samsung 980 PRO SSD 1TB', 90.00, 117.00),
(2, 7, 'SAM-980-2000', 'Samsung 980 PRO SSD 2TB', 155.00, 201.50),
(2, 9, 'KIN-NV3-500', 'Kingston NV3 SSD 500GB', 30.00, 39.00),
(2, 9, 'KIN-NV3-1000', 'Kingston NV3 SSD 1TB', 65.00, 84.50),
(2, 9, 'KIN-NV3-2000', 'Kingston NV3 SSD 2TB', 130.00, 169.00),
(2, 9, 'KIN-KC3-500', 'Kingston KC3000 SSD 500GB', 48.00, 62.40),
(2, 9, 'KIN-KC3-1000', 'Kingston KC3000 SSD 1TB', 83.00, 107.90),
(2, 9, 'KIN-KC3-2000', 'Kingston KC3000 SSD 2TB', 148.00, 192.40),
(2, 6, 'MSI-M450-500', 'MSI Spatium M450 SSD 500GB', 38.00, 49.40),
(2, 6, 'MSI-M450-1000', 'MSI Spatium M450 SSD 1TB', 73.00, 94.90),
(2, 6, 'MSI-M450-2000', 'MSI Spatium M450 SSD 2TB', 138.00, 179.40),
(2, 4, 'ASU-SSD-500', 'ASUS TUF Gaming SSD 500GB', 50.00, 65.00),
(2, 4, 'ASU-SSD-1000', 'ASUS TUF Gaming SSD 1TB', 85.00, 110.50),
(2, 4, 'ASU-SSD-2000', 'ASUS TUF Gaming SSD 2TB', 150.00, 195.00),
(2, 9, 'KIN-FB4-8', 'Kingston Fury Beast DDR4 8GB', 20.00, 26.00),
(2, 9, 'KIN-FB4-16', 'Kingston Fury Beast DDR4 16GB', 42.00, 54.60),
(2, 9, 'KIN-FB4-32', 'Kingston Fury Beast DDR4 32GB', 85.00, 110.50),
(2, 9, 'KIN-FB5-8', 'Kingston Fury Beast DDR5 8GB', 28.00, 36.40),
(2, 9, 'KIN-FB5-16', 'Kingston Fury Beast DDR5 16GB', 50.00, 65.00),
(2, 9, 'KIN-FB5-32', 'Kingston Fury Beast DDR5 32GB', 93.00, 120.90),
(2, 9, 'KIN-FR5-8', 'Kingston Fury Renegade DDR5 8GB', 35.00, 45.50),
(2, 9, 'KIN-FR5-16', 'Kingston Fury Renegade DDR5 16GB', 57.00, 74.10),
(2, 9, 'KIN-FR5-32', 'Kingston Fury Renegade DDR5 32GB', 100.00, 130.00),
(2, 9, 'KIN-VR4-8', 'Kingston ValueRAM DDR4 8GB', 18.00, 23.40),
(2, 9, 'KIN-VR4-16', 'Kingston ValueRAM DDR4 16GB', 40.00, 52.00),
(2, 9, 'KIN-VR4-32', 'Kingston ValueRAM DDR4 32GB', 83.00, 107.90),
(2, 7, 'SAM-RM4-8', 'Samsung DDR4 Memory 8GB', 19.00, 24.70),
(2, 7, 'SAM-RM4-16', 'Samsung DDR4 Memory 16GB', 41.00, 53.30),
(2, 7, 'SAM-RM4-32', 'Samsung DDR4 Memory 32GB', 84.00, 109.20),
(2, 7, 'SAM-RM5-8', 'Samsung DDR5 Memory 8GB', 30.00, 39.00),
(2, 7, 'SAM-RM5-16', 'Samsung DDR5 Memory 16GB', 52.00, 67.60),
(2, 7, 'SAM-RM5-32', 'Samsung DDR5 Memory 32GB', 95.00, 123.50),
(3, 8, 'LOG-M185-BLK', 'Logitech M185 Mouse - Black', 12.00, 15.60),
(3, 8, 'LOG-M185-WHT', 'Logitech M185 Mouse - White', 14.00, 18.20),
(3, 8, 'LOG-M185-GRY', 'Logitech M185 Mouse - Gray', 15.00, 19.50),
(3, 8, 'LOG-G502-BLK', 'Logitech G502 Gaming Mouse - Black', 42.00, 54.60),
(3, 8, 'LOG-G502-WHT', 'Logitech G502 Gaming Mouse - White', 44.00, 57.20),
(3, 8, 'LOG-G502-GRY', 'Logitech G502 Gaming Mouse - Gray', 45.00, 58.50),
(3, 8, 'LOG-K380-BLK', 'Logitech K380 Keyboard - Black', 30.00, 39.00),
(3, 8, 'LOG-K380-WHT', 'Logitech K380 Keyboard - White', 32.00, 41.60),
(3, 8, 'LOG-K380-GRY', 'Logitech K380 Keyboard - Gray', 33.00, 42.90),
(3, 8, 'LOG-G213-BLK', 'Logitech G213 Keyboard - Black', 39.00, 50.70),
(3, 8, 'LOG-G213-WHT', 'Logitech G213 Keyboard - White', 41.00, 53.30),
(3, 8, 'LOG-G213-GRY', 'Logitech G213 Keyboard - Gray', 42.00, 54.60),
(3, 8, 'LOG-H390-BLK', 'Logitech H390 Headset - Black', 20.00, 26.00),
(3, 8, 'LOG-H390-WHT', 'Logitech H390 Headset - White', 22.00, 28.60),
(3, 8, 'LOG-H390-GRY', 'Logitech H390 Headset - Gray', 23.00, 29.90),
(3, 8, 'LOG-C920-BLK', 'Logitech C920 Webcam - Black', 48.00, 62.40),
(3, 8, 'LOG-C920-WHT', 'Logitech C920 Webcam - White', 50.00, 65.00),
(3, 8, 'LOG-C920-GRY', 'Logitech C920 Webcam - Gray', 51.00, 66.30),
(3, 8, 'LOG-Z150-BLK', 'Logitech Z150 Speakers - Black', 18.00, 23.40),
(3, 8, 'LOG-Z150-WHT', 'Logitech Z150 Speakers - White', 20.00, 26.00),
(3, 8, 'LOG-Z150-GRY', 'Logitech Z150 Speakers - Gray', 21.00, 27.30),
(3, 2, 'DEL-DOCK-BLK', 'Dell USB-C Dock - Black', 65.00, 84.50),
(3, 2, 'DEL-DOCK-WHT', 'Dell USB-C Dock - White', 67.00, 87.10),
(3, 2, 'DEL-DOCK-GRY', 'Dell USB-C Dock - Gray', 68.00, 88.40),
(3, 3, 'HP-HUB-BLK', 'HP USB-C Hub - Black', 22.00, 28.60),
(3, 3, 'HP-HUB-WHT', 'HP USB-C Hub - White', 24.00, 31.20),
(3, 3, 'HP-HUB-GRY', 'HP USB-C Hub - Gray', 25.00, 32.50),
(3, 1, 'LNV-CHG-BLK', 'Lenovo USB-C Charger - Black', 31.00, 40.30),
(3, 1, 'LNV-CHG-WHT', 'Lenovo USB-C Charger - White', 33.00, 42.90),
(3, 1, 'LNV-CHG-GRY', 'Lenovo USB-C Charger - Gray', 34.00, 44.20),
(3, 4, 'ASU-PAD-BLK', 'ASUS Mouse Pad - Black', 15.00, 19.50),
(3, 4, 'ASU-PAD-WHT', 'ASUS Mouse Pad - White', 17.00, 22.10),
(3, 4, 'ASU-PAD-GRY', 'ASUS Mouse Pad - Gray', 18.00, 23.40),
(3, 6, 'MSI-MSE-BLK', 'MSI Gaming Mouse - Black', 25.00, 32.50),
(3, 6, 'MSI-MSE-WHT', 'MSI Gaming Mouse - White', 27.00, 35.10),
(3, 6, 'MSI-MSE-GRY', 'MSI Gaming Mouse - Gray', 28.00, 36.40),
(3, 3, 'HP-SLV-BLK', 'HP Laptop Sleeve - Black', 18.00, 23.40),
(3, 3, 'HP-SLV-WHT', 'HP Laptop Sleeve - White', 20.00, 26.00),
(3, 3, 'HP-SLV-GRY', 'HP Laptop Sleeve - Gray', 21.00, 27.30),
(3, 5, 'ACE-KBD-BLK', 'Acer Wireless Keyboard - Black', 21.00, 27.30),
(3, 5, 'ACE-KBD-WHT', 'Acer Wireless Keyboard - White', 23.00, 29.90),
(3, 5, 'ACE-KBD-GRY', 'Acer Wireless Keyboard - Gray', 24.00, 31.20),
(3, 2, 'DEL-HDS-BLK', 'Dell Wireless Headset - Black', 44.00, 57.20),
(3, 2, 'DEL-HDS-WHT', 'Dell Wireless Headset - White', 46.00, 59.80),
(3, 2, 'DEL-HDS-GRY', 'Dell Wireless Headset - Gray', 47.00, 61.10),
(4, 7, 'SAM-MON-24', 'Samsung Essential Monitor 24-inch', 95.00, 118.75),
(4, 7, 'SAM-MON-27', 'Samsung Essential Monitor 27-inch', 140.00, 175.00),
(4, 7, 'SAM-MON-32', 'Samsung Essential Monitor 32-inch', 205.00, 256.25),
(4, 2, 'DEL-MON-24', 'Dell Office Monitor 24-inch', 105.00, 131.25),
(4, 2, 'DEL-MON-27', 'Dell Office Monitor 27-inch', 150.00, 187.50),
(4, 2, 'DEL-MON-32', 'Dell Office Monitor 32-inch', 215.00, 268.75),
(4, 3, 'HP-MON-24', 'HP Series Monitor 24-inch', 100.00, 125.00),
(4, 3, 'HP-MON-27', 'HP Series Monitor 27-inch', 145.00, 181.25),
(4, 3, 'HP-MON-32', 'HP Series Monitor 32-inch', 210.00, 262.50),
(4, 4, 'ASU-MON-24', 'ASUS ProArt Monitor 24-inch', 230.00, 287.50),
(4, 4, 'ASU-MON-27', 'ASUS ProArt Monitor 27-inch', 275.00, 343.75),
(4, 4, 'ASU-MON-32', 'ASUS ProArt Monitor 32-inch', 340.00, 425.00),
(4, 5, 'ACE-MON-24', 'Acer Nitro Monitor 24-inch', 135.00, 168.75),
(4, 5, 'ACE-MON-27', 'Acer Nitro Monitor 27-inch', 180.00, 225.00),
(4, 5, 'ACE-MON-32', 'Acer Nitro Monitor 32-inch', 245.00, 306.25),
(4, 6, 'MSI-MON-24', 'MSI Optix Monitor 24-inch', 160.00, 200.00),
(4, 6, 'MSI-MON-27', 'MSI Optix Monitor 27-inch', 205.00, 256.25),
(4, 6, 'MSI-MON-32', 'MSI Optix Monitor 32-inch', 270.00, 337.50),
(4, 10, 'TPL-AX55-1', 'TP-Link Archer AX55 - 1 Pack', 45.00, 58.50),
(4, 10, 'TPL-AX55-2', 'TP-Link Archer AX55 - 2 Pack', 85.50, 111.15),
(4, 10, 'TPL-AX55-3', 'TP-Link Archer AX55 - 3 Pack', 123.75, 160.88),
(4, 10, 'TPL-AX23-1', 'TP-Link Archer AX23 - 1 Pack', 30.00, 39.00),
(4, 10, 'TPL-AX23-2', 'TP-Link Archer AX23 - 2 Pack', 57.00, 74.10),
(4, 10, 'TPL-AX23-3', 'TP-Link Archer AX23 - 3 Pack', 82.50, 107.25),
(4, 10, 'TPL-DX20-1', 'TP-Link Deco X20 - 1 Pack', 55.00, 71.50),
(4, 10, 'TPL-DX20-2', 'TP-Link Deco X20 - 2 Pack', 104.50, 135.85),
(4, 10, 'TPL-DX20-3', 'TP-Link Deco X20 - 3 Pack', 151.25, 196.63),
(4, 10, 'TPL-DX50-1', 'TP-Link Deco X50 - 1 Pack', 78.00, 101.40),
(4, 10, 'TPL-DX50-2', 'TP-Link Deco X50 - 2 Pack', 148.20, 192.66),
(4, 10, 'TPL-DX50-3', 'TP-Link Deco X50 - 3 Pack', 214.50, 278.85),
(4, 10, 'TPL-EAP-1', 'TP-Link Omada EAP610 - 1 Pack', 62.00, 80.60),
(4, 10, 'TPL-EAP-2', 'TP-Link Omada EAP610 - 2 Pack', 117.80, 153.14),
(4, 10, 'TPL-EAP-3', 'TP-Link Omada EAP610 - 3 Pack', 170.50, 221.65);

-- Supplier products
INSERT INTO supplier_products (supplier_id, product_id, supplier_sku, supplier_price)
SELECT ((product_id - 1) % 10) + 1, product_id, sku, cost_price
FROM products;

-- Inventory
INSERT INTO inventory (branch_id, product_id, quantity, reorder_level)
SELECT 1, product_id, 35, 8 FROM products;

INSERT INTO inventory (branch_id, product_id, quantity, reorder_level)
SELECT 2, product_id, 30, 8 FROM products;

INSERT INTO inventory (branch_id, product_id, quantity, reorder_level)
SELECT 3, product_id, 25, 8 FROM products;

UPDATE inventory SET quantity = 4
WHERE branch_id = 3 AND product_id <= 10;

-- Customers
INSERT INTO customers (full_name, email)
SELECT 'Customer ' || n, 'customer' || n || '@example.com'
FROM generate_series(1, 150) AS n;

-- Inventory
INSERT INTO inventory (branch_id, product_id, quantity, reorder_level)
SELECT
    branch_id,
    product_id,
    (product_id * branch_id) % 26 + 5,
    8
FROM branches
CROSS JOIN products;

COMMIT;
