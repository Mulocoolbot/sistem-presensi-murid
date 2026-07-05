'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Award, Layers, Users, BookOpen, Clock, ShieldAlert, FileBarChart, RefreshCw } from 'lucide-react';

interface KepsekStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  attendanceRate: number;
}

interface WaliStats {
  className: string;
  studentCount: number;
  attendanceRate: number;
}

interface MapelAssignment {
  subjectName: string;
  subjectCode: string;
  className: string;
  semester: string;
  academicYear: string;
}

interface MapelStats {
  assignmentCount: number;
  assignments: MapelAssignment[];
}

interface DashboardData {
  isKepalaSekolah: boolean;
  isWaliKelas: boolean;
  isGuruMapel: boolean;
  kepsekStats?: KepsekStats;
  waliStats?: WaliStats;
  mapelStats?: MapelStats;
}

export default function TeacherDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/teacher/dashboard');
      if (!res.ok) throw new Error('Gagal mengambil data dashboard guru');
      const json = await res.json();
      setData(json);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDashboardData();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div style={styles.loadingArea}>
        <div className="spinner gradient-bg" style={{ width: '40px', height: '40px' }}></div>
        <p style={{ marginTop: '15px', fontWeight: 600 }}>Memuat Halaman Dashboard...</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div>
      <div className="page-header">
        <div className="page-title-section">
          <h1>Dashboard Guru</h1>
          <p>Selamat datang! Tinjau data tugas mengajar, perwalian kelas, atau laporan sekolah Anda</p>
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

      {/* 1. KEPALA SEKOLAH DASHBOARD VIEW */}
      {data.isKepalaSekolah && data.kepsekStats && (
        <div style={styles.sectionCard}>
          <div style={styles.sectionHeader}>
            <Award size={20} color="var(--primary)" />
            <h3 style={{ fontWeight: '800' }}>Panel Kepala Sekolah (Monitoring Sekolah)</h3>
          </div>
          
          <div className="stats-grid" style={{ marginTop: '20px', marginBottom: '0' }}>
            <div className="data-card">
              <div style={styles.cardHeader}>
                <Users size={18} color="var(--primary)" />
                <span style={styles.cardLabel}>Siswa Sekolah</span>
              </div>
              <div style={styles.cardValue}>{data.kepsekStats.totalStudents}</div>
              <p style={styles.cardFooter}>Total murid terdaftar</p>
            </div>

            <div className="data-card">
              <div style={styles.cardHeader}>
                <Users size={18} color="var(--success)" />
                <span style={styles.cardLabel}>Guru Sekolah</span>
              </div>
              <div style={styles.cardValue}>{data.kepsekStats.totalTeachers}</div>
              <p style={styles.cardFooter}>Rekan sejawat aktif</p>
            </div>

            <div className="data-card">
              <div style={styles.cardHeader}>
                <Layers size={18} color="var(--primary)" />
                <span style={styles.cardLabel}>Total Rombel</span>
              </div>
              <div style={styles.cardValue}>{data.kepsekStats.totalClasses}</div>
              <p style={styles.cardFooter}>Jumlah rombongan belajar</p>
            </div>

            <div className="data-card">
              <div style={styles.cardHeader}>
                <Clock size={18} color="var(--success)" />
                <span style={styles.cardLabel}>Rerata Presensi</span>
              </div>
              <div style={{ ...styles.cardValue, color: 'var(--success)' }}>{data.kepsekStats.attendanceRate}%</div>
              <p style={styles.cardFooter}>Tingkat kehadiran sekolah</p>
            </div>
          </div>
        </div>
      )}

      {/* 2. WALI KELAS DASHBOARD VIEW */}
      {data.isWaliKelas && (
        <div style={{ ...styles.sectionCard, marginTop: '24px' }}>
          <div style={styles.sectionHeader}>
            <Layers size={20} color="var(--primary)" />
            <h3 style={{ fontWeight: '800' }}>Panel Wali Kelas</h3>
          </div>

          {data.waliStats ? (
            <div className="stats-grid" style={{ marginTop: '20px', marginBottom: '0' }}>
              <div className="data-card">
                <div style={styles.cardHeader}>
                  <Layers size={18} color="var(--primary)" />
                  <span style={styles.cardLabel}>Kelas Perwalian</span>
                </div>
                <div style={styles.cardValue}>{data.waliStats.className}</div>
                <p style={styles.cardFooter}>Tanggung jawab kelas Anda</p>
              </div>

              <div className="data-card">
                <div style={styles.cardHeader}>
                  <Users size={18} color="var(--success)" />
                  <span style={styles.cardLabel}>Jumlah Siswa</span>
                </div>
                <div style={styles.cardValue}>{data.waliStats.studentCount} Siswa</div>
                <p style={styles.cardFooter}>Anggota kelas aktif</p>
              </div>

              <div className="data-card">
                <div style={styles.cardHeader}>
                  <Clock size={18} color="var(--primary)" />
                  <span style={styles.cardLabel}>Tingkat Kehadiran</span>
                </div>
                <div style={{ ...styles.cardValue, color: 'var(--primary)' }}>{data.waliStats.attendanceRate}%</div>
                <p style={styles.cardFooter}>Kehadiran kelas perwalian</p>
              </div>
            </div>
          ) : (
            <div style={styles.warningBox}>
              <ShieldAlert size={18} />
              <span>Status Wali Kelas aktif, namun Admin Sekolah belum memetakan Anda ke kelas mana pun.</span>
            </div>
          )}
        </div>
      )}

      {/* 3. GURU MATA PELAJARAN VIEW */}
      {data.isGuruMapel && data.mapelStats && (
        <div style={{ ...styles.sectionCard, marginTop: '24px' }}>
          <div style={styles.sectionHeader}>
            <BookOpen size={20} color="var(--primary)" />
            <h3 style={{ fontWeight: '800' }}>Panel Guru Mata Pelajaran</h3>
          </div>

          <div style={{ padding: '20px 0 0 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <h4>Daftar Kelas & Mata Pelajaran Diampu ({data.mapelStats.assignmentCount} Jadwal)</h4>
              <Link href="/teacher/attendance" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                Buka Form Presensi
              </Link>
            </div>

            <div className="table-container" style={{ marginTop: '14px', border: 'none', boxShadow: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Mata Pelajaran</th>
                    <th>Kode</th>
                    <th>Kelas Diajar</th>
                    <th>Tahun Ajaran & Semester</th>
                  </tr>
                </thead>
                <tbody>
                  {data.mapelStats.assignments.map((ass, i) => (
                    <tr key={i}>
                      <td><span style={{ fontWeight: 700 }}>{ass.subjectName}</span></td>
                      <td>
                        <span className="badge badge-active" style={{ background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: '700' }}>
                          {ass.subjectCode}
                        </span>
                      </td>
                      <td><span style={{ fontWeight: 600 }}>{ass.className}</span></td>
                      <td>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{ass.academicYear}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Semester {ass.semester}</div>
                      </td>
                    </tr>
                  ))}
                  {data.mapelStats.assignments.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: 'var(--muted)' }}>
                        Belum ada jadwal mengajar yang dipetakan oleh Admin Sekolah.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
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
    marginBottom: '20px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  sectionCard: {
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    padding: '24px',
    boxShadow: 'var(--shadow-sm)',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    borderBottom: '1px solid var(--border)',
    paddingBottom: '12px',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  cardLabel: {
    fontSize: '0.8rem',
    fontWeight: '700',
    color: 'var(--muted)',
  },
  cardValue: {
    fontSize: '1.75rem',
    fontWeight: '800',
    color: 'var(--foreground)',
    lineHeight: '1.2',
  },
  cardFooter: {
    fontSize: '0.75rem',
    color: 'var(--muted)',
    marginTop: '4px',
  },
  warningBox: {
    background: 'var(--warning-light)',
    color: 'var(--warning)',
    border: '1px solid hsl(38, 92%, 90%)',
    padding: '14px',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.85rem',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '16px',
    fontWeight: '600',
  },
};
