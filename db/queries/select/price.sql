SELECT
  (price, link)
FROM
  prices
WHERE
  seller_id = ?
  AND item_id = ?