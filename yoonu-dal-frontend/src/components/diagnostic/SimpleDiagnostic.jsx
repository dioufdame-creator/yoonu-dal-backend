import React, { useState, useEffect } from 'react';
import API from '../../services/api';

const SimpleDiagnostic = ({ onNavigate, toast }) => {
  const [selectedValues, setSelectedValues] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const VALUES = [
    { id: 'famille',      emoji: '💚', label: 'Famille',               desc: 'Tes proches, ta maison, tes racines' },
    { id: 'spiritualite', emoji: '✨', label: 'Spiritualité / Foi',     desc: 'Ta foi, tes valeurs, ton ancrage intérieur' },
    { id: 'education',    emoji: '🎓', label: 'Éducation',              desc: 'Apprendre, grandir, transmettre' },
    { id: 'sante',        emoji: '💪', label: 'Santé',                  desc: 'Ton bien-être physique et mental' },
    { id: 'liberte',      emoji: '🚀', label: 'Liberté / Indépendance', desc: 'Entreprendre, ne dépendre de personne' },
    { id: 'securite',     emoji: '🛡️', label: 'Sécurité / Stabilité',  desc: 'Dormir tranquille, avoir un filet' },
    { id: 'solidarite',   emoji: '🤝', label: 'Solidarité / Partage',  desc: 'Donner, soutenir, être là pour les autres' },
    { id: 'reussite',     emoji: '🌟', label: 'Réussite',               desc: 'Progresser, accomplir, laisser une trace' },
  ];

  useEffect(() => {
    const loadCurrentValues = async () => {
      try {
        const response = await API.get('/values/');
        const currentValues = response.data?.values || [];
        const sorted = currentValues
          .sort((a, b) => a.priority - b.priority)
          .map(v => v.value)
          .filter(v => VALUES.find(val => val.id === v));
        setSelectedValues(sorted);
      } catch (error) {
        console.error('Erreur chargement valeurs:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadCurrentValues();
  }, []);

  const toggleValue = (valueId) => {
    setSelectedValues(prev => {
      if (prev.includes(valueId)) {
        return prev.filter(v => v !== valueId);
      }
      if (prev.length >= 3) {
        toast?.showWarning?.('Maximum 3 valeurs — retire une pour en choisir une autre');
        return prev;
      }
      return [...prev, valueId];
    });
  };

  const getPriority = (valueId) => {
    const index = selectedValues.indexOf(valueId);
    return index !== -1 ? index + 1 : null;
  };

  const handleSubmit = async () => {
    if (selectedValues.length !== 3) {
      toast?.showError?.('Choisis exactement 3 valeurs');
      return;
    }

    setIsSubmitting(true);
    try {
      // Supprimer toutes les anciennes valeurs
      await API.delete('/user-values/');

      // Créer les nouvelles avec priorité
      for (let i = 0; i < selectedValues.length; i++) {
        await API.post('/values/', {
          value: selectedValues[i],
          priority: i + 1
        });
      }

      // Recalculer le score
      try {
        await API.post('/calculate-score/');
      } catch (scoreError) {
        console.error('Erreur calcul score:', scoreError);
      }

      toast?.showSuccess?.('✅ Tes valeurs sont mises à jour !');
      setTimeout(() => onNavigate('dashboard'), 1000);

    } catch (error) {
      console.error('Erreur sauvegarde valeurs:', error);
      toast?.showError?.('Erreur lors de l\'enregistrement');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8 max-w-2xl">

        <div className="text-center mb-8">
          <div className="text-5xl mb-4">💎</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mes valeurs</h1>
          <p className="text-gray-600">
            Choisis les <strong>3 priorités</strong> qui guident ta vie en ce moment
          </p>
          <p className="text-sm text-gray-500 mt-1">Tu pourras les modifier à tout moment</p>
        </div>

        <div className="flex items-center justify-center gap-3 mb-6">
          {[1, 2, 3].map(i => (
            <div key={i} className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-sm transition-all ${
              selectedValues.length >= i
                ? 'bg-green-600 border-green-600 text-white'
                : 'bg-white border-gray-300 text-gray-400'
            }`}>
              {selectedValues.length >= i
                ? VALUES.find(v => v.id === selectedValues[i-1])?.emoji || '✓'
                : i
              }
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border-2 border-green-200 p-4 mb-6 text-center">
          <span className="text-gray-700 font-medium">
            {selectedValues.length === 0 && 'Commence par choisir 3 valeurs'}
            {selectedValues.length === 1 && 'Encore 2 valeurs à choisir'}
            {selectedValues.length === 2 && 'Encore 1 valeur à choisir'}
            {selectedValues.length === 3 && '✅ Parfait ! Tu peux valider'}
          </span>
        </div>

        <div className="space-y-3 mb-8">
          {VALUES.map(value => {
            const isSelected = selectedValues.includes(value.id);
            const isDisabled = !isSelected && selectedValues.length >= 3;
            const priority = getPriority(value.id);

            return (
              <button
                key={value.id}
                onClick={() => toggleValue(value.id)}
                disabled={isDisabled}
                className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${
                  isSelected
                    ? 'border-green-600 bg-green-50 shadow-md'
                    : isDisabled
                    ? 'border-gray-100 bg-gray-50 opacity-40 cursor-not-allowed'
                    : 'border-gray-200 bg-white hover:border-green-300 hover:bg-green-50/50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{value.emoji}</span>
                  <div className="flex-1">
                    <div className="font-bold text-gray-900 flex items-center gap-2">
                      {value.label}
                      {isSelected && <span className="text-green-600 text-lg">✓</span>}
                    </div>
                    <div className="text-sm text-gray-500">{value.desc}</div>
                  </div>
                  {isSelected && (
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {priority}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {selectedValues.length > 0 && (
          <div className="bg-white rounded-2xl border-2 border-green-200 p-5 mb-6">
            <h3 className="font-bold text-gray-900 mb-3">Ton classement :</h3>
            <div className="space-y-2">
              {selectedValues.map((valueId, index) => {
                const value = VALUES.find(v => v.id === valueId);
                return (
                  <div key={valueId} className="flex items-center gap-3 p-2.5 bg-green-50 rounded-xl">
                    <div className="w-7 h-7 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <span className="text-2xl">{value?.emoji}</span>
                    <span className="font-semibold text-gray-900">{value?.label}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center">
              Reclique sur une valeur pour la désélectionner et changer l'ordre
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => onNavigate('dashboard')}
            disabled={isSubmitting}
            className="px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-2xl font-semibold hover:bg-gray-50 transition-all"
          >
            ← Retour
          </button>
          <button
            onClick={handleSubmit}
            disabled={selectedValues.length !== 3 || isSubmitting}
            className={`flex-1 py-4 rounded-2xl font-semibold text-lg transition-all flex items-center justify-center gap-2 ${
              selectedValues.length === 3 && !isSubmitting
                ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Enregistrement...</span>
              </>
            ) : (
              'Valider mes valeurs ✓'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleDiagnostic;
