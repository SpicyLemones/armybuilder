INSERT INTO prices (seller_id, product_id, price, link, validated)
SELECT s.id, ?, NULL, NULL, NULL
FROM sellers s
ON CONFLICT(seller_id, product_id) DO NOTHING;
