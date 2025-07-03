import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProjectBoard from './pages/ProjectBoard';
import TeamManagement from './pages/TeamManagement';
import UserManagement from './pages/UserManagement';

import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Signup from './pages/Signup';
import { getAuth } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.scss';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser } = useAuth();
  
  return (
    <div className="app">
      <Header onMenuClick={() => setSidebarOpen((open) => !open)} sidebarOpen={sidebarOpen} />
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <Sidebar sidebarOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className={`app-main${sidebarOpen ? ' sidebar-open' : ''}`}>
        <main className="app-content">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/project-board" element={<ProjectBoard />} />
              {(currentUser?.role === 'super_admin' || currentUser?.role === 'admin') && (
                <Route path="/team" element={<TeamManagement />} />
              )}
              {currentUser?.role === 'super_admin' && (
                <Route path="/users" element={<UserManagement />} />
              )}

              {(currentUser?.role === 'super_admin' || currentUser?.role === 'admin') && (
                <Route path="/analytics" element={<Analytics />} />
              )}
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

function App() {
  const [checkingUsers, setCheckingUsers] = useState(true);
  const [noUsers, setNoUsers] = useState(false);
  const [appReady, setAppReady] = useState(false);
  const navigate = useNavigate();

  // Hide initial HTML loader when React app is ready
  useEffect(() => {
    const hideInitialLoader = () => {
      const initialLoader = document.getElementById('pre-react-loader');
      if (initialLoader) {
        initialLoader.classList.add('hidden');
        // Remove the loader from DOM after fade out
        setTimeout(() => {
          if (initialLoader.parentNode) {
            initialLoader.parentNode.removeChild(initialLoader);
          }
        }, 300);
      }
    };

    // Hide initial loader immediately when React is ready
    setAppReady(true);
    hideInitialLoader();
  }, []);

  useEffect(() => {
    async function checkUsers() {
      try {
        // Check if users collection exists and has any documents
        const usersRef = collection(db, 'users');
        const snapshot = await getDocs(usersRef);
        if (snapshot.empty) {
          setNoUsers(true);
          navigate('/signup', { replace: true });
        } else {
          setNoUsers(false);
        }
      } catch (error) {
        console.error('Error checking users:', error);
        // If there's an error, assume users exist to prevent infinite loading
        setNoUsers(false);
      } finally {
        setCheckingUsers(false);
      }
    }
    
    // Only check users if app is ready
    if (appReady) {
      checkUsers();
    }
  }, [appReady, navigate]);

  // Show React loader only if we're still checking users and app is ready
  if (appReady && checkingUsers) {
    return null;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={noUsers ? <Signup /> : <Navigate to="/login" replace />} />
      <Route path="/*" element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      } />
    </Routes>
  );
}

export default App; 