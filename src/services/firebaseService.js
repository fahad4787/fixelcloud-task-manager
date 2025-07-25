import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy,
  where,
  serverTimestamp,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import toast from 'react-hot-toast';

// Task Service
export const taskService = {
  subscribeToTasks: (callback) => {
    const q = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const tasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(tasks);
    });
  },

  createTask: async (taskData) => {
    const docRef = await addDoc(collection(db, 'tasks'), {
      ...taskData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef;
  },

  updateTask: async (taskId, updates) => {
    const taskRef = doc(db, 'tasks', taskId);
    await updateDoc(taskRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  },

  deleteTask: async (taskId) => {
    const taskRef = doc(db, 'tasks', taskId);
    await deleteDoc(taskRef);
  },

  moveTask: async (taskId, newStatus) => {
    const taskRef = doc(db, 'tasks', taskId);
    await updateDoc(taskRef, {
      status: newStatus,
      updatedAt: serverTimestamp()
    });
  },

  updateTaskOrder: async (orderedTaskIds) => {
    const batch = [];
    orderedTaskIds.forEach((taskId, index) => {
      const taskRef = doc(db, 'tasks', taskId);
      batch.push(updateDoc(taskRef, { order: index }));
    });
    await Promise.all(batch);
  }
};



// User Management Service
export const userManagementService = {
  getAllUsers: async () => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },

  getUserById: async (userId) => {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return { id: userSnap.id, ...userSnap.data() };
    }
    return null;
  },

  updateUserRole: async (userId, role, permissions) => {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      role,
      permissions,
      updatedAt: serverTimestamp()
    });
  },

  createUser: async (userData) => {
    const auth = getAuth();
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      userData.email, 
      userData.password
    );

    const userProfile = {
      name: userData.name,
      email: userData.email,
      role: userData.role,
      permissions: userData.permissions,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=15a970&color=fff`,
      isActive: true,
      createdAt: serverTimestamp()
    };

    await setDoc(doc(db, 'users', userCredential.user.uid), userProfile);
    return userCredential.user;
  },

  createUserWithoutSignIn: async (userData) => {
    const auth = getAuth();
    
    // Store current user info before creating new user
    const currentUser = auth.currentUser;
    
    // Create the new user
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      userData.email, 
      userData.password
    );

    const userProfile = {
      name: userData.name,
      email: userData.email,
      role: userData.role,
      permissions: userData.permissions,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=15a970&color=fff`,
      isActive: true,
      createdAt: serverTimestamp()
    };

    await setDoc(doc(db, 'users', userCredential.user.uid), userProfile);
    
    // Sign out the newly created user
    await signOut(auth);
    
    // Show success message
    toast.success('User created successfully! You have been signed out. Please sign back in.');
    
    return userCredential.user;
  },

  deleteUser: async (userId) => {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      isActive: false,
      updatedAt: serverTimestamp()
    });
  }
};

// Auth Service
export const authService = {
  signIn: async (email, password) => {
    const auth = getAuth();
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  },

  signUp: async (email, password, name) => {
    const auth = getAuth();
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update profile
    await updateProfile(userCredential.user, {
      displayName: name
    });

    return userCredential.user;
  },

  signOut: async () => {
    const auth = getAuth();
    await signOut(auth);
  },

  onAuthStateChanged: (callback) => {
    const auth = getAuth();
    return onAuthStateChanged(auth, callback);
  }
}; 