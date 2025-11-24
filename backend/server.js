import express from "express";
import cors from "cors";
import inventoryRouter from "./routes/inventory.js";
import usageRouter from "./routes/usage.js";
import employeesRouter from "./routes/employees.js";
import reportsRouter from "./routes/reports.js";
import ordersRouter from "./routes/orders.js";

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

app.use("/api/inventory", inventoryRouter);

app.use("/api/usage", usageRouter);

app.use("/api/employees", employeesRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/orders", ordersRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
