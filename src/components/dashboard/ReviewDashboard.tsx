import React, { useState, useMemo, startTransition, useEffect } from "react";
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
import { prStatusService } from "../../services/prStatusService";

interface ReviewDashboardProps {
  pullRequests: GitHubPullRequest[];
  onPullRequestSelect: (pr: GitHubPullRequest) => void;
  isLoading: boolean;
  rateLimitError?: string | null;
}

export const ReviewDashboard: React.FC<ReviewDashboardProps> = ({
  pullRequests,
  onPullRequestSelect,
  isLoading,
  rateLimitError,
}) => {
  const [filter, setFilter] = useState<
    "ready" | "spicy" | "completed" | "delayed"
  >("ready");
  const [sortBy, setSortBy] = useState<"updated" | "created" | "priority">(
    "priority"
  );
  const [itemsToShow, setItemsToShow] = useState(10); // Start with 10 items

  // Initialize state from localStorage
  const [completedReviews, setCompletedReviews] = useState<Set<number>>(
    () => prStatusService.getCompletedPRs()
  );
  const [showCompleted, setShowCompleted] = useState(false);
  const [delayedReviews, setDelayedReviews] = useState<Set<number>>(
    () => prStatusService.getDelayedPRs()
  );
  const [checkingAnimation, setCheckingAnimation] = useState<number | null>(null);
  const [spicyReviews, setSpicyReviews] = useState<Set<number>>(
    () => prStatusService.getSpicyPRs()
  );
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
      // Clear other statuses when completing
      setSpicyReviews((prev) => {
        const newSet = new Set(prev);
        newSet.delete(prId);
        return newSet;
      });
      setDelayedReviews((prev) => {
        const newSet = new Set(prev);
        newSet.delete(prId);
        return newSet;
      });
      
      prStatusService.setCompleted(prId, true);
      prStatusService.setSpicy(prId, false);
      prStatusService.setDelayed(prId, false);
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
    prStatusService.setCompleted(prId, false); // Save to localStorage
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
      // Clear other statuses when delaying
      setSpicyReviews((prev) => {
        const newSet = new Set(prev);
        newSet.delete(prId);
        return newSet;
      });
      setCompletedReviews((prev) => {
        const newSet = new Set(prev);
        newSet.delete(prId);
        return newSet;
      });
      
      prStatusService.setDelayed(prId, true);
      prStatusService.setSpicy(prId, false);
      prStatusService.setCompleted(prId, false);
    }, 300);
  };

  const handleSpiceItUp = (prId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    
    // Clear other statuses when spicing
    setDelayedReviews((prev) => {
      const newSet = new Set(prev);
      newSet.delete(prId);
      return newSet;
    });
    setCompletedReviews((prev) => {
      const newSet = new Set(prev);
      newSet.delete(prId);
      return newSet;
    });
    
    // Add to spicy reviews
    setSpicyReviews((prev) => new Set([...prev, prId]));
    
    prStatusService.setSpicy(prId, true);
    prStatusService.setDelayed(prId, false);
    prStatusService.setCompleted(prId, false);
    
    // Show special animation effect
    setSpiceAnimation(prId);
    
    // Clear animation state after animation completes
    setTimeout(() => {
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
    prStatusService.setSpicy(prId, false); // Save to localStorage
  };

  const handleUndelay = (prId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    setDelayedReviews((prev) => {
      const newSet = new Set(prev);
      newSet.delete(prId);
      return newSet;
    });
    prStatusService.setDelayed(prId, false); // Save to localStorage
  };

  // Memoize the expensive filtering and sorting calculation
  const filteredPRs = useMemo(() => {
    return pullRequests
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
          return !pr.draft && !completed; // Ready for review (not draft, not completed) - includes spicy PRs
        }
        
        if (filter === "spicy") {
          return spicyReviews.has(pr.id);
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
  }, [pullRequests, filter, sortBy, completedReviews, delayedReviews, spicyReviews, showCompleted]);

  // Reset pagination when filter changes
  useEffect(() => {
    setItemsToShow(10);
  }, [filter]);

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 1000 // Load when 1000px from bottom
      ) {
        if (filteredPRs.length > itemsToShow) {
          setItemsToShow(prev => Math.min(prev + 10, filteredPRs.length));
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [filteredPRs.length, itemsToShow]);

  // Memoize expensive calculations
  const stats = useMemo(() => {
    const completedCount = completedReviews.size;
    const totalCount = pullRequests.length;
    const spicyCount = spicyReviews.size;
    const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    const priorityCounts = pullRequests.reduce((acc, pr) => {
      const priority = getPriorityLevel(pr);
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      completedCount,
      totalCount,
      spicyCount,
      progressPercentage,
      priorityCounts
    };
  }, [pullRequests, completedReviews, spicyReviews]);

  const { completedCount, totalCount, spicyCount, progressPercentage, priorityCounts } = stats;

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
      {/* Rate Limit Error Banner */}
      {rateLimitError && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-orange-600/10 via-red-600/10 to-yellow-600/10 border-b border-orange-800"
        >
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-orange-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-orange-400 mb-1">
                  🚫 GitHub API Rate Limit Exceeded
                </h3>
                <p className="text-sm text-gray-300 mb-2">
                  We've hit GitHub's API rate limit. Don't worry, your cached data is still here!
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0 text-xs text-gray-400">
                  <div className="flex items-center space-x-2">
                    <span>⏰</span>
                    <span>Rate limits reset every hour</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>💡</span>
                    <span>Try refreshing in a few minutes</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>🔧</span>
                    <span>Consider using a GitHub App token for higher limits</span>
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0">
                <button
                  onClick={() => window.location.reload()}
                  className="px-3 py-1.5 text-sm text-orange-400 hover:text-orange-300 hover:bg-orange-400/10 rounded-lg transition-colors border border-orange-400/20 hover:border-orange-400/40"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

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
                  🚀 Daily Domination - {completedCount} PR{completedCount !== 1 ? "s" : ""} Completed
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
              
              {/* Progress Bar in Daily Domination */}
              {totalCount > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Progress</span>
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
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* Main Dashboard */}
      <div className="max-w-4xl mx-auto w-full">
        <div className="p-6 border-b border-gray-800">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
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

          </div>




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
                    colors: {
                      active: "bg-blue-500/20 text-blue-300 border-blue-500/50",
                      inactive: "bg-blue-500/5 text-blue-400 border-blue-500/20 hover:bg-blue-500/10 hover:border-blue-500/30"
                    }
                  },
                  {
                    key: "spicy",
                    label: "🔥 Spicy",
                    count: spicyCount,
                    colors: {
                      active: "bg-red-500/20 text-red-300 border-red-500/50",
                      inactive: "bg-red-500/5 text-red-400 border-red-500/20 hover:bg-red-500/10 hover:border-red-500/30"
                    }
                  },
                  {
                    key: "completed",
                    label: "Completed",
                    count: completedCount,
                    colors: {
                      active: "bg-green-500/20 text-green-300 border-green-500/50",
                      inactive: "bg-green-500/5 text-green-400 border-green-500/20 hover:bg-green-500/10 hover:border-green-500/30"
                    }
                  },
                  {
                    key: "delayed",
                    label: "Delayed",
                    count: delayedReviews.size,
                    colors: {
                      active: "bg-yellow-500/20 text-yellow-300 border-yellow-500/50",
                      inactive: "bg-yellow-500/5 text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/10 hover:border-yellow-500/30"
                    }
                  },
                ].map(({ key, label, count, colors }) => (
                  <button
                    key={key}
                    onClick={() => {
                      startTransition(() => {
                        setFilter(key as any);
                      });
                    }}
                    className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-full border transition-colors ${
                      filter === key ? colors.active : colors.inactive
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
          {/* Dynamic Section Title */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white">
              {filter === 'ready' || filter === 'spicy' ? '🎯 What\'s Next:' :
               filter === 'completed' ? '✅ Completed Reviews:' :
               filter === 'delayed' ? '😴 Snoozed Reviews:' :
               '📋 All Reviews:'}
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              {filter === 'ready' ? 'PRs waiting for your review' :
               filter === 'spicy' ? 'High priority PRs that need immediate attention' :
               filter === 'completed' ? 'PRs you\'ve finished reviewing' :
               filter === 'delayed' ? 'PRs you\'ve snoozed until later' :
               'All pull requests'}
            </p>
          </div>

          {filteredPRs.length === 0 ? (
            <div className="text-center py-12">
              {pullRequests.length === 0 && !isLoading ? (
                <>
                  <AlertTriangle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    🔍 No Pull Requests Found
                  </h3>
                  <div className="text-gray-400 space-y-2 max-w-md mx-auto">
                    <p>This could mean:</p>
                    <ul className="text-sm text-left space-y-1">
                      <li>• No PRs are waiting for your review</li>
                      <li>• Your GitHub token needs additional permissions</li>
                      <li>• You don't have access to repositories with open PRs</li>
                    </ul>
                    <p className="text-xs text-gray-500 mt-4">
                      Make sure your token has <code className="bg-gray-800 px-1 rounded">repo</code> scope
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    🏖️ You're living the dream! 
                  </h3>
                  <p className="text-gray-400">
                    No PRs to review = more time for coffee! ☕
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPRs.slice(0, itemsToShow).map(({ pr, priority, completed, delayed, spicy }, index) => (
                <motion.div
                  key={pr.id}
                  id={`pr-${pr.id}`}
                  initial={false}
                  animate={{ opacity: 1 }}
                  className={`group relative ${completed ? "opacity-60" : ""} ${spicy ? "ring-2 ring-red-500/30 ring-offset-2 ring-offset-black rounded-lg" : ""}`}
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
                      {Array.from({ length: 3 }).map((_, i) => {
                        // Define the three positions
                        const positions = [
                          { 
                            className: "top-2 left-2",
                            movement: { y: [0, -12, -20], x: [0, 2, 4] } // Up and right
                          },
                          { 
                            className: "top-1/2 right-4 transform -translate-y-1/2", // Middle-right
                            movement: { y: [0, -8, -12], x: [0, -2, -4] } // Up and left
                          },
                          { 
                            className: "bottom-3 left-1/2 transform -translate-x-1/2", // Bottom center
                            movement: { y: [0, -10, -16], x: [0, 0, 0] } // Straight up
                          }
                        ];
                        
                        const position = positions[i % 3];
                        
                        return (
                          <motion.div
                            key={i}
                            animate={{
                              ...position.movement,
                              opacity: [0, 1, 0.8, 0], // Pop in, then fade out
                              scale: [0.7, 0.9, 0.7],  // Slightly larger size change
                            }}
                            transition={{
                              duration: 3,        // Slower, more subtle
                              repeat: Infinity,
                              delay: i * 1.2 + Math.random() * 2, // Staggered timing
                              ease: "easeOut"
                            }}
                            className={`absolute text-red-500 text-sm pointer-events-none ${position.className}`}
                          >
                            {/* Random emoji each cycle */}
                            {Math.random() > 0.3 ? '🔥' : '🌶️'}
                          </motion.div>
                        );
                      })}
                    </div>
                  )}

                  {/* Sleepy animation for delayed PRs */}
                  {delayed && (
                    <div className="absolute -inset-1 pointer-events-none">
                      <motion.div
                        animate={{
                          opacity: [0.3, 0.6, 0.3],
                          scale: [0.98, 1.01, 0.98],
                        }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-blue-500/15 to-purple-500/10 rounded-lg blur-md"
                      />
                      {Array.from({ length: 3 }).map((_, i) => {
                        // Define the three positions for sleepy emojis
                        const positions = [
                          { 
                            className: "top-2 left-2",
                            movement: { y: [0, -10, -16], x: [0, 1, 2] } // Gentle up and right
                          },
                          { 
                            className: "top-1/2 right-4 transform -translate-y-1/2", // Middle-right
                            movement: { y: [0, -6, -10], x: [0, -1, -2] } // Gentle up and left
                          },
                          { 
                            className: "bottom-3 left-1/2 transform -translate-x-1/2", // Bottom center
                            movement: { y: [0, -8, -12], x: [0, 0, 0] } // Gentle straight up
                          }
                        ];
                        
                        const position = positions[i % 3];
                        
                        return (
                          <motion.div
                            key={`sleepy-${i}`}
                            animate={{
                              ...position.movement,
                              opacity: [0, 0.8, 0.6, 0], // Soft fade
                              scale: [0.9, 1.1, 0.9],  // Even larger and more visible
                            }}
                            transition={{
                              duration: 4,        // Even slower for sleepy
                              repeat: Infinity,
                              delay: i * 1.8 + Math.random() * 3, // More spaced out
                              ease: "easeOut"
                            }}
                            className={`absolute text-blue-400 text-sm pointer-events-none ${position.className}`}
                          >
                            {/* Random sleepy emoji each cycle */}
                            {Math.random() > 0.5 ? '😴' : '💤'}
                          </motion.div>
                        );
                      })}
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
                      {completed ? (
                        // Completed PRs only show completion status, no other actions
                        null
                      ) : delayed ? (
                        <button
                          onClick={(e) => handleUndelay(pr.id, e)}
                          className="flex items-center space-x-1 px-1.5 py-0.5 bg-yellow-900/20 hover:bg-yellow-800/30 border border-yellow-700/30 rounded text-xs text-yellow-400 hover:text-yellow-300 transition-colors h-5"
                          title="Bring back to review queue"
                        >
                          <ArrowRight className="w-2.5 h-2.5 rotate-180" />
                          <span>Restore</span>
                        </button>
                      ) : spicy ? (
                        <>
                          <button
                            onClick={(e) => handleCoolDown(pr.id, e)}
                            className="flex items-center space-x-1 px-1.5 py-0.5 bg-red-900/30 hover:bg-red-800/40 border border-red-700/40 rounded text-xs text-red-400 hover:text-red-300 transition-colors h-5"
                            title="Cool it down"
                          >
                            <Zap className="w-2.5 h-2.5" />
                            <span>Chill</span>
                          </button>
                          <button
                            onClick={(e) => handleDelayUntilTomorrow(pr.id, e)}
                            className="flex items-center space-x-1 px-1.5 py-0.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded text-xs text-gray-400 hover:text-yellow-400 transition-colors h-5"
                            title="Delay until tomorrow"
                          >
                            <Moon className="w-2.5 h-2.5" />
                            <span>Tomorrow</span>
                          </button>
                        </>
                      ) : (
                        // Normal PR (not completed, not delayed, not spicy)
                        <>
                          <button
                            onClick={(e) => handleSpiceItUp(pr.id, e)}
                            className="flex items-center space-x-1 px-1.5 py-0.5 bg-gray-900 hover:bg-red-900/30 border border-gray-800 hover:border-red-700/40 rounded text-xs text-gray-400 hover:text-red-400 transition-colors group h-5"
                            title="🌶️ Make this spicy! (urgent priority)"
                          >
                            <motion.div
                              animate={spiceAnimation === pr.id ? {
                                scale: [1, 1.5, 1],
                                rotate: [0, 180, 360]
                              } : {}}
                              transition={{ duration: 0.8 }}
                            >
                              <Flame className="w-2.5 h-2.5 group-hover:text-red-500" />
                            </motion.div>
                            <span>Spice It!</span>
                          </button>
                          <button
                            onClick={(e) => handleDelayUntilTomorrow(pr.id, e)}
                            className="flex items-center space-x-1 px-1.5 py-0.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded text-xs text-gray-400 hover:text-yellow-400 transition-colors h-5"
                            title="Delay until tomorrow"
                          >
                            <Moon className="w-2.5 h-2.5" />
                            <span>Tomorrow</span>
                          </button>
                        </>
                      )}
                      <a
                        href={pr.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center space-x-1 px-1.5 py-0.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded text-xs text-gray-400 hover:text-white transition-colors h-5"
                        title="View on GitHub"
                      >
                        <Github className="w-2.5 h-2.5" />
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                      <ArrowRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {/* Infinite Scroll Loading Indicator */}
              {filteredPRs.length > itemsToShow && (
                <div className="flex justify-center pt-6">
                  <div className="flex items-center space-x-3 text-gray-400">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-gray-600 border-t-blue-500 rounded-full"
                    />
                    <span className="text-sm">Loading more PRs...</span>
                    <span className="text-xs">({filteredPRs.length - itemsToShow} remaining)</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
