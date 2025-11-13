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

// Create Express app
const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = [
  'https://bobaliciousgang53.vercel.app',   // hardcode URL
  'http://localhost:3000', // local dev
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.warn('🚫 Blocked by CORS:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));



// Middleware
app.use(
  session({
    secret: "a3f5d6e7c8b9a0d1e2f3g4h5i6j7k8l9m0n1o2p3q4r5s6t7u8v9w0x1y2z3",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, 
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
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    prompt: 'select_account'
  })
)

app.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  async (req, res) => {
    try {
      const googleProfile = req.user as Profile;

      if (!googleProfile || !googleProfile.emails || !googleProfile.displayName) {
        return res.status(400).send('Invalid Google profile data');
      }

      // Check if the customer exists in the database
      const result = await pool.query(
        'SELECT * FROM customers WHERE email = $1',
        [googleProfile.emails[0].value]
      );

      if (result.rowCount === 0) {
        // If the customer doesn't exist, create a new customer
        const newCustomer = await pool.query(
          'INSERT INTO customers (name, email) VALUES ($1, $2) RETURNING *',
          [googleProfile.displayName, googleProfile.emails[0].value]
        );
        (req.session as any).user = newCustomer.rows[0];
      } else {
        // If the customer exists, store their info in the session
        (req.session as any).user = result.rows[0];
      }

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


// ===== INVENTORY ROUTES =====
app.get('/api/inventory', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM inventory ORDER BY inventory_id ASC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch inventory' });
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
  try {
    const { customer_name } = req.body;
    const result = await pool.query(
      `INSERT INTO orders (customer_name, order_date) VALUES ($1, NOW()) RETURNING *`,
      [customer_name]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ success: false, error: 'Failed to create order' });
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
    const { name, role, username, password } = req.body;
    const result = await pool.query(
      `INSERT INTO employees (name, role, username, password)
       VALUES ($1, $2, $3, $4) RETURNING employee_id, name, role, username`,
      [name, role, username, password]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to add employee' });
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


// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
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