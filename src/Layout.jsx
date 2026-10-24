import { Link, Route, Routes } from "react-router";
import HomePage from "./pages/home";
import ItemPage from "./pages/item";
import Home2 from "./pages/home2";
import { PinIcon } from "./icons";

const ROUTES = [
  { path: "/old", element: <HomePage /> }, // deprecated
  { path: "/", element: <Home2 /> },
  { path: "/item/:v", element: <ItemPage /> },
];

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-base-content/10 bg-base-100/70 backdrop-blur-lg">
        <div className="mx-auto flex max-w-3xl items-center px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-linear-to-br from-primary to-secondary text-primary-content shadow-lg shadow-primary/30">
              <PinIcon />
            </span>
            <span className="bg-linear-to-r from-primary to-secondary bg-clip-text text-xl font-extrabold tracking-tight text-transparent">
              LastLook
            </span>
          </Link>
        </div>
      </header>
      {/* Main */}
      <Routes>
        {ROUTES.map((r) => (
          <Route key={r.path} path={r.path} element={r.element} />
        ))}
      </Routes>
    </div>
  );
}
