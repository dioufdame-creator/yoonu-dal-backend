import React, { useState, useEffect } from 'react';
import API from '../../services/api';

const TontinesListPremium = ({ onNavigate, toast, pageParams }) => {
  const [tontines, setTontines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [showJoinSheet, setShowJoinSheet] = useState(false);
  const [editingTontine, setEditingTontine] = useState(null);
  const [joinCode, setJoinCode] = useState('');

  const emptyForm = () => ({
    name: '',
    description: '',
    monthly_contribution: '',
    max_participants: '',
    start_date: new Date().toISOString().split('T')[0],
    payout_mode: 'manual',
    payment_day: 5,
  });
  const [form, setForm] = useState(emptyForm());

  // ✅ durée = nombre de participants
  const calculatedTotal = React.useMemo(() => {
    const contribution = parseFloat(form.monthly_contribution) || 0;
    const participants = parseInt(form.max_participants) || 0;
    return contribution * participants * participants;
  }, [form.monthly_contribution, form.max_participants]);

  const calculatedPayout = React.useMemo(() => {
    const contribution = parseFloat(form.monthly_contribution) || 0;
    const participants = parseInt(form.max_participants) || 0;
    return contribution * participants;
  }, [form.monthly_contribution, form.max_participants]);

  useEffect(() => { loadTontines(); }, []);

  useEffect(() => {
    if (pageParams?.openCreate) setShowCreateSheet(true);
  }, [pageParams]);

  const loadTontines = async () => {
    setLoading(true);
    try {
      const response = await API.get('/tontines/');
      setTontines(Array.isArray(response.data) ? response.data : []);
    } catch {
      toast?.showError?.('Erreur chargement tontines');
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: tontines.length,
    active: tontines.filter(t => t.status === 'active').length,
    planning: tontines.filter(t => t.status === 'planning').length,
    completed: tontines.filter(t => t.status === 'completed').length,
    totalAmount: tontines.reduce((sum, t) => sum + ((t.monthly_contribution || 0) * (t.max_participants || 0)), 0),
  };

  const filteredTontines = tontines.filter(t => {
    const matchFilter = filter === 'all' || t.status === filter;
    const matchSearch = t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       t.invitation_code?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchFilter && matchSearch;
  });

  const formatShort = (value) => {
    const num = Math.abs(value || 0);
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${Math.round(num / 1000)}k`;
    return num.toString();
  };

  const formatFull = (amount) =>
    new Intl.NumberFormat('fr-FR').format(amount || 0) + ' FCFA';

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getPayoutAmount = (tontine) =>
    (tontine.monthly_contribution || 0) * (tontine.max_participants || 0);

  const getPaymentUrgency = (tontine) => {
    if (tontine.status !== 'active' || !tontine.payment_day) return null;
    const now = new Date();
    const daysLeft = tontine.payment_day - now.getDate();
    if (daysLeft < 0) return null;
    if (daysLeft <= 2) return { label: `⚠️ Limite dans ${daysLeft}j`, color: 'text-red-600' };
    if (daysLeft <= 5) return { label: `⏰ Limite dans ${daysLeft}j`, color: 'text-orange-600' };
    return null;
  };

  const getStatusConfig = (status) => {
    const configs = {
      planning:  { label: 'En préparation', icon: '📋', badge: 'bg-blue-50 text-blue-600' },
      active:    { label: 'Active',         icon: '🔥', badge: 'bg-green-50 text-green-600' },
      completed: { label: 'Terminée',       icon: '✅', badge: 'bg-gray-100 text-gray-500' },
    };
    return configs[status] || configs.planning;
  };

  const handleShareWhatsApp = (tontine) => {
    const inviteUrl = `https://yoonudal.com/join/${tontine.invitation_code}`;
    const payoutMode = tontine.payout_mode === 'random' ? '🎲 Tirage aléatoire' : '📝 Ordre manuel';
    const payoutAmount = getPayoutAmount(tontine);
    const message = `🦁 *${tontine.name}* — Tontine Yoonu Dal${tontine.description ? '\n\n' + tontine.description : ''}

👥 Participants : ${tontine.current_participants}/${tontine.max_participants} (${tontine.available_spots} place(s) restante(s))
💰 Contribution : *${formatFull(tontine.monthly_contribution)}/mois*
🎯 Tu reçois à ton tour : *${formatFull(payoutAmount)}*
📅 Durée : ${tontine.duration_months} mois
📆 Paiement avant le : ${tontine.payment_day} de chaque mois
${payoutMode}

🔑 Code d'invitation : *${tontine.invitation_code}*

👉 Rejoins directement : ${inviteUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleSubmit = async () => {
    if (!form.name || !form.monthly_contribution || !form.max_participants) {
      toast?.showError?.('Remplis tous les champs obligatoires'); return;
    }
    if (parseInt(form.max_participants) < 2) { toast?.showError?.('Minimum 2 participants requis'); return; }
    if (parseFloat(form.monthly_contribution) <= 0) { toast?.showError?.('La contribution mensuelle doit être supérieure à 0'); return; }
    const payDay = parseInt(form.payment_day);
    if (!payDay || payDay < 1 || payDay > 28) { toast?.showError?.('Jour de paiement invalide (1-28)'); return; }

    const participants = parseInt(form.max_participants);

    try {
      const payload = {
        name: form.name,
        description: form.description,
        total_amount: calculatedTotal,
        monthly_contribution: parseFloat(form.monthly_contribution),
        max_participants: participants,
        duration_months: participants,
        start_date: form.start_date,
        payout_mode: form.payout_mode || 'manual',
        payment_day: payDay,
      };
      if (editingTontine) {
        await API.patch(`/tontines/${editingTontine.id}/`, payload);
        toast?.showSuccess?.('Tontine modifiée avec succès');
      } else {
        await API.post('/tontines/', payload);
        toast?.showSuccess?.('Tontine créée avec succès');
      }
      setShowCreateSheet(false); setEditingTontine(null); setForm(emptyForm()); loadTontines();
    } catch (error) {
      toast?.showError?.(error.response?.data?.error || 'Erreur lors de l\'enregistrement');
    }
  };

  const handleJoinTontine = async () => {
    if (!joinCode) { toast?.showError?.('Entre le code d\'invitation'); return; }
    try {
      await API.post('/tontines/join/', { invitation_code: joinCode });
      toast?.showSuccess?.('Tu as rejoint la tontine !');
      setShowJoinSheet(false); setJoinCode(''); loadTontines();
    } catch (error) {
      toast?.showError?.(error.response?.data?.error || 'Code invalide ou tontine complète');
    }
  };

  const handleEdit = (tontine) => {
    setEditingTontine(tontine);
    setForm({
      name: tontine.name,
      description: tontine.description || '',
      monthly_contribution: tontine.monthly_contribution,
      max_participants: tontine.max_participants,
      start_date: tontine.start_date || new Date().toISOString().split('T')[0],
      payout_mode: tontine.payout_mode || 'manual',
      payment_day: tontine.payment_day || 5,
    });
    setShowCreateSheet(true);
  };

  const handleActivate = async (tontineId) => {
    try {
      await API.post(`/tontines/${tontineId}/activate/`);
      toast?.showSuccess?.('Tontine activée !');
      loadTontines();
    } catch (error) {
      toast?.showError?.(error.response?.data?.error || 'Erreur activation');
    }
  };

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
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900">🤝 Tontines</h1>
            <p className="text-xs text-gray-400">Épargne collective</p>
          </div>
          <button
            onClick={() => setShowJoinSheet(true)}
            className="h-10 px-3 rounded-full bg-white border border-gray-200 flex items-center gap-1.5 text-xs font-bold text-gray-700 flex-shrink-0"
          >
            <span className="text-base">🔑</span> Rejoindre
          </button>
          <button
            onClick={() => { setEditingTontine(null); setForm(emptyForm()); setShowCreateSheet(true); }}
            className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center text-xl font-bold flex-shrink-0 shadow-md"
          >
            +
          </button>
        </div>

        {/* Résumé */}
        <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-3xl p-5 mb-4 text-white shadow-xl">
          <p className="text-sm opacity-80 mb-1">Total en circulation</p>
          <p className="text-3xl font-bold mb-3">{formatFull(stats.totalAmount)}</p>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-black/20 rounded-2xl px-3 py-2.5 text-center">
              <p className="text-[11px] opacity-75">Actives</p>
              <p className="text-sm font-bold">{stats.active}</p>
            </div>
            <div className="bg-black/20 rounded-2xl px-3 py-2.5 text-center">
              <p className="text-[11px] opacity-75">Préparation</p>
              <p className="text-sm font-bold">{stats.planning}</p>
            </div>
            <div className="bg-black/20 rounded-2xl px-3 py-2.5 text-center">
              <p className="text-[11px] opacity-75">Terminées</p>
              <p className="text-sm font-bold">{stats.completed}</p>
            </div>
          </div>
        </div>

        {/* Recherche */}
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="🔍 Rechercher par nom ou code..."
          className="w-full mb-3 px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-green-500"
        />

        {/* Filtres */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {[
            { id: 'all', label: `Toutes (${stats.total})` },
            { id: 'active', label: `Actives (${stats.active})` },
            { id: 'planning', label: `Préparation (${stats.planning})` },
            { id: 'completed', label: `Terminées (${stats.completed})` },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                filter === f.id ? 'bg-green-600 text-white shadow-sm' : 'bg-white text-gray-500 border border-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Liste */}
        {filteredTontines.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-sm">
            <div className="text-4xl mb-3">🤝</div>
            <p className="text-sm text-gray-500 mb-4">
              {searchTerm || filter !== 'all' ? 'Aucun résultat' : 'Aucune tontine pour l\'instant'}
            </p>
            {!searchTerm && filter === 'all' && (
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => { setEditingTontine(null); setForm(emptyForm()); setShowCreateSheet(true); }}
                  className="text-sm bg-green-600 text-white px-4 py-2 rounded-xl font-semibold"
                >
                  + Créer une tontine
                </button>
                <button
                  onClick={() => setShowJoinSheet(true)}
                  className="text-sm bg-gray-100 text-gray-700 px-4 py-2 rounded-xl font-semibold"
                >
                  🔑 Rejoindre
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTontines.map(tontine => {
              const statusConfig = getStatusConfig(tontine.status);
              const urgency = getPaymentUrgency(tontine);
              const payoutAmount = getPayoutAmount(tontine);

              return (
                <div key={tontine.id} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                  <button
                    onClick={() => onNavigate('tontine-detail', { id: tontine.id })}
                    className="w-full text-left"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-lg flex-shrink-0">
                          🦁
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">{tontine.name}</p>
                          <p className="text-xs text-gray-400">
                            {tontine.current_participants}/{tontine.max_participants} participants
                          </p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 ${statusConfig.badge}`}>
                        {statusConfig.icon} {statusConfig.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div className="bg-gray-50 rounded-xl px-3 py-2">
                        <p className="text-[10px] text-gray-400">Contribution</p>
                        <p className="text-sm font-bold text-gray-800">{formatShort(tontine.monthly_contribution)}/mois</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl px-3 py-2">
                        <p className="text-[10px] text-gray-400">Tu recevras</p>
                        <p className="text-sm font-bold text-green-600">{formatShort(payoutAmount)}</p>
                      </div>
                    </div>

                    {urgency && (
                      <p className={`text-xs font-semibold mb-2 ${urgency.color}`}>{urgency.label}</p>
                    )}
                  </button>

                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    {tontine.status === 'planning' && tontine.is_admin && (
                      <button
                        onClick={() => handleActivate(tontine.id)}
                        className="flex-1 text-xs font-bold py-2 rounded-xl bg-green-50 text-green-700"
                      >
                        🔥 Activer
                      </button>
                    )}
                    <button
                      onClick={() => handleShareWhatsApp(tontine)}
                      className="flex-1 text-xs font-bold py-2 rounded-xl bg-emerald-50 text-emerald-700"
                    >
                      📤 Partager sur WhatsApp
                    </button>
                    {tontine.is_admin && (
                      <button
                        onClick={() => handleEdit(tontine)}
                        className="text-xs font-bold py-2 px-3 rounded-xl bg-gray-50 text-gray-600"
                      >
                        ✏️ Modifier
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── BOTTOM SHEET — Créer / Modifier ── */}
      {showCreateSheet && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowCreateSheet(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[88vh] overflow-y-auto animate-slide-up">
            <div className="sticky top-0 bg-white pt-3 pb-2 px-5 border-b border-gray-100">
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-3" />
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-900">
                  {editingTontine ? '✏️ Modifier la tontine' : '🤝 Nouvelle tontine'}
                </h2>
                <button onClick={() => setShowCreateSheet(false)} className="text-gray-400 text-xl">✕</button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Nom</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Tontine des collègues"
                  className="w-full mt-1 px-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Contribution/mois</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={form.monthly_contribution}
                    onChange={(e) => setForm({ ...form, monthly_contribution: e.target.value })}
                    placeholder="0"
                    className="w-full mt-1 px-4 py-3 bg-gray-50 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Participants</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={form.max_participants}
                    onChange={(e) => setForm({ ...form, max_participants: e.target.value })}
                    placeholder="Ex: 10"
                    className="w-full mt-1 px-4 py-3 bg-gray-50 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              {calculatedTotal > 0 && (
                <div className="bg-indigo-50 rounded-2xl p-3 text-center">
                  <p className="text-xs text-indigo-600">
                    Chaque participant recevra <strong>{formatFull(calculatedPayout)}</strong> à son tour
                  </p>
                  <p className="text-[11px] text-indigo-400 mt-0.5">
                    Durée totale : {form.max_participants || 0} mois
                  </p>
                </div>
              )}

              <div>
                <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Date de début</label>
                <input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  className="w-full mt-1 px-3 py-3 bg-gray-50 rounded-2xl text-sm outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Jour limite de paiement</label>
                <input
                  type="number"
                  min="1"
                  max="28"
                  value={form.payment_day}
                  onChange={(e) => setForm({ ...form, payment_day: Math.min(28, Math.max(1, parseInt(e.target.value) || 1)) })}
                  className="w-full mt-1 px-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2 block">Mode de tirage</label>
                <div className="flex gap-2 bg-gray-50 rounded-2xl p-1">
                  <button
                    onClick={() => setForm({ ...form, payout_mode: 'manual' })}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                      form.payout_mode === 'manual' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-400'
                    }`}
                  >
                    📝 Ordre manuel
                  </button>
                  <button
                    onClick={() => setForm({ ...form, payout_mode: 'random' })}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                      form.payout_mode === 'random' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-400'
                    }`}
                  >
                    🎲 Tirage aléatoire
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  placeholder="Optionnel"
                  className="w-full mt-1 px-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none resize-none"
                />
              </div>
            </div>

            <div className="p-4 pb-6">
              <button
                onClick={handleSubmit}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-2xl font-bold shadow-lg"
              >
                {editingTontine ? 'Enregistrer' : 'Créer la tontine'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── BOTTOM SHEET — Rejoindre ── */}
      {showJoinSheet && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowJoinSheet(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl animate-slide-up">
            <div className="pt-3 pb-2 px-5 border-b border-gray-100">
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-3" />
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-900">🔑 Rejoindre une tontine</h2>
                <button onClick={() => setShowJoinSheet(false)} className="text-gray-400 text-xl">✕</button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Code d'invitation</label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Ex: ABC12345"
                  autoFocus
                  className="w-full mt-1 px-4 py-3 bg-gray-50 rounded-2xl text-lg font-bold text-center tracking-widest outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="p-4 pb-6">
              <button
                onClick={handleJoinTontine}
                className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl font-bold shadow-lg"
              >
                Rejoindre
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

export default TontinesListPremium;
