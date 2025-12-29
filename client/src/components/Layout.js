import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FiHome, FiPackage, FiUsers, FiCalendar, FiLogOut, 
  FiTruck, FiMenu, FiX 
} from 'react-icons/fi';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const adminMenus = [
    { path: '/admin', icon: FiHome, label: 'Dashboard' },
    { path: '/admin/orders', icon: FiPackage, label: 'Pesanan' },
    { path: '/admin/drivers', icon: FiUsers, label: 'Driver' },
    { path: '/admin/shifts', icon: FiCalendar, label: 'Jadwal' },
  ];

  const driverMenus = [
    { path: '/driver', icon: FiHome, label: 'Dashboard' },
    { path: '/driver/orders', icon: FiPackage, label: 'Pesanan' },
  ];

  const menus = user?.role === 'admin' ? adminMenus : driverMenus;

  // Mobile Bottom Navigation
  if (isMobile) {
    return (
      <div style={mobileStyles.container}>
        {/* Mobile Header */}
        <div style={mobileStyles.header}>
          <div style={mobileStyles.headerContent}>
            <FiTruck size={24} color="#FFD700" />
            <span style={mobileStyles.headerTitle}>KurirTA</span>
          </div>
          <button onClick={handleLogout} style={mobileStyles.logoutBtn}>
            <FiLogOut size={20} />
          </button>
        </div>

        {/* Main Content */}
        <main style={mobileStyles.main}>
          {children}
        </main>

        {/* Bottom Navigation */}
        <nav style={mobileStyles.bottomNav}>
          {menus.map((menu) => {
            const isActive = location.pathname === menu.path;
            const Icon = menu.icon;
            return (
              <Link
                key={menu.path}
                to={menu.path}
                style={{
                  ...mobileStyles.navItem,
                  ...(isActive ? mobileStyles.navItemActive : {})
                }}
              >
                <Icon size={22} />
                <span style={mobileStyles.navLabel}>{menu.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    );
  }

  // Desktop Layout
  return (
    <div style={styles.container}>
      {/* Mobile Header */}
      <div style={styles.mobileHeader}>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} style={styles.menuBtn}>
          {sidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
        <div style={styles.mobileTitle}>
          <FiTruck style={{ marginRight: 8 }} />
          KurirTA
        </div>
      </div>

      {/* Sidebar */}
      <aside style={{
        ...styles.sidebar,
        ...(sidebarOpen ? styles.sidebarOpen : {})
      }}>
        <div style={styles.sidebarHeader}>
          <FiTruck size={32} />
          <div>
            <h1 style={styles.logo}>KurirTA</h1>
            <span style={styles.roleTag}>
              {user?.role === 'admin' ? 'Admin Panel' : 'Driver Panel'}
            </span>
          </div>
        </div>

        <nav style={styles.nav}>
          {menus.map((menu) => {
            const isActive = location.pathname === menu.path;
            const Icon = menu.icon;
            return (
              <Link
                key={menu.path}
                to={menu.path}
                style={{
                  ...styles.navLink,
                  ...(isActive ? styles.navLinkActive : {})
                }}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={20} />
                <span>{menu.label}</span>
              </Link>
            );
          })}
        </nav>

        <div style={styles.sidebarFooter}>
          <div style={styles.userInfo}>
            <div style={styles.avatar}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={styles.userName}>{user?.name}</div>
              <div style={styles.userEmail}>{user?.email}</div>
            </div>
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            <FiLogOut size={18} />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div style={styles.overlay} onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <main style={styles.main}>
        {children}
      </main>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    background: '#121212',
  },
  mobileHeader: {
    display: 'none',
  },
  menuBtn: {
    background: 'transparent',
    border: 'none',
    color: '#FFD700',
    cursor: 'pointer',
    padding: 8,
  },
  mobileTitle: {
    color: '#FFD700',
    fontSize: 20,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    marginLeft: 16,
  },
  sidebar: {
    width: 280,
    background: 'linear-gradient(180deg, #0D0D0D 0%, #1A1A1A 100%)',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 1001,
    borderRight: '1px solid rgba(255, 215, 0, 0.1)',
  },
  sidebarOpen: {},
  sidebarHeader: {
    padding: 24,
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    color: 'white',
    borderBottom: '1px solid rgba(255, 215, 0, 0.1)',
  },
  logo: {
    fontSize: 24,
    fontWeight: 700,
    margin: 0,
    background: 'linear-gradient(135deg, #FFD700 0%, #DAA520 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  roleTag: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  nav: {
    flex: 1,
    padding: '24px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '14px 16px',
    color: '#9CA3AF',
    textDecoration: 'none',
    borderRadius: 12,
    transition: 'all 0.2s',
    fontSize: 15,
    fontWeight: 500,
  },
  navLinkActive: {
    background: 'linear-gradient(135deg, #FFD700 0%, #DAA520 100%)',
    color: '#0D0D0D',
    boxShadow: '0 4px 15px rgba(255, 215, 0, 0.3)',
  },
  sidebarFooter: {
    padding: 20,
    borderTop: '1px solid rgba(255, 215, 0, 0.1)',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #FFD700 0%, #DAA520 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#0D0D0D',
    fontSize: 18,
    fontWeight: 600,
  },
  userName: {
    color: 'white',
    fontWeight: 600,
    fontSize: 14,
  },
  userEmail: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  logoutBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '12px 16px',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#ef4444',
    borderRadius: 10,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
    transition: 'all 0.2s',
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    zIndex: 1000,
    display: 'none',
  },
  main: {
    flex: 1,
    marginLeft: 280,
    padding: 32,
    minHeight: '100vh',
    background: '#121212',
  },
};

// Mobile styles
const mobileStyles = {
  container: {
    minHeight: '100vh',
    background: '#121212',
    paddingBottom: 80,
  },
  header: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    background: 'linear-gradient(180deg, #0D0D0D 0%, #1A1A1A 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    zIndex: 1000,
    borderBottom: '2px solid #FFD700',
  },
  headerContent: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    color: '#FFD700',
    fontSize: 20,
    fontWeight: 700,
  },
  logoutBtn: {
    background: 'rgba(239, 68, 68, 0.2)',
    border: '1px solid rgba(239, 68, 68, 0.4)',
    color: '#EF4444',
    borderRadius: 10,
    padding: '8px 12px',
    cursor: 'pointer',
  },
  main: {
    paddingTop: 76,
    padding: '76px 16px 16px',
    minHeight: 'calc(100vh - 80px)',
  },
  bottomNav: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    background: 'linear-gradient(180deg, #1A1A1A 0%, #0D0D0D 100%)',
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTop: '2px solid #FFD700',
    zIndex: 9999,
    paddingBottom: 'env(safe-area-inset-bottom)',
  },
  navItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#9CA3AF',
    textDecoration: 'none',
    padding: '8px 16px',
    borderRadius: 12,
    transition: 'all 0.2s',
    minWidth: 60,
  },
  navItemActive: {
    color: '#FFD700',
    background: 'rgba(255, 215, 0, 0.15)',
  },
  navLabel: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: 500,
  },
};

export default Layout;
