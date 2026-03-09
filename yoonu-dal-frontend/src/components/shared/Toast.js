// src/components/shared/Toast.js
import React, { useState, useCallback } from 'react';

// Hook useToast corrigé sans boucle infinie
export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  // ✅ CORRECTION : useCallback pour éviter les re-créations
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
  }, []); // ✅ Pas de dépendances = stable

  // ✅ CORRECTION : useCallback pour éviter les re-créations
  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // ✅ CORRECTION : Méthodes stables avec useCallback
  const showSuccess = useCallback((message, duration = 3000) => {
    addToast(message, 'success', duration);
  }, [addToast]);

  const showError = useCallback((message, duration = 5000) => {
    addToast(message, 'error', duration);
  }, [addToast]);

  const showWarning = useCallback((message, duration = 4000) => {
    addToast(message, 'warning', duration);
  }, [addToast]);

  const showInfo = useCallback((message, duration = 3000) => {
    addToast(message, 'info', duration);
  }, [addToast]);

  return {
    toasts,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeToast
  };
};

// Composant ToastContainer corrigé
export const ToastContainer = ({ toasts, removeToast }) => {
  // Styles pour chaque type de toast
  const getToastStyles = (type) => {
    const baseStyles = "max-w-sm w-full z-50 transform transition-all duration-300 ease-in-out mb-4";
    
    switch (type) {
      case 'success':
        return `${baseStyles} bg-green-500 text-white border-l-4 border-green-700 shadow-lg`;
      case 'error':
        return `${baseStyles} bg-red-500 text-white border-l-4 border-red-700 shadow-lg`;
      case 'warning':
        return `${baseStyles} bg-yellow-500 text-white border-l-4 border-yellow-700 shadow-lg`;
      case 'info':
      default:
        return `${baseStyles} bg-blue-500 text-white border-l-4 border-blue-700 shadow-lg`;
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
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          className={`${getToastStyles(toast.type)} animate-slide-in-right`}
          onClick={() => removeToast(toast.id)}
        >
          <div className="flex items-center p-4 rounded-lg cursor-pointer hover:shadow-xl transition-shadow">
            <span className="text-xl mr-3 flex-shrink-0">
              {getIcon(toast.type)}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm break-words">
                {toast.message}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeToast(toast.id);
              }}
              className="ml-3 text-white hover:text-gray-200 transition-colors flex-shrink-0 text-lg font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
      
      {/* Styles CSS intégrés pour les animations */}
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
        
        .animate-slide-in-right {
          animation: slideInRight 0.3s ease-out;
        }
        
        /* Shake animation pour les erreurs de validation */
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        .shake {
          animation: shake 0.3s ease-in-out;
        }
        
        /* Fade in pour les éléments qui apparaissent */
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.3s ease-in;
        }
        
        /* Slide in pour les formulaires */
        @keyframes slideIn {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .animate-slide-in {
          animation: slideIn 0.4s ease-out;
        }
      `}</style>
    </div>
  );
};