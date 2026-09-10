// src/components/tresorerie/TresorerieJournaliereDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Calendar, DollarSign, TrendingUp, TrendingDown,
  RefreshCw, FileText, AlertCircle, CheckCircle, X,
  Receipt, Wallet, Landmark, User, Tag, CreditCard
} from 'lucide-react';
import { downloadTresorerieJournalPdf } from './TresorerieJournalPdf';

const TresorerieJournaliereDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [warehouseName, setWarehouseName] = useState('');
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [pdfLoading, setPdfLoading] = useState(false);

  const getToken = () => localStorage.getItem('Token');

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  const fetchDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      const response = await AxiosInstance.get(`/tresorerie-journaliere/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      setData(response.data);

      try {
        const whResponse = await AxiosInstance.get(`/warehouses/${response.data.warehouse}/`, {
          headers: { 'Authorization': `Token ${token}` }
        });
        setWarehouseName(whResponse.data.name);
      } catch {
        setWarehouseName(response.data.warehouse);
      }
    } catch (error) {
      console.error('Erreur:', error);
      setError('Impossible de charger les détails de cette ligne.');
      showNotification('Erreur de chargement', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchDetail();
  }, [id]);

  const handleExportPdf = async () => {
    if (!data) {
      showNotification('Aucune donnée à exporter', 'error');
      return;
    }
    setPdfLoading(true);
    try {
      await downloadTresorerieJournalPdf(
        data,
        warehouseName,
        `tresorerie_journaliere_${data.date}_${warehouseName}.pdf`
      );
      showNotification('PDF exporté avec succès !', 'success');
    } catch (error) {
      console.error('Erreur export PDF:', error);
      showNotification('Erreur lors de l\'export du PDF', 'error');
    } finally {
      setPdfLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num === undefined || num === null) return '0';
    return Number(num).toLocaleString();
  };

  const getVariationColor = (val) => {
    const v = parseFloat(val || 0);
    if (v > 0) return 'text-success';
    if (v < 0) return 'text-error';
    return 'text-gray-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <div className="loading loading-spinner loading-lg text-primary w-12 h-12"></div>
          <p className="text-base font-semibold text-gray-500">Chargement des détails...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <AlertCircle className="w-16 h-16 text-error" />
          <p className="text-xl font-semibold text-gray-700">{error || 'Ligne non trouvée'}</p>
          <button onClick={() => navigate('/tresorerie-journaliere')} className="btn btn-primary gap-2">
            <ArrowLeft className="w-4 h-4" /> Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  const fraisDetails = data.frais_details || [];
  const entreesDetails = data.entrees_details || [];
  const sortiesDetails = data.sorties_details || [];

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* Notification */}
      {notification.show && (
        <div className="fixed top-20 right-4 z-50 animate-slideDown">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl rounded-xl`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span className="font-medium">{notification.message}</span>
            </div>
            <button className="btn btn-ghost btn-xs btn-circle" onClick={() => setNotification({ ...notification, show: false })}>
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* En-tête */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <button onClick={() => navigate('/tresorerie-journaliere')} className="btn btn-ghost btn-sm gap-2 mb-2">
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Calendar className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-primary">Détail journalier</h1>
                <p className="text-sm text-gray-500">
                  {data.date} – {warehouseName}
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={fetchDetail} className="btn btn-sm sm:btn-md btn-outline gap-2">
              <RefreshCw className="w-4 h-4" /> Actualiser
            </button>
            <button
              onClick={handleExportPdf}
              disabled={pdfLoading}
              className="btn btn-sm sm:btn-md bg-gradient-to-r from-primary to-primary/80 text-white border-none shadow-lg gap-2"
            >
              {pdfLoading ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                <FileText className="w-4 h-4" />
              )}
              Exporter PDF
            </button>
          </div>
        </div>
      </div>

      {/* Cartes récapitulatives */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white shadow-md rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Solde d'ouverture</p>
              <p className="text-2xl font-bold">{formatNumber(data.solde_ouverture)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-primary/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Solde de fermeture</p>
              <p className="text-2xl font-bold">{formatNumber(data.solde_fermeture)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-primary/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Variation</p>
              <p className={`text-2xl font-bold ${getVariationColor(data.variation)}`}>
                {formatNumber(data.variation)}
              </p>
            </div>
            <TrendingUp className={`w-8 h-8 ${parseFloat(data.variation || 0) >= 0 ? 'text-success/20' : 'text-error/20'}`} />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Opérations</p>
              <p className="text-2xl font-bold">{data.nb_operations || 0}</p>
              <p className="text-xs text-gray-400">{data.nb_entrees || 0} entrées / {data.nb_sorties || 0} sorties</p>
            </div>
            <FileText className="w-8 h-8 text-primary/20" />
          </div>
        </div>
      </div>

      {/* Détail des flux - résumé */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow-md rounded-xl p-5">
          <h2 className="text-lg font-bold text-success mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" /> Entrées
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-600">Total entrées</span>
              <span className="font-bold text-success">{formatNumber(data.total_entrees)}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-600">Ventes</span>
              <span>{formatNumber(data.entrees_ventes)}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-600">Règlements</span>
              <span>{formatNumber(data.entrees_reglements)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Autres entrées</span>
              <span>{formatNumber(data.entrees_autres)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-md rounded-xl p-5">
          <h2 className="text-lg font-bold text-error mb-4 flex items-center gap-2">
            <TrendingDown className="w-5 h-5" /> Sorties
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-600">Total sorties</span>
              <span className="font-bold text-error">{formatNumber(data.total_sorties)}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-600">Achats</span>
              <span>{formatNumber(data.sorties_achats)}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-600">Frais</span>
              <span>{formatNumber(data.sorties_frais)}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-600">Salaires</span>
              <span>{formatNumber(data.sorties_salaires)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Autres sorties</span>
              <span>{formatNumber(data.sorties_autres)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== DÉTAIL DES FRAIS ==================== */}
      <div className="bg-white shadow-md rounded-xl overflow-hidden">
        <div className="bg-error/5 px-5 py-3 border-b border-error/20">
          <h2 className="text-lg font-bold text-error flex items-center gap-2">
            <Receipt className="w-5 h-5" /> Détail des frais ({fraisDetails.length})
          </h2>
        </div>
        {fraisDetails.length === 0 ? (
          <div className="p-6 text-center text-gray-400">
            <Receipt className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>Aucun frais enregistré ce jour</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th>Réf. Frais</th>
                  <th>Mouvement</th>
                  <th>Titre / Libellé</th>
                  <th>Catégorie</th>
                  <th>Bénéficiaire</th>
                  <th>Mode</th>
                  <th className="text-right">Montant</th>
                  <th>Pièce</th>
                </tr>
              </thead>
              <tbody>
                {fraisDetails.map((f, idx) => (
                  <tr key={idx} className="hover">
                    <td className="font-mono text-xs">{f.source_reference}</td>
                    <td className="font-mono text-xs">{f.mouvement_reference}</td>
                    <td className="font-medium">{f.titre || f.libelle}</td>
                    <td>
                      {f.categorie ? (
                        <span className="badge badge-ghost badge-sm gap-1">
                          <Tag className="w-3 h-3" /> {f.categorie}
                        </span>
                      ) : '-'}
                    </td>
                    <td>
                      {f.beneficiaire ? (
                        <span className="flex items-center gap-1 text-xs">
                          <User className="w-3 h-3" /> {f.beneficiaire}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="text-xs">
                      <span className="badge badge-outline badge-sm gap-1">
                        <CreditCard className="w-3 h-3" /> {f.mode_paiement}
                      </span>
                    </td>
                    <td className="text-right font-bold text-error">
                      {formatNumber(f.montant)}
                    </td>
                    <td className="text-xs text-gray-500">{f.piece_justificative || '-'}</td>
                  </tr>
                ))}
                <tr className="bg-error/10 font-bold">
                  <td colSpan="6" className="text-right">TOTAL FRAIS</td>
                  <td className="text-right text-error">{formatNumber(data.sorties_frais)}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ==================== DÉTAIL DES ENTRÉES ==================== */}
      <div className="bg-white shadow-md rounded-xl overflow-hidden">
        <div className="bg-success/5 px-5 py-3 border-b border-success/20">
          <h2 className="text-lg font-bold text-success flex items-center gap-2">
            <TrendingUp className="w-5 h-5" /> Détail des entrées ({entreesDetails.length})
          </h2>
        </div>
        {entreesDetails.length === 0 ? (
          <div className="p-6 text-center text-gray-400">
            <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>Aucune entrée enregistrée ce jour</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th>Référence</th>
                  <th>Libellé</th>
                  <th>Source</th>
                  <th>Mode</th>
                  <th>Destination</th>
                  <th>Heure</th>
                  <th className="text-right">Montant</th>
                </tr>
              </thead>
              <tbody>
                {entreesDetails.map((e, idx) => (
                  <tr key={idx} className="hover">
                    <td className="font-mono text-xs">{e.mouvement_reference}</td>
                    <td className="font-medium">{e.libelle}</td>
                    <td className="text-xs">{e.source_reference}</td>
                    <td className="text-xs">
                      <span className="badge badge-outline badge-sm">{e.mode_paiement}</span>
                    </td>
                    <td className="text-xs">
                      {e.caisse && e.caisse !== '-' ? (
                        <span className="flex items-center gap-1"><Wallet className="w-3 h-3" />{e.caisse}</span>
                      ) : e.compte_bancaire && e.compte_bancaire !== '-' ? (
                        <span className="flex items-center gap-1"><Landmark className="w-3 h-3" />{e.compte_bancaire}</span>
                      ) : '-'}
                    </td>
                    <td className="text-xs text-gray-500">{e.date_mouvement?.split(' ')[1] || '-'}</td>
                    <td className="text-right font-bold text-success">{formatNumber(e.montant)}</td>
                  </tr>
                ))}
                <tr className="bg-success/10 font-bold">
                  <td colSpan="6" className="text-right">TOTAL ENTRÉES</td>
                  <td className="text-right text-success">{formatNumber(data.total_entrees)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ==================== DÉTAIL DES SORTIES (hors frais) ==================== */}
      <div className="bg-white shadow-md rounded-xl overflow-hidden">
        <div className="bg-warning/5 px-5 py-3 border-b border-warning/20">
          <h2 className="text-lg font-bold text-warning flex items-center gap-2">
            <TrendingDown className="w-5 h-5" /> Détail des autres sorties ({sortiesDetails.length})
          </h2>
        </div>
        {sortiesDetails.length === 0 ? (
          <div className="p-6 text-center text-gray-400">
            <TrendingDown className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>Aucune autre sortie ce jour</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th>Référence</th>
                  <th>Libellé</th>
                  <th>Type source</th>
                  <th>Mode</th>
                  <th>Source</th>
                  <th>Heure</th>
                  <th className="text-right">Montant</th>
                </tr>
              </thead>
              <tbody>
                {sortiesDetails.map((s, idx) => (
                  <tr key={idx} className="hover">
                    <td className="font-mono text-xs">{s.mouvement_reference}</td>
                    <td className="font-medium">{s.libelle}</td>
                    <td className="text-xs">
                      <span className="badge badge-ghost badge-sm">{s.source_type}</span>
                    </td>
                    <td className="text-xs">
                      <span className="badge badge-outline badge-sm">{s.mode_paiement}</span>
                    </td>
                    <td className="text-xs">
                      {s.caisse && s.caisse !== '-' ? (
                        <span className="flex items-center gap-1"><Wallet className="w-3 h-3" />{s.caisse}</span>
                      ) : s.compte_bancaire && s.compte_bancaire !== '-' ? (
                        <span className="flex items-center gap-1"><Landmark className="w-3 h-3" />{s.compte_bancaire}</span>
                      ) : '-'}
                    </td>
                    <td className="text-xs text-gray-500">{s.date_mouvement?.split(' ')[1] || '-'}</td>
                    <td className="text-right font-bold text-error">{formatNumber(s.montant)}</td>
                  </tr>
                ))}
                <tr className="bg-warning/10 font-bold">
                  <td colSpan="6" className="text-right">TOTAL AUTRES SORTIES</td>
                  <td className="text-right text-error">
                    {formatNumber(sortiesDetails.reduce((acc, s) => acc + parseFloat(s.montant || 0), 0))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Métadonnées */}
      <div className="bg-white shadow-md rounded-xl p-5 text-sm text-gray-500">
        <div className="grid grid-cols-2 gap-4">
          <div><span className="font-semibold">Créé le :</span> {new Date(data.created_at).toLocaleString()}</div>
          <div><span className="font-semibold">Mis à jour :</span> {new Date(data.updated_at).toLocaleString()}</div>
          <div><span className="font-semibold">Entrepôt :</span> {warehouseName}</div>
          <div><span className="font-semibold">ID :</span> {data.id}</div>
        </div>
      </div>
    </div>
  );
};

export default TresorerieJournaliereDetail;