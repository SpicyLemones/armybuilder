CREATE TABLE sellers (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  base_url TEXT NOT NULL,
  search_url TEXT NOT NULL,
  product_selector TEXT NOT NULL,
  name_selector TEXT NOT NULL,
  link_selector TEXT NOT NULL,
  price_selector TEXT NOT NULL,
  sale_selector TEXT NOT NULL,
  image_selector TEXT NOT NULL
);