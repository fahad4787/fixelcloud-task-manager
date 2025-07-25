import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { taskService } from '../services/firebaseService';
import { useAuth } from './AuthContext';

const TaskContext = createContext();

// Initial state
const initialState = {
  tasks: [],
  currentUser: null,
  filters: {
    status: 'all',
    priority: 'all',
    assignee: 'all'
  },
  sidebarOpen: false,
  loading: {
    tasks: true
  }
};

// Action types
const actionTypes = {
  SET_TASKS: 'SET_TASKS',
  ADD_TASK: 'ADD_TASK',
  UPDATE_TASK: 'UPDATE_TASK',
  DELETE_TASK: 'DELETE_TASK',
  MOVE_TASK: 'MOVE_TASK',
  SET_FILTERS: 'SET_FILTERS',
  TOGGLE_SIDEBAR: 'TOGGLE_SIDEBAR',
  SET_CURRENT_USER: 'SET_CURRENT_USER',
  SET_LOADING: 'SET_LOADING'
};

// Reducer
const taskReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_TASKS:
      return {
        ...state,
        tasks: action.payload,
        loading: { ...state.loading, tasks: false }
      };
    
    case actionTypes.ADD_TASK:
      return {
        ...state,
        tasks: [action.payload, ...state.tasks]
      };
    
    case actionTypes.UPDATE_TASK:
      return {
        ...state,
        tasks: state.tasks.map(task => 
          task.id === action.payload.id ? { ...task, ...action.payload } : task
        )
      };
    
    case actionTypes.DELETE_TASK:
      return {
        ...state,
        tasks: state.tasks.filter(task => task.id !== action.payload)
      };
    
    case actionTypes.MOVE_TASK:
      return {
        ...state,
        tasks: state.tasks.map(task => 
          task.id === action.payload.taskId 
            ? { ...task, status: action.payload.newStatus }
            : task
        )
      };
    
    case actionTypes.SET_FILTERS:
      return {
        ...state,
        filters: action.payload
      };
    
    case actionTypes.TOGGLE_SIDEBAR:
      return {
        ...state,
        sidebarOpen: !state.sidebarOpen
      };
    
    case actionTypes.SET_CURRENT_USER:
      return {
        ...state,
        currentUser: action.payload
      };
    
    case actionTypes.SET_LOADING:
      return {
        ...state,
        loading: { ...state.loading, ...action.payload }
      };
    
    default:
      return state;
  }
};

// Provider component
export const TaskProvider = ({ children }) => {
  const [state, dispatch] = useReducer(taskReducer, initialState);
  const { currentUser: authUser } = useAuth();

  // Update current user when auth user changes
  useEffect(() => {
    if (authUser) {
      dispatch({ type: actionTypes.SET_CURRENT_USER, payload: authUser });
    }
  }, [authUser]);

  // Load data from Firebase on mount
  useEffect(() => {
    // Subscribe to tasks changes
    const unsubscribeTasks = taskService.subscribeToTasks((tasks) => {
      dispatch({ type: actionTypes.SET_TASKS, payload: tasks });
    });

    // Cleanup subscriptions on unmount
    return () => {
      unsubscribeTasks();
    };
  }, []);

  // Actions
  const addTask = async (taskData) => {
    try {
      // Find the number of tasks in the target column
      const status = taskData.status || 'todo';
      const tasksInColumn = state.tasks.filter(task => task.status === status);
      const newTask = {
        title: taskData.title,
        description: taskData.description,
        status,
        priority: taskData.priority || 'medium',
        assignee: taskData.assignee || null,
        assignedBy: taskData.assignedBy || state.currentUser?.uid || 'system',
        createdBy: state.currentUser?.uid || 'system',
        dueDate: taskData.dueDate || null,
        deadline: taskData.deadline || null,
        estimatedHours: taskData.estimatedHours || 0,
        actualHours: 0,
        tags: taskData.tags || [],
        comments: [],
        attachments: [],
        timeSpent: 0,
        estimatedTime: taskData.estimatedTime || 0,
        order: 0
      };

      await taskService.createTask(newTask);
      toast.success('Task created successfully!');
    } catch (error) {
      toast.error('Failed to create task');
      console.error('Error creating task:', error);
    }
  };

  const updateTask = async (taskId, updates) => {
    try {
      await taskService.updateTask(taskId, updates);
      toast.success('Task updated successfully!');
    } catch (error) {
      toast.error('Failed to update task');
      console.error('Error updating task:', error);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await taskService.deleteTask(taskId);
      toast.success('Task deleted successfully!');
    } catch (error) {
      toast.error('Failed to delete task');
      console.error('Error deleting task:', error);
    }
  };

  const moveTask = async (taskId, newStatus) => {
    try {
      await taskService.moveTask(taskId, newStatus);
      toast.success('Task moved successfully!');
    } catch (error) {
      toast.error('Failed to move task');
      console.error('Error moving task:', error);
    }
  };

  // Reorder tasks in a column and persist to Firebase
  const reorderTasksInColumn = async (columnId, orderedTaskIds) => {
    try {
      await taskService.updateTaskOrder(orderedTaskIds);
      toast.success('Task order updated!');
    } catch (error) {
      toast.error('Failed to update task order');
      console.error('Error updating task order:', error);
    }
  };

  const setFilters = (filters) => {
    dispatch({ type: actionTypes.SET_FILTERS, payload: filters });
  };

  const toggleSidebar = () => {
    dispatch({ type: actionTypes.TOGGLE_SIDEBAR });
  };

  const setCurrentUser = (user) => {
    dispatch({ type: actionTypes.SET_CURRENT_USER, payload: user });
  };

  // Filter tasks based on user role and permissions
  const getFilteredTasks = (tasks, currentUser) => {
    if (!currentUser) return tasks;
    
    // Super manager and manager can see all tasks
    if (currentUser.role === 'super_manager' || currentUser.role === 'manager') {
      return tasks;
    }
    
    // Other roles can only see tasks assigned to them or created by them
    return tasks.filter(task => 
      task.assignee === currentUser.uid || 
      task.assignedBy === currentUser.uid ||
      task.createdBy === currentUser.uid
    );
  };

  // Computed values
  const filteredTasks = getFilteredTasks(state.tasks, state.currentUser).filter(task => {
    if (state.filters.status !== 'all' && task.status !== state.filters.status) return false;
    if (state.filters.priority !== 'all' && task.priority !== state.filters.priority) return false;
    if (state.filters.assignee !== 'all' && task.assignee !== state.filters.assignee) return false;
    return true;
  });

  const tasksByStatus = {
    todo: filteredTasks.filter(task => task.status === 'todo'),
    'in-progress': filteredTasks.filter(task => task.status === 'in-progress'),
    review: filteredTasks.filter(task => task.status === 'review'),
    done: filteredTasks.filter(task => task.status === 'done')
  };



  const getTasksByAssignee = (assigneeId) => {
    return state.tasks.filter(task => task.assignee === assigneeId);
  };

  // Get tasks that are overdue
  const getOverdueTasks = () => {
    const now = new Date();
    return state.tasks.filter(task => {
      if (!task.deadline) return false;
      const deadline = task.deadline.toDate ? task.deadline.toDate() : new Date(task.deadline);
      return deadline < now && task.status !== 'done';
    });
  };

  // Get tasks due soon (within 24 hours)
  const getDueSoonTasks = () => {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    return state.tasks.filter(task => {
      if (!task.deadline) return false;
      const deadline = task.deadline.toDate ? task.deadline.toDate() : new Date(task.deadline);
      return deadline >= now && deadline <= tomorrow && task.status !== 'done';
    });
  };

  const value = {
    ...state,
    filteredTasks,
    tasksByStatus,
    addTask,
    updateTask,
    deleteTask,
    moveTask,
    reorderTasksInColumn,
    setFilters,
    toggleSidebar,
    setCurrentUser,
    getTasksByAssignee,
    getOverdueTasks,
    getDueSoonTasks
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
};

// Custom hook
export const useTaskContext = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }
  return context;
}; 