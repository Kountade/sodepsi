// src/components/finances/JournalComptable.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Loader2, RefreshCw, X, AlertCircle, CheckCircle,
  Calendar, Filter, ChevronLeft, ChevronRight,
  BookOpen, ScrollText, TrendingUp, TrendingDown
} from 'lucide-react';

const JournalComptable = () => {
  const navigate = useNavigate();
  const [ecritures, setEcritures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalDebit, setTotalDebit] = useState(0);
  const [totalCredit, setTotalCredit] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(50);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState(null);

  const abortRef = useRef(null);
  const getToken = () => localStorage.getItem('Token');

  const fetchJournal = useCallback(async (page = 1) => {
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
      params.append('page', page);
      params.append('page_size', itemsPerPage);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      if (typeFilter !== 'all') params.append('type', typeFilter);

      const response = await AxiosInstance.get(
        `/journal-comptable/?${params.toString()}`,
        {
          headers: { Authorization: `Token ${token}` },
          signal: controller.signal,
        }
      );

      const data = response.data;
      setEcritures(data.results || []);
      setTotalCount(data.count || 0);
      setTotalPages(data.total_pages || 1);
      setTotalDebit(data.total_debit || 0);
      setTotalCredit(data.total_credit || 0);
      setCurrentPage(page);
    } catch (err) {
      if (err.name === 'CanceledError' || err.name === 'AbortError') return;
      console.error('❌ Erreur journal:', err);
      setError('Erreur de chargement du journal');
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, typeFilter, itemsPerPage, navigate]);

  useEffect(() => {
    fetchJournal(1);
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetchJournal]);

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

  if (loading && ecritures.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="animate-spin text-primary w-14 h-14" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50 p-6">
      <div className="bg-white border-b border-gray-200 shadow-sm rounded-xl mb-6">
        <div className="px-6 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-xl">
                <ScrollText className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-primary">
                  Journal Comptable
                </h1>
                <p className="text-sm text-gray-500">
                  {totalCount.toLocaleString('fr-FR')} écriture(s)
                </p>
              </div>
            </div>
            <button
              onClick={() => fetchJournal(currentPage)}
              className="btn btn-sm btn-outline gap-2"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
          </div>
        </div>
      </div>

      {/* Totaux */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white shadow-md rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total Débit</p>
              <p className="text-xl font-bold text-success">{formatCurrency(totalDebit)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-success/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total Crédit</p>
              <p className="text-xl font-bold text-error">{formatCurrency(totalCredit)}</p>
            </div>
            <TrendingDown className="w-8 h-8 text-error/20" />
          </div>
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="date"
              className="input input-bordered"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              placeholder="Du"
            />
            <input
              type="date"
              className="input input-bordered"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              placeholder="Au"
            />
            <select
              className="select select-bordered"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">Tous les types</option>
              <option value="vente">Vente</option>
              <option value="achat">Achat</option>
              <option value="paiement_client">Paiement client</option>
              <option value="paiement_fournisseur">Paiement fournisseur</option>
              <option value="depense">Dépense</option>
              <option value="tresorerie">Trésorerie</option>
            </select>
          </div>
        )}
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-gray-50">
              <tr>
                <th>Date</th>
                <th>N°</th>
                <th>Description</th>
                <th>Compte Débit</th>
                <th>Compte Crédit</th>
                <th className="text-right">Débit</th>
                <th className="text-right">Crédit</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {ecritures.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-16">
                    <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">Aucune écriture trouvée</p>
                  </td>
                </tr>
              ) : (
                ecritures.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="text-sm">{formatDate(e.date_ecriture)}</td>
                    <td className="font-mono text-sm">{e.numero}</td>
                    <td className="text-sm max-w-xs truncate">{e.description}</td>
                    <td className="text-sm">{e.compte_debit_nom}</td>
                    <td className="text-sm">{e.compte_credit_nom}</td>
                    <td className="text-right font-semibold text-success">
                      {formatCurrency(e.montant)}
                    </td>
                    <td className="text-right font-semibold text-error">
                      {formatCurrency(e.montant)}
                    </td>
                    <td>
                      <span className={`badge ${
                        e.statut === 'valide' ? 'badge-success' : 'badge-ghost'
                      }`}>
                        {e.statut}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t flex items-center justify-between bg-gray-50">
            <span className="text-sm text-gray-500">
              Page {currentPage} / {totalPages}
            </span>
            <div className="join">
              <button
                className="join-item btn btn-sm"
                onClick={() => fetchJournal(currentPage - 1)}
                disabled={currentPage === 1 || loading}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                className="join-item btn btn-sm"
                onClick={() => fetchJournal(currentPage + 1)}
                disabled={currentPage >= totalPages || loading}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JournalComptable;