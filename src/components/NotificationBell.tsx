'use client';

import { useEffect, useState } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { useTranslation } from "@/lib/i18n";

const { t } = useTranslation();

export default function NotificationBell({ projectId }: { projectId: string }) {
  const [enabled, setEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    async function check() {
      // Check if notifications are supported
      if (!('Notification' in window) || !('serviceWorker' in navigator)) {
        setEnabled(null);
        return;
      }

      if (Notification.permission === 'granted') {
        setEnabled(true);
        return;
      }

      if (Notification.permission === 'denied') {
        setEnabled(false);
        return;
      }

      // Permission is 'default' — auto-request on first visit
      try {
        const result = await Notification.requestPermission();
        setEnabled(result === 'granted');
      } catch {
        setEnabled(false);
      }
    }
    check();
  }, []);

  // Don't render if notifications not supported
  if (enabled === null) return null;

  const handleClick = async () => {
    if (enabled) return; // Already enabled

    if (Notification.permission === 'denied') {
      // Can't re-request — tell user to fix in browser settings
      alert(t('ui.notifications.are.blocked.enable.them.in.your.browser.settings.for'));
      return;
    }

    try {
      const result = await Notification.requestPermission();
      setEnabled(result === 'granted');
    } catch {
      // Silently fail
    }
  };

  return (
    <button
      onClick={handleClick}
      title={enabled ? t('ui.notifications.on') : t('ui.turn.on.notifications')}
      className={`p-2.5 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center ${
        enabled
          ? 'bg-[var(--bg-tertiary)] text-[#F97316] hover:bg-[var(--bg-hover)]'
          : 'bg-[var(--bg-tertiary)] text-gray-600 hover:bg-[var(--bg-hover)] hover:text-[color:var(--text-secondary)]'
      }`}
    >
      {enabled ? <Bell size={16} /> : <BellOff size={16} />}
    </button>
  );
}
