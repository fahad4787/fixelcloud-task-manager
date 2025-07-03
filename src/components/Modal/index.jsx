import React from 'react';
import './Modal.scss';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'medium',
  showCloseButton = true,
  closeOnOverlayClick = true,
  className = '',
  ...props 
}) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  const sizeClasses = {
    small: 'modal--small',
    medium: 'modal--medium',
    large: 'modal--large',
    xlarge: 'modal--xlarge'
  };

  return (
    <div 
      className="modal-overlay"
      onClick={handleOverlayClick}
      {...props}
    >
      <div 
        className={`modal ${sizeClasses[size]} ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
          {(title || showCloseButton) && (
            <div className="modal-header">
              {title && <h3 className="modal-title">{title}</h3>}
              {showCloseButton && (
                <button 
                  type="button" 
                  className="modal-close" 
                  onClick={onClose}
                  aria-label="Close modal"
                >
                  ×
                </button>
              )}
            </div>
          )}
          <div className="modal-content">
            {children}
          </div>
        </div>
      </div>
  );
};

export default Modal; 