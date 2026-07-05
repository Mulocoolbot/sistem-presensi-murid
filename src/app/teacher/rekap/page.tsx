'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, ShieldAlert, FileText, Printer, Award, BarChart2 } from 'lucide-react';

interface ClassOption {
  id: string;
  name: string;
}

interface SubjectOption {
  id: string;
  name: string;
  code: string;
}

interface StudentRekap {
  studentId: string;
  nis: string;
  name: string;
  HADIR: number;
  SAKIT: number;
  IZIN: number;
  ALPHA: number;
  TERLAMBAT: number;
  DISPENSASI: number;
  total: number;
  rate: number;
}

interface Summary {
  totalAttendance: number;
  HADIR: number;
  SAKIT: number;
  IZIN: number;
  ALPHA: number;
  TERLAMBAT: number;
  DISPENSASI: number;
  rate: number;
}

export default function RekapAttendancePage() {
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [academicYear, setAcademicYear] = useState('2025/2026');
  const [semester, setSemester] = useState('Ganjil');

  // Reports data
  const [summary, setSummary] = useState<Summary | null>(null);
  const [studentsRekap, setStudentsRekap] = useState<StudentRekap[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchFilters = useCallback(async () => {
    try {
      // Fetch classes
      const classRes = await fetch('/api/school-admin/classes');
      if (classRes.ok) {
        const classData = await classRes.json();
        setClasses(classData);
        if (classData.length > 0) setClassId(classData[0].id);
      }
      
      // Fetch subjects
      const subRes = await fetch('/api/school-admin/subjects');
      if (subRes.ok) {
        const subData = await subRes.json();
        setSubjects(subData);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFilters();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchFilters]);

  const handleFetchRekap = async () => {
    setLoading(true);
    setError('');
    
    try {
      const params = new URLSearchParams();
      if (classId) params.append('classId', classId);
      if (subjectId) params.append('subjectId', subjectId);
      if (academicYear) params.append('academicYear', academicYear);
      if (semester) params.append('semester', semester);

      const res = await fetch(`/api/teacher/rekap?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memuat rekap presensi');

      setSummary(data.summary);
      setStudentsRekap(data.studentsRekap);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
      setSummary(null);
      setStudentsRekap([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const selectedClass = classes.find((c) => c.id === classId);
  const selectedSubject = subjects.find((s) => s.id === subjectId);

  return (
    <div className="rekap-container">
      {/* Hide on print */}
      <div className="page-header no-print">
        <div className="page-title-section">
          <h1>Rekap Kehadiran Siswa</h1>
          <p>Tampilkan statistik kehadiran kelas berdasarkan filter periode, murid, dan mata pelajaran</p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={handlePrint}
          disabled={studentsRekap.length === 0}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Printer size={16} /> Cetak Laporan / PDF
        </button>
      </div>

      {error && (
        <div style={styles.errorAlert} className="no-print">
          <ShieldAlert size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Bar - Hide on print */}
      <div className="glass no-print" style={styles.filterCard}>
        <div style={styles.filterForm}>
          <div className="form-group" style={styles.filterCol}>
            <label className="form-label">Pilih Kelas</label>
            <select className="form-input" value={classId} onChange={(e) => setClassId(e.target.value)}>
              <option value="">Semua Kelas</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={styles.filterCol}>
            <label className="form-label">Mata Pelajaran (Opsional)</label>
            <select className="form-input" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
              <option value="">Semua Mata Pelajaran</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>{sub.name} ({sub.code})</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={styles.filterCol}>
            <label className="form-label">Tahun Ajaran</label>
            <select className="form-input" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)}>
              <option value="2025/2026">2025/2026</option>
              <option value="2026/2027">2026/2027</option>
              <option value="2027/2028">2027/2028</option>
            </select>
          </div>

          <div className="form-group" style={styles.filterCol}>
            <label className="form-label">Semester</label>
            <select className="form-input" value={semester} onChange={(e) => setSemester(e.target.value)}>
              <option value="Ganjil">Ganjil</option>
              <option value="Genap">Genap</option>
            </select>
          </div>

          <button onClick={handleFetchRekap} className="btn btn-primary" style={styles.loadBtn} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} /> Tampilkan Rekap
          </button>
        </div>
      </div>

      {/* Loading indicator */}
      {loading && (
        <div style={styles.loadingArea} className="no-print">
          <div className="spinner gradient-bg" style={{ width: '40px', height: '40px' }}></div>
          <p style={{ marginTop: '15px', color: 'var(--muted)' }}>Memproses laporan...</p>
        </div>
      )}

      {/* PRINT HEADER */}
      <div style={styles.printHeader} className="print-only">
        <h2>LAPORAN REKAPITULASI KEHADIRAN SISWA</h2>
        <h4 style={{ marginTop: '8px' }}>SIPMS - SISTEM INFORMASI PRESENSI MURID SEKOLAH</h4>
        <div style={styles.printMetaInfo}>
          <div>Kelas: <strong>{selectedClass ? selectedClass.name : 'Semua Kelas'}</strong></div>
          <div>Mata Pelajaran: <strong>{selectedSubject ? selectedSubject.name : 'Semua Mapel'}</strong></div>
          <div>Periode: <strong>T.A. {academicYear} - Semester {semester}</strong></div>
          <div>Tanggal Cetak: <strong>{new Date().toLocaleDateString('id-ID')}</strong></div>
        </div>
      </div>

      {/* REKAP RESULTS VIEW */}
      {!loading && summary && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Summary Cards */}
          <div style={styles.summaryStatsGrid}>
            <div className="data-card" style={styles.summaryCard}>
              <div style={styles.cardHeader}>
                <div style={{ ...styles.cardIconWrapper, background: 'var(--success-light)' }}>
                  <BarChart2 size={20} color="var(--success)" />
                </div>
                <span style={styles.cardLabel}>Rerata Kehadiran</span>
              </div>
              <div style={{ ...styles.cardValue, color: 'var(--success)' }}>{summary.rate}%</div>
            </div>

            <div className="data-card" style={styles.summaryCard}>
              <div style={styles.cardHeader}>
                <div style={{ ...styles.cardIconWrapper, background: 'var(--success-light)' }}>
                  <Award size={20} color="var(--success)" />
                </div>
                <span style={styles.cardLabel}>Hadir / Terlambat</span>
              </div>
              <div style={styles.cardValue}>{summary.HADIR + summary.TERLAMBAT} Sesi</div>
            </div>

            <div className="data-card" style={styles.summaryCard}>
              <div style={styles.cardHeader}>
                <div style={{ ...styles.cardIconWrapper, background: 'var(--warning-light)' }}>
                  <Award size={20} color="var(--warning)" />
                </div>
                <span style={styles.cardLabel}>Sakit / Izin</span>
              </div>
              <div style={styles.cardValue}>{summary.SAKIT + summary.IZIN} Sesi</div>
            </div>

            <div className="data-card" style={styles.summaryCard}>
              <div style={styles.cardHeader}>
                <div style={{ ...styles.cardIconWrapper, background: 'var(--danger-light)' }}>
                  <Award size={20} color="var(--danger)" />
                </div>
                <span style={styles.cardLabel}>Alpha / Absen</span>
              </div>
              <div style={{ ...styles.cardValue, color: 'var(--danger)' }}>{summary.ALPHA} Sesi</div>
            </div>
          </div>

          {/* Student Rekap Table */}
          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <FileText size={18} /> Kehadiran Detail Per Siswa
            </h3>
            <div className="table-container" style={{ marginTop: '0' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>NIS</th>
                    <th>Nama Lengkap Siswa</th>
                    <th style={{ textAlign: 'center' }}>Hadir</th>
                    <th style={{ textAlign: 'center' }}>Sakit</th>
                    <th style={{ textAlign: 'center' }}>Izin</th>
                    <th style={{ textAlign: 'center' }}>Alpha</th>
                    <th style={{ textAlign: 'center' }}>Lambat</th>
                    <th style={{ textAlign: 'center' }}>Dispen</th>
                    <th style={{ textAlign: 'center' }}>Total Sesi</th>
                    <th style={{ textAlign: 'center' }}>Persentase</th>
                  </tr>
                </thead>
                <tbody>
                  {studentsRekap.map((s) => (
                    <tr key={s.studentId}>
                      <td><span style={{ fontWeight: 600 }}>{s.nis}</span></td>
                      <td><div style={{ fontWeight: '700' }}>{s.name}</div></td>
                      <td style={{ textAlign: 'center', fontWeight: '600', color: 'var(--success)' }}>{s.HADIR}</td>
                      <td style={{ textAlign: 'center', fontWeight: '600', color: 'var(--warning)' }}>{s.SAKIT}</td>
                      <td style={{ textAlign: 'center', fontWeight: '600', color: 'var(--primary)' }}>{s.IZIN}</td>
                      <td style={{ textAlign: 'center', fontWeight: '600', color: 'var(--danger)' }}>{s.ALPHA}</td>
                      <td style={{ textAlign: 'center', fontWeight: '600', color: 'var(--secondary)' }}>{s.TERLAMBAT}</td>
                      <td style={{ textAlign: 'center', fontWeight: '600', color: 'var(--accent)' }}>{s.DISPENSASI}</td>
                      <td style={{ textAlign: 'center', fontWeight: '600' }}>{s.total}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span 
                          className="badge badge-active"
                          style={{
                            background: s.rate >= 90 ? 'var(--success-light)' : s.rate >= 75 ? 'var(--warning-light)' : 'var(--danger-light)',
                            color: s.rate >= 90 ? 'var(--success)' : s.rate >= 75 ? 'var(--warning)' : 'var(--danger)',
                            fontWeight: '800'
                          }}
                        >
                          {s.rate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PRINT CSS STYLING OVERRIDES */}
      <style jsx global>{`
        .print-only {
          display: none;
        }
        @media print {
          .no-print,
          .dashboard-sidebar,
          .dashboard-mobile-btn,
          .dashboard-overlay {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          body {
            background: #fff !important;
            color: #000 !important;
            font-size: 11pt !important;
          }
          .rekap-container {
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
          }
          .table-container {
            border: 1px solid #000 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            overflow: visible !important;
          }
          .data-table {
            border-collapse: collapse !important;
            width: 100% !important;
            page-break-inside: auto !important;
          }
          thead {
            display: table-header-group !important;
          }
          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .data-table th {
            background: #f0f0f0 !important;
            color: #000 !important;
            border: 1px solid #000 !important;
            padding: 8px !important;
          }
          .data-table td {
            border: 1px solid #000 !important;
            color: #000 !important;
            padding: 8px !important;
          }
          .badge {
            background: none !important;
            border: none !important;
            padding: 0 !important;
            font-weight: bold !important;
          }
          .badge-active { color: #000 !important; }
          .badge-inactive { color: #000 !important; }
          .dashboard-main {
            margin-left: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>
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
    padding: '24px',
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
  loadBtn: {
    height: '46px',
    display: 'flex',
    gap: '6px',
  },
  loadingArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 0',
  },
  printHeader: {
    textAlign: 'center',
    marginBottom: '30px',
    borderBottom: '3px double #000',
    paddingBottom: '16px',
  },
  printMetaInfo: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px',
    marginTop: '20px',
    fontSize: '0.9rem',
    textAlign: 'left',
  },
  summaryStatsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  summaryCard: {
    padding: '20px',
    borderRadius: 'var(--radius-sm)',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  cardIconWrapper: {
    width: '32px',
    height: '32px',
    borderRadius: 'var(--radius-sm)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: {
    fontSize: '0.8rem',
    fontWeight: '600',
    color: 'var(--muted)',
  },
  cardValue: {
    fontSize: '1.75rem',
    fontWeight: '800',
    color: 'var(--foreground)',
    marginTop: '10px',
  },
};
