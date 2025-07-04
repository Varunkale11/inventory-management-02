const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const { authenticate, restrictTo } = require("./middleware/auth");
const logger = require("./utils/logger");

require("dotenv").config();

const app = express();

// Trust proxy (important for rate limiting and IP detection behind reverse proxy)
app.set("trust proxy", 1);

// Security Middleware
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  })
);

// Body parsing middleware
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));

// Cookie parser
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// CORS configuration
// app.use(
//   cors({
//     origin: function (origin, callback) {
//       // Allow requests with no origin (like mobile apps or curl requests)
//       if (!origin) return callback(null, true);

//       const allowedOrigins = [
//         process.env.FRONTEND_URL, // For production frontend
//         process.env.VITE_FRONTEND_URL, // Alternative env var name
//         "http://localhost:3000",
//         "http://localhost:3001",
//         "http://localhost:5173", // Vite default
//         "http://localhost:5174", // Vite alternative port
//         "https://localhost:5173", // HTTPS localhost
//       ].filter(Boolean);

//       // In production, be more strict about origins
//       if (process.env.NODE_ENV === "production") {
//         if (allowedOrigins.includes(origin)) {
//           callback(null, true);
//         } else {
//           console.log(`CORS blocked origin: ${origin}`);
//           callback(new Error("Not allowed by CORS"));
//         }
//       } else {
//         // In development, be more permissive
//         callback(null, true);
//       }
//     },
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
//     exposedHeaders: ["Set-Cookie"], // Important for cookies in production
//   })
// );

// Allow specific origin
// app.use(cors({
//   origin: 'https://invoice.degroop.com',
//     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//     credentials: true,
//   })
// );

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://invoice.degroop.com",
      "https://invoice31.vercel.app/",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS","PATCH"],
    credentials: true,
  })
);

// Global rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    status: "error",
    message: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(globalLimiter);

// Database connection
const db = require("./db");
db()
  .then((res) => {
    logger.info("Database connected successfully", { message: res });
  })
  .catch((error) => {
    logger.error("Database connection failed", { error: error.message });
    process.exit(1);
  });

// Health check endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Billing API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Health check endpoint for detailed status
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    data: {
      service: "Billing Inventory Management API",
      version: "2.0.0",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    },
  });
});

// Import routes
const authRoutes = require("./routes/authRoute");
const categoryRoute = require("./routes/categoryRoute");
const itemRoute = require("./routes/itemRoute");
const invoiceRoute = require("./routes/invoiceRoute");
const customerRoute = require("./routes/customerRoute");
const invoiceModel = require("./models/invoiceModel");

// Mount routes
app.use("/auth", authRoutes);
app.use("/customer", authenticate, customerRoute);
app.use("/category", authenticate, categoryRoute);
app.use("/item", authenticate, itemRoute);
app.use("/invoice", authenticate, invoiceRoute);

// Public invoice view (no authentication required)
app.get("/invoice-view/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid invoice ID format",
      });
    }

    const invoice = await invoiceModel.findById(id);
    if (!invoice) {
      return res.status(404).json({
        status: "error",
        message: "Invoice not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        invoice,
      },
    });
  } catch (error) {
    logger.error("Failed to fetch invoice", {
      error: error.message,
      invoiceId: req.params.id,
      ip: req.ip,
    });

    res.status(500).json({
      status: "error",
      message: "Failed to fetch invoice",
    });
  }
});

// Handle undefined routes
app.all("*", (req, res) => {
  logger.warn("Route not found", {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });

  res.status(404).json({
    status: "error",
    message: `Can't find ${req.originalUrl} on this server!`,
  });
});

// Global error handling middleware
app.use((error, req, res, next) => {
  logger.error("Unhandled error", {
    error: error.message,
    stack: error.stack,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });

  // Handle specific error types
  if (error.name === "ValidationError") {
    return res.status(400).json({
      status: "error",
      message: "Validation Error",
      errors: Object.values(error.errors).map((err) => err.message),
    });
  }

  if (error.name === "CastError") {
    return res.status(400).json({
      status: "error",
      message: "Invalid ID format",
    });
  }

  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return res.status(400).json({
      status: "error",
      message: `${field} already exists`,
    });
  }

  if (error.message === "Not allowed by CORS") {
    return res.status(403).json({
      status: "error",
      message: "CORS error: Origin not allowed",
    });
  }

  // Default error response
  res.status(500).json({
    status: "error",
    message:
      process.env.NODE_ENV === "production"
        ? "Something went wrong!"
        : error.message,
  });
});

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}. Graceful shutdown initiated.`);

  server.close(() => {
    logger.info("HTTP server closed.");

    // Close database connections
    require("mongoose").connection.close(() => {
      logger.info("MongoDB connection closed.");
      process.exit(0);
    });
  });

  // Force close after 10 seconds
  setTimeout(() => {
    logger.error(
      "Could not close connections in time, forcefully shutting down"
    );
    process.exit(1);
  }, 10000);
};

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  logger.info(`Server started successfully`, {
    port: PORT,
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  logger.error("Unhandled Promise Rejection", {
    error: err.message,
    stack: err.stack,
  });

  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception", {
    error: err.message,
    stack: err.stack,
  });

  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

module.exports = app;
