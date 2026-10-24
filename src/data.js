import { deletePhoto, savePhoto } from "./photos";

// starter items for someone opening LastLook for the first time
export const ITEMS = [
    { name: "key", icon: "🔑" },
    { name: "wallet", icon: "👛" },
    { name: "card", icon: "💳" },
    { name: "phone", icon: "📱" },
    { name: "laptop", icon: "💻" },
    { name: "tablet", icon: "📱" },
]

const STORAGE_KEY = "lastlook-items";

// Each photo is stored as { id, location: { lat, lng, accuracy } | null, timestamp },
// where id points to the image in IndexedDB (see photos.js).
// Older records have { src } instead of an id, or are plain URL strings, so convert those on read.
function normalizeItem(item) {
    return {
        ...item,
        // records saved before items had icons borrow the starter icon, or get a box
        icon: item.icon ?? ITEMS.find((starter) => starter.name === item.name)?.icon ?? "📦",
        img: (item.img ?? []).map((img) => (typeof img === "string" ? { src: img } : img)),
        // items with no photos yet have no date
        date: item.date ? new Date(item.date) : null,
    };
}

function getInitialItems() {
    return ITEMS.map(normalizeItem);
}

export function getItems() {
    const storedItems = localStorage.getItem(STORAGE_KEY);
    if (storedItems === null) {
        return getInitialItems();
    }

    try {
        const items = JSON.parse(storedItems);
        return Array.isArray(items)
            ? items.map(normalizeItem)
            : getInitialItems();
    } catch {
        return getInitialItems();
    }
}

function saveItems(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    return items;
}

export function addItem(item) {
    return saveItems([...getItems(), normalizeItem(item)]);
}

export function updateItem(name, updates) {
    const items = getItems();
    const itemIndex = items.findIndex((item) => item.name === name);
    if (itemIndex === -1) {
        return null;
    }

    const updatedItem = { ...items[itemIndex], ...updates };
    items[itemIndex] = updatedItem;
    saveItems(items);
    return updatedItem;
}

// names are unique (they're used in the item's URL), so the name is enough to find it
export function deleteItem(name) {
    const items = getItems();
    // also remove this item's photos from IndexedDB so they don't take up space
    items
        .find((item) => item.name === name)
        ?.img.forEach((img) => img.id && deletePhoto(img.id).catch(() => {}));
    return saveItems(items.filter((item) => item.name !== name));
}

// Older versions kept each photo inside localStorage as a data URL, which fills it up fast.
// This moves those photos into IndexedDB and keeps only their ids in localStorage.
// It runs once at startup; after that there's nothing left to move.
export async function movePhotosToIndexedDB() {
    for (const item of getItems()) {
        if (!item.img.some((img) => img.src?.startsWith("data:"))) {
            continue;
        }

        const img = [];
        for (const photo of item.img) {
            if (!photo.src?.startsWith("data:")) {
                img.push(photo);
                continue;
            }
            try {
                // fetch turns a data URL back into a Blob
                const blob = await (await fetch(photo.src)).blob();
                const id = crypto.randomUUID();
                await savePhoto(id, blob);
                // keep the location and time, swap src for the id
                const moved = { ...photo, id };
                delete moved.src;
                img.push(moved);
            } catch {
                // if it can't be moved, leave it where it is; it still displays fine
                img.push(photo);
            }
        }
        updateItem(item.name, { img });
    }
}