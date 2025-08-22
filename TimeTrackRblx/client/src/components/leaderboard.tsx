
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { robloxApi } from "@/lib/roblox-api";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Avatar from "@/components/avatar";
import type { LeaderboardEntry } from "@shared/schema";

export default function Leaderboard() {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'alltime'>('weekly');

  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ["/api/leaderboard", period],
    queryFn: () => robloxApi.getLeaderboard(period),
  });

  const getPositionStyle = (position: number) => {
    switch (position) {
      case 1:
        return "bg-primary text-white";
      case 2:
        return "bg-gray-400 text-white";
      case 3:
        return "bg-amber-500 text-white";
      default:
        return "bg-gray-300 text-gray-700";
    }
  };

  const topEntries = (leaderboard || []).slice(0, 4);

  if (isLoading) {
    return (
      <Card className="bg-surface shadow-sm border border-gray-100">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20 shadow-xl">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white" data-testid="title-leaderboard">
            Leaderboard
          </h2>
          <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
            <SelectTrigger className="w-32" data-testid="select-period">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Today</SelectItem>
              <SelectItem value="weekly">This Week</SelectItem>
              <SelectItem value="monthly">This Month</SelectItem>
              <SelectItem value="alltime">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-3">
          {topEntries.length === 0 ? (
            <div className="text-center text-gray-400 py-8" data-testid="text-no-data">
              No leaderboard data available
            </div>
          ) : (
            topEntries.map((entry: LeaderboardEntry, index: number) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
                data-testid={`card-leaderboard-${entry.id}`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${getPositionStyle(entry.position)}`}>
                    {entry.position}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Avatar 
                      userId={entry.userId} 
                      username={entry.username}
                      size="sm"
                    />
                    <div>
                      <p className="font-medium text-white" data-testid={`text-username-${entry.id}`}>
                        {entry.username}
                      </p>
                      <p className="text-xs text-gray-300" data-testid={`text-rank-${entry.id}`}>
                        {entry.rankName}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-lg ${entry.position === 1 ? 'text-blue-400' : 'text-white'}`} data-testid={`text-hours-${entry.id}`}>
                    {entry.totalHours.toFixed(1)}h
                  </p>
                  <p className="text-xs text-gray-300">
                    {entry.weeklyChange >= 0 ? '+' : ''}{entry.weeklyChange.toFixed(1)}h this week
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
        
        <Button
          variant="ghost"
          className="w-full mt-4 text-blue-400 hover:text-blue-300 hover:bg-white/5 font-medium"
          data-testid="button-view-full-leaderboard"
        >
          View Full Leaderboard <i className="fas fa-arrow-right ml-1"></i>
        </Button>
      </CardContent>
    </Card>
  );
}
