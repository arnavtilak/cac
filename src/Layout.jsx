import { Link, Route, Routes } from 'react-router'
import HomePage from './pages/home'
import ItemPage from './pages/item'

const ROUTES = [
  { path: "/", element: <HomePage /> },
  { path: "/item/:v", element: <ItemPage /> },
]

export default function Layout() {


  return (
    <div className="min-h-screen flex flex-col">

      {/* Main */}
      <Routes>
        {ROUTES.map((r) => <Route key={r.path} path={r.path} element={r.element} />)}
      </Routes>
      {/* Header */}
      <nav className="p-5 space-x-3 flex justify-center bg-base-300">
        <Link to="/">
          <button className="btn btn-ghost">Home</button>
        </Link>
      </nav>
    </div>
  )
}
