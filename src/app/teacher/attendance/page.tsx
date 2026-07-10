'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ShieldAlert, Check, RefreshCw, Save, CheckSquare, Wifi, WifiOff } from 'lucide-react';

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

interface QueueItem {
  classId: string;
  date: string;
  payload: {
    classId: string;
    date: string;
    dayOfWeek: string;
    academicYear: string;
    semester: string;
    students: Array<{
      studentId: string;
      fullName: string;
      status: string;
      note: string;
    }>;
  };
  timestamp: number;
}

interface CachedStudent {
  id: string;
  nis: string;
  fullName: string;
  gender: string;
}

export default function AttendanceWizardPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  
  // Get Day name in Indonesian
  const getIndonesianDayName = (dateStr: string) => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const d = new Date(dateStr);
    return days[d.getDay()];
  };

  // Date and Time controls
  const [date, setDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [dayOfWeek, setDayOfWeek] = useState(() => getIndonesianDayName(new Date().toISOString().substring(0, 10)));
  
  const [students, setStudents] = useState<StudentAttendance[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // PWA & Offline states
  const [isOnline, setIsOnline] = useState(() => typeof window !== 'undefined' ? navigator.onLine : true);
  const [offlineQueueLength, setOfflineQueueLength] = useState(() => {
    if (typeof window === 'undefined') return 0;
    const queueJson = localStorage.getItem('sipms_offline_queue');
    if (queueJson) {
      try {
        const queue = JSON.parse(queueJson) as QueueItem[];
        return Array.isArray(queue) ? queue.length : 0;
      } catch {
        return 0;
      }
    }
    return 0;
  });
  const handleDateChange = (val: string) => {
    setDate(val);
    setDayOfWeek(getIndonesianDayName(val));
  };

  // Sync Offline Queue to Server
  const syncOfflineData = useCallback(async () => {
    if (typeof window === 'undefined' || !navigator.onLine) return;
    const queueJson = localStorage.getItem('sipms_offline_queue');
    if (!queueJson) {
      setOfflineQueueLength(0);
      return;
    }
    
    try {
      const queue = JSON.parse(queueJson) as QueueItem[];
      if (!Array.isArray(queue) || queue.length === 0) {
        setOfflineQueueLength(0);
        return;
      }
      
      setSubmitLoading(true);
      setError('');
      setSuccess('Sinkronisasi data offline sedang berjalan...');
      
      let successfulCount = 0;
      const failedItems: QueueItem[] = [];
      
      for (const item of queue) {
        try {
          const res = await fetch('/api/teacher/attendance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item.payload),
          });
          if (res.ok) {
            successfulCount++;
          } else {
            const data = (await res.json()) as { error?: string };
            console.error('Gagal menyinkronkan item:', data.error || res.statusText);
            failedItems.push(item);
          }
        } catch (err) {
          console.error('Error menyinkronkan item:', err);
          failedItems.push(item);
        }
      }
      
      if (failedItems.length > 0) {
        localStorage.setItem('sipms_offline_queue', JSON.stringify(failedItems));
        setOfflineQueueLength(failedItems.length);
        setError(`Tersinkronisasi ${successfulCount} data. ${failedItems.length} data gagal disinkronkan.`);
      } else {
        localStorage.removeItem('sipms_offline_queue');
        setOfflineQueueLength(0);
        setSuccess(`Berhasil menyinkronkan ${successfulCount} data presensi offline ke server!`);
      }
    } catch (e) {
      console.error('Gagal memproses antrean offline:', e);
    } finally {
      setSubmitLoading(false);
    }
  }, []);

  // Monitor network status
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const updateOnlineStatus = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      if (online) {
        syncOfflineData();
      }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, [syncOfflineData]);

  // Load teacher assignments
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      fetch('/api/school-admin/teacher-subjects')
        .then((res) => {
          if (!res.ok) throw new Error('Gagal mengambil daftar tugas mengajar');
          return res.json() as Promise<Assignment[]>;
        })
        .then((data) => {
          setAssignments(data);
          // Cache in local storage
          localStorage.setItem('sipms_cached_assignments', JSON.stringify(data));
          
          // Extract unique classes
          const uniqueClasses = Array.from(
            new Map(data.map((a: Assignment) => [a.classId, { id: a.classId, name: a.class.name }])).values()
          ) as Array<{ id: string, name: string }>;
          
          setClasses(uniqueClasses);
          if (uniqueClasses.length > 0) {
            setSelectedClassId(uniqueClasses[0].id);
          }
          setLoading(false);
        })
        .catch((err: unknown) => {
          // If offline, attempt to load cached assignments
          const cached = localStorage.getItem('sipms_cached_assignments');
          if (cached) {
            try {
              const data = JSON.parse(cached) as Assignment[];
              setAssignments(data);
              
              const uniqueClasses = Array.from(
                new Map(data.map((a: Assignment) => [a.classId, { id: a.classId, name: a.class.name }])).values()
              ) as Array<{ id: string, name: string }>;
              
              setClasses(uniqueClasses);
              if (uniqueClasses.length > 0) {
                setSelectedClassId(uniqueClasses[0].id);
              }
              setError('Menggunakan daftar kelas offline (Perangkat lokal).');
            } catch {
              setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
            }
          } else {
            setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
          }
          setLoading(false);
        });
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Fetch student attendance list when criteria changes
  const handleLoadSheet = async () => {
    if (!selectedClassId) {
      setError('Harap pilih kelas terlebih dahulu.');
      return;
    }

    const klass = classes.find((c) => c.id === selectedClassId);
    if (!klass) return;

    setLoading(true);
    setError('');
    setSuccess('');
    
    const cacheKey = `sipms_students_${selectedClassId}`;
    const dateCacheKey = `sipms_attendance_${selectedClassId}_${date}`;
    
    try {
      if (!navigator.onLine) {
        // Load from local cache if offline
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const cachedStudents = JSON.parse(cached) as CachedStudent[];
          const cachedAttendance = localStorage.getItem(dateCacheKey);
          
          if (cachedAttendance) {
            setStudents(JSON.parse(cachedAttendance) as StudentAttendance[]);
            setSuccess('Memuat lembar presensi yang tersimpan lokal (Offline).');
          } else {
            // Set all to default HADIR
            const defaultStudents = cachedStudents.map((s: CachedStudent) => ({
              id: s.id,
              nis: s.nis,
              fullName: s.fullName,
              gender: s.gender,
              attendanceStatus: 'HADIR' as const,
              note: ''
            }));
            setStudents(defaultStudents);
            setError('Memuat daftar siswa offline (Belum ada catatan presensi hari ini).');
          }
        } else {
          throw new Error('Tidak ada data siswa offline yang tersimpan untuk kelas ini. Hubungkan ke internet terlebih dahulu.');
        }
        setLoading(false);
        return;
      }

      // Online behavior
      const params = new URLSearchParams({
        classId: selectedClassId,
        date: date,
      });

      const res = await fetch(`/api/teacher/attendance?${params.toString()}`);
      const data = (await res.json()) as { error?: string; students: StudentAttendance[] };
      if (!res.ok) throw new Error(data.error || 'Gagal memuat form presensi');

      setStudents(data.students);
      
      // Cache students list (basic student info)
      const baseStudents: CachedStudent[] = data.students.map((s: StudentAttendance) => ({
        id: s.id,
        nis: s.nis,
        fullName: s.fullName,
        gender: s.gender
      }));
      localStorage.setItem(cacheKey, JSON.stringify(baseStudents));
      
      // Cache the active attendance state as well
      localStorage.setItem(dateCacheKey, JSON.stringify(data.students));

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

    if (!selectedClassId) return;

    // Find assignment for active class to get academicYear & semester
    const assignment = assignments.find((a) => a.classId === selectedClassId);
    if (!assignment) return;

    // Client-side validations
    for (const student of students) {
      if (student.attendanceStatus !== 'HADIR' && !student.note.trim()) {
        setError(`Siswa "${student.fullName}" berstatus "${student.attendanceStatus}", harap isi kolom Alasan/Keterangan.`);
        return;
      }
    }

    const payload = {
      classId: selectedClassId,
      date,
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

    // Cache local attendance state immediately on save
    const dateCacheKey = `sipms_attendance_${selectedClassId}_${date}`;
    localStorage.setItem(dateCacheKey, JSON.stringify(students));

    if (!navigator.onLine) {
      // Save offline
      try {
        const queueJson = localStorage.getItem('sipms_offline_queue');
        const queue = queueJson ? (JSON.parse(queueJson) as QueueItem[]) : [];
        
        // Check if this date/class is already in the queue to overwrite it
        const existingIndex = queue.findIndex((item: QueueItem) => 
          item.classId === selectedClassId && 
          item.date === date
        );

        const queueItem: QueueItem = {
          classId: selectedClassId,
          date,
          payload,
          timestamp: Date.now()
        };

        if (existingIndex > -1) {
          queue[existingIndex] = queueItem;
        } else {
          queue.push(queueItem);
        }

        localStorage.setItem('sipms_offline_queue', JSON.stringify(queue));
        setOfflineQueueLength(queue.length);
        
        setSuccess('Koneksi offline terdeteksi! Presensi disimpan secara lokal di perangkat Anda dan akan disinkronkan otomatis saat terhubung kembali.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (e) {
        setError('Gagal menyimpan presensi offline: ' + (e instanceof Error ? e.message : 'Terjadi kesalahan'));
      }
      return;
    }

    // Online behavior
    setSubmitLoading(true);

    try {
      const res = await fetch('/api/teacher/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan presensi');

      setSuccess('Presensi berhasil disimpan!');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setSubmitLoading(false);
    }
  };

  const activeAssignment = assignments.find((a) => a.classId === selectedClassId);

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div className="page-title-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1>Pencatatan Presensi Digital</h1>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.75rem',
              fontWeight: '700',
              backgroundColor: isOnline ? 'var(--success-light)' : 'var(--danger-light)',
              color: isOnline ? 'var(--success)' : 'var(--danger)',
              border: `1px solid ${isOnline ? 'hsl(142, 76%, 85%)' : 'hsl(350, 89%, 90%)'}`,
            }}>
              {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
              <span>{isOnline ? 'Online' : 'Offline'}</span>
            </div>
          </div>
          <p>Lakukan input kehadiran siswa berdasarkan kelas, mata pelajaran, dan jadwal jam pelajaran</p>
        </div>
        
        {offlineQueueLength > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: 'var(--warning-light)',
            color: 'var(--warning)',
            padding: '8px 16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid hsl(38, 92%, 85%)',
            fontSize: '0.85rem',
            fontWeight: '600'
          }}>
            <span>Ada <strong>{offlineQueueLength}</strong> data presensi tertunda.</span>
            {isOnline && (
              <button 
                onClick={syncOfflineData}
                className="btn btn-primary"
                style={{ padding: '6px 12px', fontSize: '0.75rem', height: 'auto' }}
                disabled={submitLoading}
              >
                <RefreshCw size={12} className={submitLoading ? 'spin' : ''} /> Sinkronisasi Sekarang
              </button>
            )}
          </div>
        )}
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

      {/* Filter / Wizard Controls */}
      <div className="glass" style={styles.wizardCard}>
        <div style={styles.filterForm}>
          <div className="form-group" style={{ ...styles.filterCol, flexGrow: 2 }}>
            <label className="form-label">Pilih Kelas</label>
            <select
              className="form-input"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              disabled={loading || classes.length === 0}
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
              {classes.length === 0 && <option value="">-- Tidak ada kelas terdaftar --</option>}
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

          <button 
            onClick={handleLoadSheet} 
            className="btn btn-primary" 
            style={styles.loadBtn}
            disabled={loading || classes.length === 0}
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
