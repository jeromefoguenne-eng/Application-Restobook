import mqtt from 'mqtt';

export class CloudSyncService {
  constructor() {
    this.client = null;
    this.topic = null;
    this.callbacks = new Set();
    this.statusCallbacks = new Set();
    this.isConnected = false;
    this.broadcastChannel = null;

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.broadcastChannel = new BroadcastChannel('restobook_channel');
      this.broadcastChannel.onmessage = (event) => {
        if (event.data) {
          this.notifyCallbacks(event.data, 'broadcast');
        }
      };
    }
  }

  connect(restaurantId) {
    if (this.client) {
      try { this.client.end(true); } catch (e) {}
    }

    this.topic = `restobook/v1/${restaurantId}/events`;
    const syncReqTopic = `restobook/v1/${restaurantId}/sync_req`;
    const syncResTopic = `restobook/v1/${restaurantId}/sync_res`;

    // Broker mondial public WSS gratuit et pérenne
    const brokerUrl = 'wss://broker.emqx.io:8084/mqtt';

    try {
      this.client = mqtt.connect(brokerUrl, {
        clientId: `restobook_${Math.random().toString(16).substring(2, 10)}`,
        clean: true,
        reconnectPeriod: 3000,
        connectTimeout: 5000
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        this.notifyStatus(true);
        this.client.subscribe([this.topic, syncReqTopic, syncResTopic], (err) => {
          if (!err) {
            console.log(`📡 Restobook Cloud Realtime connecté sur le topic: ${this.topic}`);
          }
        });
      });

      this.client.on('message', (topic, message) => {
        try {
          const payload = JSON.parse(message.toString());
          this.notifyCallbacks(payload, 'mqtt');
        } catch (err) {
          console.error('Erreur parsing MQTT:', err);
        }
      });

      this.client.on('close', () => {
        this.isConnected = false;
        this.notifyStatus(false);
      });

      this.client.on('error', (err) => {
        console.warn('MQTT Connection Notice:', err.message);
        this.isConnected = false;
        this.notifyStatus(false);
      });
    } catch (e) {
      console.warn('MQTT init error:', e);
      this.isConnected = false;
      this.notifyStatus(false);
    }
  }

  publish(data) {
    // 1. Envoyer en BroadcastChannel local (multi-onglets instantané)
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(data);
      } catch (e) {}
    }

    // 2. Envoyer sur le Cloud Realtime mondial WSS
    if (this.client && this.isConnected && this.topic) {
      try {
        this.client.publish(this.topic, JSON.stringify(data), { qos: 0 });
      } catch (e) {
        console.warn('Publish error:', e);
      }
    }
  }

  onMessage(callback) {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
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

  notifyStatus(status) {
    for (const cb of this.statusCallbacks) {
      try { cb(status); } catch (e) {}
    }
  }

  disconnect() {
    if (this.client) {
      try { this.client.end(true); } catch (e) {}
      this.client = null;
    }
    this.isConnected = false;
    this.notifyStatus(false);
  }
}

export const cloudSync = new CloudSyncService();
