import React, { useState, useEffect } from 'react';
import API from '../../services/api';

// ==========================================
// TONTINE INVITE PAGE
// Page publique accessible sans connexion
// URL : /join/:code → page 'tontine-invite' avec params { code }
// ==========================================

const TontineInvitePage = ({ inviteCode, onNavigate, toast, isAuthenticated }) => {
  const [tontine, setTontine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState(null);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    if (inviteCode) {
      loadTontineInfo();
    }
  }, [inviteCode]);

  const loadTontineInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await API.get(`/tontines/invite/${inviteCode}/`);
      setTontine(response.data);
    } catch (err) {
      setError('Tontine introuvable ou code invalide.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!isAuthenticated) {
      // Sauvegarder le code pour rejoindre après connexion
      localStorage.setItem('pending_invite_code', inviteCode);
      onNavigate?.('login');
      return;
    }

    setJoining(true);
    try {
      await API.post('/tontines/join/', { invitation_code: inviteCode });
      setJoined(true);
      toast?.showSuccess?.('Tu as rejoint la tontine !');
    } catch (err) {
      toast?.showError?.(err.response?.data?.error || 'Erreur lors de la tentative de rejoindre');
    } finally {
      setJoining(false);
    }
  };

  const formatCurrencyFull = (amount) => {
    return new Intl.NumberFormat('fr-FR').format(amount || 0) + ' FCFA';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Chargement de la tontine...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Lien invalide</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => onNavigate?.('home')}
            className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  if (joined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4 animate-bounce">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Félicitations !</h2>
          <p className="text-gray-600 mb-2">Tu as rejoint la tontine</p>
          <p className="text-xl font-bold text-green-600 mb-6">"{tontine?.name}"</p>
          <button
            onClick={() => onNavigate?.('tontines')}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Voir mes tontines 🦁
          </button>
        </div>
      </div>
    );
  }

  const payoutModeLabel = tontine?.payout_mode === 'random' ? '🎲 Tirage aléatoire' : '📝 Ordre manuel';
  const spotsLeft = tontine?.available_spots || 0;
  const isFull = spotsLeft <= 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">

        {/* Logo / Brand */}
        <div className="text-center mb-6">
          <span className="text-5xl">🦁</span>
          <p className="text-green-700 font-semibold mt-1">Yoonu Dal</p>
        </div>

        {/* Card principale */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">

          {/* Header vert */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
            <p className="text-green-100 text-sm mb-1">Invitation à rejoindre</p>
            <h1 className="text-2xl font-bold mb-1">{tontine?.name}</h1>
            {tontine?.description && (
              <p className="text-green-100 text-sm">{tontine.description}</p>
            )}
          </div>

          {/* Infos tontine */}
          <div className="p-6">

            {/* Grid infos */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-green-50 rounded-2xl p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">💰 Contribution</p>
                <p className="text-lg font-bold text-green-700">
                  {formatCurrencyFull(tontine?.monthly_contribution)}
                </p>
                <p className="text-xs text-gray-500">/mois</p>
              </div>

              <div className="bg-emerald-50 rounded-2xl p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">🎯 Total à récupérer</p>
                <p className="text-lg font-bold text-emerald-700">
                  {formatCurrencyFull(tontine?.total_amount)}
                </p>
                <p className="text-xs text-gray-500">au tour</p>
              </div>

              <div className="bg-blue-50 rounded-2xl p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">👥 Participants</p>
                <p className="text-lg font-bold text-blue-700">
                  {tontine?.current_participants}/{tontine?.max_participants}
                </p>
                <p className="text-xs text-gray-500">
                  {isFull ? '✅ Complet' : `${spotsLeft} place(s) dispo`}
                </p>
              </div>

              <div className="bg-purple-50 rounded-2xl p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">📅 Durée</p>
                <p className="text-lg font-bold text-purple-700">
                  {tontine?.duration_months} mois
                </p>
                <p className="text-xs text-gray-500">de {formatDate(tontine?.start_date)}</p>
              </div>
            </div>

            {/* Mode tirage + créateur */}
            <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3 mb-6">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">{payoutModeLabel}</span>
              </div>
              <div className="text-xs text-gray-500">
                Créé par <span className="font-semibold">{tontine?.creator_name}</span>
              </div>
            </div>

            {/* Code d'invitation */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6 text-center">
              <p className="text-xs text-gray-500 mb-1">Code d'invitation</p>
              <p className="text-xl font-mono font-bold text-orange-700">{tontine?.invitation_code}</p>
            </div>

            {/* CTA */}
            {isFull ? (
              <div className="text-center">
                <div className="bg-gray-100 rounded-xl p-4 mb-4">
                  <p className="text-gray-600 font-medium">Cette tontine est complète</p>
                  <p className="text-sm text-gray-500 mt-1">Plus de places disponibles</p>
                </div>
                <button
                  onClick={() => onNavigate?.('home')}
                  className="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-all"
                >
                  Retour à l'accueil
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={handleJoin}
                  disabled={joining}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-green-500/50 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {joining ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Rejoindre...
                    </span>
                  ) : isAuthenticated ? (
                    '🦁 Rejoindre cette tontine'
                  ) : (
                    '🔐 Se connecter pour rejoindre'
                  )}
                </button>

                {!isAuthenticated && (
                  <button
                    onClick={() => {
                      localStorage.setItem('pending_invite_code', inviteCode);
                      onNavigate?.('register');
                    }}
                    className="w-full bg-white border-2 border-green-500 text-green-700 px-6 py-3 rounded-xl font-semibold hover:bg-green-50 transition-all"
                  >
                    ✨ Créer un compte gratuitement
                  </button>
                )}

                <p className="text-center text-xs text-gray-500">
                  {isAuthenticated
                    ? 'Tu rejoindras immédiatement la tontine'
                    : 'Tu rejoindras la tontine après connexion'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-4">
          Yoonu Dal — Épargne collective et solidaire 🇸🇳
        </p>
      </div>
    </div>
  );
};

export default TontineInvitePage;
