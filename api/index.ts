import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "../server/routes";
import { errorHandler, notFoundHandler } from "../server/middleware/errorHandler";
import { generalRateLimit } from "../server/middleware/rateLimiter";
import { performanceMiddleware } from "../server/middleware/performance";
import cors from "cors";
import helmet from "helmet";

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://*.supabase.co"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration for Vercel
app.use(cors({
  origin: [
    "https://inscribemate.vercel.app",
    "https://inscribemate-git-main.vercel.app",
    "https://inscribemate-git-develop.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:8080",
    "http://localhost:4000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8080",
    "http://127.0.0.1:4000",
    "http://0.0.0.0:5173",
    "http://0.0.0.0:3000",
    process.env.CORS_ORIGIN || "https://inscribemate.vercel.app"
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'apikey'],
  optionsSuccessStatus: 200
}));

// Rate limiting
app.use(generalRateLimit);

// Performance monitoring
app.use(performanceMiddleware);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      console.log(logLine);
    }
  });

  next();
});

// Register routes
registerRoutes(app).catch(console.error);

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

export default app;