/**
 * IndexedDB-backed offline storage for daily log drafts.
 * Autosaves per field, syncs when online.
 */

const DB_NAME = "irontrack-daily-logs";
const DB_VERSION = 1;
const STORE_NAME = "drafts";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "key" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Key format: "projectId:logDate"
function draftKey(projectId: string, logDate: string): string {
  return `${projectId}:${logDate}`;
}

export async function saveDraft(
  projectId: string,
  logDate: string,
  data: Record<string, any>
): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);

  const key = draftKey(projectId, logDate);
  const existing = await new Promise<any>((resolve) => {
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });

  const merged = {
    key,
    projectId,
    logDate,
    ...(existing || {}),
    ...data,
    updatedAt: Date.now(),
  };

  store.put(merged);
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function loadDraft(
  projectId: string,
  logDate: string
): Promise<Record<string, any> | null> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readonly");
  const store = tx.objectStore(STORE_NAME);
  const key = draftKey(projectId, logDate);

  return new Promise((resolve) => {
    const req = store.get(key);
    req.onsuccess = () => {
      db.close();
      resolve(req.result || null);
    };
    req.onerror = () => {
      db.close();
      resolve(null);
    };
  });
}

export async function deleteDraft(
  projectId: string,
  logDate: string
): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  store.delete(draftKey(projectId, logDate));
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

/**
 * Save a photo blob offline for later upload
 */
export async function saveOfflinePhoto(
  projectId: string,
  logDate: string,
  photoId: string,
  blob: Blob,
  meta: { activityId?: string; caption?: string; gpsLat?: number; gpsLon?: number }
): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  const key = `photo:${projectId}:${logDate}:${photoId}`;

  store.put({
    key,
    projectId,
    logDate,
    photoId,
    blob,
    ...meta,
    createdAt: Date.now(),
  });

  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}
