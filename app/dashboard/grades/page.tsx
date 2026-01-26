// "use client";

// import { useState } from "react";
// import { motion } from "framer-motion";
// import Link from "next/link";
// import DashboardNavbar from "@/components/DashboardNavbar";

// export default function GradesPage() {
//   const [currentTurnover] = useState(45000);
//   const [currentGrade] = useState("Bronze");
//   const [currentSalary] = useState(0);
//   const [nextGrade] = useState("Silver");
//   const [nextTurnoverRequired] = useState(70000);
//   const [nextSalary] = useState(250);

//   const grades = [
//     { name: "Bronze", turnover: 0, salary: 0, current: currentTurnover >= 0 && currentTurnover < 20000 },
//     { name: "Silver", turnover: 20000, salary: 50, current: currentTurnover >= 20000 && currentTurnover < 70000 },
//     { name: "Gold", turnover: 70000, salary: 250, current: currentTurnover >= 70000 && currentTurnover < 300000 },
//     { name: "Platinum", turnover: 300000, salary: 1300, current: currentTurnover >= 300000 },
//   ];

//   const progress = currentTurnover >= 70000 
//     ? 100 
//     : ((currentTurnover - 20000) / (70000 - 20000)) * 100;

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
//               Grades & Salary
//             </span>
//           </h1>
//           <p className="text-zinc-400">Track your progress and monthly salary</p>
//         </motion.div>

//         {/* Current Status */}
//         <div className="grid md:grid-cols-3 gap-6 mb-8">
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl"
//           >
//             <p className="text-zinc-400 text-sm mb-1">Current Grade</p>
//             <p className="text-3xl font-bold text-white mb-2">{currentGrade}</p>
//             <div className="flex items-center gap-2">
//               <span className="text-2xl">⭐</span>
//               <span className="text-zinc-400 text-sm">Active</span>
//             </div>
//           </motion.div>

//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.1 }}
//             className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl"
//           >
//             <p className="text-zinc-400 text-sm mb-1">Personal Turnover</p>
//             <p className="text-3xl font-bold text-white">
//               ${currentTurnover.toLocaleString()}
//             </p>
//             <p className="text-zinc-500 text-xs mt-1">From direct referrals</p>
//           </motion.div>

//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.2 }}
//             className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl"
//           >
//             <p className="text-zinc-400 text-sm mb-1">Monthly Salary</p>
//             <p className="text-3xl font-bold text-green-400">
//               ${currentSalary > 0 ? currentSalary.toLocaleString() : "0"}
//             </p>
//             <p className="text-zinc-500 text-xs mt-1">Paid on 1st of each month</p>
//           </motion.div>
//         </div>

//         {/* Progress to Next Grade */}
//         {currentTurnover < 300000 && (
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.3 }}
//             className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl mb-8"
//           >
//             <div className="flex items-center justify-between mb-4">
//               <div>
//                 <h2 className="text-xl font-semibold text-white mb-1">
//                   Progress to {nextGrade}
//                 </h2>
//                 <p className="text-zinc-400 text-sm">
//                   ${currentTurnover.toLocaleString()} / ${nextTurnoverRequired.toLocaleString()}
//                 </p>
//               </div>
//               <div className="text-right">
//                 <p className="text-2xl font-bold text-blue-400">{Math.round(progress)}%</p>
//                 <p className="text-zinc-500 text-xs">Complete</p>
//               </div>
//             </div>
//             <div className="w-full bg-white/5 rounded-full h-3 mb-4">
//               <div
//                 className="bg-gradient-to-r from-blue-500 to-cyan-400 h-3 rounded-full transition-all duration-1000"
//                 style={{ width: `${Math.min(progress, 100)}%` }}
//               />
//             </div>
//             <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
//               <p className="text-sm text-blue-300">
//                 You need <strong>${(nextTurnoverRequired - currentTurnover).toLocaleString()}</strong> more in personal turnover to reach {nextGrade} grade
//               </p>
//               <p className="text-xs text-blue-400/70 mt-1">
//                 Next grade salary: <strong>${nextSalary}/month</strong>
//               </p>
//             </div>
//           </motion.div>
//         )}

//         {/* Grades List */}
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ delay: 0.4 }}
//           className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl"
//         >
//           <h2 className="text-xl font-semibold text-white mb-4">All Grades</h2>
//           <div className="space-y-3">
//             {grades.map((grade, index) => (
//               <div
//                 key={grade.name}
//                 className={`p-4 rounded-xl border ${
//                   grade.current
//                     ? "bg-blue-500/20 border-blue-500/50"
//                     : currentTurnover >= grade.turnover
//                     ? "bg-green-500/10 border-green-500/30"
//                     : "bg-white/5 border-white/10"
//                 }`}
//               >
//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center gap-4">
//                     <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
//                       grade.current
//                         ? "bg-blue-500/30"
//                         : currentTurnover >= grade.turnover
//                         ? "bg-green-500/30"
//                         : "bg-zinc-500/20"
//                     }`}>
//                       <span className="text-xl">
//                         {grade.current ? "⭐" : currentTurnover >= grade.turnover ? "✅" : "🔒"}
//                       </span>
//                     </div>
//                     <div>
//                       <p className="text-white font-semibold text-lg">{grade.name}</p>
//                       <p className="text-zinc-400 text-sm">
//                         Turnover: ${grade.turnover.toLocaleString()}+
//                       </p>
//                     </div>
//                   </div>
//                   <div className="text-right">
//                     <p className="text-white font-bold text-xl">
//                       ${grade.salary}/month
//                     </p>
//                     {grade.current && (
//                       <p className="text-blue-400 text-xs mt-1">Current</p>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </motion.div>

//         {/* Info Box */}
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ delay: 0.5 }}
//           className="mt-6 bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6"
//         >
//           <h3 className="text-lg font-semibold text-blue-300 mb-3">📋 How Grades Work</h3>
//           <ul className="text-sm text-blue-400/80 space-y-2 list-disc list-inside">
//             <li>Personal turnover is calculated from your direct referrals&apos; first transfer to Movement Account</li>
//             <li>Grades unlock automatically based on your cumulative personal turnover</li>
//             <li>Monthly salary is paid on the 1st of each month to your Main Account</li>
//             <li>Higher grades provide higher monthly salaries</li>
//           </ul>
//         </motion.div>
//       </div>
//     </div>
//     </>
//   );
// }




import ComingSoon from '@/components/ComingSoon'
import DashboardNavbar from '@/components/DashboardNavbar'
import DashboardFooter from '@/components/DashboardFooter'

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