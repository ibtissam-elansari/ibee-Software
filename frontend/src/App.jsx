import { RouterProvider } from 'react-router';
import { router } from './routes/routes';
import usePreferencesStore from './store/usePreferencesStore'

function App() {
  usePreferencesStore.getState().hydrate()
  return <RouterProvider router={router} />;
}

export default App;