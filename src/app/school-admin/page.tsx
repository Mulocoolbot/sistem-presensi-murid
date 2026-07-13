'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Users, BookOpen, Layers, ShieldAlert, Clock, RefreshCw, ArrowRight } from 'lucide-react';

interface Stats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalSubjects: number;
  todayAttendance: {
    total: number;
    HADIR: number;
    SAKIT: number;
    IZIN: number;
    ALPHA: number;
    TERLAMBAT: number;
    DISPENSASI: number;
  };
}

interface Log {
  id: string;
  username: string;
  role: string;
  action: string;
  createdAt: string;
}

interface Student {
  id: string;
  fullName: string;
  nis: string;
  class: { name: string };
  createdAt: string;
}

export default function SchoolAdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentLogs, setRecentLogs] = useState<Log[]>([]);
  const [recentStudents, setRecentStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = useCallback(async () => {
    setError('');
    try {
      const res = await fetch('/api/school-admin/dashboard');
      if (!res.ok) throw new Error('Gagal memuat data statistik sekolah');
      const data = await res.json();
      setStats(data.stats);
      setRecentLogs(data.recentLogs);
      setRecentStudents(data.recentStudents);
      
      // Cache dashboard data
      localStorage.setItem('sipms_cache_school_dashboard', JSON.stringify(data));
      localStorage.setItem('sipms_cache_school_dashboard_time', new Date().toISOString());
    } catch (err: unknown) {
      // Try to load cache
      const cached = localStorage.getItem('sipms_cache_school_dashboard');
      if (cached) {
        try {
          const data = JSON.parse(cached);
          setStats(data.stats);
          setRecentLogs(data.recentLogs);
          setRecentStudents(data.recentStudents);
          
          const time = localStorage.getItem('sipms_cache_school_dashboard_time');
          const dateStr = time ? new Date(time).toLocaleString('id-ID') : 'Beberapa saat lalu';
          setError(`Menggunakan data offline (terakhir disinkronkan: ${dateStr})`);
        } catch {
          setError('Gagal memuat data offline');
        }
      } else {
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan jaringan');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDashboardData();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div style={styles.loadingArea}>
        <div className="spinner gradient-bg" style={{ width: '40px', height: '40px' }}></div>
        <p style={{ marginTop: '15px', fontWeight: 600 }}>Memuat Statistik Sekolah...</p>
      </div>
    );
  }

  // Calculate Attendance Percentage Today
  const totalAtt = stats?.todayAttendance.total || 0;
  const hadir = (stats?.todayAttendance.HADIR || 0) + (stats?.todayAttendance.TERLAMBAT || 0) + (stats?.todayAttendance.DISPENSASI || 0);
  const attRate = totalAtt > 0 ? Math.round((hadir / totalAtt) * 100) : null;

  return (
    <div>
      <div className="page-header">
        <div className="page-title-section">
          <h1>Dashboard Sekolah</h1>
          <p>Kelola data guru, murid, kelas, mata pelajaran, serta pantau persentase kehadiran hari ini</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchDashboardData} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <RefreshCw size={16} /> Segarkan
        </button>
      </div>

      {error && (
        <div style={styles.errorAlert}>
          <ShieldAlert size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Main Stats Grid */}
      <div className="stats-grid">
        <div className="data-card" style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={{ ...styles.cardIconWrapper, background: 'var(--primary-light)' }}>
              <Users size={22} color="var(--primary)" />
            </div>
            <span style={styles.cardLabel}>Total Murid</span>
          </div>
          <div style={styles.cardValue}>{stats?.totalStudents}</div>
          <p style={styles.cardFooter}>Murid terdaftar aktif</p>
        </div>

        <div className="data-card" style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={{ ...styles.cardIconWrapper, background: 'var(--success-light)' }}>
              <Users size={22} color="var(--success)" />
            </div>
            <span style={styles.cardLabel}>Total Guru</span>
          </div>
          <div style={styles.cardValue}>{stats?.totalTeachers}</div>
          <p style={styles.cardFooter}>Tenaga pengajar aktif</p>
        </div>

        <div className="data-card" style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={{ ...styles.cardIconWrapper, background: 'var(--primary-light)' }}>
              <Layers size={22} color="var(--primary)" />
            </div>
            <span style={styles.cardLabel}>Total Kelas</span>
          </div>
          <div style={styles.cardValue}>{stats?.totalClasses}</div>
          <p style={styles.cardFooter}>Rombongan belajar</p>
        </div>

        <div className="data-card" style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={{ ...styles.cardIconWrapper, background: 'var(--success-light)' }}>
              <BookOpen size={22} color="var(--success)" />
            </div>
            <span style={styles.cardLabel}>Mata Pelajaran</span>
          </div>
          <div style={styles.cardValue}>{stats?.totalSubjects}</div>
          <p style={styles.cardFooter}>Kurikulum aktif</p>
        </div>
      </div>

      {/* Attendance Summary Panel */}
      <div className="data-card" style={{ marginBottom: '24px' }}>
        <div style={styles.attendanceSummaryHeader}>
          <div>
            <h3>Kehadiran Siswa Hari Ini</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '2px' }}>
              Berdasarkan pencatatan presensi yang dilakukan guru mata pelajaran hari ini
            </p>
          </div>
          {attRate !== null && (
            <div style={styles.attendanceRateWrapper}>
              <div style={styles.rateValue}>{attRate}%</div>
              <div style={styles.rateLabel}>Tingkat Kehadiran</div>
            </div>
          )}
        </div>

        <div style={styles.attendanceCountersGrid}>
          <div style={styles.counterItem}>
            <div style={{ ...styles.counterNum, color: 'var(--success)' }}>{stats?.todayAttendance.HADIR}</div>
            <div style={styles.counterLabel}>Hadir</div>
          </div>
          <div style={styles.counterItem}>
            <div style={{ ...styles.counterNum, color: 'var(--warning)' }}>{stats?.todayAttendance.SAKIT}</div>
            <div style={styles.counterLabel}>Sakit</div>
          </div>
          <div style={styles.counterItem}>
            <div style={{ ...styles.counterNum, color: 'var(--primary)' }}>{stats?.todayAttendance.IZIN}</div>
            <div style={styles.counterLabel}>Izin</div>
          </div>
          <div style={styles.counterItem}>
            <div style={{ ...styles.counterNum, color: 'var(--danger)' }}>{stats?.todayAttendance.ALPHA}</div>
            <div style={styles.counterLabel}>Alpha</div>
          </div>
          <div style={styles.counterItem}>
            <div style={{ ...styles.counterNum, color: 'var(--secondary)' }}>{stats?.todayAttendance.TERLAMBAT}</div>
            <div style={styles.counterLabel}>Terlambat</div>
          </div>
          <div style={styles.counterItem}>
            <div style={{ ...styles.counterNum, color: 'var(--accent)' }}>{stats?.todayAttendance.DISPENSASI}</div>
            <div style={styles.counterLabel}>Dispensasi</div>
          </div>
        </div>
      </div>

      <div style={styles.dashboardSplitGrid}>
        {/* Recent Students Added */}
        <div className="data-card" style={{ flex: 1, minWidth: '320px', padding: '24px' }}>
          <div style={styles.sectionHeader}>
            <h3>Siswa Terbaru Terdaftar</h3>
            <Link href="/school-admin/students" style={styles.sectionLink}>
              Kelola Siswa <ArrowRight size={16} />
            </Link>
          </div>
          <div className="table-container" style={{ margin: '15px 0 0 0', border: 'none', boxShadow: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nama Lengkap</th>
                  <th>NIS</th>
                  <th>Kelas</th>
                </tr>
              </thead>
              <tbody>
                {recentStudents.map((stud) => (
                  <tr key={stud.id}>
                    <td><span style={{ fontWeight: 700 }}>{stud.fullName}</span></td>
                    <td>{stud.nis}</td>
                    <td><span style={{ color: 'var(--primary)', fontWeight: '600' }}>{stud.class?.name || '-'}</span></td>
                  </tr>
                ))}
                {recentStudents.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', color: 'var(--muted)', padding: '20px' }}>
                      Belum ada siswa terdaftar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit Logs Section */}
        <div className="data-card" style={{ flex: 1, minWidth: '320px', padding: '24px' }}>
          <div style={styles.sectionHeader}>
            <h3>Aktivitas Sekolah</h3>
            <Link href="/school-admin/logs" style={styles.sectionLink}>
              Semua Log <ArrowRight size={16} />
            </Link>
          </div>
          <div style={styles.logsTimeline}>
            {recentLogs.map((log) => (
              <div key={log.id} style={styles.logItem}>
                <div style={styles.logHeader}>
                  <div style={styles.logUserBadge} className="gradient-bg">
                    {log.username.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flexGrow: 1 }}>
                    <div style={styles.logUserTitle}>
                      <span style={{ fontWeight: 700 }}>{log.username}</span>
                      <span style={styles.logUserRole}>({log.role})</span>
                    </div>
                    <p style={styles.logActionText}>{log.action}</p>
                  </div>
                  <div style={styles.logTimeMeta}>
                    <Clock size={12} />
                    <span>
                      {new Date(log.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {recentLogs.length === 0 && (
              <p style={{ textAlign: 'center', padding: '20px', color: 'var(--muted)' }}>Belum ada log aktivitas.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  loadingArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '100px 0',
  },
  errorAlert: {
    background: 'var(--danger-light)',
    color: 'var(--danger)',
    border: '1px solid hsl(350, 89%, 90%)',
    borderRadius: 'var(--radius-sm)',
    padding: '12px 18px',
    fontSize: '0.9rem',
    marginBottom: '25px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  cardIconWrapper: {
    width: '40px',
    height: '40px',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: {
    fontFamily: 'var(--font-display)',
    fontWeight: '700',
    fontSize: '0.9rem',
    color: 'var(--muted)',
  },
  cardValue: {
    fontSize: '2.25rem',
    fontWeight: '800',
    color: 'var(--foreground)',
    letterSpacing: '-0.03em',
    lineHeight: '1',
    margin: '4px 0',
  },
  cardFooter: {
    fontSize: '0.75rem',
    color: 'var(--muted)',
    fontWeight: '500',
  },
  attendanceSummaryHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--border)',
    paddingBottom: '16px',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  attendanceRateWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    background: 'var(--success-light)',
    padding: '10px 20px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid hsl(142, 76%, 90%)',
  },
  rateValue: {
    fontSize: '1.75rem',
    fontWeight: '800',
    color: 'var(--success)',
    lineHeight: '1',
  },
  rateLabel: {
    fontSize: '0.7rem',
    color: 'var(--success)',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: '4px',
  },
  attendanceCountersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
    gap: '16px',
  },
  counterItem: {
    background: 'var(--muted-light)',
    padding: '16px 12px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
    textAlign: 'center',
  },
  counterNum: {
    fontSize: '1.5rem',
    fontWeight: '800',
    lineHeight: '1',
  },
  counterLabel: {
    fontSize: '0.8rem',
    color: 'var(--muted)',
    fontWeight: '600',
    marginTop: '6px',
  },
  dashboardSplitGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '24px',
    marginTop: '10px',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--border)',
    paddingBottom: '12px',
  },
  sectionLink: {
    fontSize: '0.85rem',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  logsTimeline: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginTop: '20px',
  },
  logItem: {
    paddingBottom: '12px',
    borderBottom: '1px solid var(--border)',
  },
  logHeader: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
  },
  logUserBadge: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: '700',
    fontSize: '0.85rem',
    flexShrink: 0,
  },
  logUserTitle: {
    fontSize: '0.85rem',
    color: 'var(--foreground)',
  },
  logUserRole: {
    fontSize: '0.75rem',
    color: 'var(--muted)',
    marginLeft: '4px',
  },
  logActionText: {
    fontSize: '0.85rem',
    color: 'var(--foreground)',
    fontWeight: '500',
    marginTop: '2px',
    lineHeight: '1.3',
  },
  logTimeMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '0.75rem',
    color: 'var(--muted)',
    flexShrink: 0,
  },
};
