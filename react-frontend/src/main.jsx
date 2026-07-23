/**
 * Module Name: main
 * Location: react-frontend/src/main.jsx
 * Purpose: Mounts the React application components inside the physical DOM root.
 * How to use: Bundled automatically by Vite compiler to run in browser.
 * Why it is used: Main bootstrap file for compiling React DOM trees.
 */

import React from 'react';                   // TYPE: Library Import. USE: React references. WHY: To enable JSX compiler support.
import ReactDOM from 'react-dom/client';      // TYPE: Library Import. USE: Virtual DOM mounting. WHY: Creates render interface to physical browser DOM.
import App from './App';                     // TYPE: Component Import. USE: Main container. WHY: Root node of the interface layout.
import './index.css';                        // TYPE: Styling Import. USE: Load Design CSS. WHY: Injects B2B glass design themes.

// 1. Locate DOM anchor container and instantiate React Virtual Root
// TYPE: DOM Query Call (document.getElementById). HOW: document.getElementById(id). WHY: Retrieves physical DOM node from index.html.
const rootElement = document.getElementById('root');

// 2. Initialize Virtual Root Renderer
// TYPE: Library Method Call (ReactDOM.createRoot). HOW: createRoot(element). WHY: Sets up React 18 Concurrent Rendering framework on the node.
const virtualRoot = ReactDOM.createRoot(rootElement);

// 3. Mount React elements tree
// TYPE: Object Method Call (render). HOW: root.render(jsx). WHY: Compiles virtual nodes and paints the initial layout to browser window.
virtualRoot.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
