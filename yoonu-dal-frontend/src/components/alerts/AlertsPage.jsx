import React, { useState, useEffect } from 'react';
import API from '../../services/api';

const AlertsPageV2 = ({ toast, onNavigate }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [dismissingId, setDismissingId] = useState(null);
  const [executingId, setExecutingId] = useState(null);

  useEffect(() => { loadAlerts(); }, []);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const response = await API.get('/predictions/');
      const alertsList = response.data.alerts || [];
      setAlerts(alertsList.filter(a => !a.is_dismissed));
    } catch (error) {
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
      window.dispatchEvent(new Event('alerts-updated'));
    } catch (error) {
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
      window.dispatchEvent(new Event('alerts-updated'));

      if (response.data.redirect && onNavigate) {
        setTimeout(() => onNavigate(response.data.redirect), 600);
      } else {
        setTimeout(() => loadAlerts(), 1000);
      }
    } catch (error) {
      toast?.showError(error.response?.data?.error || 'Action impossible');
    } finally {
      setExecutingId(null);
    }
  };

  const getSeverityConfig = (severity) => {
    switch (severity) {
      case 'critical':
        return { bg: 'bg-red-50', border: 'border-red-200', icon: '🔴', iconBg: 'bg-red-100', label: 'Critique', labelBg: 'bg-red-500', buttonBg: 'from-red-600 to-red-700' };
      case 'warning':
        return { bg: 'bg-amber-50', border: 'border-amber-200', icon: '⚠️', iconBg: 'bg-amber-100', label: 'Attention', labelBg: 'bg-amber-500', buttonBg: 'from-amber-600 to-orange-600' };
      default:
        return { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'ℹ️', iconBg: 'bg-blue-100', label: 'Info', labelBg: 'bg-blue-500', buttonBg: 'from-blue-600 to-indigo-600' };
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

  const filteredAlerts = alerts.filter(alert => activeFilter === 'all' || alert.severity === activeFilter);
  const criticalAlerts = alerts.filter(a => a.severity === 'critical');
  const warningAlerts = alerts.filter(a => a.severity === 'warning');
  const infoAlerts = alerts.filter(a => a.severity === 'info');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <div className="max-w-2xl mx-auto px-4 py-5">

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => onNavigate?.('dashboard')}
            className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 flex-shrink-0"
          >
            ←
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">🔔 Alertes intelligentes</h1>
            <p className="text-xs text-gray-400">
              {alerts.length === 0 ? 'Aucune alerte active' : `${alerts.length} alerte${alerts.length > 1 ? 's' : ''} à traiter`}
            </p>
          </div>
        </div>

        {/* Résumé */}
        {alerts.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-center">
              <p className="text-xl font-bold text-red-700">{criticalAlerts.length}</p>
              <p className="text-[10px] text-red-600 font-semibold">Critiques</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-center">
              <p className="text-xl font-bold text-amber-700">{warningAlerts.length}</p>
              <p className="text-[10px] text-amber-600 font-semibold">Attention</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 text-center">
              <p className="text-xl font-bold text-blue-700">{infoAlerts.length}</p>
              <p className="text-[10px] text-blue-600 font-semibold">Infos</p>
            </div>
          </div>
        )}

        {/* Filtres */}
        {alerts.length > 0 && (
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {[
              { id: 'all', label: 'Toutes', count: alerts.length },
              { id: 'critical', label: 'Critiques', count: criticalAlerts.length },
              { id: 'warning', label: 'Attention', count: warningAlerts.length },
              { id: 'info', label: 'Infos', count: infoAlerts.length }
            ].map(filter => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  activeFilter === filter.id ? 'bg-green-600 text-white shadow-sm' : 'bg-white text-gray-500 border border-gray-200'
                }`}
              >
                {filter.label} ({filter.count})
              </button>
            ))}
          </div>
        )}

        {/* État vide */}
        {alerts.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-sm">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-sm font-bold text-gray-900 mb-1">Aucune alerte !</p>
            <p className="text-xs text-gray-500 mb-4">Ta situation financière est sous contrôle 💪</p>
            <button
              onClick={() => onNavigate?.('dashboard')}
              className="text-sm bg-green-600 text-white px-4 py-2 rounded-xl font-semibold"
            >
              Retour au Dashboard
            </button>
          </div>
        )}

        {/* Liste des alertes */}
        {filteredAlerts.length > 0 && (
          <div className="space-y-3">
            {filteredAlerts.map(alert => {
              const severityConfig = getSeverityConfig(alert.severity);
              const typeConfig = getAlertTypeConfig(alert.alert_type);
              const isDismissing = dismissingId === alert.id;
              const isExecuting = executingId === alert.id;

              return (
                <div key={alert.id} className={`bg-white rounded-2xl border ${severityConfig.border} shadow-sm overflow-hidden`}>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-10 h-10 ${severityConfig.iconBg} rounded-xl flex items-center justify-center text-lg flex-shrink-0`}>
                          {severityConfig.icon}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">{alert.title}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`${severityConfig.labelBg} text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold`}>
                              {severityConfig.label}
                            </span>
                            <span className="bg-gray-100 text-gray-500 text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                              {typeConfig.emoji} {typeConfig.label}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => dismissAlert(alert.id)}
                        disabled={isDismissing}
                        className="text-gray-300 hover:text-gray-500 flex-shrink-0 disabled:opacity-50"
                      >
                        {isDismissing ? (
                          <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <span className="text-lg">✕</span>
                        )}
                      </button>
                    </div>

                    <p className="text-sm text-gray-700 leading-relaxed mb-2">{alert.message}</p>

                    {alert.context && Object.keys(alert.context).length > 0 && (
                      <div className="bg-gray-50 rounded-xl p-3 mb-3 grid grid-cols-2 gap-2 text-xs">
                        {alert.context.envelope && (
                          <div>
                            <span className="text-gray-400">Enveloppe : </span>
                            <span className="font-semibold text-gray-700 capitalize">{alert.context.envelope}</span>
                          </div>
                        )}
                        {alert.context.current_spent !== undefined && (
                          <div>
                            <span className="text-gray-400">Dépensé : </span>
                            <span className="font-semibold text-gray-700">{(alert.context.current_spent / 1000).toFixed(0)}k FCFA</span>
                          </div>
                        )}
                        {alert.context.budget !== undefined && (
                          <div>
                            <span className="text-gray-400">Budget : </span>
                            <span className="font-semibold text-gray-700">{(alert.context.budget / 1000).toFixed(0)}k FCFA</span>
                          </div>
                        )}
                        {alert.context.days_remaining !== undefined && (
                          <div>
                            <span className="text-gray-400">Jours restants : </span>
                            <span className="font-semibold text-gray-700">{alert.context.days_remaining}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {alert.suggested_action && (
                      <button
                        onClick={() => executeAction(alert)}
                        disabled={isExecuting}
                        className={`w-full bg-gradient-to-r ${severityConfig.buttonBg} text-white py-3 rounded-2xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2`}
                      >
                        {isExecuting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Exécution...</span>
                          </>
                        ) : (
                          <>
                            <span>⚡</span>
                            <span>{alert.suggested_action.message || 'Agir maintenant'}</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Aucun résultat filtré */}
        {alerts.length > 0 && filteredAlerts.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-sm">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-sm font-bold text-gray-900 mb-1">Aucune alerte de ce type</p>
            <p className="text-xs text-gray-500 mb-4">Essaie un autre filtre</p>
            <button
              onClick={() => setActiveFilter('all')}
              className="text-sm bg-gray-100 text-gray-700 px-4 py-2 rounded-xl font-semibold"
            >
              Voir toutes les alertes
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertsPageV2;
