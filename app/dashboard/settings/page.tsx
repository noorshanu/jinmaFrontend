"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import DashboardNavbar from "@/components/DashboardNavbar";
import { apiClient, type TwoFAStatusResponse, type TOTPSetupResponse } from "@/lib/api";

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

  // 2FA state
  const [twoFAStatus, setTwoFAStatus] = useState<TwoFAStatusResponse | null>(null);
  const [twoFALoading, setTwoFALoading] = useState(true);
  const [totpSetup, setTotpSetup] = useState<TOTPSetupResponse | null>(null);
  const [totpVerifyCode, setTotpVerifyCode] = useState("");
  const [totpVerifying, setTotpVerifying] = useState(false);
  const [twoFAError, setTwoFAError] = useState("");
  const [twoFASuccess, setTwoFASuccess] = useState("");
  const [disable2FAPassword, setDisable2FAPassword] = useState("");
  const [disabling2FA, setDisabling2FA] = useState(false);
  const [disable2FAMethod, setDisable2FAMethod] = useState<"all" | "totp" | "email">("all");

  const fetch2FAStatus = async () => {
    setTwoFALoading(true);
    setTwoFAError("");
    try {
      const res = await apiClient.get2FAStatus();
      if (res.success && res.data) setTwoFAStatus(res.data);
    } catch {
      setTwoFAStatus(null);
    } finally {
      setTwoFALoading(false);
    }
  };

  useEffect(() => {
    fetch2FAStatus();
  }, []);

  const handleStartTOTPSetup = async () => {
    setTwoFAError("");
    setTwoFASuccess("");
    setTotpSetup(null);
    try {
      const res = await apiClient.setupTOTP();
      if (res.success && res.data) setTotpSetup(res.data);
    } catch (err: unknown) {
      setTwoFAError(err instanceof Error ? err.message : "Failed to start setup");
    }
  };

  const handleVerifyTOTPSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!totpVerifyCode || totpVerifyCode.length !== 6) return;
    setTwoFAError("");
    setTotpVerifying(true);
    try {
      await apiClient.verifyTOTPSetup(totpVerifyCode);
      setTwoFASuccess("Authenticator app enabled.");
      setTotpSetup(null);
      setTotpVerifyCode("");
      fetch2FAStatus();
    } catch (err: unknown) {
      setTwoFAError(err instanceof Error ? err.message : "Invalid code. Try again.");
    } finally {
      setTotpVerifying(false);
    }
  };

  const handleEnableEmail2FA = async () => {
    setTwoFAError("");
    setTwoFASuccess("");
    try {
      await apiClient.enableEmail2FA();
      setTwoFASuccess("Email 2FA enabled.");
      fetch2FAStatus();
    } catch (err: unknown) {
      setTwoFAError(err instanceof Error ? err.message : "Failed to enable email 2FA");
    }
  };

  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disable2FAPassword) return;
    setTwoFAError("");
    setDisabling2FA(true);
    try {
      await apiClient.disable2FA(disable2FAPassword, disable2FAMethod);
      setTwoFASuccess("2FA disabled.");
      setDisable2FAPassword("");
      fetch2FAStatus();
    } catch (err: unknown) {
      setTwoFAError(err instanceof Error ? err.message : "Failed to disable 2FA");
    } finally {
      setDisabling2FA(false);
    }
  };

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

            {/* Two-Factor Authentication */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Two-Factor Authentication</h2>
              {twoFAError && (
                <p className="mb-3 text-sm text-red-400">{twoFAError}</p>
              )}
              {twoFASuccess && (
                <p className="mb-3 text-sm text-green-400">{twoFASuccess}</p>
              )}
              {twoFALoading ? (
                <p className="text-zinc-400 text-sm">Loading...</p>
              ) : (
                <div className="space-y-4">
                  <p className="text-zinc-400 text-sm">
                    Status: {twoFAStatus?.twoFactorEnabled ? "Enabled" : "Disabled"}
                    {twoFAStatus?.twoFactorTotpEnabled && " (Authenticator app)"}
                    {twoFAStatus?.twoFactorEmailEnabled && " (Email OTP)"}
                  </p>

                  {/* TOTP */}
                  <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3">
                    <p className="text-white font-medium">Authenticator app (TOTP)</p>
                    <p className="text-zinc-400 text-sm">Use an app like Google Authenticator or Authy</p>
                    {twoFAStatus?.twoFactorTotpEnabled ? (
                      <p className="text-sm text-green-400">Enabled</p>
                    ) : totpSetup ? (
                      <div className="space-y-3">
                        <p className="text-zinc-400 text-sm">Scan the QR code with your app, then enter the 6-digit code below.</p>
                        {totpSetup.qrCode && (
                          <div className="inline-block p-2 bg-white rounded-lg">
                            <img src={totpSetup.qrCode} alt="QR code" className="w-40 h-40" />
                          </div>
                        )}
                        <form onSubmit={handleVerifyTOTPSetup} className="flex gap-2 items-center">
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            value={totpVerifyCode}
                            onChange={(e) => setTotpVerifyCode(e.target.value.replace(/\D/g, ""))}
                            placeholder="000000"
                            disabled={totpVerifying}
                            className="w-28 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-center tracking-widest"
                          />
                          <button
                            type="submit"
                            disabled={totpVerifying || totpVerifyCode.length !== 6}
                            className="btn-primary rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
                          >
                            {totpVerifying ? "Verifying..." : "Verify & Enable"}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setTotpSetup(null); setTotpVerifyCode(""); }}
                            className="text-zinc-400 hover:text-white text-sm"
                          >
                            Cancel
                          </button>
                        </form>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleStartTOTPSetup}
                        className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                      >
                        Set up authenticator app
                      </button>
                    )}
                  </div>

                  {/* Email OTP */}
                  <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3">
                    <p className="text-white font-medium">Email OTP</p>
                    <p className="text-zinc-400 text-sm">Receive a one-time code by email at login</p>
                    {twoFAStatus?.twoFactorEmailEnabled ? (
                      <p className="text-sm text-green-400">Enabled</p>
                    ) : (
                      <button
                        type="button"
                        onClick={handleEnableEmail2FA}
                        className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                      >
                        Enable email 2FA
                      </button>
                    )}
                  </div>

                  {/* Disable 2FA */}
                  {twoFAStatus?.twoFactorEnabled && (
                    <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3">
                      <p className="text-white font-medium">Disable 2FA</p>
                      <p className="text-zinc-400 text-sm">Requires your password</p>
                      <form onSubmit={handleDisable2FA} className="flex flex-wrap gap-2 items-end">
                        <select
                          value={disable2FAMethod}
                          onChange={(e) => setDisable2FAMethod(e.target.value as "all" | "totp" | "email")}
                          className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                        >
                          <option value="all">Disable all 2FA</option>
                          {twoFAStatus?.twoFactorTotpEnabled && <option value="totp">Disable authenticator only</option>}
                          {twoFAStatus?.twoFactorEmailEnabled && <option value="email">Disable email only</option>}
                        </select>
                        <input
                          type="password"
                          value={disable2FAPassword}
                          onChange={(e) => setDisable2FAPassword(e.target.value)}
                          placeholder="Your password"
                          disabled={disabling2FA}
                          className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-zinc-500 w-40"
                        />
                        <button
                          type="submit"
                          disabled={disabling2FA || !disable2FAPassword}
                          className="btn-primary rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
                        >
                          {disabling2FA ? "Disabling..." : "Disable"}
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Security placeholder */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Security</h2>
              <div className="space-y-3">
                <div className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-left opacity-60">
                  <p className="text-white font-medium">API Keys</p>
                  <p className="text-zinc-400 text-sm">Manage your API access (coming soon)</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
