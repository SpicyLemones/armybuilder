CREATE TABLE prices (
  seller_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  price REAL,
  link TEXT,
  validated BOOLEAN,
  PRIMARY KEY (seller_id, product_id),
  FOREIGN KEY (seller_id) REFERENCES sellers (id),
  FOREIGN KEY (product_id) REFERENCES products (id)
);