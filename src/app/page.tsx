import Link from 'next/link';
import { GraduationCap, ShieldAlert, Award, FileText, ArrowRight, ShieldCheck, CheckSquare, Layers } from 'lucide-react';

export default function Home() {
  return (
    <div style={styles.container}>
      <div style={styles.decorCircle1}></div>
      <div style={styles.decorCircle2}></div>

      {/* Navigation */}
      <header style={styles.navbar}>
        <div style={styles.navBrand}>
          <div style={styles.logoBadge} className="gradient-bg">
            <GraduationCap size={22} color="#fff" />
          </div>
          <span style={styles.brandName}>SIPMS</span>
        </div>
        <Link href="/login" className="btn btn-primary" style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem' }}>
          Login Portal <ArrowRight size={14} />
        </Link>
      </header>

      {/* Hero Section */}
      <main style={styles.main}>
        <div style={styles.heroSection}>
          <div style={styles.taglineBadge}>
            <ShieldCheck size={14} color="var(--primary)" /> Multi-Tenant School Administration
          </div>
          <h1 style={styles.heroTitle}>
            Sistem Informasi <span className="gradient-text">Presensi Murid</span> Sekolah
          </h1>
          <p style={styles.heroDescription}>
            Platform digital mutakhir untuk efisiensi administrasi sekolah, pencatatan presensi siswa secara real-time, audit logs, dan manajemen cadangan otomatis.
          </p>
          <div style={styles.ctas}>
            <Link href="/login" className="btn btn-primary" style={{ height: '48px', fontSize: '1rem', padding: '0 24px' }}>
              Masuk ke Aplikasi
            </Link>
            <Link href="/register/admin" className="btn btn-secondary" style={{ height: '48px', fontSize: '1rem', padding: '0 24px' }}>
              Daftarkan Sekolah Baru
            </Link>
          </div>
        </div>

        {/* Feature Grid */}
        <div style={styles.featureGrid}>
          <div className="glass" style={styles.featureCard}>
            <div style={{ ...styles.featureIconWrapper, background: 'var(--primary-light)' }}>
              <Layers size={22} color="var(--primary)" />
            </div>
            <h4>Multi-Tenant Separation</h4>
            <p>Satu platform dapat digunakan oleh banyak sekolah secara mandiri dengan isolasi basis data yang aman.</p>
          </div>

          <div className="glass" style={styles.featureCard}>
            <div style={{ ...styles.featureIconWrapper, background: 'var(--success-light)' }}>
              <CheckSquare size={22} color="var(--success)" />
            </div>
            <h4>Digital Attendance</h4>
            <p>Input kehadiran harian siswa dengan batasan perubahan (time-lock) demi validitas dan akurasi data.</p>
          </div>

          <div className="glass" style={styles.featureCard}>
            <div style={{ ...styles.featureIconWrapper, background: 'var(--primary-light)' }}>
              <FileText size={22} color="var(--primary)" />
            </div>
            <h4>Auto-Backup Safety</h4>
            <p>Cadangkan data penting (siswa/guru/kelas) secara otomatis sebelum penghapusan untuk pemulihan cepat.</p>
          </div>

          <div className="glass" style={styles.featureCard}>
            <div style={{ ...styles.featureIconWrapper, background: 'var(--success-light)' }}>
              <Award size={22} color="var(--success)" />
            </div>
            <h4>Audit Log Trail</h4>
            <p>Catat seluruh log aktivitas pengguna (login, presensi, CRUD) lengkap dengan data sebelum/sesudah perubahan.</p>
          </div>
        </div>
      </main>

      <footer style={styles.footer}>
        <p>&copy; {new Date().getFullYear()} SIPMS. Pasangan pemrograman dengan Antigravity AI.</p>
      </footer>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    width: '100vw',
    background: 'radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.04) 0%, rgba(168, 85, 247, 0.01) 90.1%)',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    overflowX: 'hidden',
  },
  decorCircle1: {
    position: 'absolute',
    top: '-20%',
    left: '-10%',
    width: '50vw',
    height: '50vw',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(99, 102, 241, 0.06) 0%, transparent 70%)',
    zIndex: 0,
    pointerEvents: 'none',
  },
  decorCircle2: {
    position: 'absolute',
    bottom: '-10%',
    right: '-10%',
    width: '60vw',
    height: '60vw',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(168, 85, 247, 0.06) 0%, transparent 70%)',
    zIndex: 0,
    pointerEvents: 'none',
  },
  navbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 40px',
    maxWidth: '1200px',
    width: '100%',
    margin: '0 auto',
    zIndex: 10,
  },
  navBrand: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logoBadge: {
    width: '36px',
    height: '36px',
    borderRadius: 'var(--radius-sm)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontFamily: 'var(--font-display)',
    fontWeight: '800',
    fontSize: '1.25rem',
    letterSpacing: '-0.02em',
    color: 'var(--foreground)',
  },
  main: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: '1200px',
    width: '100%',
    margin: '0 auto',
    padding: '40px 20px',
    zIndex: 10,
    gap: '60px',
  },
  heroSection: {
    textAlign: 'center',
    maxWidth: '800px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  taglineBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: 'var(--primary-light)',
    color: 'var(--primary)',
    padding: '6px 16px',
    borderRadius: 'var(--radius-full)',
    fontSize: '0.8rem',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '20px',
  },
  heroTitle: {
    fontSize: '3rem',
    fontWeight: '800',
    lineHeight: '1.15',
    letterSpacing: '-0.03em',
    marginBottom: '20px',
    color: 'var(--foreground)',
  } as React.CSSProperties,
  heroDescription: {
    fontSize: '1.1rem',
    color: 'var(--muted)',
    lineHeight: '1.6',
    marginBottom: '35px',
    maxWidth: '650px',
  },
  ctas: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  featureGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '24px',
    width: '100%',
  },
  featureCard: {
    padding: '30px 24px',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--glass-shadow)',
    transition: 'var(--transition)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  featureIconWrapper: {
    width: '46px',
    height: '46px',
    borderRadius: 'var(--radius-sm)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '8px',
  },
  footer: {
    padding: '30px 20px',
    textAlign: 'center',
    borderTop: '1px solid var(--border)',
    fontSize: '0.85rem',
    color: 'var(--muted)',
    zIndex: 10,
  },
};

