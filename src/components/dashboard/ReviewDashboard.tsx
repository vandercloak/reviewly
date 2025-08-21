import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  GitPullRequest,
  Clock,
  AlertTriangle,
  CheckCircle,
  Eye,
  GitBranch,
  Calendar,
  User,
  ArrowRight,
  ExternalLink,
  Github,
  Target,
  Trophy,
  Flame,
  CheckSquare,
  Square,
  Moon,
  Zap,
} from "lucide-react";
import { GitHubPullRequest } from "../../types/github";

interface ReviewDashboardProps {
  pullRequests: GitHubPullRequest[];
  onPullRequestSelect: (pr: GitHubPullRequest) => void;
  isLoading: boolean;
}

export const ReviewDashboard: React.FC<ReviewDashboardProps> = ({
  pullRequests,
  onPullRequestSelect,
  isLoading,
}) => {
  const [filter, setFilter] = useState<
    "all" | "ready" | "delayed" | "completed"
  >("ready");
  const [sortBy, setSortBy] = useState<"updated" | "created" | "priority">(
    "priority"
  );
  const [completedReviews, setCompletedReviews] = useState<Set<number>>(
    new Set()
  );
  const [showCompleted, setShowCompleted] = useState(false);
  const [delayedReviews, setDelayedReviews] = useState<Set<number>>(new Set());
  const [checkingAnimation, setCheckingAnimation] = useState<number | null>(null);
  const [spicyReviews, setSpicyReviews] = useState<Set<number>>(new Set());
  const [spiceAnimation, setSpiceAnimation] = useState<number | null>(null);

  const getPriorityLevel = (
    pr: GitHubPullRequest
  ): "urgent" | "high" | "medium" | "low" => {
    const now = new Date();
    const updated = new Date(pr.updated_at);
    const hoursOld = (now.getTime() - updated.getTime()) / (1000 * 60 * 60);

    if (pr.draft) return "low";

    // Only mark as urgent/high if user is actually requested as reviewer
    const hasReviewRequest =
      pr.requested_reviewers?.some(
        (reviewer) => typeof reviewer === "object" && "login" in reviewer
      ) || pr.requested_teams?.length > 0;

    if (!hasReviewRequest) return "low";

    if (hoursOld > 168) return "urgent"; // 1 week
    if (hoursOld > 72) return "high"; // 3 days
    if (hoursOld > 24) return "medium"; // 1 day
    return "low";
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <AlertTriangle className="w-4 h-4 text-orange-400" />;
      case "high":
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case "medium":
        return <Eye className="w-4 h-4 text-blue-400" />;
      case "low":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      default:
        return <Eye className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks}w ago`;
  };

  const handleCompleteReview = (prId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    setCheckingAnimation(prId);
    
    // Add a slight delay for the animation
    setTimeout(() => {
      setCompletedReviews((prev) => new Set([...prev, prId]));
      setCheckingAnimation(null);
    }, 500);
  };

  const handleUncompleteReview = (prId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    setCompletedReviews((prev) => {
      const newSet = new Set(prev);
      newSet.delete(prId);
      return newSet;
    });
  };

  const handleDelayUntilTomorrow = (prId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    
    // Add a slide-out animation effect
    const element = document.getElementById(`pr-${prId}`);
    if (element) {
      element.style.transform = 'translateX(100%)';
      element.style.opacity = '0';
      element.style.transition = 'all 0.3s ease-out';
    }
    
    // After animation, update state
    setTimeout(() => {
      setDelayedReviews((prev) => new Set([...prev, prId]));
    }, 300);
    
    // Remove the delay after 24 hours (for demo, we'll just keep it)
    // In a real app, you'd store this with timestamps and check against them
  };

  const handleSpiceItUp = (prId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    setSpiceAnimation(prId);
    
    // Add spicy animation effects
    setTimeout(() => {
      setSpicyReviews((prev) => new Set([...prev, prId]));
      setSpiceAnimation(null);
    }, 800);
  };

  const handleCoolDown = (prId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    setSpicyReviews((prev) => {
      const newSet = new Set(prev);
      newSet.delete(prId);
      return newSet;
    });
  };

  const handleUndelay = (prId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    setDelayedReviews((prev) => {
      const newSet = new Set(prev);
      newSet.delete(prId);
      return newSet;
    });
  };

  const filteredPRs = pullRequests
    .map((pr) => ({
      pr,
      priority: getPriorityLevel(pr),
      completed: completedReviews.has(pr.id),
      delayed: delayedReviews.has(pr.id),
      spicy: spicyReviews.has(pr.id),
    }))
    .filter(({ pr, priority, completed, delayed }) => {
      // Handle special filters
      if (filter === "delayed") {
        return delayed;
      }
      
      if (filter === "completed") {
        return completed;
      }
      
      // Hide delayed PRs from other filters (they'll come back "tomorrow")
      if (delayed) return false;
      
      // Hide completed items unless specifically showing them or using "all" filter
      if (completed && !showCompleted && filter !== "all") {
        return false;
      }
      
      // Apply main filter
      if (filter === "ready") {
        return !pr.draft && !completed; // Ready for review (not draft, not completed)
      }
      
      return true; // For "all" filter
    })
    .sort((a, b) => {
      // Spicy PRs go to the top (unless completed)
      if (!a.completed && !b.completed && a.spicy !== b.spicy) {
        return a.spicy ? -1 : 1;
      }
      
      // Completed items go to bottom
      if (a.completed !== b.completed) return a.completed ? 1 : -1;

      if (sortBy === "priority") {
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      if (sortBy === "created") {
        return (
          new Date(b.pr.created_at).getTime() -
          new Date(a.pr.created_at).getTime()
        );
      }
      return (
        new Date(b.pr.updated_at).getTime() -
        new Date(a.pr.updated_at).getTime()
      );
    });

  const completedCount = completedReviews.size;
  const totalCount = pullRequests.length;
  const spicyCount = spicyReviews.size;
  const progressPercentage =
    totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const priorityCounts = pullRequests.reduce((acc, pr) => {
    const priority = getPriorityLevel(pr);
    acc[priority] = (acc[priority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (isLoading && pullRequests.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-2 border-white border-t-transparent rounded-full"
            />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">
            🔍 Hunting for Reviews
          </h2>
          <p className="text-gray-400">
            Gathering all the PRs that need your legendary touch... ⚡
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-black">
      {/* Fun Celebration Banner */}
      {completedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-green-600/10 border-b border-gray-800"
        >
          <div className="max-w-4xl mx-auto px-6 py-4">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 10 }}
              className="text-center"
            >
              <div className="flex items-center justify-center space-x-2 mb-2">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    repeatDelay: 2,
                  }}
                >
                  <Trophy className="w-6 h-6 text-yellow-400" />
                </motion.div>
                <span className="text-xl font-bold text-white">
                  {completedCount} PR{completedCount !== 1 ? "s" : ""} Completed
                </span>
                <motion.div
                  animate={{ rotate: [0, -10, 10, 0] }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    repeatDelay: 2,
                  }}
                >
                  🎉
                </motion.div>
              </div>
              <p className="text-sm text-gray-400">
                {progressPercentage === 100
                  ? "🎉 You crushed them all! Time to celebrate! 🎉"
                  : completedCount === 1
                  ? "First one down! You're on fire! 🔥"
                  : completedCount < 3
                  ? "You're cooking with gas! 🚀"
                  : completedCount < 5
                  ? "Absolutely slaying these reviews! ⚡"
                  : "You're a reviewing machine! 🤖⚡"}
              </p>
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* Main Dashboard */}
      <div className="max-w-4xl mx-auto w-full">
        <div className="p-6 border-b border-gray-800">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center space-x-3">
                <span>Review Dashboard</span>
                {isLoading && pullRequests.length > 0 && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm font-normal text-blue-400 flex items-center space-x-2"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full"
                    />
                    <span>Refreshing...</span>
                  </motion.span>
                )}
              </h1>
              <p className="text-gray-400">
                {totalCount === 0 
                  ? "The review queue is as empty as a coffee shop at 3am ☕"
                  : completedCount === 0
                  ? `${totalCount} PRs ready for your magic touch! ✨`
                  : `${completedCount} of ${totalCount} reviews absolutely demolished! 💥`}
              </p>
            </div>

            {totalCount > 0 && (
              <div className="text-right">
                <div className="text-4xl font-bold text-white mb-1">
                  {Math.round(progressPercentage)}%
                </div>
                <div className="text-sm text-gray-400">Complete</div>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">🚀 Daily Domination</span>
              <span className="text-sm text-gray-400">
                {completedCount} / {totalCount}
              </span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
            {completedCount > 0 && (
              <div className="flex items-center justify-center mt-2">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center space-x-2 text-green-400"
                >
                  <Trophy className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {progressPercentage === 100
                      ? "🎉 Total domination! 🎉"
                      : completedCount === 1
                      ? "First blood! 🩸"
                      : completedCount < 3
                      ? "Getting warmed up! 🔥"
                      : "Absolutely crushing it! ⚡"}
                  </span>
                </motion.div>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-5 gap-4 mb-8">
            {[
              {
                key: "urgent",
                label: "Urgent",
                count: priorityCounts.urgent || 0,
                color: "text-orange-400 bg-gray-900 border-gray-700",
                icon: <AlertTriangle className="w-4 h-4" />,
              },
              {
                key: "high",
                label: "High Priority",
                count: priorityCounts.high || 0,
                color: "text-yellow-400 bg-gray-900 border-gray-700",
                icon: <Clock className="w-4 h-4" />,
              },
              {
                key: "spicy",
                label: "🔥 Spicy",
                count: spicyCount,
                color: "text-red-400 bg-red-900/20 border-red-700/30",
                icon: <Flame className="w-4 h-4" />,
              },
              {
                key: "completed",
                label: "Completed",
                count: completedCount,
                color: "text-green-400 bg-gray-900 border-gray-700",
                icon: <CheckCircle className="w-4 h-4" />,
              },
              {
                key: "remaining",
                label: "Remaining",
                count: totalCount - completedCount,
                color: "text-blue-400 bg-gray-900 border-gray-700",
                icon: <Eye className="w-4 h-4" />,
              },
            ].map(({ key, label, count, color, icon }) => (
              <motion.div
                key={key}
                className={`p-4 rounded-lg border ${color}`}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center space-x-2 mb-2">
                  {icon}
                  <span className="font-medium text-sm">{label}</span>
                </div>
                <div className="text-2xl font-bold">{count}</div>
              </motion.div>
            ))}
          </div>

          {/* Delayed tasks section */}
          {delayedReviews.size > 0 && (
            <div className="flex items-center justify-between mb-6 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
              <div className="flex items-center space-x-3">
                <Moon className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-medium text-white">
                  {delayedReviews.size} Snoozed PR{delayedReviews.size !== 1 ? 's' : ''} 😴
                </span>
                <span className="text-xs text-gray-400">(taking a little nap until tomorrow)</span>
              </div>
              <button
                onClick={() => setFilter("delayed")}
                className="px-3 py-1.5 text-sm text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10 rounded-lg transition-colors font-medium"
              >
                View
              </button>
            </div>
          )}

          {/* Show completed toggle */}
          {completedCount > 0 && (
            <div className="flex items-center justify-between mb-6 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-sm font-medium text-white">
                  {completedCount} Crushed Review{completedCount !== 1 ? 's' : ''} 💪
                </span>
              </div>
              <button
                onClick={() => setFilter("completed")}
                className="px-3 py-1.5 text-sm text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 rounded-lg transition-colors font-medium"
              >
                View
              </button>
            </div>
          )}

          {/* Back button for special views */}
          {filter === "delayed" && (
            <div className="flex items-center justify-between mb-4 p-3 bg-gray-800/30 rounded-lg border border-gray-700/50">
              <div className="flex items-center space-x-3">
                <Moon className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-medium text-white">
                  😴 Checking out the sleepy PRs
                </span>
              </div>
              <button
                onClick={() => setFilter("ready")}
                className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors font-medium"
              >
                <ArrowRight className="w-3 h-3 rotate-180" />
                <span>Back to Ready</span>
              </button>
            </div>
          )}

          {filter === "completed" && (
            <div className="flex items-center justify-between mb-4 p-3 bg-green-900/20 rounded-lg border border-green-700/30">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-sm font-medium text-white">
                  💪 Hall of Crushed Reviews
                </span>
                <span className="text-xs text-gray-400">({completedCount} total)</span>
              </div>
              <button
                onClick={() => setFilter("ready")}
                className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors font-medium"
              >
                <ArrowRight className="w-3 h-3 rotate-180" />
                <span>Back to Ready</span>
              </button>
            </div>
          )}

          {/* Filters */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-gray-400">Filter:</span>
              <div className="flex space-x-2">
                {[
                  {
                    key: "ready",
                    label: "Ready",
                    count: pullRequests.filter((pr) => !pr.draft && !completedReviews.has(pr.id) && !delayedReviews.has(pr.id)).length,
                  },
                  {
                    key: "completed",
                    label: "Completed",
                    count: completedCount,
                  },
                  {
                    key: "delayed",
                    label: "Delayed",
                    count: delayedReviews.size,
                  },
                  { key: "all", label: "All", count: pullRequests.length },
                ].map(({ key, label, count }) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key as any)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                      filter === key
                        ? "bg-blue-600 text-white"
                        : "bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800"
                    }`}
                  >
                    {label} {count}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-gray-400">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="priority">Priority</option>
                <option value="updated">Updated</option>
                <option value="created">Created</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Pull Request List */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto w-full p-6">
          {filteredPRs.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                🏖️ You're living the dream! 
              </h3>
              <p className="text-gray-400">
                No PRs to review = more time for coffee! ☕
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPRs.map(({ pr, priority, completed, delayed, spicy }, index) => (
                <motion.div
                  key={pr.id}
                  id={`pr-${pr.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`group relative ${completed ? "opacity-60" : ""} ${spicy ? "ring-2 ring-red-500/30 ring-offset-2 ring-offset-black" : ""}`}
                >
                  {/* Spicy flames animation */}
                  {(spicy || spiceAnimation === pr.id) && (
                    <div className="absolute -inset-1 pointer-events-none">
                      <motion.div
                        animate={spiceAnimation === pr.id ? {
                          opacity: [0, 1, 0.8],
                          scale: [0.8, 1.2, 1],
                        } : {
                          opacity: [0.5, 1, 0.5],
                          scale: [0.95, 1.05, 0.95],
                        }}
                        transition={spiceAnimation === pr.id ? {
                          duration: 0.8,
                          ease: "easeOut"
                        } : {
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        className="absolute inset-0 bg-gradient-to-r from-red-500/20 via-orange-500/30 to-yellow-500/20 rounded-lg blur-md"
                      />
                      {Array.from({ length: 5 }).map((_, i) => (
                        <motion.div
                          key={i}
                          animate={{
                            y: [0, -20, -40],
                            opacity: [1, 0.8, 0],
                            scale: [0.5, 1, 0.8],
                            rotate: [0, Math.random() * 30 - 15, Math.random() * 60 - 30],
                          }}
                          transition={{
                            duration: 1.5 + Math.random() * 0.5,
                            repeat: Infinity,
                            delay: i * 0.2,
                            ease: "easeOut"
                          }}
                          className={`absolute text-red-500 text-xs pointer-events-none`}
                          style={{
                            left: `${20 + i * 15}%`,
                            top: '50%',
                            transform: 'translateY(-50%)',
                          }}
                        >
                          🔥
                        </motion.div>
                      ))}
                    </div>
                  )}

                  <div
                    className={`flex items-start space-x-4 p-4 rounded-lg border cursor-pointer transition-all hover:bg-gray-900/50 ${
                      delayed
                        ? "bg-yellow-900/10 border-yellow-700/30"
                        : completed
                        ? "bg-gray-950/30 border-gray-800"
                        : priority === "urgent"
                        ? "border-orange-500/20 bg-orange-500/2"
                        : priority === "high"
                        ? "border-yellow-500/20 bg-yellow-500/2"
                        : priority === "medium"
                        ? "border-blue-500/20 bg-blue-500/2"
                        : spicy
                        ? "border-red-500/50 bg-red-500/10"
                        : "border-gray-700 bg-gray-950/20"
                    }`}
                    onClick={() => !completed && onPullRequestSelect(pr)}
                  >
                    {/* Checkbox */}
                    <motion.button
                      onClick={(e) =>
                        completed
                          ? handleUncompleteReview(pr.id, e)
                          : handleCompleteReview(pr.id, e)
                      }
                      className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        completed
                          ? "bg-green-500 border-green-500 text-white"
                          : checkingAnimation === pr.id
                          ? "bg-green-400 border-green-400 text-white"
                          : "border-gray-600 hover:border-gray-500"
                      }`}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      animate={checkingAnimation === pr.id ? { 
                        scale: [1, 1.2, 1],
                        rotate: [0, 10, -10, 0]
                      } : {}}
                      transition={checkingAnimation === pr.id ? {
                        duration: 0.5,
                        ease: "easeInOut"
                      } : {}}
                    >
                      {completed ? (
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 20,
                          }}
                        >
                          <CheckSquare className="w-4 h-4" />
                        </motion.div>
                      ) : checkingAnimation === pr.id ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 0.5 }}
                        >
                          <CheckSquare className="w-4 h-4" />
                        </motion.div>
                      ) : (
                        <div className="w-4 h-4" />
                      )}
                    </motion.button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-center space-x-2 mb-2">
                        {getPriorityIcon(priority)}
                        <GitPullRequest className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-gray-400 font-mono">
                          {pr.base.repo.full_name}
                        </span>
                        <span className="text-xs text-gray-500">
                          #{pr.number}
                        </span>
                        {pr.draft && (
                          <span className="px-2 py-0.5 text-xs bg-gray-700 text-gray-300 rounded">
                            Draft
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="text-lg font-semibold text-white mb-2 truncate">
                        {pr.title}
                      </h3>

                      {/* Meta */}
                      <div className="flex items-center space-x-4 text-sm text-gray-400 mb-3">
                        <div className="flex items-center space-x-1">
                          <User className="w-3 h-3" />
                          <span>{pr.user.login}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{getTimeAgo(pr.updated_at)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <GitBranch className="w-3 h-3" />
                          <span>
                            {pr.head.ref} → {pr.base.ref}
                          </span>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center space-x-4 text-xs">
                        <span className="text-green-400">+{pr.additions}</span>
                        <span className="text-red-400">-{pr.deletions}</span>
                        <span className="text-gray-400">
                          {pr.changed_files} files
                        </span>
                        <span className="text-gray-400">
                          {pr.commits} commits
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      {delayed ? (
                        <button
                          onClick={(e) => handleUndelay(pr.id, e)}
                          className="flex items-center space-x-1 px-2 py-1 bg-yellow-900/20 hover:bg-yellow-800/30 border border-yellow-700/30 rounded text-xs text-yellow-400 hover:text-yellow-300 transition-colors"
                          title="Bring back to review queue"
                        >
                          <ArrowRight className="w-3 h-3 rotate-180" />
                          <span>Restore</span>
                        </button>
                      ) : !completed && (
                        <>
                          {spicy ? (
                            <button
                              onClick={(e) => handleCoolDown(pr.id, e)}
                              className="flex items-center space-x-1 px-2 py-1 bg-red-900/30 hover:bg-red-800/40 border border-red-700/40 rounded text-xs text-red-400 hover:text-red-300 transition-colors"
                              title="Cool it down"
                            >
                              <Zap className="w-3 h-3" />
                              <span>Chill</span>
                            </button>
                          ) : (
                            <button
                              onClick={(e) => handleSpiceItUp(pr.id, e)}
                              className="flex items-center space-x-1 px-2 py-1 bg-gray-900 hover:bg-red-900/30 border border-gray-800 hover:border-red-700/40 rounded text-xs text-gray-400 hover:text-red-400 transition-colors group"
                              title="🌶️ Make this spicy! (urgent priority)"
                            >
                              <motion.div
                                animate={spiceAnimation === pr.id ? {
                                  scale: [1, 1.5, 1],
                                  rotate: [0, 180, 360]
                                } : {}}
                                transition={{ duration: 0.8 }}
                              >
                                <Flame className="w-3 h-3 group-hover:text-red-500" />
                              </motion.div>
                              <span>Spice It!</span>
                            </button>
                          )}
                          <button
                            onClick={(e) => handleDelayUntilTomorrow(pr.id, e)}
                            className="flex items-center space-x-1 px-2 py-1 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded text-xs text-gray-400 hover:text-yellow-400 transition-colors"
                            title="Delay until tomorrow"
                          >
                            <Moon className="w-3 h-3" />
                            <span>Tomorrow</span>
                          </button>
                        </>
                      )}
                      <a
                        href={pr.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center space-x-1 px-2 py-1 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded text-xs text-gray-400 hover:text-white transition-colors"
                        title="View on GitHub"
                      >
                        <Github className="w-3 h-3" />
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <ArrowRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
