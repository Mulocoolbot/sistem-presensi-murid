'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, UserPlus, Trash2, Edit, Plus, RefreshCw, X, ShieldAlert, Layers } from 'lucide-react';

interface Subject {
  id: string;
  name: string;
  code: string;
  _count?: {
    teacherSubjectClasses: number;
  };
}

interface Teacher {
  id: string;
  fullName: string;
}

interface ClassData {
  id: string;
  name: string;
}

interface Assignment {
  id: string;
  teacherId: string;
  subjectId: string;
  classId: string;
  academicYear: string;
  semester: string;
  teacher: { fullName: string };
  subject: { name: string; code: string };
  class: { name: string };
}

export default function SubjectsManagementPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  
  const [activeTab, setActiveTab] = useState<'SUBJECTS' | 'ASSIGNMENTS'>('SUBJECTS');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Subject Modal State
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [subModalMode, setSubModalMode] = useState<'CREATE' | 'EDIT'>('CREATE');
  const [targetSubId, setTargetSubId] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');

  // Assignment Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [teacherId, setTeacherId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [classId, setClassId] = useState('');
  const [academicYear, setAcademicYear] = useState('2025/2026');
  const [semester, setSemester] = useState('Ganjil');

  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchInitialData = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch Subjects
      const subRes = await fetch('/api/school-admin/subjects');
      if (!subRes.ok) throw new Error('Gagal mengambil daftar mapel');
      const subData = await subRes.json();
      setSubjects(subData);

      // 2. Fetch Assignments
      const assignRes = await fetch('/api/school-admin/teacher-subjects');
      if (!assignRes.ok) throw new Error('Gagal mengambil daftar penugasan guru');
      const assignData = await assignRes.json();
      setAssignments(assignData);

      // 3. Fetch Teachers
      const teachRes = await fetch('/api/school-admin/teachers');
      if (teachRes.ok) {
        const teachData = await teachRes.json();
        setTeachers(teachData.filter((t: { status: string; isGuruMapel: boolean }) => t.status === 'ACTIVE' && t.isGuruMapel));
      }

      // 4. Fetch Classes
      const classRes = await fetch('/api/school-admin/classes');
      if (classRes.ok) {
        const classData = await classRes.json();
        setClasses(classData);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInitialData();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Subject Handlers
  const openCreateSubModal = () => {
    setSubModalMode('CREATE');
    setTargetSubId('');
    setSubjectName('');
    setSubjectCode('');
    setIsSubModalOpen(true);
  };

  const openEditSubModal = (sub: Subject) => {
    setSubModalMode('EDIT');
    setTargetSubId(sub.id);
    setSubjectName(sub.name);
    setSubjectCode(sub.code);
    setIsSubModalOpen(true);
  };

  const handleSubjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName || !subjectCode) {
      setError('Harap isi nama dan kode mata pelajaran.');
      return;
    }

    setSubmitLoading(true);
    setError('');

    try {
      const url = '/api/school-admin/subjects';
      const method = subModalMode === 'CREATE' ? 'POST' : 'PUT';
      const body = subModalMode === 'CREATE'
        ? { name: subjectName, code: subjectCode }
        : { id: targetSubId, name: subjectName, code: subjectCode };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan mata pelajaran');

      setIsSubModalOpen(false);
      fetchInitialData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleSubjectDelete = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus Mata Pelajaran "${name}"? Seluruh data jadwal, presensi, dan penugasan guru terkait akan terhapus!`)) return;

    setError('');
    try {
      const res = await fetch(`/api/school-admin/subjects?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus mata pelajaran');

      fetchInitialData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    }
  };

  // Assignment Handlers
  const openAssignModal = () => {
    setTeacherId(teachers.length > 0 ? teachers[0].id : '');
    setSubjectId(subjects.length > 0 ? subjects[0].id : '');
    setClassId(classes.length > 0 ? classes[0].id : '');
    setAcademicYear('2025/2026');
    setSemester('Ganjil');
    setIsAssignModalOpen(true);
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherId || !subjectId || !classId) {
      setError('Harap pilih guru, mapel, dan kelas secara lengkap.');
      return;
    }

    setSubmitLoading(true);
    setError('');

    try {
      const res = await fetch('/api/school-admin/teacher-subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId, subjectId, classId, academicYear, semester }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menugaskan guru');

      setIsAssignModalOpen(false);
      fetchInitialData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleAssignmentDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus penugasan guru ini?')) return;

    setError('');
    try {
      const res = await fetch(`/api/school-admin/teacher-subjects?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus penugasan');

      fetchInitialData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title-section">
          <h1>Kurikulum & Penugasan</h1>
          <p>Kelola daftar Mata Pelajaran sekolah serta hubungkan guru pengampu mata pelajaran per kelas</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={fetchInitialData} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} /> Segarkan
          </button>
          {activeTab === 'SUBJECTS' ? (
            <button className="btn btn-primary" onClick={openCreateSubModal}>
              <Plus size={16} /> Tambah Mapel
            </button>
          ) : (
            <button className="btn btn-primary" onClick={openAssignModal} disabled={teachers.length === 0 || classes.length === 0 || subjects.length === 0}>
              <UserPlus size={16} /> Tugaskan Guru
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

      {/* Tab Switcher */}
      <div style={styles.tabContainer}>
        <button
          style={{
            ...styles.tabBtn,
            borderBottom: activeTab === 'SUBJECTS' ? '3px solid var(--primary)' : '3px solid transparent',
            color: activeTab === 'SUBJECTS' ? 'var(--primary)' : 'var(--muted)',
            fontWeight: activeTab === 'SUBJECTS' ? '700' : '600',
          }}
          onClick={() => setActiveTab('SUBJECTS')}
        >
          Daftar Mata Pelajaran
        </button>
        <button
          style={{
            ...styles.tabBtn,
            borderBottom: activeTab === 'ASSIGNMENTS' ? '3px solid var(--primary)' : '3px solid transparent',
            color: activeTab === 'ASSIGNMENTS' ? 'var(--primary)' : 'var(--muted)',
            fontWeight: activeTab === 'ASSIGNMENTS' ? '700' : '600',
          }}
          onClick={() => setActiveTab('ASSIGNMENTS')}
        >
          Penugasan Guru Mapel
        </button>
      </div>

      {loading ? (
        <div style={styles.loadingArea}>
          <div className="spinner gradient-bg" style={{ width: '40px', height: '40px' }}></div>
          <p style={{ marginTop: '15px', color: 'var(--muted)' }}>Memproses data...</p>
        </div>
      ) : activeTab === 'SUBJECTS' ? (
        /* SUBJECTS TAB */
        subjects.length === 0 ? (
          <div style={styles.emptyArea} className="glass">
            <BookOpen size={48} color="var(--muted)" />
            <h3>Belum Ada Mata Pelajaran</h3>
            <p>Klik &apos;Tambah Mapel&apos; untuk membuat mata pelajaran kurikulum pertama.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Kode Mata Pelajaran</th>
                  <th>Nama Mata Pelajaran</th>
                  <th>Jumlah Guru Pengampu</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((sub) => (
                  <tr key={sub.id}>
                    <td>
                      <span className="badge badge-active" style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                        {sub.code}
                      </span>
                    </td>
                    <td><div style={{ fontWeight: '700', fontSize: '1rem' }}>{sub.name}</div></td>
                    <td>{sub._count?.teacherSubjectClasses || 0} Pengampu</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => openEditSubModal(sub)} 
                          className="btn btn-secondary" 
                          style={{ padding: '6px 10px', fontSize: '0.8rem', display: 'flex', gap: '4px' }}
                        >
                          <Edit size={14} /> Edit
                        </button>
                        <button 
                          onClick={() => handleSubjectDelete(sub.id, sub.name)} 
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
        )
      ) : (
        /* ASSIGNMENTS TAB */
        assignments.length === 0 ? (
          <div style={styles.emptyArea} className="glass">
            <Layers size={48} color="var(--muted)" />
            <h3>Belum Ada Penugasan Guru</h3>
            <p>Hubungkan guru ke mata pelajaran dan rombongan belajar terkait. Klik &apos;Tugaskan Guru&apos;.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Guru Pengampu</th>
                  <th>Mata Pelajaran</th>
                  <th>Kelas</th>
                  <th>Tahun Ajaran & Semester</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((ass) => (
                  <tr key={ass.id}>
                    <td><div style={{ fontWeight: '700' }}>{ass.teacher.fullName}</div></td>
                    <td>
                      <div style={{ fontWeight: '600' }}>{ass.subject.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Code: {ass.subject.code}</div>
                    </td>
                    <td>
                      <span className="badge badge-active" style={{ background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: '700' }}>
                        {ass.class.name}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>T.A. {ass.academicYear}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Semester {ass.semester}</div>
                    </td>
                    <td>
                      <button 
                        onClick={() => handleAssignmentDelete(ass.id)} 
                        className="btn btn-danger" 
                        style={{ padding: '6px 10px', fontSize: '0.8rem', display: 'flex', gap: '4px' }}
                      >
                        <Trash2 size={14} /> Hapus Link
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* SUBJECT CREATE / EDIT MODAL */}
      {isSubModalOpen && (
        <div style={styles.modalOverlay}>
          <div className="glass" style={{ ...styles.modalCard, maxWidth: '450px' }}>
            <div style={styles.modalHeader}>
              <h3>{subModalMode === 'CREATE' ? 'Tambah Mata Pelajaran Baru' : 'Ubah Mata Pelajaran'}</h3>
              <button style={styles.modalCloseBtn} onClick={() => setIsSubModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubjectSubmit} style={styles.modalForm}>
              <div className="form-group">
                <label className="form-label">Nama Mata Pelajaran</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Matematika"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  disabled={submitLoading}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Kode Mata Pelajaran</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. MTK"
                  value={subjectCode}
                  onChange={(e) => setSubjectCode(e.target.value)}
                  disabled={submitLoading}
                />
              </div>

              <div style={styles.modalFooter}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsSubModalOpen(false)} disabled={submitLoading}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitLoading}>
                  {submitLoading ? 'Menyimpan...' : 'Simpan Mapel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN TEACHER MODAL */}
      {isAssignModalOpen && (
        <div style={styles.modalOverlay}>
          <div className="glass" style={{ ...styles.modalCard, maxWidth: '500px' }}>
            <div style={styles.modalHeader}>
              <h3>Tugaskan Guru Pengampu Kelas</h3>
              <button style={styles.modalCloseBtn} onClick={() => setIsAssignModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAssignSubmit} style={styles.modalForm}>
              <div className="form-group">
                <label className="form-label">Pilih Guru Mata Pelajaran</label>
                <select
                  className="form-input"
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  disabled={submitLoading}
                >
                  <option value="">-- Pilih Guru --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.fullName}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Pilih Mata Pelajaran</label>
                <select
                  className="form-input"
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  disabled={submitLoading}
                >
                  <option value="">-- Pilih Mata Pelajaran --</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>{sub.name} ({sub.code})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Pilih Kelas</label>
                <select
                  className="form-input"
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  disabled={submitLoading}
                >
                  <option value="">-- Pilih Kelas --</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>

              <div style={styles.row}>
                <div className="form-group" style={styles.col}>
                  <label className="form-label">Tahun Ajaran</label>
                  <select
                    className="form-input"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    disabled={submitLoading}
                  >
                    <option value="2025/2026">2025/2026</option>
                    <option value="2026/2027">2026/2027</option>
                    <option value="2027/2028">2027/2028</option>
                  </select>
                </div>

                <div className="form-group" style={styles.col}>
                  <label className="form-label">Semester</label>
                  <select
                    className="form-input"
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    disabled={submitLoading}
                  >
                    <option value="Ganjil">Ganjil</option>
                    <option value="Genap">Genap</option>
                  </select>
                </div>
              </div>

              <div style={styles.modalFooter}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAssignModalOpen(false)} disabled={submitLoading}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitLoading}>
                  {submitLoading ? 'Menyimpan...' : 'Simpan Penugasan'}
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
};
