// src/components/paiements/FactureSearchSelect.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Loader2, FileText, AlertCircle, Calendar } from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const FactureSearchSelect = ({ 
  value, 
  onChange, 
  placeholder = "Rechercher une facture par client ou n°...",
  disabled = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFacture, setSelectedFacture] = useState(null);
  const wrapperRef = useRef(null);
  const debounceRef = useRef(null);

  const getToken = () => localStorage.getItem('Token');

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '0 FCFA';
    return `${Number(amount).toLocaleString('fr-FR')} FCFA`;
  };

  // Charger la facture sélectionnée si value est fourni au montage
  useEffect(() => {
    if (value && !selectedFacture) {
      const fetchFacture = async () => {
        try {
          const token = getToken();
          const res = await AxiosInstance.get(`/factures/${value}/`, {
            headers: { 'Authorization': `Token ${token}` }
          });
          setSelectedFacture(res.data);
        } catch (e) {
          console.error('Erreur chargement facture:', e);
        }
      };
      fetchFacture();
    }
  }, [value]);

  // Recherche avec debounce
  const searchFactures = useCallback(async (query) => {
    setLoading(true);
    try {
      const token = getToken();
      const res = await AxiosInstance.get('/factures/search-unpaid/', {
        headers: { 'Authorization': `Token ${token}` },
        params: { q: query, limit: 20 }
      });
      setResults(res.data.results || []);
    } catch (error) {
      console.error('Erreur recherche factures:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce de la recherche
  useEffect(() => {
    if (!isOpen) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchFactures(search);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search, isOpen, searchFactures]);

  // Fermer au clic extérieur
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (facture) => {
    setSelectedFacture(facture);
    onChange(facture.id, facture);
    setIsOpen(false);
    setSearch('');
  };

  const handleClear = () => {
    setSelectedFacture(null);
    onChange('', null);
    setSearch('');
  };

  const getStatusBadge = (status) => {
    const configs = {
      sent: { label: 'Envoyée', className: 'badge-info' },
      overdue: { label: 'En retard', className: 'badge-error' },
      partial: { label: 'Partielle', className: 'badge-warning' },
      draft: { label: 'Brouillon', className: 'badge-ghost' },
    };
    const config = configs[status] || { label: status, className: 'badge-ghost' };
    return <span className={`badge badge-sm ${config.className}`}>{config.label}</span>;
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      {/* Affichage de la facture sélectionnée */}
      {selectedFacture ? (
        <div className="border-2 border-primary rounded-lg p-3 bg-primary/5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-primary">
                  {selectedFacture.invoice_number}
                </span>
                {getStatusBadge(selectedFacture.status)}
              </div>
              <p className="text-sm font-medium text-gray-700 mt-1 truncate">
                {selectedFacture.client_name}
              </p>
              <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Échéance : {new Date(selectedFacture.due_date).toLocaleDateString('fr-FR')}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm">
                <span className="text-gray-500">
                  Total : <strong>{formatCurrency(selectedFacture.total)}</strong>
                </span>
                <span className="text-success font-semibold">
                  Reste : <strong>{formatCurrency(selectedFacture.remaining_amount)}</strong>
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClear}
              disabled={disabled}
              className="btn btn-ghost btn-sm btn-circle"
              title="Changer de facture"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Champ de recherche */
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            disabled={disabled}
            className="input input-bordered w-full pl-10 pr-10 h-12 text-base"
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-primary" />
          )}
        </div>
      )}

      {/* Dropdown des résultats */}
      {isOpen && !selectedFacture && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-xl border border-gray-200 max-h-80 overflow-y-auto">
          {loading && results.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
              <span className="text-sm">Recherche en cours...</span>
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <AlertCircle className="w-5 h-5 mx-auto mb-2 text-gray-400" />
              <span className="text-sm">
                {search ? 'Aucune facture trouvée' : 'Tapez pour rechercher une facture'}
              </span>
            </div>
          ) : (
            <ul className="py-1">
              {results.map((facture) => (
                <li key={facture.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(facture)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                          <span className="font-semibold text-gray-800">
                            {facture.invoice_number}
                          </span>
                          {getStatusBadge(facture.status)}
                        </div>
                        <p className="text-sm text-gray-600 mt-0.5 truncate">
                          {facture.client_name}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Échéance : {new Date(facture.due_date).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-gray-400">Reste à payer</p>
                        <p className="text-sm font-bold text-success">
                          {formatCurrency(facture.remaining_amount)}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          / {formatCurrency(facture.total)}
                        </p>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default FactureSearchSelect;