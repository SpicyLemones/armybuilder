UPDATE prices
SET price = ?, link = ?
WHERE seller_id = ? AND product_id = ? AND validated IS NOT NULL;
