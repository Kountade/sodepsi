import React, { useEffect, useState } from 'react';
import AxiosInstance from '../AxiosInstance';
import { useNavigate } from 'react-router-dom';
import { Eye, Loader2 } from 'lucide-react';

const TransfertList = () => {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Récupérer les mouvements de type transfert
    const fetchTransfers = async () => {
      try {
        const token = localStorage.getItem('Token');
        const response = await AxiosInstance.get('/movements/?type=transfer_out', {
          headers: { Authorization: `Token ${token}` }
        });
        // Grouper par reference_number pour obtenir un transfert par référence
        const grouped = {};
        response.data.forEach(mvt => {
          if (mvt.reference_number) {
            if (!grouped[mvt.reference_number]) {
              grouped[mvt.reference_number] = {
                reference: mvt.reference_number,
                date: mvt.created_at,
                from: mvt.from_warehouse_name,
                to: mvt.to_warehouse_name,
                items: []
              };
            }
            grouped[mvt.reference_number].items.push({
              product: mvt.product_name,
              quantity: mvt.quantity
            });
          }
        });
        setTransfers(Object.values(grouped));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchTransfers();
  }, []);

  if (loading) return <Loader2 className="animate-spin" />;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Transferts</h1>
      <button className="btn btn-primary my-4" onClick={() => navigate('/transfert/nouveau')}>
        Nouveau transfert
      </button>
      <table className="table w-full">
        <thead>
          <tr>
            <th>Référence</th>
            <th>De</th>
            <th>Vers</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {transfers.map(t => (
            <tr key={t.reference}>
              <td>{t.reference}</td>
              <td>{t.from}</td>
              <td>{t.to}</td>
              <td>{new Date(t.date).toLocaleDateString()}</td>
              <td>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/transfert/${t.reference}`)}>
                  <Eye className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TransfertList;