import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:3001/api/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/dashboard');
    } catch (error) {
      alert('Login failed: ' + error.response?.data?.error);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #F8FAFB 0%, #EEF2F5 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto"'
    }}>
      <div style={{
        background: 'white',
        padding: '50px',
        borderRadius: '16px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07), 0 10px 20px rgba(0, 0, 0, 0.05)',
        maxWidth: '420px',
        width: '100%',
        marginLeft: '20px',
        marginRight: '20px',
        border: '1px solid #F0F0F0'
      }}>
        <h1 style={{ 
          textAlign: 'center', 
          color: '#2C3E50', 
          marginBottom: '10px',
          fontSize: '2rem',
          fontWeight: '700',
          letterSpacing: '-0.5px'
        }}>
          🏥 Clinical Copilot
        </h1>

        <p style={{
          textAlign: 'center',
          color: '#7F8C8D',
          fontSize: '1rem',
          marginBottom: '35px',
          fontWeight: '400'
        }}>
          Your AI Medical Assistant
        </p>
        
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              color: '#2C3E50',
              fontSize: '0.9rem',
              fontWeight: '600',
              marginBottom: '8px'
            }}>
              Email
            </label>
            <input 
              type="email" 
              placeholder="your@email.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 15px',
                border: '2px solid #E8E8E8',
                borderRadius: '10px',
                fontSize: '1rem',
                boxSizing: 'border-box',
                transition: 'all 0.3s ease',
                background: '#F8FAFB'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#80A1BA';
                e.target.style.background = 'white';
                e.target.style.outline = 'none';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#E8E8E8';
                e.target.style.background = '#F8FAFB';
              }}
            />
          </div>
          
          <div style={{ marginBottom: '30px' }}>
            <label style={{
              display: 'block',
              color: '#2C3E50',
              fontSize: '0.9rem',
              fontWeight: '600',
              marginBottom: '8px'
            }}>
              Password
            </label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 15px',
                border: '2px solid #E8E8E8',
                borderRadius: '10px',
                fontSize: '1rem',
                boxSizing: 'border-box',
                transition: 'all 0.3s ease',
                background: '#F8FAFB'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#80A1BA';
                e.target.style.background = 'white';
                e.target.style.outline = 'none';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#E8E8E8';
                e.target.style.background = '#F8FAFB';
              }}
            />
          </div>
          
          <button 
            type="submit" 
            style={{
              width: '100%',
              padding: '14px',
              background: 'linear-gradient(135deg, #80A1BA 0%, #5A7A92 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '1rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textTransform: 'uppercase',
              letterSpacing: '0.6px',
              boxShadow: '0 4px 15px rgba(128, 161, 186, 0.25)',
              marginBottom: '20px'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-3px)';
              e.target.style.boxShadow = '0 6px 25px rgba(128, 161, 186, 0.35)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 15px rgba(128, 161, 186, 0.25)';
            }}
          >
            Sign In
          </button>
        </form>

        <p style={{
          textAlign: 'center',
          color: '#95A5A6',
          fontSize: '0.9rem',
          marginTop: '20px',
          paddingTop: '20px',
          borderTop: '1px solid #F0F0F0',
          fontWeight: '500'
        }}>
          Demo credentials: <br />
          <span style={{ color: '#7F8C8D' }}>test@test.com / 123</span>
        </p>
      </div>
    </div>
  );
}