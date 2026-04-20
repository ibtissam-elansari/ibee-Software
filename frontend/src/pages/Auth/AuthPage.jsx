import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Eye, EyeOff, Headphones, AlertCircle } from 'lucide-react';
import { login } from '../../api/auth';
import useAuthStore from '../../store/useAuthStore';

const AuthPage = () => {
  const navigate = useNavigate();
  const setAuth  = useAuthStore(s => s.setAuth);

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [error,    setError]    = useState(null);
  const [loading,  setLoading]  = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setError(null);
    setLoading(true);

    try {
      const data = await login({ email, password });
      setAuth(data);          // stores token + role + email + user_id
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Email ou mot de passe invalide');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = `
    w-full px-4 py-3 rounded-xl border text-sm text-gray-800
    placeholder:text-gray-300 bg-white
    focus:outline-none focus:border-amber-400
    transition-colors
  `;

  return (
    <div className="flex flex-col gap-8">

      {/* Heading */}
      <div>
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
          Se connecter
        </h1>
      </div>

      {/* Form */}
      <form onSubmit={handleLogin} className="flex flex-col gap-5">

        {/* Email */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-600">E-mail</label>
          <input
            type="email"
            placeholder="Exemple@mail.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className={inputCls}
            style={{ border: '1px solid #E5E7EB' }}
          />
        </div>

        {/* Password */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-600">Password</label>
          <div className="relative">
            <input
              type={showPwd ? 'text' : 'password'}
              placeholder="••••••••••••••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className={inputCls + ' pr-11'}
              style={{ border: '1px solid #E5E7EB' }}
            />
            <button
              type="button"
              onClick={() => setShowPwd(p => !p)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2
                         text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50
                          border border-red-200 px-4 py-2.5">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl text-white text-sm font-bold
                     tracking-wide hover:opacity-90 disabled:opacity-60
                     transition-opacity mt-2"
          style={{ backgroundColor: '#F5A623' }}
        >
          {loading ? 'Connexion…' : 'Connecter'}
        </button>
      </form>

      {/* Support link */}
      <div className="flex items-center justify-center gap-2 mt-2">
        <button
          type="button"
          className="flex items-center gap-2 text-sm font-medium transition-colors"
          style={{ color: '#F5A623' }}
        >
          Contacter le support
          <Headphones className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default AuthPage;