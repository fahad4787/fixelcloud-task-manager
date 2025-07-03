import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiPlus, 
  FiEdit2, 
  FiTrash2, 
  FiMail, 
  FiUser,
  FiUsers,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiUserPlus
} from 'react-icons/fi';
import { useTaskContext } from '../../contexts/TaskContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatTimestamp } from '../../utils/dateUtils';
import Modal from '../../components/Modal';
import PageTitle from '../../components/PageTitle';
import './TeamManagement.scss';

const TeamManagement = () => {
  const { 
    employees, 
    addEmployee, 
    updateEmployee, 
    deleteEmployee,
    getTasksByAssignee,
    getEmployeesByRole 
  } = useTaskContext();
  const { canManageEmployees, currentUser } = useAuth();

  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    role: 'designer',
    avatar: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const employeesPerPage = 6;

  const handleAddEmployee = (e) => {
    e.preventDefault();
    
    // Check if required fields are filled
    if (!newEmployee.name.trim()) {
      return;
    }
    if (!newEmployee.email.trim()) {
      return;
    }
    
      addEmployee(newEmployee);
      setNewEmployee({
        name: '',
        email: '',
        role: 'designer',
        avatar: ''
      });
      setShowAddEmployee(false);
  };

  const handleEditEmployee = (e) => {
    e.preventDefault();
    if (editingEmployee.name.trim() && editingEmployee.email.trim()) {
      updateEmployee(editingEmployee.id, editingEmployee);
      setEditingEmployee(null);
    }
  };

  const handleDeleteEmployee = (employeeId) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      deleteEmployee(employeeId);
    }
  };

  const getEmployeeStats = (employeeId) => {
    const tasks = getTasksByAssignee(employeeId);
    return {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'done').length,
      inProgress: tasks.filter(t => t.status === 'in-progress').length,
      todo: tasks.filter(t => t.status === 'todo').length
    };
  };

  const roles = [
    { value: 'designer', label: 'Designer' },
    { value: 'developer', label: 'Developer' },
    { value: 'bd', label: 'Business Development' }
  ];

  const activeEmployees = employees.filter(emp => emp.isActive);
  const inactiveEmployees = employees.filter(emp => !emp.isActive);
  
  // Pagination logic
  const indexOfLastEmployee = currentPage * employeesPerPage;
  const indexOfFirstEmployee = indexOfLastEmployee - employeesPerPage;
  const currentEmployees = activeEmployees.slice(indexOfFirstEmployee, indexOfLastEmployee);
  const totalPages = Math.ceil(activeEmployees.length / employeesPerPage);

  const handleImageChange = (e, isEdit = false) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isEdit) {
          setEditingEmployee({ ...editingEmployee, avatar: reader.result });
        } else {
          setNewEmployee({ ...newEmployee, avatar: reader.result });
        }
      };
      reader.readAsDataURL(file);
    }
  };



  return (
    <div className="page-container">
      <PageTitle 
        title="Team Management"
        subtitle="Manage team members, roles, and permissions"
        icon={FiUsers}
        actions={
          canManageEmployees() && (
            <button 
              className="btn btn--primary"
              onClick={() => setShowAddEmployee(true)}
            >
              <FiUserPlus size={16} />
              Add Employee
            </button>
          )
        }
      />

      {/* Role Overview */}
      <div className="teams-overview">
        <h2>Roles Overview</h2>
        <div className="teams-grid">
          {roles.map((role, index) => {
            const roleMembers = employees.filter(emp => emp.role === role.value);
            const roleTasks = roleMembers.reduce((total, member) => {
              const memberTasks = getTasksByAssignee(member.id);
              return total + memberTasks.length;
            }, 0);
            
            return (
              <motion.div
                key={role.value}
                className="team-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="team-header">
                  <h3>{role.label}</h3>
                  <span className="member-count">{roleMembers.length} members</span>
                </div>
                <div className="team-stats">
                  <div className="stat">
                    <span className="stat-value">{roleMembers.length}</span>
                    <span className="stat-label">Members</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">{roleTasks}</span>
                    <span className="stat-label">Tasks</span>
                  </div>
                </div>
                <div className="team-members">
                  {roleMembers.slice(0, 3).map(member => (
                    <div key={member.id} className="member-avatar">
                      <img src={member.avatar} alt={member.name} />
                      <span className="member-name">{member.name}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Active Employees */}
      <div className="employees-section">
        <h2>Active Team Members ({activeEmployees.length})</h2>
        <div className="employees-grid">
          {currentEmployees.map((employee, index) => {
            const stats = getEmployeeStats(employee.id);
            
            return (
              <motion.div
                key={employee.id}
                className="employee-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="employee-header">
                  <div className="employee-info">
                    <img 
                      src={employee.avatar} 
                      alt={employee.name}
                      className="employee-avatar"
                    />
                    <div className="employee-details">
                      <h3>{employee.name}</h3>
                      <p>{employee.email}</p>
                      <div className="employee-badges">
                        <span className={`badge badge--${employee.role.toLowerCase()}`}>
                          {employee.role}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="employee-actions">
                    <button 
                      className="action-btn"
                      onClick={() => setEditingEmployee(employee)}
                    >
                      <FiEdit2 size={16} />
                    </button>
                    <button 
                      className="action-btn delete"
                      onClick={() => handleDeleteEmployee(employee.id)}
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="employee-stats">
                  <div className="stat-item">
                    <FiCheckCircle size={16} />
                    <span>{stats.completed} completed</span>
                  </div>
                  <div className="stat-item">
                    <FiClock size={16} />
                    <span>{stats.inProgress} in progress</span>
                  </div>
                  <div className="stat-item">
                    <FiUser size={16} />
                    <span>{stats.todo} pending</span>
                  </div>
                </div>

                <div className="employee-joined">
                  <FiCalendar size={14} />
                  <span>Joined {formatTimestamp(employee.joinedAt)}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Inactive Employees */}
      {inactiveEmployees.length > 0 && (
        <div className="employees-section">
          <h2>Inactive Members</h2>
          <div className="employees-grid inactive">
            {inactiveEmployees.map((employee, index) => (
              <motion.div
                key={employee.id}
                className="employee-card inactive"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="employee-header">
                  <div className="employee-info">
                    <img 
                      src={employee.avatar} 
                      alt={employee.name}
                      className="employee-avatar"
                    />
                    <div className="employee-details">
                      <h3>{employee.name}</h3>
                      <p>{employee.email}</p>
                      <span className="inactive-label">Inactive</span>
                    </div>
                  </div>
                  <div className="employee-actions">
                    <button 
                      className="action-btn"
                      onClick={() => updateEmployee(employee.id, { isActive: true })}
                    >
                      Reactivate
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: '10px', 
            marginTop: '20px' 
          }}>
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              style={{
                padding: '8px 12px',
                border: '1px solid #e1e5e9',
                borderRadius: '6px',
                background: currentPage === 1 ? '#f8f9fa' : 'white',
                color: currentPage === 1 ? '#adb5bd' : '#333',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                fontSize: '14px'
              }}
            >
              Previous
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #e1e5e9',
                  borderRadius: '6px',
                  background: currentPage === page ? '#15a970' : 'white',
                  color: currentPage === page ? 'white' : '#333',
                  cursor: 'pointer',
                  fontSize: '14px',
                  minWidth: '40px'
                }}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              style={{
                padding: '8px 12px',
                border: '1px solid #e1e5e9',
                borderRadius: '6px',
                background: currentPage === totalPages ? '#f8f9fa' : 'white',
                color: currentPage === totalPages ? '#adb5bd' : '#333',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                fontSize: '14px'
              }}
            >
              Next
            </button>
          </div>
        )}
        </div>
      )}

      {/* Add Employee Modal */}
      <Modal
        isOpen={showAddEmployee}
        onClose={() => setShowAddEmployee(false)}
        title="Add New Employee"
        size="medium"
      >
        <form onSubmit={handleAddEmployee}>
          {/* Avatar Upload Section */}
          <div className="form-group">
            <label>Avatar</label>
            <div className="avatar-upload-container">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageChange}
                style={{ 
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  opacity: 0,
                  cursor: 'pointer'
                }}
                id="avatar-upload"
              />
              {newEmployee.avatar ? (
                <div className="avatar-preview">
                  <img 
                    src={newEmployee.avatar} 
                    alt="Avatar Preview" 
                    className="avatar-image"
                  />
                </div>
              ) : (
                <div className="avatar-placeholder">
                  <div className="avatar-icon">
                    <FiUser size={32} />
                  </div>
                  <p>Click to upload avatar</p>
                  <p>PNG, JPG up to 2MB</p>
                </div>
              )}
            </div>
          </div>

          {/* Name Field */}
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              value={newEmployee.name}
              onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
              placeholder="Enter full name..."
              required
            />
          </div>

          {/* Email Field */}
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              value={newEmployee.email}
              onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
              placeholder="Enter email address (optional)..."
            />
          </div>

          {/* Role Field */}
          <div className="form-group">
            <label>Role</label>
            <select
              value={newEmployee.role}
              onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value })}
            >
              {roles.map(role => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={() => setShowAddEmployee(false)} className="btn btn--secondary">Cancel</button>
            <button type="submit" className="btn btn--primary">Add Employee</button>
          </div>
        </form>
      </Modal>

      {/* Edit Employee Modal */}
      <Modal
        isOpen={!!editingEmployee}
        onClose={() => setEditingEmployee(null)}
        title="Edit Employee"
        size="medium"
      >
        <form onSubmit={handleEditEmployee}>
          {/* Avatar Upload Section */}
          <div className="form-group">
            <label>Avatar</label>
            <div className="avatar-upload-container">
              <input 
                type="file" 
                accept="image/*" 
                onChange={e => handleImageChange(e, true)}
                style={{ 
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  opacity: 0,
                  cursor: 'pointer'
                }}
                id="avatar-upload-edit"
              />
              {editingEmployee?.avatar ? (
                <div className="avatar-preview">
                  <img 
                    src={editingEmployee.avatar} 
                    alt="Avatar Preview" 
                    className="avatar-image"
                  />
                </div>
              ) : (
                <div className="avatar-placeholder">
                  <div className="avatar-icon">
                    <FiUser size={32} />
                  </div>
                  <p>Click to upload avatar</p>
                  <p>PNG, JPG up to 2MB</p>
                </div>
              )}
            </div>
          </div>

          {/* Name Field */}
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              value={editingEmployee?.name || ''}
              onChange={(e) => setEditingEmployee({ ...editingEmployee, name: e.target.value })}
              placeholder="Enter full name..."
              required
            />
          </div>

          {/* Email Field */}
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              value={editingEmployee?.email || ''}
              onChange={(e) => setEditingEmployee({ ...editingEmployee, email: e.target.value })}
              placeholder="Enter email address (optional)..."
            />
          </div>

          {/* Role Field */}
          <div className="form-group">
            <label>Role</label>
            <select
              value={editingEmployee?.role || ''}
              onChange={(e) => setEditingEmployee({ ...editingEmployee, role: e.target.value })}
            >
              {roles.map(role => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={() => setEditingEmployee(null)} className="btn btn--secondary">Cancel</button>
            <button type="submit" className="btn btn--primary">Save Changes</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TeamManagement; 