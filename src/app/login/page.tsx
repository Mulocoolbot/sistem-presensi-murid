'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, User, Eye, EyeOff, School, GraduationCap, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Check session first
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (res.ok) {
          return res.json();
        }
        throw new Error('Not authenticated');
      })
      .then((data) => {
        if (data.authenticated) {
          // Redirect based on role
          const { role } = data.user;
          if (role === 'SUPER_ADMIN') router.push('/super-admin');
          else if (role === 'SCHOOL_ADMIN') router.push('/school-admin');
          else if (role === 'TEACHER') router.push('/teacher');
        }
      })
      .catch(() => {});
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Harap isi semua bidang');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Terjadi kesalahan saat masuk');
      }

      // Check user role for routing
      const user = data.user;
      if (user.role === 'SUPER_ADMIN') {
        router.push('/super-admin');
      } else if (user.role === 'SCHOOL_ADMIN') {
        router.push('/school-admin');
      } else if (user.role === 'TEACHER') {
        router.push('/teacher');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan sistem');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.decorCircle1}></div>
      <div style={styles.decorCircle2}></div>
      
      <div style={styles.loginCard} className="glass">
        <div style={styles.backLink}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: 'var(--muted)' }}>
            <ArrowLeft size={16} /> Kembali ke Beranda
          </Link>
        </div>
        <div style={styles.header}>
          <div style={styles.logoBadge} className="gradient-bg">
            <GraduationCap size={32} color="#fff" />
          </div>
          <h1 style={styles.title}>SIPMS</h1>
          <p style={styles.subtitle}>Sistem Informasi Presensi Murid Sekolah</p>
        </div>

        {error && <div style={styles.errorAlert}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div className="form-group">
            <label className="form-label" style={styles.label}>
              <User size={16} style={styles.fieldIcon} /> Username
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Masukkan username Anda"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              style={styles.input}
            />
          </div>

          <div className="form-group" style={{ position: 'relative' }}>
            <label className="form-label" style={styles.label}>
              <Lock size={16} style={styles.fieldIcon} /> Password
            </label>
            <div style={styles.passwordWrapper}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Masukkan password Anda"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                style={{ ...styles.input, paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={styles.submitBtn}
            disabled={loading}
          >
            {loading ? 'Memproses...' : 'Masuk ke Sistem'}
          </button>
        </form>

        <div style={styles.divider}>
          <span style={styles.dividerText}>Belum punya akun?</span>
        </div>

        <div style={styles.registrationOptions}>
          <Link href="/register/admin?from=login" style={styles.regCard}>
            <School size={20} style={styles.regIcon} />
            <div style={styles.regContent}>
              <div style={styles.regTitle}>Registrasi Admin Sekolah</div>
              <div style={styles.regDesc}>Untuk Admin Baru & Sekolah Baru</div>
            </div>
          </Link>

          <Link href="/register/teacher?from=login" style={styles.regCard}>
            <User size={20} style={styles.regIcon} />
            <div style={styles.regContent}>
              <div style={styles.regTitle}>Registrasi Guru</div>
              <div style={styles.regDesc}>Kepala Sekolah, Wali Kelas, Guru Mapel</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    width: '100vw',
    padding: '20px',
    background: 'radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.05) 0%, rgba(168, 85, 247, 0.02) 90.1%)',
    position: 'relative',
    overflow: 'hidden',
  },
  decorCircle1: {
    position: 'absolute',
    top: '-10%',
    left: '-10%',
    width: '40vw',
    height: '40vw',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)',
    zIndex: 0,
  },
  decorCircle2: {
    position: 'absolute',
    bottom: '-10%',
    right: '-10%',
    width: '50vw',
    height: '50vw',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(168, 85, 247, 0.08) 0%, transparent 70%)',
    zIndex: 0,
  },
  loginCard: {
    width: '100%',
    maxWidth: '460px',
    padding: '40px 30px',
    borderRadius: 'var(--radius-lg)',
    zIndex: 10,
    boxShadow: 'var(--glass-shadow)',
  },
  backLink: {
    marginBottom: '15px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  logoBadge: {
    width: '60px',
    height: '60px',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 16px rgba(99, 102, 241, 0.2)',
    marginBottom: '16px',
  },
  title: {
    fontSize: '2rem',
    fontWeight: '800',
    color: 'var(--foreground)',
    letterSpacing: '-0.03em',
    marginBottom: '4px',
  },
  subtitle: {
    fontSize: '0.9rem',
    color: 'var(--muted)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontWeight: '600',
    fontSize: '0.85rem',
  },
  fieldIcon: {
    color: 'var(--primary)',
  },
  input: {
    height: '46px',
    borderRadius: 'var(--radius-sm)',
  },
  passwordWrapper: {
    position: 'relative',
    width: '100%',
  },
  eyeBtn: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    color: 'var(--muted)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px',
  },
  submitBtn: {
    height: '46px',
    marginTop: '10px',
    borderRadius: 'var(--radius-sm)',
    fontSize: '1rem',
  },
  errorAlert: {
    background: 'var(--danger-light)',
    color: 'var(--danger)',
    border: '1px solid hsl(350, 89%, 90%)',
    borderRadius: 'var(--radius-sm)',
    padding: '12px',
    fontSize: '0.85rem',
    marginBottom: '20px',
    fontWeight: '500',
    lineHeight: '1.4',
    textAlign: 'center',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    margin: '25px 0',
  },
  dividerText: {
    fontSize: '0.8rem',
    color: 'var(--muted)',
    whiteSpace: 'nowrap',
    margin: '0 10px',
    fontWeight: '500',
  },
  registrationOptions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  regCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border)',
    background: 'var(--muted-light)',
    transition: 'var(--transition)',
  },
  regIcon: {
    color: 'var(--primary)',
  },
  regContent: {
    display: 'flex',
    flexDirection: 'column',
  },
  regTitle: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: 'var(--foreground)',
  },
  regDesc: {
    fontSize: '0.75rem',
    color: 'var(--muted)',
  },
};
