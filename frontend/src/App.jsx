import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router';
import DashboardLayout from './layout/DashboardLayout';
import AuthLayout from './layout/AuthLayout';
import { publicRoutes, protectedRoutes } from './routes/routes';

function App() {
  return (
    <Router>
      <Routes>

        {/* Public — no sidebar */}
        <Route element={<AuthLayout />}>
          {publicRoutes.map(({ path, element: Element }) => (
            <Route key={path} path={path} element={<Element />} />
          ))}
        </Route>

        {/* Protected — wrapped in DashboardLayout */}
        <Route element={<DashboardLayout />}>
          {protectedRoutes.map(({ element: Guard, children }, i) => (
            <Route key={i} element={Guard}>
              {children.map(({ path, element: Element }) => (
                <Route key={path} path={path} element={<Element />} />
              ))}
            </Route>
          ))}
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </Router>
  );
}

export default App;