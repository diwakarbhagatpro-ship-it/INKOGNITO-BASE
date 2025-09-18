import type { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { z } from "zod";

// User type is already declared in supabaseAuth.ts

// Basic session validation schema
const sessionValidationSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['blind_user', 'volunteer', 'admin']).optional(),
});

/**
 * Simple authentication middleware for API routes
 * In production, this should be replaced with proper session/JWT authentication
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    // Check for userId in query parameters or headers
    const userId = req.query.userId as string || req.headers['x-user-id'] as string;
    
    if (!userId) {
      return res.status(401).json({ 
        error: "Authentication required",
        details: "userId must be provided in query parameters or x-user-id header"
      });
    }

    // Validate userId format
    const validation = sessionValidationSchema.safeParse({ userId });
    if (!validation.success) {
      return res.status(401).json({ 
        error: "Invalid authentication format",
        details: validation.error.errors
      });
    }

    // Check if user exists and is active
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    if (user.isActive === false) {
      return res.status(401).json({ error: "User account is inactive" });
    }

    // Attach user to request
    req.user = {
      id: user.id,
      role: user.role,
      email: user.email,
    };

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({ error: "Internal authentication error" });
  }
}

/**
 * Role-based authorization middleware
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: "Insufficient permissions",
        details: `Required roles: ${allowedRoles.join(', ')}, your role: ${req.user.role}`
      });
    }

    next();
  };
}

/**
 * Resource ownership validation middleware
 * Ensures users can only access their own resources
 */
export function requireResourceOwnership(req: Request, res: Response, next: NextFunction) {
  const userId = req.params.userId || req.query.userId as string;
  
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  // Admin can access any resource
  if (req.user.role === 'admin') {
    return next();
  }

  // Users can only access their own resources
  if (userId && userId !== req.user.id) {
    return res.status(403).json({ 
      error: "Access denied",
      details: "You can only access your own resources"
    });
  }

  next();
}

/**
 * Optional authentication middleware - doesn't fail if no auth provided
 */
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.query.userId as string || req.headers['x-user-id'] as string;
    
    if (userId) {
      const user = await storage.getUser(userId);
      if (user && user.isActive !== false) {
        req.user = {
          id: user.id,
          role: user.role,
          email: user.email,
        };
      }
    }
    
    next();
  } catch (error) {
    console.error("Optional authentication error:", error);
    // Don't fail on optional auth errors
    next();
  }
}