import DashboardLayout from "./layout/DashboardLayout"
import { BrowserRouter as Router, Routes, Route } from 'react-router';
import routes from "./routes/routes";

function App() {
  return (
    <Router>
      <Routes>
        {routes.map(({ path, element: Element}) => {
          return (
            <Route key={path} element={<DashboardLayout />}>
              <Route
                path={path}
                element={<Element />}
              />
            </Route>
          );
        })}
      </Routes>
    </Router>
  )
}

export default App;