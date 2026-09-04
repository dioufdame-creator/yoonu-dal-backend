import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import TontineTimeline from './TontineTimeline';
import TontineActivityFeed from './TontineActivityFeed';
import TontineAdminPanel from './TontineAdminPanel';

const TontineDetail = ({ tontineId, onNavigate, toast, user }) => {
  const [tontine, setTontine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showContributeSheet, setShowContributeSheet] = useState(false);
  const [contributeAmount, setContributeAmount] = useState('');
  const [contributeMethod, setContributeMethod] = useState('virement');
  const [contributeRef, setContributeRef] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [myContributions, setMyContributions] = useState([]);
  const [contributionsLoaded, setContributionsLoaded] = useState(false);
  const [loadingContributions, setLoadingContributions] = useState(false);
  const [showMyPayments, setShowMyPayments] = useState(false);
  const [selectedHand, setSelectedHand] = useState(null); // main active pour paiements/contribution

  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await API.get('/profile/');
        setCurrentUser(response.data.user);
      } catch {}
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
        toast?.showError?.("Vous n'avez pas accès à cette tontine");
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
    if (!tontine || !currentUser || !currentUserParticipant) return;
    setLoadingContributions(true);
    try {
      // ✅ Précise quelle main — l'endpoint retourne les contributions
      // de cette participation précise, pas toutes les mains mélangées
      const response = await API.get(
        `/tontines/${tontineId}/my-contributions/?participant_id=${currentUserParticipant.id}`
      );
      setMyContributions(response.data.contributions || []);
    } catch {
      setMyContributions([]);
    } finally {
      setLoadingContributions(false);
      setContributionsLoaded(true); // ✅ vraies données arrivées, le badge peut s'afficher
    }
  };

  const getPaymentSummary = () => {
    if (!tontine || tontine.status !== 'active') return null;
    const today = new Date();
    const start = new Date(tontine.start_date);
    const paymentDay = tontine.payment_day || 5;

    const monthsElapsed = Math.max(1,
      (today.getFullYear() - start.getFullYear()) * 12 +
      (today.getMonth() - start.getMonth()) + 1
    );

    const confirmedCount = myContributions.filter(c => c.status === 'confirmed').length;
    const pendingCount = myContributions.filter(c => c.status === 'pending').length;
    const deadlinePassed = today.getDate() > paymentDay;

    let status, statusColor, statusLabel;
    if (confirmedCount >= monthsElapsed) {
      status = 'à_jour';
      statusColor = 'bg-green-50 text-green-700';
      statusLabel = '✅ À jour';
    } else if (confirmedCount >= monthsElapsed - 1 && !deadlinePassed) {
      status = 'à_compléter';
      statusColor = 'bg-amber-50 text-amber-700';
      statusLabel = '⏳ À compléter';
    } else {
      status = 'en_retard';
      statusColor = 'bg-red-50 text-red-700';
      statusLabel = '❌ En retard';
    }

    return {
      monthsElapsed, confirmedCount, pendingCount, deadlinePassed, paymentDay,
      status, statusColor, statusLabel,
      missingMonths: Math.max(0, monthsElapsed - confirmedCount),
    };
  };

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

      const contribution = myContributions.find(c => {
        if (c.contribution_month) return c.contribution_month.startsWith(monthStr);
        return false;
      });
      const orderedContrib = !contribution && myContributions[i];

      const monthName = monthDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      const isCurrentMonth = (monthDate.getFullYear() === today.getFullYear() &&
                              monthDate.getMonth() === today.getMonth());

      months.push({ monthStr, monthName, isCurrentMonth, contribution: contribution || orderedContrib || null });
    }
    return months;
  };

  const handleContribute = async () => {
    if (!contributeAmount) { toast?.showError?.('Entre un montant'); return; }
    if (!currentUserParticipant) { toast?.showError?.('Sélectionnez une main'); return; }
    try {
      await API.post(`/tontines/${tontineId}/contribute/`, {
        amount: parseFloat(contributeAmount),
        payment_method: contributeMethod,
        transaction_reference: contributeRef,
        participant_id: currentUserParticipant.id, // ✅ précise quelle main cotise
      });
      toast?.showSuccess?.("Contribution enregistrée ! En attente de validation par l'admin.");
      setShowContributeSheet(false);
      setContributeAmount('');
      setContributeRef('');
      loadDetail();
      loadMyContributions();
    } catch (error) {
      toast?.showError?.(error.response?.data?.error || 'Erreur contribution');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Supprimer la tontine "${tontine?.name}" ?\n\nCette action est irréversible !`)) return;
    try {
      await API.delete(`/tontines/${tontineId}/`);
      toast?.showSuccess?.('Tontine supprimée avec succès !');
      onNavigate?.('tontines');
    } catch (error) {
      toast?.showError?.(`Erreur : ${error.response?.data?.error || error.message}`);
    }
  };

  const formatFCFA = (value) => new Intl.NumberFormat('fr-FR').format(value || 0);
  const formatFull = (value) => formatFCFA(value) + ' FCFA';

  const getStatusConfig = (status) => {
    const configs = {
      planning:  { label: 'En préparation', emoji: '📋', badge: 'bg-blue-50 text-blue-600' },
      active:    { label: 'Active',         emoji: '🔥', badge: 'bg-green-50 text-green-600' },
      completed: { label: 'Terminée',       emoji: '✅', badge: 'bg-gray-100 text-gray-500' },
      cancelled: { label: 'Annulée',        emoji: '❌', badge: 'bg-red-50 text-red-500' },
    };
    return configs[status] || configs.planning;
  };

  const getContributionBadge = (status) => {
    switch (status) {
      case 'à_jour': return <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-bold rounded-full">✅ À jour</span>;
      case 'à_compléter': return <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-full">⏳ À compléter</span>;
      case 'en_retard': return <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-bold rounded-full">❌ En retard</span>;
      default: return null;
    }
  };

  const getPaymentDeadlineInfo = (t) => {
    if (t.status !== 'active' || !t.payment_day) return null;
    const now = new Date();
    const daysLeft = t.payment_day - now.getDate();
    if (daysLeft < 0) return { label: `Date limite dépassée ce mois (était le ${t.payment_day})`, style: 'bg-gray-50 text-gray-500' };
    if (daysLeft === 0) return { label: "⚠️ Aujourd'hui est la date limite !", style: 'bg-red-50 text-red-700' };
    if (daysLeft <= 2) return { label: `🚨 Plus que ${daysLeft} jour(s) pour contribuer !`, style: 'bg-red-50 text-red-700' };
    if (daysLeft <= 5) return { label: `⏰ ${daysLeft} jours restants avant la limite`, style: 'bg-orange-50 text-orange-700' };
    return { label: `📆 Limite : le ${t.payment_day} de chaque mois`, style: 'bg-blue-50 text-blue-700' };
  };

  // ✅ Charge "Mes paiements" dès l'arrivée sur la page (pas seulement
  // à l'ouverture du panneau) — sinon le badge de statut affiche
  // "En retard" par défaut le temps que l'utilisateur clique, avant
  // que les vraies données n'arrivent. Se recharge aussi au changement
  // de main. Calcule la main active localement (sans dépendre d'une
  // variable déclarée plus bas) pour respecter les Rules of Hooks —
  // ce useEffect doit rester avant tout "return" conditionnel.
  useEffect(() => {
    if (!tontine || !currentUser) return;
    const myHandsForEffect = tontine.participants?.filter(p => p.user?.id === currentUser?.id) || [];
    const activeHand = selectedHand || myHandsForEffect[0];
    if (activeHand) loadMyContributions();
  }, [tontine, currentUser, selectedHand]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!tontine) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">❌</div>
          <h2 className="text-lg font-bold text-gray-800 mb-2">Tontine introuvable</h2>
          <p className="text-sm text-gray-500 mb-6">Cette tontine n'existe pas ou vous n'y avez pas accès</p>
          <button
            onClick={() => onNavigate?.('tontines')}
            className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold"
          >
            ← Retour aux tontines
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(tontine.status);
  const progress = tontine.max_participants > 0 ? (tontine.current_participants / tontine.max_participants) * 100 : 0;

  // ✅ Toutes les mains de l'utilisateur dans cette tontine (peut être 1, 2, 3...)
  const myHands = tontine.participants?.filter(p => p.user?.id === currentUser?.id) || [];
  const currentUserParticipant = selectedHand || myHands[0];
  const isAdmin = myHands.some(h => h.is_admin) || tontine.creator?.id === currentUser?.id;
  const payoutAmount = (tontine.monthly_contribution || 0) * (tontine.max_participants || 0);
  const deadlineInfo = getPaymentDeadlineInfo(tontine);
  const paymentSummary = getPaymentSummary();
  const monthsTimeline = showMyPayments ? getMonthsTimeline() : [];

  return (
    <div className="min-h-screen bg-gray-50 pb-40">
      <div className="max-w-2xl mx-auto px-4 py-5">

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => onNavigate?.('tontines')}
            className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 flex-shrink-0"
          >
            ←
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-gray-900 truncate">{tontine.name}</h1>
            <p className="text-xs text-gray-400">{tontine.payout_mode === 'random' ? '🎲 Tirage aléatoire' : '📝 Ordre manuel'}</p>
          </div>
          <span className={`text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 ${statusConfig.badge}`}>
            {statusConfig.emoji} {statusConfig.label}
          </span>
        </div>

        {/* Carte résumé */}
        <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-3xl p-5 mb-4 text-white shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm opacity-80">Tu reçois à ton tour</p>
              <p className="text-2xl font-bold">{formatFull(payoutAmount)}</p>
            </div>
            <button
              onClick={() => { navigator.clipboard.writeText(tontine.invitation_code); toast?.showSuccess?.('Code copié !'); }}
              className="bg-black/20 rounded-2xl px-3 py-2 text-center"
            >
              <p className="text-[10px] opacity-75">Code</p>
              <p className="text-sm font-mono font-bold">{tontine.invitation_code}</p>
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-black/20 rounded-2xl px-3 py-2 text-center">
              <p className="text-[10px] opacity-75">Contribution</p>
              <p className="text-xs font-bold">{formatFCFA(tontine.monthly_contribution)}</p>
            </div>
            <div className="bg-black/20 rounded-2xl px-3 py-2 text-center">
              <p className="text-[10px] opacity-75">Participants</p>
              <p className="text-xs font-bold">{tontine.current_participants}/{tontine.max_participants}</p>
            </div>
            <div className="bg-black/20 rounded-2xl px-3 py-2 text-center">
              <p className="text-[10px] opacity-75">Durée</p>
              <p className="text-xs font-bold">{tontine.duration_months} mois</p>
            </div>
          </div>
          {deadlineInfo && (
            <div className="mt-3 bg-black/20 rounded-2xl px-3 py-2">
              <p className="text-xs font-medium">{deadlineInfo.label}</p>
            </div>
          )}
        </div>

        {tontine.description && (
          <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-4 shadow-sm">
            <p className="text-sm text-gray-600">{tontine.description}</p>
          </div>
        )}

        {/* ✅ Sélecteur de main — visible uniquement si plusieurs mains */}
        {myHands.length > 1 && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3 mb-4">
            <p className="text-[11px] text-indigo-600 font-semibold mb-2">
              Vous avez {myHands.length} mains dans cette tontine — laquelle voulez-vous suivre ?
            </p>
            <div className="flex gap-2 overflow-x-auto">
              {myHands.map(hand => (
                <button
                  key={hand.id}
                  onClick={() => setSelectedHand(hand)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    currentUserParticipant?.id === hand.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-indigo-600 border border-indigo-200'
                  }`}
                >
                  Main {hand.hand_number}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Mes paiements */}
        {tontine.status === 'active' && currentUserParticipant && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm mb-4">
            <button
              onClick={() => setShowMyPayments(!showMyPayments)}
              className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">💳</span>
                <div className="text-left">
                  <p className="text-sm font-bold text-gray-900">Mes paiements</p>
                  {contributionsLoaded && paymentSummary && (
                    <p className="text-xs text-gray-400">
                      {paymentSummary.confirmedCount}/{paymentSummary.monthsElapsed} mois payés
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!contributionsLoaded ? (
                  <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-400">
                    Chargement...
                  </span>
                ) : paymentSummary && (
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${paymentSummary.statusColor}`}>
                    {paymentSummary.statusLabel}
                  </span>
                )}
                <span className="text-gray-300 text-xs">{showMyPayments ? '▲' : '▼'}</span>
              </div>
            </button>

            {showMyPayments && (
              <div className="px-4 pb-4 border-t border-gray-100">
                {paymentSummary && (
                  <div className="grid grid-cols-3 gap-2 mt-3 mb-4">
                    <div className="bg-green-50 rounded-xl p-2.5 text-center">
                      <p className="text-lg font-bold text-green-700">{paymentSummary.confirmedCount}</p>
                      <p className="text-[10px] text-gray-500">Payés</p>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-2.5 text-center">
                      <p className="text-lg font-bold text-amber-700">{paymentSummary.pendingCount}</p>
                      <p className="text-[10px] text-gray-500">En attente</p>
                    </div>
                    <div className="bg-red-50 rounded-xl p-2.5 text-center">
                      <p className="text-lg font-bold text-red-700">{paymentSummary.missingMonths}</p>
                      <p className="text-[10px] text-gray-500">Manquants</p>
                    </div>
                  </div>
                )}

                {loadingContributions ? (
                  <div className="text-center py-6">
                    <div className="w-6 h-6 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {monthsTimeline.map((month, idx) => {
                      const c = month.contribution;
                      const isPaid = c?.status === 'confirmed';
                      const isPending = c?.status === 'pending';

                      return (
                        <div key={idx} className={`flex items-center justify-between p-3 rounded-xl ${
                          isPaid ? 'bg-green-50' : isPending ? 'bg-amber-50' :
                          month.isCurrentMonth ? 'bg-blue-50' : 'bg-red-50'
                        }`}>
                          <div className="flex items-center gap-2">
                            <span className="text-base">
                              {isPaid ? '✅' : isPending ? '⏳' : month.isCurrentMonth ? '📅' : '❌'}
                            </span>
                            <div>
                              <p className="text-xs font-semibold text-gray-900 capitalize">{month.monthName}</p>
                              {c && (
                                <p className="text-[10px] text-gray-400">
                                  {new Date(c.date).toLocaleDateString('fr-FR')} · {c.payment_method}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            {c ? (
                              <p className="text-xs font-bold text-gray-900">{formatFull(c.amount)}</p>
                            ) : (
                              <p className="text-[11px] font-semibold text-gray-500">
                                {month.isCurrentMonth ? 'À payer' : 'Non payé'}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {paymentSummary && paymentSummary.status !== 'à_jour' && (
                  <button
                    onClick={() => setShowContributeSheet(true)}
                    className="w-full mt-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-2xl font-bold text-sm shadow-md"
                  >
                    💰 Payer maintenant
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Progression */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold text-gray-900">Progression des participants</p>
            <span className="text-sm font-bold text-gray-900">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {tontine.available_spots > 0 ? `${tontine.available_spots} place(s) disponible(s)` : '✅ Tontine complète'}
          </p>
        </div>

        {/* Panneau Admin (composant existant, inchangé) */}
        {isAdmin && (
          <div className="mb-4">
            <TontineAdminPanel
              tontine={tontine}
              participants={tontine.participants || []}
              onUpdate={loadDetail}
              toast={toast}
            />
          </div>
        )}

        <div className="mb-4">
          <TontineTimeline tontineId={tontine.id} isAdmin={isAdmin} onUpdate={loadDetail} />
        </div>
        <div className="mb-4">
          <TontineActivityFeed tontineId={tontine.id} />
        </div>

        {/* Zone de danger */}
        {tontine.creator && tontine.status === 'planning' && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4">
            <p className="text-sm font-bold text-red-900 mb-1">⚠️ Zone de danger</p>
            <p className="text-xs text-red-600 mb-3">
              Suppression irréversible, possible uniquement en phase de planification sans contributions.
            </p>
            <button
              onClick={handleDelete}
              className="text-xs font-bold px-4 py-2 bg-red-600 text-white rounded-xl"
            >
              🗑️ Supprimer cette tontine
            </button>
          </div>
        )}

        {/* Participants */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-4 pt-4 pb-2">
            <h2 className="text-sm font-bold text-gray-900">
              👥 Participants ({tontine.participants?.length || 0})
            </h2>
          </div>
          {!tontine.participants || tontine.participants.length === 0 ? (
            <div className="text-center py-8 px-4">
              <div className="text-3xl mb-2">👤</div>
              <p className="text-sm text-gray-400">Aucun participant pour le moment</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {tontine.participants.map((participant, index) => (
                <div key={participant.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {participant.user?.first_name} {participant.user?.last_name}
                      {participant.hand_number > 1 && (
                        <span className="ml-1 text-[10px] text-indigo-500 font-bold">· Main {participant.hand_number}</span>
                      )}
                      {participant.user?.id === currentUser?.id && (
                        <span className="ml-1 text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded-full">Vous</span>
                      )}
                    </p>
                    <p className="text-[11px] text-gray-400">@{participant.user?.username}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    {participant.is_admin && (
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-full">👑 Admin</span>
                    )}
                    {participant.received_payout && (
                      <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-bold rounded-full">💰 Payé</span>
                    )}
                    {tontine.status === 'active' && getContributionBadge(participant.contribution_status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Bouton contribuer flottant — masqué si un bottom-sheet est déjà ouvert */}
      {tontine.status === 'active' && !showContributeSheet && (
        <div className="fixed bottom-24 left-0 right-0 px-4 z-30">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => setShowContributeSheet(true)}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 rounded-2xl font-bold shadow-2xl"
            >
              💰 Contribuer à cette tontine
            </button>
          </div>
        </div>
      )}

      {/* Bottom sheet — Contribution */}
      {showContributeSheet && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowContributeSheet(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto animate-slide-up">
            <div className="sticky top-0 bg-white pt-3 pb-2 px-5 border-b border-gray-100">
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-3" />
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-900">💰 Nouvelle contribution</h2>
                <button onClick={() => setShowContributeSheet(false)} className="text-gray-400 text-xl">✕</button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {deadlineInfo && (
                <div className={`rounded-2xl px-3 py-2 ${deadlineInfo.style}`}>
                  <p className="text-xs font-medium">{deadlineInfo.label}</p>
                </div>
              )}

              {paymentSummary && (
                <div className="bg-blue-50 rounded-2xl px-3 py-2">
                  <p className="text-xs text-blue-800 font-medium">
                    📅 Ce paiement concernera :{' '}
                    <strong className="capitalize">
                      {(() => {
                        const start = new Date(tontine.start_date);
                        const nextMonth = new Date(start.getFullYear(), start.getMonth() + paymentSummary.confirmedCount + paymentSummary.pendingCount, 1);
                        return nextMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
                      })()}
                    </strong>
                  </p>
                </div>
              )}

              <p className="text-xs text-gray-400">
                Votre contribution sera examinée par l'administrateur avant validation.
              </p>

              <div>
                <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Montant</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={contributeAmount}
                  onChange={(e) => setContributeAmount(e.target.value)}
                  placeholder={`Ex: ${formatFCFA(tontine.monthly_contribution)}`}
                  autoFocus
                  className="w-full mt-1 px-4 py-3 bg-gray-50 rounded-2xl text-lg font-bold outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Méthode de paiement</label>
                <select
                  value={contributeMethod}
                  onChange={(e) => setContributeMethod(e.target.value)}
                  className="w-full mt-1 px-3 py-3 bg-gray-50 rounded-2xl text-sm outline-none"
                >
                  <option value="virement">Virement bancaire</option>
                  <option value="wave">Wave</option>
                  <option value="orange_money">Orange Money</option>
                  <option value="free_money">Free Money</option>
                  <option value="cash">Espèces</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Référence (optionnel)</label>
                <input
                  type="text"
                  value={contributeRef}
                  onChange={(e) => setContributeRef(e.target.value)}
                  placeholder="Ex: TXN-2026-001"
                  className="w-full mt-1 px-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none"
                />
              </div>
            </div>

            <div className="p-4 pb-6">
              <button
                onClick={handleContribute}
                className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl font-bold shadow-lg"
              >
                Envoyer
              </button>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.25s ease-out; }
      `}</style>
    </div>
  );
};

export default TontineDetail;
