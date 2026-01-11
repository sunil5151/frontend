import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { goalsAPI } from '../utils/api';
import analyticsAPI from '../utils/analyticsAPI';

const Dashboard = () => {
  const [goals, setGoals] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalText, setGoalText] = useState('');
  const [targetDeadline, setTargetDeadline] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { user, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    fetchGoals();
    fetchAnalytics();
  }, []);

  const fetchGoals = async () => {
    try {
      const response = await goalsAPI.getAll();
      setGoals(response.data.data.goals);
    } catch (error) {
      console.error('Failed to fetch goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await analyticsAPI.getStats();
      setAnalytics(response.data.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const response = await goalsAPI.create({
        goalText,
        targetDeadline: targetDeadline || null,
      });

      if (response.data.success) {
        setGoalText('');
        setTargetDeadline('');
        setShowGoalForm(false);
        fetchGoals();
        fetchAnalytics(); // Refresh analytics
        
        // Navigate to the goal detail page
        navigate(`/goal/${response.data.data.goal._id}`);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create goal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGoal = async (goalId) => {
    if (!window.confirm('Are you sure you want to delete this goal and all its tasks?')) {
      return;
    }

    try {
      await goalsAPI.delete(goalId);
      fetchGoals();
      fetchAnalytics(); // Refresh analytics
    } catch (error) {
      console.error('Failed to delete goal:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-md border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Smart Task Planner
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Welcome back, {user?.name}! 👋</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDarkMode ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
              <button
                onClick={logout}
                className="px-5 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Analytics Dashboard */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {analyticsLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400"></div>
          </div>
        ) : analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Goals */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/50 mr-4">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Goals</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.overview.totalGoals}</p>
                </div>
              </div>
            </div>

            {/* Total Tasks */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/50 mr-4">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Tasks</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.overview.totalTasks}</p>
                </div>
              </div>
            </div>

            {/* Completion Rate */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/50 mr-4">
                  <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Completion Rate</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.overview.completionRate}%</p>
                </div>
              </div>
            </div>

            {/* High Priority Tasks */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/50 mr-4">
                  <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">High Priority</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.priorities.high}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Create Goal Button */}
        <div className="mb-8">
          <button
            onClick={() => setShowGoalForm(!showGoalForm)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            <span className="text-2xl">{showGoalForm ? '✕' : '+'}</span>
            {showGoalForm ? 'Cancel' : 'Create New Goal'}
          </button>
        </div>

        {/* Goal Creation Form */}
        {showGoalForm && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 mb-8 border border-gray-100 dark:border-gray-700 animate-fadeIn transition-colors duration-300">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <span className="text-3xl">🎯</span>
              Create a New Goal
            </h2>
            
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 rounded-r-lg text-red-700 dark:text-red-300 text-sm animate-shake">
                <strong>Error:</strong> {error}
              </div>
            )}

            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label htmlFor="goalText" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Goal Description *
                </label>
                <textarea
                  id="goalText"
                  required
                  value={goalText}
                  onChange={(e) => setGoalText(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition resize-none"
                  placeholder="E.g., Launch a new feature on the website by the end of the month"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Describe your high-level goal. Our AI will break it down into actionable tasks.
                </p>
              </div>

              <div>
                <label htmlFor="targetDeadline" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Target Deadline (Optional)
                </label>
                <input
                  id="targetDeadline"
                  type="date"
                  value={targetDeadline}
                  onChange={(e) => setTargetDeadline(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 flex items-center gap-2 justify-center w-full"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Generating AI Tasks...</span>
                  </>
                ) : (
                  <>
                    <span>✨</span>
                    <span>Create Goal & Generate Tasks</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Goals List */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700 transition-colors duration-300">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 flex items-center gap-2">
            <span className="text-3xl">📝</span>
            Your Goals
          </h2>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 mb-4"></div>
              <p className="text-gray-500 dark:text-gray-400 font-medium">Loading your goals...</p>
            </div>
          ) : goals.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🚀</div>
              <p className="text-gray-600 dark:text-gray-300 text-xl font-semibold mb-2">No goals yet</p>
              <p className="text-gray-400 dark:text-gray-500">Create your first goal to get started with AI-powered task planning!</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {goals.map((goal) => (
                <div
                  key={goal._id}
                  className="group border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-2xl hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 cursor-pointer transform hover:scale-105 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900"
                  onClick={() => navigate(`/goal/${goal._id}`)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <span
                      className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm ${
                        goal.status === 'active'
                          ? 'bg-gradient-to-r from-green-400 to-green-500 text-white'
                          : goal.status === 'completed'
                          ? 'bg-gradient-to-r from-blue-400 to-blue-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {goal.status}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteGoal(goal._id);
                      }}
                      className="text-red-400 hover:text-red-600 dark:hover:text-red-400 transition-colors p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                      title="Delete goal"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-gray-900 dark:text-white font-semibold mb-3 line-clamp-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{goal.goalText}</p>
                  {goal.targetDeadline && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2 mb-2">
                      <span>📅</span>
                      <span>Deadline: {new Date(goal.targetDeadline).toLocaleDateString()}</span>
                    </p>
                  )}
                  <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-2">
                    <span>⏱️</span>
                    <span>Created: {new Date(goal.createdAt).toLocaleDateString()}</span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
