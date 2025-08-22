import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { robloxApi } from "@/lib/roblox-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import RobloxScript from "@/components/roblox-script";

export default function Settings() {
  const [weeklyRequirement, setWeeklyRequirement] = useState(1.0);
  const { toast } = useToast();

  const { data: quotaSettings } = useQuery({
    queryKey: ["/api/quota-settings"],
    queryFn: () => robloxApi.getQuotaSettings(),
  });

  const updateQuotaMutation = useMutation({
    mutationFn: (settings: { weeklyRequirement: number; weekStart: number }) =>
      robloxApi.updateQuotaSettings(settings),
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "Quota settings have been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update quota settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSaveQuotaSettings = () => {
    updateQuotaMutation.mutate({
      weeklyRequirement,
      weekStart: 1, // Monday
    });
  };

  const syncStaffMutation = useMutation({
    mutationFn: () => robloxApi.syncStaff(),
    onSuccess: (result) => {
      toast({
        title: "Staff Synced",
        description: `Successfully synced ${result.syncedCount} staff members from Roblox Group 36094836`,
      });
    },
    onError: () => {
      toast({
        title: "Sync Failed",
        description: "Failed to sync staff from Roblox. Please check your connection and try again.",
        variant: "destructive",
      });
    },
  });

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
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = '/'}
                className="text-white hover:bg-white/10"
                data-testid="button-back-dashboard"
              >
                <i className="fas fa-arrow-left mr-2"></i>
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2" data-testid="title-settings">
            Settings
          </h1>
          <p className="text-gray-300">
            Configure your staff tracking system and manage integrations.
          </p>
        </div>

        {/* Quota Settings */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 shadow-xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <i className="fas fa-clock mr-2 text-blue-400"></i>
              Quota Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="weeklyRequirement" className="text-gray-200">
                  Weekly Hour Requirement
                </Label>
                <Input
                  id="weeklyRequirement"
                  type="number"
                  min="0"
                  step="0.1"
                  value={weeklyRequirement}
                  onChange={(e) => setWeeklyRequirement(parseFloat(e.target.value))}
                  className="bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                  data-testid="input-weekly-requirement"
                />
                <p className="text-sm text-gray-400">
                  Number of hours staff must work each week
                </p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-gray-200">Week Start Day</Label>
                <div className="p-3 bg-white/5 rounded-md border border-white/20">
                  <p className="text-white font-medium">Monday</p>
                  <p className="text-sm text-gray-400">Week resets every Monday</p>
                </div>
              </div>
            </div>

            <Button
              onClick={handleSaveQuotaSettings}
              disabled={updateQuotaMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              data-testid="button-save-quota"
            >
              <i className="fas fa-save mr-2"></i>
              {updateQuotaMutation.isPending ? "Saving..." : "Save Quota Settings"}
            </Button>
          </CardContent>
        </Card>

        {/* Staff Sync */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 shadow-xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <i className="fas fa-users mr-2 text-green-400"></i>
              Staff Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-semibold text-white mb-2">Group Settings</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Group ID:</span>
                    <span className="text-white font-mono">36094836</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Staff Ranks:</span>
                    <span className="text-white">Rank 3+ (excluding 254)</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold text-white mb-2">Sync Status</h4>
                <p className="text-gray-300 text-sm mb-4">
                  Manually sync staff members from your Roblox group to update the database.
                </p>
                <Button
                  onClick={() => syncStaffMutation.mutate()}
                  disabled={syncStaffMutation.isPending}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  data-testid="button-sync-staff"
                >
                  <i className="fas fa-sync-alt mr-2"></i>
                  {syncStaffMutation.isPending ? "Syncing..." : "Sync Staff from Roblox"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator className="bg-white/20" />

        {/* Roblox Script Integration */}
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Roblox Studio Integration</h2>
            <p className="text-gray-300">
              Set up automatic time tracking in your Roblox game using the script below.
            </p>
          </div>
          <RobloxScript />
        </div>
      </div>
    </div>
  );
}