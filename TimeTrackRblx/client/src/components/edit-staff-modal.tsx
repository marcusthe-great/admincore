import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { StaffWithStats, QuotaStrike } from "@shared/schema";

interface EditStaffModalProps {
  staffId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditStaffModal({ staffId, isOpen, onClose }: EditStaffModalProps) {
  const [username, setUsername] = useState("");
  const [rank, setRank] = useState("");
  const [rankName, setRankName] = useState("");
  const [strikeReason, setStrikeReason] = useState("");
  const { toast } = useToast();

  const { data: staff, isLoading } = useQuery<StaffWithStats>({
    queryKey: ["/api/staff", staffId],
    enabled: !!staffId,
  });

  const { data: strikes } = useQuery<QuotaStrike[]>({
    queryKey: ["/api/staff", staffId, "strikes"],
    enabled: !!staffId,
  });

  useEffect(() => {
    if (staff) {
      setUsername(staff.username);
      setRank(staff.rank.toString());
      setRankName(staff.rankName);
    }
  }, [staff]);

  const updateStaffMutation = useMutation({
    mutationFn: (data: { username: string; rank: number; rankName: string }) =>
      fetch(`/api/staff/${staffId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(res => res.json()),
    onSuccess: () => {
      toast({
        title: "Staff Updated",
        description: "Staff member has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      onClose();
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update staff member. Please try again.",
        variant: "destructive",
      });
    },
  });

  const addStrikeMutation = useMutation({
    mutationFn: (reason: string) =>
      fetch(`/api/staff/${staffId}/strikes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      }).then(res => res.json()),
    onSuccess: () => {
      toast({
        title: "Strike Added",
        description: "Quota strike has been added to the staff member.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/staff", staffId, "strikes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      setStrikeReason("");
    },
    onError: () => {
      toast({
        title: "Strike Failed",
        description: "Failed to add quota strike. Please try again.",
        variant: "destructive",
      });
    },
  });

  const removeStrikeMutation = useMutation({
    mutationFn: (strikeId: string) =>
      fetch(`/api/strikes/${strikeId}`, { method: "DELETE" }).then(res => res.json()),
    onSuccess: () => {
      toast({
        title: "Strike Removed",
        description: "Quota strike has been removed.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/staff", staffId, "strikes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
    },
    onError: () => {
      toast({
        title: "Remove Failed",
        description: "Failed to remove quota strike. Please try again.",
        variant: "destructive",
      });
    },
  });

  const demoteStaffMutation = useMutation({
    mutationFn: () =>
      fetch(`/api/staff/${staffId}/demote`, { method: "POST" }).then(res => res.json()),
    onSuccess: () => {
      toast({
        title: "Staff Demoted",
        description: "Staff member has been demoted due to quota strikes.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      onClose();
    },
    onError: () => {
      toast({
        title: "Demotion Failed",
        description: "Failed to demote staff member. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateStaffMutation.mutate({
      username,
      rank: parseInt(rank),
      rankName,
    });
  };

  const handleAddStrike = () => {
    if (!strikeReason.trim()) {
      toast({
        title: "Invalid Strike",
        description: "Please provide a reason for the quota strike.",
        variant: "destructive",
      });
      return;
    }
    addStrikeMutation.mutate(strikeReason);
  };

  if (!staffId || !isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-900/95 backdrop-blur-sm border-white/20">
        <DialogHeader>
          <DialogTitle className="text-white">Edit Staff Member</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-4 bg-white/10 rounded"></div>
            <div className="h-4 bg-white/10 rounded"></div>
            <div className="h-4 bg-white/10 rounded"></div>
          </div>
        ) : staff ? (
          <div className="space-y-6">
            {/* Basic Info Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-gray-300">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-white/5 border-white/20 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rank" className="text-gray-300">Rank</Label>
                  <Input
                    id="rank"
                    type="number"
                    value={rank}
                    onChange={(e) => setRank(e.target.value)}
                    className="bg-white/5 border-white/20 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rankName" className="text-gray-300">Rank Name</Label>
                  <Input
                    id="rankName"
                    value={rankName}
                    onChange={(e) => setRankName(e.target.value)}
                    className="bg-white/5 border-white/20 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">User ID</Label>
                  <div className="p-3 bg-white/5 border border-white/20 rounded-md">
                    <span className="text-white font-mono">{staff.userId}</span>
                  </div>
                </div>
              </div>
              <Button
                onClick={handleSave}
                disabled={updateStaffMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {updateStaffMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>

            {/* Quota Strikes Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Quota Strikes</h3>
                <Badge variant={staff.quotaStrikes >= 2 ? "destructive" : staff.quotaStrikes === 1 ? "secondary" : "outline"}>
                  {staff.quotaStrikes} Strike{staff.quotaStrikes !== 1 ? 's' : ''}
                </Badge>
              </div>

              {/* Current Strikes */}
              {strikes && strikes.length > 0 ? (
                <div className="space-y-2">
                  {strikes.filter(strike => strike.active).map((strike) => (
                    <div
                      key={strike.id}
                      className="flex items-center justify-between p-3 bg-red-500/20 border border-red-500/30 rounded-lg"
                    >
                      <div>
                        <p className="text-white font-medium">{strike.reason}</p>
                        <p className="text-sm text-gray-300">
                          Given on {new Date(strike.givenAt!).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeStrikeMutation.mutate(strike.id)}
                        className="text-red-400 hover:bg-red-500/20"
                      >
                        <i className="fas fa-times"></i>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-4">No active quota strikes</p>
              )}

              {/* Add Strike */}
              <div className="space-y-2">
                <Label htmlFor="strikeReason" className="text-gray-300">Add Quota Strike</Label>
                <div className="flex space-x-2">
                  <Textarea
                    id="strikeReason"
                    placeholder="Reason for quota strike..."
                    value={strikeReason}
                    onChange={(e) => setStrikeReason(e.target.value)}
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 flex-1"
                  />
                  <Button
                    onClick={handleAddStrike}
                    disabled={addStrikeMutation.isPending}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Add Strike
                  </Button>
                </div>
              </div>

              {/* Demotion Warning */}
              {staff.quotaStrikes >= 2 && (
                <div className="p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-exclamation-triangle text-yellow-400"></i>
                    <div className="flex-1">
                      <p className="text-yellow-400 font-semibold">Demotion Eligible</p>
                      <p className="text-gray-300 text-sm">This staff member has 2+ quota strikes and can be demoted.</p>
                    </div>
                    <Button
                      onClick={() => demoteStaffMutation.mutate()}
                      disabled={demoteStaffMutation.isPending}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white"
                    >
                      Demote
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Stats Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Performance Stats</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/10 border border-white/20 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-400">{staff.dailyHours?.toFixed(1) || '0.0'}h</p>
                  <p className="text-sm text-gray-300">Today</p>
                </div>
                <div className="bg-white/10 border border-white/20 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-400">{staff.weeklyHours?.toFixed(1) || '0.0'}h</p>
                  <p className="text-sm text-gray-300">This Week</p>
                </div>
                <div className="bg-white/10 border border-white/20 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-white">{staff.allTimeHours?.toFixed(1) || '0.0'}h</p>
                  <p className="text-sm text-gray-300">All Time</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-400 py-8">
            Staff member not found
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}