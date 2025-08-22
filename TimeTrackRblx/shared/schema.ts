import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const staffMembers = pgTable("staff_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  username: text("username").notNull(),
  rank: integer("rank").notNull(),
  rankName: text("rank_name").notNull(),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const timeEntries = pgTable("time_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  staffId: varchar("staff_id").notNull().references(() => staffMembers.id),
  sessionStart: timestamp("session_start").notNull(),
  sessionEnd: timestamp("session_end"),
  duration: real("duration").default(0), // in hours
  action: text("action").notNull(), // "join", "leave", "update"
  createdAt: timestamp("created_at").defaultNow(),
});

export const quotaSettings = pgTable("quota_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  weeklyRequirement: real("weekly_requirement").notNull().default(1.0), // hours
  weekStart: integer("week_start").notNull().default(1), // 1 = Monday
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const quotaStatus = pgTable("quota_status", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  staffId: varchar("staff_id").notNull().references(() => staffMembers.id),
  weekStart: timestamp("week_start").notNull(),
  weekEnd: timestamp("week_end").notNull(),
  totalHours: real("total_hours").notNull().default(0),
  quotaMet: boolean("quota_met").notNull().default(false),
});

export const quotaStrikes = pgTable("quota_strikes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  staffId: varchar("staff_id").notNull().references(() => staffMembers.id),
  weekStart: timestamp("week_start").notNull(),
  weekEnd: timestamp("week_end").notNull(),
  reason: text("reason").notNull().default("Failed to meet weekly quota"),
  givenBy: text("given_by"), // Admin who gave the strike
  givenAt: timestamp("given_at").defaultNow(),
  active: boolean("active").notNull().default(true),
});

// Insert schemas
export const insertStaffMemberSchema = createInsertSchema(staffMembers).pick({
  userId: true,
  username: true,
  rank: true,
  rankName: true,
});

export const insertTimeEntrySchema = createInsertSchema(timeEntries).pick({
  staffId: true,
  sessionStart: true,
  sessionEnd: true,
  duration: true,
  action: true,
});

export const insertQuotaSettingsSchema = createInsertSchema(quotaSettings).pick({
  weeklyRequirement: true,
  weekStart: true,
});

export const insertQuotaStrikeSchema = createInsertSchema(quotaStrikes).pick({
  staffId: true,
  weekStart: true,
  weekEnd: true,
  reason: true,
  givenBy: true,
});

// Types
export type InsertStaffMember = z.infer<typeof insertStaffMemberSchema>;
export type StaffMember = typeof staffMembers.$inferSelect;
export type InsertTimeEntry = z.infer<typeof insertTimeEntrySchema>;
export type TimeEntry = typeof timeEntries.$inferSelect;
export type InsertQuotaSettings = z.infer<typeof insertQuotaSettingsSchema>;
export type QuotaSettings = typeof quotaSettings.$inferSelect;
export type QuotaStatus = typeof quotaStatus.$inferSelect;
export type InsertQuotaStrike = z.infer<typeof insertQuotaStrikeSchema>;
export type QuotaStrike = typeof quotaStrikes.$inferSelect;

// Extended types for frontend
export interface StaffWithStats extends StaffMember {
  dailyHours: number;
  weeklyHours: number;
  allTimeHours: number;
  quotaMet: boolean;
  lastActive: Date | null;
  quotaStrikes: number;
  avatarUrl?: string;
}

export interface DashboardStats {
  totalStaff: number;
  quotaMet: number;
  avgWeeklyHours: number;
  activeToday: number;
}

export interface LeaderboardEntry extends StaffMember {
  totalHours: number;
  weeklyChange: number;
  position: number;
}

export interface WeeklyActivity {
  date: string;
  totalHours: number;
}
