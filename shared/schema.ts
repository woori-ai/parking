import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Employee table schema
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  carNumber: text("car_number").notNull(),
  position: text("position").notNull(),
  isAdmin: boolean("is_admin").default(false),
});

// Registration requests table schema
export const registrationRequests = pgTable("registration_requests", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  carNumber: text("car_number").notNull(),
  position: text("position").notNull(),
  requestDate: timestamp("request_date").defaultNow(),
});

// Admin table schema
export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  phone: text("phone").notNull(),
});

// Manager work records table schema
export const managerWorks = pgTable("manager_works", {
  id: serial("id").primaryKey(),
  employeeId: text("employee_id").notNull(),
  password: text("password").notNull(),  // 추가된 비밀번호 필드
  phone: text("phone").notNull(),        // 추가된 전화번호 필드
  isWorking: boolean("is_working").default(false),
  workCheck: boolean("work_check").default(false),  // 추가된 출퇴근 체크 필드
  workDate: text("work_date").notNull(),
  workTime: text("work_time").notNull(),
});

// Board table schema
export const boards = pgTable("boards", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  ownerId: integer("owner_id").notNull(),
  ownerType: text("owner_type").notNull(),
  isManagerBoard: boolean("is_manager_board").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Board posts table schema
export const boardPosts = pgTable("board_posts", {
  id: serial("id").primaryKey(),
  boardId: integer("board_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  authorId: integer("author_id").notNull(),
  authorType: text("author_type").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Parking records table schema
export const parkingRecords = pgTable("parking_records", {
  id: serial("id").primaryKey(),
  carNumber: text("car_number").notNull(),
  inDate: text("in_date"),
  inTime: text("in_time"),
  outDate: text("out_date"),
  outTime: text("out_time"),
  entryTimestamp: timestamp("entry_timestamp"),
  exitTimestamp: timestamp("exit_timestamp"),
});

// Visitor reservations table schema
export const visitorReservations = pgTable("visitor_reservations", {
  id: serial("id").primaryKey(),
  visitorName: text("visitor_name").default(""),
  carNumber: text("car_number").notNull(),
  visitDate: text("visit_date").notNull(),
  visitPurpose: text("visit_purpose").notNull(),
  contactNumber: text("contact_number").default(""),
  inDate: text("in_date"),
  inTime: text("in_time"),
  outDate: text("out_date"),
  outTime: text("out_time"),
  registeredById: integer("registered_by_id").notNull(),
});

// Chat messages table schema
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull(),
  receiverId: integer("receiver_id").notNull(),
  message: text("message").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  isRead: boolean("is_read").default(false),
});

// Job help entries table schema
export const jobHelp = pgTable("job_help", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});



// Zod schemas for inserts and validation
export const insertEmployeeSchema = createInsertSchema(employees).omit({ id: true });
export const insertRegistrationRequestSchema = createInsertSchema(registrationRequests).omit({ id: true, requestDate: true });
export const insertAdminSchema = createInsertSchema(admins).omit({ id: true });
export const insertManagerWorkSchema = createInsertSchema(managerWorks).omit({ id: true });
export const insertParkingRecordSchema = createInsertSchema(parkingRecords).omit({ id: true, entryTimestamp: true, exitTimestamp: true });
export const insertVisitorReservationSchema = createInsertSchema(visitorReservations)
  .omit({ id: true })
  .extend({
    visitorName: z.string().optional(),
    contactNumber: z.string().optional(),
  });
export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({ id: true, timestamp: true, isRead: true });
export const insertJobHelpSchema = createInsertSchema(jobHelp).omit({ id: true, createdAt: true, updatedAt: true });
export const insertBoardSchema = createInsertSchema(boards).omit({ id: true, createdAt: true, updatedAt: true });
export const insertBoardPostSchema = createInsertSchema(boardPosts).omit({ id: true, createdAt: true, updatedAt: true });

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const vehicleSearchSchema = z.object({
  carNumber: z.string().min(4, "At least 4 digits required"),
});

// Types
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;

export type RegistrationRequest = typeof registrationRequests.$inferSelect;
export type InsertRegistrationRequest = z.infer<typeof insertRegistrationRequestSchema>;

export type Admin = typeof admins.$inferSelect;
export type InsertAdmin = z.infer<typeof insertAdminSchema>;

export type ManagerWork = typeof managerWorks.$inferSelect;
export type InsertManagerWork = z.infer<typeof insertManagerWorkSchema>;

export type ParkingRecord = typeof parkingRecords.$inferSelect;
export type InsertParkingRecord = z.infer<typeof insertParkingRecordSchema>;

export type VisitorReservation = typeof visitorReservations.$inferSelect;
export type InsertVisitorReservation = z.infer<typeof insertVisitorReservationSchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

export type JobHelp = typeof jobHelp.$inferSelect;
export type InsertJobHelp = z.infer<typeof insertJobHelpSchema>;

export type Board = typeof boards.$inferSelect;
export type InsertBoard = z.infer<typeof insertBoardSchema>;

export type BoardPost = typeof boardPosts.$inferSelect;
export type InsertBoardPost = z.infer<typeof insertBoardPostSchema>;

export type Login = z.infer<typeof loginSchema>;
export type VehicleSearch = z.infer<typeof vehicleSearchSchema>;

export type VehicleType = "employee" | "visitor";
export type VehicleStatus = "parked" | "not_parked";


