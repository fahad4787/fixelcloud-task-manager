import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiFilter,
  FiSearch,
  FiEye,
  FiEyeOff,
  FiEdit3,
  FiTrash2,
  FiTrello,
  FiClock, 
  FiUser, 
  FiCalendar, 
  FiPlus 
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useTaskContext } from '../../contexts/TaskContext';
import { userManagementService } from '../../services/firebaseService';
import TaskCard from '../../components/TaskCard';
import Modal from '../../components/Modal';
import PageTitle from '../../components/PageTitle';
import { formatTimestamp } from '../../utils/dateUtils';
import './ProjectBoard.scss';

const ProjectBoard = () => {
  const { currentUser, canEditTasks, canDeleteTasks, canMoveTasks, canManageTasks, canAssignTasks, canViewAllTasks } = useAuth();
  const { 
    tasksByStatus, 
    tasks,
    moveTask, 
    reorderTasksInColumn,
    updateTask,
    deleteTask,
    addTask,
    getOverdueTasks,
    getDueSoonTasks
  } = useTaskContext();

  const [editingTask, setEditingTask] = useState(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '', 
    description: '', 
    priority: 'medium', 
    assignee: '', 
    deadline: '', 
    estimatedHours: 0
  });
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    assignee: 'all'
  });
  const [showCompleted, setShowCompleted] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Drag and drop state
  const [draggedTask, setDraggedTask] = useState(null);
  const [draggedOverColumn, setDraggedOverColumn] = useState(null);

  // Load users for assignment
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const allUsers = await userManagementService.getAllUsers();
        setUsers(allUsers.filter(user => user.isActive));
      } catch (error) {
        console.error('Error loading users:', error);
      }
    };
    loadUsers();
  }, []);

  const handleAddTask = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!newTask.title.trim()) {
      setError('Task title is required');
      setLoading(false);
      return;
    }

    try {
      const taskData = {
        ...newTask,
        status: 'todo',
        assignee: newTask.assignee || null,
        assignedBy: currentUser.uid,
        deadline: newTask.deadline ? new Date(newTask.deadline) : null,
        estimatedHours: parseInt(newTask.estimatedHours) || 0
      };

      await addTask(taskData);
      
      // Reset form
      setNewTask({
        title: '', 
        description: '', 
        priority: 'medium', 
        assignee: '', 
        deadline: '', 
        estimatedHours: 0
      });
      setShowAddTask(false);
    } catch (error) {
      console.error('Error adding task:', error);
      setError('Failed to add task');
    } finally {
      setLoading(false);
    }
  };

  const handleEditTask = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const updates = {
        title: editingTask.title,
        description: editingTask.description,
        priority: editingTask.priority,
        assignee: editingTask.assignee || null,
        assignedBy: currentUser.uid,
        deadline: editingTask.deadline ? new Date(editingTask.deadline) : null,
        estimatedHours: parseInt(editingTask.estimatedHours) || 0,
        team: editingTask.team
      };

      await updateTask(editingTask.id, updates);
      setEditingTask(null);
    } catch (error) {
      console.error('Error updating task:', error);
      setError('Failed to update task');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(taskId);
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  const handleMoveTask = async (taskId, newStatus) => {
    try {
      await moveTask(taskId, newStatus);
    } catch (error) {
      console.error('Error moving task:', error);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    setDraggedOverColumn(columnId);
  };

  const handleDrop = async (e, columnId) => {
    e.preventDefault();
    if (draggedTask && draggedTask.status !== columnId) {
      await handleMoveTask(draggedTask.id, columnId);
    }
    setDraggedTask(null);
    setDraggedOverColumn(null);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDraggedOverColumn(null);
  };

  const overdueTasks = getOverdueTasks();
  const dueSoonTasks = getDueSoonTasks();

  const getUserById = (id) => {
    return users.find(user => user.id === id);
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'admin': return 'Admin';
      case 'super_manager': return 'Super Manager';
      case 'manager': return 'Manager';
      case 'designer': return 'Designer';
      case 'developer': return 'Developer';
      case 'bd': return 'Business Developer';
      default: return role;
    }
  };

  const columns = [
    { id: 'todo', title: 'To Do', color: '#e1e5e9' },
    { id: 'in-progress', title: 'In Progress', color: '#15a970' },
    { id: 'review', title: 'Review', color: '#f59e0b' },
    { id: 'done', title: 'Done', color: '#10b981' }
  ];

  const filteredTasksByStatus = {};
  columns.forEach(column => {
    let columnTasks = tasksByStatus[column.id] || [];
    
    // Apply search filter
    if (searchTerm) {
      columnTasks = columnTasks.filter(task => 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply priority filter
    if (filters.priority !== 'all') {
      columnTasks = columnTasks.filter(task => task.priority === filters.priority);
    }
    
    // Apply assignee filter
    if (filters.assignee !== 'all') {
      columnTasks = columnTasks.filter(task => task.assignee === filters.assignee);
    }
    
    // Apply completed filter
    if (!showCompleted) {
      columnTasks = columnTasks.filter(task => task.status !== 'done');
    }
    
    filteredTasksByStatus[column.id] = columnTasks;
  });

  return (
    <div className="page-container">
      <PageTitle 
        title="Project Board"
        subtitle="Manage and track your team's tasks"
        icon={FiTrello}
        filters={
          <div className="header-actions">
            <div className="search-box">
              <FiSearch size={16} />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="filter-group">
              <select
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              >
                <option value="all">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              
              <select
                value={filters.assignee}
                onChange={(e) => setFilters({ ...filters, assignee: e.target.value })}
            >
                <option value="all">All Assignees</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({getRoleDisplayName(user.role)})
                  </option>
                ))}
              </select>
            </div>
            
            <button 
              className="btn btn--secondary"
              onClick={() => setShowCompleted(!showCompleted)}
            >
              {showCompleted ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              {showCompleted ? 'Hide' : 'Show'} Completed
            </button>
            
            {canAssignTasks() && (
              <button
                className="btn btn--primary"
                onClick={() => setShowAddTask(true)}
              >
                <FiPlus size={16} />
                Add Task
              </button>
            )}
          </div>
        }
      />

      {/* Deadline Alerts */}
      {(overdueTasks.length > 0 || dueSoonTasks.length > 0) && (
        <div className="deadline-alerts">
          {overdueTasks.length > 0 && (
            <div className="alert alert-danger">
              <FiClock size={16} />
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

      {/* Kanban Board */}
      <div className="kanban-board">
        {columns.map(column => (
          <div 
            key={column.id} 
            className={`kanban-column ${draggedOverColumn === column.id ? 'drag-over' : ''}`}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDrop={(e) => handleDrop(e, column.id)}
            onDragEnd={handleDragEnd}
          >
            <div className="column-header">
              <h3>{column.title}</h3>
              <span className="task-count">
                {filteredTasksByStatus[column.id]?.length || 0}
              </span>
            </div>
            
            <div className="column-content">
              <AnimatePresence>
                {filteredTasksByStatus[column.id]?.map((task, index) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, task)}
                        onDragEnd={handleDragEnd}
                    style={{ opacity: draggedTask?.id === task.id ? 0.5 : 1 }}
                      >
                        <TaskCard 
                          task={task}
                          onEdit={() => setEditingTask(task)}
                          onDelete={() => handleDeleteTask(task.id)}
                          onMove={(newStatus) => handleMoveTask(task.id, newStatus)}
                          getUserById={getUserById}
                        />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>

      {/* Add Task Modal */}
      <Modal isOpen={showAddTask} onClose={() => setShowAddTask(false)} title="Add New Task" size="medium">
        <form onSubmit={handleAddTask}>
          {error && (
            <div className="error-message">
              <FiUser size={16} />
              <span>{error}</span>
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="title">Task Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              placeholder="Enter task title"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              placeholder="Enter task description"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label htmlFor="priority">Priority</label>
            <select
              id="priority"
              name="priority"
              value={newTask.priority}
              onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="assignee">Assign To</label>
              <select
                id="assignee"
                name="assignee"
                value={newTask.assignee}
                onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
              >
                <option value="">Unassigned</option>
                <optgroup label="Designers">
                  {users.filter(user => user.role === 'designer').map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Developers">
                  {users.filter(user => user.role === 'developer').map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Business Developers">
                  {users.filter(user => user.role === 'bd').map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Managers">
                  {users.filter(user => user.role === 'manager' || user.role === 'super_manager').map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({getRoleDisplayName(user.role)})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="deadline">Deadline</label>
              <input
                type="datetime-local"
                id="deadline"
                name="deadline"
                value={newTask.deadline}
                onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="estimatedHours">Estimated Hours</label>
            <input
              type="number"
              id="estimatedHours"
              name="estimatedHours"
              value={newTask.estimatedHours}
              onChange={(e) => setNewTask({ ...newTask, estimatedHours: e.target.value })}
              min="0"
              step="0.5"
              placeholder="0"
            />
          </div>

          <div className="modal-actions">
            <button 
              type="button" 
              className="btn btn--secondary"
              onClick={() => setShowAddTask(false)}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn--primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Task Modal */}
      <Modal isOpen={!!editingTask} onClose={() => setEditingTask(null)} title="Edit Task" size="medium">
        <form onSubmit={handleEditTask}>
          {error && (
            <div className="error-message">
              <FiUser size={16} />
              <span>{error}</span>
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="editTitle">Task Title</label>
            <input
              type="text"
              id="editTitle"
              name="title"
              value={editingTask?.title || ''}
              onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="editDescription">Description</label>
            <textarea
              id="editDescription"
              name="description"
              value={editingTask?.description || ''}
              onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
              rows="3"
            />
          </div>

          <div className="form-group">
            <label htmlFor="editPriority">Priority</label>
            <select
              id="editPriority"
              name="priority"
              value={editingTask?.priority || ''}
              onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value })}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="editAssignee">Assign To</label>
              <select
                id="editAssignee"
                name="assignee"
                value={editingTask?.assignee || ''}
                onChange={(e) => setEditingTask({ ...editingTask, assignee: e.target.value })}
              >
                <option value="">Unassigned</option>
                <optgroup label="Designers">
                  {users.filter(user => user.role === 'designer').map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Developers">
                  {users.filter(user => user.role === 'developer').map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Business Developers">
                  {users.filter(user => user.role === 'bd').map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Managers">
                  {users.filter(user => user.role === 'manager' || user.role === 'super_manager').map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({getRoleDisplayName(user.role)})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="editDeadline">Deadline</label>
              <input
                type="datetime-local"
                id="editDeadline"
                name="deadline"
                value={editingTask?.deadline ? new Date(editingTask.deadline).toISOString().slice(0, 16) : ''}
                onChange={(e) => setEditingTask({ ...editingTask, deadline: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="editEstimatedHours">Estimated Hours</label>
            <input
              type="number"
              id="editEstimatedHours"
              name="estimatedHours"
              value={editingTask?.estimatedHours || 0}
              onChange={(e) => setEditingTask({ ...editingTask, estimatedHours: e.target.value })}
              min="0"
              step="0.5"
            />
          </div>

          <div className="modal-actions">
            <button 
              type="button" 
              className="btn btn--secondary"
              onClick={() => setEditingTask(null)}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn--primary"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Task'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProjectBoard; 