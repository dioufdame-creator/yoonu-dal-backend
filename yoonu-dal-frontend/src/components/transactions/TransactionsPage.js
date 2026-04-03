import React, { useState } from 'react';
import ExpensesPage from '../control/ExpenseTracker';
import IncomesPage from '../incomes/IncomesPage';

// ==========================================
// TRANSACTIONS PAGE V5 - DESIGN UNIFIÉ
// Une seule bande verte avec tabs intégrés
// Plus de séparation visuelle
// ==========================================

const TransactionsPage = ({ onNavigate, toast }) => {
  const [activeTab, setActiveTab] = useState('expenses');

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header Unifié - Une seule bande verte */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white sticky top-0 z-10 shadow-lg">
        {/* Titre et description */}
        <div className="px-4 sm:px-6 pt-5 sm:pt-6 pb-3">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 sm:gap-3">
            <span className="text-3xl sm:text-4xl">💰</span>
            <span>Transactions</span>
          </h1>
          <p className="text-green-100 text-sm mt-1">
            Gérez vos dépenses et revenus en toute simplicité
          </p>
        </div>

        {/* Tabs intégrés dans la même bande */}
        <div className="flex px-2 sm:px-4">
          <button
            onClick={() => setActiveTab('expenses')}
            className={`flex-1 py-3 font-semibold text-sm sm:text-base transition-all duration-300 rounded-t-xl relative ${
              activeTab === 'expenses'
                ? 'bg-gray-50 text-green-700'
                : 'text-green-50 hover:bg-green-500/20'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <span className="text-lg sm:text-xl">💸</span>
              <span>Dépenses</span>
            </span>
          </button>
          <button
            onClick={() => setActiveTab('incomes')}
            className={`flex-1 py-3 font-semibold text-sm sm:text-base transition-all duration-300 rounded-t-xl relative ${
              activeTab === 'incomes'
                ? 'bg-gray-50 text-green-700'
                : 'text-green-50 hover:bg-green-500/20'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <span className="text-lg sm:text-xl">💰</span>
              <span>Revenus</span>
            </span>
          </button>
        </div>
      </div>

      {/* Content sans padding pour transition fluide */}
      <div className="transactions-wrapper bg-gray-50">
        <div className="px-4 pt-4">
          {activeTab === 'expenses' ? (
            <ExpensesPage onNavigate={onNavigate} toast={toast} />
          ) : (
            <IncomesPage onNavigate={onNavigate} toast={toast} />
          )}
        </div>
      </div>

      {/* CSS pour cacher les headers des sous-pages */}
      <style jsx>{`
        /* Cache la card glassmorphism header (ExpensesPage) */
        .transactions-wrapper :global(.backdrop-blur-xl.bg-white\\/60) {
          display: none !important;
        }
        
        /* Cache le header simple (IncomesPage) */
        .transactions-wrapper :global(h1:has(💰)) {
          display: none !important;
        }
        
        /* Cache tout header contenant "Mes Revenus" ou "Mes Dépenses" */
        .transactions-wrapper :global(> div > div > div.mb-6:first-child) {
          display: none !important;
        }
        
        /* Ajuste le contenu pour qu'il commence directement */
        .transactions-wrapper :global(> div > div > *:first-child) {
          margin-top: 0 !important;
        }
        
        /* Supprime les marges excessives */
        .transactions-wrapper :global(.max-w-7xl) {
          padding-top: 0 !important;
        }
      `}</style>
    </div>
  );
};

export default TransactionsPage;
