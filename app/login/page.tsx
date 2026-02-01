"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient, type Login2FARequiredResponse } from "@/lib/api";

// Helper function to generate random star data
function generateStarData() {
  return {
    left: Math.random() * 100,
    top: Math.random() * 100,
    duration: 2 + Math.random() * 2,
    delay: Math.random() * 2,
  };
}

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [stars, setStars] = useState<Array<{ left: number; top: number; duration: number; delay: number }>>([]);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    referralCode: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // 2FA step (after password login when 2FA is enabled)
  const [step2FA, setStep2FA] = useState<{
    tempToken: string;
    methods: ("totp" | "email")[];
    user: { id: string; email: string; firstName: string; lastName: string };
  } | null>(null);
  const [twoFAMethod, setTwoFAMethod] = useState<"totp" | "email">("totp");
  const [twoFACode, setTwoFACode] = useState("");
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    // Generate random values only on client side after mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
    setStars(Array.from({ length: 30 }, generateStarData));
    setIsMounted(true);
  }, []);

  // When user chooses email 2FA, send OTP once
  useEffect(() => {
    if (!step2FA || twoFAMethod !== "email") return;
    apiClient.send2FAEmailOTP(step2FA.tempToken).catch(() => {});
  }, [step2FA?.tempToken, twoFAMethod]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        // Login
        const response = await apiClient.login(formData.email, formData.password);
        if (response.success && response.data) {
          const data = response.data as Login2FARequiredResponse | { token: string; user: unknown };
          if ("requires2FA" in data && data.requires2FA && data.tempToken && data.methods?.length) {
            setStep2FA({
              tempToken: data.tempToken,
              methods: data.methods,
              user: data.user,
            });
            setTwoFAMethod(data.methods[0]);
            setTwoFACode("");
          } else if ("token" in data && data.token) {
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));
            router.push("/dashboard");
          }
        }
      } else {
        // Signup - send OTP
        if (!formData.referralCode) {
          setError("Referral code is required");
          setLoading(false);
          return;
        }
        if (!formData.firstName || !formData.lastName) {
          setError("First and last name are required");
          setLoading(false);
          return;
        }
        const response = await apiClient.sendSignupOTP(
          formData.email,
          formData.password,
          formData.referralCode,
          formData.firstName,
          formData.lastName
        );
        if (response.success) {
          // Redirect to OTP verification page
          router.push(
            `/register/verify?email=${encodeURIComponent(formData.email)}&password=${encodeURIComponent(formData.password)}&referralCode=${encodeURIComponent(formData.referralCode)}&firstName=${encodeURIComponent(formData.firstName)}&lastName=${encodeURIComponent(formData.lastName)}`
          );
        }
      }
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!step2FA || !twoFACode.trim()) return;
    setError("");
    setTwoFALoading(true);
    try {
      const response = await apiClient.verify2FA(step2FA.tempToken, twoFACode.trim(), twoFAMethod);
      if (response.success && response.data && "token" in response.data) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid code. Please try again.");
    } finally {
      setTwoFALoading(false);
    }
  };

  const handleResendEmailOTP = async () => {
    if (!step2FA || twoFAMethod !== "email" || resendCooldown > 0) return;
    setError("");
    try {
      await apiClient.send2FAEmailOTP(step2FA.tempToken);
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
        if (resendCooldown <= 1) clearInterval(interval);
      }, 1000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to resend code.");
    }
  };

  const handleBackToLogin = () => {
    setStep2FA(null);
    setTwoFACode("");
    setError("");
  };

  return (
    <div className="min-h-screen bg-grid flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Animated stars */}
        <div className="absolute inset-0">
          {isMounted && stars.map((star, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full opacity-40"
              style={{
                left: `${star.left}%`,
                top: `${star.top}%`,
              }}
              animate={{
                opacity: [0.2, 0.6, 0.2],
                scale: [0.5, 1, 0.5],
              }}
              transition={{
                duration: star.duration,
                repeat: Infinity,
                delay: star.delay,
              }}
            />
          ))}
        </div>
        
        {/* Glow effects */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-3xl bg-blue-500/10 opacity-50" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full blur-3xl bg-cyan-500/10 opacity-30" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-4xl font-bold mb-2"
            >
              <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
               JINMA BTC/USDT
              </span>
              <br />
              <span className="text-white/90">Marketplace</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-zinc-400 text-sm mt-2"
            >
              {isLogin ? "Welcome back! Sign in to continue" : "Create your account to start trading"}
            </motion.p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl"
            >
              <p className="text-red-400 text-sm">{error}</p>
            </motion.div>
          )}

          {/* 2FA step */}
          {step2FA ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              <p className="text-zinc-300 text-sm">
                Two-factor authentication is enabled. Enter the code from your {step2FA.methods.length > 1 ? "chosen method" : step2FA.methods[0] === "totp" ? "authenticator app" : "email"}.
              </p>
              {step2FA.methods.length > 1 && (
                <div className="flex gap-2 p-2 bg-white/5 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setTwoFAMethod("totp")}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                      twoFAMethod === "totp" ? "bg-blue-500/20 text-blue-400" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Authenticator app
                  </button>
                  <button
                    type="button"
                    onClick={() => setTwoFAMethod("email")}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                      twoFAMethod === "email" ? "bg-blue-500/20 text-blue-400" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Send code to email
                  </button>
                </div>
              )}
              {twoFAMethod === "email" && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Code sent to your email</span>
                  <button
                    type="button"
                    onClick={handleResendEmailOTP}
                    disabled={resendCooldown > 0}
                    className="text-blue-400 hover:text-blue-300 disabled:text-zinc-500 disabled:cursor-not-allowed"
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                  </button>
                </div>
              )}
              <form onSubmit={handleVerify2FA} className="space-y-4">
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={twoFACode}
                  onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  disabled={twoFALoading}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-center text-xl tracking-[0.5em] placeholder-zinc-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleBackToLogin}
                    className="flex-1 py-3 rounded-xl border border-white/20 text-zinc-300 hover:bg-white/5 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={twoFALoading || twoFACode.length !== 6}
                    className="flex-1 btn-primary rounded-xl py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {twoFALoading ? "Verifying..." : "Verify"}
                  </button>
                </div>
              </form>
            </motion.div>
          ) : (
          <>
          {/* Toggle between Login and Signup */}
          <div className="flex gap-2 mb-6 bg-white/5 rounded-xl p-1">
            <button
              onClick={() => {
                setIsLogin(true);
                setError("");
              }}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
                isLogin
                  ? "bg-blue-500/20 text-blue-400 shadow-lg shadow-blue-500/20"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                setError("");
              }}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
                !isLogin
                  ? "bg-blue-500/20 text-blue-400 shadow-lg shadow-blue-500/20"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-3"
              >
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-zinc-300 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 disabled:opacity-50"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-zinc-300 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 disabled:opacity-50"
                    placeholder="Doe"
                  />
                </div>
              </motion.div>
            )}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 disabled:opacity-50"
                placeholder="your@email.com"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 disabled:opacity-50"
                placeholder="••••••••"
                minLength={6}
              />
            </motion.div>

            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <label htmlFor="referralCode" className="block text-sm font-medium text-zinc-300 mb-2">
                  Referral Code <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="referralCode"
                  name="referralCode"
                  value={formData.referralCode}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 uppercase disabled:opacity-50"
                  placeholder="Enter referral code"
                />
                <p className="text-xs text-zinc-500 mt-1">
                  A valid referral code is required to sign up
                </p>
              </motion.div>
            )}

            {isLogin && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex items-center justify-between text-sm"
              >
                <label className="flex items-center text-zinc-400 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mr-2 w-4 h-4 rounded bg-white/5 border-white/10 text-blue-500 focus:ring-blue-500/20"
                  />
                  Remember me
                </label>
                <Link
                  href="/forgot-password"
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Forgot password?
                </Link>
              </motion.div>
            )}

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              type="submit"
              disabled={loading}
              className="btn-primary w-full rounded-xl px-6 py-4 font-semibold text-center transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? "Processing..." : isLogin ? "Sign In" : "Create Account"}
            </motion.button>
          </form>
          </>
          )}

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-6 text-center text-sm text-zinc-400"
          >
            {isLogin ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  onClick={() => setIsLogin(false)}
                  className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => setIsLogin(true)}
                  className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                >
                  Sign in
                </button>
              </>
            )}
          </motion.div>

          {/* Back to home */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-4 text-center"
          >
            <Link
              href="/"
              className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              ← Back to home
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
