import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { robloxApi } from "@/lib/roblox-api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import StatsOverview from "@/components/stats-overview";
import QuotaTracker from "@/components/quota-tracker";
import Leaderboard from "@/components/leaderboard";
import WeeklyChart from "@/components/weekly-chart";
import StaffTable from "@/components/staff-table";
import StaffModal from "@/components/staff-modal";

export default function Dashboard() {
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    queryFn: () => robloxApi.getDashboardStats(),
  });

  const handleSyncStaff = async () => {
    try {
      const result = await robloxApi.syncStaff();
      toast({
        title: "Staff Synced",
        description: `Successfully synced ${result.syncedCount} staff members from Roblox Group ${36094836}`,
      });
      refetchStats();
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Failed to sync staff from Roblox. Please check your connection and try again.",
        variant: "destructive",
      });
    }
  };

  const handleRefresh = () => {
    refetchStats();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800">
      {/* Navigation */}
      <nav className="bg-black/20 backdrop-blur-sm shadow-sm border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <i className="fas fa-gamepad text-2xl text-blue-400"></i>
                <h1 className="text-xl font-bold text-white">Staff Tracker</h1>
              </div>
              <Badge variant="secondary" className="bg-white/10 text-gray-200 border-white/20">
                Group: {36094836}
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = '/settings'}
                className="text-white hover:bg-white/10"
                data-testid="button-settings"
              >
                <i className="fas fa-cog mr-2"></i>
                Settings
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                className="text-white hover:bg-white/10"
                data-testid="button-refresh"
              >
                <i className="fas fa-sync-alt mr-2"></i>
                Refresh
              </Button>
              <Button
                onClick={handleSyncStaff}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                data-testid="button-sync-staff"
              >
                <i className="fas fa-users mr-2"></i>
                Sync Staff
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stats Overview */}
        <StatsOverview />

        {/* Quota Tracker */}
        <QuotaTracker />

        {/* Leaderboard and Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Leaderboard />
          <WeeklyChart />
        </div>

        {/* Staff Table */}
        <StaffTable onViewStaff={setSelectedStaffId} />
      </div>

      {/* Staff Modal */}
      {selectedStaffId && (
        <StaffModal
          staffId={selectedStaffId}
          isOpen={!!selectedStaffId}
          onClose={() => setSelectedStaffId(null)}
        />
      )}
    </div>
  );
}
