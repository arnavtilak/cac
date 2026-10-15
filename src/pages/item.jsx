import { useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { addItem, getItems, updateItem } from "../data";
import { photoToDataUrl } from "../image";
import { getCurrentLocation } from "../location";

export default function ItemPage() {
    const { v } = useParams();
    // key resets the page state when the URL changes (e.g. after renaming)
    return <ItemView key={v} v={v} />;
}

function ItemView({ v }) {
    const navigate = useNavigate();
    // items with no saved record yet start out empty so photos can still be added
    const [item, setItem] = useState(
        () => getItems().find((i) => i.name === v) ?? { name: v, img: [], date: null }
    );
    const [imageUrl, setImageUrl] = useState("");
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [imageError, setImageError] = useState("");
    const [cameraError, setCameraError] = useState("");
    const [isAddingImage, setIsAddingImage] = useState(false);
    const [imageIndexToDelete, setImageIndexToDelete] = useState(null);
    const [newName, setNewName] = useState(item.name);
    const photoInput = useRef(null);
    const cameraInput = useRef(null);
    const deleteImageDialog = useRef(null);

    // photos are stored newest first, so this is the most recent stored position
    const lastLocation = item.img.find((img) => img.location)?.location;

    async function saveImage(source) {
        const [src, location] = await Promise.all([
            typeof source === "string" ? source : photoToDataUrl(source),
            getCurrentLocation(),
        ]);
        const timestamp = new Date();
        const updates = {
            img: [{ src, location, timestamp: timestamp.toISOString() }, ...item.img],
            date: timestamp,
        };

        let updatedItem = updateItem(v, updates);
        if (!updatedItem) {
            // first record for this item
            updatedItem = { name: v, ...updates };
            addItem(updatedItem);
        }
        setItem(updatedItem);
    }

    async function addImage(event) {
        event.preventDefault();
        setImageError("");

        if (!imageUrl.trim() && !selectedPhoto) {
            setImageError("Choose a photo or enter an image URL.");
            return;
        }
        if (imageUrl.trim() && selectedPhoto) {
            setImageError("Choose a photo or enter a URL, not both.");
            return;
        }

        setIsAddingImage(true);
        try {
            await saveImage(selectedPhoto ?? imageUrl.trim());
            setImageUrl("");
            setSelectedPhoto(null);
            setImageError("");
            if (photoInput.current) {
                photoInput.current.value = "";
            }
            document.getElementById("my_modal_2")?.close();
        } catch {
            setImageError("Could not save this photo. Try a smaller photo or another image URL.");
        } finally {
            setIsAddingImage(false);
        }
    }

    async function addCameraPhoto(event) {
        const photo = event.target.files?.[0];
        event.target.value = "";
        if (!photo) {
            return;
        }

        setCameraError("");
        setIsAddingImage(true);
        try {
            await saveImage(photo);
        } catch {
            setCameraError("Could not save this photo. Try again.");
        } finally {
            setIsAddingImage(false);
        }
    }

    function openAddImage() {
        // on phones, go straight to the camera; otherwise show the upload dialog
        const isPhone = window.matchMedia("(pointer: coarse)").matches;
        if (isPhone && cameraInput.current) {
            cameraInput.current.click();
        } else {
            document.getElementById("my_modal_2").showModal();
        }
    }

    function handleEditName(ev) {
        ev.preventDefault();
        const name = newName.trim();
        if (!name) {
            return;
        }
        updateItem(v, { name });
        document.getElementById("my_modal_3")?.close();
        navigate(`/item/${name}`, { replace: true });
    }

    function confirmDeleteImage() {
        if (imageIndexToDelete === null || item.img.length <= 1) {
            deleteImageDialog.current?.close();
            return;
        }

        const updatedItem = updateItem(v, {
            img: item.img.filter((_, index) => index !== imageIndexToDelete),
        });
        if (updatedItem) {
            setItem(updatedItem);
        }
        deleteImageDialog.current?.close();
    }


    return (
        <div className="flex-grow flex flex-col items-center relative">
            <header className="w-full max-w-3xl px-4 pt-8 pb-5">
                <p className="text-sm font-medium text-info">LastLook item</p>
                <h1 className="mt-1 text-3xl font-bold">{item.name} <button onClick={() => document.getElementById('my_modal_3').showModal()} className="btn btn-warning btn-xs">Edit</button></h1>
                <p className="mt-2 text-sm text-base-content/70">
                    {item.date ? (
                        <>
                            Last seen{" "}
                            <time className="font-medium text-base-content">
                                {item.date.toLocaleDateString(undefined, {
                                    month: "long",
                                    day: "numeric",
                                    year: "numeric",
                                })}
                            </time>
                        </>
                    ) : (
                        "No records yet"
                    )}
                </p>
                <div className="mt-5">
                    {lastLocation ? (
                        <iframe
                            title={`Map of where ${item.name} was last seen`}
                            src={`https://maps.google.com/maps?q=${lastLocation.lat},${lastLocation.lng}&z=17&output=embed`}
                            className="h-72 w-full rounded-box"
                            style={{ border: 0 }}
                            loading="lazy"
                            referrerPolicy="strict-origin-when-cross-origin"
                        ></iframe>
                    ) : (
                        <div className="flex h-24 w-full items-center justify-center rounded-box bg-base-200 text-sm text-base-content/70">
                            No location saved yet
                        </div>
                    )}
                </div>
                {cameraError && <p role="alert" className="mt-3 text-sm text-error">{cameraError}</p>}
                <h2 className="mt-7 border-b border-base-300 pb-2 text-lg font-semibold">
                    Saved locations
                </h2>
            </header>
            <ul className="flex w-full max-w-3xl flex-col gap-4 px-4 pb-24">
                {item.img.length === 0 && (
                    <li className="py-8 text-center text-sm text-base-content/70">
                        No photos yet. Press + to add one.
                    </li>
                )}
                {item.img.map((img, index) => (
                    <li key={`${img.src}-${index}`} className="relative w-full">
                        <img
                            src={img.src}
                            alt={`${item.name}, saved location ${index + 1}`}
                            className="max-h-[32rem] w-full bg-base-200 object-contain"
                        />
                        <p className="mt-1 text-xs text-base-content/70">
                            {img.timestamp ? new Date(img.timestamp).toLocaleString() : "Unknown time"}
                            {" · "}
                            {img.location
                                ? `${img.location.lat.toFixed(5)}, ${img.location.lng.toFixed(5)}`
                                : "No location"}
                        </p>
                        <button
                            type="button"
                            className="btn btn-error btn-sm absolute right-3 top-3"
                            aria-label={`Delete image ${index + 1}`}
                            disabled={item.img.length <= 1}
                            onClick={() => {
                                setImageIndexToDelete(index);
                                deleteImageDialog.current?.showModal();
                            }}
                        >
                            Delete
                        </button>
                    </li>
                ))}
            </ul>
            <button className="btn btn-info btn-circle absolute bottom-24 right-5" onClick={openAddImage} disabled={isAddingImage}>
                {isAddingImage ? <span className="loading loading-spinner loading-sm"></span> : "+"}
            </button>
            {/* capture opens the camera on phones; browsers without one fall back to a file picker */}
            <input
                ref={cameraInput}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={addCameraPhoto}
            />
            {/* Open the modal using document.getElementById('ID').showModal() method */}
            <dialog
                id="my_modal_2"
                className="modal"
                onClose={() => {
                    setImageUrl("");
                    setSelectedPhoto(null);
                    setImageError("");
                    if (photoInput.current) {
                        photoInput.current.value = "";
                    }
                }}
            >
                <div className="modal-box">
                    <h3 className="font-bold text-lg">Add a saved location</h3>
                    <form onSubmit={addImage} className="mt-4 space-y-4">
                        <label className="form-control w-full">
                            <span className="label-text mb-2">Choose from your device</span>
                            <input
                                ref={photoInput}
                                type="file"
                                accept="image/*"
                                className="file-input file-input-bordered w-full"
                                onChange={(event) => {
                                    setSelectedPhoto(event.target.files?.[0] ?? null);
                                    setImageError("");
                                }}
                            />
                        </label>
                        <div className="divider">OR</div>
                        <label className="form-control w-full">
                            <span className="label-text mb-2">Use an image URL</span>
                            <input
                                value={imageUrl}
                                onChange={(event) => {
                                    setImageUrl(event.target.value);
                                    setImageError("");
                                }}
                                type="url"
                                placeholder="https://example.com/photo.jpg"
                                className="input input-bordered w-full"
                            />
                        </label>
                        {imageError && <p role="alert" className="text-sm text-error">{imageError}</p>}
                        <button type="submit" className="btn btn-info" disabled={isAddingImage}>
                            {isAddingImage ? "Adding..." : "Add photo"}
                        </button>
                    </form>
                    <div className="modal-action">
                        <form method="dialog">
                            <button type="submit" className="btn">Close</button>
                        </form>
                    </div>
                </div>
            </dialog>
            <dialog
                ref={deleteImageDialog}
                className="modal"
                onClose={() => setImageIndexToDelete(null)}
            >
                <div className="modal-box max-w-sm">
                    <h3 className="font-bold text-lg">Delete this image?</h3>
                    <p className="py-3">This saved location image will be removed.</p>
                    <div className="modal-action">
                        <button type="button" className="btn" onClick={() => deleteImageDialog.current?.close()}>
                            Cancel
                        </button>
                        <button type="button" className="btn btn-error" onClick={confirmDeleteImage}>
                            Delete
                        </button>
                    </div>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button>close</button>
                </form>
            </dialog>
            <dialog
                id="my_modal_3"
                className="modal"
                onClose={() => {
                    setNewName(item.name);
                }}
            >
                <div className="modal-box">
                    <h3 className="font-bold text-lg">Edit Name</h3>
                    <form onSubmit={handleEditName} className="mt-4 space-y-4">
                        <label className="form-control w-full">
                            <span className="label-text mb-2">New Name</span>
                            <input
                                value={newName}
                                onChange={(event) => {
                                    setNewName(event.target.value);
                                }}
                                type="text"
                                placeholder="Enter new name"
                                className="input input-bordered w-full"
                            />
                        </label>
                        <button type="submit" className="btn btn-info">
                            Save
                        </button>
                    </form>
                    <div className="modal-action">
                        <form method="dialog">
                            <button type="submit" className="btn">Close</button>
                        </form>
                    </div>
                </div>
            </dialog>
            <nav className="p-5 space-x-3 flex justify-center w-full bg-base-300">
                <Link to="/">
                    <button className="btn btn-ghost">Home</button>
                </Link>
            </nav>
        </div>
    );
}
