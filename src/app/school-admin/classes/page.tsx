'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Layers, RefreshCw, X, ShieldAlert } from 'lucide-react';

interface Teacher {
  id: string;
  fullName: string;
  status: string;
}

interface ClassData {
  id: string;
  name: string;
  grade: string;
  capacity: number;
  waliKelasId: string | null;
  waliKelas: { fullName: string } | null;
  _count?: {
    students: number;
  };
}

export default function ClassesManagementPage() {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'CREATE' | 'EDIT'>('CREATE');
  const [targetId, setTargetId] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('10');
  const [capacity, setCapacity] = useState('36');
  const [waliKelasId, setWaliKelasId] = useState('');

  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchTeachers = useCallback(async () => {
    try {
      const res = await fetch('/api/school-admin/teachers');
      if (res.ok) {
        const data = await res.json();
        // Filter teachers who are active
        const activeTeachers = data.filter((t: Teacher) => t.status === 'ACTIVE');
        setTeachers(activeTeachers);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchClasses = useCallback(async () => {
    setError('');
    try {
      const res = await fetch('/api/school-admin/classes');
      if (!res.ok) throw new Error('Gagal mengambil daftar kelas');
      const data = await res.json();
      setClasses(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTeachers();
      fetchClasses();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchTeachers, fetchClasses]);

  const openCreateModal = () => {
    setModalMode('CREATE');
    setTargetId('');
    setName('');
    setGrade('10');
    setCapacity('36');
    setWaliKelasId('');
    setIsModalOpen(true);
  };

  const openEditModal = (c: ClassData) => {
    setModalMode('EDIT');
    setTargetId(c.id);
    setName(c.name);
    setGrade(c.grade);
    setCapacity(c.capacity.toString());
    setWaliKelasId(c.waliKelasId || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !grade || !capacity) {
      setError('Nama kelas, tingkat, dan kapasitas wajib diisi.');
      return;
    }

    setSubmitLoading(true);
    setError('');

    try {
      const url = '/api/school-admin/classes';
      const method = modalMode === 'CREATE' ? 'POST' : 'PUT';
      const body = modalMode === 'CREATE'
        ? { name, grade, capacity: parseInt(capacity), waliKelasId: waliKelasId || null }
        : { id: targetId, name, grade, capacity: parseInt(capacity), waliKelasId: waliKelasId || null };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan data kelas');

      setIsModalOpen(false);
      fetchClasses();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id: string, className: string) => {
    const confirmMsg = `PENTING: Menghapus kelas "${className}" akan otomatis membuat backup data kelas beserta murid di dalamnya terlebih dahulu. Apakah Anda yakin?`;
    if (!confirm(confirmMsg)) return;

    setError('');
    try {
      const res = await fetch(`/api/school-admin/classes?id=${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus kelas');

      alert('Kelas berhasil dihapus. Berkas cadangan otomatis telah dibuat.');
      fetchClasses();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title-section">
          <h1>Kelola Data Kelas</h1>
          <p>Daftarkan rombongan belajar sekolah, tentukan Wali Kelas, dan atur kapasitas siswa per kelas</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => { setLoading(true); fetchClasses(); }} disabled={loading}>
            <RefreshCw size={16} /> Segarkan
          </button>
          <button className="btn btn-primary" onClick={openCreateModal}>
            Tambah Kelas
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
          <p style={{ marginTop: '15px', color: 'var(--muted)' }}>Memuat data kelas...</p>
        </div>
      ) : classes.length === 0 ? (
        <div style={styles.emptyArea} className="glass">
          <Layers size={48} color="var(--muted)" />
          <h3>Belum Ada Kelas</h3>
          <p>Belum ada kelas terdaftar. Klik &apos;Tambah Kelas&apos; untuk membuat rombongan belajar baru.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nama Kelas</th>
                <th>Tingkat</th>
                <th>Kapasitas & Jumlah Siswa</th>
                <th>Wali Kelas</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((cls) => (
                <tr key={cls.id}>
                  <td>
                    <div style={{ fontWeight: '700', fontSize: '1.05rem' }}>{cls.name}</div>
                  </td>
                  <td>
                    <span className="badge badge-active" style={{ background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: '700' }}>
                      Tingkat {cls.grade}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: '600' }}>
                      {cls._count?.students || 0} / {cls.capacity} Siswa
                    </div>
                    <div style={{ width: '100%', background: 'var(--border)', height: '6px', borderRadius: '3px', marginTop: '6px', overflow: 'hidden' }}>
                      <div 
                        className="gradient-bg" 
                        style={{ 
                          width: `${Math.min(100, (((cls._count?.students || 0) / cls.capacity) * 100))}%`, 
                          height: '100%' 
                        }}
                      ></div>
                    </div>
                  </td>
                  <td>
                    {cls.waliKelas ? (
                      <span className="badge badge-active" style={{ fontSize: '0.85rem' }}>
                        {cls.waliKelas.fullName}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--danger)', fontWeight: '600', fontSize: '0.85rem' }}>
                        Belum Ditentukan
                      </span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => openEditModal(cls)} 
                        className="btn btn-secondary" 
                        style={{ padding: '6px 10px', fontSize: '0.8rem', display: 'flex', gap: '4px' }}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(cls.id, cls.name)} 
                        className="btn btn-danger" 
                        style={{ padding: '6px 10px', fontSize: '0.8rem', display: 'flex', gap: '4px' }}
                      >
                        Hapus
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
              <h3>{modalMode === 'CREATE' ? 'Tambah Rombongan Belajar Baru' : 'Ubah Data Kelas'}</h3>
              <button style={styles.modalCloseBtn} onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} style={styles.modalForm}>
              <div className="form-group">
                <label className="form-label">Nama Rombongan Belajar</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Kelas X-A"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={submitLoading}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tingkat / Grade</label>
                <select
                  className="form-input"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  disabled={submitLoading}
                >
                  <option value="7">Kelas 7 (SMP)</option>
                  <option value="8">Kelas 8 (SMP)</option>
                  <option value="9">Kelas 9 (SMP)</option>
                  <option value="10">Kelas 10 (SMA)</option>
                  <option value="11">Kelas 11 (SMA)</option>
                  <option value="12">Kelas 12 (SMA)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Kapasitas Maksimum Kelas (Siswa)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="e.g. 36"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  disabled={submitLoading}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tentukan Wali Kelas (Guru Terdaftar)</label>
                <select
                  className="form-input"
                  value={waliKelasId}
                  onChange={(e) => setWaliKelasId(e.target.value)}
                  disabled={submitLoading}
                >
                  <option value="">-- Belum Ditentukan / Kosong --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.fullName}</option>
                  ))}
                </select>
              </div>

              <div style={styles.modalFooter}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)} disabled={submitLoading}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitLoading}>
                  {submitLoading ? 'Menyimpan...' : 'Simpan Kelas'}
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
