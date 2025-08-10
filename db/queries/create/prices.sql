CREATE TABLE prices (
  seller_id INTEGER NOT NULL,
  item_id INTEGER NOT NULL,
  price REAL NOT NULL,
  link TEXT NOT NULL,
  PRIMARY KEY (seller_id, item_id),
  FOREIGN KEY (seller_id) REFERENCES sellers (id),
  FOREIGN KEY (item_id) REFERENCES items (id)
);