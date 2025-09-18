import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
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
import { supabaseAdmin } from "./supabase";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password, userData } = req.body;
      const { data, error } = await supabaseAdmin.auth.signUp({
        email,
        password,
        options: {
          data: userData,
        },
      });

      if (error) {
        return res.status(400).json({ message: error.message });
      }
      
      if (data.user) {
        // Sign in the user to get a session
        const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          return res.status(400).json({ message: signInError.message });
        }
        
        return res.status(200).json({ session: signInData.session });
      }
      
      res.status(200).json({ message: "Signup successful, please verify your email." });

    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/auth/signin", async (req, res) => {
    try {
      const { email, password } = req.body;
      const { data, error } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return res.status(400).json({ message: error.message });
      }

      res.status(200).json({ session: data.session });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // User Management Routes
  app.get("/api/users/me", async (req, res) => {
    try {
      const queryValidation = getUsersQuerySchema.safeParse(req.query);
      if (!queryValidation.success) {
        return res.status(400).json({ 
          error: "Invalid query parameters", 
          details: queryValidation.error.errors 
        });
      }
      
      // TODO: Get from session/auth
      const userId = queryValidation.data.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const user = await storage.getUser(userId);
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
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid user data", details: error.errors });
      }
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/users/volunteers", async (req, res) => {
    try {
      const volunteers = await storage.getAvailableVolunteers();
      res.json(volunteers);
    } catch (error) {
      console.error("Error getting volunteers:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Scribe Request Routes
  app.get("/api/requests", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      const status = req.query.status as string;
      
      if (userId) {
        const requests = await storage.getScribeRequestsByUser(userId);
        return res.json(requests);
      }
      
      if (status) {
        const requests = await storage.getScribeRequestsByStatus(status as any);
        return res.json(requests);
      }
      
      // Get all pending requests for volunteers to see
      const requests = await storage.getScribeRequestsByStatus("pending");
      res.json(requests);
    } catch (error) {
      console.error("Error getting requests:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/requests/:id", async (req, res) => {
    try {
      const request = await storage.getScribeRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ error: "Request not found" });
      }
      res.json(request);
    } catch (error) {
      console.error("Error getting request:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/requests", async (req, res) => {
    try {
      const requestData = insertScribeRequestSchema.parse(req.body);
      const request = await storage.createScribeRequest(requestData);
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
        const currentRequest = await storage.getScribeRequest(req.params.id);
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
      
      const request = await storage.updateScribeRequest(req.params.id, updateData);
      res.json(request);
    } catch (error) {
      console.error("Error updating request:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/requests/:id", async (req, res) => {
    try {
      await storage.deleteScribeRequest(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting request:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Volunteer Application Routes
  app.get("/api/requests/:id/applications", async (req, res) => {
    try {
      const applications = await storage.getApplicationsForRequest(req.params.id);
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
      const matchScore = await storage.calculateMatchScore(
        req.params.id, 
        applicationData.volunteerId
      );
      
      const application = await storage.createVolunteerApplication({
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
      const currentApplication = await storage.getApplicationByIdForValidation(req.params.id);
      if (!currentApplication) {
        return res.status(404).json({ error: "Application not found" });
      }
      
      if (!isValidApplicationStatusTransition(currentApplication.status as any, bodyValidation.data.status as any)) {
        return res.status(400).json({ 
          error: `Invalid application status transition from ${currentApplication.status} to ${bodyValidation.data.status}` 
        });
      }
      
      const application = await storage.updateApplicationStatus(req.params.id, bodyValidation.data.status);
      
      // If application is accepted, update request status to matched
      if (bodyValidation.data.status === "accepted") {
        const request = await storage.getScribeRequest(application.requestId);
        if (request) {
          await storage.updateScribeRequest(application.requestId, { status: "matched" });
          
          // Create scribe session
          await storage.createScribeSession({
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
        const sessions = await storage.getSessionsByUser(userId);
        return res.json(sessions);
      }
      
      if (volunteerId) {
        const sessions = await storage.getSessionsByVolunteer(volunteerId);
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
      const session = await storage.getScribeSession(req.params.id);
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
        const currentSession = await storage.getScribeSession(req.params.id);
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
      
      const session = await storage.updateScribeSession(req.params.id, updateData);
      res.json(session);
    } catch (error) {
      console.error("Error updating session:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Analytics and Dashboard Routes
  app.get("/api/analytics", async (req, res) => {
    try {
      const analytics = await storage.getRequestAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error getting analytics:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Volunteer Matching Routes
  app.get("/api/requests/:id/matches", async (req, res) => {
    try {
      const request = await storage.getScribeRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ error: "Request not found" });
      }
      
      const radiusKm = parseFloat(req.query.radius as string) || 25;
      const location = request.location as { lat: number; lng: number };
      
      const nearbyVolunteers = await storage.findNearbyVolunteers(location, radiusKm);
      
      // Calculate match scores for each volunteer
      const matchesWithScores = await Promise.all(
        nearbyVolunteers.map(async (volunteer) => {
          const score = await storage.calculateMatchScore(req.params.id, volunteer.id);
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
      
      const history = await storage.getChatHistory(userId, limit);
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
      
      const chatEntry = await storage.createChatEntry({
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
