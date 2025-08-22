import { apiRequest } from "./queryClient";

export interface RobloxUser {
  id: number;
  username: string;
  displayName: string;
}

export interface RobloxGroupMember {
  user: RobloxUser;
  role: {
    id: number;
    name: string;
    rank: number;
  };
}

export const robloxApi = {
  async syncStaff() {
    const response = await apiRequest("POST", "/api/sync-staff");
    return response.json();
  },

  async getDashboardStats() {
    const response = await apiRequest("GET", "/api/dashboard/stats");
    return response.json();
  },

  async getStaff() {
    const response = await apiRequest("GET", "/api/staff");
    return response.json();
  },

  async getStaffMember(id: string) {
    const response = await apiRequest("GET", `/api/staff/${id}`);
    return response.json();
  },

  async getLeaderboard(period: 'daily' | 'weekly' | 'monthly' | 'alltime') {
    const response = await apiRequest("GET", `/api/leaderboard/${period}`);
    return response.json();
  },

  async getWeeklyActivity() {
    const response = await apiRequest("GET", "/api/weekly-activity");
    return response.json();
  },

  async getQuotaStatus() {
    const response = await apiRequest("GET", "/api/quota-status");
    return response.json();
  },

  async trackTime(data: {
    userId: string;
    username: string;
    rank: number;
    sessionTime: number;
    action: string;
  }) {
    const response = await apiRequest("POST", "/api/track-time", data);
    return response.json();
  },

  async adjustTime(staffId: string, hours: number, reason?: string) {
    const response = await apiRequest("POST", `/api/staff/${staffId}/adjust-time`, {
      hours,
      reason,
    });
    return response.json();
  },

  async getQuotaSettings() {
    const response = await apiRequest("GET", "/api/quota-settings");
    return response.json();
  },

  async updateQuotaSettings(settings: { weeklyRequirement: number; weekStart: number }) {
    const response = await apiRequest("PUT", "/api/quota-settings", settings);
    return response.json();
  },
};
