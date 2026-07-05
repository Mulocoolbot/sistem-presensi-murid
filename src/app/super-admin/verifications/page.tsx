'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { UserCheck, ShieldAlert, FileText, Check, X, RefreshCw, ExternalLink } from 'lucide-react';

interface AdminDocument {
  id: string;
  type: 'KTP' | 'SURAT_TUGAS';
  fileUrl: string;
}

interface Admin {
  id: string;
  fullName: string;
  nik: string;
  email: string;
  phone: string;
  status: 'PENDING' | 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  school: { name: string };
  documents: AdminDocument[];
}

export default function VerificationsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'PENDING' | 'ACTIVE' | 'INACTIVE' | 'ALL'>('PENDING');

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchAdmins = useCallback(async () => {
    setError('');
    try {
      const res = await fetch('/api/super-admin/admins');
      if (!res.ok) throw new Error('Gagal mengambil data pendaftaran admin');
      const data = await res.json();
      setAdmins(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAdmins();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchAdmins]);

  const handleUpdateStatus = async (userId: string, newStatus: 'ACTIVE' | 'INACTIVE') => {
    const confirmMsg = newStatus === 'ACTIVE' 
      ? 'Apakah Anda yakin ingin MENYETUJUI akun admin ini?' 
      : 'Apakah Anda yakin ingin MENOLAK/MENONAKTIFKAN akun admin ini?';
      
    if (!confirm(confirmMsg)) return;

    setActionLoading(userId);
    setError('');

    try {
      const res = await fetch('/api/super-admin/admins', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengubah status');

      // Update state local
      setAdmins((prev) => 
        prev.map((adm) => (adm.id === userId ? { ...adm, status: newStatus } : adm))
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredAdmins = admins.filter((adm) => {
    if (filter === 'ALL') return true;
    return adm.status === filter;
  });

  return (
    <div>
      <div className="page-header">
        <div className="page-title-section">
          <h1>Verifikasi Admin Sekolah</h1>
          <p>Tinjau berkas permohonan KTP dan Surat Tugas untuk pembukaan tenant sekolah baru, lalu setujui pembukaan akun</p>
        </div>
        <button className="btn btn-secondary" onClick={() => { setLoading(true); fetchAdmins(); }} disabled={loading}>
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
      ) : filteredAdmins.length === 0 ? (
        <div style={styles.emptyArea} className="glass">
          <UserCheck size={48} color="var(--muted)" />
          <h3>Tidak ada pendaftaran</h3>
          <p>Tidak ada data admin sekolah dengan status &quot;{filter === 'PENDING' ? 'Perlu Verifikasi' : filter === 'ACTIVE' ? 'Aktif' : filter === 'INACTIVE' ? 'Ditolak' : 'Semua'}&quot;</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nama & Sekolah</th>
                <th>Kontak & NIK</th>
                <th>Dokumen Verifikasi</th>
                <th>Tanggal Pengajuan</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredAdmins.map((adm) => (
                <tr key={adm.id}>
                  <td>
                    <div style={{ fontWeight: '700' }}>{adm.fullName}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '600', marginTop: '2px' }}>
                      {adm.school?.name || 'Sekolah Tidak Terdaftar'}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: '600' }}>NIK: {adm.nik}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '2px' }}>{adm.email} | {adm.phone}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {adm.documents.map((doc) => (
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
                      {adm.documents.length === 0 && <span style={{ color: 'var(--danger)', fontSize: '0.8rem', fontWeight: 600 }}>Tidak ada berkas</span>}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.85rem' }}>{new Date(adm.createdAt).toLocaleDateString('id-ID')}</div>
                  </td>
                  <td>
                    <span 
                      className={`badge ${
                        adm.status === 'ACTIVE' 
                          ? 'badge-active' 
                          : adm.status === 'PENDING' 
                          ? 'badge-pending' 
                          : 'badge-inactive'
                      }`}
                    >
                      {adm.status === 'ACTIVE' ? 'Disetujui' : adm.status === 'PENDING' ? 'Pending' : 'Ditolak'}
                    </span>
                  </td>
                  <td>
                    {adm.status === 'PENDING' && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn btn-primary"
                          onClick={() => handleUpdateStatus(adm.id, 'ACTIVE')}
                          disabled={actionLoading !== null}
                          style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', gap: '4px' }}
                        >
                          Setujui
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleUpdateStatus(adm.id, 'INACTIVE')}
                          disabled={actionLoading !== null}
                          style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', gap: '4px' }}
                        >
                          Tolak
                        </button>
                      </div>
                    )}
                    {adm.status === 'ACTIVE' && (
                      <button
                        className="btn btn-danger"
                        onClick={() => handleUpdateStatus(adm.id, 'INACTIVE')}
                        disabled={actionLoading !== null}
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      >
                        Nonaktifkan
                      </button>
                    )}
                    {adm.status === 'INACTIVE' && (
                      <button
                        className="btn btn-primary"
                        onClick={() => handleUpdateStatus(adm.id, 'ACTIVE')}
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
  docLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--primary)',
  },
};
