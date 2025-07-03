import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { TaskProvider } from './contexts/TaskContext.jsx'
import { ThemeProvider } from './contexts/ThemeContext.jsx'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import './index.scss'

ReactDOM.createRoot(document.getElementById('root')).render(
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <ThemeProvider>
      <AuthProvider>
        <TaskProvider>
          <App />
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </TaskProvider>
      </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
) 