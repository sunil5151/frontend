import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { goalsAPI, tasksAPI } from '../utils/api';
import { useTheme } from '../context/ThemeContext';

const GoalDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [goal, setGoal] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list'); // 'list' or 'graph'
  const [filter, setFilter] = useState('all'); // 'all', 'completed', 'pending', 'in-progress', 'bug'
  const [editingTask, setEditingTask] = useState(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTaskForAssign, setSelectedTaskForAssign] = useState(null);
  const [newMemberName, setNewMemberName] = useState('');
  const [assignData, setAssignData] = useState({ memberId: '', deadline: '' });
  // New states for help functionality
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [selectedTaskForHelp, setSelectedTaskForHelp] = useState(null);
  const [helpQuestion, setHelpQuestion] = useState('');
  const [isProcessingQuery, setIsProcessingQuery] = useState(false);
  const [queryResponse, setQueryResponse] = useState('');
  const [showQueryHistory, setShowQueryHistory] = useState(false);

  useEffect(() => {
    fetchGoalAndTasks();
  }, [id]);

  useEffect(() => {
    if (tasks.length > 0 && view === 'graph') {
      generateGraph();
    }
  }, [tasks, view]);

  const fetchGoalAndTasks = async () => {
    try {
      const response = await goalsAPI.getById(id);
      setGoal(response.data.data.goal);
      setTasks(response.data.data.tasks);
    } catch (error) {
      console.error('Failed to fetch goal:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateGraph = () => {
    const nodeWidth = 250;
    const nodeHeight = 100;
    const horizontalGap = 350;
    const verticalGap = 150;

    // Create a map of task names to task objects
    const taskMap = {};
    tasks.forEach(task => {
      taskMap[task.taskName] = task;
    });

    // Calculate levels (topological sort)
    const levels = {};
    const visited = new Set();
    
    const calculateLevel = (taskName, currentLevel = 0) => {
      if (visited.has(taskName)) return;
      visited.add(taskName);
      
      const task = taskMap[taskName];
      if (!task) return;
      
      levels[taskName] = Math.max(levels[taskName] || 0, currentLevel);
      
      // Find tasks that depend on this task
      tasks.forEach(t => {
        if (t.dependencies && t.dependencies.includes(taskName)) {
          calculateLevel(t.taskName, currentLevel + 1);
        }
      });
    };

    // Calculate levels for all tasks
    tasks.forEach(task => {
      if (!task.dependencies || task.dependencies.length === 0) {
        calculateLevel(task.taskName, 0);
      }
    });

    // Assign levels to remaining tasks
    tasks.forEach(task => {
      if (levels[task.taskName] === undefined) {
        const maxDepLevel = Math.max(
          0,
          ...(task.dependencies || [])
            .map(dep => levels[dep])
            .filter(l => l !== undefined)
        );
        levels[task.taskName] = maxDepLevel + 1;
      }
    });

    // Group tasks by level
    const tasksByLevel = {};
    Object.keys(levels).forEach(taskName => {
      const level = levels[taskName];
      if (!tasksByLevel[level]) tasksByLevel[level] = [];
      tasksByLevel[level].push(taskName);
    });

    // Create nodes
    const newNodes = tasks.map((task) => {
      const level = levels[task.taskName] || 0;
      const indexInLevel = tasksByLevel[level].indexOf(task.taskName);
      const tasksInLevel = tasksByLevel[level].length;
      
      const x = level * horizontalGap;
      const y = (indexInLevel - (tasksInLevel - 1) / 2) * verticalGap;

      return {
        id: task._id,
        type: 'default',
        data: {
          label: (
            <div className="p-3">
              <div className="font-semibold text-sm mb-1 line-clamp-2">{task.taskName}</div>
              <div className="text-xs text-gray-500">
                {task.estimatedDuration} {task.durationUnit}
              </div>
              <div className="text-xs text-gray-600 mt-1">{task.teamMember}</div>
              {task.isCompleted && (
                <div className="text-xs text-green-600 font-semibold mt-1">✓ Completed</div>
              )}
            </div>
          ),
        },
        position: { x, y },
        style: {
          background: task.isCompleted ? '#d1fae5' : '#fff',
          border: `2px solid ${task.isCompleted ? '#10b981' : '#3b82f6'}`,
          borderRadius: '8px',
          width: nodeWidth,
        },
      };
    });

    // Create edges based on dependencies
    const newEdges = [];
    tasks.forEach((task) => {
      if (task.dependencies && task.dependencies.length > 0) {
        task.dependencies.forEach((depName) => {
          const depTask = tasks.find(t => t.taskName === depName);
          if (depTask) {
            newEdges.push({
              id: `${depTask._id}-${task._id}`,
              source: depTask._id,
              target: task._id,
              type: 'smoothstep',
              animated: !task.isCompleted,
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: '#3b82f6',
              },
              style: {
                stroke: '#3b82f6',
                strokeWidth: 2,
              },
            });
          }
        });
      }
    });

    setNodes(newNodes);
    setEdges(newEdges);
  };

  const handleUpdateTask = async (taskId, updates) => {
    try {
      await tasksAPI.update(taskId, updates);
      fetchGoalAndTasks();
      setEditingTask(null);
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'completed') return task.status === 'completed';
    if (filter === 'pending') return task.status === 'pending';
    if (filter === 'in-progress') return task.status === 'in-progress';
    if (filter === 'bug') return task.status === 'bug';
    return true;
  });

  const handleAddTeamMember = () => {
    if (newMemberName.trim()) {
      setTeamMembers([...teamMembers, { id: Date.now().toString(), name: newMemberName.trim() }]);
      setNewMemberName('');
      setShowAddMemberModal(false);
    }
  };

  const handleAssignTask = async () => {
    if (assignData.memberId && assignData.deadline && selectedTaskForAssign) {
      try {
        const member = teamMembers.find(m => m.id === assignData.memberId);
        await handleUpdateTask(selectedTaskForAssign, {
          assignedTo: member.name,
          deadline: assignData.deadline
        });
        setShowAssignModal(false);
        setSelectedTaskForAssign(null);
        setAssignData({ memberId: '', deadline: '' });
      } catch (error) {
        console.error('Failed to assign task:', error);
      }
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    await handleUpdateTask(taskId, { status: newStatus });
  };

  // New function to handle help queries
  const handleHelpQuery = async () => {
    if (!helpQuestion.trim() || !selectedTaskForHelp) return;
    
    setIsProcessingQuery(true);
    setQueryResponse('');
    
    try {
      const response = await tasksAPI.query(selectedTaskForHelp._id, helpQuestion);
      
      // Check if response has the expected structure
      if (response && response.data && response.data.response) {
        setQueryResponse(response.data.response);
      } else {
        setQueryResponse('No response received from the AI assistant.');
      }
      
      // Refresh tasks to get updated query history
      fetchGoalAndTasks();
      
      // Expand the conversation history section to show the new response
      setShowQueryHistory(true);
      
      // Scroll to the response area
      setTimeout(() => {
        const responseElement = document.getElementById('query-response-area');
        if (responseElement) {
          responseElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 100);
    } catch (error) {
      console.error('Failed to process query:', error);
      setQueryResponse('Sorry, there was an error processing your query. Please try again.');
    } finally {
      setIsProcessingQuery(false);
    }
  };

  // Function to parse subtasks from response if it's JSON
  const parseSubtasks = (response) => {
    if (!response) return null;
    
    try {
      // Handle case where response might be wrapped in code blocks
      let cleanResponse = response.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.substring(7);
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.substring(3);
      }
      
      if (cleanResponse.endsWith('```')) {
        cleanResponse = cleanResponse.slice(0, -3);
      }
      
      cleanResponse = cleanResponse.trim();
      
      // Try to parse as JSON
      const parsed = JSON.parse(cleanResponse);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      return null;
    } catch (e) {
      // Not JSON or invalid JSON, return null
      return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!goal) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Goal not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-primary hover:text-blue-600 font-medium mb-2 flex items-center dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-gray-900 mb-2 dark:text-white">{goal.goalText}</h1>
          {goal.targetDeadline && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Target Deadline: {new Date(goal.targetDeadline).toLocaleDateString()}
            </p>
          )}
        </div>
      </header>

      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            {/* View Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setView('list')}
                className={`px-4 py-2 rounded-lg font-medium transition ${view === 'list' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
              >
                List View
              </button>
              <button
                onClick={() => setView('graph')}
                className={`px-4 py-2 rounded-lg font-medium transition ${view === 'graph' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
              >
                Dependency Graph
              </button>
            </div>

            {/* Filter */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition ${filter === 'all' ? 'bg-gray-800 text-white dark:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'}`}
              >
                All ({tasks.length})
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition ${filter === 'pending' ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'}`}
              >
                Pending ({tasks.filter(t => t.status === 'pending').length})
              </button>
              <button
                onClick={() => setFilter('in-progress')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition ${filter === 'in-progress' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'}`}
              >
                In-Progress ({tasks.filter(t => t.status === 'in-progress').length})
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition ${filter === 'completed' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'}`}
              >
                Completed ({tasks.filter(t => t.status === 'completed').length})
              </button>
              <button
                onClick={() => setFilter('bug')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition ${filter === 'bug' ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'}`}
              >
                Bug ({tasks.filter(t => t.status === 'bug').length})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === 'list' ? (
          <div className="space-y-6">
            {/* Team Management Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 transition-colors duration-300">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Team Members</h2>
                <button
                  onClick={() => setShowAddMemberModal(true)}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition flex items-center gap-2"
                >
                  + Add Team Member
                </button>
              </div>
              
              {teamMembers.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm">No team members added yet. Click "Add Team Member" to get started.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {teamMembers.map(member => (
                    <div key={member.id} className="px-4 py-2 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded-lg font-medium">
                      {member.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tasks Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 transition-colors duration-300">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Tasks</h2>
            
            {filteredTasks.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">No tasks found</p>
            ) : (
              <div className="space-y-4">
                {filteredTasks.map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    editingTask={editingTask}
                    setEditingTask={setEditingTask}
                    handleUpdateTask={handleUpdateTask}
                    handleStatusChange={handleStatusChange}
                    teamMembers={teamMembers}
                    onAssignClick={(taskId) => {
                      setSelectedTaskForAssign(taskId);
                      setShowAssignModal(true);
                    }}
                    // Pass new props for help functionality
                    onHelpClick={(task) => {
                      setSelectedTaskForHelp(task);
                      setShowHelpModal(true);
                      setHelpQuestion('');
                      setQueryResponse('');
                    }}
                  />
                ))}
              </div>
            )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg" style={{ height: '700px' }}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              fitView
              attributionPosition="bottom-left"
            >
              <Controls />
              <MiniMap />
              <Background variant="dots" gap={12} size={1} />
            </ReactFlow>
          </div>
        )}
      </main>

      {/* Add Team Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700 transition-colors duration-300">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Add Team Member</h3>
            <input
              type="text"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              placeholder="Enter member name"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg mb-4 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              onKeyPress={(e) => e.key === 'Enter' && handleAddTeamMember()}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowAddMemberModal(false);
                  setNewMemberName('');
                }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTeamMember}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition"
              >
                Add Member
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Task Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700 transition-colors duration-300">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Assign Task</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Team Member</label>
                <select
                  value={assignData.memberId}
                  onChange={(e) => setAssignData({ ...assignData, memberId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                >
                  <option value="">Select a member</option>
                  {teamMembers.map(member => (
                    <option key={member.id} value={member.id}>{member.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Deadline</label>
                <input
                  type="date"
                  value={assignData.deadline}
                  onChange={(e) => setAssignData({ ...assignData, deadline: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-6">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedTaskForAssign(null);
                  setAssignData({ memberId: '', deadline: '' });
                }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignTask}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition"
                disabled={!assignData.memberId || !assignData.deadline}
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelpModal && selectedTaskForHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full mx-4 border border-gray-200 dark:border-gray-700 transition-colors duration-300 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Task Conversation</h3>
              <button
                onClick={() => {
                  setShowHelpModal(false);
                  setSelectedTaskForHelp(null);
                  setHelpQuestion('');
                  setQueryResponse('');
                  setShowQueryHistory(false);
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Task: <span className="font-semibold">{selectedTaskForHelp.taskName}</span></p>
            </div>
            
            {/* Query History Toggle */}
            {selectedTaskForHelp.queryHistory && selectedTaskForHelp.queryHistory.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={() => setShowQueryHistory(!showQueryHistory)}
                  className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition flex items-center gap-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Conversation History ({selectedTaskForHelp.queryHistory.length})
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transform ${showQueryHistory ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showQueryHistory && (
                  <div className="mt-2 space-y-3 max-h-60 overflow-y-auto p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                    {[...selectedTaskForHelp.queryHistory].reverse().map((entry, index) => (
                      <div key={index} className="border-b border-gray-100 dark:border-gray-700 pb-3 last:border-0">
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            {new Date(entry.createdAt).toLocaleString()}
                          </p>
                          <button 
                            onClick={() => {
                              // Copy this entry to the question input
                              setHelpQuestion(entry.question);
                            }}
                            className="text-xs text-primary hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Use this question"
                          >
                            Use
                          </button>
                        </div>
                        <div className="mb-2">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Q: {entry.question}</p>
                        </div>
                        <div className="ml-2">
                          {parseSubtasks(entry.response) ? (
                            <div>
                              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">A (Subtasks):</p>
                              <div className="space-y-1">
                                {parseSubtasks(entry.response).map((subtask, idx) => (
                                  <div key={idx} className="flex items-start gap-1 text-xs">
                                    <span className="text-primary">•</span>
                                    <span className="text-gray-600 dark:text-gray-400">
                                      {subtask.subtaskName} ({subtask.estimatedDuration} {subtask.durationUnit})
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">A:</p>
                              <p className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                                {entry.response}
                              </p>
                            </div>
                          )}
                        </div>

                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Response Display - Moved above the question input */}
            {queryResponse && (
              <div id="query-response-area" className="mb-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Response:</h4>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  {/* Check if response contains subtasks */}
                  {console.log('Rendering response area with:', queryResponse) /* Debug log */}
                  {parseSubtasks(queryResponse) ? (
                    <div>
                      <h5 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Suggested Subtasks:</h5>
                      <div className="space-y-2">
                        {parseSubtasks(queryResponse).map((subtask, index) => (
                          <div key={index} className="flex items-start gap-2 p-3 bg-white dark:bg-gray-600 rounded-lg">
                            <div className="flex-shrink-0 mt-1">
                              <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                <span className="text-xs font-bold text-blue-800 dark:text-blue-200">{index + 1}</span>
                              </div>
                            </div>
                            <div>
                              <p className="font-medium text-gray-800 dark:text-gray-200">{subtask.subtaskName}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Estimated Duration: {subtask.estimatedDuration} {subtask.durationUnit}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{queryResponse}</p>
                    </div>
                  )}
                </div>
                
                {/* Action buttons for the response */}
                <div className="mt-4 flex gap-2 flex-wrap">
                  <button
                    onClick={() => {
                      // Copy response to clipboard
                      navigator.clipboard.writeText(queryResponse);
                    }}
                    className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                  >
                    Copy Response
                  </button>
                  {parseSubtasks(queryResponse) && (
                    <button
                      onClick={() => {
                        // Add subtasks to the task
                        const subtasks = parseSubtasks(queryResponse);
                        handleUpdateTask(selectedTaskForHelp._id, {
                          subtasks: subtasks.map(st => ({
                            subtaskName: st.subtaskName,
                            estimatedDuration: st.estimatedDuration,
                            durationUnit: st.durationUnit
                          }))
                        });
                      }}
                      className="px-3 py-1 bg-primary text-white rounded-lg text-sm hover:bg-blue-600 transition"
                    >
                      Add Subtasks to Task
                    </button>
                  )}
                </div>
              </div>
            )}
            
            {/* Question Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ask a question about this task:
              </label>
              <textarea
                value={helpQuestion}
                onChange={(e) => setHelpQuestion(e.target.value)}
                placeholder="e.g., Break this task into subtasks, What steps should I follow?, What tools do I need for this task?"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition min-h-[100px]"
                disabled={isProcessingQuery}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Examples: "Break this task into subtasks", "What steps should I follow?", "What tools do I need for this task?"
              </p>
            </div>
            
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowHelpModal(false);
                  setSelectedTaskForHelp(null);
                  setHelpQuestion('');
                  setQueryResponse('');
                  setShowQueryHistory(false);
                }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                disabled={isProcessingQuery}
              >
                Close
              </button>
              <button
                onClick={handleHelpQuery}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition flex items-center gap-2"
                disabled={isProcessingQuery || !helpQuestion.trim()}
              >
                {isProcessingQuery ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  'Ask Question'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// TaskCard Component
const TaskCard = ({ task, editingTask, setEditingTask, handleUpdateTask, handleStatusChange, teamMembers, onAssignClick, onHelpClick }) => {
  const [formData, setFormData] = useState({
    taskName: task.taskName,
    estimatedDuration: task.estimatedDuration,
    durationUnit: task.durationUnit,
    suggestedDeadline: task.suggestedDeadline?.split('T')[0] || '',
    teamMember: task.teamMember,
    priority: task.priority || 'medium',
    isCompleted: task.isCompleted,
  });

  const isEditing = editingTask === task._id;

  const handleSubmit = (e) => {
    e.preventDefault();
    handleUpdateTask(task._id, formData);
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition bg-white dark:bg-gray-800">
      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            value={formData.taskName}
            onChange={(e) => setFormData({ ...formData, taskName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            placeholder="Task name"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              value={formData.estimatedDuration}
              onChange={(e) => setFormData({ ...formData, estimatedDuration: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              placeholder="Duration"
            />
            <select
              value={formData.durationUnit}
              onChange={(e) => setFormData({ ...formData, durationUnit: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            >
              <option value="hours">Hours</option>
              <option value="days">Days</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <select
              value={formData.priority || 'medium'}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
            <input
              type="date"
              value={formData.suggestedDeadline}
              onChange={(e) => setFormData({ ...formData, suggestedDeadline: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
          <input
            type="text"
            value={formData.teamMember}
            onChange={(e) => setFormData({ ...formData, teamMember: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            placeholder="Team member"
          />
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition">
              Save
            </button>
            <button
              type="button"
              onClick={() => setEditingTask(null)}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div>
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">{task.taskName}</h3>
                {/* Priority Badge */}
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  task.priority === 'high' ? 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200' :
                  task.priority === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200' :
                  'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200'
                }`}>
                  {task.priority}
                </span>
                {/* Status Badge */}
                <select
                  value={task.status || 'pending'}
                  onChange={(e) => handleStatusChange(task._id, e.target.value)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium border-0 cursor-pointer ${
                    task.status === 'completed' ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200' :
                    task.status === 'in-progress' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200' :
                    task.status === 'bug' ? 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200' :
                    'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200'
                  }`}
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In-Progress</option>
                  <option value="completed">Completed</option>
                  <option value="bug">Bug</option>
                </select>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Duration: {task.estimatedDuration} {task.durationUnit}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Team Member: {task.assignedTo || task.teamMember || 'Unassigned'}</p>
              {task.deadline && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Deadline: {new Date(task.deadline).toLocaleDateString()}
                </p>
              )}
              {task.suggestedDeadline && !task.deadline && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Suggested Deadline: {new Date(task.suggestedDeadline).toLocaleDateString()}
                </p>
              )}
              {task.dependencies && task.dependencies.length > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Depends on: {task.dependencies.join(', ')}
                </p>
              )}
              {/* Subtasks */}
              {task.subtasks && task.subtasks.length > 0 && (
                <div className="mt-3 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Subtasks:</p>
                  <ul className="space-y-1">
                    {task.subtasks.map((subtask, index) => (
                      <li key={index} className="text-xs text-gray-600 dark:text-gray-400 flex items-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 mr-2"></span>
                        {subtask.subtaskName} ({subtask.estimatedDuration} {subtask.durationUnit})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onAssignClick(task._id)}
                className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition"
                disabled={teamMembers.length === 0}
                title={teamMembers.length === 0 ? 'Add team members first' : 'Assign to team member'}
              >
                Assign
              </button>
              <button
                onClick={() => setEditingTask(task._id)}
                className="px-3 py-1 text-primary hover:text-blue-600 font-medium dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
              >
                Edit
              </button>
              {/* Conversation History Button */}
              <button
                onClick={() => onHelpClick(task)}
                className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition flex items-center justify-center"
                title="View conversation history"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default GoalDetail;
