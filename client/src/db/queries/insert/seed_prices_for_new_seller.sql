INSERT INTO prices (seller_id, product_id, price, link, validated)
SELECT ?, p.id, NULL, NULL, NULL
FROM products p
ON CONFLICT(seller_id, product_id) DO NOTHING;
