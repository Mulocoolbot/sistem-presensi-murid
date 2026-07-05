'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { History, Search, Monitor, Clock, ShieldAlert, Eye, RefreshCw, X } from 'lucide-react';

interface Log {
  id: string;
  username: string;
  role: string;
  action: string;
  ipAddress: string;
  deviceType: string;
  beforeData: Record<string, unknown> | null;
  afterData: Record<string, unknown> | null;
  createdAt: string;
  school?: { name: string } | null;
}

interface SchoolOption {
  id: string;
  name: string;
}

export default function LogsViewerPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search & Filter state
  const [search, setSearch] = useState('');
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  
  // Detail Modal State
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);

  const fetchSchools = useCallback(async () => {
    try {
      const res = await fetch('/api/super-admin/schools');
      if (res.ok) {
        const data = await res.json();
        setSchools(data);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    setError('');
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedSchoolId) params.append('schoolId', selectedSchoolId);
      if (selectedRole) params.append('role', selectedRole);

      const res = await fetch(`/api/super-admin/logs?${params.toString()}`);
      if (!res.ok) throw new Error('Gagal memuat log aktivitas');
      const data = await res.json();
      setLogs(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }, [search, selectedSchoolId, selectedRole]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSchools();
      fetchLogs();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchSchools, fetchLogs]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    fetchLogs();
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title-section">
          <h1>Log Aktivitas Sistem</h1>
          <p>Tinjau dan monitor riwayat audit trail dari tindakan pengguna (login, registrasi, CRUD, backup) di seluruh tenant sekolah</p>
        </div>
        <button className="btn btn-secondary" onClick={() => { setLoading(true); fetchLogs(); }} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <RefreshCw size={16} /> Segarkan
        </button>
      </div>

      {error && (
        <div style={styles.errorAlert}>
          <ShieldAlert size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="glass" style={styles.filterCard}>
        <form onSubmit={handleSearchSubmit} style={styles.filterForm}>
          <div className="form-group" style={{ ...styles.filterCol, flexGrow: 2 }}>
            <label className="form-label">Cari Pengguna atau Tindakan</label>
            <div style={styles.searchWrapper}>
              <Search size={18} style={styles.searchIcon} />
              <input
                type="text"
                className="form-input"
                placeholder="Masukkan kata kunci pencarian (username, tindakan, IP)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          </div>

          <div className="form-group" style={styles.filterCol}>
            <label className="form-label">Filter Sekolah</label>
            <select
              className="form-input"
              value={selectedSchoolId}
              onChange={(e) => setSelectedSchoolId(e.target.value)}
            >
              <option value="">Semua Sekolah</option>
              {schools.map((sch) => (
                <option key={sch.id} value={sch.id}>{sch.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={styles.filterCol}>
            <label className="form-label">Filter Peran</label>
            <select
              className="form-input"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              <option value="">Semua Peran</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="SCHOOL_ADMIN">Admin Sekolah</option>
              <option value="TEACHER">Guru</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary" style={styles.filterSubmitBtn}>
            Cari Log
          </button>
        </form>
      </div>

      {loading ? (
        <div style={styles.loadingArea}>
          <div className="spinner gradient-bg" style={{ width: '40px', height: '40px' }}></div>
          <p style={{ marginTop: '15px', color: 'var(--muted)' }}>Memproses log...</p>
        </div>
      ) : logs.length === 0 ? (
        <div style={styles.emptyArea} className="glass">
          <History size={48} color="var(--muted)" />
          <h3>Tidak ada log aktivitas</h3>
          <p>Tidak menemukan data log aktivitas sistem yang cocok.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Waktu</th>
                <th>Pengguna & Peran</th>
                <th>Sekolah</th>
                <th>Tindakan / Aktivitas</th>
                <th>IP & Perangkat</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600 }}>
                      <Clock size={14} color="var(--muted)" />
                      {new Date(log.createdAt).toLocaleDateString('id-ID')}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '2px', paddingLeft: '20px' }}>
                      {new Date(log.createdAt).toLocaleTimeString('id-ID')}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: '700' }}>{log.username}</div>
                    <span 
                      className={`badge ${
                        log.role === 'SUPER_ADMIN' 
                          ? 'badge-active' 
                          : log.role === 'SCHOOL_ADMIN' 
                          ? 'badge-pending' 
                          : 'badge-inactive'
                      }`}
                      style={{ fontSize: '0.65rem', padding: '2px 6px', marginTop: '4px' }}
                    >
                      {log.role === 'SUPER_ADMIN' ? 'Super Admin' : log.role === 'SCHOOL_ADMIN' ? 'Admin Sekolah' : 'Guru'}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: '600' }}>{log.school?.name || 'Sistem (Global)'}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: '600', fontSize: '0.9rem', lineHeight: '1.3' }}>{log.action}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.825rem' }}>{log.ipAddress}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--muted)', marginTop: '2px' }}>
                      <Monitor size={12} /> {log.deviceType}
                    </div>
                  </td>
                  <td>
                    {(log.beforeData || log.afterData) ? (
                      <button 
                        className="btn btn-secondary" 
                        onClick={() => setSelectedLog(log)}
                        style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                      >
                        <Eye size={12} /> Lihat Data
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* JSON Audit Data Modal */}
      {selectedLog && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard} className="glass">
            <div style={styles.modalHeader}>
              <h3>Detail Data Perubahan (JSON Audit Trail)</h3>
              <button style={styles.modalCloseBtn} onClick={() => setSelectedLog(null)}>
                <X size={20} />
              </button>
            </div>
            
            <div style={styles.modalBody}>
              <div style={styles.modalMetaInfo}>
                <div><strong>Aktivitas:</strong> {selectedLog.action}</div>
                <div><strong>Pengguna:</strong> {selectedLog.username} ({selectedLog.role})</div>
                <div><strong>Sekolah:</strong> {selectedLog.school?.name || 'Global (Sistem)'}</div>
                <div><strong>Waktu:</strong> {new Date(selectedLog.createdAt).toLocaleString('id-ID')}</div>
              </div>

              <div style={styles.jsonSplitGrid}>
                {selectedLog.beforeData && (
                  <div style={styles.jsonBox}>
                    <div style={styles.jsonTitle}>Sebelum Perubahan</div>
                    <pre style={styles.jsonPre}>{JSON.stringify(selectedLog.beforeData, null, 2)}</pre>
                  </div>
                )}
                {selectedLog.afterData && (
                  <div style={styles.jsonBox}>
                    <div style={styles.jsonTitle}>Sesudah Perubahan</div>
                    <pre style={styles.jsonPre}>{JSON.stringify(selectedLog.afterData, null, 2)}</pre>
                  </div>
                )}
              </div>
            </div>
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
  filterCard: {
    padding: '20px',
    borderRadius: 'var(--radius-md)',
    marginBottom: '25px',
    boxShadow: 'var(--glass-shadow)',
  },
  filterForm: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
    alignItems: 'flex-end',
  },
  filterCol: {
    flex: '1 1 200px',
    margin: 0,
  },
  searchWrapper: {
    position: 'relative',
    width: '100%',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--muted)',
  },
  filterSubmitBtn: {
    height: '46px',
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
    maxWidth: '900px',
    padding: '25px',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--glass-shadow)',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--border)',
    paddingBottom: '12px',
    marginBottom: '20px',
    flexShrink: 0,
  },
  modalCloseBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--muted)',
    cursor: 'pointer',
  },
  modalBody: {
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  modalMetaInfo: {
    background: 'var(--muted-light)',
    padding: '14px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
    fontSize: '0.85rem',
    lineHeight: '1.6',
  },
  jsonSplitGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
  },
  jsonBox: {
    flex: '1 1 380px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  jsonTitle: {
    fontWeight: '700',
    fontSize: '0.875rem',
    color: 'var(--primary)',
  },
  jsonPre: {
    background: '#18181b',
    color: '#34d399',
    padding: '14px',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.8rem',
    overflow: 'auto',
    maxHeight: '300px',
    fontFamily: 'monospace',
  },
};
