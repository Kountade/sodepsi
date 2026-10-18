// src/components/finances/BalanceGenerale.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Loader2, RefreshCw, Filter, Scale, CheckCircle, AlertTriangle
} from 'lucide-react';

const BalanceGenerale = () => {
  const navigate = useNavigate();
  const [balance, setBalance] = useState([]);
  const [totaux, setTotaux] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState(null);

  const abortRef = useRef(null);
  const getToken = () => localStorage.getItem('Token');

  const fetchBalance = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const token = getToken();
      if (!token) {
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const params = new URLSearchParams();
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);

      const response = await AxiosInstance.get(
        `/balance-generale/?${params.toString()}`,
        {
          headers: { Authorization: `Token ${token}` },
          signal: controller.signal,
        }
      );

      setBalance(response.data.results || []);
      setTotaux(response.data.totaux || null);
    } catch (err) {
      if (err.name === 'CanceledError' || err.name === 'AbortError') return;
      console.error('❌ Erreur balance:', err);
      setError('Erreur de chargement de la balance');
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, navigate]);

  useEffect(() => {
    fetchBalance();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetchBalance]);

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '0 FCFA';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '0 FCFA';
    return `${num.toLocaleString('fr-FR')} FCFA`;
  };

  if (loading && balance.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="animate-spin text-primary w-14 h-14" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50 p-6">
      <div className="bg-white border-b border-gray-200 shadow-sm rounded-xl mb-6">
        <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Scale className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-primary">
                Balance Générale
              </h1>
              <p className="text-sm text-gray-500">
                {balance.length} compte(s)
              </p>
            </div>
          </div>
          <button
            onClick={fetchBalance}
            className="btn btn-sm btn-outline gap-2"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>
      </div>

      {/* Équilibre */}
      {totaux && (
        <div className={`alert ${totaux.equilibre ? 'alert-success' : 'alert-error'} mb-4`}>
          {totaux.equilibre ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <span>
            {totaux.equilibre
              ? 'Balance équilibrée ✅'
              : `Déséquilibre : ${formatCurrency(Math.abs(totaux.total_debit - totaux.total_credit))}`}
          </span>
        </div>
      )}

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="btn btn-sm btn-outline gap-2 mb-3"
        >
          <Filter className="w-4 h-4" />
          {showFilters ? 'Masquer filtres' : 'Afficher filtres'}
        </button>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="date"
              className="input input-bordered"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            <input
              type="date"
              className="input input-bordered"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-gray-50">
              <tr>
                <th>N° Compte</th>
                <th>Nom du compte</th>
                <th className="text-right">Total Débit</th>
                <th className="text-right">Total Crédit</th>
                <th className="text-right">Solde Débiteur</th>
                <th className="text-right">Solde Créditeur</th>
              </tr>
            </thead>
            <tbody>
              {balance.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-16">
                    <Scale className="w-16 h-16 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">Aucun mouvement comptable</p>
                  </td>
                </tr>
              ) : (
                balance.map((b) => (
                  <tr key={b.compte_id} className="hover:bg-gray-50">
                    <td className="font-mono font-semibold">{b.numero}</td>
                    <td>{b.nom}</td>
                    <td className="text-right text-success">{formatCurrency(b.total_debit)}</td>
                    <td className="text-right text-error">{formatCurrency(b.total_credit)}</td>
                    <td className="text-right font-semibold">
                      {b.solde_debiteur > 0 ? formatCurrency(b.solde_debiteur) : '-'}
                    </td>
                    <td className="text-right font-semibold">
                      {b.solde_crediteur > 0 ? formatCurrency(b.solde_crediteur) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {totaux && (
              <tfoot className="bg-gray-50 font-bold">
                <tr>
                  <td colSpan="2" className="text-right">TOTAUX</td>
                  <td className="text-right text-success">{formatCurrency(totaux.total_debit)}</td>
                  <td className="text-right text-error">{formatCurrency(totaux.total_credit)}</td>
                  <td className="text-right">{formatCurrency(totaux.total_solde_debiteur)}</td>
                  <td className="text-right">{formatCurrency(totaux.total_solde_crediteur)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default BalanceGenerale;