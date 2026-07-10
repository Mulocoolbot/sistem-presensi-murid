'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { School, ShieldAlert, Plus, Edit, Trash2, RefreshCw, X } from 'lucide-react';

interface SchoolData {
  id: string;
  name: string;
  address: string;
  phone: string;
  status: boolean;
  createdAt: string;
  _count?: {
    users: number;
    students: number;
    classes: number;
  };
}

export default function SchoolsManagementPage() {
  const [schools, setSchools] = useState<SchoolData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'CREATE' | 'EDIT'>('CREATE');
  const [targetId, setTargetId] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState(true);

  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchSchools = useCallback(async () => {
    setError('');
    try {
      const res = await fetch('/api/super-admin/schools');
      if (!res.ok) throw new Error('Gagal mengambil data daftar sekolah');
      const data = await res.json();
      setSchools(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSchools();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchSchools]);

  const openCreateModal = () => {
    setModalMode('CREATE');
    setTargetId('');
    setName('');
    setAddress('');
    setPhone('');
    setStatus(true);
    setIsModalOpen(true);
  };

  const openEditModal = (sch: SchoolData) => {
    setModalMode('EDIT');
    setTargetId(sch.id);
    setName(sch.name);
    setAddress(sch.address);
    setPhone(sch.phone);
    setStatus(sch.status);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !address || !phone) {
      setError('Harap isi semua bidang input.');
      return;
    }

    setSubmitLoading(true);
    setError('');

    try {
      const url = '/api/super-admin/schools';
      const method = modalMode === 'CREATE' ? 'POST' : 'PUT';
      const body = modalMode === 'CREATE' 
        ? { name, address, phone, status }
        : { id: targetId, name, address, phone, status };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memproses data sekolah');

      setIsModalOpen(false);
      fetchSchools();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id: string, schoolName: string) => {
    if (!confirm(`WARNING: Menghapus sekolah "${schoolName}" akan menghapus permanen seluruh kelas, murid, guru, dan jadwal terkait sekolah ini!\n\nApakah Anda yakin ingin melanjutkan?`)) return;

    setError('');
    try {
      const res = await fetch(`/api/super-admin/schools?id=${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus sekolah');

      fetchSchools();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title-section">
          <h1>Kelola Tenant Sekolah</h1>
          <p>Daftarkan instansi sekolah baru, nonaktifkan akses sekolah, dan pantau jumlah murid serta guru terdaftar</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => { setLoading(true); fetchSchools(); }} disabled={loading}>
            <RefreshCw size={16} /> Segarkan
          </button>
          <button className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={16} /> Tambah Sekolah
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
          <p style={{ marginTop: '15px', color: 'var(--muted)' }}>Memuat daftar sekolah...</p>
        </div>
      ) : schools.length === 0 ? (
        <div style={styles.emptyArea} className="glass">
          <School size={48} color="var(--muted)" />
          <h3>Belum Ada Sekolah</h3>
          <p>Belum ada sekolah yang terdaftar. Klik tombol &apos;Tambah Sekolah&apos; untuk mendaftarkan sekolah baru.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nama Instansi</th>
                <th>Alamat & Telepon</th>
                <th>Statistik Sekolah</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {schools.map((sch) => (
                <tr key={sch.id}>
                  <td>
                    <div style={{ fontWeight: '800', fontSize: '1.05rem', color: 'var(--foreground)' }}>{sch.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '2px' }}>ID: {sch.id}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>{sch.address}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '2px' }}>Telp: {sch.phone}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', fontSize: '0.85rem' }}>
                      <span className="badge badge-active" style={{ background: 'var(--primary-light)', color: 'var(--primary)', minWidth: '82px', justifyContent: 'center' }}>
                        {sch._count?.classes || 0} Kelas
                      </span>
                      <span className="badge badge-pending" style={{ minWidth: '82px', justifyContent: 'center' }}>
                        {sch._count?.users || 0} Akun
                      </span>
                      <span className="badge badge-active" style={{ minWidth: '82px', justifyContent: 'center' }}>
                        {sch._count?.students || 0} Murid
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${sch.status ? 'badge-active' : 'badge-inactive'}`}>
                      {sch.status ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => openEditModal(sch)} 
                        className="btn btn-secondary" 
                        style={{ padding: '6px 10px', fontSize: '0.8rem', display: 'flex', gap: '4px' }}
                      >
                        <Edit size={14} /> Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(sch.id, sch.name)} 
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

      {/* CREATE & EDIT FORM MODAL */}
      {isModalOpen && (
        <div style={styles.modalOverlay}>
          <div className="glass" style={{ ...styles.modalCard, maxWidth: '500px' }}>
            <div style={styles.modalHeader}>
              <h3>{modalMode === 'CREATE' ? 'Daftarkan Instansi Sekolah Baru' : 'Ubah Informasi Sekolah'}</h3>
              <button style={styles.modalCloseBtn} onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} style={styles.modalForm}>
              <div className="form-group">
                <label className="form-label">Nama Sekolah / Instansi</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. SMA Negeri 1 Jaya"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={submitLoading}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Alamat Lengkap</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Jl. Pendidikan No. 12"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  disabled={submitLoading}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Nomor Telepon Instansi</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 021-5551234"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={submitLoading}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Status Akses Sekolah</label>
                <select
                  className="form-input"
                  value={status ? 'true' : 'false'}
                  onChange={(e) => setStatus(e.target.value === 'true')}
                  disabled={submitLoading}
                >
                  <option value="true">Aktif (Bisa Login & Akses)</option>
                  <option value="false">Nonaktif (Akses Dikunci)</option>
                </select>
              </div>

              <div style={styles.modalFooter}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)} disabled={submitLoading}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitLoading}>
                  {submitLoading ? 'Menyimpan...' : 'Simpan Sekolah'}
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
    maxWidth: '500px',
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
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '20px',
    borderTop: '1px solid var(--border)',
    paddingTop: '16px',
  },
};
