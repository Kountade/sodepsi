// src/components/common/QRCodeViewer.jsx
import React from 'react';
import { X, Download, ExternalLink } from 'lucide-react';

const QRCodeViewer = ({ qrCodeUrl, qrCodeData, title, onClose }) => {
  if (!qrCodeUrl) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `${title || 'qrcode'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 animate-scaleIn">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">{title || 'QR Code'}</h3>
          <button 
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex justify-center p-4 bg-gray-50 rounded-xl border border-gray-200">
          <img 
            src={qrCodeUrl} 
            alt="QR Code" 
            className="w-64 h-64 object-contain"
          />
        </div>
        
        {qrCodeData && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200 max-h-24 overflow-auto">
            <p className="text-xs text-gray-500 font-mono break-all">
              {qrCodeData}
            </p>
          </div>
        )}
        
        <div className="mt-4 text-center text-sm text-gray-500">
          Scannez ce QR Code pour accéder aux détails
        </div>
        
        <div className="mt-4 flex gap-2">
          <button 
            onClick={() => window.open(qrCodeUrl, '_blank')}
            className="btn btn-primary btn-sm flex-1 gap-2"
          >
            <ExternalLink className="w-4 h-4" /> Ouvrir
          </button>
          <button 
            onClick={handleDownload}
            className="btn btn-outline btn-sm flex-1 gap-2"
          >
            <Download className="w-4 h-4" /> Télécharger
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRCodeViewer;