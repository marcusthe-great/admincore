import { useQuery } from "@tanstack/react-query";
import { robloxApi } from "@/lib/roblox-api";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { StaffWithStats } from "@shared/schema";

export default function QuotaTracker() {
  const { data: quotaData, isLoading } = useQuery({
    queryKey: ["/api/quota-status"],
    queryFn: () => robloxApi.getQuotaStatus(),
  });

  if (isLoading) {
    return (
      <Card className="bg-surface shadow-sm border border-gray-100">
        <CardContent className="p-6">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const getInitials = (username: string) => {
    return username
      .split(/[-_]/)
      .map(part => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  const getCurrentWeekRange = () => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    return `Week of ${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}-${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${endOfWeek.getFullYear()}`;
  };

  const completed = quotaData?.completed || [];
  const incomplete = quotaData?.incomplete || [];

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20 shadow-xl">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white" data-testid="title-quota-tracker">
            Weekly Quota Tracker
          </h2>
          <div className="flex items-center space-x-2 text-sm text-gray-300">
            <i className="fas fa-calendar-week"></i>
            <span data-testid="text-week-range">{getCurrentWeekRange()}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quota Completed */}
          <div>
            <h3 className="text-lg font-semibold text-green-400 mb-4 flex items-center" data-testid="title-quota-completed">
              <i className="fas fa-check-circle mr-2"></i>
              Quota Completed ({completed.length})
            </h3>
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {completed.length === 0 ? (
                  <div className="text-center text-gray-400 py-8" data-testid="text-no-completed">
                    No staff have completed their quota yet
                  </div>
                ) : (
                  completed.map((staff: StaffWithStats) => (
                    <div
                      key={staff.id}
                      className="flex items-center justify-between p-3 bg-green-500/20 border border-green-500/30 rounded-lg"
                      data-testid={`card-completed-${staff.id}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                          {getInitials(staff.username)}
                        </div>
                        <div>
                          <p className="font-medium text-white" data-testid={`text-username-${staff.id}`}>
                            {staff.username}
                          </p>
                          <p className="text-sm text-gray-300" data-testid={`text-rank-${staff.id}`}>
                            {staff.rankName}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-400" data-testid={`text-hours-${staff.id}`}>
                          {staff.weeklyHours.toFixed(1)}h
                        </p>
                        <p className="text-xs text-gray-300">
                          +{(staff.weeklyHours - 1.0).toFixed(1)}h over
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Quota Incomplete */}
          <div>
            <h3 className="text-lg font-semibold text-red-400 mb-4 flex items-center" data-testid="title-quota-incomplete">
              <i className="fas fa-exclamation-triangle mr-2"></i>
              Quota Incomplete ({incomplete.length})
            </h3>
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {incomplete.length === 0 ? (
                  <div className="text-center text-gray-400 py-8" data-testid="text-no-incomplete">
                    All staff have completed their quota!
                  </div>
                ) : (
                  incomplete.map((staff: StaffWithStats) => (
                    <div
                      key={staff.id}
                      className="flex items-center justify-between p-3 bg-red-500/20 border border-red-500/30 rounded-lg"
                      data-testid={`card-incomplete-${staff.id}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                          {getInitials(staff.username)}
                        </div>
                        <div>
                          <p className="font-medium text-white" data-testid={`text-username-${staff.id}`}>
                            {staff.username}
                          </p>
                          <p className="text-sm text-gray-300" data-testid={`text-rank-${staff.id}`}>
                            {staff.rankName}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-red-400" data-testid={`text-hours-${staff.id}`}>
                          {staff.weeklyHours.toFixed(1)}h
                        </p>
                        <p className="text-xs text-gray-300">
                          -{(1.0 - staff.weeklyHours).toFixed(1)}h short
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
