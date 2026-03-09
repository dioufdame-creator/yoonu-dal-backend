import React from 'react';

// ==========================================
// TONTINE CARD V2 - PREMIUM DESIGN
// Matching Dashboard V6 & autres pages V2
// ==========================================

const TontineCardV2 = ({ tontine, onNavigate, toast }) => {
  
  const getStatusConfig = (status) => {
    switch (status) {
      case 'active':
        return {
          bg: 'bg-green-50',
          border: 'border-green-500',
          text: 'text-green-700',
          label: 'Active',
          icon: '✓'
        };
      case 'completed':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-500',
          text: 'text-blue-700',
          label: 'Terminée',
          icon: '🎉'
        };
      case 'planning':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-500',
          text: 'text-amber-700',
          label: 'En planification',
          icon: '⏳'
        };
      case 'paused':
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-500',
          text: 'text-orange-700',
          label: 'En pause',
          icon: '⏸️'
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-500',
          text: 'text-gray-700',
          label: status,
          icon: '•'
        };
    }
  };

  const getMotivationIcon = (motivation) => {
    const icons = {
      solidarity: '🤝',
      project: '🎯',
      emergency: '🚨',
      savings: '💰',
      education: '📚',
      business: '🏪'
    };
    return icons[motivation] || '💫';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  };

  const handleCopyInvitation = () => {
    navigator.clipboard.writeText(tontine.invitation_code);
    toast?.showSuccess?.('Code copié !') || alert('Code copié : ' + tontine.invitation_code);
  };

  if (!tontine) return null;

  const statusConfig = getStatusConfig(tontine.status);
  const progress = (tontine.current_participants / tontine.max_participants) * 100;
  const placesRestantes = tontine.max_participants - tontine.current_participants;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-xl hover:border-orange-300 transition-all duration-300 group">
      
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl group-hover:scale-110 transition-transform">
              {getMotivationIcon(tontine.motivation)}
            </span>
            <h3 className="text-xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
              {tontine.name}
            </h3>
          </div>
          
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border-l-4 ${statusConfig.border} ${statusConfig.bg} ${statusConfig.text}`}>
            <span>{statusConfig.icon}</span>
            <span className="text-sm font-semibold">{statusConfig.label}</span>
          </div>
        </div>

        {/* Montant */}
        <div className="text-right">
          <div className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            {formatCurrency(tontine.monthly_contribution)}
          </div>
          <div className="text-xs text-gray-500 mt-1">Par mois</div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-50 rounded-xl p-3">
          <div className="text-xs text-gray-600 mb-1">Participants</div>
          <div className="text-lg font-bold text-gray-900">
            {tontine.current_participants}/{tontine.max_participants}
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-xl p-3">
          <div className="text-xs text-gray-600 mb-1">Montant total</div>
          <div className="text-lg font-bold text-green-600">
            {formatCurrency(tontine.total_amount)}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-600 mb-2">
          <span>Places occupées</span>
          <span className="font-semibold">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Info supplémentaires */}
      <div className="space-y-2 text-sm mb-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Code invitation</span>
          <span className="font-mono text-xs bg-orange-50 text-orange-700 px-3 py-1 rounded-lg border border-orange-200">
            {tontine.invitation_code}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Créée le</span>
          <span className="font-medium text-gray-900">
            {new Date(tontine.created_at).toLocaleDateString('fr-FR')}
          </span>
        </div>
      </div>

      {/* Alert Messages */}
      {tontine.status === 'planning' && placesRestantes > 0 && (
        <div className="mb-4 p-3 bg-amber-50 border-l-4 border-amber-500 rounded-lg">
          <p className="text-sm text-amber-800">
            <span className="font-semibold">{placesRestantes}</span> place{placesRestantes > 1 ? 's' : ''} restante{placesRestantes > 1 ? 's' : ''}
          </p>
        </div>
      )}

      {tontine.current_participants === tontine.max_participants && tontine.status === 'planning' && (
        <div className="mb-4 p-3 bg-green-50 border-l-4 border-green-500 rounded-lg">
          <p className="text-sm text-green-800 font-semibold">
            ✓ Tontine complète ! Prête à démarrer
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onNavigate?.('tontine-detail', { id: tontine.id })}
          className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
        >
          📋 Détails
        </button>

        {tontine.status === 'planning' && (
          <button
            onClick={handleCopyInvitation}
            className="flex-1 px-4 py-2 bg-orange-100 text-orange-700 rounded-xl font-semibold hover:bg-orange-200 transition-all"
          >
            📤 Inviter
          </button>
        )}

        {tontine.status === 'active' && (
          <button
            onClick={() => onNavigate?.('tontine-detail', { id: tontine.id })}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            ⚡ Gérer
          </button>
        )}
      </div>

      {/* Badge indicators */}
      {tontine.current_participants === tontine.max_participants && tontine.status === 'planning' && (
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg animate-pulse">
          ✓
        </div>
      )}
      
      {placesRestantes <= 2 && placesRestantes > 0 && tontine.status === 'planning' && (
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg animate-pulse">
          !
        </div>
      )}
    </div>
  );
};

export default TontineCardV2;