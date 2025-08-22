import { useState, useEffect, useMemo } from "react";

export function useRobloxAvatar(userId: string) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const memoizedUserId = useMemo(() => userId, [userId]);

  useEffect(() => {
    let isCancelled = false;

    const fetchAvatar = async () => {
      if (!memoizedUserId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Use server proxy to avoid CORS issues
        const response = await fetch(`/api/avatar/${memoizedUserId}`);
        
        if (response.ok) {
          const data = await response.json();
          if (!isCancelled && data.imageUrl) {
            setAvatarUrl(data.imageUrl);
          }
        } else {
          // Fallback to a default image if the API fails
          if (!isCancelled) {
            setAvatarUrl(`https://www.roblox.com/bust-thumbnail/image?userId=${memoizedUserId}&width=150&height=150&format=png`);
          }
        }
      } catch (error) {
        console.warn('Failed to load Roblox avatar for user', memoizedUserId, error);
        // Fallback to a default image
        if (!isCancelled) {
          setAvatarUrl(`https://www.roblox.com/bust-thumbnail/image?userId=${memoizedUserId}&width=150&height=150&format=png`);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchAvatar();

    return () => {
      isCancelled = true;
    };
  }, [memoizedUserId]);

  return { avatarUrl, loading };
}