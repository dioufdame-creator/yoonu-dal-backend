import React, { useState, useEffect } from 'react';
import API from '../../services/api';

const TontineTimeline = ({ tontineId, isAdmin, onUpdate }) => {
  const [timeline, setTimeline] = useState([]);
  const [tontineInfo, setTontineInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadTimeline();
  }, [tontineId]);

  const loadTimeline = async () => {
    try {
      setLoading(true);
      const response = await API.get(`/tontines/${tontineId}/timeline/`);
      setTimeline(response.data.timeline);
      setTontineInfo({
        name: response.data.tontine_name,
        totalMonths: response.data.total_months,
        currentMonth: response.data.current_month
      });
      setError(null);
    } catch (error) {
      console.error('Erreur chargement timeline:', error);
      setError('Impossible de charger la timeline');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'paid': return 'bg-green-50 border-green-500 text-green-700';
      case 'current': return 'bg-orange-50 border-orange-500 text-orange-700';
      case 'late': return 'bg-red-50 border-red-500 text-red-700';
      case 'upcoming': return 'bg-gray-50 border-gray-300 text-gray-600';
      default: return 'bg-gray-50 border-gray-300';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'paid': return '✅';
      case 'current': return '🕐';
      case 'late': return '⚠️';
      case 'upcoming': return '⏳';
      default: return '●';
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'paid': return 'Payé';
      case 'current': return 'En cours';
      case 'late': return 'En retard';
      case 'upcoming': return 'À venir';
      default: return '';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-6 mb-6">
        <p className="text-red-700">{error}</p>
        <button
          onClick={loadTimeline}
          className="mt-3 text-red-600 font-semibold hover:underline"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold flex items-center gap-2">
          <span>📅</span>
          <span>Ordre de paiement</span>
        </h3>
        {tontineInfo && (
          <div className="text-sm text-gray-600">
            Mois {tontineInfo.currentMonth} / {tontineInfo.totalMonths}
          </div>
        )}
      </div>

      <div className="space-y-3">
        {timeline.map((item) => (
          <div
            key={item.month}
            className={`p-4 rounded-xl border-2 ${getStatusColor(item.status)} transition-all hover:shadow-md`}
          >
            <div className="flex items-center justify-between">
              {/* Gauche : Icône + Info */}
              <div className="flex items-center gap-3 flex-1">
                <span className="text-3xl">{getStatusIcon(item.status)}</span>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-lg">
                      Mois {item.month}
                    </span>
                    <span className="text-xs px-2 py-1 bg-white/50 rounded">
                      {formatDate(item.date)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">👤</span>
                    <div>
                      <span className="font-semibold">
                        {item.participant.name}
                      </span>
                      {item.participant.is_current_user && (
                        <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-1 rounded font-semibold">
                          Vous
                        </span>
                      )}
                      {item.participant.is_admin && (
                        <span className="ml-2 text-xs bg-yellow-500 text-white px-2 py-1 rounded font-semibold">
                          👑 Admin
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Droite : Montant + Statut */}
              <div className="text-right">
                <div className="text-xl font-bold text-green-600 mb-1">
                  {item.amount.toLocaleString('fr-FR')} F
                </div>
                
                <div className={`text-sm font-semibold ${
                  item.status === 'paid' ? 'text-green-600' :
                  item.status === 'current' ? 'text-orange-600' :
                  item.status === 'late' ? 'text-red-600' :
                  'text-gray-500'
                }`}>
                  {getStatusLabel(item.status)}
                </div>
                
                {item.status === 'paid' && item.paid_at && (
                  <div className="text-xs text-gray-600 mt-1">
                    Payé le {new Date(item.paid_at).toLocaleDateString('fr-FR')}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Légende */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span>✅</span>
            <span className="text-gray-600">Payé</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🕐</span>
            <span className="text-gray-600">En cours ce mois</span>
          </div>
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span className="text-gray-600">En retard</span>
          </div>
          <div className="flex items-center gap-2">
            <span>⏳</span>
            <span className="text-gray-600">À venir</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TontineTimeline;
