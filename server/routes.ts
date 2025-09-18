import type { Express } from "express";
import { createServer, type Server } from "http";
import { supabaseStorage } from "./supabaseStorage";
import { 
  insertUserSchema, 
  insertScribeRequestSchema, 
  insertVolunteerApplicationSchema,
  insertChatHistorySchema,
  updateRequestSchema,
  updateSessionSchema,
  updateUserSchema,
  updateApplicationStatusSchema,
  getUsersQuerySchema,
  getRequestsQuerySchema,
  getSessionsQuerySchema,
  getChatHistoryQuerySchema,
  getMatchesQuerySchema,
  chatRequestSchema,
  isValidStatusTransition,
  isValidSessionStatusTransition,
  isValidApplicationStatusTransition,
  type UserRole 
} from "@shared/schema";
import { z } from "zod";
import { requireAuth, requireRole, requireResourceOwnership, optionalAuth } from "./middleware/supabaseAuth";
import { userCache, requestCache, invalidateCache } from "./middleware/cache";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health Check and Monitoring Routes
  app.get("/health", async (req, res) => {
    const { getHealthStatus, getMemoryUsage } = await import('./middleware/performance');
    const health = getHealthStatus();
    const memory = getMemoryUsage();
    
    res.json({
      status: health.healthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: health.uptime,
      memory,
      performance: health
    });
  });

  app.get("/metrics", async (req, res) => {
    const { getPerformanceMetrics } = await import('./middleware/performance');
    const { getCacheStats } = await import('./middleware/cache');
    
    res.json({
      performance: getPerformanceMetrics(),
      cache: getCacheStats(),
      timestamp: new Date().toISOString()
    });
  });

  // User Management Routes
  app.get("/api/users/me", requireAuth, async (req, res) => {
    try {
      const user = await supabaseStorage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error getting user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await supabaseStorage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid user data", details: error.errors });
      }
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/users/volunteers", requireAuth, userCache, async (req, res) => {
    try {
      const volunteers = await supabaseStorage.getAvailableVolunteers();
      res.json(volunteers);
    } catch (error) {
      console.error("Error getting volunteers:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Scribe Request Routes
  app.get("/api/requests", requestCache, async (req, res) => {
    try {
      const userId = req.query.userId as string;
      const status = req.query.status as string;
      
      if (userId) {
        const requests = await supabaseStorage.getScribeRequestsByUser(userId);
        return res.json(requests);
      }
      
      if (status) {
        const requests = await supabaseStorage.getScribeRequestsByStatus(status as any);
        return res.json(requests);
      }
      
      // Get all pending requests for volunteers to see
      const requests = await supabaseStorage.getScribeRequestsByStatus("pending");
      res.json(requests);
    } catch (error) {
      console.error("Error getting requests:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/requests/:id", async (req, res) => {
    try {
      const request = await supabaseStorage.getScribeRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ error: "Request not found" });
      }
      res.json(request);
    } catch (error) {
      console.error("Error getting request:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/requests", invalidateCache, async (req, res) => {
    try {
      const requestData = insertScribeRequestSchema.parse(req.body);
      const request = await supabaseStorage.createScribeRequest(requestData);
      res.status(201).json(request);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      console.error("Error creating request:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/requests/:id", async (req, res) => {
    try {
      const bodyValidation = updateRequestSchema.safeParse(req.body);
      if (!bodyValidation.success) {
        return res.status(400).json({ 
          error: "Invalid request data", 
          details: bodyValidation.error.errors 
        });
      }
      
      // Business logic validation for status transitions
      if (bodyValidation.data.status) {
        const currentRequest = await supabaseStorage.getScribeRequest(req.params.id);
        if (!currentRequest) {
          return res.status(404).json({ error: "Request not found" });
        }
        
        if (!isValidStatusTransition(currentRequest.status as any, bodyValidation.data.status as any)) {
          return res.status(400).json({ 
            error: `Invalid status transition from ${currentRequest.status} to ${bodyValidation.data.status}` 
          });
        }
      }
      
      // Convert string dates to Date objects if present
      const updateData: any = { ...bodyValidation.data };
      if (bodyValidation.data.scheduledDate) {
        updateData.scheduledDate = new Date(bodyValidation.data.scheduledDate);
      }
      
      const request = await supabaseStorage.updateScribeRequest(req.params.id, updateData);
      res.json(request);
    } catch (error) {
      console.error("Error updating request:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/requests/:id", async (req, res) => {
    try {
      await supabaseStorage.deleteScribeRequest(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting request:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Volunteer Application Routes
  app.get("/api/requests/:id/applications", async (req, res) => {
    try {
      const applications = await supabaseStorage.getApplicationsForRequest(req.params.id);
      res.json(applications);
    } catch (error) {
      console.error("Error getting applications:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/requests/:id/apply", async (req, res) => {
    try {
      const applicationData = insertVolunteerApplicationSchema.parse({
        ...req.body,
        requestId: req.params.id,
      });
      
      // Calculate match score
      const matchScore = await supabaseStorage.calculateMatchScore(
        req.params.id, 
        applicationData.volunteerId
      );
      
      const application = await supabaseStorage.createVolunteerApplication({
        ...applicationData,
        matchScore: matchScore.toString(),
      });
      
      res.status(201).json(application);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid application data", details: error.errors });
      }
      console.error("Error creating application:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/applications/:id", async (req, res) => {
    try {
      const bodyValidation = updateApplicationStatusSchema.safeParse(req.body);
      if (!bodyValidation.success) {
        return res.status(400).json({ 
          error: "Invalid application data", 
          details: bodyValidation.error.errors 
        });
      }
      
      if (!bodyValidation.data.status) {
        return res.status(400).json({ error: "Status is required" });
      }
      
      // Business logic validation for application status transitions
      const currentApplication = await supabaseStorage.getApplicationByIdForValidation(req.params.id);
      if (!currentApplication) {
        return res.status(404).json({ error: "Application not found" });
      }
      
      if (!isValidApplicationStatusTransition(currentApplication.status as any, bodyValidation.data.status as any)) {
        return res.status(400).json({ 
          error: `Invalid application status transition from ${currentApplication.status} to ${bodyValidation.data.status}` 
        });
      }
      
      const application = await supabaseStorage.updateApplicationStatus(req.params.id, bodyValidation.data.status);
      
      // If application is accepted, update request status to matched
      if (bodyValidation.data.status === "accepted") {
        const request = await supabaseStorage.getScribeRequest(application.requestId);
        if (request) {
          await supabaseStorage.updateScribeRequest(application.requestId, { status: "matched" });
          
          // Create scribe session
          await supabaseStorage.createScribeSession({
            requestId: application.requestId,
            userId: request.userId,
            volunteerId: application.volunteerId,
            status: "scheduled",
          });
        }
      }
      
      res.json(application);
    } catch (error) {
      console.error("Error updating application:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Session Management Routes
  app.get("/api/sessions", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      const volunteerId = req.query.volunteerId as string;
      
      if (userId) {
        const sessions = await supabaseStorage.getSessionsByUser(userId);
        return res.json(sessions);
      }
      
      if (volunteerId) {
        const sessions = await supabaseStorage.getSessionsByVolunteer(volunteerId);
        return res.json(sessions);
      }
      
      res.status(400).json({ error: "userId or volunteerId required" });
    } catch (error) {
      console.error("Error getting sessions:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/sessions/:id", async (req, res) => {
    try {
      const session = await supabaseStorage.getScribeSession(req.params.id);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      res.json(session);
    } catch (error) {
      console.error("Error getting session:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/sessions/:id", async (req, res) => {
    try {
      const bodyValidation = updateSessionSchema.safeParse(req.body);
      if (!bodyValidation.success) {
        return res.status(400).json({ 
          error: "Invalid session data", 
          details: bodyValidation.error.errors 
        });
      }
      
      // Business logic validation for session status transitions
      if (bodyValidation.data.status) {
        const currentSession = await supabaseStorage.getScribeSession(req.params.id);
        if (!currentSession) {
          return res.status(404).json({ error: "Session not found" });
        }
        
        if (!isValidSessionStatusTransition(currentSession.status as any, bodyValidation.data.status as any)) {
          return res.status(400).json({ 
            error: `Invalid session status transition from ${currentSession.status} to ${bodyValidation.data.status}` 
          });
        }
      }
      
      // Convert string dates to Date objects if present
      const updateData: any = { ...bodyValidation.data };
      if (bodyValidation.data.startTime) {
        updateData.startTime = new Date(bodyValidation.data.startTime);
      }
      if (bodyValidation.data.endTime) {
        updateData.endTime = new Date(bodyValidation.data.endTime);
      }
      
      const session = await supabaseStorage.updateScribeSession(req.params.id, updateData);
      res.json(session);
    } catch (error) {
      console.error("Error updating session:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Analytics and Dashboard Routes
  app.get("/api/analytics", async (req, res) => {
    try {
      const analytics = await supabaseStorage.getRequestAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error getting analytics:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Volunteer Matching Routes
  app.get("/api/requests/:id/matches", async (req, res) => {
    try {
      const request = await supabaseStorage.getScribeRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ error: "Request not found" });
      }
      
      const radiusKm = parseFloat(req.query.radius as string) || 25;
      const location = request.location as { lat: number; lng: number };
      
      const nearbyVolunteers = await supabaseStorage.findNearbyVolunteers(location, radiusKm);
      
      // Calculate match scores for each volunteer
      const matchesWithScores = await Promise.all(
        nearbyVolunteers.map(async (volunteer) => {
          const score = await supabaseStorage.calculateMatchScore(req.params.id, volunteer.id);
          return {
            volunteer,
            matchScore: score,
          };
        })
      );
      
      // Sort by match score descending
      matchesWithScores.sort((a, b) => b.matchScore - a.matchScore);
      
      res.json(matchesWithScores);
    } catch (error) {
      console.error("Error finding matches:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // INSEE AI Chat Routes
  app.get("/api/chat/history", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      const limit = parseInt(req.query.limit as string) || 50;
      
      if (!userId) {
        return res.status(400).json({ error: "userId required" });
      }
      
      const history = await supabaseStorage.getChatHistory(userId, limit);
      res.json(history);
    } catch (error) {
      console.error("Error getting chat history:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const { userId, message, sessionId, context } = req.body;
      
      if (!userId || !message) {
        return res.status(400).json({ error: "userId and message required" });
      }
      
      // TODO: Integrate with Gemini AI for actual response generation
      const response = `Thank you for your question: "${message}". This is a placeholder response. INSEE AI will provide contextual assistance for accessibility needs and scribe session support.`;
      
      const chatEntry = await supabaseStorage.createChatEntry({
        userId,
        message,
        response,
        sessionId: sessionId || null,
        context: context || null,
      });
      
      res.json(chatEntry);
    } catch (error) {
      console.error("Error processing chat:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Authentication Routes
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password, userData } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      // Create user in Supabase Auth
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.VITE_SUPABASE_URL || 
                         process.env.SUPABASE_URL || 
                         process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                         process.env.SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        return res.status(500).json({ error: "Server configuration error" });
      }
      
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        user_metadata: userData || {}
      });

      if (authError) {
        console.error("Auth signup error:", authError);
        return res.status(400).json({ error: authError.message });
      }

      if (!authData.user) {
        return res.status(400).json({ error: "Failed to create user" });
      }

      // Create user profile in our database
      const userProfile = {
        id: authData.user.id,
        email: authData.user.email!,
        name: userData?.name || authData.user.email!,
        role: userData?.role || 'blind_user',
        phone_number: userData?.phoneNumber,
        location: userData?.location,
        languages: userData?.languages || [],
        preferences: userData?.preferences || {
          ttsEnabled: true,
          highContrast: false,
          fontSize: 'medium',
        }
      };

      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .insert(userProfile)
        .select()
        .single();

      if (profileError) {
        console.error("Profile creation error:", profileError);
        // Don't fail the signup if profile creation fails
      }

      res.status(201).json({
        user: authData.user,
        profile: profileData,
        message: "User created successfully"
      });

    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/auth/signin", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      // Sign in with Supabase Auth
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.VITE_SUPABASE_URL || 
                         process.env.SUPABASE_URL || 
                         process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                         process.env.SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        return res.status(500).json({ error: "Server configuration error" });
      }
      
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: authData, error: authError } = await supabase.auth.admin.signInWithPassword({
        email,
        password
      });

      if (authError) {
        console.error("Auth signin error:", authError);
        return res.status(401).json({ error: authError.message });
      }

      if (!authData.user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Get user profile
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError && profileError.code === 'PGRST116') {
        // User doesn't exist in our database, create them
        const { error: createError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: authData.user.email,
            name: authData.user.user_metadata?.name || authData.user.email,
            role: authData.user.user_metadata?.role || 'blind_user',
            preferences: {
              ttsEnabled: true,
              highContrast: false,
              fontSize: 'medium',
            }
          });
        
        if (createError) {
          console.error("Error creating user profile:", createError);
        }
      }

      res.json({
        user: authData.user,
        session: authData.session,
        profile: profileData,
        message: "Sign in successful"
      });

    } catch (error) {
      console.error("Signin error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/auth/signout", async (req, res) => {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.VITE_SUPABASE_URL || 
                         process.env.SUPABASE_URL || 
                         process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                         process.env.SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        return res.status(500).json({ error: "Server configuration error" });
      }
      
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { error } = await supabase.auth.admin.signOut();
      
      if (error) {
        console.error("Signout error:", error);
        return res.status(400).json({ error: error.message });
      }

      res.json({ message: "Sign out successful" });

    } catch (error) {
      console.error("Signout error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Health check route
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      service: "InscribeMate API"
    });
  });

  const httpServer = createServer(app);

  return httpServer;
}
