import type { Request, Response, NextFunction } from "express";
import { supabaseServer } from "../lib/supabaseServer";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
        email: string;
      };
    }
  }
}

/**
 * JWT-based authentication middleware for API routes using Supabase
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: "Authentication required",
        details: "Bearer token must be provided in Authorization header"
      });
    }

    // Extract the JWT token
    const token = authHeader.split(' ')[1];
    
    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabaseServer.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ 
        error: "Invalid or expired token",
        details: error?.message || "Authentication failed"
      });
    }

    // Get additional user data from the database
    const { data: userData, error: userDataError } = await supabaseServer
      .from('users')
      .select('id, role, email, is_active')
      .eq('id', user.id)
      .single();
      
    if (userDataError || !userData) {
      return res.status(401).json({
        error: "User not found",
        details: "User exists in auth but not in database"
      });
    }
    
    // Check if user is active
    if (userData.is_active === false) {
      return res.status(403).json({ 
        error: "Account inactive",
        details: "Your account has been deactivated"
      });
    }
    
    // Set user data on request object
    req.user = {
      id: userData.id,
      role: userData.role,
      email: userData.email
    };
    
    // Continue to the next middleware/route handler
    next();
    
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      error: "Authentication error",
      details: "An error occurred during authentication"
    });
  }
}

/**
 * Role-based authorization middleware
 * @param allowedRoles - Array of roles that are allowed to access the route
 */
export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    // First ensure the user is authenticated
    if (!req.user) {
      return res.status(401).json({
        error: "Authentication required",
        details: "You must be logged in to access this resource"
      });
    }

    // Then check if the user has one of the allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Insufficient permissions",
        details: `This action requires one of these roles: ${allowedRoles.join(', ')}`
      });
    }

    // User has an allowed role, proceed
    next();
  };
}