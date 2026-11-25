import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import Chat from "./pages/Chat";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { ThemeProvider } from "./theme";

function HomeRedirect() {
  return (
    <Navigate
      to={sessionStorage.getItem("access_token") ? "/chat" : "/login"}
      replace
    />
  );
}

function ProtectedChat() {
  return sessionStorage.getItem("access_token") ? (
    <Chat />
  ) : (
    <Navigate to="/login" replace />
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/chat" element={<ProtectedChat />} />
          <Route path="*" element={<HomeRedirect />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
