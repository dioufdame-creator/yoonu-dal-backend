import React, { useState } from 'react';

const Home = ({ onNavigate, toast, auth }) => {
  const [currentStep, setCurrentStep] = useState(0);
  
  const yoonuSteps = [
    {
      title: "Conscience",
      problem: "Où va mon argent chaque mois ?",
      solution: "Voir clairement vos flux financiers sans jugement. Comprendre vos habitudes est la première étape vers la liberté financière.",
      icon: "👁️",
      color: "from-[#14B8A6] to-[#0F766E]"
    },
    {
      title: "Clarté", 
      problem: "Qu'est-ce qui compte vraiment pour moi ?",
      solution: "Aligner vos dépenses avec vos valeurs profondes. Famille, sécurité, éducation — votre argent doit refléter vos priorités.",
      icon: "💡",
      color: "from-[#84CC16] to-[#65A30D]"
    },
    {
      title: "Choix",
      problem: "Comment mieux gérer mon budget ?", 
      solution: "Les 4 enveloppes : 50% essentiels, 30% plaisirs, 20% projets, 0% libération. Une méthode simple et adaptée à nos réalités.",
      icon: "🎯",
      color: "from-[#F97316] to-[#C2410C]"
    },
    {
      title: "Contrôle",
      problem: "Comment maintenir ces bonnes habitudes ?",
      solution: "Suivi quotidien, alertes intelligentes et score Yoonu Dal pour mesurer vos progrès mois après mois.",
      icon: "🚀",
      color: "from-[#FDE047] to-[#CA8A04]"
    }
  ];

  const testimonials = [
    {
      name: "Amsatou D.",
      role: "Enseignante",
      quote: "Fini l'angoisse de fin de mois. Je sais exactement où va mon argent.",
      avatar: "👩🏾‍🏫"
    },
    {
      name: "Diégane F.", 
      role: "Développeur",
      quote: "Les 4 enveloppes ont changé ma relation à l'argent. Simple mais efficace.",
      avatar: "👨🏾‍💻"
    },
    {
      name: "Laeticia K.",
      role: "Entrepreneure",
      quote: "Grâce aux tontines digitales, j'ai pu racheter mon local.",
      avatar: "👩🏾‍💼"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50">

      {/* ═══════════════════════════════════════════
          HERO SECTION
      ═══════════════════════════════════════════ */}
      <div className="container mx-auto px-4 py-12 lg:py-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Texte hero */}
            <div>
              {/* Badge livre — subtil */}
              <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-200 text-teal-700 px-3 py-1.5 rounded-full text-sm font-medium mb-6">
                📖 Inspiré du livre <em>Les Silences de nos Portefeuilles</em>
              </div>

              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                Transformez vos{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#14B8A6] to-[#F97316]">
                  silences financiers
                </span>{' '}
                en liberté
              </h1>
              
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Yoonu Dal vous guide vers une relation apaisée avec l'argent.
                Pas de miracles, juste une méthode éprouvée en 4 étapes.
                Que vous gagniez beaucoup ou peu, Yoonu Dal commence là où vous êtes.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                {auth?.isAuthenticated ? (
                  <button
                    onClick={() => onNavigate('dashboard')}
                    className="px-8 py-4 bg-gradient-to-r from-[#14B8A6] to-[#0F766E] text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                  >
                    Accéder à mon tableau de bord
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => onNavigate('register')}
                      className="px-8 py-4 bg-gradient-to-r from-[#14B8A6] to-[#0F766E] text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                    >
                      Commencer gratuitement
                    </button>
                    <button
                      onClick={() => onNavigate('login')}
                      className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-200"
                    >
                      Se connecter
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* ✅ Mockup téléphone avec vraie capture */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative">
                {/* Halos décoratifs */}
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-teal-200 rounded-full opacity-40 blur-2xl"></div>
                <div className="absolute -bottom-6 -left-6 w-28 h-28 bg-orange-200 rounded-full opacity-40 blur-2xl"></div>

                {/* Cadre téléphone */}
                <div className="relative w-60 lg:w-64 bg-gray-900 rounded-[3rem] p-2.5 shadow-2xl ring-4 ring-gray-800">
                  {/* Notch */}
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-4 bg-gray-900 rounded-full z-10"></div>
                  {/* Écran */}
                  <div className="rounded-[2.4rem] overflow-hidden" style={{ height: '500px' }}>
                    <img
                      src="/mockup-dashboard.jpg"
                      alt="Dashboard Yoonu Dal"
                      className="w-full h-full object-cover object-top"
                      onError={(e) => {
                        // Fallback si image non trouvée
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    {/* Fallback illustratif si image absente */}
                    <div className="w-full h-full bg-gradient-to-b from-teal-50 to-white flex-col items-center justify-center p-6 text-center hidden">
                      <div className="text-5xl mb-4">🌱</div>
                      <div className="text-sm font-bold text-gray-700 mb-4">Tableau de bord</div>
                      <div className="w-full space-y-2">
                        <div className="bg-teal-100 rounded-lg p-2 text-left">
                          <div className="text-xs text-gray-500">Essentiels</div>
                          <div className="w-3/4 h-1.5 bg-teal-400 rounded-full mt-1"></div>
                        </div>
                        <div className="bg-lime-100 rounded-lg p-2 text-left">
                          <div className="text-xs text-gray-500">Plaisirs</div>
                          <div className="w-1/2 h-1.5 bg-lime-400 rounded-full mt-1"></div>
                        </div>
                        <div className="bg-orange-100 rounded-lg p-2 text-left">
                          <div className="text-xs text-gray-500">Projets</div>
                          <div className="w-1/4 h-1.5 bg-orange-400 rounded-full mt-1"></div>
                        </div>
                        <div className="bg-gray-100 rounded-lg p-2 text-center mt-4">
                          <div className="text-2xl font-bold text-teal-600">90</div>
                          <div className="text-xs text-gray-500">Score Yoonu Dal</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Badge flottant score */}
                <div className="absolute -right-4 top-16 bg-white rounded-2xl shadow-xl px-4 py-2 flex items-center gap-2 border border-gray-100">
                  <span className="text-xl">🏆</span>
                  <div>
                    <div className="text-xs text-gray-500">Score</div>
                    <div className="text-sm font-bold text-teal-600">90/100</div>
                  </div>
                </div>

                {/* Badge flottant maître */}
                <div className="absolute -left-6 bottom-20 bg-white rounded-2xl shadow-xl px-3 py-2 flex items-center gap-2 border border-gray-100">
                  <span className="text-lg">✅</span>
                  <div className="text-xs font-semibold text-gray-700">Maître Yoonu</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          QUESTION CLÉ
      ═══════════════════════════════════════════ */}
      <div className="bg-gradient-to-r from-[#14B8A6] to-[#0F766E] py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Où va votre argent chaque mois ?
          </h2>
          <p className="text-white/90 text-lg max-w-2xl mx-auto">
            La plupart des gens ne le savent pas vraiment. Yoonu Dal vous donne cette clarté en quelques minutes.
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          LA MÉTHODE
      ═══════════════════════════════════════════ */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              La méthode Yoonu Dal
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Une approche progressive pour reprendre le contrôle de vos finances.
            </p>
          </div>

          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              {yoonuSteps.map((step, index) => (
                <div
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`p-6 rounded-xl cursor-pointer transition-all duration-300 ${
                    currentStep === index 
                      ? 'bg-gradient-to-br ' + step.color + ' text-white transform scale-105 shadow-lg' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  }`}
                >
                  <div className="text-4xl mb-3">{step.icon}</div>
                  <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                  <p className={`text-sm ${currentStep === index ? 'text-white/90' : 'text-gray-600'}`}>
                    Étape {index + 1}/4
                  </p>
                </div>
              ))}
            </div>

            <div className="bg-white border-2 border-gray-200 p-8 rounded-2xl shadow-lg">
              <div className="max-w-3xl mx-auto">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {yoonuSteps[currentStep].problem}
                </h3>
                <p className="text-lg text-gray-700 mb-6">
                  {yoonuSteps[currentStep].solution}
                </p>
                
                {currentStep === 2 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="bg-teal-50 border-2 border-teal-200 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-[#14B8A6]">50%</div>
                      <div className="text-sm text-gray-700 font-medium">Essentiels</div>
                    </div>
                    <div className="bg-lime-50 border-2 border-lime-200 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-[#84CC16]">30%</div>
                      <div className="text-sm text-gray-700 font-medium">Plaisirs</div>
                    </div>
                    <div className="bg-orange-50 border-2 border-orange-200 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-[#F97316]">20%</div>
                      <div className="text-sm text-gray-700 font-medium">Projets</div>
                    </div>
                    <div className="bg-yellow-50 border-2 border-yellow-200 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-[#CA8A04]">0%</div>
                      <div className="text-sm text-gray-700 font-medium">Libération</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          TÉMOIGNAGES
      ═══════════════════════════════════════════ */}
      <div className="py-16 bg-gradient-to-br from-teal-50 to-lime-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Ce que disent ceux qui l'ont essayé
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200">
                <div className="flex items-center mb-4">
                  <div className="text-3xl mr-3">{testimonial.avatar}</div>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                  </div>
                </div>
                <p className="text-gray-700 italic">"{testimonial.quote}"</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          CTA FINAL
      ═══════════════════════════════════════════ */}
      <div className="py-16 bg-gradient-to-r from-[#14B8A6] to-[#0F766E]">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Prêt à reprendre le contrôle ?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Rejoignez les personnes qui transforment leur relation à l'argent avec Yoonu Dal.
          </p>
          
          {!auth?.isAuthenticated && (
            <button
              onClick={() => onNavigate('register')}
              className="px-8 py-4 bg-white text-[#14B8A6] rounded-xl font-semibold hover:bg-gray-100 transform hover:scale-105 transition-all duration-200 shadow-lg"
            >
              Commencer maintenant - C'est gratuit
            </button>
          )}
        </div>
      </div>

    </div>
  );
};

export default Home;
