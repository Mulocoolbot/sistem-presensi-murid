'use client';

import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit, Trash2, Key, RefreshCw, X, ShieldAlert } from 'lucide-react';

interface TeacherUser {
  id: string;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  nip: string | null;
  status: 'PENDING' | 'ACTIVE' | 'INACTIVE';
  isKepalaSekolah: boolean;
  isWaliKelas: boolean;
  isGuruMapel: boolean;
  createdAt: string;
}

export default function TeachersManagementPage() {
  const [teachers, setTeachers] = useState<TeacherUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'CREATE' | 'EDIT'>('CREATE');
  const [targetId, setTargetId] = useState('');

  // Password reset modal state
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  // Form inputs
  const [fullName, setFullName] = useState('');
  const [nip, setNip] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const [isKepalaSekolah, setIsKepalaSekolah] = useState(false);
  const [isWaliKelas, setIsWaliKelas] = useState(false);
  const [isGuruMapel, setIsGuruMapel] = useState(true);
  const [status, setStatus] = useState<'PENDING' | 'ACTIVE' | 'INACTIVE'>('ACTIVE');
  
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchTeachers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/school-admin/teachers');
      if (!res.ok) throw new Error('Gagal memuat data daftar guru');
      const data = await res.json();
      setTeachers(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTeachers();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const openCreateModal = () => {
    setModalMode('CREATE');
    setTargetId('');
    setFullName('');
    setNip('');
    setEmail('');
    setPhone('');
    setUsername('');
    setPassword('');
    setIsKepalaSekolah(false);
    setIsWaliKelas(false);
    setIsGuruMapel(true);
    setStatus('ACTIVE');
    setIsModalOpen(true);
  };

  const openEditModal = (t: TeacherUser) => {
    setModalMode('EDIT');
    setTargetId(t.id);
    setFullName(t.fullName);
    setNip(t.nip || '');
    setEmail(t.email);
    setPhone(t.phone);
    setUsername(t.username);
    setPassword('');
    setIsKepalaSekolah(t.isKepalaSekolah);
    setIsWaliKelas(t.isWaliKelas);
    setIsGuruMapel(t.isGuruMapel);
    setStatus(t.status);
    setIsModalOpen(true);
  };

  const openResetModal = (t: TeacherUser) => {
    setTargetId(t.id);
    setFullName(t.fullName);
    setNewPassword('');
    setIsResetModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validations
    if (modalMode === 'CREATE') {
      if (!fullName || !nip || !email || !phone || !username || !password) {
        setError('Harap isi semua kolom input.');
        return;
      }
    } else {
      if (!fullName || !nip || !email || !phone || !username) {
        setError('Harap isi kolom input wajib.');
        return;
      }
    }

    if (!isKepalaSekolah && !isWaliKelas && !isGuruMapel) {
      setError('Harap pilih minimal satu peran mengajar.');
      return;
    }

    setSubmitLoading(true);

    try {
      const url = '/api/school-admin/teachers';
      const method = modalMode === 'CREATE' ? 'POST' : 'PUT';
      
      const payload = modalMode === 'CREATE'
        ? { fullName, nip, email, phone, username, password, isKepalaSekolah, isWaliKelas, isGuruMapel }
        : { userId: targetId, status, isKepalaSekolah, isWaliKelas, isGuruMapel };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memproses data guru');

      setIsModalOpen(false);
      fetchTeachers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      setError('Harap isi password baru.');
      return;
    }

    setSubmitLoading(true);
    setError('');

    try {
      const res = await fetch('/api/school-admin/teachers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetId, password: newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mereset password');

      alert(`Password untuk ${fullName} berhasil diubah!`);
      setIsResetModalOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmMsg = `PENTING: Apakah Anda yakin ingin menghapus Guru "${name}"? Sistem akan otomatis mencadangkan data profil & tugas guru terlebih dahulu.`;
    if (!confirm(confirmMsg)) return;

    setError('');
    try {
      const res = await fetch(`/api/school-admin/teachers?id=${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus guru');

      alert('Guru berhasil dihapus. Cadangan otomatis tersimpan.');
      fetchTeachers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    }
  };

  const getRolesString = (t: TeacherUser) => {
    const roles = [];
    if (t.isKepalaSekolah) roles.push('Kepsek');
    if (t.isWaliKelas) roles.push('Wali Kelas');
    if (t.isGuruMapel) roles.push('Guru Mapel');
    return roles.join(', ') || '-';
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title-section">
          <h1>Kelola Data Guru</h1>
          <p>Tambahkan tenaga pengajar baru, kelola peran, verifikasi status, serta reset password</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={fetchTeachers} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} /> Segarkan
          </button>
          <button className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={16} /> Tambah Guru
          </button>
        </div>
      </div>

      {error && (
        <div style={styles.errorAlert}>
          <ShieldAlert size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={styles.loadingArea}>
          <div className="spinner gradient-bg" style={{ width: '40px', height: '40px' }}></div>
          <p style={{ marginTop: '15px', color: 'var(--muted)' }}>Memuat data pengajar...</p>
        </div>
      ) : teachers.length === 0 ? (
        <div style={styles.emptyArea} className="glass">
          <Users size={48} color="var(--muted)" />
          <h3>Belum Ada Guru</h3>
          <p>Belum ada data guru terdaftar. Klik &apos;Tambah Guru&apos; untuk mendaftarkan akun guru baru.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nama Lengkap</th>
                <th>Username & NIP</th>
                <th>Kontak</th>
                <th>Peran</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((t) => (
                <tr key={t.id}>
                  <td>
                    <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>{t.fullName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '2px' }}>ID: {t.id}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: '600' }}>@{t.username}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '2px' }}>NIP: {t.nip || '-'}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.85rem' }}>{t.email}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{t.phone}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: '600', color: 'var(--primary)', fontSize: '0.85rem' }}>{getRolesString(t)}</div>
                  </td>
                  <td>
                    <span 
                      className={`badge ${
                        t.status === 'PENDING' 
                          ? 'badge-pending' 
                          : t.status === 'ACTIVE' 
                          ? 'badge-active' 
                          : 'badge-inactive'
                      }`}
                    >
                      {t.status === 'PENDING' ? 'Pending' : t.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => openEditModal(t)} 
                        className="btn btn-secondary" 
                        style={{ padding: '6px 10px', fontSize: '0.8rem', display: 'flex', gap: '4px' }}
                      >
                        <Edit size={14} /> Edit
                      </button>
                      <button 
                        onClick={() => openResetModal(t)} 
                        className="btn btn-secondary" 
                        style={{ padding: '6px 10px', fontSize: '0.8rem', display: 'flex', gap: '4px' }}
                        title="Reset Password"
                      >
                        <Key size={14} /> Password
                      </button>
                      <button 
                        onClick={() => handleDelete(t.id, t.fullName)} 
                        className="btn btn-danger" 
                        style={{ padding: '6px 10px', fontSize: '0.8rem', display: 'flex', gap: '4px' }}
                      >
                        <Trash2 size={14} /> Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE & EDIT MODAL */}
      {isModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard} className="glass">
            <div style={styles.modalHeader}>
              <h3>{modalMode === 'CREATE' ? 'Pendaftaran Guru Baru' : 'Ubah Pengaturan Guru'}</h3>
              <button style={styles.modalCloseBtn} onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} style={styles.modalForm}>
              {modalMode === 'CREATE' ? (
                <>
                  <div style={styles.row}>
                    <div className="form-group" style={styles.col}>
                      <label className="form-label">Nama Lengkap</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Budi Santoso, S.Pd."
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        disabled={submitLoading}
                      />
                    </div>
                    <div className="form-group" style={styles.col}>
                      <label className="form-label">NIP</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="NIP Tenaga Pendidik"
                        value={nip}
                        onChange={(e) => setNip(e.target.value)}
                        disabled={submitLoading}
                      />
                    </div>
                  </div>

                  <div style={styles.row}>
                    <div className="form-group" style={styles.col}>
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-input"
                        placeholder="Email aktif"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={submitLoading}
                      />
                    </div>
                    <div className="form-group" style={styles.col}>
                      <label className="form-label">Nomor HP</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Nomor telepon aktif"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        disabled={submitLoading}
                      />
                    </div>
                  </div>

                  <div style={styles.row}>
                    <div className="form-group" style={styles.col}>
                      <label className="form-label">Username</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Username login"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        disabled={submitLoading}
                      />
                    </div>
                    <div className="form-group" style={styles.col}>
                      <label className="form-label">Password</label>
                      <input
                        type="password"
                        className="form-input"
                        placeholder="Password login"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={submitLoading}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ ...styles.modalMetaInfo, marginBottom: '20px' }}>
                  <div><strong>Nama Guru:</strong> {fullName}</div>
                  <div><strong>Username:</strong> @{username}</div>
                  <div><strong>NIP:</strong> {nip || '-'}</div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Peran Pengajar (Bisa pilih lebih dari satu)</label>
                <div style={styles.rolesRow}>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={isKepalaSekolah}
                      onChange={(e) => setIsKepalaSekolah(e.target.checked)}
                      style={styles.checkbox}
                      disabled={submitLoading}
                    />
                    Kepala Sekolah
                  </label>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={isWaliKelas}
                      onChange={(e) => setIsWaliKelas(e.target.checked)}
                      style={styles.checkbox}
                      disabled={submitLoading}
                    />
                    Wali Kelas
                  </label>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={isGuruMapel}
                      onChange={(e) => setIsGuruMapel(e.target.checked)}
                      style={styles.checkbox}
                      disabled={submitLoading}
                    />
                    Guru Mata Pelajaran
                  </label>
                </div>
              </div>

              {modalMode === 'EDIT' && (
                <div className="form-group">
                  <label className="form-label">Status Akun</label>
                  <select
                    className="form-input"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'INACTIVE' | 'PENDING')}
                    disabled={submitLoading}
                  >
                    <option value="ACTIVE">Aktif</option>
                    <option value="INACTIVE">Nonaktif</option>
                    <option value="PENDING">Pending (Tangguhkan)</option>
                  </select>
                </div>
              )}

              <div style={styles.modalFooter}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)} disabled={submitLoading}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitLoading}>
                  {submitLoading ? 'Menyimpan...' : 'Simpan Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {isResetModalOpen && (
        <div style={styles.modalOverlay}>
          <div className="glass" style={{ ...styles.modalCard, maxWidth: '400px' }}>
            <div style={styles.modalHeader}>
              <h3>Reset Password Guru</h3>
              <button style={styles.modalCloseBtn} onClick={() => setIsResetModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleResetPassword} style={styles.modalForm}>
              <div style={{ ...styles.modalMetaInfo, marginBottom: '20px' }}>
                <div><strong>Nama:</strong> {fullName}</div>
              </div>

              <div className="form-group">
                <label className="form-label">Password Baru</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Masukkan password baru"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={submitLoading}
                />
              </div>

              <div style={styles.modalFooter}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsResetModalOpen(false)} disabled={submitLoading}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitLoading}>
                  {submitLoading ? 'Mengubah...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  errorAlert: {
    background: 'var(--danger-light)',
    color: 'var(--danger)',
    border: '1px solid hsl(350, 89%, 90%)',
    borderRadius: 'var(--radius-sm)',
    padding: '12px 18px',
    fontSize: '0.9rem',
    marginBottom: '20px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  loadingArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 0',
  },
  emptyArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    textAlign: 'center',
    gap: '12px',
    borderRadius: 'var(--radius-md)',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    background: 'rgba(0, 0, 0, 0.4)',
    zIndex: 200,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    backdropFilter: 'blur(4px)',
  },
  modalCard: {
    width: '100%',
    maxWidth: '600px',
    padding: '25px',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--glass-shadow)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--border)',
    paddingBottom: '12px',
    marginBottom: '20px',
  },
  modalCloseBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--muted)',
    cursor: 'pointer',
  },
  modalForm: {
    display: 'flex',
    flexDirection: 'column',
  },
  row: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
  },
  col: {
    flex: '1 1 200px',
  },
  rolesRow: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap',
    padding: '8px 0',
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
  modalMetaInfo: {
    background: 'var(--muted-light)',
    padding: '14px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
    fontSize: '0.85rem',
    lineHeight: '1.6',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '20px',
    borderTop: '1px solid var(--border)',
    paddingTop: '16px',
  },
};
