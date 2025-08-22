import { useQuery } from "@tanstack/react-query";
import { robloxApi } from "@/lib/roblox-api";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function StatsOverview() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    queryFn: () => robloxApi.getDashboardStats(),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Staff",
      value: stats?.totalStaff || 0,
      icon: "fas fa-users",
      color: "text-primary",
      bgColor: "bg-blue-50",
    },
    {
      title: "Quota Met This Week", 
      value: stats?.quotaMet || 0,
      icon: "fas fa-check-circle",
      color: "text-secondary",
      bgColor: "bg-green-50",
      subtitle: stats?.totalStaff ? `${Math.round((stats.quotaMet / stats.totalStaff) * 100)}% completion rate` : "",
    },
    {
      title: "Average Weekly Hours",
      value: stats?.avgWeeklyHours?.toFixed(1) || "0.0",
      icon: "fas fa-clock",
      color: "text-accent",
      bgColor: "bg-amber-50",
    },
    {
      title: "Active Today",
      value: stats?.activeToday || 0,
      icon: "fas fa-circle",
      color: "text-secondary",
      bgColor: "bg-green-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((card, index) => (
        <Card key={index} className="bg-white/10 backdrop-blur-sm border-white/20 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm font-medium" data-testid={`text-${card.title.toLowerCase().replace(/\s+/g, '-')}`}>
                  {card.title}
                </p>
                <p className="text-2xl font-bold text-white" data-testid={`value-${card.title.toLowerCase().replace(/\s+/g, '-')}`}>
                  {card.value}
                </p>
                {card.subtitle && (
                  <div className="mt-2">
                    <div className="flex items-center text-sm">
                      <span className="text-green-400 font-medium">
                        {card.subtitle.split(' ')[0]}
                      </span>
                      <span className="text-gray-400 ml-1">
                        {card.subtitle.split(' ').slice(1).join(' ')}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <div className={`bg-white/10 p-3 rounded-full`}>
                <i className={`${card.icon} text-blue-400`}></i>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
