import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  onSnapshot,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';

// Collections
const COLLECTIONS = {
  TASKS: 'tasks',
  EMPLOYEES: 'employees',
  USERS: 'users'
};

// Task Operations
export const taskService = {
  // Get all tasks
  async getAllTasks() {
    try {
      const q = query(collection(db, COLLECTIONS.TASKS), orderBy('order', 'asc'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }
  },

  // Get tasks by status
  async getTasksByStatus(status) {
    try {
      const q = query(
        collection(db, COLLECTIONS.TASKS), 
        where('status', '==', status),
        orderBy('order', 'asc'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching tasks by status:', error);
      throw error;
    }
  },

  // Get tasks by team
  async getTasksByTeam(team) {
    try {
      const q = query(
        collection(db, COLLECTIONS.TASKS), 
        where('team', '==', team),
        orderBy('order', 'asc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching tasks by team:', error);
      throw error;
    }
  },

  // Get tasks by assignee
  async getTasksByAssignee(assigneeId) {
    try {
      const q = query(
        collection(db, COLLECTIONS.TASKS), 
        where('assignee', '==', assigneeId),
        orderBy('order', 'asc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching tasks by assignee:', error);
      throw error;
    }
  },

  // Create new task
  async createTask(taskData) {
    try {
      const taskWithTimestamp = {
        ...taskData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, COLLECTIONS.TASKS), taskWithTimestamp);
      
      // If the new task has order 0, shift all existing tasks in the same column down by 1
      if (taskData.order === 0) {
        const batch = writeBatch(db);
        const q = query(
          collection(db, COLLECTIONS.TASKS), 
          where('status', '==', taskData.status),
          where('order', '>=', 0)
        );
        const snapshot = await getDocs(q);
        
        snapshot.docs.forEach(doc => {
          if (doc.id !== docRef.id) { // Don't update the new task
            batch.update(doc.ref, { order: doc.data().order + 1 });
          }
        });
        
        if (snapshot.docs.length > 0) {
          await batch.commit();
        }
      }
      
      return { id: docRef.id, ...taskData };
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  },

  // Update task
  async updateTask(taskId, updates) {
    try {
      const taskRef = doc(db, COLLECTIONS.TASKS, taskId);
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      };
      await updateDoc(taskRef, updateData);
      return { id: taskId, ...updates };
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  },

  // Delete task
  async deleteTask(taskId) {
    try {
      const taskRef = doc(db, COLLECTIONS.TASKS, taskId);
      await deleteDoc(taskRef);
      return taskId;
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  },

  // Move task (update status)
  async moveTask(taskId, newStatus) {
    try {
      const taskRef = doc(db, COLLECTIONS.TASKS, taskId);
      await updateDoc(taskRef, {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      return { id: taskId, status: newStatus };
    } catch (error) {
      console.error('Error moving task:', error);
      throw error;
    }
  },

  // Listen to tasks changes
  subscribeToTasks(callback) {
    const q = query(collection(db, COLLECTIONS.TASKS), orderBy('order', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(tasks);
    });
  },

  // Update order of tasks in a column
  async updateTaskOrder(taskIds) {
    try {
      const batch = writeBatch(db);
      for (let i = 0; i < taskIds.length; i++) {
        const taskRef = doc(db, COLLECTIONS.TASKS, taskIds[i]);
        batch.update(taskRef, { order: i });
      }
      await batch.commit();
      return true;
    } catch (error) {
      console.error('Error updating task order:', error);
      throw error;
    }
  }
};

// Employee Operations
export const employeeService = {
  // Get all employees
  async getAllEmployees() {
    try {
      const q = query(collection(db, COLLECTIONS.EMPLOYEES), orderBy('joinedAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching employees:', error);
      throw error;
    }
  },

  // Get employees by role
  async getEmployeesByRole(role) {
    try {
      const q = query(
        collection(db, COLLECTIONS.EMPLOYEES), 
        where('role', '==', role),
        where('isActive', '==', true),
        orderBy('joinedAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching employees by role:', error);
      throw error;
    }
  },

  // Get employee by ID
  async getEmployeeById(employeeId) {
    try {
      const employeeRef = doc(db, COLLECTIONS.EMPLOYEES, employeeId);
      const snapshot = await getDoc(employeeRef);
      if (snapshot.exists()) {
        return { id: snapshot.id, ...snapshot.data() };
      }
      return null;
    } catch (error) {
      console.error('Error fetching employee:', error);
      throw error;
    }
  },

  // Create new employee
  async createEmployee(employeeData) {
    try {
      const employeeWithTimestamp = {
        ...employeeData,
        joinedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, COLLECTIONS.EMPLOYEES), employeeWithTimestamp);
      return { id: docRef.id, ...employeeData };
    } catch (error) {
      console.error('Error creating employee:', error);
      throw error;
    }
  },

  // Update employee
  async updateEmployee(employeeId, updates) {
    try {
      const employeeRef = doc(db, COLLECTIONS.EMPLOYEES, employeeId);
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      };
      await updateDoc(employeeRef, updateData);
      return { id: employeeId, ...updates };
    } catch (error) {
      console.error('Error updating employee:', error);
      throw error;
    }
  },

  // Delete employee
  async deleteEmployee(employeeId) {
    try {
      const employeeRef = doc(db, COLLECTIONS.EMPLOYEES, employeeId);
      await deleteDoc(employeeRef);
      return employeeId;
    } catch (error) {
      console.error('Error deleting employee:', error);
      throw error;
    }
  },

  // Listen to employees changes
  subscribeToEmployees(callback) {
    const q = query(collection(db, COLLECTIONS.EMPLOYEES), orderBy('joinedAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const employees = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(employees);
    });
  }
};

// User Management Operations (for Super Admin)
export const userManagementService = {
  // Get all users
  async getAllUsers() {
    try {
      const q = query(collection(db, COLLECTIONS.USERS), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  // Get users by role
  async getUsersByRole(role) {
    try {
      const q = query(
        collection(db, COLLECTIONS.USERS), 
        where('role', '==', role),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching users by role:', error);
      throw error;
    }
  },

  // Update user role and permissions
  async updateUserRole(userId, role, permissions) {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      await updateDoc(userRef, {
        role,
        permissions,
        updatedAt: serverTimestamp()
      });
      return { id: userId, role, permissions };
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  },

  // Listen to users changes
  subscribeToUsers(callback) {
    const q = query(collection(db, COLLECTIONS.USERS), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(users);
    });
  }
}; 