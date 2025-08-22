import { useQuery } from "@tanstack/react-query";
import { robloxApi } from "@/lib/roblox-api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

interface StaffModalProps {
  staffId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function StaffModal({ staffId, isOpen, onClose }: StaffModalProps) {
  const { data: staff, isLoading } = useQuery({
    queryKey: ["/api/staff", staffId],
    queryFn: () => robloxApi.getStaffMember(staffId),
    enabled: !!staffId && isOpen,
  });

  const getInitials = (username: string) => {
    return username
      ?.split(/[-_]/)
      .map(part => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('') || '';
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric',
    });
  };

  const formatTime = (date: string | Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Get recent activity from time entries
  const recentActivity = staff?.timeEntries
    ?.filter((entry: any) => entry.action === 'leave' || entry.action === 'update')
    ?.sort((a: any, b: any) => new Date(b.sessionStart).getTime() - new Date(a.sessionStart).getTime())
    ?.slice(0, 5) || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900/95 backdrop-blur-sm border-white/20">
        <DialogHeader>
          <DialogTitle className="text-white" data-testid="title-staff-details">Staff Details</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <Skeleton className="w-16 h-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        ) : staff ? (
          <div className="space-y-6">
            {/* Staff Info */}
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
                {getInitials(staff.username)}
              </div>
              <div>
                <h4 className="text-xl font-semibold text-white" data-testid={`text-username-${staff.id}`}>
                  {staff.username}
                </h4>
                <p className="text-gray-300" data-testid={`text-rank-${staff.id}`}>
                  {staff.rankName}
                </p>
                <p className="text-sm text-gray-400" data-testid={`text-userid-${staff.id}`}>
                  User ID: {staff.userId}
                </p>
              </div>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/10 border border-white/20 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-blue-400" data-testid={`text-daily-hours-${staff.id}`}>
                  {staff.dailyHours?.toFixed(1) || '0.0'}h
                </p>
                <p className="text-sm text-gray-300">Today</p>
              </div>
              <div className="bg-white/10 border border-white/20 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-400" data-testid={`text-weekly-hours-${staff.id}`}>
                  {staff.weeklyHours?.toFixed(1) || '0.0'}h
                </p>
                <p className="text-sm text-gray-300">This Week</p>
              </div>
              <div className="bg-white/10 border border-white/20 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-white" data-testid={`text-alltime-hours-${staff.id}`}>
                  {staff.allTimeHours?.toFixed(1) || '0.0'}h
                </p>
                <p className="text-sm text-gray-300">All Time</p>
              </div>
            </div>
            
            {/* Recent Activity */}
            <div className="space-y-4">
              <h5 className="font-semibold text-white" data-testid="title-recent-activity">
                Recent Activity
              </h5>
              <ScrollArea className="h-48">
                {recentActivity.length === 0 ? (
                  <div className="text-center text-gray-400 py-8" data-testid="text-no-activity">
                    No recent activity found
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentActivity.map((activity: any, index: number) => (
                      <div
                        key={`${activity.id}-${index}`}
                        className="flex items-center justify-between p-3 bg-white/10 border border-white/20 rounded-lg"
                        data-testid={`card-activity-${index}`}
                      >
                        <div>
                          <p className="font-medium text-white" data-testid={`text-date-${index}`}>
                            {formatDate(activity.sessionStart)}
                          </p>
                          <p className="text-sm text-gray-300" data-testid={`text-time-${index}`}>
                            {formatTime(activity.sessionStart)}
                            {activity.sessionEnd && ` - ${formatTime(activity.sessionEnd)}`}
                          </p>
                        </div>
                        <span className="font-semibold text-blue-400" data-testid={`text-duration-${index}`}>
                          {activity.duration ? `${activity.duration.toFixed(2)}h` : 'In Progress'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-400 py-8" data-testid="text-staff-not-found">
            Staff member not found
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
