/**
 * Module Name: main
 * Location: react-frontend/src/main.jsx
 * Purpose: Mounts the React application components inside the physical DOM root.
 * How to use: Bundled automatically by Vite compiler to run in browser.
 * Why it is used: Main bootstrap file for compiling React DOM trees.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

const rootElement = document.getElementById('root');
const virtualRoot = ReactDOM.createRoot(rootElement);

virtualRoot.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
