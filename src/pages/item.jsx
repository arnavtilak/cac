import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { addItem, getItems, updateItem } from "../data";
import { photoToBlob } from "../image";
import { requestLocation, waitForLocation } from "../location";
import { deletePhoto, loadPhoto, savePhoto } from "../photos";
import { readPhotoInfo } from "../exif";
import { ArrowLeftIcon, CameraIcon, PencilIcon, PinIcon, TrashIcon } from "../icons";

// shown when a photo is saved without a location, explaining why and how to fix it
const LOCATION_PROBLEMS = {
    blocked: "Photo saved without a location because location is turned off for this site. iPhone: Settings → Privacy & Security → Location Services → Safari Websites (or Chrome) → While Using. Android: tap the icon left of the web address → Permissions → Location → Allow.",
    slow: "Photo saved without a location because your phone took too long to find it. Try again with Wi-Fi on, or near a window.",
    unavailable: "Photo saved without a location because your phone couldn't find where you are. Check that Location Services is on, then try again.",
    unsupported: "Photo saved without a location because this browser can't share your location.",
};

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
    // why the last photo was saved without a location ("blocked", "slow", ...), or null
    const [locationProblem, setLocationProblem] = useState(null);
    const [isAddingImage, setIsAddingImage] = useState(false);
    const [imageIndexToDelete, setImageIndexToDelete] = useState(null);
    const [newName, setNewName] = useState(item.name);
    const photoInput = useRef(null);
    // location lookup started when the camera button is tapped
    const locationRequest = useRef(null);
    const deleteImageDialog = useRef(null);

    // photos are stored newest first, so this is the most recent stored position
    const lastLocation = item.img.find((img) => img.location)?.location;

    // Finds where you are now, using the lookup started when you tapped the camera if there is one.
    async function findCurrentLocation() {
        const early = locationRequest.current;
        locationRequest.current = null;
        // the clock only starts now that the photo is chosen, so time spent in the camera doesn't count
        const first = early ? await waitForLocation(early, 10000) : null;
        if (first?.location) {
            return first;
        }
        // the early lookup can come back empty while the camera covers the page,
        // so ask once more now that the page is showing again
        return waitForLocation(requestLocation(), 15000);
    }

    async function saveImage(photo, photoInfo) {
        const [blob, found] = await Promise.all([
            photoToBlob(photo),
            findCurrentLocation(),
        ]);
        const location = found.location;
        setLocationProblem(found.problem);
        // the photo goes in IndexedDB; the item only keeps its id
        const id = crypto.randomUUID();
        await savePhoto(id, blob);
        const timestamp = photoInfo?.takenAt ?? new Date();
        // a photo from your library can be older than ones already saved,
        // so sort to keep newest first (ISO dates sort correctly as text)
        const img = [{ id, location, timestamp: timestamp.toISOString() }, ...item.img]
            .sort((a, b) => (b.timestamp ?? "").localeCompare(a.timestamp ?? ""));
        const updates = {
            img,
            date: new Date(img[0].timestamp),
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
        setLocationProblem(null);
        const info = await readPhotoInfo(photo);
        await saveWithSpinner(photo, info);
    }

    async function saveWithSpinner(photo, photoInfo) {
        setIsAddingImage(true);
        try {
            await saveImage(photo, photoInfo);
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

        const removed = item.img[imageIndexToDelete];
        const updatedItem = updateItem(v, {
            img: item.img.filter((_, index) => index !== imageIndexToDelete),
        });
        if (updatedItem) {
            setItem(updatedItem);
            if (removed.id) {
                deletePhoto(removed.id).catch(() => {});
            }
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
                {locationProblem && (
                    <div role="alert" className="alert alert-warning alert-soft mt-3 text-sm">
                        <PinIcon className="size-5 shrink-0" />
                        <span>{LOCATION_PROBLEMS[locationProblem]}</span>
                    </div>
                )}
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
                    <li key={img.id ?? `${img.src}-${index}`} className="relative overflow-hidden rounded-box border border-base-content/10 bg-base-200">
                        <StoredPhoto
                            photo={img}
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
                                {/* accuracy is how far off the position might be, in meters */}
                                {img.location?.accuracy ? ` · ±${Math.round(img.location.accuracy)} m` : ""}
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
                    locationRequest.current = requestLocation();
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

// Shows one saved photo. New photos are loaded from IndexedDB by their id;
// older ones still have a src (a web address) and show directly.
function StoredPhoto({ photo, ...imgProps }) {
    const [url, setUrl] = useState(photo.src);

    useEffect(() => {
        if (!photo.id) {
            return;
        }
        let objectUrl = null;
        let cancelled = false;
        loadPhoto(photo.id).then((blob) => {
            if (blob && !cancelled) {
                // gives the Blob a temporary address an <img> can show
                objectUrl = URL.createObjectURL(blob);
                setUrl(objectUrl);
            }
        });
        // when the photo leaves the page, free that temporary address
        return () => {
            cancelled = true;
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [photo.id]);

    return <img src={url} {...imgProps} />;
}
