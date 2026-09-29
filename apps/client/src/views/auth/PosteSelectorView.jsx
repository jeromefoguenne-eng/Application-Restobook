import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  UtensilsCrossed,
  ChefHat,
  Columns2,
  Store,
  LogOut,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Hand,
  ArrowRight,
  Sparkles
} from 'lucide-react';

const POSTES = [
  {
    id: 'salle',
    title: 'Tablette & Mobile Salle',
    shortTitle: 'Salle POS',
    badge: 'POS & Service',
    description: 'Plan de table 2D tactile, réservations, prise de commande, calcul d\'addition et alertes sonores de plats prêts en direct.',
    icon: UtensilsCrossed,
    iconEmoji: '🍽️',
    color: 'amber',
    borderColor: 'border-amber-500/50',
    bgIcon: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    btnColor: 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
  },
  {
    id: 'cuisine',
    title: 'Tablette Cuisine',
    shortTitle: 'Cuisine KDS',
    badge: 'KDS Écran Chef',
    description: 'Affichage des bons de commande en temps réel, chronomètres de cuisson, priorisation tactile et bouton "Envoyer au passe" avec alarme.',
    icon: ChefHat,
    iconEmoji: '👨‍🍳',
    color: 'emerald',
    borderColor: 'border-emerald-500/50',
    bgIcon: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    btnColor: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
  },
  {
    id: 'duo',
    title: 'Poste Duo',
    shortTitle: 'Mode Duo',
    badge: 'Direction / PC',
    description: 'Visualisez la Salle et la Cuisine côte à côte sur le même écran. Idéal pour un ordinateur de bureau, un manager ou pour tester.',
    icon: Columns2,
    iconEmoji: '💻',
    color: 'blue',
    borderColor: 'border-blue-500/50',
    bgIcon: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    btnColor: 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'
  }
];

export const PosteSelectorView = () => {
  const { currentUser, selectPoste, logout } = useAuth();
  const [rememberPoste, setRememberPoste] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  // Gestion du swipe tactile sur smartphone
  const carouselRef = useRef(null);
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);
  const isHorizontalSwipeRef = useRef(false);

  const copyCode = () => {
    if (currentUser?.restaurantCode) {
      navigator.clipboard.writeText(currentUser.restaurantCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const goToCard = (index) => {
    const targetIdx = Math.max(0, Math.min(POSTES.length - 1, index));
    setActiveCardIndex(targetIdx);

    if (carouselRef.current) {
      const cardEl = carouselRef.current.children[targetIdx];
      if (cardEl) {
        cardEl.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  };

  // Gestionnaires tactiles (Touch Gestures)
  const handleTouchStart = (e) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    isHorizontalSwipeRef.current = false;
  };

  const handleTouchMove = (e) => {
    const dx = e.touches[0].clientX - touchStartXRef.current;
    const dy = e.touches[0].clientY - touchStartYRef.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
      isHorizontalSwipeRef.current = true;
    }
  };

  const handleTouchEnd = (e) => {
    if (!isHorizontalSwipeRef.current) return;
    const endX = e.changedTouches[0].clientX;
    const deltaX = endX - touchStartXRef.current;

    if (deltaX < -35) {
      // Glissement vers la gauche -> Poste suivant
      goToCard(activeCardIndex + 1);
    } else if (deltaX > 35) {
      // Glissement vers la droite -> Poste précédent
      goToCard(activeCardIndex - 1);
    }
  };

  // Synchronisation du scroll natif (Momentum scroll) avec les indicateurs
  const handleScroll = () => {
    if (!carouselRef.current) return;
    const el = carouselRef.current;
    const scrollLeft = el.scrollLeft;
    const cardWidth = el.offsetWidth * 0.85;
    if (cardWidth > 0) {
      const newIndex = Math.round(scrollLeft / (cardWidth + 12));
      if (newIndex >= 0 && newIndex < POSTES.length && newIndex !== activeCardIndex) {
        setActiveCardIndex(newIndex);
      }
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between overflow-x-hidden overflow-y-auto selection:bg-amber-500 selection:text-slate-950 p-3 sm:p-6 md:p-8">
      {/* En-tête */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between py-3 sm:py-4 border-b border-slate-900">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-lg sm:text-xl shadow-lg shadow-amber-500/10 shrink-0">
            🍽️
          </div>
          <div>
            <span className="font-extrabold text-base sm:text-lg text-white">
              Restobook Cloud
            </span>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Store className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-bold text-amber-400 truncate max-w-[150px] sm:max-w-none">
                {currentUser?.restaurantName || 'Mon Restaurant'}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-red-400 text-xs font-bold transition-colors"
          title="Se déconnecter"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">Déconnexion</span>
        </button>
      </header>

      {/* Corps principal */}
      <main className="max-w-4xl w-full mx-auto my-auto py-4 sm:py-8">
        <div className="text-center mb-5 sm:mb-8 px-2">
          <span className="text-[10px] sm:text-xs px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold uppercase tracking-wider inline-block mb-2 sm:mb-3">
            Configuration du poste
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
            Quel rôle occupe cet appareil ?
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5 sm:mt-2 max-w-lg mx-auto">
            Sélectionnez le poste de cet appareil. Toutes les tablettes et smartphones connectés se synchronisent automatiquement en temps réel.
          </p>

          {/* Badge Code Restaurant à partager */}
          <div className="mt-3 sm:mt-4 inline-flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-2xl px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs">
            <span className="text-slate-400">Code restaurant :</span>
            <span className="font-mono font-black text-amber-400 text-xs sm:text-sm tracking-wider">
              {currentUser?.restaurantCode || 'RESTO-2026'}
            </span>
            <button
              onClick={copyCode}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Copier le code"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* VERSION MOBILE SMARTPHONE : CARROUSEL AVEC SWIPE TACTILE FLUIDE */}
        {/* ============================================================ */}
        <div className="md:hidden">
          {/* Indicateur d'aide au swipe */}
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-amber-400/90 mb-3 animate-pulse">
            <Hand className="w-4 h-4" />
            <span>Glissez avec le doigt pour choisir le poste</span>
          </div>

          {/* Conteneur Carrousel Swipe */}
          <div className="relative">
            {/* Flèche gauche mobile */}
            {activeCardIndex > 0 && (
              <button
                onClick={() => goToCard(activeCardIndex - 1)}
                className="absolute -left-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-slate-900/90 border border-slate-700 text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                aria-label="Poste précédent"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            {/* Flèche droite mobile */}
            {activeCardIndex < POSTES.length - 1 && (
              <button
                onClick={() => goToCard(activeCardIndex + 1)}
                className="absolute -right-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-slate-900/90 border border-slate-700 text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                aria-label="Poste suivant"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}

            {/* Conteneur défilant tactile avec scroll-snap */}
            <div
              ref={carouselRef}
              onScroll={handleScroll}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{
                touchAction: 'pan-x pan-y',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
              className="flex overflow-x-auto snap-x snap-mandatory gap-3 px-6 py-2 no-scrollbar scroll-smooth"
            >
              {POSTES.map((poste, idx) => {
                const Icon = poste.icon;
                const isActive = activeCardIndex === idx;

                return (
                  <div
                    key={poste.id}
                    onClick={() => goToCard(idx)}
                    className={`min-w-[82vw] max-w-[320px] snap-center shrink-0 rounded-3xl p-5 border-2 transition-all duration-300 flex flex-col justify-between ${
                      isActive
                        ? `bg-slate-900 ${poste.borderColor} shadow-2xl scale-[1.01]`
                        : 'bg-slate-900/60 border-slate-800 opacity-60 scale-95'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-12 h-12 rounded-2xl ${poste.bgIcon} flex items-center justify-center text-xl`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${poste.badgeColor}`}>
                          {poste.badge}
                        </span>
                      </div>

                      <h3 className="text-xl font-extrabold text-white mb-2">
                        {poste.title}
                      </h3>
                      <p className="text-xs text-slate-300 leading-relaxed mb-4">
                        {poste.description}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        selectPoste(poste.id, rememberPoste);
                      }}
                      className={`w-full py-3.5 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 ${poste.btnColor}`}
                    >
                      <span>Activer {poste.shortTitle}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Indicateurs de pagination (Dots cliquables) */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {POSTES.map((poste, idx) => (
              <button
                key={poste.id}
                onClick={() => goToCard(idx)}
                className={`transition-all duration-300 rounded-full ${
                  activeCardIndex === idx
                    ? 'w-7 h-2.5 bg-amber-400'
                    : 'w-2.5 h-2.5 bg-slate-700 hover:bg-slate-600'
                }`}
                title={`Aller à ${poste.title}`}
              />
            ))}
          </div>
          <div className="text-center mt-1">
            <span className="text-[11px] font-bold text-amber-400">
              {POSTES[activeCardIndex].title} ({activeCardIndex + 1}/{POSTES.length})
            </span>
          </div>
        </div>

        {/* ============================================================ */}
        {/* VERSION TABLETTE ET PC : GRILLE 3 COLONNES ORIGINALE */}
        {/* ============================================================ */}
        <div className="hidden md:grid md:grid-cols-3 gap-5">
          {POSTES.map((poste) => {
            const Icon = poste.icon;
            return (
              <button
                key={poste.id}
                onClick={() => selectPoste(poste.id, rememberPoste)}
                className="group relative bg-slate-900/90 hover:bg-slate-850 border-2 border-slate-800 hover:border-amber-500/60 rounded-3xl p-6 text-left transition-all duration-200 hover:shadow-2xl hover:shadow-amber-500/10 flex flex-col justify-between active:scale-[0.98]"
              >
                <div className={`w-14 h-14 rounded-2xl ${poste.bgIcon} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-7 h-7" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-extrabold text-white group-hover:text-amber-400 transition-colors">
                      {poste.title}
                    </h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${poste.badgeColor}`}>
                      {poste.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    {poste.description}
                  </p>
                </div>

                <div className="flex items-center text-xs font-bold text-amber-400 gap-1.5 pt-3 border-t border-slate-800 group-hover:translate-x-1 transition-transform">
                  <span>Activer ce poste</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Option Mémorisation */}
        <div className="mt-6 sm:mt-8 text-center px-4">
          <label className="inline-flex items-center gap-2 cursor-pointer select-none text-xs text-slate-400 hover:text-slate-300">
            <input
              type="checkbox"
              checked={rememberPoste}
              onChange={(e) => setRememberPoste(e.target.checked)}
              className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
            />
            <span>Mémoriser ce poste sur cet appareil (ouvrira directement cet écran au lancement)</span>
          </label>
        </div>
      </main>

      {/* Pied de page */}
      <footer className="text-center py-3 sm:py-4 text-xs text-slate-500 border-t border-slate-900">
        <span>Vous pourrez changer de poste à tout moment depuis le menu en haut de l'écran.</span>
      </footer>
    </div>
  );
};
