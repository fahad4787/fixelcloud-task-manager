import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  FiTrendingUp, 
  FiTrendingDown, 
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiUsers,
  FiCalendar,
  FiSettings,
  FiFileText,
  FiBarChart,
  FiUserPlus,
  FiTarget,
  FiMessageSquare,
  FiHome
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useTaskContext } from '../../contexts/TaskContext';
import { userManagementService } from '../../services/firebaseService';
import TaskCard from '../../components/TaskCard';
import PageTitle from '../../components/PageTitle';
import { formatTimestamp, getTimestampForSort } from '../../utils/dateUtils';
import './Dashboard.scss';

const Dashboard = () => {
  const { currentUser, canEditTasks, canManageTasks, canManageUsers, canManageEmployees, canViewAnalytics } = useAuth();
  const { 
    filteredTasks, 
    getOverdueTasks,
    getDueSoonTasks
  } = useTaskContext();
  const [users, setUsers] = useState([]);

  // Load users for statistics
  React.useEffect(() => {
    const loadUsers = async () => {
      try {
        const allUsers = await userManagementService.getAllUsers();
        setUsers(allUsers);
      } catch (error) {
        console.error('Error loading users:', error);
      }
    };
    loadUsers();
  }, []);

  // Color functions for badges
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'danger';
      case 'urgent': return 'danger';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'todo': return 'secondary';
      case 'in-progress': return 'warning';
      case 'review': return 'info';
      case 'done': return 'success';
      default: return 'secondary';
    }
  };

  // Calculate statistics based on user's accessible tasks
  const totalTasks = filteredTasks.length;
  const completedTasks = filteredTasks.filter(task => task.status === 'done').length;
  const inProgressTasks = filteredTasks.filter(task => task.status === 'in-progress').length;
  const pendingTasks = filteredTasks.filter(task => task.status === 'todo').length;
  const activeUsers = users.filter(user => user.isActive).length;

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const avgTasksPerUser = activeUsers > 0 ? Math.round(totalTasks / activeUsers) : 0;

  // Get recent tasks (only accessible ones)
  const recentTasks = filteredTasks
    .sort((a, b) => getTimestampForSort(b.createdAt) - getTimestampForSort(a.createdAt))
    .slice(0, 5);

  // Get role performance (only for accessible tasks)
  const roles = ['designer', 'developer', 'bd', 'manager', 'super_manager'];
  const roleStats = roles.map(role => {
    const roleMembers = users.filter(user => user.role === role && user.isActive);
    const roleTasks = filteredTasks.filter(task => {
      const assignee = users.find(user => user.id === task.assignee);
      return assignee && assignee.role === role;
    });
    const completed = roleTasks.filter(t => t.status === 'done').length;
    const total = roleTasks.length;
    return {
      name: role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      role: role,
      total,
      completed,
      members: roleMembers.length,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  }).filter(stat => stat.members > 0); // Only show roles with active members

  const stats = [
    {
      title: 'Total Tasks',
      value: totalTasks,
      icon: FiCalendar,
      color: 'var(--primary-color)',
      trend: '+12%',
      trendUp: true
    },
    {
      title: 'Completed',
      value: completedTasks,
      icon: FiCheckCircle,
      color: 'var(--success-color)',
      trend: `+${completionRate}%`,
      trendUp: true
    },
    {
      title: 'In Progress',
      value: inProgressTasks,
      icon: FiClock,
      color: 'var(--warning-color)',
      trend: '-5%',
      trendUp: false
    },
    {
      title: 'Active Members',
      value: activeUsers,
      icon: FiUsers,
      color: 'var(--accent-color)',
      trend: '+2',
      trendUp: true
    }
  ];

  // Quick Actions based on user role
  const getQuickActions = () => {
    // For super manager: Project Board, Team Management, Analytics, User Management
    if (currentUser?.role === 'super_manager') {
      return [
        {
          icon: FiFileText,
          title: 'Project Board',
          description: 'View and manage all tasks',
          link: '/project-board',
          color: 'var(--primary-color)'
        },
        {
          icon: FiUsers,
          title: 'Team Management',
          description: 'Manage team members',
          link: '/team',
          color: 'var(--accent-color)'
        },
        {
          icon: FiBarChart,
          title: 'Analytics',
          description: 'View performance metrics',
          link: '/analytics',
          color: 'var(--success-color)'
        },
        {
          icon: FiUserPlus,
          title: 'User Management',
          description: 'Manage user accounts and roles',
          link: '/users',
          color: 'var(--primary-light)'
        }
      ];
    }

    // For manager: Project Board, Team Management, Analytics
    if (currentUser?.role === 'manager') {
      return [
        {
          icon: FiFileText,
          title: 'Project Board',
          description: 'View and manage all tasks',
          link: '/project-board',
          color: 'var(--primary-color)'
        },
        {
          icon: FiUsers,
          title: 'Team Management',
          description: 'Manage team members',
          link: '/team',
          color: 'var(--accent-color)'
        },
        {
          icon: FiBarChart,
          title: 'Analytics',
          description: 'View performance metrics',
          link: '/analytics',
          color: 'var(--success-color)'
        }
      ];
    }

    // For designer, developer, bd: Project Board only
    if (['designer', 'developer', 'bd'].includes(currentUser?.role)) {
      return [
        {
          icon: FiFileText,
          title: 'Project Board',
          description: 'View and manage your tasks',
          link: '/project-board',
          color: 'var(--primary-color)'
        }
      ];
    }

    // Default fallback
    return [
      {
        icon: FiFileText,
        title: 'Project Board',
        description: 'View and manage tasks',
        link: '/project-board',
        color: 'var(--primary-color)'
      }
    ];
  };

  // Get overdue and due soon tasks
  const overdueTasks = getOverdueTasks();
  const dueSoonTasks = getDueSoonTasks();

  return (
    <div className="page-container">
      <PageTitle 
        title="Dashboard"
        subtitle={`Welcome back, ${currentUser?.name}! Here's what's happening with your tasks.`}
        icon={FiHome}
      />

      {/* Deadline Alerts */}
      {(overdueTasks.length > 0 || dueSoonTasks.length > 0) && (
        <div className="deadline-alerts">
          {overdueTasks.length > 0 && (
            <div className="alert alert-danger">
              <FiAlertCircle size={16} />
              <span>{overdueTasks.length} task(s) overdue</span>
            </div>
          )}
          {dueSoonTasks.length > 0 && (
            <div className="alert alert-warning">
              <FiClock size={16} />
              <span>{dueSoonTasks.length} task(s) due soon</span>
            </div>
          )}
        </div>
      )}

      {/* Statistics Cards */}
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            className="stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="stat-icon" style={{ color: stat.color }}>
              <stat.icon size={24} />
            </div>
            <div className="stat-content">
              <h3 className="stat-value">{stat.value}</h3>
              <p className="stat-title">{stat.title}</p>
              <div className={`stat-trend ${stat.trendUp ? 'up' : 'down'}`}>
                {stat.trendUp ? <FiTrendingUp size={14} /> : <FiTrendingDown size={14} />}
                <span>{stat.trend}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="dashboard-content">
        <div className="content-grid">
          {/* Recent Tasks */}
          <motion.div 
            className="recent-tasks-card"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="recent-tasks-header">
              <span className="recent-tasks-icon">📝</span>
              <h3>Recent Tasks</h3>
              <span className="recent-tasks-count">{recentTasks.length}</span>
            </div>
            <div className="recent-tasks-list">
              {recentTasks.length === 0 ? (
                <div className="recent-tasks-empty">
                  <span>📭</span>
                  <p>No recent tasks</p>
                </div>
              ) : (
                recentTasks.map(task => {
                  const assignee = users.find(user => user.id === task.assignee);
                  return (
                    <div key={task.id} className="recent-task-row">
                      <div className="task-main">
                        <span className={`role-dot ${assignee?.role || 'unassigned'}`}></span>
                        <span className="task-title">{task.title}</span>
                        <span className="task-assignee">{assignee?.name || 'Unassigned'}</span>
                      </div>
                      <div className="task-meta">
                        <span className={`badge bg-${getPriorityColor(task.priority)}`}>{task.priority}</span>
                        <span className={`badge bg-${getStatusColor(task.status)}`}>{task.status}</span>
                        <span className="task-date">{formatTimestamp(task.createdAt)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>

          {/* Team Performance - Only show if user can view analytics */}
          {canViewAnalytics() && (
            <motion.div 
              className="team-performance-card"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="team-performance-header">
                <span className="performance-icon">📊</span>
                <h3>Role Performance</h3>
              </div>
              <div className="team-performance-list">
                {roleStats.length === 0 ? (
                  <div className="team-performance-empty">
                    <span>🚩</span>
                    <p>No role progress yet</p>
                  </div>
                ) : (
                  roleStats.map(role => (
                    <div key={role.name} className="team-row">
                      <div className="team-accent" style={{ 
                        background: role.role === 'designer' ? 'var(--primary-color)' : 
                                   role.role === 'developer' ? '#7b1fa2' : 
                                   role.role === 'bd' ? '#388e3c' :
                                   role.role === 'manager' ? '#ff9800' : '#f44336'
                      }} />
                      <div className="team-info">
                        <span className="team-name">{role.name}</span>
                        <span className="team-progress-numbers">{role.completed}/{role.total} ({role.members} members)</span>
                      </div>
                      <div className="team-progress-bar-bg">
                        <div
                          className="team-progress-bar-fill"
                          style={{
                            width: role.total > 0 ? `${role.completionRate}%` : '0%',
                            background: role.role === 'designer'
                              ? 'linear-gradient(90deg, var(--primary-color), var(--primary-light))'
                              : role.role === 'developer'
                              ? 'linear-gradient(90deg, #7b1fa2, #b39ddb)'
                              : role.role === 'bd'
                              ? 'linear-gradient(90deg, #388e3c, #66bb6a)'
                              : role.role === 'manager'
                              ? 'linear-gradient(90deg, #ff9800, #ffb74d)'
                              : 'linear-gradient(90deg, #f44336, #ef5350)'
                          }}
                        />
                      </div>
                      <span className="team-progress-percent">{role.total > 0 ? `${role.completionRate}%` : '0%'}</span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* Quick Actions */}
        <motion.div 
          className="quick-actions"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3>Quick Actions</h3>
          <div className="actions-grid">
            {getQuickActions().map((action, index) => (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
              >
                <Link className="action-card" to={action.link}>
                  <div className="action-icon" style={{ color: action.color }}>
                    <action.icon size={24} />
                  </div>
                  <div className="action-content">
                    <span className="action-title">{action.title}</span>
                    <span className="action-description">{action.description}</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>


    </div>
  );
};

export default Dashboard; 