import { useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { addItem, getItems, updateItem } from "../data";
import { photoToDataUrl } from "../image";
import { getCurrentLocation } from "../location";
import { ArrowLeftIcon, CameraIcon, PencilIcon, TrashIcon } from "../icons";

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
    const [photoError, setPhotoError] = useState("");
    const [isAddingImage, setIsAddingImage] = useState(false);
    const [imageIndexToDelete, setImageIndexToDelete] = useState(null);
    const [newName, setNewName] = useState(item.name);
    const photoInput = useRef(null);
    // location lookup started when the camera button is tapped
    const locationRequest = useRef(null);
    const deleteImageDialog = useRef(null);

    // photos are stored newest first, so this is the most recent stored position
    const lastLocation = item.img.find((img) => img.location)?.location;

    async function saveImage(photo) {
        const [src, location] = await Promise.all([
            photoToDataUrl(photo),
            locationRequest.current ?? getCurrentLocation(),
        ]);
        locationRequest.current = null;
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

    async function addPhoto(event) {
        const photo = event.target.files?.[0];
        // clear the input so picking the same photo again still counts as a change
        event.target.value = "";
        if (!photo) {
            return;
        }

        setPhotoError("");
        setIsAddingImage(true);
        try {
            await saveImage(photo);
        } catch {
            setPhotoError("Could not save this photo. Try again.");
        } finally {
            setIsAddingImage(false);
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
            <header className="w-full max-w-3xl px-4 pt-6 pb-5">
                <Link to="/" className="inline-flex items-center gap-1 text-sm text-base-content/60 transition hover:text-primary">
                    <ArrowLeftIcon className="size-4" /> All items
                </Link>
                <h1 className="mt-3 flex items-center gap-2 text-4xl font-extrabold tracking-tight capitalize">
                    {item.name}
                    <button
                        onClick={() => document.getElementById('my_modal_3').showModal()}
                        className="btn btn-ghost btn-sm btn-circle text-base-content/50 hover:text-primary"
                        aria-label="Edit name"
                    >
                        <PencilIcon className="size-4" />
                    </button>
                </h1>
                <p className="mt-1 text-sm text-base-content/60">
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
                        <div className="relative overflow-hidden rounded-box border border-base-content/10 shadow-xl shadow-black/30">
                            {/* invert + hue-rotate turns the light Google map into a dark one */}
                            <iframe
                                title={`Map of where ${item.name} was last seen`}
                                src={`https://maps.google.com/maps?q=${lastLocation.lat},${lastLocation.lng}&z=17&output=embed`}
                                className="h-72 w-full [filter:invert(90%)_hue-rotate(180deg)]"
                                style={{ border: 0 }}
                                loading="lazy"
                                referrerPolicy="strict-origin-when-cross-origin"
                            ></iframe>
                            <span className="badge badge-primary absolute left-3 top-3 font-semibold shadow">Last known spot</span>
                        </div>
                    ) : (
                        <div className="flex h-28 w-full items-center justify-center rounded-box border border-dashed border-base-content/20 bg-base-200/50 text-sm text-base-content/60">
                            No location saved yet
                        </div>
                    )}
                </div>
                {photoError && <p role="alert" className="mt-3 text-sm text-error">{photoError}</p>}
                <h2 className="mt-8 flex items-center gap-2 text-lg font-bold">
                    Saved locations
                    <span className="badge badge-sm badge-neutral">{item.img.length}</span>
                </h2>
            </header>
            <ul className="grid w-full max-w-3xl gap-4 px-4 pb-28 sm:grid-cols-2">
                {item.img.length === 0 && (
                    <li className="rounded-box border border-dashed border-base-content/20 py-10 text-center text-sm text-base-content/60 sm:col-span-2">
                        No photos yet. Tap the camera button to add one.
                    </li>
                )}
                {item.img.map((img, index) => (
                    <li key={`${img.src}-${index}`} className="relative overflow-hidden rounded-box border border-base-content/10 bg-base-200">
                        <img
                            src={img.src}
                            alt={`${item.name}, saved location ${index + 1}`}
                            className="aspect-[4/3] w-full bg-base-300 object-cover"
                        />
                        <div className="p-3">
                            <p className="text-sm font-semibold">
                                {img.timestamp ? new Date(img.timestamp).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "Unknown time"}
                            </p>
                            <p className="mt-0.5 font-mono text-xs text-base-content/50">
                                {img.location
                                    ? `${img.location.lat.toFixed(5)}, ${img.location.lng.toFixed(5)}`
                                    : "No location"}
                            </p>
                        </div>
                        {index === 0 && <span className="badge badge-primary badge-sm absolute left-3 top-3 font-semibold">Latest</span>}
                        <button
                            type="button"
                            className="btn btn-circle btn-sm absolute right-3 top-3 border-0 bg-base-100/70 backdrop-blur hover:bg-error hover:text-error-content"
                            aria-label={`Delete image ${index + 1}`}
                            disabled={item.img.length <= 1}
                            onClick={() => {
                                setImageIndexToDelete(index);
                                deleteImageDialog.current?.showModal();
                            }}
                        >
                            <TrashIcon className="size-4" />
                        </button>
                    </li>
                ))}
            </ul>
            <button
                className="btn btn-primary btn-circle btn-lg fixed bottom-6 right-6 z-10 shadow-xl shadow-primary/40"
                onClick={() => {
                    // start finding your location now, while you take or pick the photo,
                    // so it's usually ready by the time the photo is chosen
                    locationRequest.current = getCurrentLocation();
                    photoInput.current?.click();
                }}
                disabled={isAddingImage}
                aria-label="Add a photo"
            >
                {isAddingImage ? <span className="loading loading-spinner loading-sm"></span> : <CameraIcon className="size-6" />}
            </button>
            {/* no capture attribute, so the device shows its own menu:
                phones offer the camera or the photo library, computers open a file picker */}
            <input
                ref={photoInput}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={addPhoto}
            />
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
                        <button type="submit" className="btn btn-primary">
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
        </div>
    );
}
