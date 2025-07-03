import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiUser, FiSettings, FiLogOut, FiMenu } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useTaskContext } from '../../contexts/TaskContext';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.png';
import Modal from '../Modal';
import './Header.scss';

const AnimatedMenuIcon = ({ open }) => (
  <div className={`animated-menu-icon${open ? ' open' : ''}`}>
    <span></span>
    <span></span>
    <span></span>
  </div>
);

const Header = ({ onMenuClick, sidebarOpen }) => {
  const { currentUser, logout } = useAuth();
  const { addTask, employees } = useTaskContext();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const [quickTask, setQuickTask] = useState({ 
    title: '', 
    description: '',
    priority: 'medium',
    assignee: ''
  });
  const navigate = useNavigate();
  const userMenuRef = useRef(null);
  const assigneeDropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (assigneeDropdownRef.current && !assigneeDropdownRef.current.contains(event.target)) {
        setShowAssigneeDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleQuickAdd = (e) => {
    e.preventDefault();
    if (quickTask.title.trim() && quickTask.assignee) {
      addTask({
        title: quickTask.title,
        description: quickTask.description,
        priority: quickTask.priority,
        assignee: quickTask.assignee,
        status: 'todo'
      });
      setQuickTask({ 
        title: '', 
        description: '',
        priority: 'medium',
        assignee: ''
      });
      setShowQuickAdd(false);
    }
  };

  // Filter employees based on search
  const filteredEmployees = employees.filter(emp => 
    emp.isActive && emp.name.toLowerCase().includes(assigneeSearch.toLowerCase())
  );

  // Get selected employee name
  const selectedEmployee = employees.find(emp => emp.id === quickTask.assignee);

  const handleDropdownNav = (path) => {
    setShowUserMenu(false);
    navigate(path);
  };

  const handleLogout = () => {
    setShowUserMenu(false);
    logout();
    navigate('/login');
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'super_admin':
        return 'Super Admin';
      case 'admin':
        return 'Admin';
      case 'user':
        return 'User';
      default:
        return role;
    }
  };

  return (
    <header className="header navbar navbar-expand-lg navbar-light bg-white border-bottom">
      <div className="container-fluid">
        <button className="menu-btn btn btn-link me-3" onClick={onMenuClick} aria-label="Toggle sidebar">
          <AnimatedMenuIcon open={sidebarOpen} />
        </button>
        <div className="navbar-brand">
          <button 
            className="btn btn-link p-0" 
            onClick={() => navigate('/')}
          >
            <img src={logo} alt="Logo" className="logo-img" />
          </button>
        </div>
        
        <div className="navbar-nav ms-auto align-items-center">
          <div className="nav-item me-3">
            <button 
              className="btn btn-primary"
              onClick={() => setShowQuickAdd(!showQuickAdd)}
            >
              <FiPlus className="me-2" />
              Quick Add
            </button>
          </div>
          
          <div className="nav-item dropdown" ref={userMenuRef}>
            <button 
              className="btn btn-link nav-link dropdown-toggle d-flex align-items-center"
              onClick={() => setShowUserMenu(!showUserMenu)}
              aria-expanded={showUserMenu}
            >
              <img 
                src={currentUser?.avatar} 
                alt={currentUser?.name}
                className="user-avatar me-2"
              />
              <span className="user-name">{currentUser?.name}</span>
            </button>
            
            <AnimatePresence>
              {showUserMenu && (
                <motion.div 
                  className="dropdown-menu dropdown-menu-end show"
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="dropdown-header">
                   <div className='d-flex justify-content-center'>
                    <img 
                      src={currentUser?.avatar} 
                      alt={currentUser?.name}
                      className="dropdown-avatar me-3"
                    />
                   </div>
                    <div className="dropdown-user-info">
                      <h6 className="mb-1">{currentUser?.name}</h6>
                      <small>{currentUser?.email}</small>
                      <div className="mt-1">
                        <span className="badge bg-primary">{getRoleDisplayName(currentUser?.role)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item" onClick={() => handleDropdownNav('/settings')}>
                    <FiUser className="me-2" size={16} />
                    Profile
                  </button>
                  <button className="dropdown-item" onClick={() => handleDropdownNav('/settings')}>
                    <FiSettings className="me-2" size={16} />
                    Settings
                  </button>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item text-danger" onClick={handleLogout}>
                    <FiLogOut className="me-2" size={16} />
                    Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        title="Quick Add Task"
        size="medium"
      >
        <form onSubmit={handleQuickAdd}>
          <div className="form-group">
            <label>Task Title</label>
            <input
              type="text"
              className="form-control"
              placeholder="Enter task title..."
              value={quickTask.title}
              onChange={(e) => setQuickTask({ ...quickTask, title: e.target.value })}
              autoFocus
              required
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              className="form-control"
              placeholder="Enter description..."
              value={quickTask.description}
              onChange={(e) => setQuickTask({ ...quickTask, description: e.target.value })}
              rows={3}
            />
          </div>
          <div className="form-group">
            <label>Priority</label>
            <select
              className="form-select"
              value={quickTask.priority}
              onChange={(e) => setQuickTask({ ...quickTask, priority: e.target.value })}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div className="form-group" ref={assigneeDropdownRef}>
            <label>Assignee *</label>
            <div className="position-relative">
              <div
                className="form-control d-flex justify-content-between align-items-center"
                style={{ cursor: 'pointer' }}
                onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
              >
                <span style={{ color: quickTask.assignee ? '#333' : '#6c757d' }}>
                  {selectedEmployee ? selectedEmployee.name : 'Select assignee...'}
                </span>
                <i className={`fas fa-chevron-${showAssigneeDropdown ? 'up' : 'down'}`}></i>
              </div>
              
              {showAssigneeDropdown && (
                <div 
                  className="position-absolute w-100 bg-white border rounded mt-1"
                  style={{ 
                    zIndex: 1000, 
                    maxHeight: '150px', 
                    overflowY: 'auto',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    top: '100%',
                    left: 0
                  }}
                >
                  <div className="p-2 border-bottom">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Search employees..."
                      value={assigneeSearch}
                      onChange={(e) => setAssigneeSearch(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  {filteredEmployees.length > 0 ? (
                    filteredEmployees.map(employee => (
                      <div
                        key={employee.id}
                        className="p-2 border-bottom"
                        style={{ 
                          cursor: 'pointer',
                          backgroundColor: quickTask.assignee === employee.id ? '#f8f9fa' : 'white'
                        }}
                        onClick={() => {
                          setQuickTask({ ...quickTask, assignee: employee.id });
                          setShowAssigneeDropdown(false);
                          setAssigneeSearch('');
                        }}
                      >
                        <div className="d-flex align-items-center">
                          <img 
                            src={employee.avatar || 'https://via.placeholder.com/32'} 
                            alt={employee.name}
                            className="rounded-circle me-2"
                            style={{ width: '24px', height: '24px' }}
                          />
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: '500' }}>
                              {employee.name}
                            </div>
                            <div style={{ fontSize: '12px', color: '#6c757d' }}>
                              {employee.role}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-2 text-muted text-center">
                      No employees found
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="modal-actions">
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => setShowQuickAdd(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn--primary">
              Add Task
            </button>
          </div>
        </form>
      </Modal>
    </header>
  );
};

export default Header; 