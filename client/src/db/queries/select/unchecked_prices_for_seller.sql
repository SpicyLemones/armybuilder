SELECT *
FROM prices
WHERE (validated IS NULL OR validated = 0)
  AND seller_id = ?
LIMIT 1;
