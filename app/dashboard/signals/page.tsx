// "use client";

// import { useState } from "react";
// import { motion } from "framer-motion";
// import Link from "next/link";
// import DashboardNavbar from "@/components/DashboardNavbar";

// export default function SignalsPage() {
//   const [activeTab, setActiveTab] = useState<"daily" | "referral">("daily");

//   // Mock data
//   const dailyCoupons = [
//     { id: 1, time: "9:00 AM GMT", type: "Morning Coupon", status: "available", code: "MORN-2024-001" },
//     { id: 2, time: "7:00 PM GMT", type: "Evening Coupon", status: "available", code: "EVE-2024-001" },
//     { id: 3, time: "7:00 PM GMT", type: "Evening Coupon", status: "available", code: "EVE-2024-002" },
//   ];

//   const referralCoupons = [
//     { id: 1, amount: "$550", status: "available", expires: "2 days", code: "REF-2024-001" },
//     { id: 2, amount: "$1200", status: "available", expires: "3 days", code: "REF-2024-002" },
//     { id: 3, amount: "$5000", status: "pending", expires: "5 days", code: "REF-2024-003" },
//   ];

//   const usedCoupons = [
//     { id: 1, code: "MORN-2024-000", result: "+$125.50", date: "Today, 9:15 AM", status: "profit" },
//     { id: 2, code: "EVE-2024-000", result: "-$200.00", date: "Yesterday, 7:20 PM", status: "loss" },
//   ];

//   return (
//     <>
//       <DashboardNavbar />
//       <div className="min-h-screen bg-grid pt-24 pb-8 px-4">
//       <div className="max-w-7xl mx-auto">
//         <motion.div
//           initial={{ opacity: 0, y: -20 }}
//           animate={{ opacity: 1, y: 0 }}
//           className="mb-8"
//         >
//           <Link
//             href="/dashboard"
//             className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block transition-colors"
//           >
//             ← Back to Dashboard
//           </Link>
//           <h1 className="text-3xl md:text-4xl font-bold mb-2">
//             <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
//               Trading Signals
//             </span>
//           </h1>
//           <p className="text-zinc-400">Manage your daily and referral signals</p>
//         </motion.div>

//         {/* Tabs */}
//         <div className="flex gap-2 mb-6 bg-white/5 rounded-xl p-1 max-w-md">
//           <button
//             onClick={() => setActiveTab("daily")}
//             className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
//               activeTab === "daily"
//                 ? "bg-blue-500/20 text-blue-400 shadow-lg shadow-blue-500/20"
//                 : "text-zinc-400 hover:text-white"
//             }`}
//           >
//             Daily Signals
//           </button>
//           <button
//             onClick={() => setActiveTab("referral")}
//             className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
//               activeTab === "referral"
//                 ? "bg-blue-500/20 text-blue-400 shadow-lg shadow-blue-500/20"
//                 : "text-zinc-400 hover:text-white"
//             }`}
//           >
//             Referral Signals
//           </button>
//         </div>

//         {/* Daily Signals Tab */}
//         {activeTab === "daily" && (
//           <div className="space-y-6">
//             {/* Available Signals */}
//             <motion.div
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl"
//             >
//               <h2 className="text-xl font-semibold text-white mb-4">Available Signals</h2>
//               <div className="space-y-3">
//                 {dailyCoupons.map((coupon) => (
//                   <div
//                     key={coupon.id}
//                     className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10"
//                   >
//                     <div className="flex-1">
//                       <div className="flex items-center gap-3 mb-2">
//                         <span className="text-2xl">🎫</span>
//                         <div>
//                           <p className="text-white font-medium">{coupon.type}</p>
//                           <p className="text-zinc-400 text-sm">{coupon.time}</p>
//                         </div>
//                       </div>
//                       <div className="flex items-center gap-2 mt-2">
//                         <code className="text-xs bg-white/10 px-2 py-1 rounded text-blue-300 font-mono">
//                           {coupon.code}
//                         </code>
//                         <span className="text-xs text-green-400 bg-green-500/20 px-2 py-1 rounded">
//                           Available
//                         </span>
//                       </div>
//                     </div>
//                     <Link
//                       href={`/dashboard/trade?coupon=${coupon.code}`}
//                       className="btn-primary rounded-lg px-4 py-2 text-sm font-medium transition-all duration-300 hover:scale-105"
//                     >
//                       Use Signals
//                     </Link>
//                   </div>
//                 ))}
//               </div>
//             </motion.div>

//             {/* Schedule Info */}
//             <motion.div
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.1 }}
//               className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6"
//             >
//               <h3 className="text-lg font-semibold text-blue-300 mb-3">📅 Daily Schedule</h3>
//               <div className="space-y-2 text-sm text-blue-400/80">
//                 <div className="flex items-center justify-between">
//                   <span>9:00 AM GMT</span>
//                   <span>1 signal (after 15-min training)</span>
//                 </div>
//                 <div className="flex items-center justify-between">
//                   <span>7:00 PM GMT</span>
//                   <span>2 signals (direct confirmation)</span>
//                 </div>
//                 <div className="flex items-center justify-between">
//                   <span>3:00 PM GMT</span>
//                   <span>Referral signals (if available)</span>
//                 </div>
//               </div>
//             </motion.div>
//           </div>
//         )}

//         {/* Referral Signals Tab */}
//         {activeTab === "referral" && (
//           <div className="space-y-6">
//             <motion.div
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl"
//             >
//               <h2 className="text-xl font-semibold text-white mb-4">Referral Signals</h2>
//               <div className="space-y-3">
//                 {referralCoupons.map((coupon) => (
//                   <div
//                     key={coupon.id}
//                     className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10"
//                   >
//                     <div className="flex-1">
//                       <div className="flex items-center gap-3 mb-2">
//                         <span className="text-2xl">🎁</span>
//                         <div>
//                           <p className="text-white font-medium">Referral Bonus</p>
//                           <p className="text-zinc-400 text-sm">From referral: {coupon.amount}</p>
//                         </div>
//                       </div>
//                       <div className="flex items-center gap-2 mt-2">
//                         <code className="text-xs bg-white/10 px-2 py-1 rounded text-cyan-300 font-mono">
//                           {coupon.code}
//                         </code>
//                         <span className={`text-xs px-2 py-1 rounded ${
//                           coupon.status === "available"
//                             ? "text-green-400 bg-green-500/20"
//                             : "text-yellow-400 bg-yellow-500/20"
//                         }`}>
//                           {coupon.status === "available" ? "Available" : "Pending"}
//                         </span>
//                         <span className="text-xs text-zinc-500">Expires in {coupon.expires}</span>
//                       </div>
//                     </div>
//                     {coupon.status === "available" && (
//                       <Link
//                         href={`/dashboard/trade?coupon=${coupon.code}`}
//                         className="btn-primary rounded-lg px-4 py-2 text-sm font-medium transition-all duration-300 hover:scale-105"
//                       >
//                         Use Signal
//                       </Link>
//                     )}
//                   </div>
//                 ))}
//               </div>
//             </motion.div>

//             {/* Referral Info */}
//             <motion.div
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.1 }}
//               className="bg-cyan-500/10 border border-cyan-500/20 rounded-2xl p-6"
//             >
//               <h3 className="text-lg font-semibold text-cyan-300 mb-3">💎 Referral Signal Tiers</h3>
//               <div className="space-y-2 text-sm text-cyan-400/80">
//                 <div className="flex items-center justify-between">
//                   <span>$550 - $1,250</span>
//                   <span>6 signals (3/day for 2 days)</span>
//                 </div>
//                 <div className="flex items-center justify-between">
//                   <span>$3,000 - $10,000</span>
//                   <span>15 signals (3/day for 5 days)</span>
//                 </div>
//                 <p className="text-xs text-cyan-500/60 mt-3">
//                   Signals are issued at 3 PM GMT and can be accumulated over time.
//                 </p>
//               </div>
//             </motion.div>
//           </div>
//         )}

//         {/* Used Coupons History */}
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ delay: 0.2 }}
//           className="mt-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl"
//         >
//           <h2 className="text-xl font-semibold text-white mb-4">Recent Trades</h2>
//           <div className="space-y-3">
//             {usedCoupons.map((coupon) => (
//               <div
//                 key={coupon.id}
//                 className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10"
//               >
//                 <div className="flex items-center gap-3">
//                   <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
//                     coupon.status === "profit" ? "bg-green-500/20" : "bg-red-500/20"
//                   }`}>
//                     <span className="text-lg">
//                       {coupon.status === "profit" ? "📈" : "📉"}
//                     </span>
//                   </div>
//                   <div>
//                     <p className="text-white text-sm font-medium">{coupon.code}</p>
//                     <p className="text-zinc-400 text-xs">{coupon.date}</p>
//                   </div>
//                 </div>
//                 <p className={`font-semibold ${
//                   coupon.status === "profit" ? "text-green-400" : "text-red-400"
//                 }`}>
//                   {coupon.result}
//                 </p>
//               </div>
//             ))}
//           </div>
//         </motion.div>
//       </div>
//     </div>
//     </>
//   );
// }

import ComingSoon from '@/components/ComingSoon';
import DashboardNavbar from '@/components/DashboardNavbar';
import DashboardFooter from '@/components/DashboardFooter';

const page = () => {
  return (
<>
<DashboardNavbar />
<ComingSoon />
<DashboardFooter/>
</>
  )
}

export default page


// return <ComingSoon />;  