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

// Each photo is stored as { src, location: { lat, lng, accuracy } | null, timestamp }.
// Older records stored photos as plain URL strings, so convert those on read.
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
    return saveItems(getItems().filter((item) => item.name !== name));
}