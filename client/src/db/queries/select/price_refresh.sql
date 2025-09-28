UPDATE prices
SET price = ?,
    last_checked_at = ?,
    last_success_at = ?
WHERE seller_id = ?
  AND product_id = ?;