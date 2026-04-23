"use client";

import { useState } from "react";

export function ShareLink({ roomId, appUrl }: { roomId: string; appUrl: string }) {
  const [copied, setCopied] = useState(false);
  const link = `${appUrl}/room/${roomId}`;

  async function copy() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="w-full bg-gray-900 rounded-2xl p-4 mb-4 slide-up">
      <p className="text-gray-400 text-sm mb-3 text-center">
        Share this link with your partner 💚
      </p>
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-gray-800 rounded-xl px-3 py-2 text-gray-300 text-sm truncate font-mono">
          {link}
        </div>
        <button
          onClick={copy}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex-shrink-0 ${
            copied
              ? "bg-green-500 text-black"
              : "bg-gray-700 hover:bg-gray-600 text-white"
          }`}
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}
