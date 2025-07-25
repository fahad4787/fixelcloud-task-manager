import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiPlus, 
  FiEdit2, 
  FiTrash2, 
  FiMail, 
  FiUser,
  FiUsers,
  FiShield,
  FiUserCheck,
  FiUserX,
  FiEye,
  FiEyeOff,
  FiUserPlus,
  FiEdit3
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { userManagementService } from '../../services/firebaseService';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import Modal from '../../components/Modal';
import PageTitle from '../../components/PageTitle';
import './UserManagement.scss';

const UserManagement = () => {
  const { currentUser, canManageUsers } = useAuth();
  const [users, setUsers] = useState([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'designer',
    permissions: []
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check if user has access to user management
  if (!canManageUsers()) {
    return (
      <div className="page-container">
        <div className="access-denied">
          <FiShield size={48} />
          <h3>Access Denied</h3>
          <p>You don't have permission to access user management.</p>
        </div>
      </div>
    );
  }

  // Load users on mount
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const allUsers = await userManagementService.getAllUsers();
      setUsers(allUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate passwords
    if (newUser.password !== newUser.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (newUser.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    // Check if trying to create super manager and one already exists
    if (newUser.role === 'super_manager') {
      const existingSuperManager = users.find(user => user.role === 'super_manager');
      if (existingSuperManager) {
        setError('A Super Manager already exists. Only one Super Manager is allowed.');
        setLoading(false);
        return;
      }
    }

    try {
      // Set user permissions based on role
      let permissions = [];
      switch (newUser.role) {
        case 'super_manager':
          permissions = ['all'];
          break;
        case 'manager':
          permissions = ['edit_tasks', 'delete_tasks', 'move_tasks', 'manage_tasks', 'assign_tasks'];
          break;
        case 'designer':
          permissions = ['move_tasks', 'view_own_tasks', 'assign_tasks'];
          break;
        case 'developer':
          permissions = ['move_tasks', 'view_own_tasks', 'assign_tasks'];
          break;
        case 'bd':
          permissions = ['move_tasks', 'view_own_tasks', 'assign_tasks'];
          break;
        default:
          permissions = ['move_tasks', 'view_own_tasks', 'assign_tasks'];
      }

      // Create user using the service that handles sign-out
      await userManagementService.createUserWithoutSignIn({
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
        permissions: permissions
      });

      // Reset form
      setNewUser({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'designer',
        permissions: []
      });
      setShowAddUser(false);
      
      // Reload users
      await loadUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      if (error.code === 'auth/email-already-in-use') {
        setError('Email already exists');
      } else {
        setError('Failed to create user');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Check if trying to change role to super manager and one already exists
    if (editingUser.role === 'super_manager') {
      const existingSuperManager = users.find(user => 
        user.role === 'super_manager' && user.id !== editingUser.id
      );
      if (existingSuperManager) {
        setError('A Super Manager already exists. Only one Super Manager is allowed.');
        setLoading(false);
        return;
      }
    }

    try {
      // Set user permissions based on role
      let permissions = [];
      switch (editingUser.role) {
        case 'super_manager':
          permissions = ['all'];
          break;
        case 'manager':
          permissions = ['edit_tasks', 'delete_tasks', 'move_tasks', 'manage_tasks', 'assign_tasks'];
          break;
        case 'designer':
          permissions = ['move_tasks', 'view_own_tasks', 'assign_tasks'];
          break;
        case 'developer':
          permissions = ['move_tasks', 'view_own_tasks', 'assign_tasks'];
          break;
        case 'bd':
          permissions = ['move_tasks', 'view_own_tasks', 'assign_tasks'];
          break;
        default:
          permissions = ['move_tasks', 'view_own_tasks', 'assign_tasks'];
      }

      await userManagementService.updateUserRole(editingUser.id, editingUser.role, permissions);
      setEditingUser(null);
      await loadUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      setError('Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        // Note: This would require additional Firebase Auth manager SDK for production
        // For now, we'll just mark the user as inactive
        await userManagementService.updateUserRole(userId, 'inactive', []);
        await loadUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'super_manager': return 'danger';
      case 'manager': return 'warning';
      case 'designer': return 'info';
      case 'developer': return 'primary';
      case 'bd': return 'success';
      default: return 'secondary';
    }
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'super_manager': return 'Super Manager';
      case 'manager': return 'Manager';
      case 'designer': return 'Designer';
      case 'developer': return 'Developer';
      case 'bd': return 'Business Developer';
      default: return role;
    }
  };

  const roles = [
    { value: 'designer', label: 'Designer', description: 'Can manage design tasks and assign to team' },
    { value: 'developer', label: 'Developer', description: 'Can manage development tasks and assign to team' },
    { value: 'bd', label: 'Business Developer', description: 'Can manage business tasks and assign to team' },
    { value: 'manager', label: 'Manager', description: 'Can edit, delete, and manage all tasks' }
  ];

  return (
    <div className="page-container">
      <PageTitle 
        title="User Management"
        subtitle="Manage user accounts, roles, and permissions"
        icon={FiUser}
        actions={
          <button 
            className="btn btn--primary"
            onClick={() => setShowAddUser(true)}
          >
            <FiUserPlus size={16} />
            Add User
          </button>
        }
      />

      {/* Users List */}
      <div className="users-section">
        <h2>All Users</h2>
        <div className="users-grid">
          {users.map((user, index) => (
            <motion.div
              key={user.id}
              className="user-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="user-header">
                <img src={user.avatar} alt={user.name} className="user-avatar" />
                <div className="user-info">
                  <h3>{user.name}</h3>
                  <p>{user.email}</p>
                  <span className={`badge badge--${getRoleBadgeColor(user.role)}`}>
                    {getRoleDisplayName(user.role)}
                  </span>
                </div>
                <div className="user-actions">
                  <button
                    className="btn btn--icon"
                    onClick={() => setEditingUser(user)}
                    title="Edit user"
                  >
                    <FiEdit2 size={16} />
                  </button>
                  {user.id !== currentUser.uid && (
                    <button
                      className="btn btn--icon btn--danger"
                      onClick={() => handleDeleteUser(user.id)}
                      title="Delete user"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
              <div className="user-details">

                <div className="detail-item">
                  <span className="label">Status:</span>
                  <span className={`value ${user.isActive ? 'active' : 'inactive'}`}>
                    {user.isActive ? (
                      <>
                        <FiUserCheck size={14} />
                        Active
                      </>
                    ) : (
                      <>
                        <FiUserX size={14} />
                        Inactive
                      </>
                    )}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="label"><b>Permissions:</b></span>
                  <span className="value">
                    {user.permissions?.includes('all') ? 'All' : user.permissions?.join(', ') || 'None'}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Add User Modal */}
      <Modal
        isOpen={showAddUser}
        onClose={() => setShowAddUser(false)}
        title="Add New User"
        size="medium"
      >
        <form onSubmit={handleAddUser}>
          {error && (
            <div className="error-message">
              <FiUser size={16} />
              <span>{error}</span>
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <div className="input-wrapper">
              <FiUser className="input-icon" />
              <input
                type="text"
                id="name"
                name="name"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                placeholder="Enter full name"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-wrapper">
              <FiMail className="input-icon" />
              <input
                type="email"
                id="email"
                name="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="Enter email address"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <FiShield className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                placeholder="Enter password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="input-wrapper">
              <FiShield className="input-icon" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={newUser.confirmPassword}
                onChange={(e) => setNewUser({ ...newUser, confirmPassword: e.target.value })}
                placeholder="Confirm password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="role">Role</label>
            <select
              id="role"
              name="role"
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              required
            >
              {roles.map(role => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          <div className="modal-actions">
            <button 
              type="button" 
              className="btn btn--secondary"
              onClick={() => setShowAddUser(false)}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn--primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title="Edit User"
        size="medium"
      >
        <form onSubmit={handleEditUser}>
          {error && (
            <div className="error-message">
              <FiUser size={16} />
              <span>{error}</span>
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="editName">Full Name</label>
            <input
              type="text"
              id="editName"
              name="name"
              value={editingUser?.name || ''}
              onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="editEmail">Email Address</label>
            <input
              type="email"
              id="editEmail"
              name="email"
              value={editingUser?.email || ''}
              disabled
            />
          </div>

          <div className="form-group">
            <label htmlFor="editRole">Role</label>
            <select
              id="editRole"
              name="role"
              value={editingUser?.role || ''}
              onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
              required
            >
              {roles.map(role => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          <div className="modal-actions">
            <button 
              type="button" 
              className="btn btn--secondary"
              onClick={() => setEditingUser(null)}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn--primary"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update User'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UserManagement; 