'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { School, User, Mail, Phone, Lock, FileText, ArrowLeft, CheckCircle, ShieldAlert } from 'lucide-react';

interface SchoolOption {
  id: string;
  name: string;
  address: string;
}

export default function RegisterTeacherPage() {
  const router = useRouter();

  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  
  const [fullName, setFullName] = useState('');
  const [nip, setNip] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Sub-roles
  const [isKepalaSekolah, setIsKepalaSekolah] = useState(false);
  const [isWaliKelas, setIsWaliKelas] = useState(false);
  const [isGuruMapel, setIsGuruMapel] = useState(true); // Default checked
  
  const [fotoKtp, setFotoKtp] = useState<File | null>(null);
  const [suratTugas, setSuratTugas] = useState<File | null>(null);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch active schools for the dropdown selector
  useEffect(() => {
    fetch('/api/auth/schools')
      .then((res) => {
        if (!res.ok) throw new Error('Gagal mengambil daftar sekolah');
        return res.json();
      })
      .then((data) => {
        setSchools(data);
        if (data.length > 0) {
          setSelectedSchoolId(data[0].id);
        }
      })
      .catch((err) => {
        console.error(err);
        setError('Gagal memuat daftar sekolah. Silakan muat ulang halaman.');
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate inputs
    if (!fullName || !nip || !email || !phone || !selectedSchoolId || !username || !password) {
      setError('Harap isi semua bidang input.');
      return;
    }

    if (!isKepalaSekolah && !isWaliKelas && !isGuruMapel) {
      setError('Harap pilih minimal satu peran mengajar Anda.');
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
      formData.append('nip', nip);
      formData.append('email', email);
      formData.append('phone', phone);
      formData.append('schoolId', selectedSchoolId);
      formData.append('username', username);
      formData.append('password', password);
      formData.append('isKepalaSekolah', String(isKepalaSekolah));
      formData.append('isWaliKelas', String(isWaliKelas));
      formData.append('isGuruMapel', String(isGuruMapel));
      formData.append('fotoKtp', fotoKtp);
      formData.append('suratTugas', suratTugas);

      const response = await fetch('/api/auth/register/teacher', {
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
            Data pendaftaran Guru telah kami terima. Akun Anda saat ini berstatus Pending dan sedang menunggu verifikasi oleh Admin Sekolah terkait.
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
          <h1 style={{ ...styles.title, fontSize: '1.75rem' }}>Registrasi Guru</h1>
          <p style={styles.subtitle}>Daftarkan diri Anda ke sistem sekolah terdaftar</p>
        </div>

        {error && <div style={styles.errorAlert}>{error}</div>}

        {schools.length === 0 && !error ? (
          <div style={{ ...styles.errorAlert, background: 'var(--warning-light)', color: 'var(--warning)', borderColor: 'hsl(38, 92%, 90%)' }}>
            <ShieldAlert size={18} style={{ marginRight: '6px', display: 'inline' }} />
            Belum ada sekolah aktif yang terdaftar di sistem. Hubungi Super Admin.
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={styles.form}>
            <div className="form-group">
              <label className="form-label"><School size={14} /> Pilih Sekolah Tempat Mengajar</label>
              <select
                className="form-input"
                value={selectedSchoolId}
                onChange={(e) => setSelectedSchoolId(e.target.value)}
                disabled={loading}
                style={{ appearance: 'none', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center' }}
              >
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name} - {school.address}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.row}>
              <div className="form-group" style={styles.col}>
                <label className="form-label"><User size={14} /> Nama Lengkap</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nama Lengkap dengan Gelar"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={loading}
                />
              </div>
              
              <div className="form-group" style={styles.col}>
                <label className="form-label"><FileText size={14} /> NIP</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="NIP / Nomor Identitas Pegawai"
                  value={nip}
                  onChange={(e) => setNip(e.target.value)}
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
              <span style={styles.dividerText}>Peran Mengajar (Bisa pilih lebih dari satu)</span>
            </div>

            <div style={styles.rolesRow}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={isKepalaSekolah}
                  onChange={(e) => setIsKepalaSekolah(e.target.checked)}
                  style={styles.checkbox}
                />
                Kepala Sekolah
              </label>

              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={isWaliKelas}
                  onChange={(e) => setIsWaliKelas(e.target.checked)}
                  style={styles.checkbox}
                />
                Wali Kelas
              </label>

              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={isGuruMapel}
                  onChange={(e) => setIsGuruMapel(e.target.checked)}
                  style={styles.checkbox}
                />
                Guru Mata Pelajaran
              </label>
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
                <label className="form-label">Surat Tugas Mengajar (.jpg/.png/.pdf)</label>
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
        )}
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
  rolesRow: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap',
    padding: '10px 0',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer',
    color: 'var(--foreground)',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    accentColor: 'var(--primary)',
    cursor: 'pointer',
  },
};
