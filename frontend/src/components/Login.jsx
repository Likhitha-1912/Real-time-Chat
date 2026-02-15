import { useState } from 'react';
import { userApi } from '../services/api';
import { MessageCircle } from 'lucide-react';

export default function Login({ onLogin }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    displayName: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        // Sign up - create new user
        const res = await userApi.create({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          displayName: formData.displayName || formData.username,
        });
        onLogin(res.data);
      } else {
        // Login - find user by username
        try {
          const res = await userApi.getByUsername(formData.username);
          if (res.data) {
            onLogin(res.data);
          } else {
            setError('User not found. Please sign up first.');
          }
        } catch (err) {
          if (err.response?.status === 404) {
            setError('User not found. Please sign up first.');
          } else {
            throw err;
          }
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      const message = err.response?.data?.error || err.response?.data?.message || 'An error occurred';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <MessageCircle size={56} />
          <h1>ChatApp</h1>
          <p>Real-time messaging</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              required
              autoComplete="username"
            />
          </div>

          {isSignUp && (
            <>
              <div className="form-group">
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="form-group">
                <input
                  type="text"
                  name="displayName"
                  placeholder="Display Name (optional)"
                  value={formData.displayName}
                  onChange={handleChange}
                  autoComplete="name"
                />
              </div>
            </>
          )}

          <div className="form-group">
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Please wait...' : isSignUp ? 'Sign Up' : 'Login'}
          </button>
        </form>

        <p className="toggle-auth">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
            }}
          >
            {isSignUp ? 'Login' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
}
