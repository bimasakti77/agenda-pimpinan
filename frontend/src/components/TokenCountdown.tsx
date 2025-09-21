"use client";

import { useTokenManager } from "@/hooks/useTokenManager";

interface TokenCountdownProps {
  showCountdown?: boolean;
}

export default function TokenCountdown({ showCountdown = true }: TokenCountdownProps) {
  const { tokenCountdown } = useTokenManager();

  if (!showCountdown) {
    return null;
  }

  return (
    <div className="flex items-center space-x-3 bg-gray-50 px-3 py-2 rounded-lg">
      <div className="text-center">
        <p className="text-xs text-gray-500">Access Token</p>
        <p className={`text-sm font-mono font-bold ${tokenCountdown.accessToken <= 10 ? 'text-red-600' : tokenCountdown.accessToken <= 30 ? 'text-orange-600' : 'text-green-600'}`}>
          {tokenCountdown.accessToken}s
        </p>
      </div>
      <div className="text-center">
        <p className="text-xs text-gray-500">Refresh Token</p>
        <p className={`text-sm font-mono font-bold ${tokenCountdown.refreshToken <= 5 ? 'text-red-600' : tokenCountdown.refreshToken <= 10 ? 'text-orange-600' : 'text-blue-600'}`}>
          {tokenCountdown.refreshToken}s
        </p>
      </div>
    </div>
  );
}
