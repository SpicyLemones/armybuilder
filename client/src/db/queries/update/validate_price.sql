UPDATE prices
SET
  validated = 1,
  link = ?,
  price = ?
WHERE
  seller_id = ?
  AND product_id = ?