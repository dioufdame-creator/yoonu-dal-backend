// src/components/pockets/PocketsPage.jsx
// "Mes poches" — vue d'ensemble du patrimoine + transferts
import React, { useState, useEffect } from 'react';
import API from '../../services/api';

const ACCOUNT_ICONS = {
  disponible: '💰',
  epargne_securite: '🛡️',
  personnalise: '💼',
};

// ✅ Le backend nomme le compte "Disponible" — on l'affiche "Trésorerie"
// pour ne pas entrer en collision avec le "Disponible/jour" du budget mensuel
const displayName = (account) =>
  account.account_type === 'disponible' ? 'Trésorerie' : account.name;

const PocketsPage = ({ onNavigate, toast, pageParams }) => {
  const [accounts, setAccounts] = useState([]);
  const [goals, setGoals] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [showTransferSheet, setShowTransferSheet] = useState(false);
  const [showCreateSheet, setShowCreateSheet] = useState(false);

  const [transferForm, setTransferForm] = useState({
    source_type: '', source_id: '',
    destination_type: '', destination_id: '',
    amount: '', note: '',
  });

  const [createForm, setCreateForm] = useState({ name: '', account_type: 'personnalise', icon: '💼' });

  const [showAdjustSheet, setShowAdjustSheet] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState(null); // {type, id, name, balance}
  const [adjustNewBalance, setAdjustNewBalance] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  const [showAllocateSheet, setShowAllocateSheet] = useState(false);
  const [allocateAmount, setAllocateAmount] = useState('');
  const [allocateMode, setAllocateMode] = useState('envelopes'); // 'envelopes' | 'manual'
  const [manualAllocation, setManualAllocation] = useState({
    essentiels: '', plaisirs: '', projets: '', liberation: ''
  });

  const formatFCFA = (v) => new Intl.NumberFormat('fr-FR').format(Math.round(v || 0));

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await API.get('/pockets/');
      setAccounts(res.data?.accounts || []);
      setGoals(res.data?.goals || []);
      setTotal(res.data?.patrimoine_total || 0);
    } catch {
      toast?.showError?.('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const hasEpargneSecurite = accounts.some(a => a.account_type === 'epargne_securite');

  // Toutes les entités transférables (poches + objectifs), pour les sélecteurs
  const allEntities = [
    ...accounts.map(a => ({ type: 'account', id: a.id, name: displayName(a), icon: a.icon, balance: a.balance })),
    ...goals.map(g => ({ type: 'goal', id: g.id, name: g.title, icon: '🎯', balance: g.current_amount })),
  ];

  const openTransfer = (sourceEntity = null, destinationEntity = null) => {
    setTransferForm({
      source_type: sourceEntity?.type || '',
      source_id: sourceEntity?.id || '',
      destination_type: destinationEntity?.type || '',
      destination_id: destinationEntity?.id || '',
      amount: '', note: '',
    });
    setShowTransferSheet(true);
  };

  // ✅ Ouverture directe avec objectif pré-rempli — depuis "Ajouter à mon objectif"
  useEffect(() => {
    if (pageParams?.preselectDestinationGoalId && goals.length > 0) {
      openTransfer(null, { type: 'goal', id: pageParams.preselectDestinationGoalId });
    }
  }, [pageParams, goals]);

  const handleTransfer = async () => {
    const { source_type, source_id, destination_type, destination_id, amount } = transferForm;
    if (!source_type || !source_id || !destination_type || !destination_id || !amount) {
      toast?.showError?.('Tous les champs sont requis');
      return;
    }
    if (source_type === destination_type && source_id === destination_id) {
      toast?.showError?.('La source et la destination doivent être différentes');
      return;
    }
    try {
      await API.post('/pockets/transfer/', {
        ...transferForm,
        amount: parseFloat(amount),
      });
      toast?.showSuccess?.('Transfert effectué !');
      setShowTransferSheet(false);
      load();
    } catch (error) {
      toast?.showError?.(error.response?.data?.error || 'Erreur lors du transfert');
    }
  };

  const disponibleAccount = accounts.find(a => a.account_type === 'disponible');

  const manualTotal = Object.values(manualAllocation).reduce((s, v) => s + (parseFloat(v) || 0), 0);
  const manualDiff = allocateAmount ? parseFloat(allocateAmount) - manualTotal : 0;

  const handleAllocate = async () => {
    const amount = parseFloat(allocateAmount);
    if (!amount || amount <= 0) {
      toast?.showError?.('Montant invalide');
      return;
    }
    if (disponibleAccount && amount > disponibleAccount.balance) {
      toast?.showError?.('Solde insuffisant dans votre trésorerie');
      return;
    }

    const payload = { amount, allocation: allocateMode };
    if (allocateMode === 'manual') {
      if (Math.abs(manualDiff) >= 1) {
        toast?.showError?.('Le total réparti doit égaler le montant à affecter');
        return;
      }
      payload.manual_amounts = {
        essentiels: parseFloat(manualAllocation.essentiels) || 0,
        plaisirs: parseFloat(manualAllocation.plaisirs) || 0,
        projets: parseFloat(manualAllocation.projets) || 0,
        liberation: parseFloat(manualAllocation.liberation) || 0,
      };
    }

    try {
      await API.post('/pockets/allocate-to-budget/', payload);
      toast?.showSuccess?.('Montant affecté au budget du mois !');
      setShowAllocateSheet(false);
      setAllocateAmount('');
      setManualAllocation({ essentiels: '', plaisirs: '', projets: '', liberation: '' });
      load();
    } catch (error) {
      toast?.showError?.(error.response?.data?.error || 'Erreur lors de l\'affectation');
    }
  };

  const openAdjust = (target) => {
    setAdjustTarget(target);
    setAdjustNewBalance(String(target.balance));
    setAdjustReason('');
    setShowAdjustSheet(true);
  };

  const handleAdjust = async () => {
    const newBalance = parseFloat(adjustNewBalance);
    if (isNaN(newBalance) || newBalance < 0) {
      toast?.showError?.('Montant invalide');
      return;
    }
    try {
      await API.post('/pockets/adjust/', {
        target_type: adjustTarget.type,
        target_id: adjustTarget.id,
        new_balance: newBalance,
        reason: adjustReason || 'Ajustement manuel',
      });
      toast?.showSuccess?.('Solde ajusté !');
      setShowAdjustSheet(false);
      load();
    } catch (error) {
      toast?.showError?.(error.response?.data?.error || 'Erreur lors de l\'ajustement');
    }
  };

  const handleCreatePocket = async () => {
    if (!createForm.name) {
      toast?.showError?.('Nom requis');
      return;
    }
    try {
      await API.post('/pockets/create/', createForm);
      toast?.showSuccess?.('Poche créée !');
      setShowCreateSheet(false);
      setCreateForm({ name: '', account_type: 'personnalise', icon: '💼' });
      load();
    } catch (error) {
      toast?.showError?.(error.response?.data?.error || 'Erreur lors de la création');
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
            onClick={() => onNavigate?.('profile-hub')}
            className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 flex-shrink-0"
          >
            ←
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900">💼 Mes poches</h1>
            <p className="text-xs text-gray-400">Où est mon argent ?</p>
          </div>
        </div>

        {/* Patrimoine total */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 mb-4 text-white shadow-xl">
          <p className="text-sm opacity-80 mb-1">Patrimoine total</p>
          <p className="text-4xl font-bold">{formatFCFA(total)} <span className="text-lg font-normal opacity-70">FCFA</span></p>
          <p className="text-xs opacity-70 mt-2">Toutes vos poches et objectifs réunis</p>
        </div>

        {/* Bouton transfert rapide */}
        <button
          onClick={() => openTransfer()}
          className="w-full mb-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-gray-700 shadow-sm flex items-center justify-center gap-2"
        >
          <span>🔄</span> Faire un transfert
        </button>

        {/* Comptes / Poches */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2 px-1">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide">Mes poches</h2>
            <button
              onClick={() => setShowCreateSheet(true)}
              className="text-xs text-green-600 font-semibold"
            >
              + Ajouter
            </button>
          </div>

          <div className="space-y-2">
            {accounts.map(acc => {
              const isDisponible = acc.account_type === 'disponible';
              return (
                <div key={acc.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="w-full p-4 flex items-center gap-3">
                    <button
                      onClick={() => openTransfer({ type: 'account', id: acc.id })}
                      className="flex items-center gap-3 flex-1 min-w-0 text-left hover:opacity-70 transition-opacity"
                    >
                      <div className="w-11 h-11 bg-gray-50 rounded-2xl flex items-center justify-center text-xl flex-shrink-0">
                        {acc.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{displayName(acc)}</p>
                        <p className="text-xs text-gray-400">
                          {isDisponible ? 'Argent que vous détenez, hors budget du mois' :
                           acc.account_type === 'epargne_securite' ? 'Réserve de sécurité' : 'Poche personnalisée'}
                        </p>
                      </div>
                    </button>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <p className="text-base font-bold text-gray-900">{formatFCFA(acc.balance)}</p>
                      <button
                        onClick={() => openAdjust({ type: 'account', id: acc.id, name: displayName(acc), balance: acc.balance })}
                        className="text-gray-300 hover:text-gray-500 text-sm p-1"
                        title="Ajuster le solde"
                      >
                        ✏️
                      </button>
                    </div>
                  </div>

                  {isDisponible && acc.balance > 0 && (
                    <button
                      onClick={() => setShowAllocateSheet(true)}
                      className="w-full px-4 py-2.5 bg-indigo-50 text-indigo-700 text-xs font-bold border-t border-indigo-100 hover:bg-indigo-100 transition-all"
                    >
                      💼 Affecter au budget du mois
                    </button>
                  )}
                </div>
              );
            })}

            {!hasEpargneSecurite && (
              <button
                onClick={() => { setCreateForm({ name: 'Épargne de sécurité', account_type: 'epargne_securite', icon: '🛡️' }); setShowCreateSheet(true); }}
                className="w-full border-2 border-dashed border-gray-200 rounded-2xl p-4 text-sm text-gray-400 hover:border-green-300 hover:text-green-600 transition-all"
              >
                🛡️ + Créer mon Épargne de sécurité
              </button>
            )}
          </div>
        </div>

        {/* Objectifs */}
        {goals.length > 0 && (
          <div className="mb-4">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 px-1">Mes objectifs</h2>
            <div className="space-y-2">
              {goals.map(g => {
                const pct = g.progress_percentage || 0;
                return (
                  <div key={g.id} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm hover:border-green-300 transition-all">
                    <div className="flex items-center gap-3 mb-2">
                      <button
                        onClick={() => openTransfer({ type: 'goal', id: g.id })}
                        className="flex items-center gap-3 flex-1 min-w-0 text-left"
                      >
                        <div className="w-11 h-11 bg-gray-50 rounded-2xl flex items-center justify-center text-xl flex-shrink-0">🎯</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">{g.title}</p>
                          <p className="text-xs text-gray-400">{formatFCFA(g.current_amount)} / {formatFCFA(g.target_amount)} FCFA</p>
                        </div>
                      </button>
                      <p className="text-xs font-bold text-green-600 flex-shrink-0">{pct.toFixed(0)}%</p>
                      <button
                        onClick={() => openAdjust({ type: 'goal', id: g.id, name: g.title, balance: g.current_amount })}
                        className="text-gray-300 hover:text-gray-500 text-sm p-1 flex-shrink-0"
                        title="Ajuster le solde"
                      >
                        ✏️
                      </button>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full transition-all duration-700" style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <p className="text-xs text-blue-800 leading-relaxed">
            💡 <strong>Vos poches ≠ votre budget du mois.</strong> Vos poches montrent
            tout l'argent que vous possédez, en permanence. Le "reste du mois" sur
            l'accueil montre uniquement ce que vous pouvez encore dépenser dans le
            cadre du budget de ce mois. Déplacer de l'argent entre vos poches ne
            change jamais ce budget — c'est juste votre argent qui change de place.
          </p>
        </div>

      </div>

      {/* Bottom sheet — Transfert */}
      {showTransferSheet && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowTransferSheet(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl animate-slide-up max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-white pt-3 pb-2 px-5 border-b border-gray-100">
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-3" />
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-900">🔄 Transfert</h2>
                <button onClick={() => setShowTransferSheet(false)} className="text-gray-400 text-xl">✕</button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Depuis</label>
                <select
                  value={`${transferForm.source_type}:${transferForm.source_id}`}
                  onChange={(e) => {
                    const [type, id] = e.target.value.split(':');
                    setTransferForm({ ...transferForm, source_type: type, source_id: id });
                  }}
                  className="w-full mt-1 px-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none"
                >
                  <option value=":">Choisir une poche...</option>
                  {allEntities.map(e => (
                    <option key={`${e.type}-${e.id}`} value={`${e.type}:${e.id}`}>
                      {e.icon} {e.name} ({formatFCFA(e.balance)} FCFA)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-center">
                <span className="text-xl">⬇️</span>
              </div>

              <div>
                <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Vers</label>
                <select
                  value={`${transferForm.destination_type}:${transferForm.destination_id}`}
                  onChange={(e) => {
                    const [type, id] = e.target.value.split(':');
                    setTransferForm({ ...transferForm, destination_type: type, destination_id: id });
                  }}
                  className="w-full mt-1 px-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none"
                >
                  <option value=":">Choisir une poche...</option>
                  {allEntities.map(e => (
                    <option key={`${e.type}-${e.id}`} value={`${e.type}:${e.id}`}>
                      {e.icon} {e.name} ({formatFCFA(e.balance)} FCFA)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Montant</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={transferForm.amount}
                  onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
                  placeholder="0"
                  className="w-full mt-1 px-4 py-3 bg-gray-50 rounded-2xl text-lg font-bold outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Note (optionnel)</label>
                <input
                  type="text"
                  value={transferForm.note}
                  onChange={(e) => setTransferForm({ ...transferForm, note: e.target.value })}
                  placeholder="Ex: Pour le mariage"
                  className="w-full mt-1 px-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none"
                />
              </div>
            </div>

            <div className="p-4 pb-6">
              <button
                onClick={handleTransfer}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-2xl font-bold shadow-lg"
              >
                Effectuer le transfert
              </button>
            </div>
          </div>
        </>
      )}

      {/* Bottom sheet — Affecter au budget du mois */}
      {showAllocateSheet && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowAllocateSheet(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl animate-slide-up max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-white pt-3 pb-2 px-5 border-b border-gray-100">
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-3" />
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-900">💼 Affecter au budget</h2>
                <button onClick={() => setShowAllocateSheet(false)} className="text-gray-400 text-xl">✕</button>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Trésorerie disponible : {formatFCFA(disponibleAccount?.balance)} FCFA
              </p>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Montant à affecter</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={allocateAmount}
                  onChange={(e) => setAllocateAmount(e.target.value)}
                  placeholder="0"
                  autoFocus
                  className="w-full mt-1 px-4 py-3 bg-gray-50 rounded-2xl text-lg font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2 block">
                  Comment répartir ?
                </label>
                <div className="flex gap-2 bg-gray-50 rounded-2xl p-1">
                  <button
                    onClick={() => setAllocateMode('envelopes')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                      allocateMode === 'envelopes' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'
                    }`}
                  >
                    Selon mes enveloppes
                  </button>
                  <button
                    onClick={() => setAllocateMode('manual')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                      allocateMode === 'manual' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'
                    }`}
                  >
                    Je choisis moi-même
                  </button>
                </div>
              </div>

              {allocateMode === 'manual' && (
                <div className="space-y-3 bg-gray-50 rounded-2xl p-4">
                  {[
                    { key: 'essentiels', label: 'Essentiels', icon: '🏠' },
                    { key: 'plaisirs', label: 'Plaisirs', icon: '🎉' },
                    { key: 'projets', label: 'Projets', icon: '🎯' },
                    { key: 'liberation', label: 'Libération', icon: '🕊️' },
                  ].map(env => (
                    <div key={env.key} className="flex items-center gap-3">
                      <span className="text-lg w-7">{env.icon}</span>
                      <span className="text-sm text-gray-700 flex-1">{env.label}</span>
                      <input
                        type="number"
                        inputMode="numeric"
                        value={manualAllocation[env.key]}
                        onChange={(e) => setManualAllocation(prev => ({ ...prev, [env.key]: e.target.value }))}
                        placeholder="0"
                        className="w-24 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-right outline-none focus:border-indigo-500"
                      />
                    </div>
                  ))}
                  {allocateAmount && (
                    <p className={`text-xs font-semibold text-center pt-1 ${
                      Math.abs(manualDiff) < 1 ? 'text-green-600' : 'text-amber-600'
                    }`}>
                      {Math.abs(manualDiff) < 1
                        ? '✓ Répartition complète'
                        : manualDiff > 0
                          ? `Reste ${formatFCFA(manualDiff)} FCFA à répartir`
                          : `Dépassement de ${formatFCFA(Math.abs(manualDiff))} FCFA`}
                    </p>
                  )}
                </div>
              )}

              <p className="text-[11px] text-gray-400 leading-relaxed">
                💡 Ce montant sort de votre trésorerie et vient s'ajouter au budget
                de vos enveloppes pour ce mois. Il ne compte pas comme un nouveau revenu.
              </p>
            </div>

            <div className="p-4 pb-6">
              <button
                onClick={handleAllocate}
                disabled={allocateMode === 'manual' && allocateAmount && Math.abs(manualDiff) >= 1}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-2xl font-bold shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Confirmer l'affectation
              </button>
            </div>
          </div>
        </>
      )}

      {/* Bottom sheet — Ajuster un solde (correction, pas un transfert) */}
      {showAdjustSheet && adjustTarget && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowAdjustSheet(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl animate-slide-up">
            <div className="pt-3 pb-2 px-5 border-b border-gray-100">
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-3" />
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-900">✏️ Ajuster le solde</h2>
                <button onClick={() => setShowAdjustSheet(false)} className="text-gray-400 text-xl">✕</button>
              </div>
              <p className="text-xs text-gray-400 mt-1">{adjustTarget.name}</p>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3">
                <p className="text-xs text-amber-800 leading-relaxed">
                  ⚠️ Ceci corrige directement le solde affiché — ce n'est pas un
                  transfert. Utilisez ceci pour déclarer un montant que vous
                  possédez déjà, ou corriger une erreur.
                </p>
              </div>

              <div>
                <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide">
                  Solde actuel réel
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={adjustNewBalance}
                  onChange={(e) => setAdjustNewBalance(e.target.value)}
                  autoFocus
                  className="w-full mt-1 px-4 py-3 bg-gray-50 rounded-2xl text-lg font-bold outline-none focus:ring-2 focus:ring-gray-400"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Ancien solde affiché : {formatFCFA(adjustTarget.balance)} FCFA
                </p>
              </div>

              <div>
                <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide">
                  Raison (optionnel)
                </label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Ex: Argent déjà mis de côté avant Yoonu Dal"
                  className="w-full mt-1 px-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none"
                />
              </div>
            </div>

            <div className="p-4 pb-6">
              <button
                onClick={handleAdjust}
                className="w-full py-4 bg-gray-800 text-white rounded-2xl font-bold shadow-lg"
              >
                Confirmer le nouveau solde
              </button>
            </div>
          </div>
        </>
      )}

      {/* Bottom sheet — Créer une poche */}
      {showCreateSheet && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowCreateSheet(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl animate-slide-up">
            <div className="pt-3 pb-2 px-5 border-b border-gray-100">
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-3" />
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-900">💼 Nouvelle poche</h2>
                <button onClick={() => setShowCreateSheet(false)} className="text-gray-400 text-xl">✕</button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Nom</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="Ex: Cash maison, Compte secondaire..."
                  className="w-full mt-1 px-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Icône</label>
                <div className="flex gap-2 mt-1">
                  {['💼', '🏦', '💵', '🏠', '📦'].map(icon => (
                    <button
                      key={icon}
                      onClick={() => setCreateForm({ ...createForm, icon })}
                      className={`w-11 h-11 rounded-2xl text-xl flex items-center justify-center transition-all ${
                        createForm.icon === icon ? 'bg-green-100 ring-2 ring-green-500' : 'bg-gray-50'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 pb-6">
              <button
                onClick={handleCreatePocket}
                className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl font-bold shadow-lg"
              >
                Créer la poche
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

export default PocketsPage;
