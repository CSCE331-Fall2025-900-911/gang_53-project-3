import express from "express";
import pool from "../db.js";

const router = express.Router();

const TOPPING_MAP = {
  tapioca: { id: 20, name: "Tapioca Pearls" },
  grass: { id: 21, name: "Grass Jelly" },
  red_bean: { id: 22, name: "Red Bean" },
  aloe: { id: 23, name: "Aloe Vera" },
  pudding: { id: 24, name: "Pudding" },
  oreo: { id: 25, name: "Oreo Crumbs" },
  cheese: { id: 26, name: "Cheese Foam" },
  rainbow: { id: 27, name: "Rainbow Jelly" },
};

function extractInventoryId(itemId = "") {
  const match = /product-(\d+)/.exec(itemId);
  return match ? Number(match[1]) : null;
}

router.post("/", async (req, res) => {
  const body = req.body;

  console.log("Parsed body:", body);

  // Support BOTH naming conventions
  const items = body.items;
  const customerName = body.customer_name || body.customerName || "Guest";

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      error: "No items provided to create order",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Insert order with guaranteed non-null customer_name
    const orderResult = await client.query(
      "INSERT INTO orders (customer_name) VALUES ($1) RETURNING order_id",
      [customerName]
    );
    const orderId = orderResult.rows[0].order_id;
    console.log('Created order with ID:', orderId);
    console.log('Processing items:', items);

    for (const line of items) {
      const baseInventoryId = extractInventoryId(line.itemId);
      const quantity = Number(line.quantity) || 0;

      console.log('Processing item:', line.itemId, 'Extracted ID:', baseInventoryId, 'Quantity:', quantity);

      if (!baseInventoryId) {
        throw new Error(`Invalid itemId: ${line.itemId}`);
      }
      if (quantity < 1) {
        throw new Error(`Invalid quantity for item ${line.itemId}`);
      }

      // Deduct product stock
      const baseUpdate = await client.query(
        "UPDATE inventory SET quantity_on_hand = quantity_on_hand - $2 WHERE inventory_id = $1 AND quantity_on_hand >= $2 RETURNING quantity_on_hand",
        [baseInventoryId, quantity]
      );
      if (baseUpdate.rowCount === 0) {
        throw new Error(`Insufficient stock for product ${line.itemId}`);
      }

      // Insert item
      const itemResult = await client.query(
        "INSERT INTO order_items (order_id, inventory_id, quantity) VALUES ($1, $2, $3) RETURNING order_item_id",
        [orderId, baseInventoryId, quantity]
      );
      const orderItemId = itemResult.rows[0].order_item_id;

      // Toppings
      const toppingSelections =
        Array.isArray(line?.selections?.toppings)
          ? line.selections.toppings
          : [];

      for (const topKey of toppingSelections) {
        const topping = TOPPING_MAP[topKey];
        if (!topping) continue;

        const topUpdate = await client.query(
          "UPDATE inventory SET quantity_on_hand = quantity_on_hand - $2 WHERE inventory_id = $1 AND quantity_on_hand >= $2 RETURNING quantity_on_hand",
          [topping.id, quantity]
        );
        if (topUpdate.rowCount === 0) {
          throw new Error(`Insufficient stock for topping ${topping.name}`);
        }

        await client.query(
          "INSERT INTO order_item_toppings (order_item_id, inventory_id, quantity) VALUES ($1, $2, $3)",
          [orderItemId, topping.id, quantity]
        );
      }
    }

    await client.query("COMMIT");

    // Return the full order data
    const orderData = await client.query(
      "SELECT order_id, customer_name, order_date FROM orders WHERE order_id = $1",
      [orderId]
    );

    return res.json({ 
      success: true, 
      data: orderData.rows[0]
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Order creation failed:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Failed to create order",
    });
  } finally {
    client.release();
  }
});

export default router;
