import { Link, Route, Routes } from "react-router";
import HomePage from "./pages/home";
import ItemPage from "./pages/item";
import Home2 from "./pages/home2";

const ROUTES = [
  { path: "/old", element: <HomePage /> }, // deprecated
  { path: "/", element: <Home2 /> },
  { path: "/item/:v", element: <ItemPage /> },
];

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="text-xl font-bold bg-base-300 w-full p-5 text-center">
        LastLook
      </div>
      {/* Main */}
      <Routes>
        {ROUTES.map((r) => (
          <Route key={r.path} path={r.path} element={r.element} />
        ))}
      </Routes>
      {/* Header */}
    </div>
  );
}
