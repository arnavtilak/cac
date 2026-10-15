export const ITEMS = [
    {
        img: ["https://images.unsplash.com/photo-1636572481914-a07d36917486?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", "https://images.unsplash.com/photo-1595147389795-37094173bfd8?w=700&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8aW1hZ2V8ZW58MHx8MHx8fDA%3D", "https://images.unsplash.com/photo-1633265486064-086b219458ec?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", "https://images.unsplash.com/photo-1642364575782-b570e8a534b0?w=700&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjR8fGltYWdlfGVufDB8fDB8fHww"],
        name: "goggles",
        date: new Date("2026-10-01")
    },
]

const STORAGE_KEY = "lastlook-items";

function getInitialItems() {
    return ITEMS.map((item) => ({ ...item, date: new Date(item.date) }));
}

export function getItems() {
    const storedItems = localStorage.getItem(STORAGE_KEY);
    if (storedItems === null) {
        return getInitialItems();
    }

    try {
        const items = JSON.parse(storedItems);
        return Array.isArray(items)
            ? items.map((item) => ({ ...item, date: new Date(item.date) }))
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
    return saveItems([...getItems(), item]);
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

export function deleteItem(itemToDelete) {
    const items = getItems();
    const itemIndex = items.findIndex((item) =>
        item.name === itemToDelete.name &&
        item.date.getTime() === itemToDelete.date.getTime()
    );
    if (itemIndex === -1) {
        return items;
    }

    items.splice(itemIndex, 1);
    return saveItems(items);
}