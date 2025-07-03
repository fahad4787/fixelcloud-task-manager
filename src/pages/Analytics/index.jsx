import React from 'react';
import { motion } from 'framer-motion';
import { FiBarChart2, FiTrendingUp, FiUsers, FiCheckCircle } from 'react-icons/fi';
import PageTitle from '../../components/PageTitle';
import './Analytics.scss';

const Analytics = () => {
  return (
    <motion.div className="page-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageTitle 
        title="Analytics"
        subtitle="Track productivity, team performance, and task progress"
        icon={FiBarChart2}
      />
      
      <div className="analytics-content">
        <div className="analytics-grid">
          <div className="analytics-card">
            <h3>Tasks Completed</h3>
            <div className="analytics-metric">
              <FiCheckCircle size={32} />
              <span className="metric-value">--</span>
            </div>
            <p className="metric-label">Total tasks completed this month</p>
          </div>
          <div className="analytics-card">
            <h3>Active Users</h3>
            <div className="analytics-metric">
              <FiUsers size={32} />
              <span className="metric-value">--</span>
            </div>
            <p className="metric-label">Team members active this week</p>
          </div>
          <div className="analytics-card">
            <h3>Productivity Trend</h3>
            <div className="analytics-metric">
              <FiTrendingUp size={32} />
              <span className="metric-value">--%</span>
            </div>
            <p className="metric-label">Compared to last month</p>
          </div>
        </div>
        <div className="analytics-placeholder">
          <p>Charts and advanced analytics coming soon!</p>
        </div>
      </div>
    </motion.div>
  );
};

export default Analytics; 