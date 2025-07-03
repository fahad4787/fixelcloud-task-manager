import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiClock, 
  FiUser, 
  FiTag,
  FiMoreVertical,
  FiEdit2,
  FiTrash2
} from 'react-icons/fi';
import { useTaskContext } from '../../contexts/TaskContext';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { formatTimestamp } from '../../utils/dateUtils';
import './TaskCard.scss';

const TaskCard = ({ task, compact = false, showActions = true, onEdit, onDelete }) => {
  const { canEditTasks, canDeleteTasks, canMoveTasks } = useAuth();
  const { 
    getEmployeeById, 
    updateTask 
  } = useTaskContext();

  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const assignee = task.assignee ? getEmployeeById(task.assignee) : null;
  const [showFullDescription, setShowFullDescription] = useState(false);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target) && 
          buttonRef.current && !buttonRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStatusChange = (newStatus) => {
    if (canMoveTasks()) {
      updateTask(task.id, { status: newStatus });
    }
    setShowMenu(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'todo': return 'secondary';
      case 'in-progress': return 'primary';
      case 'review': return 'info';
      case 'done': return 'success';
      default: return 'secondary';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'danger';
      case 'urgent': return 'danger';
      default: return 'secondary';
    }
  };

  if (compact) {
    return (
      <motion.div 
        className="card mb-3 task-card-compact"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2 }}
      >
        <div className="card-body p-3">
          <div className="d-flex justify-content-between align-items-start mb-2">
            <div>
              <h6 className="card-title mb-0">{task.title}</h6>
            </div>
            <div className="d-flex gap-1">
              <span className={`badge bg-${getPriorityColor(task.priority)}`}>{task.priority}</span>
            </div>
          </div>
          {task.description && (
            <div className="description-section">
              <h6 className="description-heading mb-1">Description</h6>
              <p 
                className={`card-text small text-muted mb-2 description${showFullDescription ? ' expanded' : ''}`}
                style={!showFullDescription ? {
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  cursor: 'pointer'
                } : { cursor: 'pointer' }}
                onClick={() => setShowFullDescription(!showFullDescription)}
                title={!showFullDescription ? 'Click to expand' : 'Click to collapse'}
              >
                {task.description}
              </p>
            </div>
          )}
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-light text-dark small">{task.team}</span>
              {assignee && (
                <div className="d-flex align-items-center gap-1 small text-muted">
                  <img 
                    src={assignee.avatar} 
                    alt={assignee.name}
                    className="rounded-circle"
                    style={{ width: '20px', height: '20px' }}
                  />
                  <span>{assignee.name}</span>
                </div>
              )}
            </div>
            <div className="d-flex align-items-center gap-1 small text-muted">
              <FiClock size={12} />
              <span>{formatTimestamp(task.createdAt, 'MMM dd, HH:mm')}</span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div 
      className="card mb-4 task-card"
      style={{ zIndex: 1, overflow: 'visible !important' }}
    >
      <div className="card-body">
        <div className="task-header">
          <div className="task-content">
            <h5 className="card-title mb-2">{task.title}</h5>
            {task.description && (
          <div className="description-section">
            <p 
              className={`card-text text-muted mb-3 description${showFullDescription ? ' expanded' : ''}`}
              style={!showFullDescription ? {
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                cursor: 'pointer'
              } : { cursor: 'pointer' }}
              onClick={() => setShowFullDescription(!showFullDescription)}
              title={!showFullDescription ? 'Click to expand' : 'Click to collapse'}
            >
              {task.description}
            </p>
          </div>
        )}
            <div className="badge-row">
              <span className={`badge bg-${getPriorityColor(task.priority)}`}>{task.priority}</span>
            </div>
          </div>
          
          {showActions && (canEditTasks() || canDeleteTasks() || canMoveTasks()) && (
            <div className="task-menu">
              <button 
                ref={buttonRef}
                className="menu-button"
                onClick={() => setShowMenu(!showMenu)}
                aria-label="Task menu"
              >
                <FiMoreVertical size={16} />
              </button>
              
              <AnimatePresence>
                {showMenu && (
                  <div 
                    ref={menuRef}
                    className="task-dropdown"
                    
                  >
                    {canMoveTasks() && (
                      <>
                        <button 
                          className="dropdown-item"
                          onClick={() => handleStatusChange('todo')}
                        >
                          <FiClock size={14} />
                          <span>Move to Todo</span>
                        </button>
                        <button 
                          className="dropdown-item"
                          onClick={() => handleStatusChange('in-progress')}
                        >
                          <FiClock size={14} />
                          <span>Move to In Progress</span>
                        </button>
                        <button 
                          className="dropdown-item"
                          onClick={() => handleStatusChange('review')}
                        >
                          <FiClock size={14} />
                          <span>Move to Review</span>
                        </button>
                        <button 
                          className="dropdown-item"
                          onClick={() => handleStatusChange('done')}
                        >
                          <FiClock size={14} />
                          <span>Mark as Done</span>
                        </button>
                      </>
                    )}
                    
                    {canEditTasks() && onEdit && (
                      <>
                        {(canMoveTasks() || canDeleteTasks()) && <div className="dropdown-divider"></div>}
                        <button 
                          className="dropdown-item"
                          onClick={() => {
                            console.log('Edit Task clicked', task);
                            onEdit();
                            setShowMenu(false);
                          }}
                        >
                          <FiEdit2 size={14} />
                          <span>Edit Task</span>
                        </button>
                      </>
                    )}
                    
                    {canDeleteTasks() && onDelete && (
                      <>
                        {(canEditTasks() || canMoveTasks()) && <div className="dropdown-divider"></div>}
                        <button 
                          className="dropdown-item delete"
                          onClick={() => {
                            onDelete();
                            setShowMenu(false);
                          }}
                        >
                          <FiTrash2 size={14} />
                          <span>Delete Task</span>
                        </button>
                      </>
                    )}
                  </div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
        
      
        
        <div className="task-meta">
          {assignee && (
            <div className="meta-item">
              <FiUser size={14} />
              <img 
                src={assignee.avatar} 
                alt={assignee.name} 
                className="assignee-avatar"
              />
              <span>{assignee.name}</span>
            </div>
          )}
          <div className="meta-item">
            <FiClock size={14} />
            <span>{formatTimestamp(task.createdAt, 'MMM dd, HH:mm')}</span>
          </div>
        </div>
        
        {task.tags && task.tags.length > 0 && (
          <div className="task-tags">
            {task.tags.map((tag, index) => (
              <span key={index} className="tag">{tag}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCard; 