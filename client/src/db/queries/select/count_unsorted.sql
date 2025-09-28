SELECT *
FROM prices
WHERE validated IS NULL
ORDER BY seller_id, product_id