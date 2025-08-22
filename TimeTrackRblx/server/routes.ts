import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertStaffMemberSchema, insertTimeEntrySchema, insertQuotaSettingsSchema, insertQuotaStrikeSchema } from "@shared/schema";
import axios from "axios";

const GROUP_ID = 36094836;
const STAFF_RANKS = [3, 4, 5, 6, 7, 8, 9, 10]; // Rank 3 and above
const EXCLUDED_RANK = 254;

// Roblox API helper functions
async function fetchGroupMembers() {
  try {
    const response = await axios.get(`https://groups.roblox.com/v1/groups/${GROUP_ID}/users?sortOrder=Asc&limit=100`);
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching group members:', error);
    return [];
  }
}

async function getUserDetails(userId: string) {
  try {
    const response = await axios.get(`https://users.roblox.com/v1/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user details:', error);
    return null;
  }
}

function getRankName(rankId: number): string {
  const rankNames: { [key: number]: string } = {
    3: "Helper",
    4: "Trial Moderator",
    5: "Moderator",
    6: "Senior Moderator",
    7: "Head Moderator",
    8: "Administrator",
    9: "Senior Administrator",
    10: "Owner"
  };
  return rankNames[rankId] || `Rank ${rankId}`;
}

export async function registerRoutes(app: Express): Promise<Server> {

  // Sync staff from Roblox Group
  app.post("/api/sync-staff", async (req, res) => {
    try {
      const members = await fetchGroupMembers();
      const staffMembers = members.filter((member: any) =>
        member.role.rank >= 3 && member.role.rank !== EXCLUDED_RANK
      );

      const syncedStaff = [];

      for (const member of staffMembers) {
        const existingStaff = await storage.getStaffMemberByUserId(member.user.userId.toString());

        if (!existingStaff) {
          const newStaff = await storage.createStaffMember({
            userId: member.user.userId.toString(),
            username: member.user.username,
            rank: member.role.rank,
            rankName: member.role.name,
          });
          syncedStaff.push(newStaff);
        } else {
          // Update existing staff member
          const updated = await storage.updateStaffMember(existingStaff.id, {
            username: member.user.username,
            rank: member.role.rank,
            rankName: member.role.name,
          });
          if (updated) syncedStaff.push(updated);
        }
      }

      res.json({
        message: "Staff synced successfully",
        syncedCount: syncedStaff.length,
        staff: syncedStaff
      });
    } catch (error) {
      console.error('Sync error:', error);
      res.status(500).json({
        message: "Failed to sync staff from Roblox",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Get staff with stats
  app.get("/api/staff", async (req, res) => {
    try {
      const staff = await storage.getStaffWithStats();
      res.json(staff);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch staff data" });
    }
  });

  // Get single staff member
  app.get("/api/staff/:id", async (req, res) => {
    try {
      const staff = await storage.getStaffMember(req.params.id);
      if (!staff) {
        return res.status(404).json({ message: "Staff member not found" });
      }

      const timeEntries = await storage.getTimeEntriesForStaff(staff.id);
      res.json({ ...staff, timeEntries });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch staff member" });
    }
  });

  // Get leaderboard
  app.get("/api/leaderboard/:period", async (req, res) => {
    try {
      const period = req.params.period as 'daily' | 'weekly' | 'monthly' | 'alltime';
      if (!['daily', 'weekly', 'monthly', 'alltime'].includes(period)) {
        return res.status(400).json({ message: "Invalid period" });
      }

      const leaderboard = await storage.getLeaderboard(period);
      res.json(leaderboard);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  // Get weekly activity
  app.get("/api/weekly-activity", async (req, res) => {
    try {
      const activity = await storage.getWeeklyActivity();
      res.json(activity);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch weekly activity" });
    }
  });

  // Get quota completion status
  app.get("/api/quota-status", async (req, res) => {
    try {
      const quotaStatus = await storage.getQuotaCompletion();
      res.json(quotaStatus);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quota status" });
    }
  });

  // Track time (webhook endpoint for Roblox Studio)
  app.post("/api/track-time", async (req, res) => {
    try {
      const { userId, username, rank, sessionTime, action } = req.body;

      if (!userId || !username || !action) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Ensure staff member exists
      let staff = await storage.getStaffMemberByUserId(userId.toString());
      if (!staff) {
        const rankName = getRankName(rank);
        staff = await storage.createStaffMember({
          userId: userId.toString(),
          username,
          rank: rank || 3,
          rankName,
        });
      }

      // Create time entry
      const entry = await storage.createTimeEntry({
        staffId: staff.id,
        sessionStart: new Date(),
        sessionEnd: action === 'leave' ? new Date() : undefined,
        duration: sessionTime ? sessionTime / 3600 : 0, // Convert seconds to hours
        action,
      });

      res.json({ message: "Time tracked successfully", entry });
    } catch (error) {
      console.error('Time tracking error:', error);
      res.status(500).json({ message: "Failed to track time" });
    }
  });

  // Manual time adjustment
  app.post("/api/staff/:id/adjust-time", async (req, res) => {
    try {
      const { hours, reason } = req.body;

      if (typeof hours !== 'number') {
        return res.status(400).json({ message: "Hours must be a number" });
      }

      const staff = await storage.getStaffMember(req.params.id);
      if (!staff) {
        return res.status(404).json({ message: "Staff member not found" });
      }

      // Create manual adjustment entry
      const entry = await storage.createTimeEntry({
        staffId: staff.id,
        sessionStart: new Date(),
        sessionEnd: new Date(),
        duration: hours,
        action: `manual_adjustment: ${reason || 'No reason provided'}`,
      });

      res.json({ message: "Time adjusted successfully", entry });
    } catch (error) {
      res.status(500).json({ message: "Failed to adjust time" });
    }
  });

  // Update quota settings
  app.put("/api/quota-settings", async (req, res) => {
    try {
      const result = insertQuotaSettingsSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid quota settings", errors: result.error });
      }

      const settings = await storage.updateQuotaSettings(result.data);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to update quota settings" });
    }
  });

  // Get quota settings
  app.get("/api/quota-settings", async (req, res) => {
    try {
      const settings = await storage.getQuotaSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quota settings" });
    }
  });

  // Staff management routes
  app.patch("/api/staff/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { username, rank, rankName } = req.body;

      const updated = await storage.updateStaffMember(id, { username, rank, rankName });
      if (!updated) {
        return res.status(404).json({ message: "Staff member not found" });
      }

      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update staff member" });
    }
  });

  app.post("/api/staff/:id/demote", async (req, res) => {
    try {
      const { id } = req.params;
      const staff = await storage.getStaffMember(id);
      if (!staff) {
        return res.status(404).json({ message: "Staff member not found" });
      }

      // Demote to Helper (rank 3)
      const updated = await storage.updateStaffMember(id, {
        rank: 3,
        rankName: "Helper"
      });

      res.json({ message: "Staff member demoted successfully", staff: updated });
    } catch (error) {
      res.status(500).json({ message: "Failed to demote staff member" });
    }
  });

  // Quota strikes routes
  app.get("/api/staff/:id/strikes", async (req, res) => {
    try {
      const { id } = req.params;
      const strikes = await storage.getQuotaStrikes(id);
      res.json(strikes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quota strikes" });
    }
  });

  app.post("/api/staff/:id/strikes", async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({ message: "Strike reason is required" });
      }

      // Get current week boundaries
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay() + 1); // Monday
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const strike = await storage.createQuotaStrike({
        staffId: id,
        weekStart,
        weekEnd,
        reason,
        givenBy: "Admin", // TODO: Add proper authentication
      });

      res.json(strike);
    } catch (error) {
      res.status(500).json({ message: "Failed to add quota strike" });
    }
  });

  app.delete("/api/strikes/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteQuotaStrike(id);

      if (!success) {
        return res.status(404).json({ message: "Strike not found" });
      }

      res.json({ message: "Strike removed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove strike" });
    }
  });

  // Avatar proxy endpoint to handle CORS issues
  app.get("/api/avatar/:userId", async (req, res) => {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      const response = await axios.get(
        `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=true`,
        {
          headers: {
            'User-Agent': 'Replit-Staff-Tracker/1.0'
          }
        }
      );

      if (response.data && response.data.data && response.data.data.length > 0) {
        const imageUrl = response.data.data[0].imageUrl;
        res.json({ imageUrl });
      } else {
        res.status(404).json({ message: "Avatar not found" });
      }
    } catch (error) {
      console.error('Avatar proxy error:', error);
      res.status(500).json({ message: "Failed to fetch avatar" });
    }
  });

  // Mass strike endpoint
  app.post("/api/mass-strike", async (req, res) => {
    try {
      const { staffIds, reason } = req.body;

      if (!Array.isArray(staffIds) || !reason) {
        return res.status(400).json({ message: "Invalid request data" });
      }

      // Get current week boundaries
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay() + 1); // Monday
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      let successCount = 0;

      for (const staffId of staffIds) {
        try {
          await storage.createQuotaStrike({
            staffId,
            weekStart,
            weekEnd,
            reason,
            givenBy: "Admin", // TODO: Add proper authentication
          });
          successCount++;
        } catch (error) {
          console.error(`Failed to create strike for staff ${staffId}:`, error);
        }
      }

      res.json({
        message: "Mass strike completed",
        successCount,
        totalCount: staffIds.length
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to apply mass strikes" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}