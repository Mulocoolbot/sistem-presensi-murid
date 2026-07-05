'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { School, User, Mail, Phone, Lock, FileText, ArrowLeft, CheckCircle } from 'lucide-react';

export default function RegisterAdminPage() {
  const router = useRouter();
  
  const [fullName, setFullName] = useState('');
  const [nik, setNik] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const [fotoKtp, setFotoKtp] = useState<File | null>(null);
  const [suratTugas, setSuratTugas] = useState<File | null>(null);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate inputs
    if (!fullName || !nik || !email || !phone || !schoolName || !username || !password) {
      setError('Harap isi semua bidang input.');
      return;
    }

    if (!fotoKtp || !suratTugas) {
      setError('Harap unggah berkas KTP dan Surat Tugas Anda.');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('fullName', fullName);
      formData.append('nik', nik);
      formData.append('email', email);
      formData.append('phone', phone);
      formData.append('schoolName', schoolName);
      formData.append('username', username);
      formData.append('password', password);
      formData.append('fotoKtp', fotoKtp);
      formData.append('suratTugas', suratTugas);

      const response = await fetch('/api/auth/register/admin', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Terjadi kesalahan registrasi.');
      }

      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={styles.container}>
        <div style={styles.decorCircle1}></div>
        <div style={styles.decorCircle2}></div>
        
        <div className="glass" style={{ ...styles.loginCard, textAlign: 'center' }}>
          <div style={styles.successIconWrapper}>
            <CheckCircle size={60} color="var(--success)" />
          </div>
          <h1 style={styles.title}>Registrasi Berhasil</h1>
          <p style={{ ...styles.subtitle, margin: '15px 0 25px 0' }}>
            Data pendaftaran Admin Sekolah telah kami terima dan masuk ke dalam antrean verifikasi Super Admin. Anda dapat masuk setelah akun Anda disetujui.
          </p>
          <Link href="/login" className="btn btn-primary" style={{ width: '100%' }}>
            Kembali ke Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.decorCircle1}></div>
      <div style={styles.decorCircle2}></div>

      <div style={{ ...styles.loginCard, maxWidth: '600px' }} className="glass">
        <div style={styles.backLink}>
          <Link href="/login" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
            <ArrowLeft size={16} /> Kembali
          </Link>
        </div>

        <div style={{ ...styles.header, marginBottom: '20px' }}>
          <h1 style={{ ...styles.title, fontSize: '1.75rem' }}>Registrasi Admin Sekolah</h1>
          <p style={styles.subtitle}>Daftarkan sekolah Anda ke dalam ekosistem SIPMS</p>
        </div>

        {error && <div style={styles.errorAlert}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.row}>
            <div className="form-group" style={styles.col}>
              <label className="form-label"><User size={14} /> Nama Lengkap</label>
              <input
                type="text"
                className="form-input"
                placeholder="Nama Lengkap sesuai KTP"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loading}
              />
            </div>
            
            <div className="form-group" style={styles.col}>
              <label className="form-label"><FileText size={14} /> NIK</label>
              <input
                type="text"
                className="form-input"
                placeholder="16 Digit NIK"
                value={nik}
                onChange={(e) => setNik(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div style={styles.row}>
            <div className="form-group" style={styles.col}>
              <label className="form-label"><Mail size={14} /> Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="Email aktif"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="form-group" style={styles.col}>
              <label className="form-label"><Phone size={14} /> Nomor HP</label>
              <input
                type="text"
                className="form-input"
                placeholder="Nomor HP aktif"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label"><School size={14} /> Nama Sekolah</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. SMAN 1 Jakarta"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              disabled={loading}
            />
          </div>

          <div style={styles.row}>
            <div className="form-group" style={styles.col}>
              <label className="form-label"><User size={14} /> Username</label>
              <input
                type="text"
                className="form-input"
                placeholder="Buat username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="form-group" style={styles.col}>
              <label className="form-label"><Lock size={14} /> Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Buat password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div style={{ ...styles.divider, margin: '15px 0' }}>
            <span style={styles.dividerText}>Unggah Berkas Verifikasi</span>
          </div>

          <div style={styles.row}>
            <div className="form-group" style={styles.col}>
              <label className="form-label">Foto KTP (.jpg/.png/.pdf)</label>
              <input
                type="file"
                className="form-input"
                accept="image/*,application/pdf"
                onChange={(e) => setFotoKtp(e.target.files ? e.target.files[0] : null)}
                disabled={loading}
                style={{ padding: '6px' }}
              />
            </div>

            <div className="form-group" style={styles.col}>
              <label className="form-label">Surat Tugas Sekolah (.jpg/.png/.pdf)</label>
              <input
                type="file"
                className="form-input"
                accept="image/*,application/pdf"
                onChange={(e) => setSuratTugas(e.target.files ? e.target.files[0] : null)}
                disabled={loading}
                style={{ padding: '6px' }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ height: '46px', marginTop: '20px' }}
            disabled={loading}
          >
            {loading ? 'Mengirim Data...' : 'Kirim Pendaftaran'}
          </button>
        </form>
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
    padding: '40px 20px',
    background: 'radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.05) 0%, rgba(168, 85, 247, 0.02) 90.1%)',
    position: 'relative',
    overflowY: 'auto',
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
    pointerEvents: 'none',
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
    pointerEvents: 'none',
  },
  loginCard: {
    width: '100%',
    maxWidth: '460px',
    padding: '30px',
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
  },
  title: {
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
  row: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
  },
  col: {
    flex: '1 1 240px',
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
    textAlign: 'center',
  },
  successIconWrapper: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '20px',
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
    fontWeight: '600',
  },
};
