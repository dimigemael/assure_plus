import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/AdminDashboard";
import AssureDashboard from "./pages/AssureDashboard";
import ExpertDashboard from "./pages/ExpertDashboard";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./components/ToastContainer";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Router>
      <ToastProvider>
        <AuthProvider>
          <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Routes protégées pour l'admin */}
          <Route
            path="/admin_dashboard"
            element={
              <ProtectedRoute allowedRoles="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Routes protégées pour l'expert */}
          <Route
            path="/expert_dashboard"
            element={
              <ProtectedRoute allowedRoles="expert">
                <ExpertDashboard />
              </ProtectedRoute>
            }
          />

          {/* Routes protégées pour l'assuré */}
          <Route
            path="/assure_dashboard"
            element={
              <ProtectedRoute allowedRoles="assure">
                <AssureDashboard />
              </ProtectedRoute>
            }
          />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </Router>
  );
}

export default App;

