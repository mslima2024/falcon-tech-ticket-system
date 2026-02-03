
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

try {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  console.error("Erro crítico na renderização:", error);
  rootElement.innerHTML = `
    <div style="padding: 40px; font-family: sans-serif; text-align: center; background: #fff1f2; color: #be123c; border-radius: 20px; margin: 20px; border: 1px solid #fda4af;">
      <h1 style="margin-bottom: 10px;">Ops! Ocorreu um erro ao carregar</h1>
      <p>O sistema encontrou um problema técnico. Tente recarregar a página ou limpe o cache do navegador.</p>
      <code style="display: block; margin-top: 20px; font-size: 12px; opacity: 0.7;">${error}</code>
      <button onclick="window.location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #be123c; color: white; border: none; border-radius: 10px; cursor: pointer;">Recarregar Sistema</button>
    </div>
  `;
}
