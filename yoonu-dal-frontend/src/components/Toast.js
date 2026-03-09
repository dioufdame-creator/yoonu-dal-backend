// src/components/Toast.js - Version corrigée
import React, { useState, useEffect, useCallback } from 'react';

const Toast = ({ toastRef }) => {
  const [toasts, setToasts] = useState([]);

  // Fonction pour ajouter un toast
  const addToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random();
    const newToast = { id, message, type, duration };
    
    setToasts(prev => [...prev, newToast]);

    // Auto-remove après la durée spécifiée
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
      }, duration);
    }
  }, []);

  // Fonction pour supprimer un toast
  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // Exposer les méthodes via ref - FIX: dépendances correctes
  useEffect(() => {
    if (toastRef) {
      toastRef.current = {
        showSuccess: (message, duration = 3000) => addToast(message, 'success', duration),
        showError: (message, duration = 5000) => addToast(message, 'error', duration),
        showWarning: (message, duration = 4000) => addToast(message, 'warning', duration),
        showInfo: (message, duration = 3000) => addToast(message, 'info', duration),
        clear: () => setToasts([])
      };
    }
  }, [addToast]); // FIX: dépendance stable

  // Styles pour chaque type de toast
  const getToastStyles = (type) => {
    const baseStyles = "fixed top-4 right-4 max-w-sm w-full z-50 transform transition-all duration-300 ease-in-out";
    
    switch (type) {
      case 'success':
        return `${baseStyles} bg-green-500 text-white border-l-4 border-green-700`;
      case 'error':
        return `${baseStyles} bg-red-500 text-white border-l-4 border-red-700`;
      case 'warning':
        return `${baseStyles} bg-yellow-500 text-white border-l-4 border-yellow-700`;
      case 'info':
      default:
        return `${baseStyles} bg-blue-500 text-white border-l-4 border-blue-700`;
    }
  };

  // Icônes pour chaque type
  const getIcon = (type) => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return 'ℹ️';
    }
  };

  return (
    <div className="toast-container">
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          className={getToastStyles(toast.type)}
          style={{ 
            top: `${1 + index * 5}rem`,
            animation: 'slideInRight 0.3s ease-out'
          }}
          onClick={() => removeToast(toast.id)}
        >
          <div className="flex items-center p-4 rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow">
            <span className="text-xl mr-3">
              {getIcon(toast.type)}
            </span>
            <div className="flex-1">
              <p className="font-medium text-sm">
                {toast.message}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeToast(toast.id);
              }}
              className="ml-3 text-white hover:text-gray-200 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
      
      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default Toast;