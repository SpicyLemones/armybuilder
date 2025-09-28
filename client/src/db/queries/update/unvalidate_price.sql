UPDATE prices
SET
  validated = NULL
WHERE
  seller_id = ?
  AND product_id = ?;
