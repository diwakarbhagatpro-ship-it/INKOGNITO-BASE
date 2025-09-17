#!/usr/bin/env node

/**
 * InscribeMate Push Notification Setup Script
 * Configures Firebase Cloud Messaging (FCM) for push notifications
 */

const fs = require('fs');
const path = require('path');

console.log('🔔 Setting up Push Notifications for InscribeMate...\n');

// 1. Create service worker for push notifications
const serviceWorkerContent = `
// InscribeMate Service Worker
// Handles push notifications and background sync

const CACHE_NAME = 'inscribemate-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
  );
});

// Push event
self.addEventListener('push', (event) => {
  console.log('Push received:', event);
  
  const options = {
    body: event.data ? event.data.text() : 'New notification from InscribeMate',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'open',
        title: 'Open App',
        icon: '/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icon-192x192.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('InscribeMate', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Handle background sync for offline requests
  console.log('Background sync triggered');
}
`;

// 2. Create manifest.json for PWA
const manifestContent = {
  "name": "InscribeMate",
  "short_name": "InscribeMate",
  "description": "Accessibility-first scribe platform connecting blind users with volunteers",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#4F46E5",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "categories": ["education", "accessibility", "productivity"],
  "lang": "en",
  "dir": "ltr"
};

// 3. Create Firebase configuration
const firebaseConfigContent = `
// Firebase configuration for InscribeMate
// Replace with your actual Firebase project configuration

export const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);

// Get FCM token
export const getFCMToken = async () => {
  try {
    const token = await getToken(messaging, {
      vapidKey: process.env.VITE_FIREBASE_VAPID_KEY
    });
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

// Handle foreground messages
onMessage(messaging, (payload) => {
  console.log('Message received in foreground:', payload);
  
  // Show notification
  if (payload.notification) {
    new Notification(payload.notification.title, {
      body: payload.notification.body,
      icon: payload.notification.icon || '/icon-192x192.png'
    });
  }
});
`;

// 4. Create push notification utility
const pushNotificationContent = `
// Push notification utilities for InscribeMate
import { getFCMToken, messaging } from './firebase-config';
import { supabase } from './supabase';

export class PushNotificationManager {
  private static instance: PushNotificationManager;
  private token: string | null = null;

  private constructor() {}

  public static getInstance(): PushNotificationManager {
    if (!PushNotificationManager.instance) {
      PushNotificationManager.instance = new PushNotificationManager();
    }
    return PushNotificationManager.instance;
  }

  public async initialize(): Promise<void> {
    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        // Get FCM token
        this.token = await getFCMToken();
        
        if (this.token) {
          // Save token to user profile
          await this.saveTokenToProfile(this.token);
          console.log('Push notifications initialized successfully');
        }
      } else {
        console.warn('Notification permission denied');
      }
    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
  }

  private async saveTokenToProfile(token: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ push_token: token })
        .eq('id', (await supabase.auth.getUser()).data.user?.id);

      if (error) {
        console.error('Error saving push token:', error);
      }
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  }

  public getToken(): string | null {
    return this.token;
  }

  public async refreshToken(): Promise<string | null> {
    this.token = await getFCMToken();
    if (this.token) {
      await this.saveTokenToProfile(this.token);
    }
    return this.token;
  }
}

// Export singleton instance
export const pushNotificationManager = PushNotificationManager.getInstance();
`;

// Write files
const publicDir = path.join(process.cwd(), 'client', 'public');
const srcDir = path.join(process.cwd(), 'client', 'src', 'lib');

// Ensure directories exist
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}
if (!fs.existsSync(srcDir)) {
  fs.mkdirSync(srcDir, { recursive: true });
}

// Write service worker
fs.writeFileSync(path.join(publicDir, 'sw.js'), serviceWorkerContent);
console.log('✅ Service worker created: public/sw.js');

// Write manifest
fs.writeFileSync(path.join(publicDir, 'manifest.json'), JSON.stringify(manifestContent, null, 2));
console.log('✅ PWA manifest created: public/manifest.json');

// Write Firebase config
fs.writeFileSync(path.join(srcDir, 'firebase-config.ts'), firebaseConfigContent);
console.log('✅ Firebase config created: src/lib/firebase-config.ts');

// Write push notification manager
fs.writeFileSync(path.join(srcDir, 'push-notifications.ts'), pushNotificationContent);
console.log('✅ Push notification manager created: src/lib/push-notifications.ts');

// Create environment variables template
const envTemplate = `
# Add these to your .env file for push notifications
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
VITE_FIREBASE_VAPID_KEY=your_vapid_key
`;

fs.writeFileSync(path.join(process.cwd(), '.env.push-notifications'), envTemplate);
console.log('✅ Environment variables template created: .env.push-notifications');

console.log('\n🎉 Push notification setup complete!');
console.log('\nNext steps:');
console.log('1. Create a Firebase project at https://console.firebase.google.com');
console.log('2. Enable Cloud Messaging in your Firebase project');
console.log('3. Generate a VAPID key pair');
console.log('4. Copy the environment variables from .env.push-notifications to your .env file');
console.log('5. Add the service worker to your HTML: <script>navigator.serviceWorker.register("/sw.js")</script>');
console.log('6. Initialize push notifications in your app: pushNotificationManager.initialize()');
