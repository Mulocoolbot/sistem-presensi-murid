'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, ShieldAlert, Printer, BarChart2, Search, Info, Users, AlertCircle } from 'lucide-react';

interface ClassOption {
  id: string;
  name: string;
}

interface StudentAttendanceRecord {
  id: string;
  nis: string;
  fullName: string;
  gender: string;
  attendanceStatus: 'HADIR' | 'SAKIT' | 'IZIN' | 'ALPHA' | 'TERLAMBAT' | 'DISPENSASI';
  note: string;
}

export default function AttendanceHistoryPage() {
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [classId, setClassId] = useState('');
  const [dateStr, setDateStr] = useState(() => {
    const today = new Date();
    const tzOffset = today.getTimezoneOffset() * 60000;
    const localISOTime = new Date(today.getTime() - tzOffset).toISOString().slice(0, 10);
    return localISOTime;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [records, setRecords] = useState<StudentAttendanceRecord[]>([]);
  const [hasAttendance, setHasAttendance] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchClasses = useCallback(async () => {
    try {
      const res = await fetch('/api/school-admin/classes');
      if (res.ok) {
        const data = await res.json();
        setClasses(data);
        if (data.length > 0) {
          setClassId(data[0].id);
        }
        localStorage.setItem('sipms_cache_classes', JSON.stringify(data));
      } else {
        throw new Error('Gagal memuat kelas');
      }
    } catch {
      const cached = localStorage.getItem('sipms_cache_classes');
      if (cached) {
        try {
          const data = JSON.parse(cached);
          setClasses(data);
          if (data.length > 0) setClassId(data[0].id);
        } catch {}
      }
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClasses();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchClasses]);

  const fetchHistory = useCallback(async () => {
    if (!classId || !dateStr) return;
    setLoading(true);
    setError('');
    setRecords([]);
    setHasAttendance(false);

    const cacheKey = `sipms_cache_history_${classId}_${dateStr}`;

    try {
      const params = new URLSearchParams();
      params.append('classId', classId);
      params.append('date', dateStr);

      const res = await fetch(`/api/teacher/attendance?${params.toString()}`);
      if (!res.ok) throw new Error('Gagal mengambil riwayat presensi');
      const data = await res.json();

      const attendanceList = data.students as StudentAttendanceRecord[];
      setRecords(attendanceList);
      setHasAttendance(data.attendanceHeaderId !== null);

      localStorage.setItem(cacheKey, JSON.stringify(data));
      localStorage.setItem(`${cacheKey}_time`, new Date().toISOString());
    } catch (err: unknown) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const data = JSON.parse(cached);
          setRecords(data.students);
          setHasAttendance(data.attendanceHeaderId !== null);

          const time = localStorage.getItem(`${cacheKey}_time`);
          const dateLabel = time ? new Date(time).toLocaleString('id-ID') : 'Beberapa saat lalu';
          setError(`Menggunakan riwayat offline (terakhir disinkronkan: ${dateLabel})`);
        } catch {
          setError('Gagal memuat riwayat offline');
        }
      } else {
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan jaringan');
      }
    } finally {
      setLoading(false);
    }
  }, [classId, dateStr]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (classId && dateStr) {
        fetchHistory();
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [classId, dateStr, fetchHistory]);

  const handlePrint = () => {
    window.print();
  };

  const selectedClass = classes.find((c) => c.id === classId);

  // Statistics calculation
  const total = records.length;
  const hadir = records.filter(r => r.attendanceStatus === 'HADIR').length;
  const sakit = records.filter(r => r.attendanceStatus === 'SAKIT').length;
  const izin = records.filter(r => r.attendanceStatus === 'IZIN').length;
  const alpha = records.filter(r => r.attendanceStatus === 'ALPHA').length;
  const terlambat = records.filter(r => r.attendanceStatus === 'TERLAMBAT').length;
  const dispensasi = records.filter(r => r.attendanceStatus === 'DISPENSASI').length;

  const totalHadir = hadir + terlambat + dispensasi;
  const rate = total > 0 ? Math.round((totalHadir / total) * 100) : 0;

  const filteredRecords = records.filter(r => 
    r.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.nis.includes(searchQuery)
  );

  return (
    <div className="rekap-container">
      {/* Print only CSS override */}
      <style jsx global>{`
        @media print {
          body {
            background: #fff !important;
            color: #000 !important;
            font-size: 11pt !important;
          }
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          .table-container {
            border: 1px solid #000 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            overflow: visible !important;
            margin-top: 10px !important;
          }
          .data-table {
            border-collapse: collapse !important;
            width: 100% !important;
          }
          .data-table th {
            background: #f0f0f0 !important;
            color: #000 !important;
            border: 1px solid #000 !important;
            padding: 6px 8px !important;
          }
          .data-table td {
            border: 1px solid #000 !important;
            color: #000 !important;
            padding: 6px 8px !important;
          }
          .badge {
            background: none !important;
            border: none !important;
            padding: 0 !important;
            font-weight: bold !important;
            color: #000 !important;
          }
          .dashboard-main {
            margin-left: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>

      {/* Title Header - Hide on print */}
      <div className="page-header no-print">
        <div className="page-title-section">
          <h1>Riwayat Presensi Harian</h1>
          <p>Melihat dan mencetak riwayat kehadiran siswa per hari berdasarkan tanggal dan kelas pilihan</p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={handlePrint}
          disabled={!hasAttendance || records.length === 0}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Printer size={16} /> Cetak Riwayat / PDF
        </button>
      </div>

      {error && (
        <div style={styles.errorAlert} className="no-print">
          <ShieldAlert size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Card - Hide on print */}
      <div className="glass no-print" style={styles.filterCard}>
        <div style={styles.filterForm}>
          <div className="form-group" style={styles.filterCol}>
            <label className="form-label">Pilih Kelas</label>
            <select 
              className="form-input" 
              value={classId} 
              onChange={(e) => setClassId(e.target.value)}
            >
              <option value="">Pilih Kelas...</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={styles.filterCol}>
            <label className="form-label">Pilih Tanggal</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="date" 
                className="form-input" 
                value={dateStr} 
                onChange={(e) => setDateStr(e.target.value)}
              />
            </div>
          </div>

          <button 
            onClick={fetchHistory} 
            className="btn btn-secondary" 
            style={styles.refreshBtn} 
            disabled={loading || !classId}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} /> Segarkan
          </button>
        </div>
      </div>

      {/* Loading view */}
      {loading && (
        <div style={styles.loadingArea} className="no-print">
          <div className="spinner gradient-bg" style={{ width: '40px', height: '40px' }}></div>
          <p style={{ marginTop: '15px', color: 'var(--muted)' }}>Memuat riwayat kehadiran...</p>
        </div>
      )}

      {/* Empty / Not Submitted state */}
      {!loading && classId && !hasAttendance && (
        <div style={styles.emptyArea} className="glass no-print">
          <AlertCircle size={48} color="var(--warning)" />
          <h3>Presensi Belum Dilakukan</h3>
          <p>Guru belum melakukan perekaman presensi untuk kelas <strong>{selectedClass?.name}</strong> pada tanggal <strong>{new Date(dateStr).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>.</p>
        </div>
      )}

      {/* PRINT HEADER - Shows only on print */}
      <div style={styles.printHeader} className="print-only" style-name="print-only">
        <h2>LAPORAN RIWAYAT PRESENSI HARIAN SISWA</h2>
        <h4 style={{ marginTop: '8px', color: '#666' }}>SIPMS - SISTEM INFORMASI PRESENSI MURID SEKOLAH</h4>
        <div style={styles.printMetaInfo}>
          <div>Kelas: <strong>{selectedClass ? selectedClass.name : '-'}</strong></div>
          <div>Tanggal Presensi: <strong>{new Date(dateStr).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong></div>
          <div>Tingkat Kehadiran: <strong>{hasAttendance ? `${rate}%` : 'Belum Terisi'}</strong></div>
          <div>Tanggal Cetak: <strong>{new Date().toLocaleDateString('id-ID')}</strong></div>
        </div>
      </div>

      {/* Main Results View */}
      {!loading && classId && hasAttendance && records.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Summary Stats Grid */}
          <div style={styles.summaryStatsGrid}>
            <div className="data-card" style={styles.summaryCard}>
              <div style={styles.cardHeader}>
                <div style={{ ...styles.cardIconWrapper, background: 'var(--success-light)' }}>
                  <BarChart2 size={20} color="var(--success)" />
                </div>
                <span style={styles.cardLabel}>Rasio Kehadiran</span>
              </div>
              <div style={{ ...styles.cardValue, color: 'var(--success)' }}>{rate}%</div>
            </div>

            <div className="data-card" style={styles.summaryCard}>
              <div style={styles.cardHeader}>
                <div style={{ ...styles.cardIconWrapper, background: 'var(--primary-light)' }}>
                  <Users size={20} color="var(--primary)" />
                </div>
                <span style={styles.cardLabel}>Hadir / Terlambat / Disp</span>
              </div>
              <div style={styles.cardValue}>
                {hadir + terlambat + dispensasi} / {total} Siswa
              </div>
            </div>

            <div className="data-card" style={styles.summaryCard}>
              <div style={styles.cardHeader}>
                <div style={{ ...styles.cardIconWrapper, background: 'var(--warning-light)' }}>
                  <Info size={20} color="var(--warning)" />
                </div>
                <span style={styles.cardLabel}>Sakit / Izin</span>
              </div>
              <div style={styles.cardValue}>
                {sakit} / {izin} Siswa
              </div>
            </div>

            <div className="data-card" style={styles.summaryCard}>
              <div style={styles.cardHeader}>
                <div style={{ ...styles.cardIconWrapper, background: 'var(--danger-light)' }}>
                  <AlertCircle size={20} color="var(--danger)" />
                </div>
                <span style={styles.cardLabel}>Mangkir (Alpha)</span>
              </div>
              <div style={{ ...styles.cardValue, color: 'var(--danger)' }}>
                {alpha} Siswa
              </div>
            </div>
          </div>

          {/* Search Box - Hide on print */}
          <div className="no-print" style={styles.searchContainer}>
            <div style={styles.searchWrapper}>
              <Search size={18} style={styles.searchIcon} />
              <input 
                type="text"
                className="form-input"
                placeholder="Cari nama atau NIS siswa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          </div>

          {/* Details Table */}
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>No</th>
                  <th style={{ width: '150px' }}>NIS</th>
                  <th>Nama Lengkap</th>
                  <th style={{ width: '80px' }}>JK</th>
                  <th style={{ width: '140px' }}>Status</th>
                  <th>Keterangan / Catatan</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((r, index) => (
                  <tr key={r.id}>
                    <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{index + 1}</td>
                    <td>{r.nis}</td>
                    <td style={{ fontWeight: '600' }}>{r.fullName}</td>
                    <td style={{ textAlign: 'center' }}>{r.gender}</td>
                    <td>
                      <span className={`badge ${
                        r.attendanceStatus === 'HADIR' ? 'badge-active' :
                        r.attendanceStatus === 'SAKIT' ? 'badge-pending' :
                        r.attendanceStatus === 'IZIN' ? 'badge-pending' :
                        r.attendanceStatus === 'ALPHA' ? 'badge-inactive' :
                        r.attendanceStatus === 'TERLAMBAT' ? 'badge-pending' :
                        'badge-active'
                      }`} style={
                        r.attendanceStatus === 'SAKIT' ? { background: 'rgba(54, 162, 235, 0.1)', color: '#36a2eb' } :
                        r.attendanceStatus === 'IZIN' ? { background: 'rgba(255, 206, 86, 0.1)', color: '#ffcc56' } :
                        r.attendanceStatus === 'TERLAMBAT' ? { background: 'rgba(255, 159, 64, 0.1)', color: '#ff9f40' } :
                        r.attendanceStatus === 'DISPENSASI' ? { background: 'rgba(153, 102, 255, 0.1)', color: '#9966ff' } :
                        undefined
                      }>
                        {r.attendanceStatus === 'HADIR' ? 'Hadir' :
                         r.attendanceStatus === 'SAKIT' ? 'Sakit' :
                         r.attendanceStatus === 'IZIN' ? 'Izin' :
                         r.attendanceStatus === 'ALPHA' ? 'Alpha' :
                         r.attendanceStatus === 'TERLAMBAT' ? 'Terlambat' :
                         'Dispensasi'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: r.note ? 'var(--foreground)' : 'var(--muted)' }}>
                      {r.note || '-'}
                    </td>
                  </tr>
                ))}
                {filteredRecords.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '20px', color: 'var(--muted)' }}>
                      Siswa tidak ditemukan untuk kriteria pencarian ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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
  refreshBtn: {
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
  emptyArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    textAlign: 'center',
    gap: '12px',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--glass-shadow)',
    background: 'var(--card)',
  },
  printHeader: {
    textAlign: 'center',
    marginBottom: '30px',
    borderBottom: '3px double #000',
    paddingBottom: '16px',
    display: 'none',
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
  searchContainer: {
    width: '100%',
    maxWidth: '400px',
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
};
