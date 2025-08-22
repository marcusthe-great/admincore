import { 
  StaffMember, 
  InsertStaffMember, 
  TimeEntry,
  InsertTimeEntry,
  QuotaSettings,
  InsertQuotaSettings,
  QuotaStatus,
  QuotaStrike,
  InsertQuotaStrike,
  StaffWithStats,
  DashboardStats,
  LeaderboardEntry,
  WeeklyActivity
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Staff Members
  getStaffMember(id: string): Promise<StaffMember | undefined>;
  getStaffMemberByUserId(userId: string): Promise<StaffMember | undefined>;
  getAllStaffMembers(): Promise<StaffMember[]>;
  createStaffMember(member: InsertStaffMember): Promise<StaffMember>;
  updateStaffMember(id: string, updates: Partial<StaffMember>): Promise<StaffMember | undefined>;
  deleteStaffMember(id: string): Promise<boolean>;

  // Time Entries
  getTimeEntry(id: string): Promise<TimeEntry | undefined>;
  getTimeEntriesForStaff(staffId: string): Promise<TimeEntry[]>;
  createTimeEntry(entry: InsertTimeEntry): Promise<TimeEntry>;
  updateTimeEntry(id: string, updates: Partial<TimeEntry>): Promise<TimeEntry | undefined>;

  // Quota Management
  getQuotaSettings(): Promise<QuotaSettings>;
  updateQuotaSettings(settings: InsertQuotaSettings): Promise<QuotaSettings>;
  getQuotaStatus(staffId: string, weekStart: Date): Promise<QuotaStatus | undefined>;
  updateQuotaStatus(staffId: string, weekStart: Date, hours: number): Promise<QuotaStatus>;

  // Quota Strikes
  getQuotaStrikes(staffId: string): Promise<QuotaStrike[]>;
  createQuotaStrike(strike: InsertQuotaStrike): Promise<QuotaStrike>;
  deleteQuotaStrike(id: string): Promise<boolean>;
  getActiveStrikeCount(staffId: string): Promise<number>;
  
  // Dashboard Data
  getDashboardStats(): Promise<DashboardStats>;
  getStaffWithStats(): Promise<StaffWithStats[]>;
  getLeaderboard(period: 'daily' | 'weekly' | 'monthly' | 'alltime'): Promise<LeaderboardEntry[]>;
  getWeeklyActivity(): Promise<WeeklyActivity[]>;
  getQuotaCompletion(): Promise<{ completed: StaffWithStats[], incomplete: StaffWithStats[] }>;
}

export class MemStorage implements IStorage {
  private staffMembers: Map<string, StaffMember> = new Map();
  private timeEntries: Map<string, TimeEntry> = new Map();
  private quotaSettings: QuotaSettings;
  private quotaStatus: Map<string, QuotaStatus> = new Map();
  private quotaStrikes: Map<string, QuotaStrike> = new Map();

  constructor() {
    // Initialize default quota settings
    this.quotaSettings = {
      id: randomUUID(),
      weeklyRequirement: 1.0,
      weekStart: 1, // Monday
      updatedAt: new Date(),
    };
  }

  // Staff Members
  async getStaffMember(id: string): Promise<StaffMember | undefined> {
    return this.staffMembers.get(id);
  }

  async getStaffMemberByUserId(userId: string): Promise<StaffMember | undefined> {
    return Array.from(this.staffMembers.values()).find(member => member.userId === userId);
  }

  async getAllStaffMembers(): Promise<StaffMember[]> {
    return Array.from(this.staffMembers.values());
  }

  async createStaffMember(member: InsertStaffMember): Promise<StaffMember> {
    const id = randomUUID();
    const newMember: StaffMember = {
      ...member,
      id,
      joinedAt: new Date(),
    };
    this.staffMembers.set(id, newMember);
    return newMember;
  }

  async updateStaffMember(id: string, updates: Partial<StaffMember>): Promise<StaffMember | undefined> {
    const existing = this.staffMembers.get(id);
    if (!existing) return undefined;

    const updated = { ...existing, ...updates };
    this.staffMembers.set(id, updated);
    return updated;
  }

  async deleteStaffMember(id: string): Promise<boolean> {
    return this.staffMembers.delete(id);
  }

  // Time Entries
  async getTimeEntry(id: string): Promise<TimeEntry | undefined> {
    return this.timeEntries.get(id);
  }

  async getTimeEntriesForStaff(staffId: string): Promise<TimeEntry[]> {
    return Array.from(this.timeEntries.values()).filter(entry => entry.staffId === staffId);
  }

  async createTimeEntry(entry: InsertTimeEntry): Promise<TimeEntry> {
    const id = randomUUID();
    const newEntry: TimeEntry = {
      ...entry,
      id,
      duration: entry.duration || 0,
      sessionEnd: entry.sessionEnd || null,
      createdAt: new Date(),
    };
    this.timeEntries.set(id, newEntry);
    return newEntry;
  }

  async updateTimeEntry(id: string, updates: Partial<TimeEntry>): Promise<TimeEntry | undefined> {
    const existing = this.timeEntries.get(id);
    if (!existing) return undefined;

    const updated = { ...existing, ...updates };
    this.timeEntries.set(id, updated);
    return updated;
  }

  // Quota Management
  async getQuotaSettings(): Promise<QuotaSettings> {
    return this.quotaSettings;
  }

  async updateQuotaSettings(settings: InsertQuotaSettings): Promise<QuotaSettings> {
    this.quotaSettings = {
      ...this.quotaSettings,
      ...settings,
      updatedAt: new Date(),
    };
    return this.quotaSettings;
  }

  async getQuotaStatus(staffId: string, weekStart: Date): Promise<QuotaStatus | undefined> {
    const key = `${staffId}-${weekStart.getTime()}`;
    return this.quotaStatus.get(key);
  }

  async updateQuotaStatus(staffId: string, weekStart: Date, hours: number): Promise<QuotaStatus> {
    const key = `${staffId}-${weekStart.getTime()}`;
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const status: QuotaStatus = {
      id: randomUUID(),
      staffId,
      weekStart,
      weekEnd,
      totalHours: hours,
      quotaMet: hours >= this.quotaSettings.weeklyRequirement,
    };
    
    this.quotaStatus.set(key, status);
    return status;
  }

  // Helper methods for calculations
  private getStartOfWeek(date: Date): Date {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Monday = 1
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  private getStartOfDay(date: Date): Date {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  private calculateHours(staffId: string, startDate: Date, endDate?: Date): number {
    const entries = Array.from(this.timeEntries.values())
      .filter(entry => entry.staffId === staffId);
    
    let totalHours = 0;
    
    for (const entry of entries) {
      if (entry.sessionStart >= startDate && (!endDate || entry.sessionStart <= endDate)) {
        totalHours += entry.duration || 0;
      }
    }
    
    return Math.round(totalHours * 100) / 100; // Round to 2 decimal places
  }

  // Dashboard Data
  async getDashboardStats(): Promise<DashboardStats> {
    const staff = await this.getAllStaffMembers();
    const today = this.getStartOfDay(new Date());
    const weekStart = this.getStartOfWeek(new Date());
    
    let quotaMet = 0;
    let totalWeeklyHours = 0;
    let activeToday = 0;

    for (const member of staff) {
      const weeklyHours = this.calculateHours(member.id, weekStart);
      const dailyHours = this.calculateHours(member.id, today);
      
      totalWeeklyHours += weeklyHours;
      
      if (weeklyHours >= this.quotaSettings.weeklyRequirement) {
        quotaMet++;
      }
      
      if (dailyHours > 0) {
        activeToday++;
      }
    }

    const avgWeeklyHours = staff.length > 0 ? totalWeeklyHours / staff.length : 0;

    return {
      totalStaff: staff.length,
      quotaMet,
      avgWeeklyHours: Math.round(avgWeeklyHours * 100) / 100,
      activeToday,
    };
  }

  async getStaffWithStats(): Promise<StaffWithStats[]> {
    const staff = await this.getAllStaffMembers();
    const today = this.getStartOfDay(new Date());
    const weekStart = this.getStartOfWeek(new Date());
    
    return staff.map(member => {
      const dailyHours = this.calculateHours(member.id, today);
      const weeklyHours = this.calculateHours(member.id, weekStart);
      const allTimeHours = this.calculateHours(member.id, new Date(0));
      
      // Get last active session
      const entries = Array.from(this.timeEntries.values())
        .filter(entry => entry.staffId === member.id)
        .sort((a, b) => b.sessionStart.getTime() - a.sessionStart.getTime());
      
      const lastActive = entries.length > 0 ? entries[0].sessionStart : null;

      // Get quota strikes count - Note: synchronous version for now
      const quotaStrikes = Array.from(this.quotaStrikes.values())
        .filter(strike => strike.staffId === member.id && strike.active).length;

      return {
        ...member,
        dailyHours,
        weeklyHours,
        allTimeHours,
        quotaMet: weeklyHours >= this.quotaSettings.weeklyRequirement,
        lastActive,
        quotaStrikes,
      };
    });
  }

  async getLeaderboard(period: 'daily' | 'weekly' | 'monthly' | 'alltime'): Promise<LeaderboardEntry[]> {
    const staff = await this.getAllStaffMembers();
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'daily':
        startDate = this.getStartOfDay(now);
        break;
      case 'weekly':
        startDate = this.getStartOfWeek(now);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'alltime':
        startDate = new Date(0);
        break;
    }

    const entries = staff.map(member => {
      const totalHours = this.calculateHours(member.id, startDate);
      const prevPeriodStart = new Date(startDate);
      
      if (period === 'weekly') {
        prevPeriodStart.setDate(prevPeriodStart.getDate() - 7);
      } else if (period === 'monthly') {
        prevPeriodStart.setMonth(prevPeriodStart.getMonth() - 1);
      } else {
        prevPeriodStart.setDate(prevPeriodStart.getDate() - 1);
      }
      
      const prevHours = this.calculateHours(member.id, prevPeriodStart, startDate);
      const weeklyChange = totalHours - prevHours;

      return {
        ...member,
        totalHours,
        weeklyChange,
        position: 0, // Will be set after sorting
      };
    });

    // Sort by total hours descending
    entries.sort((a, b) => b.totalHours - a.totalHours);
    
    // Set positions
    entries.forEach((entry, index) => {
      entry.position = index + 1;
    });

    return entries;
  }

  async getWeeklyActivity(): Promise<WeeklyActivity[]> {
    const weekStart = this.getStartOfWeek(new Date());
    const activity: WeeklyActivity[] = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      
      const dayStart = this.getStartOfDay(date);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      let totalHours = 0;
      const timeEntriesArray = Array.from(this.timeEntries.values());
      for (const entry of timeEntriesArray) {
        if (entry.sessionStart >= dayStart && entry.sessionStart < dayEnd) {
          totalHours += entry.duration || 0;
        }
      }

      activity.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        totalHours: Math.round(totalHours * 100) / 100,
      });
    }

    return activity;
  }

  async getQuotaCompletion(): Promise<{ completed: StaffWithStats[], incomplete: StaffWithStats[] }> {
    const staffWithStats = await this.getStaffWithStats();
    
    const completed = staffWithStats.filter(staff => staff.quotaMet);
    const incomplete = staffWithStats.filter(staff => !staff.quotaMet);

    return { completed, incomplete };
  }

  // Quota Strikes
  async getQuotaStrikes(staffId: string): Promise<QuotaStrike[]> {
    return Array.from(this.quotaStrikes.values())
      .filter(strike => strike.staffId === staffId && strike.active)
      .sort((a, b) => new Date(b.givenAt!).getTime() - new Date(a.givenAt!).getTime());
  }

  async createQuotaStrike(strike: InsertQuotaStrike): Promise<QuotaStrike> {
    const id = randomUUID();
    const newStrike: QuotaStrike = {
      id,
      ...strike,
      givenAt: new Date(),
      active: true,
    };
    this.quotaStrikes.set(id, newStrike);
    return newStrike;
  }

  async deleteQuotaStrike(id: string): Promise<boolean> {
    const strike = this.quotaStrikes.get(id);
    if (strike) {
      strike.active = false;
      this.quotaStrikes.set(id, strike);
      return true;
    }
    return false;
  }

  async getActiveStrikeCount(staffId: string): Promise<number> {
    return Array.from(this.quotaStrikes.values())
      .filter(strike => strike.staffId === staffId && strike.active).length;
  }
}

export const storage = new MemStorage();
