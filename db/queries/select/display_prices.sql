SELECT
  sellers.name AS seller_name,
  price,
  link
FROM
  prices
  JOIN sellers ON prices.seller_id = sellers.id
WHERE
  product_id = ?