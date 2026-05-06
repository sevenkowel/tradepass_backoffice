"use client";

import { motion } from "framer-motion";
import {
  CheckSquare,
  Shield,
  ArrowDownToLine,
  BarChart2,
  UserCheck,
  Gift,
  TrendingUp,
  ChevronRight,
  Clock,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { PageHeader } from "@/components/portal/widgets/PageHeader";
import { cn } from "@/lib/utils";
import Link from "next/link";

// ─── Mock Data ─────────────────────────────────────────────
const taskCategories = [
  { id: "all", label: "All Tasks", count: 6 },
  { id: "kyc", label: "KYC", count: 2 },
  { id: "deposit", label: "Deposit", count: 1 },
  { id: "trading", label: "Trading", count: 2 },
  { id: "referral", label: "Referral", count: 1 },
];

const tasks = [
  {
    id: 1,
    title: "Complete KYC Verification",
    description: "Verify your identity to unlock full platform features",
    reward: "$50 bonus",
    progress: 60,
    totalSteps: 3,
    completedSteps: 2,
    category: "kyc",
    icon: Shield,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    borderColor: "border-blue-200",
    href: "/portal/kyc",
    deadline: "No deadline",
    status: "in_progress",
  },
  {
    id: 2,
    title: "Make First Deposit",
    description: "Deposit at least $100 to activate your account",
    reward: "5% deposit bonus",
    progress: 0,
    totalSteps: 1,
    completedSteps: 0,
    category: "deposit",
    icon: ArrowDownToLine,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    borderColor: "border-emerald-200",
    href: "/portal/fund/deposit",
    deadline: "7 days left",
    status: "pending",
  },
  {
    id: 3,
    title: "Complete 10 Trades",
    description: "Execute 10 trades on any trading account",
    reward: "Trading rebate",
    progress: 30,
    totalSteps: 10,
    completedSteps: 3,
    category: "trading",
    icon: BarChart2,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600",
    borderColor: "border-purple-200",
    href: "/portal/accounts/accounts",
    deadline: "No deadline",
    status: "in_progress",
  },
  {
    id: 4,
    title: "Invite 3 Friends",
    description: "Share your referral link with friends",
    reward: "$30 per referral",
    progress: 33,
    totalSteps: 3,
    completedSteps: 1,
    category: "referral",
    icon: UserCheck,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    borderColor: "border-amber-200",
    href: "/portal/ib/invite",
    deadline: "30 days left",
    status: "in_progress",
  },
  {
    id: 5,
    title: "Enable 2FA Security",
    description: "Set up two-factor authentication for enhanced security",
    reward: "Security badge",
    progress: 0,
    totalSteps: 1,
    completedSteps: 0,
    category: "kyc",
    icon: Shield,
    iconBg: "bg-red-50",
    iconColor: "text-red-600",
    borderColor: "border-red-200",
    href: "/portal/settings/security",
    deadline: "No deadline",
    status: "pending",
  },
  {
    id: 6,
    title: "Achieve $10K Trading Volume",
    description: "Reach $10,000 in total trading volume",
    reward: "VIP status",
    progress: 75,
    totalSteps: 100,
    completedSteps: 75,
    category: "trading",
    icon: TrendingUp,
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-600",
    borderColor: "border-indigo-200",
    href: "/portal/accounts/history",
    deadline: "15 days left",
    status: "in_progress",
  },
];

const completedTasks = [
  {
    id: 101,
    title: "Create Trading Account",
    reward: "Account activated",
    completedAt: "2 days ago",
    icon: CheckCircle2,
    iconBg: "bg-gray-50",
    iconColor: "text-gray-400",
  },
  {
    id: 102,
    title: "Verify Email Address",
    reward: "Email confirmed",
    completedAt: "3 days ago",
    icon: CheckCircle2,
    iconBg: "bg-gray-50",
    iconColor: "text-gray-400",
  },
];

// ─── Components ────────────────────────────────────────────
function TaskCard({ task }: { task: (typeof tasks)[0] }) {
  const Icon = task.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border-2 border-gray-200 hover:border-blue-300 hover:shadow-md p-5 transition-all duration-200"
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
            task.iconBg,
            task.borderColor,
            "border-2"
          )}
        >
          <Icon size={22} className={task.iconColor} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-bold text-gray-800">{task.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{task.description}</p>
            </div>
            <span
              className={cn(
                "text-xs font-bold px-2.5 py-1 rounded-lg shrink-0",
                task.status === "in_progress"
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : "bg-gray-50 text-gray-600 border border-gray-200"
              )}
            >
              {task.status === "in_progress" ? "In Progress" : "Pending"}
            </span>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">
                Step {task.completedSteps} of {task.totalSteps}
              </span>
              <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
                {task.reward}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-700"
                style={{ width: `${task.progress}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Clock size={12} />
              <span>{task.deadline}</span>
            </div>
            <Link
              href={task.href}
              className="text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1"
            >
              Continue <ChevronRight size={12} />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function CompletedTaskCard({ task }: { task: (typeof completedTasks)[0] }) {
  const Icon = task.icon;
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100 opacity-70">
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", task.iconBg)}>
        <Icon size={18} className={task.iconColor} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-600 line-through">{task.title}</p>
        <p className="text-xs text-gray-400">{task.reward}</p>
      </div>
      <span className="text-xs text-gray-400">{task.completedAt}</span>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────
export default function TasksPage() {
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredTasks =
    activeCategory === "all"
      ? tasks
      : tasks.filter((t) => t.category === activeCategory);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks & Rewards"
        description="Complete tasks to earn bonuses and unlock platform features"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border-2 border-gray-200 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border-2 border-blue-200 flex items-center justify-center">
              <CheckSquare size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">4</p>
              <p className="text-xs text-gray-500">Active Tasks</p>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-2xl border-2 border-gray-200 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center">
              <CheckCircle2 size={18} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">2</p>
              <p className="text-xs text-gray-500">Completed</p>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border-2 border-gray-200 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border-2 border-amber-200 flex items-center justify-center">
              <Gift size={18} className="text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">$150+</p>
              <p className="text-xs text-gray-500">Potential Rewards</p>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl border-2 border-gray-200 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border-2 border-purple-200 flex items-center justify-center">
              <Circle size={18} className="text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">45%</p>
              <p className="text-xs text-gray-500">Overall Progress</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {taskCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border-2",
              activeCategory === cat.id
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
            )}
          >
            {cat.label}
            <span className="ml-2 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md">
              {cat.count}
            </span>
          </button>
        ))}
      </div>

      {/* Tasks Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredTasks.map((task, index) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <TaskCard task={task} />
          </motion.div>
        ))}
      </div>

      {/* Completed Tasks */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl border-2 border-gray-200 p-5"
      >
        <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center">
            <CheckCircle2 size={14} className="text-gray-400" />
          </div>
          Completed Tasks
        </h2>
        <div className="space-y-2">
          {completedTasks.map((task) => (
            <CompletedTaskCard key={task.id} task={task} />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

import { useState } from "react";
