INSERT INTO
  prices (seller_id, item_id, price, link)
VALUES
  (?, ?, ?, ?) ON CONFLICT (seller_id, item_id) DO
UPDATE
SET
  price = excluded.price,
  link = excluded.link;