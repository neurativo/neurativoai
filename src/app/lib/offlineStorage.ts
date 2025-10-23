/**
 * Offline storage system using IndexedDB for study packs
 */

export interface OfflineStudyPack {
  id: string;
  metadata: any;
  notes: any[];
  flashcards: any[];
  quizzes: any[];
  lastSynced: Date;
  version: number;
}

export interface OfflineProgress {
  studyPackId: string;
  flashcards: Record<string, any>;
  notes: Record<string, any>;
  quizzes: Record<string, any>;
  lastUpdated: Date;
}

export class OfflineStorage {
  private dbName = 'StudyPackDB';
  private version = 1;
  private db: IDBDatabase | null = null;

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create study packs store
        if (!db.objectStoreNames.contains('studyPacks')) {
          const studyPacksStore = db.createObjectStore('studyPacks', { keyPath: 'id' });
          studyPacksStore.createIndex('lastSynced', 'lastSynced', { unique: false });
        }

        // Create progress store
        if (!db.objectStoreNames.contains('progress')) {
          const progressStore = db.createObjectStore('progress', { keyPath: 'studyPackId' });
          progressStore.createIndex('lastUpdated', 'lastUpdated', { unique: false });
        }

        // Create settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * Save study pack for offline use
   */
  async saveStudyPack(studyPack: OfflineStudyPack): Promise<void> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['studyPacks'], 'readwrite');
      const store = transaction.objectStore('studyPacks');
      
      const request = store.put({
        ...studyPack,
        lastSynced: new Date(),
        version: (studyPack.version || 0) + 1
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get study pack by ID
   */
  async getStudyPack(id: string): Promise<OfflineStudyPack | null> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['studyPacks'], 'readonly');
      const store = transaction.objectStore('studyPacks');
      
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all offline study packs
   */
  async getAllStudyPacks(): Promise<OfflineStudyPack[]> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['studyPacks'], 'readonly');
      const store = transaction.objectStore('studyPacks');
      
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete study pack
   */
  async deleteStudyPack(id: string): Promise<void> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['studyPacks'], 'readwrite');
      const store = transaction.objectStore('studyPacks');
      
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Save progress for offline tracking
   */
  async saveProgress(progress: OfflineProgress): Promise<void> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['progress'], 'readwrite');
      const store = transaction.objectStore('progress');
      
      const request = store.put({
        ...progress,
        lastUpdated: new Date()
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get progress for study pack
   */
  async getProgress(studyPackId: string): Promise<OfflineProgress | null> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['progress'], 'readonly');
      const store = transaction.objectStore('progress');
      
      const request = store.get(studyPackId);

      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Save setting
   */
  async saveSetting(key: string, value: any): Promise<void> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['settings'], 'readwrite');
      const store = transaction.objectStore('settings');
      
      const request = store.put({ key, value });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get setting
   */
  async getSetting(key: string): Promise<any> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['settings'], 'readonly');
      const store = transaction.objectStore('settings');
      
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result?.value || null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Check if study pack is available offline
   */
  async isOfflineAvailable(id: string): Promise<boolean> {
    const studyPack = await this.getStudyPack(id);
    return studyPack !== null;
  }

  /**
   * Get storage usage
   */
  async getStorageUsage(): Promise<{
    studyPacks: number;
    totalSize: number;
    availableSpace: number;
  }> {
    if (!this.db) await this.initialize();

    const studyPacks = await this.getAllStudyPacks();
    const totalSize = JSON.stringify(studyPacks).length;
    
    // Estimate available space (rough calculation)
    const availableSpace = 50 * 1024 * 1024 - totalSize; // 50MB limit

    return {
      studyPacks: studyPacks.length,
      totalSize,
      availableSpace: Math.max(0, availableSpace)
    };
  }

  /**
   * Clear all offline data
   */
  async clearAll(): Promise<void> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['studyPacks', 'progress', 'settings'], 'readwrite');
      
      const studyPacksStore = transaction.objectStore('studyPacks');
      const progressStore = transaction.objectStore('progress');
      const settingsStore = transaction.objectStore('settings');

      const requests = [
        studyPacksStore.clear(),
        progressStore.clear(),
        settingsStore.clear()
      ];

      let completed = 0;
      const onComplete = () => {
        completed++;
        if (completed === requests.length) {
          resolve();
        }
      };

      requests.forEach(request => {
        request.onsuccess = onComplete;
        request.onerror = () => reject(request.error);
      });
    });
  }

  /**
   * Sync progress with server when online
   */
  async syncProgress(studyPackId: string): Promise<void> {
    if (!navigator.onLine) return;

    const progress = await this.getProgress(studyPackId);
    if (!progress) return;

    try {
      const response = await fetch('/api/sync-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(progress),
      });

      if (response.ok) {
        console.log('Progress synced successfully');
      }
    } catch (error) {
      console.error('Failed to sync progress:', error);
    }
  }

  /**
   * Check for updates when online
   */
  async checkForUpdates(studyPackId: string): Promise<boolean> {
    if (!navigator.onLine) return false;

    try {
      const response = await fetch(`/api/study-pack/${studyPackId}/check-updates`);
      if (!response.ok) return false;

      const data = await response.json();
      const localStudyPack = await this.getStudyPack(studyPackId);
      
      if (!localStudyPack) return false;

      return data.version > localStudyPack.version;
    } catch (error) {
      console.error('Failed to check for updates:', error);
      return false;
    }
  }
}

// Global instance
export const offlineStorage = new OfflineStorage();

// Initialize on load
if (typeof window !== 'undefined') {
  offlineStorage.initialize().catch(console.error);
}
