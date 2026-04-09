import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router';
import DashboardLayout from './layout/DashboardLayout';
import AuthLayout from './layout/AuthLayout';
import ProtectedRoute from './routes/ProtectedRoute';
import { publicRoutes, protectedRoutes } from './routes/routes';

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<AuthLayout />}>
          {publicRoutes.map(({ path, element: Element }) => (
            <Route key={path} path={path} element={<Element />} />
          ))}
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            {protectedRoutes.map(({ path, element: Element }) => (
              <Route key={path} path={path} element={<Element />} />
            ))}
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;