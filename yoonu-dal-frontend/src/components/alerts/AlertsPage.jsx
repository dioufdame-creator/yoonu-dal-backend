import React, { useState, useEffect } from 'react';
import API from '../../services/api';

// ==========================================
// ALERTS PAGE V2 - PREMIUM DESIGN
// Match Dashboard V6 quality
// ==========================================

const AlertsPageV2 = ({ toast, onNavigate }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all'); // all, critical, warning, info
  const [dismissingId, setDismissingId] = useState(null);
  const [executingId, setExecutingId] = useState(null);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const response = await API.get('/predictions/');
      const alertsList = response.data.alerts || [];
      setAlerts(alertsList.filter(a => !a.is_dismissed));
    } catch (error) {
      console.error('Erreur chargement alertes:', error);
      toast?.showError('Erreur lors du chargement des alertes');
    } finally {
      setLoading(false);
    }
  };

  const dismissAlert = async (alertId) => {
    setDismissingId(alertId);
    try {
      await API.post(`/predictions/${alertId}/dismiss/`);
      setAlerts(alerts.filter(a => a.id !== alertId));
      toast?.showSuccess('Alerte ignorée');
      
      // Émettre événement pour mettre à jour le badge
      window.dispatchEvent(new Event('alerts-updated'));
    } catch (error) {
      console.error('Erreur dismiss:', error);
      toast?.showError('Erreur lors de l\'action');
    } finally {
      setDismissingId(null);
    }
  };

  const executeAction = async (alert) => {
    setExecutingId(alert.id);
    try {
      const response = await API.post(`/predictions/${alert.id}/execute/`);
      setAlerts(alerts.filter(a => a.id !== alert.id));
      toast?.showSuccess(response.data.message || 'Action exécutée avec succès');
      
      // Émettre événement
      window.dispatchEvent(new Event('alerts-updated'));
      
      // Recharger
      setTimeout(() => loadAlerts(), 1000);
    } catch (error) {
      console.error('Erreur action:', error);
      toast?.showError(error.response?.data?.error || 'Action impossible');
    } finally {
      setExecutingId(null);
    }
  };

  const getSeverityConfig = (severity) => {
    switch (severity) {
      case 'critical':
        return {
          bg: 'bg-red-50',
          bgGradient: 'from-red-50 to-red-100',
          border: 'border-red-300',
          borderLeft: 'border-l-red-500',
          icon: '🔴',
          iconBg: 'bg-red-100',
          label: 'Critique',
          labelBg: 'bg-red-500',
          buttonBg: 'from-red-600 to-red-700',
          buttonHover: 'hover:shadow-red-500/50'
        };
      case 'warning':
        return {
          bg: 'bg-amber-50',
          bgGradient: 'from-amber-50 to-orange-100',
          border: 'border-amber-300',
          borderLeft: 'border-l-amber-500',
          icon: '⚠️',
          iconBg: 'bg-amber-100',
          label: 'Attention',
          labelBg: 'bg-amber-500',
          buttonBg: 'from-amber-600 to-orange-600',
          buttonHover: 'hover:shadow-amber-500/50'
        };
      default:
        return {
          bg: 'bg-blue-50',
          bgGradient: 'from-blue-50 to-indigo-100',
          border: 'border-blue-300',
          borderLeft: 'border-l-blue-500',
          icon: 'ℹ️',
          iconBg: 'bg-blue-100',
          label: 'Info',
          labelBg: 'bg-blue-500',
          buttonBg: 'from-blue-600 to-indigo-600',
          buttonHover: 'hover:shadow-blue-500/50'
        };
    }
  };

  const getAlertTypeConfig = (alertType) => {
    const configs = {
      budget_warning: { emoji: '💰', label: 'Budget' },
      upcoming_payment: { emoji: '📅', label: 'Échéance' },
      tontine_due: { emoji: '🦁', label: 'Tontine' },
      habit_warning: { emoji: '🔄', label: 'Habitude' },
      cultural_event: { emoji: '🎉', label: 'Événement' }
    };
    return configs[alertType] || { emoji: '📌', label: 'Alerte' };
  };

  // Filtrer alertes
  const filteredAlerts = alerts.filter(alert => {
    if (activeFilter === 'all') return true;
    return alert.severity === activeFilter;
  });

  // Grouper par sévérité
  const criticalAlerts = alerts.filter(a => a.severity === 'critical');
  const warningAlerts = alerts.filter(a => a.severity === 'warning');
  const infoAlerts = alerts.filter(a => a.severity === 'info');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des alertes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-3">
                <span>🔔</span>
                <span>Alertes Intelligentes</span>
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {alerts.length === 0 
                  ? 'Aucune alerte active. Tout va bien !'
                  : `${alerts.length} alerte${alerts.length > 1 ? 's' : ''} à traiter`
                }
              </p>
            </div>
          </div>

          {/* Summary Cards */}
          {alerts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border-2 border-red-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-700">Critiques</p>
                    <p className="text-3xl font-bold text-red-800">{criticalAlerts.length}</p>
                  </div>
                  <span className="text-4xl">🔴</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-xl p-4 border-2 border-amber-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-amber-700">Avertissements</p>
                    <p className="text-3xl font-bold text-amber-800">{warningAlerts.length}</p>
                  </div>
                  <span className="text-4xl">⚠️</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-4 border-2 border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700">Informations</p>
                    <p className="text-3xl font-bold text-blue-800">{infoAlerts.length}</p>
                  </div>
                  <span className="text-4xl">ℹ️</span>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          {alerts.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {[
                { id: 'all', label: 'Toutes', count: alerts.length },
                { id: 'critical', label: 'Critiques', count: criticalAlerts.length },
                { id: 'warning', label: 'Attention', count: warningAlerts.length },
                { id: 'info', label: 'Infos', count: infoAlerts.length }
              ].map(filter => (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    activeFilter === filter.id
                      ? 'bg-green-600 text-white shadow-lg'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {filter.label} ({filter.count})
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Empty State */}
        {alerts.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Aucune alerte !
            </h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Ta situation financière est sous contrôle. Continue comme ça ! 💪
            </p>
            <button
              onClick={() => onNavigate('dashboard')}
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Retour au Dashboard
            </button>
          </div>
        )}

        {/* Alerts List */}
        {filteredAlerts.length > 0 && (
          <div className="space-y-4">
            {filteredAlerts.map(alert => {
              const severityConfig = getSeverityConfig(alert.severity);
              const typeConfig = getAlertTypeConfig(alert.alert_type);
              const isDismissing = dismissingId === alert.id;
              const isExecuting = executingId === alert.id;
              
              return (
                <div
                  key={alert.id}
                  className={`bg-gradient-to-r ${severityConfig.bgGradient} rounded-2xl border-2 ${severityConfig.border} border-l-4 ${severityConfig.borderLeft} shadow-md hover:shadow-lg transition-all overflow-hidden animate-slideIn`}
                >
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {/* Severity Icon */}
                          <div className={`w-12 h-12 ${severityConfig.iconBg} rounded-xl flex items-center justify-center text-2xl`}>
                            {severityConfig.icon}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-xl font-bold text-gray-900">{alert.title}</h3>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`${severityConfig.labelBg} text-white text-xs px-2 py-1 rounded-full font-semibold`}>
                                {severityConfig.label}
                              </span>
                              <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full font-medium">
                                {typeConfig.emoji} {typeConfig.label}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Message */}
                        <p className="text-gray-800 leading-relaxed ml-15">
                          {alert.message}
                        </p>

                        {/* Context */}
                        {alert.context && Object.keys(alert.context).length > 0 && (
                          <div className="mt-4 ml-15 bg-white bg-opacity-60 rounded-lg p-3 text-sm">
                            <p className="font-semibold text-gray-700 mb-2">📊 Détails :</p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {alert.context.envelope && (
                                <div>
                                  <span className="text-gray-600">Enveloppe : </span>
                                  <span className="font-semibold capitalize">{alert.context.envelope}</span>
                                </div>
                              )}
                              {alert.context.current_spent !== undefined && (
                                <div>
                                  <span className="text-gray-600">Dépensé : </span>
                                  <span className="font-semibold">{(alert.context.current_spent / 1000).toFixed(0)}k FCFA</span>
                                </div>
                              )}
                              {alert.context.budget !== undefined && (
                                <div>
                                  <span className="text-gray-600">Budget : </span>
                                  <span className="font-semibold">{(alert.context.budget / 1000).toFixed(0)}k FCFA</span>
                                </div>
                              )}
                              {alert.context.days_remaining !== undefined && (
                                <div>
                                  <span className="text-gray-600">Jours restants : </span>
                                  <span className="font-semibold">{alert.context.days_remaining}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Dismiss Button */}
                      <button
                        onClick={() => dismissAlert(alert.id)}
                        disabled={isDismissing}
                        className="text-gray-400 hover:text-gray-600 ml-4 p-2 hover:bg-white hover:bg-opacity-50 rounded-lg transition-all disabled:opacity-50"
                        title="Ignorer cette alerte"
                      >
                        {isDismissing ? (
                          <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <span className="text-xl">✕</span>
                        )}
                      </button>
                    </div>

                    {/* Action Button */}
                    {alert.suggested_action && (
                      <div className="mt-4 ml-15">
                        <button
                          onClick={() => executeAction(alert)}
                          disabled={isExecuting}
                          className={`w-full bg-gradient-to-r ${severityConfig.buttonBg} text-white px-6 py-3 rounded-xl font-semibold hover:shadow-xl ${severityConfig.buttonHover} transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                        >
                          {isExecuting ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>Exécution...</span>
                            </>
                          ) : (
                            <>
                              <span>⚡</span>
                              <span>{alert.suggested_action.message || 'Agir maintenant'}</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* No Results with Filter */}
        {alerts.length > 0 && filteredAlerts.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Aucune alerte de ce type
            </h2>
            <p className="text-gray-600 mb-6">
              Essaie un autre filtre pour voir toutes tes alertes
            </p>
            <button
              onClick={() => setActiveFilter('all')}
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Voir toutes les alertes
            </button>
          </div>
        )}

      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(-10px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default AlertsPageV2;