import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FiMail, FiLock, FiUser, FiPhone, FiTruck } from 'react-icons/fi';

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0D0D0D 0%, #1A1A1A 50%, #2D2D2D 100%)',
    padding: '1rem'
  },
  card: {
    background: '#1E1E1E',
    borderRadius: '1.5rem',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 215, 0, 0.1)',
    padding: '2rem',
    width: '100%',
    maxWidth: '420px'
  },
  logoContainer: {
    textAlign: 'center',
    marginBottom: '2rem'
  },
  logoIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '72px',
    height: '72px',
    background: 'linear-gradient(135deg, #FFD700 0%, #DAA520 100%)',
    borderRadius: '50%',
    marginBottom: '1rem',
    boxShadow: '0 8px 30px rgba(255, 215, 0, 0.3)'
  },
  title: {
    fontSize: '2rem',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #FFD700 0%, #DAA520 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    margin: 0
  },
  subtitle: {
    color: '#9CA3AF',
    marginTop: '0.5rem',
    fontSize: '0.875rem'
  },
  toggleContainer: {
    display: 'flex',
    background: '#0D0D0D',
    borderRadius: '0.75rem',
    padding: '4px',
    marginBottom: '1.5rem',
    border: '1px solid rgba(255, 215, 0, 0.1)'
  },
  toggleBtn: {
    flex: 1,
    padding: '0.75rem',
    borderRadius: '0.5rem',
    border: 'none',
    fontSize: '0.875rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s'
  },
  toggleActive: {
    background: 'linear-gradient(135deg, #FFD700 0%, #DAA520 100%)',
    color: '#0D0D0D',
    boxShadow: '0 4px 15px rgba(255, 215, 0, 0.3)'
  },
  toggleInactive: {
    background: 'transparent',
    color: '#9CA3AF'
  },
  formGroup: {
    marginBottom: '1rem'
  },
  label: {
    display: 'block',
    color: '#E5E7EB',
    fontSize: '0.875rem',
    fontWeight: '500',
    marginBottom: '0.5rem'
  },
  inputContainer: {
    position: 'relative'
  },
  inputIcon: {
    position: 'absolute',
    left: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#FFD700',
    fontSize: '1.125rem'
  },
  input: {
    width: '100%',
    padding: '0.875rem 0.875rem 0.875rem 2.75rem',
    background: '#0D0D0D',
    border: '1px solid rgba(255, 215, 0, 0.2)',
    borderRadius: '0.75rem',
    fontSize: '0.875rem',
    color: '#FFFFFF',
    transition: 'all 0.2s',
    outline: 'none',
    boxSizing: 'border-box'
  },
  select: {
    width: '100%',
    padding: '0.875rem',
    background: '#0D0D0D',
    border: '1px solid rgba(255, 215, 0, 0.2)',
    borderRadius: '0.75rem',
    fontSize: '0.875rem',
    color: '#FFFFFF',
    outline: 'none',
    boxSizing: 'border-box'
  },
  submitBtn: {
    width: '100%',
    padding: '1rem',
    background: 'linear-gradient(135deg, #FFD700 0%, #DAA520 100%)',
    color: '#0D0D0D',
    border: 'none',
    borderRadius: '0.75rem',
    fontSize: '1rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.3s',
    marginTop: '0.5rem',
    boxShadow: '0 4px 15px rgba(255, 215, 0, 0.3)'
  },
  submitBtnDisabled: {
    opacity: 0.7,
    cursor: 'not-allowed'
  },
  demoBox: {
    marginTop: '1.5rem',
    padding: '1rem',
    background: '#0D0D0D',
    borderRadius: '0.75rem',
    border: '1px solid rgba(255, 215, 0, 0.2)'
  },
  demoTitle: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#FFD700',
    marginBottom: '0.5rem'
  },
  demoText: {
    fontSize: '0.75rem',
    color: '#9CA3AF',
    margin: '0.25rem 0'
  },
  demoCode: {
    background: 'rgba(255, 215, 0, 0.2)',
    color: '#FFD700',
    padding: '0.125rem 0.5rem',
    borderRadius: '0.25rem',
    fontFamily: 'monospace'
  }
};

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'driver'
  });
  const [loading, setLoading] = useState(false);
  
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let result;
      
      if (isLogin) {
        result = await login(formData.email, formData.password);
      } else {
        result = await register(formData);
      }

      if (result.success) {
        toast.success(isLogin ? 'Login berhasil!' : 'Registrasi berhasil!');
        navigate(result.user.role === 'admin' ? '/admin' : '/driver');
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Terjadi kesalahan');
    }

    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoContainer}>
          <div style={styles.logoIcon}>
            <FiTruck style={{ color: '#0D0D0D', fontSize: '2rem' }} />
          </div>
          <h1 style={styles.title}>KurirTA</h1>
          <p style={styles.subtitle}>Sistem Manajemen Driver</p>
        </div>

        {/* Toggle */}
        <div style={styles.toggleContainer}>
          <button
            type="button"
            onClick={() => setIsLogin(true)}
            style={{
              ...styles.toggleBtn,
              ...(isLogin ? styles.toggleActive : styles.toggleInactive)
            }}
          >
            Masuk
          </button>
          <button
            type="button"
            onClick={() => setIsLogin(false)}
            style={{
              ...styles.toggleBtn,
              ...(!isLogin ? styles.toggleActive : styles.toggleInactive)
            }}
          >
            Daftar
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <div style={styles.formGroup}>
                <label style={styles.label}>Nama Lengkap</label>
                <div style={styles.inputContainer}>
                  <FiUser style={styles.inputIcon} />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    style={styles.input}
                    placeholder="Masukkan nama lengkap"
                    required={!isLogin}
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>No. Telepon</label>
                <div style={styles.inputContainer}>
                  <FiPhone style={styles.inputIcon} />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    style={styles.input}
                    placeholder="08xxxxxxxxxx"
                    required={!isLogin}
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  style={styles.select}
                >
                  <option value="driver">Driver</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </>
          )}

          <div style={styles.formGroup}>
            <label style={styles.label}>Email</label>
            <div style={styles.inputContainer}>
              <FiMail style={styles.inputIcon} />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                style={styles.input}
                placeholder="nama@email.com"
                required
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Password</label>
            <div style={styles.inputContainer}>
              <FiLock style={styles.inputIcon} />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                style={styles.input}
                placeholder="Masukkan password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.submitBtn,
              ...(loading ? styles.submitBtnDisabled : {})
            }}
          >
            {loading ? 'Loading...' : isLogin ? 'Masuk' : 'Daftar'}
          </button>
        </form>

        {/* Demo credentials */}
        <div style={styles.demoBox}>
          <div style={styles.demoTitle}>🔐 Demo Login</div>
          <p style={styles.demoText}>
            Admin: <span style={styles.demoCode}>admin@kurirta.com</span> / <span style={styles.demoCode}>admin123</span>
          </p>
          <p style={styles.demoText}>
            Driver: <span style={styles.demoCode}>andi@kurirta.com</span> / <span style={styles.demoCode}>driver123</span>
          </p>
          <p style={{...styles.demoText, marginTop: '0.5rem', fontSize: '0.7rem'}}>
            Jalankan <span style={styles.demoCode}>node seed.js</span> untuk membuat akun demo
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
