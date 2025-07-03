import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiHome, 
  FiTrello, 
  FiUsers, 
  FiUserCheck,
  FiBarChart2, 
  FiSettings,
  FiChevronDown,
  FiChevronRight
} from 'react-icons/fi';
import { useTaskContext } from '../../contexts/TaskContext';
import { useAuth } from '../../contexts/AuthContext';
import './Sidebar.scss';

const Sidebar = ({ sidebarOpen }) => {
  const { 
    tasks, 
    employees
  } = useTaskContext();
  const { currentUser } = useAuth();

  const navigation = [
    { path: '/', icon: FiHome, label: 'Dashboard' },
    { path: '/project-board', icon: FiTrello, label: 'Project Board' },
    ...(currentUser?.role === 'super_admin' || currentUser?.role === 'admin' ? [
      { path: '/team', icon: FiUsers, label: 'Team Management' }
    ] : []),
    ...(currentUser?.role === 'super_admin' ? [
      { path: '/users', icon: FiUserCheck, label: 'User Management' }
    ] : []),
    ...(currentUser?.role === 'super_admin' || currentUser?.role === 'admin' ? [
      { path: '/analytics', icon: FiBarChart2, label: 'Analytics' }
    ] : []),
    { path: '/settings', icon: FiSettings, label: 'Settings' }
  ];

  // Get role-based statistics
  const getRoleStats = () => {
    const roles = ['designer', 'developer', 'bd', 'admin', 'super_admin'];
    return roles.map(role => {
      const roleMembers = employees.filter(emp => emp.role === role && emp.isActive);
      const roleTasks = tasks.filter(task => {
        const assignee = employees.find(emp => emp.id === task.assignee);
        return assignee && assignee.role === role;
      });
      
      return {
        role: role,
        members: roleMembers.length,
        tasks: roleTasks.length,
        todo: roleTasks.filter(t => t.status === 'todo').length,
        inProgress: roleTasks.filter(t => t.status === 'in-progress').length,
        done: roleTasks.filter(t => t.status === 'done').length
      };
    }).filter(stat => stat.members > 0); // Only show roles with active members
  };

  return (
    <motion.aside 
      className={`sidebar${sidebarOpen ? ' open' : ''}`}
      initial={{ x: -280 }}
      animate={{ x: sidebarOpen ? 0 : -280 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      <div className="sidebar-logo">
        <span className="logo-icon">F</span>
      </div>
      <nav className="sidebar-nav">
        <div className="nav-section">
          <h6 className="nav-title text-uppercase text-muted fw-bold mb-3">Main Menu</h6>
          <ul className="nav flex-column">
            {navigation.map((item) => (
              <li key={item.path} className="nav-item">
                <NavLink 
                  to={item.path} 
                  className={({ isActive }) => `nav-link d-flex align-items-center ${isActive ? 'active' : ''}`}
                >
                  <item.icon size={18} className="me-3" />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        <div className="nav-section">
          <h6 className="nav-title text-uppercase text-muted fw-bold mb-3">Roles Overview</h6>
          <div className="roles-list">
            {getRoleStats().map((roleStat) => (
              <div key={roleStat.role} className="role-item">
                <div className="role-header p-2">
                  <div className="d-flex justify-content-between align-items-center w-100">
                    <div className="d-flex align-items-center">
                      <div className={`role-color ${roleStat.role}`} />
                      <span className="role-name text-capitalize">{roleStat.role.replace('_', ' ')}</span>
                    </div>
                    <div className="d-flex align-items-center">
                      <span className="badge bg-secondary me-2">{roleStat.tasks}</span>
                      <span className="badge bg-primary">{roleStat.members}</span>
                    </div>
                  </div>
                </div>
                
                <div className="role-details p-2">
                  <div className="stat-item">
                    <span className="stat-label todo"><span className="dot"></span>To Do</span>
                    <span className="stat-value">{roleStat.todo}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label progress"><span className="dot"></span>In Progress</span>
                    <span className="stat-value">{roleStat.inProgress}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label done"><span className="dot"></span>Done</span>
                    <span className="stat-value">{roleStat.done}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </nav>
      <div className="sidebar-stats-balance">
        <div className="stat-pill">
          <span className="stat-dot tasks"></span>
          <span className="stat-number">{tasks.length}</span>
          <span className="stat-label">Total Tasks</span>
        </div>
        <div className="stat-pill">
          <span className="stat-dot members"></span>
          <span className="stat-number">{employees.filter(emp => emp.isActive).length}</span>
          <span className="stat-label">Active Members</span>
        </div>
      </div>
    </motion.aside>
  );
};

export default Sidebar; 