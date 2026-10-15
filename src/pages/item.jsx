import { useRef, useState } from "react";
import { useParams } from "react-router";
import { getItems, updateItem } from "../data";
import { photoToDataUrl } from "../image";

export default function ItemPage() {
    const { v } = useParams();
    const [item, setItem] = useState(() => getItems().find((i) => i.name === v));
    const [imageUrl, setImageUrl] = useState("");
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [imageError, setImageError] = useState("");
    const [isAddingImage, setIsAddingImage] = useState(false);
    const [imageIndexToDelete, setImageIndexToDelete] = useState(null);
    const photoInput = useRef(null);
    const deleteImageDialog = useRef(null);

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
            const newImage = selectedPhoto
                ? await photoToDataUrl(selectedPhoto)
                : imageUrl.trim();
            const updatedItem = updateItem(v, {
                img: [newImage, ...item.img],
                date: new Date(),
            });
            if (updatedItem) {
                setItem(updatedItem);
            }
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

    if (!item) {
        return (
            <div className="flex-grow flex flex-col items-center">
                <div className="m-1">Item not found</div>
            </div>
        );
    }


    return (
        <div className="flex-grow flex flex-col items-center">
            <header className="w-full max-w-3xl px-4 pt-8 pb-5">
                <p className="text-sm font-medium text-info">LastLook item</p>
                <h1 className="mt-1 text-3xl font-bold">{item.name}</h1>
                <p className="mt-2 text-sm text-base-content/70">
                    Last seen{" "}
                    <time className="font-medium text-base-content">
                        {item.date.toLocaleDateString(undefined, {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                        })}
                    </time>
                </p>
                <h2 className="mt-7 border-b border-base-300 pb-2 text-lg font-semibold">
                    Saved locations
                </h2>
            </header>
            <ul className="flex w-full max-w-3xl flex-col gap-4 px-4">
                {item.img.map((img, index) => (
                    <li key={`${img}-${index}`} className="relative w-full">
                        <img
                            src={img}
                            alt={`${item.name}, saved location ${index + 1}`}
                            className="max-h-[32rem] w-full bg-base-200 object-contain"
                        />
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
            <button className="btn btn-info btn-circle" onClick={() => document.getElementById('my_modal_2').showModal()}>
                +
            </button>
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
        </div>
    );
}