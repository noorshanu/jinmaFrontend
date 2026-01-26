"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import DashboardNavbar from "@/components/DashboardNavbar";
import { apiClient } from "@/lib/api";

export default function SettingsPage() {
  const [notifications, setNotifications] = useState({
    email: true,
    trades: true,
    referrals: false,
  });

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const storedEmail = useMemo(() => {
    if (typeof window === "undefined") return "user@example.com";
    try {
      const stored = window.localStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored) as { email?: string };
        return parsed.email || "user@example.com";
      }
    } catch {
      // ignore
    }
    return "user@example.com";
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Please fill in all password fields.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }

    setSavingPassword(true);
    try {
      const res = await apiClient.changePassword(currentPassword, newPassword);
      if (res.success) {
        setPasswordSuccess(res.message || "Password updated successfully.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err: any) {
      setPasswordError(err.message || "Failed to update password. Please try again.");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <>
      <DashboardNavbar />
      <div className="min-h-screen bg-grid pt-24 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Link
              href="/dashboard"
              className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block transition-colors"
            >
              ← Back to Dashboard
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                Settings
              </span>
            </h1>
            <p className="text-zinc-400">Manage your account settings</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-xl space-y-6"
          >
            {/* Profile Section */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Profile</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={storedEmail}
                    disabled
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-zinc-400 cursor-not-allowed"
                  />
                  <p className="text-xs text-zinc-500 mt-1">
                    Email cannot be changed. Contact support if you need help.
                  </p>
                </div>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                    />
                    <p className="text-xs text-zinc-500 mt-1">
                      Minimum 6 characters.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                    />
                  </div>

                  {passwordError && (
                    <p className="text-sm text-red-400">{passwordError}</p>
                  )}
                  {passwordSuccess && (
                    <p className="text-sm text-green-400">{passwordSuccess}</p>
                  )}

                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="mt-2 btn-primary rounded-xl px-6 py-3 font-semibold text-center transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingPassword ? "Updating..." : "Update Password"}
                  </button>
                </form>
              </div>
            </div>

            {/* Notifications Section */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Notifications</h2>
              <div className="space-y-3">
                {Object.entries(notifications).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10"
                  >
                    <div>
                      <p className="text-white font-medium capitalize">{key}</p>
                      <p className="text-zinc-400 text-sm">
                        {key === "email" && "Receive email notifications"}
                        {key === "trades" && "Get notified about trade results"}
                        {key === "referrals" && "Notifications for referral activities"}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setNotifications({ ...notifications, [key]: !value })
                      }
                      className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
                        value ? "bg-blue-500" : "bg-zinc-600"
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${
                          value ? "translate-x-6" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Security Section */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Security</h2>
              <div className="space-y-3">
                <button className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-left hover:bg-white/10 transition-all duration-300">
                  <p className="text-white font-medium">Two-Factor Authentication</p>
                  <p className="text-zinc-400 text-sm">Add an extra layer of security</p>
                </button>
                <button className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-left hover:bg-white/10 transition-all duration-300">
                  <p className="text-white font-medium">API Keys</p>
                  <p className="text-zinc-400 text-sm">Manage your API access</p>
                </button>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4">
              <button className="w-full btn-primary rounded-xl px-6 py-4 font-semibold text-center transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25">
                Save Changes
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
