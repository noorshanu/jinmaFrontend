"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import DashboardNavbar from "@/components/DashboardNavbar";
import { apiClient, GradeStatusResponse, GradeRequest, SalaryPayment } from "@/lib/api";

export default function GradesPage() {
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  
  const [gradeStatus, setGradeStatus] = useState<GradeStatusResponse | null>(null);
  const [requestHistory, setRequestHistory] = useState<GradeRequest[]>([]);
  const [salaryHistory, setSalaryHistory] = useState<SalaryPayment[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "requests" | "salary">("overview");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [statusRes, requestsRes, salaryRes] = await Promise.all([
        apiClient.getGradeStatus(),
        apiClient.getGradeRequestHistory(),
        apiClient.getSalaryHistory()
      ]);

      if (statusRes.success && statusRes.data) {
        setGradeStatus(statusRes.data);
      }
      if (requestsRes.success && requestsRes.data) {
        setRequestHistory(requestsRes.data.requests);
      }
      if (salaryRes.success && salaryRes.data) {
        setSalaryHistory(salaryRes.data.payments);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load grade data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRequestUpgrade = async () => {
    if (!gradeStatus?.canUpgrade) return;
    
    setRequesting(true);
    setError("");
    try {
      const res = await apiClient.requestGradeUpgrade();
      if (res.success) {
        setSuccessMessage("Upgrade request submitted successfully! Admin will review your request.");
        fetchData();
        setTimeout(() => setSuccessMessage(""), 5000);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit upgrade request");
    } finally {
      setRequesting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
      case "APPROVED": return "text-green-400 bg-green-400/10 border-green-400/20";
      case "REJECTED": return "text-red-400 bg-red-400/10 border-red-400/20";
      case "PAID": return "text-green-400 bg-green-400/10 border-green-400/20";
      default: return "text-zinc-400 bg-zinc-400/10 border-zinc-400/20";
    }
  };

  // Calculate progress to next grade
  const calculateProgress = () => {
    if (!gradeStatus || !gradeStatus.nextGradeMinTurnover) return 100;
    
    const currentGradeConfig = gradeStatus.grades.find(g => g.isCurrent);
    if (!currentGradeConfig) return 0;
    
    const currentMin = currentGradeConfig.minTurnover;
    const nextMin = gradeStatus.nextGradeMinTurnover;
    const turnover = gradeStatus.personalTurnover;
    
    if (turnover >= nextMin) return 100;
    if (turnover <= currentMin) return 0;
    
    return ((turnover - currentMin) / (nextMin - currentMin)) * 100;
  };

  // Loading state
  if (loading) {
    return (
      <>
        <DashboardNavbar />
        <div className="min-h-screen bg-grid pt-24 pb-8 px-4 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-zinc-400">Loading your grade information...</p>
          </motion.div>
        </div>
      </>
    );
  }

  // Error state when no data could be loaded
  if (!gradeStatus && error) {
    return (
      <>
        <DashboardNavbar />
        <div className="min-h-screen bg-grid pt-24 pb-8 px-4 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md mx-auto"
          >
            <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🔄</span>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Connection Issue
            </h2>
            <p className="text-zinc-400 mb-6">
              We&apos;re having trouble connecting to the server. This is usually temporary - please try again in a moment.
            </p>
            <button
              onClick={fetchData}
              className="px-6 py-3 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors"
            >
              Try Again
            </button>
            <Link
              href="/dashboard"
              className="block mt-4 text-zinc-500 hover:text-zinc-400 text-sm transition-colors"
            >
              ← Back to Dashboard
            </Link>
          </motion.div>
        </div>
      </>
    );
  }

  return (
    <>
      <DashboardNavbar />
      <div className="min-h-screen bg-grid pt-24 pb-8 px-4">
        <div className="max-w-7xl mx-auto">
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
                Grades & Salary
              </span>
            </h1>
            <p className="text-zinc-400">Track your progress and monthly salary</p>
          </motion.div>

          {/* Messages */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-6 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">⚠️</span>
                    <p className="text-orange-400">{error}</p>
                  </div>
                  <button
                    onClick={() => {
                      setError("");
                      fetchData();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-orange-500/20 text-orange-400 text-sm font-medium hover:bg-orange-500/30 transition-colors whitespace-nowrap"
                  >
                    Retry
                  </button>
                </div>
              </motion.div>
            )}
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">✅</span>
                  <p className="text-green-400">{successMessage}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {gradeStatus && (
            <>
              {/* Current Status */}
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl"
                >
                  <p className="text-zinc-400 text-sm mb-1">Current Grade</p>
                  <p className="text-3xl font-bold text-white mb-2">{gradeStatus.currentGrade}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">⭐</span>
                    <span className="text-zinc-400 text-sm">
                      {gradeStatus.salaryStartDate ? "Active" : "No salary yet"}
                    </span>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl"
                >
                  <p className="text-zinc-400 text-sm mb-1">Personal Turnover</p>
                  <p className="text-3xl font-bold text-white">
                    {formatCurrency(gradeStatus.personalTurnover)}
                  </p>
                  <p className="text-zinc-500 text-xs mt-1">From direct referrals</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl"
                >
                  <p className="text-zinc-400 text-sm mb-1">Monthly Salary</p>
                  <p className="text-3xl font-bold text-green-400">
                    {formatCurrency(gradeStatus.currentSalary)}
                  </p>
                  <p className="text-zinc-500 text-xs mt-1">Paid on 1st of each month</p>
                </motion.div>
              </div>

              {/* Progress to Next Grade */}
              {gradeStatus.nextGrade && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl mb-8"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-white mb-1">
                        Progress to {gradeStatus.nextGrade}
                      </h2>
                      <p className="text-zinc-400 text-sm">
                        {formatCurrency(gradeStatus.personalTurnover)} / {formatCurrency(gradeStatus.nextGradeMinTurnover || 0)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-400">{Math.round(calculateProgress())}%</p>
                      <p className="text-zinc-500 text-xs">Complete</p>
                    </div>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-3 mb-4">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-cyan-400 h-3 rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min(calculateProgress(), 100)}%` }}
                    />
                  </div>

                  {/* Eligibility Status */}
                  {gradeStatus.canUpgrade && !gradeStatus.hasPendingRequest && (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-4">
                      <p className="text-sm text-green-300 mb-3">
                        🎉 You are eligible for <strong>{gradeStatus.eligibleGrade}</strong> grade! 
                        Monthly salary: <strong>{formatCurrency(gradeStatus.eligibleSalary)}</strong>
                      </p>
                      <button
                        onClick={handleRequestUpgrade}
                        disabled={requesting}
                        className="w-full py-3 px-4 rounded-xl bg-green-500 text-white font-semibold hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {requesting ? "Submitting..." : "Request Grade Upgrade"}
                      </button>
                    </div>
                  )}

                  {gradeStatus.hasPendingRequest && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-4">
                      <p className="text-sm text-yellow-300">
                        ⏳ Your upgrade request to <strong>{gradeStatus.pendingRequestGrade}</strong> is pending admin approval.
                      </p>
                    </div>
                  )}

                  {!gradeStatus.canUpgrade && gradeStatus.nextGradeMinTurnover && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                      <p className="text-sm text-blue-300">
                        You need <strong>{formatCurrency((gradeStatus.nextGradeMinTurnover || 0) - gradeStatus.personalTurnover)}</strong> more in personal turnover to qualify for {gradeStatus.nextGrade}
                      </p>
                      <p className="text-xs text-blue-400/70 mt-1">
                        Next grade salary: <strong>{formatCurrency(gradeStatus.nextGradeSalary || 0)}/month</strong>
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Tabs */}
              <div className="flex gap-2 mb-6 overflow-x-auto">
                {(["overview", "requests", "salary"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                      activeTab === tab
                        ? "bg-blue-500 text-white"
                        : "bg-white/5 text-zinc-400 hover:bg-white/10"
                    }`}
                  >
                    {tab === "overview" && "All Grades"}
                    {tab === "requests" && `Requests (${requestHistory.length})`}
                    {tab === "salary" && `Salary History (${salaryHistory.length})`}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              {activeTab === "overview" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl"
                >
                  <h2 className="text-xl font-semibold text-white mb-4">All Grades</h2>
                  <div className="space-y-3">
                    {gradeStatus.grades.map((grade) => (
                      <div
                        key={grade.name}
                        className={`p-4 rounded-xl border ${
                          grade.isCurrent
                            ? "bg-blue-500/20 border-blue-500/50"
                            : grade.isUnlocked
                            ? "bg-green-500/10 border-green-500/30"
                            : grade.isEligible
                            ? "bg-yellow-500/10 border-yellow-500/30"
                            : "bg-white/5 border-white/10"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                              grade.isCurrent
                                ? "bg-blue-500/30"
                                : grade.isUnlocked
                                ? "bg-green-500/30"
                                : grade.isEligible
                                ? "bg-yellow-500/30"
                                : "bg-zinc-500/20"
                            }`}>
                              <span className="text-xl">
                                {grade.isCurrent ? "⭐" : grade.isUnlocked ? "✅" : grade.isEligible ? "🔓" : "🔒"}
                              </span>
                            </div>
                            <div>
                              <p className="text-white font-semibold text-lg">{grade.name}</p>
                              <p className="text-zinc-400 text-sm">
                                Turnover: {formatCurrency(grade.minTurnover)}+
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-bold text-xl">
                              {formatCurrency(grade.salary)}/month
                            </p>
                            {grade.isCurrent && (
                              <p className="text-blue-400 text-xs mt-1">Current</p>
                            )}
                            {!grade.isCurrent && grade.isEligible && !grade.isUnlocked && (
                              <p className="text-yellow-400 text-xs mt-1">Eligible</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === "requests" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl"
                >
                  <h2 className="text-xl font-semibold text-white mb-4">Upgrade Request History</h2>
                  {requestHistory.length === 0 ? (
                    <p className="text-zinc-500 text-center py-8">No upgrade requests yet</p>
                  ) : (
                    <div className="space-y-3">
                      {requestHistory.map((request) => (
                        <div
                          key={request.id}
                          className="p-4 rounded-xl bg-white/5 border border-white/10"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="text-white font-medium">
                                {request.currentGrade} → {request.requestedGrade}
                              </p>
                              <p className="text-zinc-500 text-xs">
                                Turnover: {formatCurrency(request.personalTurnover)} / {formatCurrency(request.requiredTurnover)}
                              </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                              {request.status}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-zinc-500">
                            <span>Requested: {formatDate(request.requestedAt)}</span>
                            {request.processedAt && (
                              <span>Processed: {formatDate(request.processedAt)}</span>
                            )}
                          </div>
                          {request.adminNote && (
                            <p className="mt-2 text-sm text-zinc-400 bg-white/5 rounded-lg p-2">
                              Admin note: {request.adminNote}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === "salary" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl"
                >
                  <h2 className="text-xl font-semibold text-white mb-4">Salary Payment History</h2>
                  {salaryHistory.length === 0 ? (
                    <p className="text-zinc-500 text-center py-8">No salary payments yet</p>
                  ) : (
                    <div className="space-y-3">
                      {salaryHistory.map((payment) => (
                        <div
                          key={payment.id}
                          className="p-4 rounded-xl bg-white/5 border border-white/10"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-white font-medium">
                                {new Date(payment.year, payment.month - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                              </p>
                              <p className="text-zinc-500 text-xs">Grade: {payment.grade}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-green-400 font-bold">{formatCurrency(payment.amount)}</p>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(payment.status)}`}>
                                {payment.status}
                              </span>
                            </div>
                          </div>
                          {payment.paidAt && (
                            <p className="mt-2 text-xs text-zinc-500">
                              Paid on: {formatDate(payment.paidAt)}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Info Box */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-6 bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6"
              >
                <h3 className="text-lg font-semibold text-blue-300 mb-3">📋 How Grades Work</h3>
                <ul className="text-sm text-blue-400/80 space-y-2 list-disc list-inside">
                  <li>Personal turnover is calculated from your direct referrals&apos; first transfer to Movement Account</li>
                  <li>Minimum turnover of $20,000 is required to start earning salary</li>
                  <li>When eligible, click &quot;Request Grade Upgrade&quot; for admin approval</li>
                  <li>Once approved, monthly salary is paid on the 1st of each month to your Main Account</li>
                  <li>Higher grades provide higher monthly salaries</li>
                </ul>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
