import { useQuery } from "@tanstack/react-query";
import { robloxApi } from "@/lib/roblox-api";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

export default function WeeklyChart() {
  const { data: weeklyActivity, isLoading } = useQuery({
    queryKey: ["/api/weekly-activity"],
    queryFn: () => robloxApi.getWeeklyActivity(),
  });

  if (isLoading) {
    return (
      <Card className="bg-surface shadow-sm border border-gray-100">
        <CardContent className="p-6">
          <Skeleton className="h-6 w-32 mb-6" />
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  const chartData = weeklyActivity || [];

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20 shadow-xl">
      <CardContent className="p-6">
        <h2 className="text-xl font-bold text-white mb-6" data-testid="title-weekly-activity">
          Weekly Activity
        </h2>
        <div className="h-64">
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400" data-testid="text-no-chart-data">
              No activity data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#D1D5DB' }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#D1D5DB' }}
                  label={{ value: 'Hours', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: '12px', fill: '#D1D5DB' } }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
                  }}
                  labelStyle={{ color: '#FFFFFF', fontWeight: 'medium' }}
                  itemStyle={{ color: '#60A5FA' }}
                />
                <Line
                  type="monotone"
                  dataKey="totalHours"
                  stroke="#2563EB"
                  strokeWidth={2}
                  fill="#2563EB"
                  fillOpacity={0.1}
                  dot={{ fill: '#2563EB', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#2563EB' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
