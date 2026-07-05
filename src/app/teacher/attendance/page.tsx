'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ShieldAlert, Check, RefreshCw, Save, CheckSquare } from 'lucide-react';

interface Assignment {
  id: string;
  teacherId: string;
  subjectId: string;
  classId: string;
  academicYear: string;
  semester: string;
  subject: { name: string; code: string };
  class: { name: string };
}

interface StudentAttendance {
  id: string;
  nis: string;
  fullName: string;
  gender: string;
  attendanceStatus: 'HADIR' | 'SAKIT' | 'IZIN' | 'ALPHA' | 'TERLAMBAT' | 'DISPENSASI';
  note: string;
}

export default function AttendanceWizardPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  
  // Get Day name in Indonesian
  const getIndonesianDayName = (dateStr: string) => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const d = new Date(dateStr);
    return days[d.getDay()];
  };

  // Date and Time controls
  const [date, setDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [dayOfWeek, setDayOfWeek] = useState(() => getIndonesianDayName(new Date().toISOString().substring(0, 10)));
  const [periodTime, setPeriodTime] = useState('1-2'); // Jam Pelajaran 1-2
  
  const [students, setStudents] = useState<StudentAttendance[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleDateChange = (val: string) => {
    setDate(val);
    setDayOfWeek(getIndonesianDayName(val));
  };

  // Load teacher assignments
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      fetch('/api/school-admin/teacher-subjects')
        .then((res) => {
          if (!res.ok) throw new Error('Gagal mengambil daftar tugas mengajar');
          return res.json();
        })
        .then((data) => {
          setAssignments(data);
          if (data.length > 0) {
            setSelectedAssignmentId(data[0].id);
          }
          setLoading(false);
        })
        .catch((err: unknown) => {
          setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
          setLoading(false);
        });
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Fetch student attendance list when criteria changes
  const handleLoadSheet = async () => {
    if (!selectedAssignmentId) {
      setError('Harap pilih jadwal mata pelajaran terlebih dahulu.');
      return;
    }

    const assignment = assignments.find((a) => a.id === selectedAssignmentId);
    if (!assignment) return;

    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const params = new URLSearchParams({
        classId: assignment.classId,
        subjectId: assignment.subjectId,
        date: date,
        periodTime: periodTime,
      });

      const res = await fetch(`/api/teacher/attendance?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memuat form presensi');

      setStudents(data.students);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (
    studentId: string, 
    status: 'HADIR' | 'SAKIT' | 'IZIN' | 'ALPHA' | 'TERLAMBAT' | 'DISPENSASI'
  ) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, attendanceStatus: status } : s))
    );
  };

  const handleNoteChange = (studentId: string, note: string) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, note: note } : s))
    );
  };

  const handleSaveAttendance = async () => {
    setError('');
    setSuccess('');

    const assignment = assignments.find((a) => a.id === selectedAssignmentId);
    if (!assignment) return;

    // Client-side validations
    for (const student of students) {
      if (student.attendanceStatus !== 'HADIR' && !student.note.trim()) {
        setError(`Siswa "${student.fullName}" berstatus "${student.attendanceStatus}", harap isi kolom Alasan/Keterangan.`);
        return;
      }
    }

    setSubmitLoading(true);

    try {
      const payload = {
        classId: assignment.classId,
        subjectId: assignment.subjectId,
        date,
        periodTime,
        dayOfWeek,
        academicYear: assignment.academicYear,
        semester: assignment.semester,
        students: students.map((s) => ({
          studentId: s.id,
          fullName: s.fullName,
          status: s.attendanceStatus,
          note: s.note,
        })),
      };

      const res = await fetch('/api/teacher/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan presensi');

      setSuccess('Presensi berhasil disimpan!');
      // Scroll to top to see success alert
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setSubmitLoading(false);
    }
  };

  const activeAssignment = assignments.find((a) => a.id === selectedAssignmentId);

  return (
    <div>
      <div className="page-header">
        <div className="page-title-section">
          <h1>Pencatatan Presensi Digital</h1>
          <p>Lakukan input kehadiran siswa berdasarkan kelas, mata pelajaran, dan jadwal jam pelajaran</p>
        </div>
      </div>

      {error && (
        <div style={styles.errorAlert}>
          <ShieldAlert size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div style={styles.successAlert}>
          <Check size={18} />
          <span>{success}</span>
        </div>
      )}

      {/* Filter / Wizard Wizard Controls */}
      <div className="glass" style={styles.wizardCard}>
        <div style={styles.filterForm}>
          <div className="form-group" style={{ ...styles.filterCol, flexGrow: 2 }}>
            <label className="form-label">Mata Pelajaran & Kelas Mengajar</label>
            <select
              className="form-input"
              value={selectedAssignmentId}
              onChange={(e) => setSelectedAssignmentId(e.target.value)}
              disabled={loading || assignments.length === 0}
            >
              {assignments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.subject.name} ({a.subject.code}) - {a.class.name} [T.A. {a.academicYear} - {a.semester}]
                </option>
              ))}
              {assignments.length === 0 && <option value="">-- Tidak ada jadwal mengajar terdaftar --</option>}
            </select>
          </div>

          <div className="form-group" style={styles.filterCol}>
            <label className="form-label">Tanggal Presensi</label>
            <input
              type="date"
              className="form-input"
              value={date}
              onChange={(e) => handleDateChange(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group" style={styles.filterCol}>
            <label className="form-label">Jam Pelajaran</label>
            <select
              className="form-input"
              value={periodTime}
              onChange={(e) => setPeriodTime(e.target.value)}
              disabled={loading}
            >
              <option value="1-2">Jam 1 - 2 (07.00 - 08.30)</option>
              <option value="3-4">Jam 3 - 4 (08.30 - 10.00)</option>
              <option value="5-6">Jam 5 - 6 (10.30 - 12.00)</option>
              <option value="7-8">Jam 7 - 8 (12.30 - 14.00)</option>
            </select>
          </div>

          <button 
            onClick={handleLoadSheet} 
            className="btn btn-primary" 
            style={styles.loadBtn}
            disabled={loading || assignments.length === 0}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} /> Buka Form
          </button>
        </div>

        {activeAssignment && (
          <div style={styles.wizardMetaSummary}>
            <span style={styles.metaBadge}>Hari: <strong>{dayOfWeek}</strong></span>
            <span style={styles.metaBadge}>Tahun Ajaran: <strong>{activeAssignment.academicYear}</strong></span>
            <span style={styles.metaBadge}>Semester: <strong>{activeAssignment.semester}</strong></span>
          </div>
        )}
      </div>

      {loading && (
        <div style={styles.loadingArea}>
          <div className="spinner gradient-bg" style={{ width: '40px', height: '40px' }}></div>
          <p style={{ marginTop: '15px', color: 'var(--muted)' }}>Memproses data...</p>
        </div>
      )}

      {/* Student Attendance List sheet */}
      {!loading && students.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <div style={styles.sheetHeaderCard} className="glass">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)' }}>
              <CheckSquare size={20} />
              <h3 style={{ fontWeight: '800' }}>Form Presensi Siswa</h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '4px' }}>
              Pilih status kehadiran untuk masing-masing siswa di bawah ini. Harap berikan alasan lengkap untuk siswa tidak Hadir.
            </p>
          </div>

          <div className="table-container" style={{ marginTop: '12px' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>NIS</th>
                  <th>Nama Lengkap</th>
                  <th style={{ width: '380px', textAlign: 'center' }}>Status Kehadiran</th>
                  <th>Keterangan / Alasan (Wajib jika tidak Hadir)</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td><span style={{ fontWeight: 600 }}>{student.nis}</span></td>
                    <td>
                      <div style={{ fontWeight: '700' }}>{student.fullName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>JK: {student.gender}</div>
                    </td>
                    <td>
                      <div style={styles.attendanceButtonsGroup}>
                        {[
                          { key: 'HADIR', label: 'Hadir', color: 'var(--success)' },
                          { key: 'SAKIT', label: 'Sakit', color: 'var(--warning)' },
                          { key: 'IZIN', label: 'Izin', color: 'var(--primary)' },
                          { key: 'ALPHA', label: 'Alpha', color: 'var(--danger)' },
                          { key: 'TERLAMBAT', label: 'Lambat', color: 'var(--secondary)' },
                          { key: 'DISPENSASI', label: 'Dispen', color: 'var(--accent)' }
                        ].map((opt) => {
                          const isSelected = student.attendanceStatus === opt.key;
                          return (
                            <button
                              key={opt.key}
                              type="button"
                              onClick={() => handleStatusChange(student.id, opt.key as 'HADIR' | 'SAKIT' | 'IZIN' | 'ALPHA' | 'TERLAMBAT' | 'DISPENSASI')}
                              style={{
                                ...styles.attBtnOption,
                                background: isSelected ? opt.color : 'var(--muted-light)',
                                color: isSelected ? '#fff' : 'var(--foreground)',
                                borderColor: isSelected ? opt.color : 'var(--border)',
                              }}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                    <td>
                      <input
                        type="text"
                        className="form-input"
                        placeholder={student.attendanceStatus === 'HADIR' ? 'Hadir (Opsional)' : 'e.g. Demam, Izin lomba... (Wajib)'}
                        value={student.note}
                        onChange={(e) => handleNoteChange(student.id, e.target.value)}
                        style={{ height: '36px', fontSize: '0.85rem' }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={styles.submitArea}>
            <button
              onClick={handleSaveAttendance}
              className="btn btn-primary"
              style={styles.saveBtn}
              disabled={submitLoading}
            >
              <Save size={18} /> {submitLoading ? 'Menyimpan...' : 'Simpan Lembar Presensi'}
            </button>
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
  successAlert: {
    background: 'var(--success-light)',
    color: 'var(--success)',
    border: '1px solid hsl(142, 76%, 90%)',
    borderRadius: 'var(--radius-sm)',
    padding: '12px 18px',
    fontSize: '0.9rem',
    marginBottom: '20px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  wizardCard: {
    padding: '24px',
    borderRadius: 'var(--radius-md)',
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
  loadBtn: {
    height: '46px',
    display: 'flex',
    gap: '6px',
  },
  wizardMetaSummary: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    marginTop: '16px',
    borderTop: '1px solid var(--border)',
    paddingTop: '12px',
  },
  metaBadge: {
    fontSize: '0.8rem',
    background: 'var(--muted-light)',
    border: '1px solid var(--border)',
    padding: '4px 12px',
    borderRadius: 'var(--radius-full)',
    color: 'var(--foreground)',
  },
  loadingArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 0',
  },
  sheetHeaderCard: {
    padding: '18px 24px',
    borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
    borderBottom: 'none',
    boxShadow: 'var(--glass-shadow)',
  },
  attendanceButtonsGroup: {
    display: 'flex',
    gap: '4px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  attBtnOption: {
    padding: '6px 10px',
    fontSize: '0.75rem',
    fontWeight: '700',
    cursor: 'pointer',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
    transition: 'var(--transition)',
  },
  submitArea: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '20px',
  },
  saveBtn: {
    padding: '12px 24px',
    fontSize: '1rem',
    display: 'flex',
    gap: '8px',
  },
};
