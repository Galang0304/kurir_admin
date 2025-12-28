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
    background: 'linear-gradient(135deg, #1e1b4b 0%, #4c1d95 50%, #312e81 100%)',
    padding: '1rem'
  },
  card: {
    background: 'white',
    borderRadius: '1rem',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
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
    width: '64px',
    height: '64px',
    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
    borderRadius: '50%',
    marginBottom: '1rem'
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: '700',
    color: '#1f2937',
    margin: 0
  },
  subtitle: {
    color: '#6b7280',
    marginTop: '0.25rem',
    fontSize: '0.875rem'
  },
  toggleContainer: {
    display: 'flex',
    background: '#f3f4f6',
    borderRadius: '0.5rem',
    padding: '4px',
    marginBottom: '1.5rem'
  },
  toggleBtn: {
    flex: 1,
    padding: '0.625rem',
    borderRadius: '0.375rem',
    border: 'none',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  toggleActive: {
    background: 'white',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    color: '#4f46e5'
  },
  toggleInactive: {
    background: 'transparent',
    color: '#6b7280'
  },
  formGroup: {
    marginBottom: '1rem'
  },
  label: {
    display: 'block',
    color: '#374151',
    fontSize: '0.875rem',
    fontWeight: '500',
    marginBottom: '0.5rem'
  },
  inputContainer: {
    position: 'relative'
  },
  inputIcon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#9ca3af',
    fontSize: '1.125rem'
  },
  input: {
    width: '100%',
    padding: '0.75rem 0.75rem 0.75rem 2.5rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    outline: 'none',
    boxSizing: 'border-box'
  },
  select: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    outline: 'none',
    boxSizing: 'border-box',
    background: 'white'
  },
  submitBtn: {
    width: '100%',
    padding: '0.875rem',
    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '0.5rem',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    marginTop: '0.5rem'
  },
  submitBtnDisabled: {
    opacity: 0.7,
    cursor: 'not-allowed'
  },
  demoBox: {
    marginTop: '1.5rem',
    padding: '1rem',
    background: '#f9fafb',
    borderRadius: '0.5rem',
    border: '1px solid #e5e7eb'
  },
  demoTitle: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: '0.5rem'
  },
  demoText: {
    fontSize: '0.75rem',
    color: '#6b7280',
    margin: '0.25rem 0'
  },
  demoCode: {
    background: '#e5e7eb',
    padding: '0.125rem 0.375rem',
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
            <FiTruck style={{ color: 'white', fontSize: '1.75rem' }} />
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
