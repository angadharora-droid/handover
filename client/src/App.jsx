import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Home from './pages/Home';
import AreaPage from './pages/AreaPage';
import Dashboard from './pages/Dashboard';
import Signoff from './pages/Signoff';
import Users from './pages/Users';
import Assignments from './pages/Assignments';
import Audit from './pages/Audit';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Home />} />
        <Route path="/area/:areaName" element={<AreaPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/signoff" element={<Signoff />} />
        <Route
          path="/users"
          element={
            <ProtectedRoute roles={['admin']}>
              <Users />
            </ProtectedRoute>
          }
        />
        <Route
          path="/assignments"
          element={
            <ProtectedRoute roles={['admin']}>
              <Assignments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/audit"
          element={
            <ProtectedRoute roles={['admin']}>
              <Audit />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
