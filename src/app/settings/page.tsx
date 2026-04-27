import Link from "next/link";
import { ArrowLeft, HardDrive, FileText, Bell } from "lucide-react";
import NotificationToggle from "@/components/NotificationToggle";
import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { SupportButton } from "@/components/support-button";
import AppearanceSettings from "@/components/settings/AppearanceSettings";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch storage stats
  const { data: storage } = await supabase
    .from('user_storage')
    .select('total_bytes, file_count')
    .eq('user_id', user.id)
    .single();

  const usedBytes = storage?.total_bytes || 0;
  const usedMB = (usedBytes / (1024 * 1024)).toFixed(1);
  const maxMB = 500;
  const percentUsed = (usedBytes / (maxMB * 1024 * 1024)) * 100;
  const fileCount = storage?.file_count || 0;

  // Color coding for storage usage
  const getStorageColor = () => {
    if (percentUsed >= 90) return "text-red-500";
    if (percentUsed >= 70) return "text-yellow-500";
    return "text-green-500";
  };

  const getStorageBgColor = () => {
    if (percentUsed >= 90) return "bg-red-500";
    if (percentUsed >= 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/dashboard" className="text-[#F97316] hover:text-[#EA580C] flex items-center gap-2 mb-6">
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>

        <h1 className="text-2xl font-bold text-[color:var(--text-primary)] mb-8">Settings</h1>

        {/* Storage Quota Section */}
        <div className="bg-[color:var(--bg-secondary)] border border-[color:var(--border-primary)] rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-[color:var(--text-primary)] mb-4 flex items-center gap-2">
            <HardDrive size={20} className="text-[#F97316]" />
            Storage Usage
          </h2>

          <div className="space-y-4">
            {/* Storage progress bar */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-[color:var(--text-secondary)]">Storage</span>
                <span className={`text-sm font-semibold ${getStorageColor()}`}>
                  {usedMB} MB / {maxMB} MB ({percentUsed.toFixed(0)}%)
                </span>
              </div>
              <div className="w-full bg-[color:var(--bg-tertiary)] rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-2.5 rounded-full transition-all ${getStorageBgColor()}`}
                  style={{ width: `${Math.min(percentUsed, 100)}%` }}
                />
              </div>
            </div>

            {/* File count */}
            <div className="flex items-center gap-2 text-[color:var(--text-secondary)]">
              <FileText size={16} />
              <span className="text-sm">
                {fileCount} {fileCount === 1 ? 'project' : 'projects'} uploaded
              </span>
            </div>

            {/* Upload limits info */}
            <div className="mt-6 p-4 bg-[var(--bg-primary)] border border-[color:var(--border-primary)] rounded">
              <h3 className="text-sm font-semibold text-[color:var(--text-primary)] mb-2">Upload Limits</h3>
              <ul className="text-xs text-[color:var(--text-secondary)] space-y-1">
                <li>• Maximum file size: <span className="text-[color:var(--text-primary)]">100 MB</span></li>
                <li>• Daily uploads: <span className="text-[color:var(--text-primary)]">50 files/day</span></li>
                <li>• Monthly uploads: <span className="text-[color:var(--text-primary)]">50 files/month</span></li>
                <li>• Total storage: <span className="text-[color:var(--text-primary)]">500 MB</span></li>
              </ul>
            </div>

            {percentUsed >= 80 && (
              <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded text-sm text-yellow-200">
                ⚠️ Storage is {percentUsed.toFixed(0)}% full. Delete old projects to free up space.
              </div>
            )}
          </div>
        </div>

        {/* Appearance — Theme & Language */}
        <div className="bg-[color:var(--bg-secondary)] border border-[color:var(--border-primary)] rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-[color:var(--text-primary)] mb-4 flex items-center gap-2">
            <span className="text-[#F97316]">🎨</span>
            Appearance
          </h2>
          <AppearanceSettings />
        </div>
        {/* Push Notifications Section */}
        <div className="bg-[color:var(--bg-secondary)] border border-[color:var(--border-primary)] rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-[color:var(--text-primary)] mb-4 flex items-center gap-2">
            <Bell size={20} className="text-[#F97316]" />
            Notifications
          </h2>
          <NotificationToggle />
        </div>

        {/* Account section placeholder */}
        <div className="bg-[color:var(--bg-secondary)] border border-[color:var(--border-primary)] rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-[color:var(--text-primary)] mb-2">Account</h2>
          <p className="text-sm text-[color:var(--text-secondary)]">Additional account settings coming soon.</p>
        </div>

        {/* Support Section */}
        <div className="bg-[color:var(--bg-secondary)] border border-[color:var(--border-primary)] rounded-lg p-6">
          <h2 className="text-lg font-semibold text-[color:var(--text-primary)] mb-2">Need Help?</h2>
          <p className="text-[color:var(--text-secondary)] text-sm mb-4">
            Having trouble or found a bug? Send us an email and we'll help you out.
          </p>
          <SupportButton context="Settings page" />
        </div>
      </div>
    </div>
  );
}
