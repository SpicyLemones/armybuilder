-- select/validated_pairs.sql
SELECT seller_id, product_id, link
FROM prices
WHERE validated = 1 AND link IS NOT NULL;
