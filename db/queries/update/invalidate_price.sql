UPDATE prices
SET
  validated = 0
WHERE
  seller_id = ?
  AND product_id = ?