import React, { useState } from 'react';

const DiagnosticQuiz = () => {
  const [currentPhase, setCurrentPhase] = useState('intro');
  const [answers, setAnswers] = useState({});
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const steps = ['conscience', 'clarte', 'choix', 'controle'];
  
  const stepInfo = {
    conscience: { 
      name: 'Conscience', 
      description: 'Prise de conscience de votre relation avec l\'argent',
      color: 'from-red-500 to-orange-500',
      icon: '🧠'
    },
    clarte: { 
      name: 'Clarté', 
      description: 'Clarification de vos valeurs et priorités',
      color: 'from-yellow-500 to-orange-500',
      icon: '💡'
    },
    choix: { 
      name: 'Choix', 
      description: 'Mise en pratique de vos décisions financières',
      color: 'from-blue-500 to-purple-500',
      icon: '⚖️'
    },
    controle: { 
      name: 'Contrôle', 
      description: 'Maîtrise totale et transmission aux autres',
      color: 'from-green-500 to-emerald-500',
      icon: '👑'
    }
  };

  const questions = {
    conscience: [
      {
        id: 'q1',
        question: 'Comment décririez-vous votre relation avec l\'argent ?',
        type: 'scale',
        labels: ['Très stressante', 'Stressante', 'Neutre', 'Sereine', 'Très maîtrisée']
      },
      {
        id: 'q2',
        question: 'Savez-vous précisément où va votre argent chaque mois ?',
        type: 'choice',
        options: [
          { value: '1', label: 'Aucune idée précise', weight: 1 },
          { value: '2', label: 'Une idée approximative', weight: 2 },
          { value: '3', label: 'Je connais mes principales dépenses', weight: 4 },
          { value: '4', label: 'Je connais précisément chaque dépense', weight: 5 }
        ]
      },
      {
        id: 'q3',
        question: 'Vos dépenses reflètent-elles vraiment vos valeurs et priorités ?',
        type: 'choice',
        options: [
          { value: '1', label: 'Je n\'y ai jamais réfléchi', weight: 1 },
          { value: '2', label: 'Parfois, mais pas systématiquement', weight: 2 },
          { value: '3', label: 'La plupart du temps', weight: 4 },
          { value: '4', label: 'Toujours, c\'est ma priorité', weight: 5 }
        ]
      }
    ],
    clarte: [
      {
        id: 'q4',
        question: 'Avez-vous clairement défini vos 3-5 valeurs principales concernant l\'argent ?',
        type: 'choice',
        options: [
          { value: '1', label: 'Non, je n\'ai pas réfléchi à mes valeurs', weight: 1 },
          { value: '2', label: 'J\'ai des idées générales mais floues', weight: 2 },
          { value: '3', label: 'J\'en ai identifié quelques-unes clairement', weight: 4 },
          { value: '4', label: 'Mes valeurs sont cristal clair', weight: 5 }
        ]
      },
      {
        id: 'q5',
        question: 'Connaissez-vous le principe des 3 enveloppes ?',
        type: 'choice',
        options: [
          { value: '1', label: 'Première fois que j\'en entends parler', weight: 1 },
          { value: '2', label: 'J\'en ai entendu parler mais c\'est flou', weight: 2 },
          { value: '3', label: 'Je comprends le concept', weight: 3 },
          { value: '4', label: 'Je suis prêt(e) à l\'essayer', weight: 4 }
        ]
      },
      {
        id: 'q6',
        question: 'Quelles sont vos priorités pour les 6 prochains mois ?',
        type: 'multiple',
        options: [
          { value: 'reduce', label: 'Réduire mes dépenses inutiles' },
          { value: 'save', label: 'Augmenter mon épargne' },
          { value: 'organize', label: 'Mieux organiser mes finances' },
          { value: 'goals', label: 'Atteindre mes objectifs précis' }
        ]
      }
    ],
    choix: [
      {
        id: 'q7',
        question: 'Qu\'est-ce qui vous empêche le plus de respecter votre budget ?',
        type: 'choice',
        options: [
          { value: '1', label: 'Pressions familiales et sociales', weight: 3 },
          { value: '2', label: 'Manque de discipline personnelle', weight: 2 },
          { value: '3', label: 'Dépenses imprévues récurrentes', weight: 4 },
          { value: '4', label: 'Revenus trop irréguliers', weight: 4 }
        ]
      },
      {
        id: 'q8',
        question: 'Face à une dépense non prévue, combien de temps prenez-vous pour décider ?',
        type: 'choice',
        options: [
          { value: '1', label: 'Je décide immédiatement', weight: 2 },
          { value: '2', label: 'Quelques minutes de réflexion', weight: 3 },
          { value: '3', label: 'Je vérifie d\'abord mon budget', weight: 5 },
          { value: '4', label: 'Je consulte mes valeurs et objectifs', weight: 5 }
        ]
      },
      {
        id: 'q9',
        question: 'À quelle fréquence vérifiez-vous que vos dépenses sont alignées avec vos valeurs ?',
        type: 'choice',
        options: [
          { value: '1', label: 'Jamais, je n\'y pense pas', weight: 1 },
          { value: '2', label: 'Seulement quand il y a des problèmes', weight: 2 },
          { value: '3', label: 'Une fois par mois environ', weight: 4 },
          { value: '4', label: 'Chaque semaine', weight: 5 }
        ]
      }
    ],
    controle: [
      {
        id: 'q10',
        question: 'Votre système financier actuel vous permet-il d\'atteindre vos objectifs ?',
        type: 'scale',
        labels: ['Pas du tout', 'Partiellement', 'Moyennement', 'Largement', 'Complètement']
      },
      {
        id: 'q11',
        question: 'Comment réagissez-vous aux changements financiers inattendus ?',
        type: 'choice',
        options: [
          { value: '1', label: 'Je panique et perds mes repères', weight: 1 },
          { value: '2', label: 'J\'ai du mal à m\'adapter', weight: 2 },
          { value: '3', label: 'Je m\'ajuste progressivement', weight: 3 },
          { value: '4', label: 'Je m\'adapte rapidement', weight: 4 },
          { value: '5', label: 'J\'étais préparé(e) à ce scénario', weight: 5 }
        ]
      },
      {
        id: 'q12',
        question: 'Êtes-vous capable d\'aider d\'autres personnes avec leurs finances ?',
        type: 'choice',
        options: [
          { value: '1', label: 'Non, je ne me sens pas capable', weight: 1 },
          { value: '2', label: 'Je peux donner des conseils basiques', weight: 3 },
          { value: '3', label: 'Je peux bien accompagner quelqu\'un', weight: 4 },
          { value: '4', label: 'C\'est naturel pour moi d\'enseigner cela', weight: 5 }
        ]
      }
    ]
  };

  const getTotalQuestions = () => Object.values(questions).flat().length;

  const getCurrentGlobalNumber = () => {
    let count = 0;
    for (let i = 0; i < currentStepIndex; i++) {
      count += questions[steps[i]].length;
    }
    return count + currentQuestionIndex + 1;
  };

  const handleAnswer = (questionId, value, weight = 1) => {
    setAnswers(prev => ({ ...prev, [questionId]: { value, weight } }));
  };

  const nextQuestion = () => {
    const currentStepQuestions = questions[steps[currentStepIndex]];
    if (currentQuestionIndex < currentStepQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      if (currentStepIndex < steps.length - 1) {
        setCurrentPhase('transition');
      } else {
        setCurrentPhase('results');
      }
    }
  };

  const continueToNextStep = () => {
    setCurrentStepIndex(prev => prev + 1);
    setCurrentQuestionIndex(0);
    setCurrentPhase('diagnostic');
  };

  const calculateStepMastery = (step) => {
    const stepQuestions = questions[step];
    const stepAnswers = stepQuestions.filter(q => answers[q.id]);
    if (stepAnswers.length === 0) return 0;
    const totalWeight = stepAnswers.reduce((sum, q) => {
      const answer = answers[q.id];
      const maxWeight = q.type === 'scale' ? 5 : Math.max(...(q.options?.map(opt => opt.weight || 1) || [1]));
      return sum + (answer.weight || 1) / maxWeight;
    }, 0);
    return Math.min(100, Math.round((totalWeight / stepAnswers.length) * 100));
  };

  const getMasteryLevel = (percentage) => {
    if (percentage < 25) return { label: 'Faible', color: 'text-red-600' };
    if (percentage < 50) return { label: 'En progression', color: 'text-orange-600' };
    if (percentage < 75) return { label: 'Solide', color: 'text-blue-600' };
    return { label: 'Avancé', color: 'text-green-600' };
  };

  const detectDominantStep = () => {
    const masteryScores = steps.map(step => ({ step, mastery: calculateStepMastery(step) }));
    return masteryScores.reduce((max, current) => current.mastery > max.mastery ? current : max).step;
  };

  if (currentPhase === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-3xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎯</div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Diagnostic Yoonu Dal</h1>
            <div className="flex items-center justify-center space-x-4 text-lg text-gray-600">
              <span><span className="font-semibold">4</span> étapes</span>
              <span>•</span>
              <span><span className="font-semibold">{getTotalQuestions()}</span> questions</span>
              <span>•</span>
              <span><span className="font-semibold">15</span> minutes</span>
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Ce diagnostic se déroule en 4 étapes successives :</h2>
            <div className="space-y-3">
              {steps.map((step, index) => (
                <div key={step} className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${stepInfo[step].color} flex items-center justify-center text-white font-bold`}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{stepInfo[step].icon} {stepInfo[step].name}</div>
                    <div className="text-sm text-gray-600">{stepInfo[step].description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8">
            <div className="flex items-start space-x-3">
              <div className="text-2xl">💡</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Ce diagnostic vous permettra de :</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start"><span className="mr-2">✓</span><span>Comprendre votre situation financière actuelle</span></li>
                  <li className="flex items-start"><span className="mr-2">✓</span><span>Identifier votre niveau de maîtrise sur chaque étape</span></li>
                  <li className="flex items-start"><span className="mr-2">✓</span><span>Recevoir des recommandations personnalisées</span></li>
                </ul>
              </div>
            </div>
          </div>
          <button onClick={() => setCurrentPhase('diagnostic')} className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl font-semibold text-lg hover:shadow-lg transform hover:scale-105 transition-all">
            Commencer le diagnostic
          </button>
        </div>
      </div>
    );
  }

  if (currentPhase === 'transition') {
    const completedStep = steps[currentStepIndex];
    const nextStep = steps[currentStepIndex + 1];
    const remainingSteps = steps.length - currentStepIndex - 1;
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">🎯</div>
              <div>
                <div className="font-bold text-gray-900">Diagnostic global en cours</div>
                <div className="text-sm text-gray-600">{Math.round(((currentStepIndex + 1) / steps.length) * 100)}% complété</div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center p-4 min-h-[calc(100vh-80px)]">
          <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12 text-center">
            <div className="text-6xl mb-6">✅</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Mini-diagnostic {stepInfo[completedStep].name} terminé</h2>
            <p className="text-lg text-gray-600 mb-8">{stepInfo[completedStep].description}</p>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
              <p className="text-gray-700 font-medium">Il vous reste encore <span className="font-bold text-blue-700">{remainingSteps} {remainingSteps > 1 ? 'étapes' : 'étape'}</span> pour compléter votre diagnostic global.</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 mb-8">
              <p className="text-lg text-gray-700 mb-4">Passons maintenant à l'étape suivante :</p>
              <div className="flex items-center justify-center space-x-3">
                <div className="text-4xl">{stepInfo[nextStep].icon}</div>
                <div className="text-left">
                  <div className="text-2xl font-bold text-gray-900">{stepInfo[nextStep].name}</div>
                  <div className="text-gray-600">{stepInfo[nextStep].description}</div>
                </div>
              </div>
            </div>
            <button onClick={continueToNextStep} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-semibold text-lg hover:shadow-lg transform hover:scale-105 transition-all">
              Continuer le diagnostic
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (currentPhase === 'results') {
    const dominantStep = detectDominantStep();
    const dominantMastery = calculateStepMastery(dominantStep);
    const dominantLevel = getMasteryLevel(dominantMastery);
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <div className="max-w-5xl mx-auto py-8">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Diagnostic global terminé</h1>
            <p className="text-xl text-gray-600">Voici votre profil Yoonu Dal complet</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 text-center">
            <div className={`inline-block bg-gradient-to-r ${stepInfo[dominantStep].color} text-white px-8 py-4 rounded-full text-3xl font-bold mb-4`}>
              {stepInfo[dominantStep].icon} {stepInfo[dominantStep].name}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Votre étape dominante : {stepInfo[dominantStep].name}</h2>
            <p className="text-gray-600 text-lg mb-6">{stepInfo[dominantStep].description}</p>
            <div className="bg-gray-100 rounded-xl p-6">
              <div className="flex justify-between items-center mb-3">
                <span className="font-semibold text-gray-700">Niveau de maîtrise</span>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">{dominantMastery}%</div>
                  <div className={`text-sm font-semibold ${dominantLevel.color}`}>{dominantLevel.label}</div>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div className={`h-full bg-gradient-to-r ${stepInfo[dominantStep].color} rounded-full transition-all duration-1000`} style={{ width: `${dominantMastery}%` }}></div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Vos résultats par étape</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {steps.map(step => {
                const mastery = calculateStepMastery(step);
                const level = getMasteryLevel(mastery);
                return (
                  <div key={step} className="bg-gray-50 rounded-xl p-5 border-2 border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">{stepInfo[step].icon}</span>
                        <span className="font-semibold text-gray-900">{stepInfo[step].name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">{mastery}%</div>
                        <div className={`text-xs font-semibold ${level.color}`}>{level.label}</div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className={`h-full bg-gradient-to-r ${stepInfo[step].color} rounded-full transition-all duration-1000`} style={{ width: `${mastery}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="text-center">
            <button onClick={() => alert('Retour au dashboard')} className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-lg transform hover:scale-105 transition-all">
              Entrer dans l'app
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentStepQuestions = questions[steps[currentStepIndex]];
  const currentQuestion = currentStepQuestions[currentQuestionIndex];
  const totalQuestions = getTotalQuestions();
  const currentGlobalNumber = getCurrentGlobalNumber();
  const currentStep = steps[currentStepIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">🎯</div>
              <div>
                <div className="font-bold text-gray-900">Diagnostic global en cours</div>
                <div className="text-sm text-gray-600">Étape {currentStepIndex + 1}/4 — {stepInfo[currentStep].name}</div>
              </div>
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-600 mb-2">
            <span>Progression globale</span>
            <span>{currentGlobalNumber} / {totalQuestions} questions</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className={`h-full bg-gradient-to-r ${stepInfo[currentStep].color} rounded-full transition-all duration-500`} style={{ width: `${(currentGlobalNumber / totalQuestions) * 100}%` }}></div>
          </div>
        </div>
      </div>
      <div className="max-w-4xl mx-auto p-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">{stepInfo[currentStep].icon}</div>
            <h2 className="text-2xl font-bold text-gray-900">{currentQuestion.question}</h2>
          </div>
          <div className="space-y-4">
            {currentQuestion.type === 'choice' && currentQuestion.options.map(option => (
              <button key={option.value} onClick={() => { handleAnswer(currentQuestion.id, option.value, option.weight); setTimeout(nextQuestion, 300); }} className="w-full text-left p-6 border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all group">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-gray-900 group-hover:text-blue-700">{option.label}</span>
                  <span className="text-blue-400 group-hover:text-blue-600">→</span>
                </div>
              </button>
            ))}
            {currentQuestion.type === 'scale' && (
              <div className="space-y-6">
                <div className="flex justify-between text-sm text-gray-600 px-4">
                  {currentQuestion.labels.map((label, i) => <span key={i} className="text-center flex-1">{label}</span>)}
                </div>
                <div className="flex justify-between space-x-2">
                  {[1, 2, 3, 4, 5].map(value => (
                    <button key={value} onClick={() => { handleAnswer(currentQuestion.id, value, value); setTimeout(nextQuestion, 300); }} className="flex-1 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all transform hover:scale-105 text-center font-bold text-2xl text-gray-700 hover:text-blue-700">
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {currentQuestion.type === 'multiple' && (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  {currentQuestion.options.map(option => (
                    <label key={option.value} className="flex items-center p-4 border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 cursor-pointer">
                      <input type="checkbox" className="w-5 h-5 text-blue-600 rounded" onChange={(e) => { const curr = answers[currentQuestion.id]?.value || []; const newSel = e.target.checked ? [...curr, option.value] : curr.filter(v => v !== option.value); handleAnswer(currentQuestion.id, newSel, newSel.length); }} />
                      <span className="ml-3 text-gray-900 font-medium">{option.label}</span>
                    </label>
                  ))}
                </div>
                <button onClick={nextQuestion} disabled={!answers[currentQuestion.id]} className={`w-full py-3 rounded-xl font-semibold ${answers[currentQuestion.id] ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                  Continuer
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-center">
          <div className="flex space-x-2">
            {currentStepQuestions.map((_, i) => (
              <div key={i} className={`w-3 h-3 rounded-full transition-all ${i <= currentQuestionIndex ? 'bg-blue-500' : 'bg-gray-300'} ${i === currentQuestionIndex ? 'scale-125' : ''}`}></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticQuiz;