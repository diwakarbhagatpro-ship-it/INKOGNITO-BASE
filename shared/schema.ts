import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table - supports blind users, volunteers, and admins
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull(), // 'blind_user', 'volunteer', 'admin'
  phoneNumber: varchar("phone_number", { length: 20 }),
  location: jsonb("location"), // { lat: number, lng: number, address: string }
  languages: text("languages").array().default(sql`ARRAY[]::text[]`), // Supported languages for volunteers
  availability: jsonb("availability"), // Volunteer availability schedule
  reliabilityScore: decimal("reliability_score", { precision: 3, scale: 2 }).default("5.00"), // For volunteers
  preferences: jsonb("preferences"), // User preferences and accessibility settings
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Scribe requests table
export const scribeRequests = pgTable("scribe_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  examType: varchar("exam_type", { length: 100 }), // 'final', 'midterm', 'quiz', 'assignment', etc.
  subject: varchar("subject", { length: 100 }),
  scheduledDate: timestamp("scheduled_date").notNull(),
  duration: integer("duration").notNull(), // Duration in minutes
  location: jsonb("location").notNull(), // { lat: number, lng: number, address: string }
  urgency: varchar("urgency", { length: 20 }).default("normal"), // 'low', 'normal', 'high', 'critical'
  status: varchar("status", { length: 20 }).default("pending"), // 'pending', 'matched', 'in_progress', 'completed', 'cancelled'
  specialRequirements: text("special_requirements"),
  estimatedDifficulty: integer("estimated_difficulty").default(3), // 1-5 scale
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Scribe sessions table - tracks actual sessions between users and volunteers
export const scribeSessions = pgTable("scribe_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requestId: varchar("request_id").notNull().references(() => scribeRequests.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  volunteerId: varchar("volunteer_id").notNull().references(() => users.id),
  status: varchar("status", { length: 20 }).default("scheduled"), // 'scheduled', 'active', 'completed', 'cancelled'
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  actualDuration: integer("actual_duration"), // Actual duration in minutes
  notes: text("notes"),
  userRating: integer("user_rating"), // 1-5 rating from user
  volunteerRating: integer("volunteer_rating"), // 1-5 rating from volunteer
  userFeedback: text("user_feedback"),
  volunteerFeedback: text("volunteer_feedback"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Volunteer applications - tracks who applied for which requests
export const volunteerApplications = pgTable("volunteer_applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requestId: varchar("request_id").notNull().references(() => scribeRequests.id),
  volunteerId: varchar("volunteer_id").notNull().references(() => users.id),
  message: text("message"),
  status: varchar("status", { length: 20 }).default("pending"), // 'pending', 'accepted', 'rejected'
  matchScore: decimal("match_score", { precision: 5, scale: 2 }), // AI-calculated match score
  appliedAt: timestamp("applied_at").defaultNow(),
});

// AI Chat History for INSEE assistant
export const chatHistory = pgTable("chat_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  sessionId: varchar("session_id"), // Optional: links to scribe session
  message: text("message").notNull(),
  response: text("response").notNull(),
  context: jsonb("context"), // Additional context for the conversation
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas for forms
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertScribeRequestSchema = createInsertSchema(scribeRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true, // Status is managed by the system
});

export const insertScribeSessionSchema = createInsertSchema(scribeSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVolunteerApplicationSchema = createInsertSchema(volunteerApplications).omit({
  id: true,
  appliedAt: true,
});

export const insertChatHistorySchema = createInsertSchema(chatHistory).omit({
  id: true,
  createdAt: true,
});

// Type definitions
export type User = typeof users.$inferSelect;
export type NewUser = z.infer<typeof insertUserSchema>;

export type ScribeRequest = typeof scribeRequests.$inferSelect;
export type NewScribeRequest = z.infer<typeof insertScribeRequestSchema>;

export type ScribeSession = typeof scribeSessions.$inferSelect;
export type NewScribeSession = z.infer<typeof insertScribeSessionSchema>;

export type VolunteerApplication = typeof volunteerApplications.$inferSelect;
export type NewVolunteerApplication = z.infer<typeof insertVolunteerApplicationSchema>;

export type ChatHistory = typeof chatHistory.$inferSelect;
export type NewChatHistory = z.infer<typeof insertChatHistorySchema>;

// Extended types with relations
export type ScribeRequestWithUser = ScribeRequest & {
  user: User;
  applications?: (VolunteerApplication & { volunteer: User })[];
  session?: ScribeSession & { volunteer: User };
};

export type ScribeSessionWithDetails = ScribeSession & {
  request: ScribeRequest;
  user: User;
  volunteer: User;
};

export type UserRole = 'blind_user' | 'volunteer' | 'admin';
export type RequestStatus = 'pending' | 'matched' | 'in_progress' | 'completed' | 'cancelled';
export type SessionStatus = 'scheduled' | 'active' | 'completed' | 'cancelled';
export type ApplicationStatus = 'pending' | 'accepted' | 'rejected';
export type UrgencyLevel = 'low' | 'normal' | 'high' | 'critical';
