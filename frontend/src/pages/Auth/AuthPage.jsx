// AuthPage.py
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { login } from '../../api/auth';
import useAuthStore from '../../store/useAuthStore';

const AuthPage = () => {
  const navigate = useNavigate();
  const setToken = useAuthStore(s => s.setToken);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setError(null)
    setLoading(true)

    try {
      const data = await login({ email, password });

      setToken(data.access_token);
      navigate('/');

    } catch {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-base-200">
      <form
        onSubmit={handleLogin}
        className="bg-white p-6 rounded-xl shadow-md w-80 space-y-4"
      >
        <h2 className="text-xl font-bold text-center">Login</h2>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <input
          type="email"
          placeholder="Email"
          className="input input-bordered w-full"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="input input-bordered w-full"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={loading}
        >
          {loading ? 'Chargement...' : 'Se connecter'}
        </button>
      </form>
    </div>
  );
};

export default AuthPage;