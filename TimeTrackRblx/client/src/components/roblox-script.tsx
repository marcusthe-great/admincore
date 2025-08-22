import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function RobloxScript() {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Get the current domain for webhook URL
  const getWebhookUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/api/track-time`;
    }
    return 'YOUR_WEBHOOK_URL_HERE';
  };

  const scriptCode = `-- Staff Time Tracker Script for Roblox Studio
-- Place this in ServerScriptService

local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")

-- Configuration
local GROUP_ID = 36094836
local WEBHOOK_URL = "${getWebhookUrl()}"
local STAFF_RANKS = {3, 4, 5, 6, 7, 8, 9, 10} -- Rank IDs 3 and above
local EXCLUDED_RANK = 254 -- Exclude this rank ID

-- Staff tracking data
local staffSessions = {}
local lastUpdate = tick()

-- Function to check if player is staff
local function isStaff(player)
    local success, rank = pcall(function()
        return player:GetRankInGroup(GROUP_ID)
    end)
    
    if success and rank then
        for _, staffRank in pairs(STAFF_RANKS) do
            if rank >= staffRank and rank ~= EXCLUDED_RANK then
                return true, rank
            end
        end
    end
    return false, rank
end

-- Function to send data to webhook
local function sendTimeData(playerData)
    local data = {
        userId = playerData.userId,
        username = playerData.username,
        rank = playerData.rank,
        sessionTime = playerData.sessionTime,
        timestamp = os.time(),
        action = playerData.action -- "join" or "leave"
    }
    
    local success, response = pcall(function()
        return HttpService:PostAsync(WEBHOOK_URL, HttpService:JSONEncode(data), Enum.HttpContentType.ApplicationJson)
    end)
    
    if not success then
        warn("Failed to send time data:", response)
    else
        print("Time data sent successfully for", playerData.username)
    end
end

-- Player joined
Players.PlayerAdded:Connect(function(player)
    local isStaffMember, rank = isStaff(player)
    
    if isStaffMember then
        staffSessions[player.UserId] = {
            userId = player.UserId,
            username = player.Name,
            rank = rank,
            joinTime = tick(),
            sessionTime = 0,
            action = "join"
        }
        
        -- Send join event
        sendTimeData(staffSessions[player.UserId])
        print("Staff member joined:", player.Name, "Rank:", rank)
    end
end)

-- Player left
Players.PlayerRemoving:Connect(function(player)
    if staffSessions[player.UserId] then
        local session = staffSessions[player.UserId]
        session.sessionTime = tick() - session.joinTime
        session.action = "leave"
        
        -- Send leave event with session time
        sendTimeData(session)
        print("Staff member left:", player.Name, "Session time:", math.floor(session.sessionTime), "seconds")
        
        staffSessions[player.UserId] = nil
    end
end)

-- Heartbeat for periodic updates (every 5 minutes)
RunService.Heartbeat:Connect(function()
    local currentTime = tick()
    
    if currentTime - lastUpdate >= 300 then -- 5 minutes
        for userId, session in pairs(staffSessions) do
            local player = Players:GetPlayerByUserId(userId)
            if player then
                session.sessionTime = currentTime - session.joinTime
                session.action = "update"
                sendTimeData(session)
            end
        end
        lastUpdate = currentTime
    end
end)

print("Staff Time Tracker initialized for Group ID:", GROUP_ID)
print("Webhook URL:", WEBHOOK_URL)`;

  const handleCopyScript = async () => {
    try {
      await navigator.clipboard.writeText(scriptCode);
      setCopied(true);
      toast({
        title: "Script Copied!",
        description: "The Roblox Studio script has been copied to your clipboard.",
      });
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy script. Please copy it manually.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20 shadow-xl">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white" data-testid="title-roblox-script">
            Roblox Studio Integration Script
          </h2>
          <Button
            onClick={handleCopyScript}
            className={copied ? "bg-secondary hover:bg-secondary" : ""}
            data-testid="button-copy-script"
          >
            <i className={`${copied ? 'fas fa-check' : 'fas fa-copy'} mr-2`}></i>
            {copied ? 'Copied!' : 'Copy Script'}
          </Button>
        </div>
        
        <p className="text-gray-300 mb-4" data-testid="text-script-description">
          Copy and paste this script into Roblox Studio ServerScriptService to automatically track staff playtime:
        </p>
        
        <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto mb-4">
          <pre className="text-green-400 text-sm" data-testid="code-roblox-script">
            <code>{scriptCode}</code>
          </pre>
        </div>
        
        <div className="p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
          <div className="flex items-start space-x-3">
            <i className="fas fa-info-circle text-blue-400 mt-1"></i>
            <div>
              <h4 className="font-semibold text-blue-400 mb-2" data-testid="title-setup-instructions">
                Setup Instructions:
              </h4>
              <ol className="text-sm text-gray-300 space-y-1 ml-4">
                <li data-testid="instruction-1">
                  1. Copy the script above using the "Copy Script" button
                </li>
                <li data-testid="instruction-2">
                  2. Open Roblox Studio and navigate to ServerScriptService
                </li>
                <li data-testid="instruction-3">
                  3. Create a new Script and paste the copied code
                </li>
                <li data-testid="instruction-4">
                  4. Ensure HTTP requests are enabled in Game Settings → Security → Allow HTTP Requests
                </li>
                <li data-testid="instruction-5">
                  5. The script will automatically track staff members based on group rank (Rank 3+ excluding Rank 254)
                </li>
              </ol>
              
              <div className="mt-4 space-y-2">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-blue-400 border-blue-400">
                    Group ID: {36094836}
                  </Badge>
                  <Badge variant="outline" className="text-green-400 border-green-400">
                    Webhook: {getWebhookUrl()}
                  </Badge>
                </div>
                <p className="text-xs text-gray-400">
                  The script will send join/leave events and periodic updates to track staff activity in real-time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
