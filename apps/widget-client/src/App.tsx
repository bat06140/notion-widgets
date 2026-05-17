import { Navigate, Route, Routes } from "react-router-dom";
import { WidgetPage } from "./routes/widget-page.js";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/calendar" replace />} />
      <Route path="/calendar" element={<WidgetPage />} />
      <Route path="/clock" element={<WidgetPage />} />
      <Route path="/deadline" element={<WidgetPage />} />
    </Routes>
  );
}

export default App;
