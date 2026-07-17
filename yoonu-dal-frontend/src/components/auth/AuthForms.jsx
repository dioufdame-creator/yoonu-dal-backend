// src/components/auth/AuthForms.jsx
// Composants ForgotPasswordForm et ResetPasswordForm
// À importer dans App.js

import React, { useState, useEffect } from 'react';
import authService from '../../services/authService';

// ── FORMULAIRE MOT DE PASSE OUBLIÉ ──────────────────────────
export const ForgotPasswordForm = ({ onNavigate, toast }) => {
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) return;

    setLoading(true);
    try {
      const result = await authService.forgotPassword(identifier);
      if (result.success) {
        setSent(true);
      } else {
        toast?.showError(result.error);
      }
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center">
        <div className="text-6xl mb-4">📧</div>
        <h3 className="text-xl font-bold text-gray-900 mb-3">Email envoyé !</h3>
        <p className="text-gray-600 text-sm leading-relaxed mb-6">
          Si un compte existe avec cet identifiant, vous recevrez un email avec un lien de réinitialisation dans quelques minutes.
        </p>
        <p className="text-xs text-gray-400 mb-4">
          Vérifiez aussi votre dossier spam.
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          <p className="font-semibold mb-1">Pas reçu l'email ?</p>
          <p>Contactez-nous sur WhatsApp :</p>
          <a
            href="https://wa.me/221773569462?text=Bonjour%2C%20je%20n%27ai%20pas%20reçu%20l%27email%20de%20réinitialisation%20Yoonu%20Dal."
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-600 font-semibold hover:underline"
          >
            +221 77 356 94 62
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Email ou nom d'utilisateur
        </label>
        <input
          type="text"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="email@exemple.com ou votre pseudo"
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
          required
        />
      </div>
      <button
        type="submit"
        disabled={loading || !identifier.trim()}
        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Envoi en cours...' : 'Envoyer le lien'}
      </button>
    </form>
  );
};


// ── FORMULAIRE RÉINITIALISATION MOT DE PASSE ────────────────
export const ResetPasswordForm = ({ uid, token, onSuccess, onNavigate, toast }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Récupérer uid et token depuis l'URL si pas passés en props
  useEffect(() => {
    if (!uid || !token) {
      const params = new URLSearchParams(window.location.search);
      const urlUid = params.get('uid');
      const urlToken = params.get('token');
      if (!urlUid || !urlToken) {
        setError('Lien invalide. Faites une nouvelle demande de réinitialisation.');
      }
    }
  }, [uid, token]);

  const getParams = () => {
    if (uid && token) return { uid, token };
    const params = new URLSearchParams(window.location.search);
    return { uid: params.get('uid'), token: params.get('token') };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    const { uid: u, token: t } = getParams();
    if (!u || !t) {
      setError('Lien invalide. Faites une nouvelle demande.');
      return;
    }

    setLoading(true);
    try {
      const result = await authService.resetPassword(u, t, newPassword);
      if (result.success) {
        toast?.showSuccess('Mot de passe modifié avec succès !');
        setTimeout(() => onSuccess(), 1500);
      } else {
        setError(result.error);
      }
    } finally {
      setLoading(false);
    }
  };

  if (error && !newPassword) {
    return (
      <div className="text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <p className="text-red-600 font-semibold mb-4">{error}</p>
        <button
          onClick={() => onNavigate('forgot-password')}
          className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition-all"
        >
          Faire une nouvelle demande
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
          {error}
        </div>
      )}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Nouveau mot de passe
        </label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Au moins 6 caractères"
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
          required
          minLength={6}
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Confirmer le mot de passe
        </label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Répétez le mot de passe"
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
          required
          minLength={6}
        />
      </div>
      <button
        type="submit"
        disabled={loading || !newPassword || !confirmPassword}
        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Mise à jour...' : 'Enregistrer le nouveau mot de passe'}
      </button>

      <div className="text-center mt-4">
        <button
          type="button"
          onClick={() => onNavigate('login')}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Retour à la connexion
        </button>
      </div>
    </form>
  );
};
