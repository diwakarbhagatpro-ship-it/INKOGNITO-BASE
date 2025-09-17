import { 
  type User, 
  type NewUser, 
  type ScribeRequest, 
  type NewScribeRequest,
  type ScribeSession,
  type NewScribeSession,
  type VolunteerApplication,
  type NewVolunteerApplication,
  type ChatHistory,
  type NewChatHistory,
  type ScribeRequestWithUser,
  type ScribeSessionWithDetails,
  type UserRole,
  type RequestStatus,
  type ApplicationStatus
} from "@shared/schema";
import { randomUUID } from "crypto";

// Storage interface for all InscribeMate operations
export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: NewUser): Promise<User>;
  updateUser(id: string, updates: Partial<NewUser>): Promise<User>;
  getUsersByRole(role: UserRole): Promise<User[]>;
  getAvailableVolunteers(): Promise<User[]>;
  
  // Scribe request management
  getScribeRequest(id: string): Promise<ScribeRequestWithUser | undefined>;
  getScribeRequestsByUser(userId: string): Promise<ScribeRequestWithUser[]>;
  getScribeRequestsByStatus(status: RequestStatus): Promise<ScribeRequestWithUser[]>;
  createScribeRequest(request: NewScribeRequest): Promise<ScribeRequest>;
  updateScribeRequest(id: string, updates: Partial<NewScribeRequest & { status: RequestStatus }>): Promise<ScribeRequest>;
  deleteScribeRequest(id: string): Promise<void>;
  
  // Session management
  getScribeSession(id: string): Promise<ScribeSessionWithDetails | undefined>;
  getSessionsByUser(userId: string): Promise<ScribeSessionWithDetails[]>;
  getSessionsByVolunteer(volunteerId: string): Promise<ScribeSessionWithDetails[]>;
  createScribeSession(session: NewScribeSession): Promise<ScribeSession>;
  updateScribeSession(id: string, updates: Partial<NewScribeSession>): Promise<ScribeSession>;
  
  // Volunteer applications
  getApplicationsForRequest(requestId: string): Promise<(VolunteerApplication & { volunteer: User })[]>;
  getApplicationsByVolunteer(volunteerId: string): Promise<(VolunteerApplication & { request: ScribeRequest })[]>;
  getApplicationByIdForValidation(id: string): Promise<VolunteerApplication | undefined>;
  createVolunteerApplication(application: NewVolunteerApplication): Promise<VolunteerApplication>;
  updateApplicationStatus(id: string, status: ApplicationStatus): Promise<VolunteerApplication>;
  
  // AI Chat history
  getChatHistory(userId: string, limit?: number): Promise<ChatHistory[]>;
  createChatEntry(chat: NewChatHistory): Promise<ChatHistory>;
  
  // Analytics and matching
  getRequestAnalytics(): Promise<{
    totalRequests: number;
    pendingRequests: number;
    completedSessions: number;
    activeVolunteers: number;
  }>;
  
  // Geographic and matching utilities
  findNearbyVolunteers(location: { lat: number; lng: number }, radiusKm: number): Promise<User[]>;
  calculateMatchScore(requestId: string, volunteerId: string): Promise<number>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private scribeRequests: Map<string, ScribeRequest>;
  private scribeSessions: Map<string, ScribeSession>;
  private volunteerApplications: Map<string, VolunteerApplication>;
  private chatHistory: Map<string, ChatHistory>;

  constructor() {
    this.users = new Map();
    this.scribeRequests = new Map();
    this.scribeSessions = new Map();
    this.volunteerApplications = new Map();
    this.chatHistory = new Map();
    
    // Initialize with sample data
    this.initializeSampleData();
  }

  private async initializeSampleData() {
    // Create sample users
    const blindUser: User = {
      id: randomUUID(),
      email: "alex.chen@university.edu",
      name: "Alex Chen",
      role: "blind_user",
      phoneNumber: "+1-555-0123",
      location: { lat: 40.7128, lng: -74.0060, address: "New York University, NY" },
      languages: ["English", "Mandarin"],
      availability: null,
      reliabilityScore: null,
      preferences: { 
        preferredLanguage: "English",
        contrastMode: "high",
        notificationPrefs: { email: true, sms: true }
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const volunteer: User = {
      id: randomUUID(),
      email: "sarah.johnson@volunteer.com",
      name: "Sarah Johnson",
      role: "volunteer",
      phoneNumber: "+1-555-0456",
      location: { lat: 40.7589, lng: -73.9851, address: "Columbia University, NY" },
      languages: ["English", "Spanish"],
      availability: {
        monday: [{ start: "09:00", end: "17:00" }],
        tuesday: [{ start: "09:00", end: "17:00" }],
        wednesday: [{ start: "13:00", end: "21:00" }],
        thursday: [{ start: "09:00", end: "17:00" }],
        friday: [{ start: "09:00", end: "15:00" }],
        weekend: false
      },
      reliabilityScore: "4.8",
      preferences: { specializations: ["Mathematics", "Science", "Computer Science"] },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.set(blindUser.id, blindUser);
    this.users.set(volunteer.id, volunteer);

    // Create sample requests
    const request: ScribeRequest = {
      id: randomUUID(),
      userId: blindUser.id,
      title: "Mathematics Final Exam",
      description: "Need assistance with calculus final exam, multiple choice and problem solving sections",
      examType: "final",
      subject: "Mathematics",
      scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      duration: 180, // 3 hours
      location: { lat: 40.7128, lng: -74.0060, address: "NYU Mathematics Building, Room 201" },
      urgency: "high",
      status: "pending",
      specialRequirements: "Familiar with advanced calculus notation and mathematical symbols",
      estimatedDifficulty: 4,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.scribeRequests.set(request.id, request);
  }

  // User management methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(newUser: NewUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...newUser,
      id,
      phoneNumber: newUser.phoneNumber ?? null,
      location: newUser.location ?? null,
      languages: newUser.languages ?? null,
      availability: newUser.availability ?? null,
      reliabilityScore: newUser.reliabilityScore ?? null,
      preferences: newUser.preferences ?? null,
      isActive: newUser.isActive ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<NewUser>): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");
    
    const updatedUser = { ...user, ...updates, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getUsersByRole(role: UserRole): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.role === role);
  }

  async getAvailableVolunteers(): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      user => user.role === "volunteer" && user.isActive
    );
  }

  // Scribe request methods
  async getScribeRequest(id: string): Promise<ScribeRequestWithUser | undefined> {
    const request = this.scribeRequests.get(id);
    if (!request) return undefined;
    
    const user = await this.getUser(request.userId);
    if (!user) return undefined;

    return { ...request, user };
  }

  async getScribeRequestsByUser(userId: string): Promise<ScribeRequestWithUser[]> {
    const requests = Array.from(this.scribeRequests.values()).filter(
      req => req.userId === userId
    );
    
    const user = await this.getUser(userId);
    if (!user) return [];

    return requests.map(request => ({ ...request, user }));
  }

  async getScribeRequestsByStatus(status: RequestStatus): Promise<ScribeRequestWithUser[]> {
    const requests = Array.from(this.scribeRequests.values()).filter(
      req => req.status === status
    );
    
    const requestsWithUsers: ScribeRequestWithUser[] = [];
    for (const request of requests) {
      const user = await this.getUser(request.userId);
      if (user) {
        requestsWithUsers.push({ ...request, user });
      }
    }
    
    return requestsWithUsers;
  }

  async createScribeRequest(newRequest: NewScribeRequest): Promise<ScribeRequest> {
    const id = randomUUID();
    const request: ScribeRequest = {
      ...newRequest,
      id,
      description: newRequest.description ?? null,
      examType: newRequest.examType ?? null,
      subject: newRequest.subject ?? null,
      urgency: newRequest.urgency ?? null,
      specialRequirements: newRequest.specialRequirements ?? null,
      estimatedDifficulty: newRequest.estimatedDifficulty ?? null,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.scribeRequests.set(id, request);
    return request;
  }

  async updateScribeRequest(id: string, updates: Partial<NewScribeRequest & { status: RequestStatus }>): Promise<ScribeRequest> {
    const request = this.scribeRequests.get(id);
    if (!request) throw new Error("Request not found");
    
    const updatedRequest = { ...request, ...updates, updatedAt: new Date() };
    this.scribeRequests.set(id, updatedRequest);
    return updatedRequest;
  }

  async deleteScribeRequest(id: string): Promise<void> {
    this.scribeRequests.delete(id);
  }

  // Session management (simplified for now)
  async getScribeSession(id: string): Promise<ScribeSessionWithDetails | undefined> {
    const session = this.scribeSessions.get(id);
    if (!session) return undefined;
    
    const request = await this.getScribeRequest(session.requestId);
    const user = await this.getUser(session.userId);
    const volunteer = await this.getUser(session.volunteerId);
    
    if (!request || !user || !volunteer) return undefined;
    
    return { 
      ...session, 
      request, 
      user, 
      volunteer 
    };
  }

  async getSessionsByUser(userId: string): Promise<ScribeSessionWithDetails[]> {
    const sessions = Array.from(this.scribeSessions.values())
      .filter(session => session.userId === userId);
    
    const sessionsWithDetails: ScribeSessionWithDetails[] = [];
    for (const session of sessions) {
      const request = await this.getScribeRequest(session.requestId);
      const user = await this.getUser(session.userId);
      const volunteer = await this.getUser(session.volunteerId);
      
      if (request && user && volunteer) {
        sessionsWithDetails.push({
          ...session,
          request,
          user,
          volunteer
        });
      }
    }
    
    return sessionsWithDetails.sort((a, b) => 
      b.createdAt!.getTime() - a.createdAt!.getTime()
    );
  }

  async getSessionsByVolunteer(volunteerId: string): Promise<ScribeSessionWithDetails[]> {
    const sessions = Array.from(this.scribeSessions.values())
      .filter(session => session.volunteerId === volunteerId);
    
    const sessionsWithDetails: ScribeSessionWithDetails[] = [];
    for (const session of sessions) {
      const request = await this.getScribeRequest(session.requestId);
      const user = await this.getUser(session.userId);
      const volunteer = await this.getUser(session.volunteerId);
      
      if (request && user && volunteer) {
        sessionsWithDetails.push({
          ...session,
          request,
          user,
          volunteer
        });
      }
    }
    
    return sessionsWithDetails.sort((a, b) => 
      b.createdAt!.getTime() - a.createdAt!.getTime()
    );
  }

  async createScribeSession(newSession: NewScribeSession): Promise<ScribeSession> {
    const id = randomUUID();
    const session: ScribeSession = {
      ...newSession,
      id,
      status: newSession.status ?? null,
      startTime: newSession.startTime ?? null,
      endTime: newSession.endTime ?? null,
      actualDuration: newSession.actualDuration ?? null,
      notes: newSession.notes ?? null,
      userRating: newSession.userRating ?? null,
      volunteerRating: newSession.volunteerRating ?? null,
      userFeedback: newSession.userFeedback ?? null,
      volunteerFeedback: newSession.volunteerFeedback ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.scribeSessions.set(id, session);
    return session;
  }

  async updateScribeSession(id: string, updates: Partial<NewScribeSession>): Promise<ScribeSession> {
    const session = this.scribeSessions.get(id);
    if (!session) throw new Error("Session not found");
    
    const updatedSession = { ...session, ...updates, updatedAt: new Date() };
    this.scribeSessions.set(id, updatedSession);
    return updatedSession;
  }

  async getApplicationsForRequest(requestId: string): Promise<(VolunteerApplication & { volunteer: User })[]> {
    const applications = Array.from(this.volunteerApplications.values())
      .filter(app => app.requestId === requestId);
    
    const applicationsWithVolunteers: (VolunteerApplication & { volunteer: User })[] = [];
    for (const application of applications) {
      const volunteer = await this.getUser(application.volunteerId);
      if (volunteer) {
        applicationsWithVolunteers.push({
          ...application,
          volunteer
        });
      }
    }
    
    return applicationsWithVolunteers.sort((a, b) => 
      parseFloat(b.matchScore || '0') - parseFloat(a.matchScore || '0')
    );
  }

  async getApplicationsByVolunteer(volunteerId: string): Promise<(VolunteerApplication & { request: ScribeRequest })[]> {
    const applications = Array.from(this.volunteerApplications.values())
      .filter(app => app.volunteerId === volunteerId);
    
    const applicationsWithRequests: (VolunteerApplication & { request: ScribeRequest })[] = [];
    for (const application of applications) {
      const request = this.scribeRequests.get(application.requestId);
      if (request) {
        applicationsWithRequests.push({
          ...application,
          request
        });
      }
    }
    
    return applicationsWithRequests.sort((a, b) => 
      b.appliedAt!.getTime() - a.appliedAt!.getTime()
    );
  }

  async createVolunteerApplication(application: NewVolunteerApplication): Promise<VolunteerApplication> {
    const id = randomUUID();
    const app: VolunteerApplication = {
      ...application,
      id,
      message: application.message ?? null,
      status: application.status ?? null,
      matchScore: application.matchScore ?? null,
      appliedAt: new Date(),
    };
    this.volunteerApplications.set(id, app);
    return app;
  }

  async getApplicationByIdForValidation(id: string): Promise<VolunteerApplication | undefined> {
    return this.volunteerApplications.get(id);
  }

  async updateApplicationStatus(id: string, status: ApplicationStatus): Promise<VolunteerApplication> {
    const application = this.volunteerApplications.get(id);
    if (!application) throw new Error("Application not found");
    
    const updatedApp = { ...application, status };
    this.volunteerApplications.set(id, updatedApp);
    return updatedApp;
  }

  async getChatHistory(userId: string, limit = 50): Promise<ChatHistory[]> {
    return Array.from(this.chatHistory.values())
      .filter(chat => chat.userId === userId)
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime())
      .slice(0, limit);
  }

  async createChatEntry(newChat: NewChatHistory): Promise<ChatHistory> {
    const id = randomUUID();
    const chat: ChatHistory = {
      ...newChat,
      id,
      sessionId: newChat.sessionId ?? null,
      context: newChat.context ?? null,
      createdAt: new Date(),
    };
    this.chatHistory.set(id, chat);
    return chat;
  }

  async getRequestAnalytics(): Promise<{
    totalRequests: number;
    pendingRequests: number;
    completedSessions: number;
    activeVolunteers: number;
  }> {
    const totalRequests = this.scribeRequests.size;
    const pendingRequests = Array.from(this.scribeRequests.values()).filter(
      req => req.status === "pending"
    ).length;
    const completedSessions = Array.from(this.scribeSessions.values()).filter(
      session => session.status === "completed"
    ).length;
    const activeVolunteers = Array.from(this.users.values()).filter(
      user => user.role === "volunteer" && user.isActive
    ).length;

    return { totalRequests, pendingRequests, completedSessions, activeVolunteers };
  }

  async findNearbyVolunteers(location: { lat: number; lng: number }, radiusKm: number): Promise<User[]> {
    // Simplified distance calculation - in production, use proper geospatial queries
    return Array.from(this.users.values()).filter(user => {
      if (user.role !== "volunteer" || !user.isActive || !user.location) return false;
      
      const userLoc = user.location as { lat: number; lng: number };
      const distance = this.calculateDistance(location, userLoc);
      return distance <= radiusKm;
    });
  }

  async calculateMatchScore(requestId: string, volunteerId: string): Promise<number> {
    // Simplified matching algorithm - in production, use AI/ML scoring
    const request = this.scribeRequests.get(requestId);
    const volunteer = this.users.get(volunteerId);
    
    if (!request || !volunteer) return 0;
    
    let score = 50; // Base score
    
    // Language matching
    if (volunteer.languages?.includes("English")) score += 20;
    
    // Location proximity
    if (request.location && volunteer.location) {
      const distance = this.calculateDistance(
        request.location as { lat: number; lng: number },
        volunteer.location as { lat: number; lng: number }
      );
      if (distance < 10) score += 20;
      else if (distance < 25) score += 10;
    }
    
    // Reliability score
    const reliability = parseFloat(volunteer.reliabilityScore || "3.0");
    score += reliability * 4; // Max 20 points for 5.0 rating
    
    return Math.min(100, score);
  }

  private calculateDistance(loc1: { lat: number; lng: number }, loc2: { lat: number; lng: number }): number {
    const R = 6371; // Earth's radius in km
    const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
    const dLon = (loc2.lng - loc1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}

export const storage = new MemStorage();
