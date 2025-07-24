import React, { useState } from 'react';
import { LogIn, Eye, EyeOff, Building2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const success = await login(email, password);
    if (!success) {
      setError('Neplatné přihlašovací údaje');
    }
    setLoading(false);
  };

  const demoUsers = [
    { email: 'admin@svj.cz', role: 'Administrátor', description: 'Plný přístup ke všem funkcím' },
    { email: 'chairman@svj.cz', role: 'Předseda', description: 'Správa hlasování a členů' },
    { email: 'member@svj.cz', role: 'Člen', description: 'Účast v hlasování' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center items-center space-x-3 mb-4">
            <Building2 className="h-12 w-12 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">OnlineSprava</h1>
              <p className="text-sm text-blue-600 font-medium">Hlasování</p>
            </div>
          </div>
          <p className="text-gray-600">Přihlaste se do systému pro správu hlasování</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                E-mailová adresa
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="váš@email.cz"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Heslo
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <LogIn className="h-4 w-4" />
              <span>{loading ? 'Přihlašování...' : 'Přihlásit se'}</span>
            </button>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Demo účty</h3>
          <div className="space-y-3">
            {demoUsers.map((user, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-md cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => {
                  setEmail(user.email);
                  setPassword('demo123');
                }}
              >
                <div>
                  <div className="font-medium text-sm text-gray-900">{user.email}</div>
                  <div className="text-xs text-gray-500">{user.role} - {user.description}</div>
                </div>
                <div className="text-xs text-blue-600">Kliknout pro vyplnění</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Heslo pro všechny demo účty: <code className="bg-gray-200 px-1 rounded">demo123</code>
          </p>
        </div>
      </div>
    </div>
  );
}