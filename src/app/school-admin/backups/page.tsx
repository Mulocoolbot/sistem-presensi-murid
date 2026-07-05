'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Database, RefreshCw, Trash2, ShieldAlert, ArrowLeftRight, Clock, FileText } from 'lucide-react';

interface Backup {
  id: string;
  type: 'AUTO' | 'MANUAL';
  filePath: string;
  description: string;
  createdAt: string;
}

export default function BackupsManagementPage() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchBackups = useCallback(async () => {
    setError('');
    try {
      const res = await fetch('/api/school-admin/backups');
      if (!res.ok) throw new Error('Gagal memuat riwayat backup');
      const data = await res.json();
      setBackups(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBackups();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchBackups]);

  const handleCreateManualBackup = async () => {
    if (!confirm('Apakah Anda yakin ingin membuat cadangan data sekolah secara manual sekarang?')) return;
    
    setSubmitLoading(true);
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/school-admin/backups', {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal membuat backup manual');
      
      alert('Pencadangan manual berhasil dibuat!');
      fetchBackups();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
      setLoading(false);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleRestore = async (id: string, description: string) => {
    const confirmMsg = `PERINGATAN SANGAT PENTING:\n\nMemulihkan data dari berkas cadangan "${description}" akan menimpa seluruh data profil dan relasi tabel saat ini di database sekolah Anda.\n\nApakah Anda yakin ingin melanjutkan proses pemulihan data ini?`;
    if (!confirm(confirmMsg)) return;

    setSubmitLoading(true);
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/school-admin/backups', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backupId: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memulihkan data');

      alert('Data sekolah berhasil dipulihkan ke kondisi cadangan!');
      fetchBackups();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
      setLoading(false);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus permanen berkas cadangan ini dari server?')) return;

    setError('');
    try {
      const res = await fetch(`/api/school-admin/backups?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus berkas cadangan');

      fetchBackups();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title-section">
          <h1>Backup & Pemulihan Data</h1>
          <p>Kelola pencadangan manual data sekolah atau pulihkan data dari catatan backup otomatis (Auto-Backup) sebelum penghapusan data penting</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => { setLoading(true); fetchBackups(); }} disabled={loading || submitLoading}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} /> Segarkan
          </button>
          <button className="btn btn-primary" onClick={handleCreateManualBackup} disabled={submitLoading}>
            <Database size={16} /> Buat Backup Manual
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
          <p style={{ marginTop: '15px', color: 'var(--muted)' }}>Memuat riwayat backup...</p>
        </div>
      ) : backups.length === 0 ? (
        <div style={styles.emptyArea} className="glass">
          <Database size={48} color="var(--muted)" />
          <h3>Belum Ada Riwayat Backup</h3>
          <p>Sistem akan otomatis mencadangkan data murid, kelas, atau guru sebelum dihapus. Anda juga dapat membuat cadangan manual dengan tombol di atas.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Waktu Cadangan</th>
                <th>Jenis</th>
                <th>Keterangan / Deskripsi Cadangan</th>
                <th>Berkas Fisik (.json)</th>
                <th>Aksi Pemulihan</th>
              </tr>
            </thead>
            <tbody>
              {backups.map((b) => (
                <tr key={b.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600 }}>
                      <Clock size={14} color="var(--muted)" />
                      {new Date(b.createdAt).toLocaleDateString('id-ID')}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '2px', paddingLeft: '20px' }}>
                      {new Date(b.createdAt).toLocaleTimeString('id-ID')}
                    </div>
                  </td>
                  <td>
                    <span 
                      className={`badge ${
                        b.type === 'AUTO' 
                          ? 'badge-pending' // Orange/Yellow badge
                          : 'badge-active'  // Green badge
                      }`}
                      style={{ fontSize: '0.7rem' }}
                    >
                      {b.type === 'AUTO' ? 'Otomatis' : 'Manual'}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: '700', fontSize: '0.9rem', lineHeight: '1.3' }}>{b.description}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--muted)' }}>
                      <FileText size={12} /> {b.filePath}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => handleRestore(b.id, b.description)} 
                        className="btn btn-secondary" 
                        style={{ padding: '6px 10px', fontSize: '0.8rem', display: 'flex', gap: '4px' }}
                        disabled={submitLoading}
                        title="Pulihkan data sekolah dari file ini"
                      >
                        <ArrowLeftRight size={14} /> Pulihkan
                      </button>
                      <button 
                        onClick={() => handleDelete(b.id)} 
                        className="btn btn-danger" 
                        style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                        disabled={submitLoading}
                        title="Hapus file cadangan"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
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
};
