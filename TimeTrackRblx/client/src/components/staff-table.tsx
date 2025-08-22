import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { robloxApi } from "@/lib/roblox-api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import type { StaffWithStats } from "@shared/schema";
import Avatar from "@/components/avatar";
import EditStaffModal from "@/components/edit-staff-modal";
import MassStrikeModal from "@/components/mass-strike-modal";

interface StaffTableProps {
  onViewStaff: (staffId: string) => void;
}

export default function StaffTable({ onViewStaff }: StaffTableProps) {
  const [search, setSearch] = useState("");
  const [rankFilter, setRankFilter] = useState("all");
  const [sortBy, setSortBy] = useState<keyof StaffWithStats>("weeklyHours");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [editStaffId, setEditStaffId] = useState<string | null>(null);
  const [showMassStrike, setShowMassStrike] = useState(false);

  const { data: staff, isLoading } = useQuery({
    queryKey: ["/api/staff"],
    queryFn: () => robloxApi.getStaff(),
  });

  const filteredAndSortedStaff = useMemo(() => {
    if (!staff) return [];

    let filtered = staff.filter((member: StaffWithStats) => {
      const matchesSearch = member.username.toLowerCase().includes(search.toLowerCase()) ||
                           member.userId.includes(search);
      const matchesRank = rankFilter === "all" || member.rankName.toLowerCase().includes(rankFilter.toLowerCase());
      
      return matchesSearch && matchesRank;
    });

    // Sort
    filtered.sort((a: StaffWithStats, b: StaffWithStats) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
      }
      
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      return sortOrder === 'desc' ? bStr.localeCompare(aStr) : aStr.localeCompare(bStr);
    });

    return filtered;
  }, [staff, search, rankFilter, sortBy, sortOrder]);

  const handleSort = (column: keyof StaffWithStats) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const getInitials = (username: string) => {
    return username
      .split(/[-_]/)
      .map(part => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  const getAvatarGradient = (index: number) => {
    const gradients = [
      "from-blue-500 to-purple-600",
      "from-green-500 to-teal-600", 
      "from-red-500 to-pink-600",
      "from-purple-500 to-indigo-600",
      "from-yellow-500 to-orange-600",
      "from-pink-500 to-rose-600",
      "from-indigo-500 to-blue-600",
      "from-teal-500 to-green-600",
    ];
    return gradients[index % gradients.length];
  };

  const getRankBadgeColor = (rankName: string) => {
    if (rankName.includes('Owner')) return 'bg-purple-100 text-purple-800';
    if (rankName.includes('Admin')) return 'bg-red-100 text-red-800';
    if (rankName.includes('Head')) return 'bg-orange-100 text-orange-800';
    if (rankName.includes('Senior')) return 'bg-blue-100 text-blue-800';
    if (rankName.includes('Moderator')) return 'bg-green-100 text-green-800';
    if (rankName.includes('Trial')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <Card className="bg-surface shadow-sm border border-gray-100">
        <CardContent className="p-6">
          <Skeleton className="h-12 w-full mb-6" />
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-white/10 backdrop-blur-sm border-white/20 shadow-xl">
      {/* Header */}
      <div className="p-6 border-b border-white/20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <h2 className="text-xl font-bold text-white" data-testid="title-staff-members">
            Staff Members
          </h2>
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => setShowMassStrike(true)}
              className="bg-red-600 hover:bg-red-700 text-white"
              data-testid="button-mass-strike"
            >
              <i className="fas fa-exclamation-triangle mr-2"></i>
              Mass Strike
            </Button>
            <div className="relative">
              <Input
                type="text"
                placeholder="Search staff..."
                className="pl-10 pr-4 py-2 bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                data-testid="input-search-staff"
              />
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            </div>
            <Select value={rankFilter} onValueChange={setRankFilter}>
              <SelectTrigger className="w-48" data-testid="select-rank-filter">
                <SelectValue placeholder="All Ranks" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ranks</SelectItem>
                <SelectItem value="owner">Owner</SelectItem>
                <SelectItem value="administrator">Administrator</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
                <SelectItem value="helper">Helper</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/5" data-testid="button-export">
              <i className="fas fa-download mr-2"></i>Export
            </Button>
          </div>
        </div>
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-white/5 border-b border-white/20">
              <TableHead 
                className="cursor-pointer hover:bg-white/10 transition-colors text-gray-300"
                onClick={() => handleSort('username')}
                data-testid="header-staff-member"
              >
                Staff Member <i className="fas fa-sort ml-1"></i>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-white/10 transition-colors text-gray-300"
                onClick={() => handleSort('rank')}
                data-testid="header-rank"
              >
                Rank <i className="fas fa-sort ml-1"></i>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-white/10 transition-colors text-gray-300"
                onClick={() => handleSort('dailyHours')}
                data-testid="header-today"
              >
                Today <i className="fas fa-sort ml-1"></i>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-white/10 transition-colors text-gray-300"
                onClick={() => handleSort('weeklyHours')}
                data-testid="header-this-week"
              >
                This Week <i className="fas fa-sort ml-1"></i>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-white/10 transition-colors text-gray-300"
                onClick={() => handleSort('allTimeHours')}
                data-testid="header-all-time"
              >
                All Time <i className="fas fa-sort ml-1"></i>
              </TableHead>
              <TableHead className="text-gray-300" data-testid="header-status">Status</TableHead>
              <TableHead className="text-gray-300" data-testid="header-actions">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedStaff.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-400 py-8" data-testid="text-no-staff">
                  {staff?.length === 0 ? "No staff members found. Click 'Sync Staff' to load from Roblox." : "No staff match your search criteria."}
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedStaff.map((member: StaffWithStats, index: number) => (
                <TableRow key={member.id} className="hover:bg-white/5 transition-colors border-b border-white/10" data-testid={`row-staff-${member.id}`}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar 
                        userId={member.userId} 
                        username={member.username}
                        size="md"
                      />
                      <div>
                        <p className="font-medium text-white" data-testid={`text-username-${member.id}`}>
                          {member.username}
                        </p>
                        <p className="text-sm text-gray-300" data-testid={`text-userid-${member.id}`}>
                          ID: {member.userId}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      className={getRankBadgeColor(member.rankName)}
                      data-testid={`badge-rank-${member.id}`}
                    >
                      {member.rankName}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium text-white" data-testid={`text-daily-${member.id}`}>
                    {member.dailyHours.toFixed(1)}h
                  </TableCell>
                  <TableCell className="font-medium text-white" data-testid={`text-weekly-${member.id}`}>
                    {member.weeklyHours.toFixed(1)}h
                  </TableCell>
                  <TableCell className="font-medium text-white" data-testid={`text-alltime-${member.id}`}>
                    {member.allTimeHours.toFixed(1)}h
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={member.quotaMet ? "default" : "destructive"}
                      className={member.quotaMet ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                      data-testid={`badge-status-${member.id}`}
                    >
                      <i className={`${member.quotaMet ? 'fas fa-check-circle' : 'fas fa-exclamation-triangle'} mr-1`}></i>
                      {member.quotaMet ? 'Quota Met' : 'Behind Quota'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewStaff(member.id)}
                        className="hover:bg-white/10"
                        data-testid={`button-view-${member.id}`}
                      >
                        <i className="fas fa-eye text-blue-400"></i>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditStaffId(member.id)}
                        className="hover:bg-white/10"
                        data-testid={`button-edit-${member.id}`}
                      >
                        <i className="fas fa-edit text-amber-400"></i>
                      </Button>
                      {member.quotaStrikes > 0 && (
                        <Badge variant="destructive" className="ml-2">
                          {member.quotaStrikes} Strike{member.quotaStrikes !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination */}
      <div className="px-6 py-3 border-t border-white/20 bg-white/5">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-300" data-testid="text-pagination">
            Showing {filteredAndSortedStaff.length} of {staff?.length || 0} staff members
          </p>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled
              className="border-white/20 text-gray-400"
              data-testid="button-previous-page"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled
              className="border-white/20 text-gray-400"
              data-testid="button-next-page"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
      </Card>
      
      <EditStaffModal
        staffId={editStaffId}
        isOpen={editStaffId !== null}
        onClose={() => setEditStaffId(null)}
      />
      
      <MassStrikeModal
        isOpen={showMassStrike}
        onClose={() => setShowMassStrike(false)}
        staffList={staff || []}
      />
    </>
  );
}
