import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiFilter,
  FiSearch,
  FiEye,
  FiEyeOff,
  FiEdit3,
  FiTrash2,
  FiTrello
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useTaskContext } from '../../contexts/TaskContext';
import TaskCard from '../../components/TaskCard';
import Modal from '../../components/Modal';
import PageTitle from '../../components/PageTitle';
import './ProjectBoard.scss';

const ProjectBoard = () => {
  const { currentUser, canEditTasks, canDeleteTasks, canMoveTasks, canManageTasks } = useAuth();
  const { 
    tasksByStatus, 
    tasks,
    moveTask, 
    reorderTasksInColumn,
    updateTask,
    deleteTask,
    employees
  } = useTaskContext();

  const [editingTask, setEditingTask] = useState(null);
  const [filters, setFilters] = useState({
    priority: 'all',
    role: 'all',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showCompleted, setShowCompleted] = useState(true);
  const [activeFilters, setActiveFilters] = useState(0);
  
  // Local state for reordering within columns
  const [columnTasks, setColumnTasks] = useState({
    todo: [],
    'in-progress': [],
    review: [],
    done: []
  });

  // Update local column tasks when tasksByStatus changes
  React.useEffect(() => {
    // Debug: Check what data we have
    console.log('Tasks data:', tasksByStatus);
    console.log('Employees data:', employees);
    console.log('Current filters:', filters);
    
    setColumnTasks({
      todo: getFilteredTasks(tasksByStatus.todo),
      'in-progress': getFilteredTasks(tasksByStatus['in-progress']),
      review: getFilteredTasks(tasksByStatus.review),
      done: showCompleted ? getFilteredTasks(tasksByStatus.done) : []
    });
  }, [tasksByStatus, filters, showCompleted]);

  const handleEditTask = (e) => {
    e.preventDefault();
    if (editingTask && editingTask.title.trim()) {
      updateTask(editingTask.id, editingTask);
      setEditingTask(null);
    }
  };

  const handleDeleteTask = (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      deleteTask(taskId);
    }
  };

  const getFilteredTasks = (tasks) => {
    return tasks.filter(task => {
      // Priority filter
      if (filters.priority !== 'all' && task.priority !== filters.priority) return false;
      
      // Role filter
      if (filters.role !== 'all') {
        const taskRole = task.team || (task.assignee && employees.find(emp => emp.id === task.assignee)?.role);
        console.log('Role filter check:', {
          taskId: task.id,
          taskTeam: task.team,
          assigneeRole: task.assignee && employees.find(emp => emp.id === task.assignee)?.role,
          taskRole,
          filterRole: filters.role,
          matches: taskRole === filters.role
        });
        
        // Check if task has the selected role (case-insensitive)
        const hasRole = taskRole && taskRole.toLowerCase() === filters.role.toLowerCase();
        if (!hasRole) return false;
      }
      
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const titleMatch = task.title.toLowerCase().includes(searchTerm);
        const descriptionMatch = task.description?.toLowerCase().includes(searchTerm);
        const assigneeMatch = employees.find(emp => emp.id === task.assignee)?.name.toLowerCase().includes(searchTerm);
        
        if (!titleMatch && !descriptionMatch && !assigneeMatch) return false;
      }
      
      return true;
    });
  };

  const columns = [
    {
      id: 'todo',
      title: 'To Do',
      color: 'var(--gray-500)',
      tasks: columnTasks.todo
    },
    {
      id: 'in-progress',
      title: 'In Progress',
      color: 'var(--warning-color)',
      tasks: columnTasks['in-progress']
    },
    {
      id: 'review',
      title: 'Review',
      color: 'var(--accent-color)',
      tasks: columnTasks.review
    },
    {
      id: 'done',
      title: 'Done',
      color: 'var(--success-color)',
      tasks: columnTasks.done
    }
  ];

  const priorities = ['low', 'medium', 'high', 'urgent'];
  
  // Get unique roles from employees
  const availableRoles = [...new Set(employees.map(emp => emp.role).filter(Boolean))];
  const roles = availableRoles.length > 0 ? availableRoles : ['Developer', 'Designer', 'BD'];
  
  console.log('Available roles from employees:', availableRoles);
  console.log('Using roles:', roles);

  // Count active filters
  React.useEffect(() => {
    let count = 0;
    if (filters.priority !== 'all') count++;
    if (filters.role !== 'all') count++;
    if (filters.search) count++;
    setActiveFilters(count);
  }, [filters]);

  const clearAllFilters = () => {
    setFilters({ priority: 'all', role: 'all', search: '' });
  };

  // Drag and drop functionality
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [dropIndex, setDropIndex] = useState(null);

  const handleDragStart = (e, taskId) => {
    if (!canMoveTasks()) {
      e.preventDefault();
      return;
    }
    setDraggedTask(taskId);
    e.dataTransfer.setData('text/plain', taskId);
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    setDraggedTask(null);
    setDragOverColumn(null);
    setDropIndex(null);
    e.target.style.opacity = '1';
  };

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnId);
    
    // Calculate drop position for same column reordering
    if (draggedTask) {
      const currentTask = tasks.find(task => task.id === draggedTask);
      if (currentTask && currentTask.status === columnId) {
        const columnElement = e.currentTarget;
        const taskElements = columnElement.querySelectorAll('.task-card-wrapper');
        let targetIndex = columnTasks[columnId].length;
        
        for (let i = 0; i < taskElements.length; i++) {
          const rect = taskElements[i].getBoundingClientRect();
          const centerY = rect.top + rect.height / 2;
          
          if (e.clientY < centerY) {
            targetIndex = i;
            break;
          }
        }
        
        setDropIndex(targetIndex);
      } else {
        setDropIndex(null);
      }
    }
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
    setDropIndex(null);
  };

  const handleDrop = (e, columnId) => {
    e.preventDefault();
    setDragOverColumn(null);
    setDropIndex(null);
    
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId && columnId) {
      // Find the current status of the task
      const currentTask = tasks.find(task => task.id === taskId);
      
      if (currentTask) {
        if (currentTask.status !== columnId) {
          // Cross-column movement
          moveTask(taskId, columnId);
        } else {
          // Same column reordering
          const sourceIndex = columnTasks[columnId].findIndex(task => task.id === taskId);
          if (sourceIndex !== -1 && dropIndex !== null && sourceIndex !== dropIndex) {
            const newTasks = [...columnTasks[columnId]];
            const [removed] = newTasks.splice(sourceIndex, 1);
            newTasks.splice(dropIndex, 0, removed);
            
            // Update local state immediately for better UX
            setColumnTasks(prev => ({
              ...prev,
              [columnId]: newTasks
            }));
            
            // Persist the new order to Firebase
            console.log('Reordering tasks:', columnId, newTasks.map(t => t.id));
            reorderTasksInColumn(columnId, newTasks.map(t => t.id));
          }
        }
      }
    }
    
    // Reset drag state
    setDraggedTask(null);
  };

  return (
    <div className="page-container">
      <PageTitle 
        title="Project Board"
        subtitle="Drag and drop tasks to manage workflow"
        icon={FiTrello}
        filters={
          <div className="header-actions">
            <div className="search-box">
              <FiSearch size={16} />
              <input
                type="text"
                placeholder="Search tasks..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="search-input"
              />
            </div>
            <button 
              className={`btn btn--secondary filter-btn ${activeFilters > 0 ? 'has-filters' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <FiFilter size={16} />
              Filters
              {activeFilters > 0 && (
                <span className="filter-badge">{activeFilters}</span>
              )}
            </button>
            <button 
              className="btn btn--secondary"
              onClick={() => setShowCompleted(!showCompleted)}
            >
              {showCompleted ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              {showCompleted ? 'Hide' : 'Show'} Completed
            </button>
          </div>
        }
      />

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div 
            className="filters-panel"
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="filters-header">
              <h4>Filter Tasks</h4>
              {activeFilters > 0 && (
                <button 
                  className="clear-filters-btn"
                  onClick={clearAllFilters}
                >
                  Clear All ({activeFilters})
                </button>
              )}
            </div>
            
            <div className="filters-grid">
              <div className="filter-group">
                <label>Priority</label>
                <select
                  value={filters.priority}
                  onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                  className="filter-select"
                >
                  <option value="all">All Priorities</option>
                  {priorities.map(priority => (
                    <option key={priority} value={priority}>
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="filter-group">
                <label>Role</label>
                <select
                  value={filters.role}
                  onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                  className="filter-select"
                >
                  <option value="all">All Roles</option>
                  {roles.map(role => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Project Board Columns */}
      <div className="project-board-columns">
        {columns.map((column) => (
          <div key={column.id} className="project-board-column">
            <div className="column-header">
              <h3 className="column-title" style={{ color: column.color }}>
                {column.title}
              </h3>
              <span className="column-count">
                {column.tasks.length}
              </span>
            </div>
            
            <div 
              className={`column-content ${dragOverColumn === column.id ? 'drag-over' : ''}`}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {column.tasks.length === 0 ? (
                <div className="empty-column">
                  <span>No tasks in this column</span>
                </div>
              ) : (
                <>
                  {column.tasks.map((task, index) => (
                    <React.Fragment key={task.id}>
                      {/* Drop indicator */}
                      {dragOverColumn === column.id && 
                       dropIndex === index && 
                       draggedTask !== task.id && (
                        <div className="drop-indicator" />
                      )}
                      
                      <div 
                        className={`task-card-wrapper ${draggedTask === task.id ? 'dragging' : ''}`}
                        draggable={canMoveTasks()}
                        data-task-id={task.id}
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onDragEnd={handleDragEnd}
                      >
                        <TaskCard 
                          task={task}
                          onEdit={canEditTasks() ? () => setEditingTask(task) : undefined}
                          onDelete={canDeleteTasks() ? () => handleDeleteTask(task.id) : undefined}
                        />
                      </div>
                    </React.Fragment>
                  ))}
                  
                  {/* Drop indicator at the end */}
                  {dragOverColumn === column.id && 
                   dropIndex === column.tasks.length && 
                   draggedTask && (
                    <div className="drop-indicator" />
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Edit Task Modal */}
      <Modal
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        title="Edit Task"
        size="medium"
      >
        <form onSubmit={handleEditTask}>
          <div className="form-group">
            <label>Task Title</label>
            <input
              type="text"
              value={editingTask?.title || ''}
              onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
              placeholder="Enter task title..."
              required
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={editingTask?.description || ''}
              onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
              placeholder="Enter task description..."
              rows="3"
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Team</label>
              <select
                value={editingTask?.team || ''}
                onChange={(e) => setEditingTask({ ...editingTask, team: e.target.value })}
              >
                <option value="Designer">Designer</option>
                <option value="Developer">Developer</option>
                <option value="BD">BD</option>
              </select>
            </div>
            <div className="form-group">
              <label>Priority</label>
              <select
                value={editingTask?.priority || ''}
                onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Status</label>
            <select
              value={editingTask?.status || ''}
              onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value })}
            >
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="review">Review</option>
              <option value="done">Done</option>
            </select>
          </div>
          <div className="form-group">
            <label>Assignee (Optional)</label>
            <select
              value={editingTask?.assignee || ''}
              onChange={(e) => setEditingTask({ ...editingTask, assignee: e.target.value || null })}
            >
              <option value="">Select assignee...</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.team})
                </option>
              ))}
            </select>
          </div>
          <div className="modal-actions">
            <button 
              type="button" 
              className="btn btn--secondary"
              onClick={() => setEditingTask(null)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn--primary">
              Update Task
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProjectBoard; 