import { createRoot } from 'react-dom/client';
import { BrowserRouter } from "react-router";
import './index.scss';
import App from './App.tsx';
import { StrictMode } from "react";
import './i18n.tsx';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <BrowserRouter>
            <App/>
        </BrowserRouter>
    </StrictMode>
);
