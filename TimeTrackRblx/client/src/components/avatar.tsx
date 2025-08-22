import { memo } from "react";
import { useRobloxAvatar } from "@/hooks/use-roblox-avatar";

interface AvatarProps {
  userId: string;
  username: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "w-8 h-8 text-sm",
  md: "w-10 h-10 text-sm", 
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-xl"
};

function Avatar({ userId, username, size = "md", className = "" }: AvatarProps) {
  const { avatarUrl, loading } = useRobloxAvatar(userId);

  const initials = username.charAt(0).toUpperCase();
  const sizeClass = sizeClasses[size];

  if (loading) {
    return (
      <div className={`${sizeClass} bg-gray-600 rounded-full flex items-center justify-center animate-pulse ${className}`}>
        <div className="w-full h-full bg-gray-500 rounded-full"></div>
      </div>
    );
  }

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={`${username}'s avatar`}
        className={`${sizeClass} rounded-full object-cover ${className}`}
        onError={(e) => {
          // Fallback to initials if image fails to load
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          target.nextSibling && ((target.nextSibling as HTMLElement).style.display = 'flex');
        }}
      />
    );
  }

  return (
    <div className={`${sizeClass} bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center font-medium ${className}`}>
      {initials}
    </div>
  );
}

export default memo(Avatar);