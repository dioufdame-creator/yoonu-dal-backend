import React, { useState } from 'react';
import ExpensesPage from '../control/ExpenseTracker';
import IncomesPage from '../incomes/IncomesPage';

// ==========================================
// TRANSACTIONS PAGE V6 - COMPACT & PRO
// Design aligné sur la barre Yoonu Dal
// Compact, moderne, cohérent
// ==========================================

const TransactionsPage = ({ onNavigate, toast }) => {
  const [activeTab, setActiveTab] = useState('expenses');

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header Compact et Pro - Style Yoonu Dal */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white sticky top-0 z-10 shadow-md">
        {/* Titre compact */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-green-500/20">
          <div className="flex items-center justify-between">
            <h1 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
              <span className="text-xl sm:text-2xl">💰</span>
              <span>Transactions</span>
            </h1>
            <p className="text-green-50 text-xs sm:text-sm hidden sm:block">
              Dépenses & Revenus
            </p>
          </div>
        </div>

        {/* Tabs compacts */}
        <div className="flex">
          <button
            onClick={() => setActiveTab('expenses')}
            className={`flex-1 py-2.5 sm:py-3 font-medium text-sm sm:text-base transition-all relative ${
              activeTab === 'expenses'
                ? 'text-white bg-green-700/30'
                : 'text-green-100 hover:bg-green-700/20'
            }`}
          >
            <span className="flex items-center justify-center gap-1.5">
              <span>💸</span>
              <span>Dépenses</span>
            </span>
            {activeTab === 'expenses' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('incomes')}
            className={`flex-1 py-2.5 sm:py-3 font-medium text-sm sm:text-base transition-all relative ${
              activeTab === 'incomes'
                ? 'text-white bg-green-700/30'
                : 'text-green-100 hover:bg-green-700/20'
            }`}
          >
            <span className="flex items-center justify-center gap-1.5">
              <span>💰</span>
              <span>Revenus</span>
            </span>
            {activeTab === 'incomes' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"></div>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="transactions-wrapper">
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
        
        /* Cache le header IncomesPage */
        .transactions-wrapper :global(.mb-6:has(h1)) {
          display: none !important;
        }
        
        /* Ajuste le contenu */
        .transactions-wrapper :global(.max-w-7xl) {
          padding-top: 0 !important;
        }
        
        .transactions-wrapper :global(> div > div > *:first-child) {
          margin-top: 0 !important;
        }
      `}</style>
    </div>
  );
};

export default TransactionsPage;
