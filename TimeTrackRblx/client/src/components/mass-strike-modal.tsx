import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { StaffWithStats } from "@shared/schema";

interface MassStrikeModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffList: StaffWithStats[];
}

export default function MassStrikeModal({ isOpen, onClose, staffList }: MassStrikeModalProps) {
  const [reason, setReason] = useState("Failed to meet weekly quota requirement");
  const { toast } = useToast();

  // Get staff who haven't met quota
  const incompleteStaff = staffList?.filter(staff => !staff.quotaMet) || [];

  const massStrikeMutation = useMutation({
    mutationFn: (data: { staffIds: string[]; reason: string }) =>
      fetch("/api/mass-strike", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(res => res.json()),
    onSuccess: (result: { successCount: number; totalCount: number }) => {
      toast({
        title: "Strikes Applied",
        description: `Successfully applied quota strikes to ${result.successCount} out of ${result.totalCount} staff members.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quota-status"] });
      onClose();
    },
    onError: () => {
      toast({
        title: "Strike Failed",
        description: "Failed to apply mass quota strikes. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleApplyStrikes = () => {
    if (!reason.trim()) {
      toast({
        title: "Invalid Reason",
        description: "Please provide a reason for the quota strikes.",
        variant: "destructive",
      });
      return;
    }

    if (incompleteStaff.length === 0) {
      toast({
        title: "No Staff",
        description: "No staff members failed quota this week.",
        variant: "destructive",
      });
      return;
    }

    massStrikeMutation.mutate({
      staffIds: incompleteStaff.map(staff => staff.id),
      reason,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900/95 backdrop-blur-sm border-white/20">
        <DialogHeader>
          <DialogTitle className="text-white">Mass Quota Strike</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
            <div className="flex items-center space-x-3">
              <i className="fas fa-exclamation-triangle text-red-400 text-xl"></i>
              <div>
                <h3 className="text-red-400 font-semibold">Warning</h3>
                <p className="text-gray-300 text-sm">
                  This will give quota strikes to all staff members who failed to meet their weekly quota.
                </p>
              </div>
            </div>
          </div>

          {/* Staff List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Staff Who Failed Quota</h3>
              <Badge variant="destructive">
                {incompleteStaff.length} Staff Members
              </Badge>
            </div>

            {incompleteStaff.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {incompleteStaff.map((staff) => (
                  <div
                    key={staff.id}
                    className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                        {staff.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-white">{staff.username}</p>
                        <p className="text-sm text-gray-300">{staff.rankName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-red-400">{staff.weeklyHours.toFixed(1)}h</p>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {staff.quotaStrikes} Strike{staff.quotaStrikes !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-8">
                All staff have met their quota this week! 🎉
              </div>
            )}
          </div>

          {/* Reason Input */}
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-gray-300">Strike Reason</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="bg-white/5 border-white/20 text-white placeholder:text-gray-400"
              rows={3}
              placeholder="Enter reason for quota strikes..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-white/20 text-white hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button
              onClick={handleApplyStrikes}
              disabled={massStrikeMutation.isPending || incompleteStaff.length === 0}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {massStrikeMutation.isPending ? "Applying..." : `Apply Strikes (${incompleteStaff.length})`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}