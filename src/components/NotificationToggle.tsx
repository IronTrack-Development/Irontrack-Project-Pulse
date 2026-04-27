'use client';

import { useEffect, useState } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import {
  registerPushNotifications,
  unregisterPushNotifications,
  getNotificationStatus,
  isPushSubscribed,
} from '@/lib/notifications';

export default function NotificationToggle() {
  const [supported, setSupported] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      setLoading(true);
      const status = await getNotificationStatus();
      if (status === 'unsupported') {
        setSupported(false);
        setLoading(false);
        return;
      }
      if (status === 'denied') {
        setPermissionDenied(true);
        setEnabled(false);
        setLoading(false);
        return;
      }
      const subscribed = await isPushSubscribed();
      setEnabled(subscribed && status === 'granted');
      setLoading(false);
    }
    init();
  }, []);

  const handleToggle = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      if (enabled) {
        await unregisterPushNotifications();
        setEnabled(false);
      } else {
        const success = await registerPushNotifications();
        if (success) {
          setEnabled(true);
        } else {
          const status = await getNotificationStatus();
          if (status === 'denied') {
            setPermissionDenied(true);
          } else {
            setErrorMsg('Failed to enable notifications. Please try again.');
          }
        }
      }
    } catch (err) {
      setErrorMsg('Something went wrong. Please try again.');
      console.error('[NotificationToggle] error:', err);
    }
    setLoading(false);
  };

  if (!supported) {
    return (
      <div className="flex items-start gap-3 p-4 bg-[var(--bg-primary)] border border-[color:var(--border-primary)] rounded-lg">
        <BellOff size={18} className="text-gray-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm text-[color:var(--text-muted)]">
            Push notifications are not supported in your browser.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toggle row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {enabled ? (
            <Bell size={18} className="text-[#F97316] shrink-0" />
          ) : (
            <BellOff size={18} className="text-[color:var(--text-muted)] shrink-0" />
          )}
          <div>
            <p className="text-sm font-medium text-[color:var(--text-primary)]">Push Notifications</p>
            <p className="text-xs mt-0.5">
              {loading ? (
                <span className="text-[color:var(--text-muted)]">Checking status…</span>
              ) : enabled ? (
                <span className="text-green-400">Enabled</span>
              ) : (
                <span className="text-[color:var(--text-muted)]">Disabled</span>
              )}
            </p>
          </div>
        </div>

        {/* Toggle switch */}
        <button
          onClick={handleToggle}
          disabled={loading || permissionDenied}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed ${
            enabled ? 'bg-[#F97316]' : 'bg-gray-700'
          }`}
          aria-label={enabled ? 'Disable notifications' : 'Enable notifications'}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
          {loading && (
            <span className="absolute inset-0 flex items-center justify-center">
              <Loader2 size={12} className="animate-spin text-[color:var(--text-primary)]" />
            </span>
          )}
        </button>
      </div>

      {/* Description */}
      <p className="text-xs text-[color:var(--text-muted)] leading-relaxed">
        Get notified when inspections are approaching with incomplete predecessors, or when
        activities fall behind schedule.
      </p>

      {/* Permission denied warning */}
      {permissionDenied && (
        <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <p className="text-xs text-yellow-300">
            <strong>Notifications blocked.</strong> To enable, click the lock icon in your
            browser's address bar and allow notifications for this site, then reload the page.
          </p>
        </div>
      )}

      {/* Error message */}
      {errorMsg && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-xs text-red-300">{errorMsg}</p>
        </div>
      )}
    </div>
  );
}
