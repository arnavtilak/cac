import { useRef, useState } from 'react';
import { Link } from 'react-router';
import { addItem as saveItem, deleteItem as removeItem, getItems } from '../data';
import { photoToDataUrl } from '../image';

export default function HomePage() {

    let [items, setItems] = useState(getItems);
    let [name, setName] = useState("");
    let [img, setImg] = useState("");
    let [selectedPhoto, setSelectedPhoto] = useState(null);
    let [addItemError, setAddItemError] = useState("");
    let [isAddingItem, setIsAddingItem] = useState(false);
    let [itemToDelete, setItemToDelete] = useState(null);
    const addItemDialog = useRef(null);
    const photoInput = useRef(null);
    const deleteDialog = useRef(null);

    async function addItem(event) {
        event.preventDefault();
        setAddItemError("");

        if (!name.trim()) {
            setAddItemError("Enter an item name.");
            return;
        }
        if (!img.trim() && !selectedPhoto) {
            setAddItemError("Choose a photo or enter an image URL.");
            return;
        }
        if (img.trim() && selectedPhoto) {
            setAddItemError("Choose a photo or enter a URL, not both.");
            return;
        }

        setIsAddingItem(true);
        try {
            const image = selectedPhoto ? await photoToDataUrl(selectedPhoto) : img.trim();
            setItems(saveItem({ name: name.trim(), img: [image], date: new Date() }));
            setName("");
            setImg("");
            setSelectedPhoto(null);
            if (photoInput.current) {
                photoInput.current.value = "";
            }
            addItemDialog.current?.close();
        } catch {
            setAddItemError("Could not save this photo. Try a smaller photo or another image URL.");
        } finally {
            setIsAddingItem(false);
        }
    }

    function confirmDelete() {
        if (itemToDelete) {
            setItems(removeItem(itemToDelete));
        }
        deleteDialog.current?.close();
    }

    return (
        <div className="bg-base-100 flex-grow flex flex-col justify-center items-center">
            <div className="text-xl font-bold bg-base-300 w-full p-5 text-center">LastLook</div>
            <div className="text-xl font-bold m-5 p-1">Your last items:</div>
            <div className="space-y-5 px-5">
                {items.map((item) =>
                    <Item
                        key={`${item.name}-${item.date.getTime()}`}
                        item={item}
                        onDelete={() => {
                            setItemToDelete(item);
                            deleteDialog.current?.showModal();
                        }}
                    />
                )}
            </div>
            <div className="flex justify-end w-full p-5">
                <button className="btn btn-info btn-circle" onClick={() => addItemDialog.current?.showModal()}>+</button>
            </div>
            <dialog
                ref={addItemDialog}
                className="modal"
                onClose={() => {
                    setName("");
                    setImg("");
                    setSelectedPhoto(null);
                    setAddItemError("");
                    if (photoInput.current) {
                        photoInput.current.value = "";
                    }
                }}
            >
                <div className="modal-box">
                    <h3 className="font-bold text-lg">Add Item</h3>
                    <form onSubmit={addItem} className="mt-4 space-y-4">
                        <label className="form-control w-full">
                            <span className="label-text mb-2">Item name</span>
                            <input
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                type="text"
                                placeholder="Item name"
                                className="input input-bordered w-full"
                            />
                        </label>
                        <label className="form-control w-full">
                            <span className="label-text mb-2">Choose a photo from your device</span>
                            <input
                                ref={photoInput}
                                type="file"
                                accept="image/*"
                                className="file-input file-input-bordered w-full"
                                onChange={(event) => {
                                    setSelectedPhoto(event.target.files?.[0] ?? null);
                                    setAddItemError("");
                                }}
                            />
                        </label>
                        <div className="divider">OR</div>
                        <label className="form-control w-full">
                            <span className="label-text mb-2">Use an image URL</span>
                            <input
                                value={img}
                                onChange={(event) => {
                                    setImg(event.target.value);
                                    setAddItemError("");
                                }}
                                type="url"
                                placeholder="https://example.com/photo.jpg"
                                className="input input-bordered w-full"
                            />
                        </label>
                        {addItemError && <p role="alert" className="text-sm text-error">{addItemError}</p>}
                        <div className="modal-action">
                            <button
                                type="button"
                                className="btn"
                                disabled={isAddingItem}
                                onClick={() => addItemDialog.current?.close()}
                            >
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-info" disabled={isAddingItem}>
                                {isAddingItem ? "Adding..." : "Add item"}
                            </button>
                        </div>
                    </form>
                </div>
            </dialog>
            <dialog
                ref={deleteDialog}
                className="modal"
                onClose={() => setItemToDelete(null)}
            >
                <div className="modal-box max-w-sm">
                    <h3 className="font-bold text-lg">Delete {itemToDelete?.name}?</h3>
                    <p className="py-3">This will permanently delete this item and its saved images.</p>
                    <div className="modal-action">
                        <button type="button" className="btn" onClick={() => deleteDialog.current?.close()}>
                            Cancel
                        </button>
                        <button type="button" className="btn btn-error" onClick={confirmDelete}>
                            Delete
                        </button>
                    </div>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button>close</button>
                </form>
            </dialog>
        </div>
    );
}

function Item({ item, onDelete }) {

    return (
        <div className="card bg-base-300 w-96 shadow-sm relative">
            <Link to={`/item/${item.name}`}>
                <figure>
                    <img
                        src={item.img[0]}
                        alt={item.name} />
                </figure>
                <div className="card-body">
                    <h2 className="card-title">{item.name}</h2>
                    <div>{item.date.toLocaleDateString()}</div>
                    <div className="h2">Here is where you last left it, if its not there click on the photo and check where else you might've left it recently.</div>
                </div>
            </Link>
            <button
                type="button"
                className="btn btn-error btn-sm absolute top-3 right-3"
                onClick={onDelete}
                aria-label={`Delete ${item.name}`}
            >
                Delete
            </button>
        </div>
    );
}