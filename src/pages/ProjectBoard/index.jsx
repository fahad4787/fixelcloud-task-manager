import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
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
    moveTask, 
    updateTask,
    deleteTask,
    employees
  } = useTaskContext();

  const [editingTask, setEditingTask] = useState(null);
  const [filters, setFilters] = useState({
    team: 'all',
    priority: 'all',
    assignee: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showCompleted, setShowCompleted] = useState(true);

  const handleDragEnd = (result) => {
    if (!result.destination || !canMoveTasks()) return;

    const { source, destination, draggableId } = result;
    
    if (source.droppableId === destination.droppableId) {
      // Same column - reorder
      return;
    }

    // Move task to new status
    moveTask(draggableId, destination.droppableId);
  };



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
      if (filters.team !== 'all' && task.team !== filters.team) return false;
      if (filters.priority !== 'all' && task.priority !== filters.priority) return false;
      if (filters.assignee !== 'all' && task.assignee !== filters.assignee) return false;
      return true;
    });
  };

  const columns = [
    {
      id: 'todo',
      title: 'To Do',
      color: 'var(--gray-500)',
      tasks: tasksByStatus.todo
    },
    {
      id: 'in-progress',
      title: 'In Progress',
      color: 'var(--warning-color)',
      tasks: tasksByStatus['in-progress']
    },
    {
      id: 'review',
      title: 'Review',
      color: 'var(--accent-color)',
      tasks: tasksByStatus.review
    },
    {
      id: 'done',
      title: 'Done',
      color: 'var(--success-color)',
      tasks: showCompleted ? tasksByStatus.done : []
    }
  ];

  const teams = ['Designer', 'Developer', 'BD'];
  const priorities = ['low', 'medium', 'high', 'urgent'];
  const assignees = employees.filter(emp => emp.isActive);

  return (
    <div className="page-container">
      <PageTitle 
        title="Project Board"
        subtitle="Drag and drop tasks to manage workflow"
        icon={FiTrello}
        filters={
          <div className="header-actions flex gap-2">
            <button 
              className="btn btn--secondary"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FiFilter size={16} />
              Filters
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
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="filter-group">
              <label>Team</label>
              <select
                value={filters.team}
                onChange={(e) => setFilters({ ...filters, team: e.target.value })}
              >
                <option value="all">All Teams</option>
                {teams.map(team => (
                  <option key={team} value={team}>{team}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label>Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
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
              <label>Assignee</label>
              <select
                value={filters.assignee}
                onChange={(e) => setFilters({ ...filters, assignee: e.target.value })}
              >
                <option value="all">All Assignees</option>
                {assignees.map(assignee => (
                  <option key={assignee.id} value={assignee.id}>
                    {assignee.name}
                  </option>
                ))}
              </select>
            </div>
            <button 
              className="btn btn--outline"
              onClick={() => setFilters({ team: 'all', priority: 'all', assignee: 'all' })}
            >
              Clear Filters
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Project Board Columns */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="project-board-columns">
          {columns.map((column) => (
            <div key={column.id} className="project-board-column">
              <div className="column-header">
                <h3 className="column-title" style={{ color: column.color }}>
                  {column.title}
                </h3>
                <span className="column-count">
                  {getFilteredTasks(column.tasks).length}
                </span>
              </div>
              
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`column-content ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                  >
                    {getFilteredTasks(column.tasks).map((task, index) => (
                      <Draggable 
                        key={task.id} 
                        draggableId={task.id} 
                        index={index}
                        isDragDisabled={!canMoveTasks()}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`task-card-wrapper ${snapshot.isDragging ? 'dragging' : ''}`}
                          >
                            <TaskCard 
                              task={task}
                              onEdit={canEditTasks() ? () => { console.log('setEditingTask called', task); setEditingTask(task); } : undefined}
                              onDelete={canDeleteTasks() ? () => handleDeleteTask(task.id) : undefined}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>



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