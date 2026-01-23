import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

interface BackstageDB extends DBSchema {
    appState: {
        key: string;
        value: any;
    };
}

let dbPromise: Promise<IDBPDatabase<BackstageDB>> | null = null;

function getDB() {
    if (!dbPromise) {
        dbPromise = openDB<BackstageDB>('backstage-db', 1, {
            upgrade(db) {
                // Create object stores
                if (!db.objectStoreNames.contains('appState')) {
                    db.createObjectStore('appState');
                }
            },
        });
    }
    return dbPromise;
}

export async function getItem<T>(key: string): Promise<T | undefined> {
    try {
        const db = await getDB();
        return await db.get('appState', key);
    } catch (error) {
        console.error('Error getting item from IndexedDB:', error);
        return undefined;
    }
}

export async function setItem<T>(key: string, value: T): Promise<void> {
    try {
        const db = await getDB();
        await db.put('appState', value, key);
    } catch (error) {
        console.error('Error setting item in IndexedDB:', error);
    }
}

export async function removeItem(key: string): Promise<void> {
    try {
        const db = await getDB();
        await db.delete('appState', key);
    } catch (error) {
        console.error('Error removing item from IndexedDB:', error);
    }
}

export async function clear(): Promise<void> {
    try {
        const db = await getDB();
        await db.clear('appState');
    } catch (error) {
        console.error('Error clearing IndexedDB:', error);
    }
}
