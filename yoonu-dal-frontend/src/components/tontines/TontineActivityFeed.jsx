import React, { useState, useEffect } from 'react';
import API from '../../services/api';

const TontineActivityFeed = ({ tontineId }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
    
    // Refresh automatique toutes les 30 secondes
    const interval = setInterval(loadActivities, 30000);
    return () => clearInterval(interval);
  }, [tontineId]);

  const loadActivities = async () => {
    try {
      const response = await API.get(`/tontines/${tontineId}/activity/`);
      setActivities(response.data.activities);
    } catch (error) {
      console.error('Erreur chargement activités:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type) => {
    switch(type) {
      case 'contribution': return '💰';
      case 'validation': return '✅';
      case 'rejection': return '❌';
      case 'join': return '👋';
      case 'payout': return '🎉';
      case 'order_change': return '🔄';
      default: return '📌';
    }
  };

  const getActivityColor = (type) => {
    switch(type) {
      case 'validation': return 'bg-green-50 border-green-200';
      case 'rejection': return 'bg-red-50 border-red-200';
      case 'contribution': return 'bg-blue-50 border-blue-200';
      case 'payout': return 'bg-purple-50 border-purple-200';
      case 'order_change': return 'bg-yellow-50 border-yellow-200';
      case 'join': return 'bg-teal-50 border-teal-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <span>📊</span>
          <span>Activité récente</span>
        </h3>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-16 bg-gray-100 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
      <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <span>📊</span>
        <span>Activité récente</span>
      </h3>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 text-lg mb-2">📭</p>
            <p className="text-gray-500">Aucune activité pour le moment</p>
          </div>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              className={`p-4 rounded-lg border-2 ${getActivityColor(activity.type)} hover:shadow-md transition-all`}
            >
              <div className="flex items-start gap-3">
                {/* Icône */}
                <div className="flex-shrink-0">
                  <span className="text-3xl">{getActivityIcon(activity.type)}</span>
                </div>
                
                {/* Message */}
                <div className="flex-1 min-w-0">
                  <p className="text-gray-800 font-medium">
                    {activity.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {activity.time_ago}
                  </p>
                </div>
                
                {/* Montant si présent */}
                {activity.amount && (
                  <div className="flex-shrink-0 text-right">
                    <div className="text-green-600 font-bold text-lg">
                      {activity.amount.toLocaleString('fr-FR')} F
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TontineActivityFeed;
