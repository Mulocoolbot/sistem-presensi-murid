'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { GraduationCap, ShieldAlert, Award, FileText, ArrowRight, ShieldCheck, CheckSquare, Layers, Download, X } from 'lucide-react';

export default function Home() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    // Detect iOS
    const ua = window.navigator.userAgent;
    const ipad = !!ua.match(/iPad/i);
    const iphone = !!ua.match(/iPhone/i);
    if ((ipad || iphone) && !(window as any).MSStream) {
      // Check if not already installed/standalone
      if (!(window.navigator as any).standalone) {
        setIsIos(true);
      }
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA install choice outcome: ${outcome}`);
    setDeferredPrompt(null);
  };

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

            {deferredPrompt && (
              <button onClick={handleInstallClick} className="btn btn-success" style={{ height: '48px', fontSize: '1rem', padding: '0 24px', background: 'var(--success)', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Download size={18} /> Pasang Aplikasi (HP)
              </button>
            )}

            {isIos && (
              <button onClick={() => setShowIosGuide(true)} className="btn btn-success" style={{ height: '48px', fontSize: '1rem', padding: '0 24px', background: 'var(--success)', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Download size={18} /> Pasang di iPhone/iPad
              </button>
            )}

            <Link href="/register/admin?from=landing" className="btn btn-secondary" style={{ height: '48px', fontSize: '1rem', padding: '0 24px' }}>
              Daftarkan Sekolah Baru
            </Link>
          </div>
        </div>

        {/* iOS installation guide modal */}
        {showIosGuide && (
          <div style={styles.modalOverlay}>
            <div className="glass" style={styles.modalCard}>
              <div style={styles.modalHeader}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Panduan Pasang Aplikasi di iPhone / iPad</h3>
                <button onClick={() => setShowIosGuide(false)} style={styles.closeBtn}>
                  <X size={20} />
                </button>
              </div>
              <div style={{ marginTop: '15px', color: 'var(--foreground)' }}>
                <p style={{ fontSize: '0.9rem', marginBottom: '15px', color: 'var(--muted)' }}>
                  Ikuti langkah-langkah mudah di bawah ini untuk memasang aplikasi **SIPMS** langsung di layar utama iPhone atau iPad Anda:
                </p>
                <ol style={styles.iosSteps}>
                  <li style={{ marginBottom: '8px', fontSize: '0.9rem' }}>Buka halaman ini menggunakan browser bawaan **Safari** di iPhone/iPad Anda.</li>
                  <li style={{ marginBottom: '8px', fontSize: '0.9rem' }}>Ketuk tombol **Bagikan (Share)** yang berupa ikon kotak dengan panah ke atas di bagian bawah layar browser.</li>
                  <li style={{ marginBottom: '8px', fontSize: '0.9rem' }}>Gulir ke bawah pada menu bagikan dan ketuk pilihan **Tambahkan ke Layar Utama (Add to Home Screen)**.</li>
                  <li style={{ marginBottom: '8px', fontSize: '0.9rem' }}>Ketuk **Tambah (Add)** di sudut kanan atas untuk mengonfirmasi.</li>
                </ol>
                <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '20px', fontStyle: 'italic' }}>
                  *Aplikasi SIPMS akan muncul langsung di layar utama perangkat iOS Anda seperti aplikasi biasa, dan siap diakses secara offline.*
                </p>
              </div>
            </div>
          </div>
        )}

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
  modalOverlay: {
    position: 'fixed',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    background: 'rgba(0, 0, 0, 0.65)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
    backdropFilter: 'blur(6px)',
  },
  modalCard: {
    width: '100%',
    maxWidth: '520px',
    background: 'var(--background-light, #12131e)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '28px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
    position: 'relative',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--border)',
    paddingBottom: '12px',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--muted)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iosSteps: {
    marginLeft: '20px',
    marginTop: '15px',
    lineHeight: '1.8',
    color: 'var(--foreground)',
  },
};

