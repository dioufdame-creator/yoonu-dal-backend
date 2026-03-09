import React, { useState, useEffect } from 'react';
import API from '../../services/api';

// ==========================================
// ALERTS BADGE V2 - PREMIUM DESIGN
// Indicator premium pour navigation
// ==========================================

const AlertsBadgeV2 = ({ onClick }) => {
  const [count, setCount] = useState(0);
  const [severity, setSeverity] = useState('info'); // critical, warning, info
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadAlertsCount();
    // Refresh toutes les 2 minutes
    const interval = setInterval(loadAlertsCount, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Écouter les événements de mise à jour
  useEffect(() => {
    const handleUpdate = () => loadAlertsCount();
    window.addEventListener('alerts-updated', handleUpdate);
    window.addEventListener('expense-added', handleUpdate);
    window.addEventListener('budget-adjusted', handleUpdate);
    return () => {
      window.removeEventListener('alerts-updated', handleUpdate);
      window.removeEventListener('expense-added', handleUpdate);
      window.removeEventListener('budget-adjusted', handleUpdate);
    };
  }, []);

  const loadAlertsCount = async () => {
    setIsLoading(true);
    try {
      const response = await API.get('/predictions/');
      const activeAlerts = response.data.alerts?.filter(a => !a.is_dismissed) || [];
      setCount(activeAlerts.length);
      
      // Déterminer la sévérité la plus haute
      if (activeAlerts.some(a => a.severity === 'critical')) {
        setSeverity('critical');
      } else if (activeAlerts.some(a => a.severity === 'warning')) {
        setSeverity('warning');
      } else {
        setSeverity('info');
      }
    } catch (error) {
      console.error('Erreur chargement alertes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (count === 0) return null;

  const getSeverityStyle = () => {
    switch (severity) {
      case 'critical':
        return {
          bg: 'bg-red-500',
          pulse: 'animate-pulse',
          glow: 'shadow-red-500/50'
        };
      case 'warning':
        return {
          bg: 'bg-amber-500',
          pulse: 'animate-pulse',
          glow: 'shadow-amber-500/50'
        };
      default:
        return {
          bg: 'bg-blue-500',
          pulse: '',
          glow: 'shadow-blue-500/50'
        };
    }
  };

  const style = getSeverityStyle();

  return (
    <button
      onClick={onClick}
      className="relative p-2 hover:bg-gray-100 rounded-xl transition-all group"
      title={`${count} alerte${count > 1 ? 's' : ''} ${
        severity === 'critical' ? 'critique' + (count > 1 ? 's' : '') : 
        severity === 'warning' ? 'd\'avertissement' : 
        ''
      }`}
    >
      {/* Bell Icon */}
      <div className="relative">
        <span className={`text-2xl transition-transform group-hover:scale-110 ${isLoading ? 'animate-bounce' : ''}`}>
          🔔
        </span>
        
        {/* Badge Count */}
        <span 
          className={`absolute -top-1 -right-1 ${style.bg} text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 shadow-lg ${style.glow} ${style.pulse}`}
        >
          {count > 9 ? '9+' : count}
        </span>

        {/* Ripple Effect for Critical */}
        {severity === 'critical' && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full animate-ping opacity-75"></span>
        )}
      </div>
    </button>
  );
};

export default AlertsBadgeV2;