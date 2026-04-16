'use client';

import { useEffect, useState } from 'react';
import { Bell, BellOff } from 'lucide-react';
import Link from 'next/link';
import { getNotificationStatus, isPushSubscribed } from '@/lib/notifications';

const DISMISSED_KEY = 'irontrack_notif_prompt_dismissed';

export default function NotificationBell({ projectId }: { projectId: string }) {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    async function check() {
      const status = await getNotificationStatus();
      if (status === 'unsupported') {
        setEnabled(null); // hide entirely
        return;
      }
      const subscribed = await isPushSubscribed();
      const isEnabled = subscribed && status === 'granted';
      setEnabled(isEnabled);

      // Show prompt on first project visit if not enabled and not dismissed
      if (!isEnabled) {
        const dismissed = sessionStorage.getItem(DISMISSED_KEY);
        if (!dismissed) {
          setShowPrompt(true);
        }
      }
    }
    check();
  }, []);

  const dismissPrompt = () => {
    sessionStorage.setItem(DISMISSED_KEY, '1');
    setShowPrompt(false);
  };

  if (enabled === null) return null;

  return (
    <div className="relative">
      <Link
        href="/settings"
        title={enabled ? 'Notifications enabled — manage in Settings' : 'Enable notifications in Settings'}
        className={`p-2 rounded-lg transition-colors ${
          enabled
            ? 'bg-[#1F1F25] text-[#F97316] hover:bg-[#2a2a35]'
            : 'bg-[#1F1F25] text-gray-600 hover:bg-[#2a2a35] hover:text-gray-400'
        }`}
      >
        {enabled ? <Bell size={15} /> : <BellOff size={15} />}
      </Link>

      {/* One-time prompt: shown until dismissed */}
      {showPrompt && (
        <div className="absolute right-0 top-10 z-50 w-64 bg-[#1F1F25] border border-[#F97316]/30 rounded-xl p-3 shadow-xl shadow-black/50">
          <div className="flex items-start gap-2">
            <Bell size={14} className="text-[#F97316] mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white font-medium leading-tight">
                Enable notifications
              </p>
              <p className="text-xs text-gray-400 mt-0.5 leading-tight">
                Get alerts for inspections and delays.
              </p>
              <Link
                href="/settings"
                className="inline-block mt-2 text-xs text-[#F97316] hover:text-[#ea6c0a] font-medium"
                onClick={dismissPrompt}
              >
                Go to Settings →
              </Link>
            </div>
            <button
              onClick={dismissPrompt}
              className="text-gray-600 hover:text-gray-400 ml-1 shrink-0"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
