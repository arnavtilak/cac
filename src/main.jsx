import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import './index.css';
import Layout from './Layout';
import { movePhotosToIndexedDB } from './data';

// move any old photos out of localStorage first, then show the app
// (finally runs even if moving fails, so the app always loads)
movePhotosToIndexedDB().finally(() => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    </StrictMode>,
  );
});