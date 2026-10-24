import { useRef, useState } from "react"
import { Link } from "react-router"
import { addItem, deleteItem, getItems } from "../data"
import { PlusIcon, TrashIcon } from "../icons"
import { emojiKeyboardHint, getSingleEmoji, suggestEmoji } from "../emoji"

// one-tap emoji choices in the Add item dialog
const QUICK_PICKS = ['🔑', '👛', '💳', '📱', '💻', '🎧', '🎒', '⌚']
// used when nothing is picked and the name doesn't suggest anything
const DEFAULT_ICON = '📦'


export default function Home2() {
    const [items, setItems] = useState(getItems);
    const [name, setName] = useState("");
    const [icon, setIcon] = useState(DEFAULT_ICON);
    // once you pick an icon yourself, typing the name stops changing it
    const [pickedIcon, setPickedIcon] = useState(false);
    const [customEmoji, setCustomEmoji] = useState("");
    const [emojiError, setEmojiError] = useState("");
    const [addError, setAddError] = useState("");
    const [itemToDelete, setItemToDelete] = useState(null);
    const addDialog = useRef(null);
    const nameInput = useRef(null);
    const deleteDialog = useRef(null);

    function openAddDialog() {
        addDialog.current?.showModal();
        // put the cursor in the name box so you can start typing right away
        nameInput.current?.focus();
    }

    function handleNameChange(value) {
        setName(value);
        setAddError("");
        if (!pickedIcon) {
            setIcon(suggestEmoji(value) ?? DEFAULT_ICON);
        }
    }

    function pickIcon(choice) {
        setIcon(choice);
        setPickedIcon(true);
        setCustomEmoji("");
        setEmojiError("");
    }

    function handleCustomEmojiChange(value) {
        setCustomEmoji(value);
        const emoji = getSingleEmoji(value);
        if (emoji) {
            setIcon(emoji);
            setPickedIcon(true);
            setEmojiError("");
        } else {
            setEmojiError(value.trim() ? "Type just one emoji." : "");
        }
    }

    function handleAdd(event) {
        event.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) {
            setAddError("Enter an item name.");
            return;
        }
        if (emojiError) {
            return;
        }
        // the name is used in the item's URL, so two items can't share one
        if (items.some((i) => i.name.toLowerCase() === trimmed.toLowerCase())) {
            setAddError("You already have an item with that name.");
            return;
        }

        setItems(addItem({ name: trimmed, icon, img: [], date: null }));
        addDialog.current?.close();
    }

    function confirmDelete() {
        if (itemToDelete) {
            setItems(deleteItem(itemToDelete.name));
        }
        deleteDialog.current?.close();
    }

    return <main className="mx-auto w-full max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Where did you leave it?</h1>
        <p className="mt-2 text-base-content/60">Tap an item to see the last photo and spot you saved it.</p>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {
                items.map((item) => (
                    // the delete button sits beside the link, not inside it, so tapping it doesn't open the item
                    <div key={item.name} className="group relative transition duration-200 hover:-translate-y-1">
                        <Link
                            to={`/item/${item.name}`}
                            className="block h-full rounded-box border border-base-content/10 bg-base-200/60 p-5 transition duration-200 group-hover:border-primary/50 group-hover:shadow-xl group-hover:shadow-primary/15"
                        >
                            <div className="grid size-14 place-items-center rounded-2xl bg-base-300 text-3xl transition group-hover:scale-110">
                                {item.icon}
                            </div>
                            <div className="mt-4 truncate text-lg font-bold capitalize">{item.name}</div>
                            <div className="mt-1 flex items-center gap-1.5 text-xs text-base-content/60">
                                <span className={`size-2 rounded-full ${item.date ? "bg-success" : "bg-base-content/30"}`}></span>
                                {item.date
                                    ? `Seen ${item.date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
                                    : "Not saved yet"}
                            </div>
                        </Link>
                        {/* with a mouse the button only shows on hover; on touch screens it's always visible */}
                        <button
                            type="button"
                            className="btn btn-circle btn-ghost btn-sm absolute right-3 top-3 text-base-content/50 hover:bg-error hover:text-error-content pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 focus-visible:opacity-100"
                            aria-label={`Delete ${item.name}`}
                            onClick={() => {
                                setItemToDelete(item);
                                deleteDialog.current?.showModal();
                            }}
                        >
                            <TrashIcon className="size-4" />
                        </button>
                    </div>
                ))
            }
            <button
                type="button"
                onClick={openAddDialog}
                className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-box border-2 border-dashed border-base-content/15 p-5 text-base-content/50 transition hover:border-primary/60 hover:text-primary"
            >
                <PlusIcon className="size-8" />
                <span className="text-sm font-semibold">Add item</span>
            </button>
        </div>

        <dialog
            ref={addDialog}
            className="modal"
            onClose={() => {
                setName("");
                setIcon(DEFAULT_ICON);
                setPickedIcon(false);
                setCustomEmoji("");
                setEmojiError("");
                setAddError("");
            }}
        >
            <div className="modal-box">
                <h3 className="text-lg font-bold">Add an item</h3>
                <form onSubmit={handleAdd} className="mt-4 space-y-4">
                    <fieldset className="fieldset">
                        <legend className="fieldset-legend">Name</legend>
                        <div className="flex items-center gap-3">
                            {/* live preview of the icon the item will get */}
                            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-base-300 text-2xl">
                                {icon}
                            </div>
                            <input
                                ref={nameInput}
                                value={name}
                                onChange={(event) => handleNameChange(event.target.value)}
                                type="text"
                                placeholder="e.g. headphones"
                                className="input w-full"
                            />
                        </div>
                        {!pickedIcon && icon !== DEFAULT_ICON && (
                            <p className="text-xs text-primary">Icon suggested from the name. Pick another below if you like.</p>
                        )}
                    </fieldset>
                    <fieldset className="fieldset">
                        <legend className="fieldset-legend">Icon</legend>
                        <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
                            {QUICK_PICKS.map((choice) => (
                                <button
                                    key={choice}
                                    type="button"
                                    onClick={() => pickIcon(choice)}
                                    aria-pressed={icon === choice}
                                    className={`btn btn-square text-xl ${icon === choice ? "border-primary bg-primary/15" : "border-transparent bg-base-300"}`}
                                >
                                    {choice}
                                </button>
                            ))}
                        </div>
                        <div className="mt-2 flex items-center gap-3">
                            <input
                                value={customEmoji}
                                onChange={(event) => handleCustomEmojiChange(event.target.value)}
                                type="text"
                                placeholder="🙂"
                                aria-label="Any emoji"
                                className={`input w-20 text-center text-xl ${emojiError ? "input-error" : ""}`}
                            />
                            <p className="text-xs text-base-content/60">
                                Or use any emoji. {emojiKeyboardHint()}
                            </p>
                        </div>
                        {emojiError && <p role="alert" className="text-xs text-error">{emojiError}</p>}
                    </fieldset>
                    {addError && <p role="alert" className="text-sm text-error">{addError}</p>}
                    <div className="modal-action">
                        <button type="button" className="btn" onClick={() => addDialog.current?.close()}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                            Add item
                        </button>
                    </div>
                </form>
            </div>
            <form method="dialog" className="modal-backdrop">
                <button>close</button>
            </form>
        </dialog>

        <dialog
            ref={deleteDialog}
            className="modal"
            onClose={() => setItemToDelete(null)}
        >
            <div className="modal-box max-w-sm">
                <h3 className="text-lg font-bold">Delete {itemToDelete?.name}?</h3>
                <p className="py-3 text-base-content/70">
                    This removes the item and all of its saved photos and locations.
                </p>
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
    </main>
}
