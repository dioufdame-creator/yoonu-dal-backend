import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import TontineTimeline from './TontineTimeline';
import TontineActivityFeed from './TontineActivityFeed';
import TontineAdminPanel from './TontineAdminPanel';

const TontineDetail = ({ tontineId, onNavigate, toast, user }) => {
  const [tontine, setTontine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [contributeAmount, setContributeAmount] = useState('');
  const [contributeMethod, setContributeMethod] = useState('virement');
  const [contributeRef, setContributeRef] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [myContributions, setMyContributions] = useState([]);
  const [loadingContributions, setLoadingContributions] = useState(false);
  const [showMyPayments, setShowMyPayments] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await API.get('/profile/');
        setCurrentUser(response.data.user);
      } catch (error) {
        console.error('Erreur chargement user:', error);
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    if (tontineId) loadDetail();
  }, [tontineId]);

  const loadDetail = async () => {
    setLoading(true);
    try {
      const response = await API.get(`/tontines/${tontineId}/`);
      setTontine(response.data);
    } catch (error) {
      if (error.response?.status === 403) {
        toast?.showError?.("Vous n\'avez pas accès à cette tontine");
      } else if (error.response?.status === 404) {
        toast?.showError?.('Tontine introuvable');
      } else {
        toast?.showError?.('Erreur chargement de la tontine');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadMyContributions = async () => {
    if (!tontine || !currentUser) return;
    setLoadingContributions(true);
    try {
      const myParticipant = tontine.participants?.find(p => p.user?.id === currentUser?.id);
      if (!myParticipant) return;
      const response = await API.get(`/tontines/${tontineId}/my-contributions/`);
      setMyContributions(response.data.contributions || []);
    } catch (error) {
      console.error('Erreur contributions:', error);
      setMyContributions([]);
    } finally {
      setLoadingContributions(false);
    }
  };

  // Calcul des mois échus et statut
  const getPaymentSummary = () => {
    if (!tontine || tontine.status !== 'active') return null;
    const today = new Date();
    const start = new Date(tontine.start_date);
    const paymentDay = tontine.payment_day || 5;

    const monthsElapsed = Math.max(1,
      (today.getFullYear() - start.getFullYear()) * 12 +
      (today.getMonth() - start.getMonth()) + 1
    );

    const myParticipant = tontine.participants?.find(p => p.user?.id === currentUser?.id);
    const confirmedCount = myContributions.filter(c => c.status === 'confirmed').length;
    const pendingCount = myContributions.filter(c => c.status === 'pending').length;
    const deadlinePassed = today.getDate() > paymentDay;

    let status, statusColor, statusLabel;
    if (confirmedCount >= monthsElapsed) {
      status = 'à_jour';
      statusColor = 'bg-green-50 border-green-300 text-green-800';
      statusLabel = '✅ À jour';
    } else if (confirmedCount >= monthsElapsed - 1 && !deadlinePassed) {
      status = 'à_compléter';
      statusColor = 'bg-amber-50 border-amber-300 text-amber-800';
      statusLabel = '⏳ À compléter';
    } else {
      status = 'en_retard';
      statusColor = 'bg-red-50 border-red-300 text-red-800';
      statusLabel = '❌ En retard';
    }

    return {
      monthsElapsed,
      confirmedCount,
      pendingCount,
      deadlinePassed,
      paymentDay,
      status,
      statusColor,
      statusLabel,
      missingMonths: Math.max(0, monthsElapsed - confirmedCount)
    };
  };

  // Générer la liste des mois échus avec statut paiement
  const getMonthsTimeline = () => {
    if (!tontine || !tontine.start_date) return [];
    const today = new Date();
    const start = new Date(tontine.start_date);
    const monthsElapsed = Math.max(1,
      (today.getFullYear() - start.getFullYear()) * 12 +
      (today.getMonth() - start.getMonth()) + 1
    );

    const months = [];
    for (let i = 0; i < monthsElapsed; i++) {
      const monthDate = new Date(start.getFullYear(), start.getMonth() + i, 1);
      const monthStr = monthDate.toISOString().slice(0, 7);

      // Chercher la contribution pour ce mois
      const contribution = myContributions.find(c => {
        if (c.contribution_month) {
          return c.contribution_month.startsWith(monthStr);
        }
        // Fallback : ordre chronologique
        return false;
      });

      // Si pas de contribution_month, assigner par ordre
      const orderedContrib = !contribution && myContributions[i];

      const monthName = monthDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      const isCurrentMonth = (monthDate.getFullYear() === today.getFullYear() &&
                              monthDate.getMonth() === today.getMonth());

      months.push({
        monthStr,
        monthName,
        isCurrentMonth,
        contribution: contribution || orderedContrib || null,
      });
    }
    return months;
  };

  const handleContribute = async (e) => {
    e.preventDefault();
    if (!contributeAmount) { toast?.showError('Entre un montant'); return; }
    try {
      await API.post(`/tontines/${tontineId}/contribute/`, {
        amount: parseFloat(contributeAmount),
        payment_method: contributeMethod,
        transaction_reference: contributeRef,
      });
      toast?.showSuccess("Contribution enregistrée ! En attente de validation par l\'admin.");
      setShowContributeModal(false);
      setContributeAmount('');
      setContributeRef('');
      loadDetail();
      loadMyContributions();
    } catch (error) {
      toast?.showError(error.response?.data?.error || 'Erreur contribution');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer la tontine "${tontine?.name}" ?\n\nCette action est irréversible !`)) return;
    try {
      await API.delete(`/tontines/${tontineId}/`);
      toast?.showSuccess?.('Tontine supprimée avec succès !');
      onNavigate?.('tontines');
    } catch (error) {
      toast?.showError?.(`Erreur : ${error.response?.data?.error || error.message}`);
    }
  };

  const formatCurrency = (value) => new Intl.NumberFormat('fr-FR').format(value || 0) + ' FCFA';

  const getStatusConfig = (status) => {
    const configs = {
      planning: { label: 'En préparation', emoji: '📋', color: 'blue' },
      active: { label: 'Active', emoji: '🔥', color: 'green' },
      completed: { label: 'Terminée', emoji: '✅', color: 'gray' },
      cancelled: { label: 'Annulée', emoji: '❌', color: 'red' }
    };
    return configs[status] || configs.planning;
  };

  const getContributionBadge = (status) => {
    switch (status) {
      case 'à_jour': return <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">✅ À jour</span>;
      case 'à_compléter': return <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">⏳ À compléter</span>;
      case 'en_retard': return <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">❌ En retard</span>;
      default: return null;
    }
  };

  const getPaymentDeadlineInfo = (tontine) => {
    if (tontine.status !== 'active' || !tontine.payment_day) return null;
    const now = new Date();
    const day = now.getDate();
    const payDay = tontine.payment_day;
    const daysLeft = payDay - day;
    if (daysLeft < 0) return { label: `Date limite dépassée ce mois (était le ${payDay})`, color: 'text-gray-500', bg: 'bg-gray-50 border-gray-200' };
    if (daysLeft === 0) return { label: `⚠️ Aujourd'hui est la date limite !`, color: 'text-red-700', bg: 'bg-red-50 border-red-200' };
    if (daysLeft <= 2) return { label: `🚨 Plus que ${daysLeft} jour(s) pour contribuer !`, color: 'text-red-700', bg: 'bg-red-50 border-red-200' };
    if (daysLeft <= 5) return { label: `⏰ ${daysLeft} jours restants avant la limite`, color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' };
    return { label: `📆 Limite de paiement : le ${payDay} de chaque mois`, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' };
  };

  // Charger les contributions quand on ouvre le panneau
  useEffect(() => {
    if (showMyPayments && tontine && currentUser) {
      loadMyContributions();
    }
  }, [showMyPayments, tontine, currentUser]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!tontine) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Tontine introuvable</h2>
          <p className="text-gray-600 mb-6">Cette tontine n'existe pas ou vous n'y avez pas accès</p>
          <button onClick={() => onNavigate?.('tontines')}
            className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-all">
            ← Retour aux tontines
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(tontine.status);
  const progress = tontine.max_participants > 0 ? (tontine.current_participants / tontine.max_participants) * 100 : 0;
  const currentUserParticipant = tontine.participants?.find(p => p.user?.id === currentUser?.id);
  const isAdmin = currentUserParticipant?.is_admin || tontine.creator?.id === currentUser?.id;
  const payoutAmount = (tontine.monthly_contribution || 0) * (tontine.max_participants || 0);
  const deadlineInfo = getPaymentDeadlineInfo(tontine);
  const paymentSummary = getPaymentSummary();
  const monthsTimeline = showMyPayments ? getMonthsTimeline() : [];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => onNavigate?.('tontines')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
              <span className="text-xl">←</span>
              <span className="font-medium">Retour</span>
            </button>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                tontine.payout_mode === 'random' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {tontine.payout_mode === 'random' ? '🎲 Aléatoire' : '📝 Manuel'}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                statusConfig.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                statusConfig.color === 'green' ? 'bg-green-100 text-green-700' :
                statusConfig.color === 'gray' ? 'bg-gray-100 text-gray-700' :
                'bg-red-100 text-red-700'
              }`}>
                {statusConfig.emoji} {statusConfig.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        {/* Titre */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{tontine.name}</h1>
              <p className="text-gray-600">{tontine.description || 'Pas de description'}</p>
            </div>
            <div className="text-right ml-4">
              <p className="text-sm text-gray-500 mb-1">Code d'invitation</p>
              <p className="text-2xl font-mono font-bold text-green-600">{tontine.invitation_code}</p>
              <button onClick={() => { navigator.clipboard.writeText(tontine.invitation_code); toast?.showSuccess?.('Code copié !'); }}
                className="text-xs text-gray-500 hover:text-green-600 mt-1">📋 Copier</button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-500 mb-1">💰 Contribution/mois</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(tontine.monthly_contribution)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">👥 Participants</p>
              <p className="text-lg font-bold text-gray-900">{tontine.current_participants}/{tontine.max_participants}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">📅 Durée</p>
              <p className="text-lg font-bold text-gray-900">{tontine.duration_months} mois</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">🎯 Tu reçois à ton tour</p>
              <p className="text-lg font-bold text-green-600">{formatCurrency(payoutAmount)}</p>
            </div>
          </div>
          {deadlineInfo && (
            <div className={`mt-4 border rounded-xl px-4 py-3 ${deadlineInfo.bg}`}>
              <p className={`text-sm font-medium ${deadlineInfo.color}`}>{deadlineInfo.label}</p>
            </div>
          )}
        </div>

        {/* ── MES PAIEMENTS ── */}
        {tontine.status === 'active' && currentUserParticipant && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <button
              onClick={() => setShowMyPayments(!showMyPayments)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">💳</span>
                <div className="text-left">
                  <h2 className="text-lg font-bold text-gray-900">Mes paiements</h2>
                  {paymentSummary && (
                    <p className="text-sm text-gray-500">
                      {paymentSummary.confirmedCount}/{paymentSummary.monthsElapsed} mois payés
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {paymentSummary && (
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${paymentSummary.statusColor}`}>
                    {paymentSummary.statusLabel}
                  </span>
                )}
                <span className="text-gray-400">{showMyPayments ? '▲' : '▼'}</span>
              </div>
            </button>

            {showMyPayments && (
              <div className="px-6 pb-6 border-t border-gray-100">
                {/* Résumé */}
                {paymentSummary && (
                  <div className="grid grid-cols-3 gap-3 mt-4 mb-5">
                    <div className="bg-green-50 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-green-700">{paymentSummary.confirmedCount}</p>
                      <p className="text-xs text-gray-600">Payés</p>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-amber-700">{paymentSummary.pendingCount}</p>
                      <p className="text-xs text-gray-600">En attente</p>
                    </div>
                    <div className="bg-red-50 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-red-700">{paymentSummary.missingMonths}</p>
                      <p className="text-xs text-gray-600">Manquants</p>
                    </div>
                  </div>
                )}

                {/* Timeline des mois */}
                {loadingContributions ? (
                  <div className="text-center py-6">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {monthsTimeline.map((month, idx) => {
                      const c = month.contribution;
                      const isPaid = c?.status === 'confirmed';
                      const isPending = c?.status === 'pending';
                      const isUnpaid = !c;

                      return (
                        <div key={idx} className={`flex items-center justify-between p-3 rounded-xl border ${
                          isPaid ? 'bg-green-50 border-green-200' :
                          isPending ? 'bg-amber-50 border-amber-200' :
                          month.isCurrentMonth ? 'bg-blue-50 border-blue-200' :
                          'bg-red-50 border-red-200'
                        }`}>
                          <div className="flex items-center gap-3">
                            <span className="text-xl">
                              {isPaid ? '✅' : isPending ? '⏳' : month.isCurrentMonth ? '📅' : '❌'}
                            </span>
                            <div>
                              <p className="font-semibold text-gray-900 capitalize">{month.monthName}</p>
                              {c && (
                                <p className="text-xs text-gray-500">
                                  {new Date(c.date).toLocaleDateString('fr-FR')} · {c.payment_method}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            {c ? (
                              <p className="font-bold text-gray-900">
                                {formatCurrency(c.amount)}
                              </p>
                            ) : (
                              <p className="text-sm font-semibold text-gray-500">
                                {month.isCurrentMonth ? 'À payer' : 'Non payé'}
                              </p>
                            )}
                            {isPending && (
                              <p className="text-xs text-amber-600">En validation</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Bouton contribuer si pas à jour */}
                {paymentSummary && paymentSummary.status !== 'à_jour' && (
                  <button
                    onClick={() => setShowContributeModal(true)}
                    className="w-full mt-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
                  >
                    💰 Payer maintenant
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Progression participants */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900">Progression des participants</h2>
            <span className="text-2xl font-bold text-gray-900">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div className="h-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(progress, 100)}%` }}></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {tontine.available_spots > 0 ? `${tontine.available_spots} place(s) disponible(s)` : '✅ Tontine complète'}
          </p>
        </div>

        {/* Panneau Admin */}
        {isAdmin && (
          <TontineAdminPanel
            tontine={tontine}
            participants={tontine.participants || []}
            onUpdate={loadDetail}
            toast={toast}
          />
        )}

        <TontineTimeline tontineId={tontine.id} isAdmin={isAdmin} onUpdate={loadDetail} />
        <TontineActivityFeed tontineId={tontine.id} />

        {/* Zone de danger */}
        {tontine.creator && tontine.status === 'planning' && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <div className="flex items-start gap-4">
              <span className="text-3xl">⚠️</span>
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 mb-1">Zone de danger</h3>
                <p className="text-sm text-red-700 mb-3">
                  La suppression est irréversible et possible uniquement en phase de planification sans contributions.
                </p>
                <button onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all">
                  🗑️ Supprimer cette tontine
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Liste des participants */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">
              👥 Participants ({tontine.participants?.length || 0})
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {!tontine.participants || tontine.participants.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">👤</div>
                <p className="text-gray-600">Aucun participant pour le moment</p>
              </div>
            ) : (
              tontine.participants.map((participant, index) => (
                <div key={participant.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {participant.user?.first_name} {participant.user?.last_name}
                          {participant.user?.id === currentUser?.id && (
                            <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">Vous</span>
                          )}
                        </p>
                        <p className="text-sm text-gray-500">@{participant.user?.username}</p>
                        {tontine.status === 'active' && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            Contribué : {formatCurrency(participant.total_contributions)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {participant.is_admin && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">👑 Admin</span>
                      )}
                      {participant.received_payout && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">💰 Payé</span>
                      )}
                      {tontine.status === 'active' && getContributionBadge(participant.contribution_status)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {tontine.status === 'active' && (
          <div className="fixed bottom-6 left-0 right-0 px-4 z-20">
            <div className="max-w-6xl mx-auto">
              <button onClick={() => setShowContributeModal(true)}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 rounded-xl font-semibold text-lg shadow-2xl hover:shadow-green-500/50 transition-all transform hover:scale-[1.02]">
                💰 Contribuer à cette tontine
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Contribution */}
      {showContributeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-1">💰 Nouvelle contribution</h3>
            {deadlineInfo && (
              <div className={`mb-4 border rounded-xl px-3 py-2 ${deadlineInfo.bg}`}>
                <p className={`text-xs font-medium ${deadlineInfo.color}`}>{deadlineInfo.label}</p>
              </div>
            )}
            {paymentSummary && (
              <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
                <p className="text-xs text-blue-800 font-medium">
                  📅 Ce paiement concernera : <strong className="capitalize">
                    {(() => {
                      const start = new Date(tontine.start_date);
                      const nextMonth = new Date(start.getFullYear(), start.getMonth() + paymentSummary.confirmedCount + paymentSummary.pendingCount, 1);
                      return nextMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
                    })()}
                  </strong>
                </p>
              </div>
            )}
            <p className="text-sm text-gray-500 mb-5">
              Votre contribution sera examinée par l'administrateur avant validation.
            </p>
            <form onSubmit={handleContribute} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Montant (FCFA) *</label>
                <input type="number" value={contributeAmount}
                  onChange={(e) => setContributeAmount(e.target.value)}
                  placeholder={`Ex: ${new Intl.NumberFormat('fr-FR').format(tontine.monthly_contribution)}`}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Méthode de paiement</label>
                <select value={contributeMethod} onChange={(e) => setContributeMethod(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white">
                  <option value="virement">Virement bancaire</option>
                  <option value="wave">Wave</option>
                  <option value="orange_money">Orange Money</option>
                  <option value="free_money">Free Money</option>
                  <option value="cash">Espèces</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Référence transaction (optionnel)</label>
                <input type="text" value={contributeRef} onChange={(e) => setContributeRef(e.target.value)}
                  placeholder="Ex: TXN-2026-001"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowContributeModal(false); setContributeAmount(''); setContributeRef(''); }}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all">
                  Annuler
                </button>
                <button type="submit"
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-all">
                  Envoyer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TontineDetail;
