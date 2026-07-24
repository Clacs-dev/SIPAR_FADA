
  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import "./index.css";
  import { installApiFetchInterceptor } from "./services/api";

  installApiFetchInterceptor();
  createRoot(document.getElementById("root")!).render(<App />);
  
