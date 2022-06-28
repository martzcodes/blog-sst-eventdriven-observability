import { Routes, Route } from "react-router-dom";
import { History } from "./History";
import { Home } from "./Home";
import { Latest } from "./Latest";
import { Navbar } from "./Navbar";
import { WebSocketDemo } from "./WebsocketDemo";

export const App = () => {
  return (
    <div>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="history" element={<Latest />} />
          <Route path="history/:id" element={<History />} />
          <Route path="demo" element={<WebSocketDemo />} />
        </Routes>
      </main>
    </div>
  );
};
