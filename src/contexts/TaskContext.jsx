import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { taskService, employeeService } from '../services/firebaseService';

const TaskContext = createContext();

// Initial state
const initialState = {
  tasks: [],
  employees: [],
  currentUser: null,
  filters: {
    status: 'all',
    priority: 'all',
    assignee: 'all'
  },
  sidebarOpen: false,
  loading: {
    tasks: true,
    employees: true
  }
};

// Action types
const actionTypes = {
  SET_TASKS: 'SET_TASKS',
  ADD_TASK: 'ADD_TASK',
  UPDATE_TASK: 'UPDATE_TASK',
  DELETE_TASK: 'DELETE_TASK',
  MOVE_TASK: 'MOVE_TASK',
  SET_EMPLOYEES: 'SET_EMPLOYEES',
  ADD_EMPLOYEE: 'ADD_EMPLOYEE',
  UPDATE_EMPLOYEE: 'UPDATE_EMPLOYEE',
  DELETE_EMPLOYEE: 'DELETE_EMPLOYEE',
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
    

    
    case actionTypes.SET_EMPLOYEES:
      return {
        ...state,
        employees: action.payload,
        loading: { ...state.loading, employees: false }
      };
    
    case actionTypes.ADD_EMPLOYEE:
      return {
        ...state,
        employees: [action.payload, ...state.employees]
      };
    
    case actionTypes.UPDATE_EMPLOYEE:
      return {
        ...state,
        employees: state.employees.map(emp => 
          emp.id === action.payload.id ? { ...emp, ...action.payload } : emp
        )
      };
    
    case actionTypes.DELETE_EMPLOYEE:
      return {
        ...state,
        employees: state.employees.filter(emp => emp.id !== action.payload)
      };
    
    case actionTypes.SET_FILTERS:
      return {
        ...state,
        filters: { ...state.filters, ...action.payload }
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

  // Load data from Firebase on mount
  useEffect(() => {
    // Subscribe to tasks changes
    const unsubscribeTasks = taskService.subscribeToTasks((tasks) => {
      dispatch({ type: actionTypes.SET_TASKS, payload: tasks });
    });

    // Subscribe to employees changes
    const unsubscribeEmployees = employeeService.subscribeToEmployees((employees) => {
      dispatch({ type: actionTypes.SET_EMPLOYEES, payload: employees });
    });

    // Cleanup subscriptions on unmount
    return () => {
      unsubscribeTasks();
      unsubscribeEmployees();
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
        createdBy: state.currentUser?.uid || 'system',
        dueDate: taskData.dueDate || null,
        tags: taskData.tags || [],
        comments: [],
        attachments: [],
        timeSpent: 0,
        estimatedTime: taskData.estimatedTime || 0,
        order: 0 // <-- set order to 0 to put at the top
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

  const addEmployee = async (employeeData) => {
    try {
      const newEmployee = {
        name: employeeData.name,
        email: employeeData.email,
        role: employeeData.role,
        avatar: employeeData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(employeeData.name)}&background=15a970&color=fff`,
        isActive: true
      };

      await employeeService.createEmployee(newEmployee);
      toast.success('Employee added successfully!');
    } catch (error) {
      console.error('Error adding employee:', error);
      toast.error('Failed to add employee');
    }
  };

  const updateEmployee = async (employeeId, updates) => {
    try {
      await employeeService.updateEmployee(employeeId, updates);
      toast.success('Employee updated successfully!');
    } catch (error) {
      toast.error('Failed to update employee');
      console.error('Error updating employee:', error);
    }
  };

  const deleteEmployee = async (employeeId) => {
    try {
      await employeeService.deleteEmployee(employeeId);
      toast.success('Employee deleted successfully!');
    } catch (error) {
      toast.error('Failed to delete employee');
      console.error('Error deleting employee:', error);
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

  // Computed values
  const filteredTasks = state.tasks.filter(task => {
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

  const getEmployeeById = (id) => {
    return state.employees.find(emp => emp.id === id);
  };

  const getEmployeesByRole = (role) => {
    return state.employees.filter(emp => emp.role === role && emp.isActive);
  };

  const getTasksByAssignee = (assigneeId) => {
    return state.tasks.filter(task => task.assignee === assigneeId);
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
    addEmployee,
    updateEmployee,
    deleteEmployee,
    setFilters,
    toggleSidebar,
    setCurrentUser,
    getEmployeeById,
    getEmployeesByRole,
    getTasksByAssignee
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