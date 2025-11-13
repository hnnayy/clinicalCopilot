import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await axios.post('http://localhost:3001/api/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/dashboard');
    } catch (error) {
      setError('Login failed: ' + (error.response?.data?.error || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light via-blue-50 to-white flex items-center justify-center px-5 py-10">
      <div className="card max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8 border-b border-gray-100 pb-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
            🏥 HealthKathon
          </h1>
          <p className="text-gray-text font-normal">Platform Konsultasi Kesehatan</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5 mb-6">
          {/* Email Input */}
          <div>
            <label className="block text-sm font-semibold text-dark mb-2">
              Email
            </label>
            <input 
              type="email" 
              placeholder="contoh@email.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              required
            />
          </div>
          
          {/* Password Input */}
          <div>
            <label className="block text-sm font-semibold text-dark mb-2">
              Password
            </label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              required
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">
              {error}
            </div>
          )}
          
          {/* Login Button */}
          <button 
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full disabled:opacity-70 disabled:cursor-not-allowed transition-all hover:shadow-xl hover:-translate-y-1"
          >
            {isLoading ? '🔄 Sedang masuk...' : '🚀 Masuk'}
          </button>
        </form>

        {/* Demo Info */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 space-y-2 text-sm text-center">
          <p className="font-bold text-dark mb-2">Akun Demo:</p>
          <div className="space-y-1">
            <p className="text-gray-text">
              <span className="font-semibold text-primary">Email:</span> test@test.com
            </p>
            <p className="text-gray-text">
              <span className="font-semibold text-primary">Password:</span> 123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}