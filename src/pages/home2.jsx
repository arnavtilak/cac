import { Link } from "react-router"
import { getItems } from "../data"

const KEYS = [
    { name: "key", icon: '🔑' },
    { name: "wallet", icon: '👛' },
    { name: "card", icon: '💳' },
    { name: "phone", icon: '📱' },
    { name: "laptop", icon: '💻' },
    { name: "tablet", icon: '📱' },
]


export default function Home2() {
    const items = getItems();

    return <main className="mx-auto w-full max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Where did you leave it?</h1>
        <p className="mt-2 text-base-content/60">Tap an item to see the last photo and spot you saved it.</p>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {
                KEYS.map((key) => {
                    // the saved record for this item, if there is one
                    const item = items.find((i) => i.name === key.name);
                    return <Link
                        key={key.name}
                        to={`/item/${key.name}`}
                        className="group rounded-box border border-base-content/10 bg-base-200/60 p-5 transition duration-200 hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/15"
                    >
                        <div className="grid size-14 place-items-center rounded-2xl bg-base-300 text-3xl transition group-hover:scale-110">
                            {key.icon}
                        </div>
                        <div className="mt-4 text-lg font-bold capitalize">{key.name}</div>
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-base-content/60">
                            <span className={`size-2 rounded-full ${item?.date ? "bg-success" : "bg-base-content/30"}`}></span>
                            {item?.date
                                ? `Seen ${item.date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
                                : "Not saved yet"}
                        </div>
                    </Link>
                })
            }
        </div>
    </main>
}
