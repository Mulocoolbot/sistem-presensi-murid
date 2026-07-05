'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { UserCheck, ShieldAlert, FileText, Check, X, RefreshCw, ExternalLink } from 'lucide-react';

interface TeacherDocument {
  id: string;
  type: 'KTP' | 'SURAT_TUGAS';
  fileUrl: string;
}

interface Teacher {
  id: string;
  fullName: string;
  nip: string;
  email: string;
  phone: string;
  status: 'PENDING' | 'ACTIVE' | 'INACTIVE';
  isKepalaSekolah: boolean;
  isWaliKelas: boolean;
  isGuruMapel: boolean;
  createdAt: string;
  documents: TeacherDocument[];
}

export default function VerificationsPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'PENDING' | 'ACTIVE' | 'INACTIVE' | 'ALL'>('PENDING');

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchTeachers = useCallback(async () => {
    setError('');
    try {
      const res = await fetch('/api/school-admin/teachers');
      if (!res.ok) throw new Error('Gagal mengambil data pendaftaran guru');
      const data = await res.json();
      setTeachers(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTeachers();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchTeachers]);

  const handleUpdateStatus = async (userId: string, newStatus: 'ACTIVE' | 'INACTIVE') => {
    const confirmMsg = newStatus === 'ACTIVE'
      ? 'Apakah Anda yakin ingin MENYETUJUI akun guru ini?'
      : 'Apakah Anda yakin ingin MENOLAK/MENONAKTIFKAN akun guru ini?';

    if (!confirm(confirmMsg)) return;

    setActionLoading(userId);
    setError('');

    try {
      const res = await fetch('/api/school-admin/teachers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengubah status');

      // Update state local
      setTeachers((prev) =>
        prev.map((t) => (t.id === userId ? { ...t, status: newStatus } : t))
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredTeachers = teachers.filter((t) => {
    if (filter === 'ALL') return true;
    return t.status === filter;
  });

  return (
    <div>
      <div className="page-header">
        <div className="page-title-section">
          <h1>Verifikasi Guru Terdaftar</h1>
          <p>Tinjau dokumen Surat Tugas dan KTP pendaftaran akun guru, lalu lakukan verifikasi persetujuan akun</p>
        </div>
        <button className="btn btn-secondary" onClick={() => { setLoading(true); fetchTeachers(); }} disabled={loading}>
          <RefreshCw size={16} /> Segarkan
        </button>
      </div>

      {error && (
        <div style={styles.errorAlert}>
          <ShieldAlert size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs Filter */}
      <div style={styles.tabContainer}>
        {['PENDING', 'ACTIVE', 'INACTIVE', 'ALL'].map((tab) => (
          <button
            key={tab}
            style={{
              ...styles.tabBtn,
              borderBottom: filter === tab ? '3px solid var(--primary)' : '3px solid transparent',
              color: filter === tab ? 'var(--primary)' : 'var(--muted)',
              fontWeight: filter === tab ? '700' : '600',
            }}
            onClick={() => setFilter(tab as 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'ALL')}
          >
            {tab === 'PENDING' ? 'Perlu Verifikasi' : tab === 'ACTIVE' ? 'Aktif' : tab === 'INACTIVE' ? 'Ditolak' : 'Semua'}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={styles.loadingArea}>
          <div className="spinner gradient-bg" style={{ width: '30px', height: '30px' }}></div>
          <p style={{ marginTop: '10px', fontSize: '0.9rem', color: 'var(--muted)' }}>Memuat data pendaftaran...</p>
        </div>
      ) : filteredTeachers.length === 0 ? (
        <div style={styles.emptyArea} className="glass">
          <UserCheck size={48} color="var(--muted)" />
          <h3>Tidak ada pendaftaran</h3>
          <p>Tidak ada pendaftaran guru dengan status &quot;{filter === 'PENDING' ? 'Perlu Verifikasi' : filter === 'ACTIVE' ? 'Aktif' : filter === 'INACTIVE' ? 'Ditolak' : 'Semua'}&quot;</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nama Guru & Peran</th>
                <th>Kontak & NIP</th>
                <th>Dokumen Verifikasi</th>
                <th>Tanggal Daftar</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeachers.map((t) => (
                <tr key={t.id}>
                  <td>
                    <div style={{ fontWeight: '700' }}>{t.fullName}</div>
                    <div style={styles.rolesRow}>
                      {t.isKepalaSekolah && <span className="badge badge-active" style={styles.roleBadge}>Kepsek</span>}
                      {t.isWaliKelas && <span className="badge badge-pending" style={styles.roleBadge}>Wali Kelas</span>}
                      {t.isGuruMapel && <span className="badge badge-active" style={{ ...styles.roleBadge, background: 'var(--primary-light)', color: 'var(--primary)' }}>Guru Mapel</span>}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: '600' }}>NIP: {t.nip || '-'}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '2px' }}>{t.email} | {t.phone}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {t.documents.map((doc) => (
                        <a
                          key={doc.id}
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={styles.docLink}
                        >
                          <FileText size={14} /> {doc.type} <ExternalLink size={10} />
                        </a>
                      ))}
                      {t.documents.length === 0 && <span style={{ color: 'var(--danger)', fontSize: '0.8rem', fontWeight: 600 }}>Tidak ada berkas</span>}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.85rem' }}>{new Date(t.createdAt).toLocaleDateString('id-ID')}</div>
                  </td>
                  <td>
                    <span 
                      className={`badge ${
                        t.status === 'ACTIVE' 
                          ? 'badge-active' 
                          : t.status === 'PENDING' 
                          ? 'badge-pending' 
                          : 'badge-inactive'
                      }`}
                    >
                      {t.status === 'ACTIVE' ? 'Disetujui' : t.status === 'PENDING' ? 'Pending' : 'Ditolak'}
                    </span>
                  </td>
                  <td>
                    {t.status === 'PENDING' && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn btn-primary"
                          onClick={() => handleUpdateStatus(t.id, 'ACTIVE')}
                          disabled={actionLoading !== null}
                          style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', gap: '4px' }}
                        >
                          <Check size={14} /> Setujui
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleUpdateStatus(t.id, 'INACTIVE')}
                          disabled={actionLoading !== null}
                          style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', gap: '4px' }}
                        >
                          <X size={14} /> Tolak
                        </button>
                      </div>
                    )}
                    {t.status === 'ACTIVE' && (
                      <button
                        className="btn btn-danger"
                        onClick={() => handleUpdateStatus(t.id, 'INACTIVE')}
                        disabled={actionLoading !== null}
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      >
                        Nonaktifkan
                      </button>
                    )}
                    {t.status === 'INACTIVE' && (
                      <button
                        className="btn btn-primary"
                        onClick={() => handleUpdateStatus(t.id, 'ACTIVE')}
                        disabled={actionLoading !== null}
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      >
                        Aktifkan Kembali
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
  tabContainer: {
    display: 'flex',
    gap: '24px',
    borderBottom: '1px solid var(--border)',
    marginBottom: '20px',
  },
  tabBtn: {
    background: 'none',
    border: 'none',
    padding: '10px 4px',
    cursor: 'pointer',
    fontSize: '0.925rem',
    transition: 'var(--transition)',
  },
  loadingArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 0',
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
  rolesRow: {
    display: 'flex',
    gap: '4px',
    marginTop: '4px',
  },
  roleBadge: {
    fontSize: '0.65rem',
    padding: '2px 6px',
    fontWeight: 700,
  },
  docLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--primary)',
  },
};
