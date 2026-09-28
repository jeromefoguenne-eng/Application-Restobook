/**
 * Moteur Audio Temps Réel (Web Audio API)
 * Génération synthétique de carillon de service et d'alarme de cuisine
 * Aucune dépendance de fichier externe, latence 0 ms, 100% fiable.
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.alarmInterval = null;
    this.isAlarmRunning = false;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Carillon de cloche de service de restaurant ("Ding-Ding !" métallique et résonant)
   */
  playBellChime() {
    try {
      this.init();
      const now = this.ctx.currentTime;

      // Fréquences métalliques riches (harmoniques d'une vraie cloche de passe-plat)
      const freqs = [1046.5, 2093.0, 3135.9]; // Do6, Do7, Sol7

      freqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        const initialGain = 0.3 / (idx + 1);
        gain.gain.setValueAtTime(initialGain, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 1.2);
      });

      // Deuxième coup 140ms plus tard ("Ding... Ding !")
      setTimeout(() => {
        if (!this.ctx) return;
        const secondNow = this.ctx.currentTime;
        freqs.forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq * 1.05, secondNow);

          const initialGain = 0.4 / (idx + 1);
          gain.gain.setValueAtTime(initialGain, secondNow);
          gain.gain.exponentialRampToValueAtTime(0.0001, secondNow + 1.5);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(secondNow);
          osc.stop(secondNow + 1.5);
        });
      }, 140);
    } catch (e) {
      console.warn('Audio non autorisé par le navigateur ou erreur context:', e);
    }
  }

  /**
   * Bip discret de confirmation d'envoi de commande
   */
  playOrderSentTone() {
    try {
      this.init();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, now); // Ré5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // La5

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
    } catch (e) {
      console.warn(e);
    }
  }

  /**
   * Alarme d'urgence continue : sonne toutes les 2.5 secondes tant que le serveur n'acquitte pas !
   */
  startKitchenAlarm() {
    if (this.isAlarmRunning) return;
    this.isAlarmRunning = true;
    this.playBellChime();

    this.alarmInterval = setInterval(() => {
      if (this.isAlarmRunning) {
        this.playBellChime();
      }
    }, 2800);
  }

  /**
   * Coupe l'alarme immédiatement (bouton "J'arrive / Récupéré" en salle)
   */
  stopKitchenAlarm() {
    this.isAlarmRunning = false;
    if (this.alarmInterval) {
      clearInterval(this.alarmInterval);
      this.alarmInterval = null;
    }
  }
}

export const soundEngine = new SoundEngine();
