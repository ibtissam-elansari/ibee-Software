import DashboardLayout from "./layout/DashboardLayout"
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router';
import { protectedRoutes, publicRoutes } from "./routes/routes";
import AuthLayout from "./layout/AuthLayout";

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<AuthLayout />}>
          {publicRoutes.map(({ path, element: Element }) => (
            <Route key={path} path={path} element={<Element />} />
          ))}
        </Route>

          <Route element = {<DashboardLayout />}>
            {protectedRoutes.map(({ path, element: Element }) => (
              <Route key={path} path={path} element={<Element />}/>
            ))}
          </Route>

          <Route path='*' element={<Navigate to='/' replae />} />
      </Routes>
    </Router>
  )
}

export default App;