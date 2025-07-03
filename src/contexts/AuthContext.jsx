import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Fetch user profile from Firestore
        const userRef = doc(db, 'users', user.uid);
        const snapshot = await getDoc(userRef);
        if (snapshot.exists()) {
          setCurrentUser({ uid: user.uid, email: user.email, ...snapshot.data() });
        } else {
          setCurrentUser({ uid: user.uid, email: user.email });
        }
        setIsAuthenticated(true);
      } else {
        setCurrentUser(null);
        setIsAuthenticated(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Register new user
  const register = async (userData) => {
    try {
      const auth = getAuth();
      const { email, password, ...profile } = userData;
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Store profile in Firestore
      await setDoc(doc(db, 'users', user.uid), profile);
      
      setCurrentUser({ uid: user.uid, email: user.email, ...profile });
      setIsAuthenticated(true);
      return { success: true, user: { uid: user.uid, email: user.email, ...profile } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Login
  const login = async (email, password) => {
    const auth = getAuth();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Fetch user profile from Firestore
      const userRef = doc(db, 'users', user.uid);
      const snapshot = await getDoc(userRef);
      if (snapshot.exists()) {
        setCurrentUser({ uid: user.uid, email: user.email, ...snapshot.data() });
      } else {
        setCurrentUser({ uid: user.uid, email: user.email });
      }
      setIsAuthenticated(true);
      return { success: true, user: { uid: user.uid, email: user.email, ...snapshot.data() } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Logout
  const logout = async () => {
    const auth = getAuth();
    await signOut(auth);
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  // Permissions based on user role
  const hasPermission = (permission) => {
    if (!currentUser) return false;
    if (currentUser.role === 'super_admin') return true;
    if (currentUser.role === 'admin') {
      return ['edit_tasks', 'delete_tasks', 'move_tasks', 'manage_tasks', 'manage_employees'].includes(permission);
    }
    if (currentUser.role === 'user') {
      return ['move_tasks'].includes(permission);
    }
    return false;
  };
  
  const canEditTasks = () => hasPermission('edit_tasks');
  const canDeleteTasks = () => hasPermission('delete_tasks');
  const canMoveTasks = () => hasPermission('move_tasks');
  const canManageTasks = () => hasPermission('manage_tasks');
  const canManageEmployees = () => hasPermission('manage_employees');
  const canManageUsers = () => currentUser?.role === 'super_admin';

  const value = {
    isAuthenticated,
    currentUser,
    loading,
    login,
    logout,
    register,
    hasPermission,
    canEditTasks,
    canDeleteTasks,
    canMoveTasks,
    canManageTasks,
    canManageEmployees,
    canManageUsers
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext); 