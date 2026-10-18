// src/components/finances/GrandLivre.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Loader2, RefreshCw, BookOpen, ChevronDown, ChevronRight,
  Filter, Calendar
} from 'lucide-react';

const GrandLivre = () => {
  const navigate = useNavigate();
  const [comptes, setComptes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedComptes, setExpandedComptes] = useState({});
  const [error, setError] = useState(null);

  const abortRef = useRef(null);
  const getToken = () => localStorage.getItem('Token');

  const fetchGrandLivre = useCallback(async () => {
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
        `/grand-livre/?${params.toString()}`,
        {
          headers: { Authorization: `Token ${token}` },
          signal: controller.signal,
        }
      );

      setComptes(response.data.results || []);
    } catch (err) {
      if (err.name === 'CanceledError' || err.name === 'AbortError') return;
      console.error('❌ Erreur grand livre:', err);
      setError('Erreur de chargement du grand livre');
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, navigate]);

  useEffect(() => {
    fetchGrandLivre();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetchGrandLivre]);

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '0 FCFA';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '0 FCFA';
    return `${num.toLocaleString('fr-FR')} FCFA`;
  };

  const formatDate = (d) => {
    if (!d) return '-';
    try {
      return new Date(d).toLocaleDateString('fr-FR');
    } catch {
      return '-';
    }
  };

  const toggleCompte = (id) => {
    setExpandedComptes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading && comptes.length === 0) {
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
              <BookOpen className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-primary">
                Grand Livre
              </h1>
              <p className="text-sm text-gray-500">
                {comptes.length} compte(s) avec mouvements
              </p>
            </div>
          </div>
          <button
            onClick={fetchGrandLivre}
            className="btn btn-sm btn-outline gap-2"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>
      </div>

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

      {/* Comptes */}
      <div className="space-y-4">
        {comptes.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Aucun mouvement comptable</p>
          </div>
        ) : (
          comptes.map((compte) => {
            const isExpanded = expandedComptes[compte.compte_id];

            return (
              <div key={compte.compte_id} className="bg-white rounded-xl shadow-md overflow-hidden">
                <button
                  onClick={() => toggleCompte(compte.compte_id)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-primary" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-primary" />
                    )}
                    <div className="text-left">
                      <p className="font-bold text-gray-800">
                        {compte.numero} - {compte.nom}
                      </p>
                      <p className="text-xs text-gray-500">
                        Solde initial: {formatCurrency(compte.solde_initial)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <div>
                      <span className="text-xs text-gray-500">Débit</span>
                      <p className="font-bold text-success">
                        {formatCurrency(compte.total_debit)}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Crédit</span>
                      <p className="font-bold text-error">
                        {formatCurrency(compte.total_credit)}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Solde final</span>
                      <p className="font-bold text-primary">
                        {formatCurrency(compte.solde_final)}
                      </p>
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-200">
                    <table className="table w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th>Date</th>
                          <th>N°</th>
                          <th>Description</th>
                          <th className="text-right">Débit</th>
                          <th className="text-right">Crédit</th>
                          <th className="text-right">Solde</th>
                        </tr>
                      </thead>
                      <tbody>
                        {compte.mouvements.map((m) => (
                          <tr key={m.id}>
                            <td className="text-sm">{formatDate(m.date)}</td>
                            <td className="font-mono text-sm">{m.numero}</td>
                            <td className="text-sm">{m.description}</td>
                            <td className="text-right text-success">
                              {m.debit > 0 ? formatCurrency(m.debit) : '-'}
                            </td>
                            <td className="text-right text-error">
                              {m.credit > 0 ? formatCurrency(m.credit) : '-'}
                            </td>
                            <td className="text-right font-semibold">
                              {formatCurrency(m.solde)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default GrandLivre;