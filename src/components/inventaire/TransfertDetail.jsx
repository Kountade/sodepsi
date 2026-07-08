import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import { ArrowLeft, Loader2 } from 'lucide-react';

const TransfertDetail = () => {
  const { reference } = useParams();
  const [transfer, setTransfer] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTransfer = async () => {
      try {
        const token = localStorage.getItem('Token');
        const response = await AxiosInstance.get(`/movements/?reference_number=${reference}`, {
          headers: { Authorization: `Token ${token}` }
        });
        // Regrouper les mouvements par référence
        const items = response.data.map(m => ({
          product: m.product_name,
          quantity: m.quantity,
          type: m.movement_type,
          lot: m.lot_number
        }));
        setTransfer({
          reference: reference,
          date: response.data[0]?.created_at,
          from: response.data[0]?.from_warehouse_name,
          to: response.data[0]?.to_warehouse_name,
          items
        });
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchTransfer();
  }, [reference]);

  if (loading) return <Loader2 className="animate-spin" />;
  if (!transfer) return <div>Transfert non trouvé</div>;

  return (
    <div className="p-6">
      <button className="btn btn-ghost mb-4" onClick={() => navigate('/transferts')}>
        <ArrowLeft className="w-4 h-4" /> Retour
      </button>
      <div className="bg-white shadow rounded p-6">
        <h1 className="text-2xl font-bold">Transfert {transfer.reference}</h1>
        <p>De : {transfer.from}</p>
        <p>Vers : {transfer.to}</p>
        <p>Date : {new Date(transfer.date).toLocaleString()}</p>
        <table className="table w-full mt-4">
          <thead>
            <tr>
              <th>Produit</th>
              <th>Quantité</th>
              <th>Type</th>
              <th>Lot</th>
            </tr>
          </thead>
          <tbody>
            {transfer.items.map((item, idx) => (
              <tr key={idx}>
                <td>{item.product}</td>
                <td>{item.quantity}</td>
                <td>{item.type === 'transfer_out' ? 'Sortie' : 'Entrée'}</td>
                <td>{item.lot || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransfertDetail;