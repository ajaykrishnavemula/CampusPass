import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/authService';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Don't clear error on change, let it persist
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login(formData);
      login(response.user, response.token);

      // Navigate based on role
      switch (response.user.role) {
        case 0: // Student
          navigate('/student/dashboard');
          break;
        case 1: // Admin
          navigate('/student/dashboard');
          break;
        case 2: // Warden
          navigate('/warden/dashboard');
          break;
        case 3: // Security
          navigate('/security/dashboard');
          break;
        default:
          navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-8">Sign In</h2>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-base font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            autoComplete="email"
            className="w-full px-4 py-3.5 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white placeholder:text-gray-300 focus:placeholder:opacity-0 transition-all"
            placeholder="student@example.com"
            style={{
              WebkitTextFillColor: '#111827',
              WebkitBoxShadow: '0 0 0px 1000px white inset',
            }}
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-base font-medium text-gray-700 mb-2">
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            autoComplete="current-password"
            className="w-full px-4 py-3.5 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white placeholder:text-gray-300 focus:placeholder:opacity-0 transition-all"
            placeholder="••••••••"
            style={{
              WebkitTextFillColor: '#111827',
              WebkitBoxShadow: '0 0 0px 1000px white inset',
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 px-4 text-base bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-base text-gray-600">
          Need access?{' '}
          <span className="font-semibold text-indigo-600">
            Contact admin
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;

// 
