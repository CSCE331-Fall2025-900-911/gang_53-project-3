import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  port: Number(process.env.DATABASE_PORT) || 5432,
  ssl: { rejectUnauthorized: false },
});

const TOPPING_MAP: Record<string, { id: number; name: string }> = {
  tapioca: { id: 20, name: 'Tapioca Pearls' },
  grass: { id: 21, name: 'Grass Jelly' },
  red_bean: { id: 22, name: 'Red Bean' },
  aloe: { id: 23, name: 'Aloe Vera' },
  pudding: { id: 24, name: 'Pudding' },
  oreo: { id: 25, name: 'Oreo Crumbs' },
  cheese: { id: 26, name: 'Cheese Foam' },
  rainbow: { id: 27, name: 'Rainbow Jelly' },
};

const extractInventoryId = (itemId = '') => {
  const match = /product-(\d+)/.exec(itemId);
  return match ? Number(match[1]) : null;
};

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON payload' },
      { status: 400 }
    );
  }

  const { items, customerName } = body ?? {};

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      { success: false, error: 'No items provided to create order' },
      { status: 400 }
    );
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const orderResult = await client.query(
      'INSERT INTO orders (customer_name) VALUES ($1) RETURNING order_id',
      [customerName || 'Guest']
    );
    const orderId = orderResult.rows[0].order_id;

    for (const line of items) {
      const baseInventoryId = extractInventoryId(line.itemId);
      const quantity = Number(line.quantity) || 0;

      if (!baseInventoryId) {
        throw new Error(`Invalid itemId: ${line.itemId}`);
      }
      if (quantity < 1) {
        throw new Error(`Invalid quantity for item ${line.itemId}`);
      }

      // Deduct product stock
      const baseUpdate = await client.query(
        'UPDATE inventory SET quantity_on_hand = quantity_on_hand - $2 WHERE inventory_id = $1 AND quantity_on_hand >= $2 RETURNING quantity_on_hand',
        [baseInventoryId, quantity]
      );
      if (baseUpdate.rowCount === 0) {
        throw new Error(`Insufficient stock for product ${line.itemId}`);
      }

      // Create order item
      const itemResult = await client.query(
        'INSERT INTO order_items (order_id, inventory_id, quantity) VALUES ($1, $2, $3) RETURNING order_item_id',
        [orderId, baseInventoryId, quantity]
      );
      const orderItemId = itemResult.rows[0].order_item_id;

      // Handle toppings
      const toppingSelections = Array.isArray(line?.selections?.toppings)
        ? line.selections.toppings
        : [];

      for (const topKey of toppingSelections) {
        const topping = TOPPING_MAP[topKey];
        if (!topping) continue;

        const topUpdate = await client.query(
          'UPDATE inventory SET quantity_on_hand = quantity_on_hand - $2 WHERE inventory_id = $1 AND quantity_on_hand >= $2 RETURNING quantity_on_hand',
          [topping.id, quantity]
        );
        if (topUpdate.rowCount === 0) {
          throw new Error(`Insufficient stock for topping ${topping.name}`);
        }

        await client.query(
          'INSERT INTO order_item_toppings (order_item_id, inventory_id, quantity) VALUES ($1, $2, $3)',
          [orderItemId, topping.id, quantity]
        );
      }
    }

    await client.query('COMMIT');
    return NextResponse.json({ success: true, orderId });
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Order creation failed:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to create order' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
