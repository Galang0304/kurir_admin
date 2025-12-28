import React from 'react';
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
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const adminMenus = [
    { path: '/admin', icon: FiHome, label: 'Dashboard' },
    { path: '/admin/orders', icon: FiPackage, label: 'Pesanan' },
    { path: '/admin/drivers', icon: FiUsers, label: 'Driver' },
    { path: '/admin/shifts', icon: FiCalendar, label: 'Jadwal Piket' },
  ];

  const driverMenus = [
    { path: '/driver', icon: FiHome, label: 'Dashboard' },
    { path: '/driver/orders', icon: FiPackage, label: 'Pesanan Saya' },
  ];

  const menus = user?.role === 'admin' ? adminMenus : driverMenus;

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
    background: '#f0f2f5',
  },
  mobileHeader: {
    display: 'none',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    alignItems: 'center',
    padding: '0 16px',
    zIndex: 1000,
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
  menuBtn: {
    background: 'transparent',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    padding: 8,
  },
  mobileTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    marginLeft: 16,
  },
  sidebar: {
    width: 280,
    background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 1001,
    transition: 'transform 0.3s ease',
  },
  sidebarOpen: {},
  sidebarHeader: {
    padding: 24,
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    color: 'white',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  },
  logo: {
    fontSize: 24,
    fontWeight: 700,
    margin: 0,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  roleTag: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
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
    color: 'rgba(255,255,255,0.7)',
    textDecoration: 'none',
    borderRadius: 12,
    transition: 'all 0.2s',
    fontSize: 15,
    fontWeight: 500,
  },
  navLinkActive: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
  },
  sidebarFooter: {
    padding: 20,
    borderTop: '1px solid rgba(255,255,255,0.1)',
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
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: 18,
    fontWeight: 600,
  },
  userName: {
    color: 'white',
    fontWeight: 600,
    fontSize: 14,
  },
  userEmail: {
    color: 'rgba(255,255,255,0.5)',
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
    background: 'rgba(0,0,0,0.5)',
    zIndex: 1000,
    display: 'none',
  },
  main: {
    flex: 1,
    marginLeft: 280,
    padding: 32,
    minHeight: '100vh',
  },
};

// Add responsive styles via media query workaround
if (typeof window !== 'undefined' && window.innerWidth <= 768) {
  styles.mobileHeader.display = 'flex';
  styles.sidebar.transform = 'translateX(-100%)';
  styles.sidebarOpen.transform = 'translateX(0)';
  styles.overlay.display = 'block';
  styles.main.marginLeft = 0;
  styles.main.paddingTop = 76;
}

export default Layout;
