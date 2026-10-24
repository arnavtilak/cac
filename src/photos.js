// Photos are stored as Blobs in IndexedDB, the browser's built-in database.
// It has far more room than localStorage (which only holds about 5 MB).
// Each photo is saved under an id; the item records in localStorage just keep that id.

const DB_NAME = "lastlook";
const STORE = "photos";

let dbPromise = null;

function openDb() {
    // open the database once and reuse it
    dbPromise ??= new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        // runs the first time (or when the version number goes up) to create the photo store
        request.onupgradeneeded = () => request.result.createObjectStore(STORE);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
    // ask the browser not to clear our data when the device is low on space
    navigator.storage?.persist?.();
    return dbPromise;
}

// Runs one action on the photo store and resolves once the browser has finished it.
async function run(mode, action) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE, mode);
        const request = action(transaction.objectStore(STORE));
        transaction.oncomplete = () => resolve(request.result);
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error);
    });
}

export function savePhoto(id, blob) {
    return run("readwrite", (store) => store.put(blob, id));
}

// Resolves to the photo's Blob, or undefined if there's no photo with that id.
export function loadPhoto(id) {
    return run("readonly", (store) => store.get(id));
}

export function deletePhoto(id) {
    return run("readwrite", (store) => store.delete(id));
}
