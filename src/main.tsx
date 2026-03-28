import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./App.css"; // Nếu ông chưa có file này thì cứ comment lại hoặc tạo file rỗng

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);