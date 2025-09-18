import type { Request, Response, NextFunction } from "express";
import { createClient } from '@supabase/supabase-js';
import { z } from "zod";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
        email: string;
        user_metadata?: any;
      };
    }
  }
}

// Initialize Supabase client for auth verification
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables for authentication');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// JWT validation schema
const jwtValidationSchema = z.object({
  sub: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(['blind_user', 'volunteer', 'admin']).optional(),
  user_metadata: z.object({
    role: z.enum(['blind_user', 'volunteer', 'admin']).optional(),
    name: z.string().optional(),
  }).optional(),
});

/**
 * Authentication middleware using Supabase JWT
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: "Authentication required",
        details: "Bearer token must be provided in Authorization header"
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ 
        error: "Invalid token",
        details: error?.message || "Token verification failed"
      });
    }

    // Validate user data structure
    const validation = jwtValidationSchema.safeParse(user);
    if (!validation.success) {
      return res.status(401).json({ 
        error: "Invalid user data",
        details: validation.error.errors
      });
    }

    // Attach user to request
    req.user = {
      id: user.id,
      role: user.user_metadata?.role || 'blind_user',
      email: user.email || '',
      user_metadata: user.user_metadata,
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
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (!error && user) {
        req.user = {
          id: user.id,
          role: user.user_metadata?.role || 'blind_user',
          email: user.email || '',
          user_metadata: user.user_metadata,
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

/**
 * Middleware to extract user from Supabase session (for frontend requests)
 */
export async function extractUserFromSession(req: Request, res: Response, next: NextFunction) {
  try {
    // Check for session cookie or Authorization header
    const authHeader = req.headers.authorization;
    const sessionCookie = req.cookies?.['sb-access-token'];
    
    let token = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (sessionCookie) {
      token = sessionCookie;
    }
    
    if (token) {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (!error && user) {
        req.user = {
          id: user.id,
          role: user.user_metadata?.role || 'blind_user',
          email: user.email || '',
          user_metadata: user.user_metadata,
        };
      }
    }
    
    next();
  } catch (error) {
    console.error("Session extraction error:", error);
    next();
  }
}