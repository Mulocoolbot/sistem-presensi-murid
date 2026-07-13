'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { School, UserCheck, Users, ShieldAlert, ArrowRight, RefreshCw, Clock } from 'lucide-react';

interface Stats {
  totalSchools: number;
  activeSchools: number;
  totalAdmins: number;
  pendingAdmins: number;
}

interface Log {
  id: string;
  username: string;
  role: string;
  action: string;
  ipAddress: string;
  deviceType: string;
  createdAt: string;
  school?: { name: string } | null;
}

interface SchoolStat {
  id: string;
  name: string;
  status: boolean;
  phone: string;
  _count: {
    users: number;
    students: number;
    classes: number;
  };
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentLogs, setRecentLogs] = useState<Log[]>([]);
  const [schoolStats, setSchoolStats] = useState<SchoolStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = useCallback(async () => {
    setError('');
    try {
      const res = await fetch('/api/super-admin/dashboard');
      if (!res.ok) throw new Error('Gagal mengambil data statistik dashboard');
      const data = await res.json();
      setStats(data.stats);
      setRecentLogs(data.recentLogs);
      setSchoolStats(data.schoolStats);
      
      // Cache dashboard data
      localStorage.setItem('sipms_cache_super_dashboard', JSON.stringify(data));
      localStorage.setItem('sipms_cache_super_dashboard_time', new Date().toISOString());
    } catch (err: unknown) {
      // Try to load cache
      const cached = localStorage.getItem('sipms_cache_super_dashboard');
      if (cached) {
        try {
          const data = JSON.parse(cached);
          setStats(data.stats);
          setRecentLogs(data.recentLogs);
          setSchoolStats(data.schoolStats);
          
          const time = localStorage.getItem('sipms_cache_super_dashboard_time');
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
        <p style={{ marginTop: '15px', fontWeight: 600 }}>Memuat Statistik Sistem...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title-section">
          <h1>Dashboard Super Admin</h1>
          <p>Tinjauan operasional seluruh sekolah yang terdaftar dalam platform multi-tenant SIPMS</p>
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

      {/* Stats Cards Grid */}
      <div className="stats-grid">
        <div className="data-card" style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={{ ...styles.cardIconWrapper, background: 'var(--primary-light)' }}>
              <School size={22} color="var(--primary)" />
            </div>
            <span style={styles.cardLabel}>Total Sekolah</span>
          </div>
          <div style={styles.cardValue}>{stats?.totalSchools}</div>
          <p style={styles.cardFooter}>Terdaftar di database</p>
        </div>

        <div className="data-card" style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={{ ...styles.cardIconWrapper, background: 'var(--success-light)' }}>
              <School size={22} color="var(--success)" />
            </div>
            <span style={styles.cardLabel}>Sekolah Aktif</span>
          </div>
          <div style={styles.cardValue}>{stats?.activeSchools}</div>
          <p style={styles.cardFooter}>Status aktif operasional</p>
        </div>

        <div className="data-card" style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={{ ...styles.cardIconWrapper, background: 'var(--primary-light)' }}>
              <Users size={22} color="var(--primary)" />
            </div>
            <span style={styles.cardLabel}>Total Admin</span>
          </div>
          <div style={styles.cardValue}>{stats?.totalAdmins}</div>
          <p style={styles.cardFooter}>Administrator terdaftar</p>
        </div>

        <div className="data-card" style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={{ ...styles.cardIconWrapper, background: stats?.pendingAdmins ? 'var(--danger-light)' : 'var(--success-light)' }}>
              <UserCheck size={22} color={stats?.pendingAdmins ? 'var(--danger)' : 'var(--success)'} />
            </div>
            <span style={styles.cardLabel}>Perlu Verifikasi</span>
          </div>
          <div style={{ ...styles.cardValue, color: stats?.pendingAdmins ? 'var(--danger)' : 'inherit' }}>
            {stats?.pendingAdmins}
          </div>
          <p style={styles.cardFooter}>Pendaftaran admin pending</p>
        </div>
      </div>

      <div style={styles.dashboardSplitGrid}>
        {/* Recent Schools Section */}
        <div className="data-card" style={{ flex: 1, minWidth: '320px', padding: '24px' }}>
          <div style={styles.sectionHeader}>
            <h3>Sekolah Terbaru</h3>
            <Link href="/super-admin/schools" style={styles.sectionLink}>
              Kelola Sekolah <ArrowRight size={16} />
            </Link>
          </div>
          <div className="table-container" style={{ margin: '15px 0 0 0', border: 'none', boxShadow: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nama Sekolah</th>
                  <th>Jumlah Kelas</th>
                  <th>Jumlah Siswa</th>
                  <th>Guru</th>
                </tr>
              </thead>
              <tbody>
                {schoolStats.map((sch) => (
                  <tr key={sch.id}>
                    <td>
                      <div style={{ fontWeight: '700' }}>{sch.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                        Status: {sch.status ? 'Aktif' : 'Nonaktif'}
                      </div>
                    </td>
                    <td>{sch._count.classes} Kelas</td>
                    <td>{sch._count.students} Siswa</td>
                    <td>{sch._count.users} Guru</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit Logs Section */}
        <div className="data-card" style={{ flex: 1, minWidth: '320px', padding: '24px' }}>
          <div style={styles.sectionHeader}>
            <h3>Aktivitas Sistem Terbaru</h3>
            <Link href="/super-admin/logs" style={styles.sectionLink}>
              Lihat Semua Log <ArrowRight size={16} />
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
                    {log.school && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '600' }}>
                        {log.school.name}
                      </span>
                    )}
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
