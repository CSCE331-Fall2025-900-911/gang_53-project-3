import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
const session = require('express-session');

// Type declarations
declare module 'express-session' {
  interface SessionData {
    user?: {
      id: number;
      username?: string; // optional
      email: string;
      name: string;
    };
  }
}

// Load environment variables
dotenv.config();

// PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  port: Number(process.env.DATABASE_PORT) || 5432,
  ssl: false, // TAMU DB usually doesn’t need SSL for campus connections
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Basic topping map so we can decrement the correct inventory rows
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

const extractInventoryId = (itemId?: string) => {
  const match = /product-(\d+)/.exec(itemId ?? '');
  return match ? Number(match[1]) : null;
};

// Create Express app
const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = [
  'https://bobaliciousgang53.vercel.app',   // production frontend
  'http://localhost:3000', // local dev
];

const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    console.log('📍 CORS request from origin:', origin);
    if (!origin || allowedOrigins.includes(origin)) {
      console.log('✅ CORS allowed');
      callback(null, true);
    } else {
      console.log('⚠️ CORS: Allowing origin for debugging:', origin);
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Explicit preflight handling
app.options('*', cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));



// Middleware
app.use(
  session({
    secret: "a3f5d6e7c8b9a0d1e2f3g4h5i6j7k8l9m0n1o2p3q4r5s6t7u8v9w0x1y2z3",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production', 
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax' 
    }
  })
);

// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

// Determine URLs based on environment
const getCallbackURL = () => {
  if (process.env.NODE_ENV === 'production') {
    return 'https://gang53-project-3-backend.vercel.app/auth/google/callback';
  }
  return 'http://localhost:5000/auth/google/callback';
};

const getFrontendURL = () => {
  if (process.env.NODE_ENV === 'production') {
    return 'https://bobaliciousgang53.vercel.app';
  }
  return 'http://localhost:3000';
};

// Google OAuth Config
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: getCallbackURL(),
    },
    (
      accessToken: string,
      refreshToken: string,
      profile: passport.Profile,
      done: (error: any, user?: any) => void
    ) => {
      return done(null, profile);
    }
  )
);

passport.serializeUser((user: any, done: (error: any, id?: any) => void) => {
  done(null, user);
});

passport.deserializeUser((user: any, done: (error: any, user?: any) => void) => {
  done(null, user as Express.User);
});


// Check authentication status
app.get('/auth/status', (req, res) => {
  if (req.isAuthenticated() && req.user) {
    res.json({ authenticated: true, user: req.user });
  } else if ((req.session as any).user) {
    res.json({ authenticated: true, user: (req.session as any).user });
  } else {
    res.json({ authenticated: false });
  }
});

// Google OAuth Routes
app.get(
  '/auth/google',
  (req: Request, res: Response, next: NextFunction) => {
    console.log('🔐 Google OAuth route hit');
    console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Set' : 'NOT SET');
    console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'NOT SET');
    passport.authenticate('google', { 
      scope: ['profile', 'email'],
      prompt: 'select_account'
    })(req, res, next);
  }
);

app.get(
  '/auth/google/callback',
  (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('google', { failureRedirect: getFrontendURL() + '/login' })(req, res, next);
  },
  async (req, res) => {
    try {
      const googleProfile = req.user as Profile;

      if (!googleProfile || !googleProfile.emails || !googleProfile.displayName) {
        return res.status(400).send('Invalid Google profile data');
      }

      const email = googleProfile.emails[0].value;
      const name = googleProfile.displayName;

      // Check if the customer exists in the database
      const result = await pool.query(
        'SELECT * FROM customers WHERE email = $1',
        [email]
      );

      let user;
      if (result.rowCount === 0) {
        // If the customer doesn't exist, create a new customer
        const newCustomer = await pool.query(
          'INSERT INTO customers (name, email) VALUES ($1, $2) RETURNING id, name, email',
          [name, email]
        );
        user = newCustomer.rows[0];
      } else {
        // If the customer exists, get their info
        user = result.rows[0];
      }

      // Store user in session
      (req.session as any).user = user;

      // Redirect to the dashboard
      res.redirect(getFrontendURL() + '/dashboard');
    } catch (error) {
      console.error('Error during Google login:', error);
      res.status(500).send('Failed to login with Google');
    }
  }
);


app.get('/auth/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).send('Error logging out');
    }
    
    req.session.destroy((destroyErr) => {
      if (destroyErr) {
        return res.status(500).send('Error destroying session');
      }
      
      res.clearCookie('connect.sid');
      res.json({ message: 'Logged out successfully', authenticated: false });
    });
  });
});



// Routes
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Welcome to the API',
    status: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/test-db', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT current_user, current_database(), NOW()');
    res.json({
      connected: true,
      db_user: result.rows[0].current_user,
      db_name: result.rows[0].current_database,
      time: result.rows[0].now
    });
  } catch (error) {
    console.error('Database connection failed:', error);
    res.status(500).json({
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});


app.get('/api/health', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      status: 'healthy',
      uptime: process.uptime(),
      database: 'connected',
      timestamp: new Date().toISOString(),
      dbTime: result.rows[0].now
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});


// ===== INVENTORY ROUTES (Specific routes BEFORE generic ones) =====

// Add item - MUST come before generic /api/inventory/:id routes
app.post('/api/inventory/add', async (req: Request, res: Response) => {
  try {
    console.log('✅ POST /api/inventory/add endpoint hit');
    console.log('📦 Request body:', req.body);
    const { name, category, price, quantity_on_hand, reorder_level, seasonal } = req.body;
    const result = await pool.query(
      `INSERT INTO inventory (name, category, price, quantity_on_hand, reorder_level, seasonal)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, category, price, quantity_on_hand, reorder_level, seasonal]
    );
    console.log('✅ Item added successfully:', result.rows[0]);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error adding inventory item:', error);
    res.status(500).json({ success: false, error: 'Failed to add item' });
  }
});

// Update item (supports partial updates with null values) - MUST come before generic /:id route
app.put('/api/inventory/update/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, price, quantity_on_hand, reorder_level, seasonal } = req.body;

    // Build dynamic UPDATE query with only provided fields
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (name !== null && name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (price !== null && price !== undefined) {
      updates.push(`price = $${paramCount++}`);
      values.push(price);
    }
    if (quantity_on_hand !== null && quantity_on_hand !== undefined) {
      updates.push(`quantity_on_hand = $${paramCount++}`);
      values.push(quantity_on_hand);
    }
    if (reorder_level !== null && reorder_level !== undefined) {
      updates.push(`reorder_level = $${paramCount++}`);
      values.push(reorder_level);
    }
    if (seasonal !== null && seasonal !== undefined) {
      updates.push(`seasonal = $${paramCount++}`);
      values.push(seasonal);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    values.push(id);
    const query = `UPDATE inventory SET ${updates.join(', ')} WHERE inventory_id = $${paramCount} RETURNING *`;

    const result = await pool.query(query, values);
    if (result.rowCount === 0) return res.status(404).json({ success: false, error: 'Item not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error updating inventory item:', error);
    res.status(500).json({ success: false, error: 'Failed to update item' });
  }
});

// Restock item - MUST come before generic /:id route
app.put('/api/inventory/restock/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    if (amount === undefined || amount === null) {
      return res.status(400).json({ success: false, error: 'Missing amount field' });
    }

    const result = await pool.query(
      `UPDATE inventory 
       SET quantity_on_hand = quantity_on_hand + $1 
       WHERE inventory_id = $2 
       RETURNING *`,
      [amount, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ success: false, error: 'Item not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error restocking inventory item:', error);
    res.status(500).json({ success: false, error: 'Failed to restock item' });
  }
});

// Generic routes - come AFTER specific ones
app.get('/api/inventory', async (req: Request, res: Response) => {
  try {
    console.log('📦 /api/inventory endpoint hit');
    const result = await pool.query('SELECT * FROM inventory ORDER BY inventory_id ASC');
    console.log('✅ Inventory fetched:', result.rows.length, 'items');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('❌ Error fetching inventory:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch inventory', details: error instanceof Error ? error.message : String(error) });
  }
});

app.post('/api/inventory', async (req: Request, res: Response) => {
  try {
    const { name, category, price, quantity_on_hand, reorder_level, seasonal } = req.body;
    const result = await pool.query(
      `INSERT INTO inventory (name, category, price, quantity_on_hand, reorder_level, seasonal)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, category, price, quantity_on_hand, reorder_level, seasonal]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error adding inventory item:', error);
    res.status(500).json({ success: false, error: 'Failed to add item' });
  }
});

app.get('/api/inventory/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM inventory WHERE inventory_id = $1', [id]);
    if (result.rowCount === 0) return res.status(404).json({ success: false, error: 'Item not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching inventory item:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch item' });
  }
});

app.put('/api/inventory/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, category, price, quantity_on_hand, reorder_level, seasonal } = req.body;
    const result = await pool.query(
      `UPDATE inventory
       SET name = $1, category = $2, price = $3, quantity_on_hand = $4, reorder_level = $5, seasonal = $6
       WHERE inventory_id = $7
       RETURNING *`,
      [name, category, price, quantity_on_hand, reorder_level, seasonal, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ success: false, error: 'Item not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error updating inventory item:', error);
    res.status(500).json({ success: false, error: 'Failed to update item' });
  }
});

app.delete('/api/inventory/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM inventory WHERE inventory_id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) return res.status(404).json({ success: false, error: 'Item not found' });
    res.json({ success: true, message: 'Item deleted', data: result.rows[0] });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    res.status(500).json({ success: false, error: 'Failed to delete item' });
  }
});

// ===== REPORTS ROUTES =====
app.get('/api/reports/xreport', async (req: Request, res: Response) => {
  try {
    console.log('📊 X-Report endpoint hit');
    // Get today's local date
    const today = new Date();
    const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    console.log('⏰ Today\'s date (Local):', localDate);
    const result = await pool.query(
      `SELECT 
        EXTRACT(HOUR FROM o.order_date)::int as hour, 
        COUNT(DISTINCT o.order_id)::int as order_count, 
        COALESCE(SUM(oi.quantity * i.price), 0) + COALESCE(SUM(oit.quantity * ti.price), 0) as total_sales 
      FROM orders o 
      LEFT JOIN order_items oi ON o.order_id = oi.order_id 
      LEFT JOIN inventory i ON oi.inventory_id = i.inventory_id 
      LEFT JOIN order_item_toppings oit ON oi.order_item_id = oit.order_item_id 
      LEFT JOIN inventory ti ON oit.inventory_id = ti.inventory_id 
      WHERE DATE(o.order_date) = $1::date
      GROUP BY EXTRACT(HOUR FROM o.order_date) 
      ORDER BY hour`,
      [localDate]
    );
    console.log('✅ X-Report data:', result.rows);
    console.log('Total rows returned:', result.rows.length);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('❌ Error fetching X report:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch X report' });
  }
});

app.get('/api/reports/zreport', async (req: Request, res: Response) => {
  try {
    console.log('📊 Z-Report endpoint hit');
    // Get today's local date
    const today = new Date();
    const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    console.log('⏰ Today\'s date (Local):', localDate);
    const result = await pool.query(
      `SELECT 
        COUNT(DISTINCT o.order_id)::int as total_orders,
        COALESCE(SUM(oi.quantity * i.price), 0) + COALESCE(SUM(oit.quantity * ti.price), 0) as total_sales,
        ROUND(
          (COALESCE(SUM(oi.quantity * i.price), 0) + COALESCE(SUM(oit.quantity * ti.price), 0)) / 
          NULLIF(COUNT(DISTINCT o.order_id), 0)::numeric, 2
        ) as avg_order_value
      FROM orders o 
      LEFT JOIN order_items oi ON o.order_id = oi.order_id 
      LEFT JOIN inventory i ON oi.inventory_id = i.inventory_id 
      LEFT JOIN order_item_toppings oit ON oi.order_item_id = oit.order_item_id 
      LEFT JOIN inventory ti ON oit.inventory_id = ti.inventory_id 
      WHERE DATE(o.order_date) = $1::date`,
      [localDate]
    );
    console.log('✅ Z-Report data:', result.rows[0]);
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('❌ Error fetching Z report:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch Z report' });
  }
});

// ===== USAGE ROUTES =====
app.get('/api/usage', async (req: Request, res: Response) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      return res.status(400).json({ success: false, error: 'Missing start or end date parameters' });
    }
    const result = await pool.query(
      `
      SELECT 
        i.name AS product_name,
        DATE(o.order_date) AS order_day,
        SUM(oi.quantity) AS total_quantity
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.order_id
      JOIN inventory i ON oi.inventory_id = i.inventory_id
      WHERE o.order_date BETWEEN $1 AND $2
      GROUP BY i.name, order_day
      ORDER BY order_day ASC
      `,
      [start, end]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching usage data:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch usage data' });
  }
});

// ===== ORDERS ROUTES =====
app.get('/api/orders', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM orders ORDER BY order_date DESC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch orders' });
  }
});

app.post('/api/orders', async (req: Request, res: Response) => {
  const body = req.body;
  console.log('POST /api/orders received:', body);

  const items = body.items;
  const customerName = body.customer_name || body.customerName || 'Guest';

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'No items provided to create order',
    });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Insert order
    const orderResult = await client.query(
      "INSERT INTO orders (customer_name) VALUES ($1) RETURNING order_id",
      [customerName]
    );
    const orderId = orderResult.rows[0].order_id;
    console.log('Created order with ID:', orderId);
    console.log('Processing items:', items);

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

    for (const line of items) {
      const itemIdStr = line.itemId || '';
      const match = /product-(\d+)/.exec(itemIdStr);
      const baseInventoryId = match ? Number(match[1]) : null;
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
      const toppingSelections = Array.isArray(line?.selections?.toppings)
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

    await client.query('COMMIT');

    const orderData = await client.query(
      "SELECT order_id, customer_name, order_date FROM orders WHERE order_id = $1",
      [orderId]
    );

    return res.status(201).json({ 
      success: true, 
      data: orderData.rows[0]
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Order creation failed:', err);
    return res.status(500).json({
      success: false,
      error: (err as Error).message || 'Failed to create order',
    });
  } finally {
    client.release();
  }
});

app.delete('/api/orders/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM orders WHERE order_id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) return res.status(404).json({ success: false, error: 'Order not found' });
    res.json({ success: true, message: 'Order deleted', data: result.rows[0] });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ success: false, error: 'Failed to delete order' });
  }
});

// ===== ORDER ITEMS ROUTES =====
app.get('/api/order-items/:order_id', async (req: Request, res: Response) => {
  try {
    const { order_id } = req.params;
    const result = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [order_id]);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching order items:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch order items' });
  }
});

app.post('/api/order-items', async (req: Request, res: Response) => {
  try {
    const { order_id, inventory_id, quantity } = req.body;
    const result = await pool.query(
      `INSERT INTO order_items (order_id, inventory_id, quantity)
       VALUES ($1, $2, $3) RETURNING *`,
      [order_id, inventory_id, quantity]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error adding order item:', error);
    res.status(500).json({ success: false, error: 'Failed to add order item' });
  }
});

// ===== ORDER ITEM TOPPINGS =====
app.get('/api/order-item-toppings/:order_item_id', async (req: Request, res: Response) => {
  try {
    const { order_item_id } = req.params;
    const result = await pool.query('SELECT * FROM order_item_toppings WHERE order_item_id = $1', [order_item_id]);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching toppings:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch toppings' });
  }
});

app.post('/api/order-item-toppings', async (req: Request, res: Response) => {
  try {
    const { order_item_id, inventory_id, quantity } = req.body;
    const result = await pool.query(
      `INSERT INTO order_item_toppings (order_item_id, inventory_id, quantity)
       VALUES ($1, $2, $3) RETURNING *`,
      [order_item_id, inventory_id, quantity]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error adding topping:', error);
    res.status(500).json({ success: false, error: 'Failed to add topping' });
  }
});

// ===== TEAM MEMBERS =====
app.get('/api/teammembers', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM teammembers ORDER BY id ASC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch team members' });
  }
});

app.post('/api/teammembers', async (req: Request, res: Response) => {
  try {
    const { name, role } = req.body;
    const result = await pool.query(
      `INSERT INTO teammembers (name, role) VALUES ($1, $2) RETURNING *`,
      [name, role]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to add team member' });
  }
});

// ===== EMPLOYEES =====
app.get('/api/employees', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT employee_id, name, role, username FROM employees ORDER BY employee_id ASC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch employees' });
  }
});

app.post('/api/employees', async (req: Request, res: Response) => {
  try {
    console.log('✅ POST /api/employees endpoint hit');
    console.log('📦 Request body:', req.body);
    const { employee_id, name, role, username, password } = req.body;
    
    let result;
    if (employee_id) {
      // If employee_id is provided, use it
      result = await pool.query(
        `INSERT INTO employees (employee_id, name, role, username, password)
         VALUES ($1, $2, $3, $4, $5) RETURNING employee_id, name, role, username`,
        [employee_id, name, role, username, password]
      );
    } else {
      // Otherwise let the database generate it via sequence
      result = await pool.query(
        `INSERT INTO employees (name, role, username, password)
         VALUES ($1, $2, $3, $4) RETURNING employee_id, name, role, username`,
        [name, role, username, password]
      );
    }
    console.log('✅ Employee added:', result.rows[0]);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('❌ Error adding employee:', error);
    const errorMsg = error instanceof Error ? error.message : 'Failed to add employee';
    console.error('Error details:', errorMsg);
    res.status(500).json({ success: false, error: errorMsg });
  }
});

app.put('/api/employees/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, role, username, password } = req.body;
    const result = await pool.query(
      `UPDATE employees 
       SET name = $1, role = $2, username = $3, password = $4
       WHERE employee_id = $5
       RETURNING employee_id, name, role, username`,
      [name, role, username, password, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update employee' });
  }
});

app.delete('/api/employees/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ DELETE /api/employees/${id}`);
    const result = await pool.query(
      `DELETE FROM employees WHERE employee_id = $1 RETURNING employee_id, name`,
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }
    console.log(`✅ Employee deleted:`, result.rows[0]);
    res.json({ success: true, message: 'Employee deleted', data: result.rows[0] });
  } catch (error) {
    console.error('❌ Error deleting employee:', error);
    res.status(500).json({ success: false, error: 'Failed to delete employee' });
  }
});



// ===== LOGIN ROUTE =====
app.post('/api/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  console.log('🔑 Login attempt for username:', username);

  try {
    // Query the database for the customer
    const result = await pool.query(
      'SELECT * FROM customers WHERE username = $1 AND password = $2',
      [username, password]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Create a session for the customer
    (req.session as any).user = user;
    
    res.json({ 
      success: true, 
      message: 'Login successful', 
      user: user 
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ success: false, error: 'Failed to login' });
  }
});

// Employee Login Endpoint
app.post('/api/employees/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  console.log('🔑 Employee login attempt for username:', username);

  try {
    // Query the database for the employee
    const result = await pool.query(
      'SELECT employee_id, name, role, username FROM employees WHERE username = $1 AND password = $2',
      [username, password]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ success: false, error: 'Invalid username or password' });
    }

    const employee = result.rows[0];

    // Create a session for the employee
    (req.session as any).employee = employee;
    
    res.json({ 
      success: true, 
      message: 'Login successful', 
      data: employee
    });
  } catch (error) {
    console.error('Error during employee login:', error);
    res.status(500).json({ success: false, error: 'Failed to login' });
  }
});


// 404 handler (must be after all route definitions)
app.use((req: Request, res: Response) => {
  console.log(`❌ 404: Route not found: ${req.method} ${req.path}`);
  console.log(`📍 Full URL: ${req.method} ${req.originalUrl}`);
  console.log(`📋 Accepted routes: GET/POST /api/inventory*, /auth/*, etc.`);
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// Error handling middleware (must be last)
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Export for Vercel serverless
export default app;

// For local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  });
}
