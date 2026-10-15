import { Link } from "react-router"

const KEYS = [
    { name: "key", icon: '🔑' },
    { name: "wallet", icon: '👛' },
    { name: "card", icon: '💳' },
    { name: "phone", icon: '📱' },
    { name: "laptop", icon: '💻' },
    { name: "tablet", icon: '📱' },
]


export default function Home2() {
    return <div>
        <h1 className="text-center text-xl m-20">Find MY</h1>

        <div className="grid grid-cols-4 gap-4">
            {
                KEYS.map((key) => (<Link key={key.name} to={`/item/Goggles`}>
                    <div>{key.icon} {key.name}</div>
                </Link>))
            }
        </div>


    </div>
}