import mqtt from 'mqtt';

const GLOBAL_ACCOUNTS_TOPIC = 'restobook/cloud/v1/accounts/registry';

export class CloudSyncService {
  constructor() {
    this.client = null;
    this.currentRestaurantId = null;
    this.eventsTopic = null;
    this.stateTopic = null;
    this.callbacks = new Set();
    this.accountCallbacks = new Set();
    this.stateCallbacks = new Set();
    this.statusCallbacks = new Set();
    this.isConnected = false;
    this.broadcastChannel = null;

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.broadcastChannel = new BroadcastChannel('restobook_channel');
      this.broadcastChannel.onmessage = (event) => {
        if (event.data) {
          if (event.data.channelType === 'accounts') {
            this.notifyAccountCallbacks(event.data.payload);
          } else if (event.data.channelType === 'state') {
            if (event.data.restaurantId && event.data.restaurantId === this.currentRestaurantId) {
              this.notifyStateCallbacks(event.data.payload);
            }
          } else {
            this.notifyCallbacks(event.data, 'broadcast');
          }
        }
      };
    }

    // Démarrer la connexion Cloud globale dès le lancement
    this.initMqtt();
  }

  initMqtt() {
    if (this.client) return;

    // Broker mondial public WSS gratuit, pérenne et illimité
    const brokerUrl = 'wss://broker.emqx.io:8084/mqtt';

    try {
      this.client = mqtt.connect(brokerUrl, {
        clientId: `restobook_${Math.random().toString(16).substring(2, 10)}`,
        clean: true,
        reconnectPeriod: 3000,
        connectTimeout: 7000
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        this.notifyStatus(true);
        console.log('📡 Restobook Cloud connecté au réseau mondial WSS');

        // S'abonner au registre mondial des comptes pour synchroniser les connexions sur tous les appareils
        this.client.subscribe(GLOBAL_ACCOUNTS_TOPIC, { qos: 1 });

        // Si un restaurant est déjà sélectionné, s'abonner à ses topics
        if (this.currentRestaurantId) {
          this.subscribeRestaurantTopics(this.currentRestaurantId);
        }
      });

      this.client.on('message', (topic, message) => {
        try {
          const raw = message.toString();
          if (!raw) return;
          const parsed = JSON.parse(raw);

          // 1. Registre des comptes
          if (topic === GLOBAL_ACCOUNTS_TOPIC) {
            this.notifyAccountCallbacks(parsed);
            return;
          }

          // 2. État persistant du restaurant (retained) - strictement pour ce restaurant
          if (this.stateTopic && topic === this.stateTopic) {
            this.notifyStateCallbacks(parsed);
            return;
          }

          // 3. Événements temps réel (commandes, alarmes, sonnettes) - strictement pour ce restaurant
          if (this.eventsTopic && topic === this.eventsTopic) {
            this.notifyCallbacks(parsed, 'mqtt');
          }
        } catch (err) {
          console.warn('Erreur lecture message Cloud:', err);
        }
      });

      this.client.on('close', () => {
        this.isConnected = false;
        this.notifyStatus(false);
      });

      this.client.on('error', (err) => {
        console.warn('Notice Cloud WSS:', err?.message || err);
        this.isConnected = false;
        this.notifyStatus(false);
      });
    } catch (e) {
      console.warn('Initialisation Cloud WSS différée:', e);
    }
  }

  // Connexion à l'espace d'un restaurant spécifique
  connectRestaurant(restaurantId) {
    if (this.currentRestaurantId === restaurantId && this.eventsTopic && this.stateTopic) {
      return;
    }
    const previousRestoId = this.currentRestaurantId;
    this.currentRestaurantId = restaurantId;

    if (this.isConnected && this.client) {
      if (previousRestoId && (this.eventsTopic || this.stateTopic)) {
        try {
          this.client.unsubscribe([this.eventsTopic, this.stateTopic]);
        } catch (e) {}
      }
      this.subscribeRestaurantTopics(restaurantId);
    }
  }

  subscribeRestaurantTopics(restaurantId) {
    this.eventsTopic = `restobook/cloud/v1/restaurants/${restaurantId}/events`;
    this.stateTopic = `restobook/cloud/v1/restaurants/${restaurantId}/state`;

    this.client.subscribe([this.eventsTopic, this.stateTopic], { qos: 1 }, (err) => {
      if (!err) {
        console.log(`📡 Abonné aux topics du restaurant [${restaurantId}]`);
      }
    });
  }

  // Publier la mise à jour des comptes sur le Cloud pour tous les appareils (retained)
  publishAccounts(accountsList) {
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({ channelType: 'accounts', payload: accountsList });
      } catch (e) {}
    }

    if (this.client && this.isConnected) {
      try {
        this.client.publish(GLOBAL_ACCOUNTS_TOPIC, JSON.stringify(accountsList), { retain: true, qos: 1 });
      } catch (e) {
        console.warn('Erreur publish comptes:', e);
      }
    }
  }

  // Publier l'état complet du projet restaurant sur le Cloud (retained)
  publishProjectState(restaurantId, state) {
    const topic = `restobook/cloud/v1/restaurants/${restaurantId}/state`;

    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({ channelType: 'state', restaurantId, payload: state });
      } catch (e) {}
    }

    if (this.client && this.isConnected) {
      try {
        this.client.publish(topic, JSON.stringify(state), { retain: true, qos: 1 });
      } catch (e) {
        console.warn('Erreur sauvegarde Cloud projet:', e);
      }
    }
  }

  // Publier un événement temps réel (commande, alarme, etc.)
  publish(data) {
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(data);
      } catch (e) {}
    }

    if (this.client && this.isConnected && this.eventsTopic) {
      try {
        this.client.publish(this.eventsTopic, JSON.stringify(data), { qos: 0 });
      } catch (e) {
        console.warn('Erreur émission événement Cloud:', e);
      }
    }
  }

  onMessage(callback) {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  onAccountsSync(callback) {
    this.accountCallbacks.add(callback);
    return () => this.accountCallbacks.delete(callback);
  }

  onStateSync(callback) {
    this.stateCallbacks.add(callback);
    return () => this.stateCallbacks.delete(callback);
  }

  onStatusChange(callback) {
    this.statusCallbacks.add(callback);
    callback(this.isConnected);
    return () => this.statusCallbacks.delete(callback);
  }

  notifyCallbacks(data, source) {
    for (const cb of this.callbacks) {
      try { cb(data, source); } catch (e) { console.error(e); }
    }
  }

  notifyAccountCallbacks(accounts) {
    for (const cb of this.accountCallbacks) {
      try { cb(accounts); } catch (e) { console.error(e); }
    }
  }

  notifyStateCallbacks(state) {
    for (const cb of this.stateCallbacks) {
      try { cb(state); } catch (e) { console.error(e); }
    }
  }

  notifyStatus(status) {
    for (const cb of this.statusCallbacks) {
      try { cb(status); } catch (e) {}
    }
  }

  disconnect() {
    // Ne pas déconnecter le client global afin de maintenir la synchronisation des comptes
    this.currentRestaurantId = null;
    this.eventsTopic = null;
    this.stateTopic = null;
  }
}

export const cloudSync = new CloudSyncService();
