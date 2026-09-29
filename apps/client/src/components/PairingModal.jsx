import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { useRestobook } from '../context/RestobookContext';
import { QrCode, Wifi, CheckCircle2, Copy, X } from 'lucide-react';

export const PairingModal = ({ isOpen, onClose }) => {
  const { sessionId, setSessionId, pairingCode, connected } = useRestobook();
  const canvasRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [inputSession, setInputSession] = useState(sessionId);

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const pairingPayload = JSON.stringify({
        app: 'restobook',
        sessionId,
        pairingCode,
        url: window.location.href
      });

      QRCode.toCanvas(canvasRef.current, pairingPayload, {
        width: 220,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      });
    }
  }, [isOpen, sessionId, pairingCode]);

  if (!isOpen) return null;

  const copyCode = () => {
    navigator.clipboard?.writeText(pairingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (inputSession.trim()) {
      setSessionId(inputSession.trim().toUpperCase());
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in overflow-y-auto"
      style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}
    >
      <div 
        className="relative w-full max-w-md max-h-[92vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl text-slate-100 my-auto"
        style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-yellow-500/10 text-yellow-400 rounded-xl border border-yellow-500/20">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Appairage Cloud & QR Code</h2>
            <p className="text-xs text-slate-400">Liez la tablette Salle et Cuisine sans fil</p>
          </div>
        </div>

        {/* Statut de connexion */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-800/70 rounded-xl mb-6 border border-slate-700/50">
          <div className="flex items-center gap-2">
            <Wifi className={`w-4 h-4 ${connected ? 'text-emerald-400' : 'text-amber-400 animate-pulse'}`} />
            <span className="text-sm font-medium">
              {connected ? 'Synchronisation Cloud Active' : 'Connexion au serveur...'}
            </span>
          </div>
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
            connected ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400'
          }`}>
            {connected ? 'En ligne' : 'En attente'}
          </span>
        </div>

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-inner mb-6 mx-auto w-fit">
          <canvas ref={canvasRef} className="rounded-lg" />
          <span className="text-[11px] font-mono font-bold text-slate-600 mt-1">
            Session: {sessionId}
          </span>
        </div>

        {/* Code numérique à 6 chiffres */}
        <div className="text-center mb-6">
          <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
            Code d'appairage direct
          </span>
          <div className="flex items-center justify-center gap-3 mt-1">
            <span className="text-3xl font-extrabold font-mono tracking-widest text-yellow-400 bg-slate-950 px-4 py-2 rounded-xl border border-yellow-500/30">
              {pairingCode}
            </span>
            <button
              onClick={copyCode}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors border border-slate-700"
              title="Copier le code"
            >
              {copied ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Formulaire pour rejoindre une autre session */}
        <form onSubmit={handleJoin} className="space-y-3 pt-3 border-t border-slate-800">
          <label className="text-xs text-slate-400 font-medium block">
            Rejoindre un autre restaurant / session :
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={inputSession}
              onChange={(e) => setInputSession(e.target.value)}
              placeholder="Ex: RESTO-LE-CENTRAL"
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500 uppercase font-mono"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold rounded-xl text-sm transition-colors shadow-lg shadow-yellow-500/20"
            >
              Rejoindre
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
