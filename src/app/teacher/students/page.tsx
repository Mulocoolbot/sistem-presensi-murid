'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Edit, Trash2, RefreshCw, X, ShieldAlert, Search, ExternalLink, Eye } from 'lucide-react';

interface ClassOption {
  id: string;
  name: string;
}

interface Student {
  id: string;
  nis: string;
  nisn: string;
  fullName: string;
  gender: string; // "L" / "P"
  birthPlace: string;
  birthDate: string;
  religion: string;
  address: string;
  parentName: string;
  parentPhone: string;
  kkFileUrl: string | null;
  status: 'ACTIVE' | 'MUTATED' | 'GRADUATED' | 'INACTIVE';
  classId: string;
  class: { name: string };
  createdAt: string;
}

export default function TeacherStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  
  const [isWaliKelas, setIsWaliKelas] = useState(false);
  const [isKepalaSekolah, setIsKepalaSekolah] = useState(false);
  const [myClassId, setMyClassId] = useState('');
  const [myClassName, setMyClassName] = useState('');
  const [selectedClassId, setSelectedClassId] = useState(''); // Used by Kepsek to filter classes

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'CREATE' | 'EDIT'>('CREATE');
  const [targetId, setTargetId] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [nis, setNis] = useState('');
  const [nisn, setNisn] = useState('');
  const [gender, setGender] = useState('L');
  const [birthPlace, setBirthPlace] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [religion, setReligion] = useState('Islam');
  const [address, setAddress] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'MUTATED' | 'GRADUATED' | 'INACTIVE'>('ACTIVE');
  const [kkFile, setKkFile] = useState<File | null>(null);

  const [submitLoading, setSubmitLoading] = useState(false);

  const loadProfileAndData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch Teacher Role and Sub-roles
      const dashRes = await fetch('/api/teacher/dashboard');
      if (!dashRes.ok) throw new Error('Gagal mengambil data profil perwalian');
      const dashData = await dashRes.json();

      setIsWaliKelas(dashData.isWaliKelas);
      setIsKepalaSekolah(dashData.isKepalaSekolah);

      // 2. Fetch Classes list for Kepsek lookup
      if (dashData.isKepalaSekolah) {
        const classRes = await fetch('/api/school-admin/classes');
        if (classRes.ok) {
          const classData = await classRes.json();
          setClasses(classData);
          if (classData.length > 0) {
            setSelectedClassId(classData[0].id);
          }
        }
      }

      if (dashData.isWaliKelas && dashData.waliStats) {
        setMyClassId(dashData.waliStats.classId);
        setMyClassName(dashData.waliStats.className);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStudents = useCallback(async () => {
    if (!myClassId && !selectedClassId) return;

    setLoading(true);
    setError('');
    try {
      // If Wali kelas, strictly fetch their class. If Kepsek, fetch the selected class.
      const targetId = isWaliKelas ? myClassId : selectedClassId;
      const res = await fetch(`/api/school-admin/students?classId=${targetId}`);
      if (!res.ok) throw new Error('Gagal memuat daftar murid');
      const data = await res.json();
      setStudents(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }, [myClassId, selectedClassId, isWaliKelas]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProfileAndData();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadProfileAndData]);

  // Re-fetch students when class context resolves
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudents();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchStudents]);

  const openCreateModal = () => {
    setModalMode('CREATE');
    setTargetId('');
    setFullName('');
    setNis('');
    setNisn('');
    setGender('L');
    setBirthPlace('');
    setBirthDate('');
    setReligion('Islam');
    setAddress('');
    setParentName('');
    setParentPhone('');
    setStatus('ACTIVE');
    setKkFile(null);
    setIsModalOpen(true);
  };

  const openEditModal = (s: Student) => {
    setModalMode('EDIT');
    setTargetId(s.id);
    setFullName(s.fullName);
    setNis(s.nis);
    setNisn(s.nisn);
    setGender(s.gender);
    setBirthPlace(s.birthPlace);
    const formattedDate = s.birthDate ? s.birthDate.substring(0, 10) : '';
    setBirthDate(formattedDate);
    setReligion(s.religion);
    setAddress(s.address);
    setParentName(s.parentName);
    setParentPhone(s.parentPhone);
    setStatus(s.status);
    setKkFile(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !nis || !nisn || !gender || !birthPlace || !birthDate || !religion || !address || !parentName || !parentPhone) {
      setError('Harap lengkapi semua kolom input wajib.');
      return;
    }

    setSubmitLoading(true);
    setError('');

    try {
      const formData = new FormData();
      if (modalMode === 'EDIT') {
        formData.append('id', targetId);
        formData.append('status', status);
      }
      formData.append('fullName', fullName);
      formData.append('nis', nis);
      formData.append('nisn', nisn);
      formData.append('gender', gender);
      formData.append('birthPlace', birthPlace);
      formData.append('birthDate', birthDate);
      formData.append('religion', religion);
      formData.append('address', address);
      formData.append('parentName', parentName);
      formData.append('parentPhone', parentPhone);
      formData.append('classId', myClassId); // Strict to Wali kelas's class ID!
      if (kkFile) {
        formData.append('kkFile', kkFile);
      }

      const url = '/api/school-admin/students';
      const method = modalMode === 'CREATE' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memproses data murid');

      setIsModalOpen(false);
      fetchStudents();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmMsg = `WARNING: Menghapus murid "${name}" akan membuat backup otomatis datanya terlebih dahulu sebelum melakukan soft-delete. Lanjutkan?`;
    if (!confirm(confirmMsg)) return;

    setError('');
    try {
      const res = await fetch(`/api/school-admin/students?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus siswa');

      alert('Siswa berhasil dihapus. Cadangan otomatis tersimpan.');
      fetchStudents();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    }
  };

  const filteredStudents = students.filter((s) => 
    s.fullName.toLowerCase().includes(search.toLowerCase()) || 
    s.nis.includes(search) || 
    s.nisn.includes(search)
  );

  const canManage = isWaliKelas; // Wali Kelas can edit class members, Kepsek is read-only.

  return (
    <div>
      <div className="page-header">
        <div className="page-title-section">
          <h1>
            {isWaliKelas ? `Manajemen Murid Kelas ${myClassName}` : 'Lookup Data Murid'}
          </h1>
          <p>
            {isWaliKelas 
              ? 'Kelola data registrasi murid perwalian Anda, edit mutasi, kelulusan, dan kelola dokumen KK'
              : 'Pantau data biodata murid dan berkas KK di seluruh kelas sekolah Anda (Hanya Lihat)'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={fetchStudents} disabled={loading}>
            <RefreshCw size={16} /> Segarkan
          </button>
          {canManage && (
            <button className="btn btn-primary" onClick={openCreateModal} disabled={!myClassId}>
              <Plus size={16} /> Tambah Murid Kelas
            </button>
          )}
        </div>
      </div>

      {error && (
        <div style={styles.errorAlert}>
          <ShieldAlert size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="glass" style={styles.filterCard}>
        <div style={styles.filterForm}>
          <div className="form-group" style={{ ...styles.filterCol, flexGrow: 2 }}>
            <label className="form-label">Cari Nama / NIS</label>
            <div style={styles.searchWrapper}>
              <Search size={18} style={styles.searchIcon} />
              <input
                type="text"
                className="form-input"
                placeholder="Masukkan nama lengkap atau NIS murid..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          </div>

          {isKepalaSekolah && (
            <div className="form-group" style={styles.filterCol}>
              <label className="form-label">Tampilkan Kelas</label>
              <select
                className="form-input"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
              >
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div style={styles.loadingArea}>
          <div className="spinner gradient-bg" style={{ width: '40px', height: '40px' }}></div>
          <p style={{ marginTop: '15px', color: 'var(--muted)' }}>Memproses data siswa...</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div style={styles.emptyArea} className="glass">
          <Users size={48} color="var(--muted)" />
          <h3>Tidak ada murid terdaftar</h3>
          <p>Belum ada siswa terdaftar di dalam kelas terpilih atau kriteria pencarian tidak cocok.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nama Murid</th>
                <th>NIS / NISN</th>
                <th>Orang Tua & Kontak</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>{s.fullName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '2px' }}>
                      JK: {s.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: '600' }}>NIS: {s.nis}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>NISN: {s.nisn}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>{s.parentName}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{s.parentPhone}</div>
                  </td>
                  <td>
                    <span 
                      className={`badge ${
                        s.status === 'ACTIVE' 
                          ? 'badge-active' 
                          : s.status === 'MUTATED' 
                          ? 'badge-pending' 
                          : 'badge-inactive'
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => setSelectedStudent(s)} 
                        className="btn btn-secondary" 
                        style={{ padding: '6px 10px', fontSize: '0.8rem', display: 'flex', gap: '4px' }}
                      >
                        <Eye size={14} /> Detail
                      </button>
                      {canManage && (
                        <>
                          <button 
                            onClick={() => openEditModal(s)} 
                            className="btn btn-secondary" 
                            style={{ padding: '6px 10px', fontSize: '0.8rem', display: 'flex', gap: '4px' }}
                          >
                            <Edit size={14} /> Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(s.id, s.fullName)} 
                            className="btn btn-danger" 
                            style={{ padding: '6px 10px', fontSize: '0.8rem', display: 'flex', gap: '4px' }}
                          >
                            <Trash2 size={14} /> Hapus
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE & EDIT FORM MODAL (Wali kelas only) */}
      {isModalOpen && canManage && (
        <div style={styles.modalOverlay}>
          <div className="glass" style={{ ...styles.modalCard, maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={styles.modalHeader}>
              <h3>{modalMode === 'CREATE' ? `Pendaftaran Murid Baru Kelas ${myClassName}` : 'Ubah Data Murid'}</h3>
              <button style={styles.modalCloseBtn} onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} style={styles.modalForm}>
              <div style={styles.row}>
                <div className="form-group" style={styles.col}>
                  <label className="form-label">Nama Lengkap Murid</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Nama lengkap murid"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={submitLoading}
                  />
                </div>
                
                <div className="form-group" style={styles.col}>
                  <label className="form-label">Jenis Kelamin</label>
                  <select
                    className="form-input"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    disabled={submitLoading}
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
              </div>

              <div style={styles.row}>
                <div className="form-group" style={styles.col}>
                  <label className="form-label">NIS</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="NIS murid"
                    value={nis}
                    onChange={(e) => setNis(e.target.value)}
                    disabled={submitLoading}
                  />
                </div>
                <div className="form-group" style={styles.col}>
                  <label className="form-label">NISN</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="NISN murid"
                    value={nisn}
                    onChange={(e) => setNisn(e.target.value)}
                    disabled={submitLoading}
                  />
                </div>
              </div>

              <div style={styles.row}>
                <div className="form-group" style={styles.col}>
                  <label className="form-label">Tempat Lahir</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Jakarta"
                    value={birthPlace}
                    onChange={(e) => setBirthPlace(e.target.value)}
                    disabled={submitLoading}
                  />
                </div>
                <div className="form-group" style={styles.col}>
                  <label className="form-label">Tanggal Lahir</label>
                  <input
                    type="date"
                    className="form-input"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    disabled={submitLoading}
                  />
                </div>
              </div>

              <div style={styles.row}>
                <div className="form-group" style={styles.col}>
                  <label className="form-label">Agama</label>
                  <select
                    className="form-input"
                    value={religion}
                    onChange={(e) => setReligion(e.target.value)}
                    disabled={submitLoading}
                  >
                    <option value="Islam">Islam</option>
                    <option value="Kristen">Kristen</option>
                    <option value="Katolik">Katolik</option>
                    <option value="Hindu">Hindu</option>
                    <option value="Buddha">Buddha</option>
                    <option value="Konghucu">Konghucu</option>
                  </select>
                </div>

                <div className="form-group" style={styles.col}>
                  <label className="form-label">Alamat Rumah Lengkap</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Jl. Pahlawan No. 42"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    disabled={submitLoading}
                  />
                </div>
              </div>

              <div style={styles.row}>
                <div className="form-group" style={styles.col}>
                  <label className="form-label">Nama Orang Tua / Wali</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Nama Ibu / Ayah / Wali"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    disabled={submitLoading}
                  />
                </div>
                <div className="form-group" style={styles.col}>
                  <label className="form-label">Nomor Telepon Orang Tua</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Nomor handphone aktif"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    disabled={submitLoading}
                  />
                </div>
              </div>

              <div style={styles.row}>
                <div className="form-group" style={styles.col}>
                  <label className="form-label">Unggah Kartu Keluarga (KK)</label>
                  <input
                    type="file"
                    className="form-input"
                    accept="image/*,application/pdf"
                    onChange={(e) => setKkFile(e.target.files ? e.target.files[0] : null)}
                    disabled={submitLoading}
                    style={{ padding: '6px' }}
                  />
                </div>

                {modalMode === 'EDIT' && (
                  <div className="form-group" style={styles.col}>
                    <label className="form-label">Status Siswa</label>
                    <select
                      className="form-input"
                      value={status}
                      onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'MUTATED' | 'GRADUATED' | 'INACTIVE')}
                      disabled={submitLoading}
                    >
                      <option value="ACTIVE">Aktif</option>
                      <option value="MUTATED">Mutasi (Pindah)</option>
                      <option value="GRADUATED">Lulus</option>
                      <option value="INACTIVE">Nonaktif</option>
                    </select>
                  </div>
                )}
              </div>

              <div style={styles.modalFooter}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)} disabled={submitLoading}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitLoading}>
                  {submitLoading ? 'Menyimpan...' : 'Simpan Murid'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL VIEW MODAL */}
      {selectedStudent && (
        <div style={styles.modalOverlay}>
          <div className="glass" style={{ ...styles.modalCard, maxWidth: '600px' }}>
            <div style={styles.modalHeader}>
              <h3>Profil Lengkap Siswa</h3>
              <button style={styles.modalCloseBtn} onClick={() => setSelectedStudent(null)}>
                <X size={20} />
              </button>
            </div>
            
            <div style={styles.modalBody}>
              <div style={styles.detailAvatarWrapper}>
                <div className="gradient-bg" style={styles.detailAvatar}>
                  {selectedStudent.fullName.charAt(0).toUpperCase()}
                </div>
                <div style={{ textAlign: 'center' }}>
                  <h4>{selectedStudent.fullName}</h4>
                  <p style={{ fontSize: '0.85rem' }}>NIS: {selectedStudent.nis} | NISN: {selectedStudent.nisn}</p>
                </div>
              </div>

              <div style={styles.detailGrid}>
                <div style={styles.detailItem}><strong>Jenis Kelamin:</strong> {selectedStudent.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</div>
                <div style={styles.detailItem}><strong>Kelas:</strong> {selectedStudent.class?.name || '-'}</div>
                <div style={styles.detailItem}><strong>Tempat, Tgl Lahir:</strong> {selectedStudent.birthPlace}, {new Date(selectedStudent.birthDate).toLocaleDateString('id-ID')}</div>
                <div style={styles.detailItem}><strong>Agama:</strong> {selectedStudent.religion}</div>
                <div style={{ ...styles.detailItem, gridColumn: 'span 2' }}><strong>Alamat:</strong> {selectedStudent.address}</div>
                <div style={styles.detailItem}><strong>Orang Tua/Wali:</strong> {selectedStudent.parentName}</div>
                <div style={styles.detailItem}><strong>No. Telp Orang Tua:</strong> {selectedStudent.parentPhone}</div>
                <div style={styles.detailItem}>
                  <strong>Kartu Keluarga:</strong>{' '}
                  {selectedStudent.kkFileUrl ? (
                    <a href={selectedStudent.kkFileUrl} target="_blank" rel="noopener noreferrer" style={styles.detailKkLink}>
                      Lihat Berkas <ExternalLink size={12} />
                    </a>
                  ) : (
                    <span style={{ color: 'var(--danger)', fontWeight: 600 }}>Belum diunggah</span>
                  )}
                </div>
                <div style={styles.detailItem}>
                  <strong>Status Keaktifan:</strong>{' '}
                  <span className={`badge ${selectedStudent.status === 'ACTIVE' ? 'badge-active' : 'badge-inactive'}`}>
                    {selectedStudent.status}
                  </span>
                </div>
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
  row: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
  },
  col: {
    flex: '1 1 200px',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '20px',
    borderTop: '1px solid var(--border)',
    paddingTop: '16px',
  },
  modalBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  detailAvatarWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  },
  detailAvatar: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: '2.5rem',
    fontWeight: '700',
    boxShadow: '0 8px 16px var(--primary-glow)',
  },
  detailGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '14px 20px',
    background: 'var(--muted-light)',
    padding: '20px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border)',
    fontSize: '0.9rem',
  },
  detailItem: {
    lineHeight: '1.5',
    color: 'var(--foreground)',
  },
  detailKkLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontWeight: '600',
    color: 'var(--primary)',
  },
};
