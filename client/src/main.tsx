
  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import "./index.css";
  import { installApiFetchInterceptor } from "./services/api";

  installApiFetchInterceptor();
  createRoot(document.getElementById("root")!).render(<App />);

  // Regista o service worker do shell da PWA assim que a app carrega -
  // independente de o utilizador activar notificações push (esse fluxo,
  // em components/notifications/push-notification-manager.tsx, só pede
  // permissão e subscreve; aqui é só o registo que torna a app instalável
  // e permite o arranque offline do shell estático).
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((error) => {
        console.warn('[PWA] Falha ao registar o service worker:', error);
      });
    });
  }

