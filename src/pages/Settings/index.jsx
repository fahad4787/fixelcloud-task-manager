import React from 'react';
import { motion } from 'framer-motion';
import { FiSettings, FiUser, FiBell, FiLock } from 'react-icons/fi';
import PageTitle from '../../components/PageTitle';
import './Settings.scss';

const Settings = () => {
  return (
    <motion.div className="page-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageTitle 
        title="Settings"
        subtitle="Manage your profile, preferences, and notifications"
        icon={FiSettings}
      />
      
      <div className="settings-content">
        <div className="settings-section">
          <h2><FiUser /> Profile</h2>
          <p>Profile settings coming soon...</p>
        </div>
        <div className="settings-section">
          <h2><FiBell /> Notifications</h2>
          <p>Notification preferences coming soon...</p>
        </div>
        <div className="settings-section">
          <h2><FiLock /> Security</h2>
          <p>Password and security options coming soon...</p>
        </div>
      </div>
    </motion.div>
  );
};

export default Settings; 