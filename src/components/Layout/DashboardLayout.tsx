'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  GraduationCap, LogOut, Menu, X, LayoutDashboard, School, UserCheck, 
  Users, Layers, BookOpen, User, History, Database, FileBarChart, Clock
} from 'lucide-react';

interface UserSessionData {
  id: string;
  fullName: string;
  username: string;
  role: 'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'TEACHER';
  schoolName: string | null;
  subRoles?: {
    isKepalaSekolah: boolean;
    isWaliKelas: boolean;
    isGuruMapel: boolean;
  };
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  requiredRole: 'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'TEACHER';
}

export default function DashboardLayout({ children, requiredRole }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserSessionData | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch session data
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) throw new Error('Unauthenticated');
        return res.json();
      })
      .then((data) => {
        if (!data.authenticated || data.user.role !== requiredRole) {
          router.push('/login');
          return;
        }
        setUser(data.user);
        // Cache user session
        localStorage.setItem('sipms_cache_user', JSON.stringify(data.user));
        setLoading(false);
      })
      .catch(() => {
        // Offline fallback (even if navigator.onLine is true but server is unreachable)
        if (typeof window !== 'undefined') {
          const cachedUserJson = localStorage.getItem('sipms_cache_user');
          if (cachedUserJson) {
            try {
              const cachedUser = JSON.parse(cachedUserJson);
              if (cachedUser && cachedUser.role === requiredRole) {
                setUser(cachedUser);
                setLoading(false);
                return;
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
        router.push('/login');
      });
  }, [router, requiredRole]);

  const handleLogout = async () => {
    try {
      localStorage.removeItem('sipms_cache_user');
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (loading || !user) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} className="gradient-bg"></div>
        <p style={{ marginTop: '15px', fontWeight: 600 }}>Memuat Halaman...</p>
      </div>
    );
  }

  // Get navigation links based on user role
  const getNavLinks = () => {
    if (user.role === 'SUPER_ADMIN') {
      return [
        { label: 'Dashboard', path: '/super-admin', icon: <LayoutDashboard size={20} /> },
        { label: 'Sekolah', path: '/super-admin/schools', icon: <School size={20} /> },
        { label: 'Verifikasi Admin', path: '/super-admin/verifications', icon: <UserCheck size={20} /> },
        { label: 'Activity Log', path: '/super-admin/logs', icon: <History size={20} /> },
      ];
    }

    if (user.role === 'SCHOOL_ADMIN') {
      return [
        { label: 'Dashboard', path: '/school-admin', icon: <LayoutDashboard size={20} /> },
        { label: 'Verifikasi Guru', path: '/school-admin/verifications', icon: <UserCheck size={20} /> },
        { label: 'Data Guru', path: '/school-admin/teachers', icon: <Users size={20} /> },
        { label: 'Data Kelas', path: '/school-admin/classes', icon: <Layers size={20} /> },
        { label: 'Mata Pelajaran', path: '/school-admin/subjects', icon: <BookOpen size={20} /> },
        { label: 'Data Murid', path: '/school-admin/students', icon: <User size={20} /> },
        { label: 'Backup & Restore', path: '/school-admin/backups', icon: <Database size={20} /> },
        { label: 'Activity Log', path: '/school-admin/logs', icon: <History size={20} /> },
      ];
    }

    // TEACHER sub-role dynamic links
    const teacherLinks = [
      { label: 'Dashboard', path: '/teacher', icon: <LayoutDashboard size={20} /> },
    ];

    if (user.subRoles?.isGuruMapel) {
      teacherLinks.push({ label: 'Input Presensi', path: '/teacher/attendance', icon: <Clock size={20} /> });
    }

    if (user.subRoles?.isWaliKelas || user.subRoles?.isKepalaSekolah) {
      teacherLinks.push({ label: 'Data Murid', path: '/teacher/students', icon: <User size={20} /> });
    }

    teacherLinks.push({ label: 'Riwayat Harian', path: '/teacher/history', icon: <History size={20} /> });
    teacherLinks.push({ label: 'Rekap Presensi', path: '/teacher/rekap', icon: <FileBarChart size={20} /> });

    return teacherLinks;
  };

  const navLinks = getNavLinks();

  return (
    <div className="dashboard-layout-container">
      {/* Mobile Toggle Button */}
      <button 
        className="dashboard-mobile-btn glass"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{ 
          color: 'var(--foreground)',
          left: sidebarOpen ? '224px' : '16px',
          transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Sidebar Navigation */}
      <aside 
        className="dashboard-sidebar glass"
        style={sidebarOpen ? { transform: 'translateX(0)' } : undefined}
      >
        <div style={styles.sidebarHeader}>
          <div style={styles.logoBadge} className="gradient-bg">
            <GraduationCap size={24} color="#fff" />
          </div>
          <div>
            <h2 style={styles.logoText}>SIPMS</h2>
            <p style={styles.logoSubtext}>Presensi Sekolah</p>
          </div>
        </div>

        <div style={styles.userInfoCard}>
          <div style={styles.userAvatar} className="gradient-bg">
            {user.fullName.charAt(0).toUpperCase()}
          </div>
          <div style={styles.userDetails}>
            <div style={styles.userName}>{user.fullName}</div>
            <div style={styles.userRoleText}>
              {user.role === 'SUPER_ADMIN' ? 'Super Admin' : user.role === 'SCHOOL_ADMIN' ? 'Admin Sekolah' : 'Guru'}
            </div>
            {user.schoolName && <div style={styles.userSchoolName}>{user.schoolName}</div>}
          </div>
        </div>

        <nav style={styles.navMenu}>
          {navLinks.map((link) => {
            const isActive = pathname === link.path;
            return (
              <Link 
                key={link.path}
                href={link.path}
                style={{
                  ...styles.navItem,
                  background: isActive ? 'var(--primary)' : 'transparent',
                  color: isActive ? '#fff' : 'var(--foreground)',
                }}
                onClick={() => setSidebarOpen(false)}
              >
                <span style={styles.navIcon}>{link.icon}</span>
                <span style={styles.navLabel}>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div style={styles.sidebarFooter}>
          <button onClick={handleLogout} style={styles.logoutBtn} className="btn">
            <LogOut size={18} /> Keluar
          </button>
        </div>
      </aside>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && <div className="dashboard-overlay" onClick={() => setSidebarOpen(false)}></div>}

      {/* Main Content Area */}
      <main className="dashboard-main">
        {children}
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    width: '100vw',
  },
  spinner: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  sidebarHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '24px',
    padding: '0 8px',
  },
  logoBadge: {
    width: '40px',
    height: '40px',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 8px rgba(99, 102, 241, 0.2)',
  },
  logoText: {
    fontSize: '1.25rem',
    fontWeight: '800',
    color: 'var(--foreground)',
    letterSpacing: '-0.02em',
  },
  logoSubtext: {
    fontSize: '0.75rem',
    color: 'var(--muted)',
    fontWeight: '600',
  },
  userInfoCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    borderRadius: 'var(--radius-md)',
    background: 'var(--muted-light)',
    border: '1px solid var(--border)',
    marginBottom: '24px',
  },
  userAvatar: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: '700',
    fontSize: '1.2rem',
  },
  userDetails: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  userName: {
    fontSize: '0.9rem',
    fontWeight: '700',
    color: 'var(--foreground)',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
  },
  userRoleText: {
    fontSize: '0.75rem',
    color: 'var(--muted)',
    fontWeight: '600',
  },
  userSchoolName: {
    fontSize: '0.7rem',
    color: 'var(--primary)',
    fontWeight: '700',
    marginTop: '2px',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
  },
  navMenu: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flexGrow: 1,
    overflowY: 'auto',
    padding: '4px 0',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: 'var(--radius-sm)',
    transition: 'var(--transition)',
    fontWeight: '600',
    fontSize: '0.925rem',
  },
  navIcon: {
    display: 'flex',
    alignItems: 'center',
  },
  navLabel: {
    flexGrow: 1,
  },
  sidebarFooter: {
    paddingTop: '16px',
    borderTop: '1px solid var(--border)',
  },
  logoutBtn: {
    width: '100%',
    background: 'var(--danger-light)',
    color: 'var(--danger)',
    border: '1px solid var(--danger-light)',
    justifyContent: 'center',
    height: '42px',
    fontSize: '0.9rem',
  },
};
