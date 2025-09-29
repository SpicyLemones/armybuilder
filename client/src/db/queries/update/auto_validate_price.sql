UPDATE prices
SET price = ?, link = ?, validated = 1
WHERE seller_id = ? AND product_id = ?;
