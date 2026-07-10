'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Edit, Trash2, RefreshCw, X, ShieldAlert, Search, ExternalLink, Eye, Upload, Download, Check, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface ClassOption {
  id: string;
  name: string;
}

interface ImportedStudent {
  nis: string;
  nisn: string;
  fullName: string;
  gender: string;
  className: string;
  classNameMatched?: string;
  classId?: string;
  phone?: string;
  address?: string;
  guardianName?: string;
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

export default function StudentsManagementPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search / Filter
  const [search, setSearch] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'CREATE' | 'EDIT'>('CREATE');
  const [targetId, setTargetId] = useState('');

  // Detail Modal
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
  const [classId, setClassId] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'MUTATED' | 'GRADUATED' | 'INACTIVE'>('ACTIVE');
  const [kkFile, setKkFile] = useState<File | null>(null);

  const [submitLoading, setSubmitLoading] = useState(false);
  const [success, setSuccess] = useState('');

  // CSV Import States
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<ImportedStudent[]>([]);
  const [importError, setImportError] = useState('');

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setImportError('');

    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    if (isExcel) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const arrayBuffer = event.target?.result as ArrayBuffer;
          const { read, utils } = await import('xlsx');
          const workbook = read(arrayBuffer, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const rawData = utils.sheet_to_json<unknown[]>(worksheet, { header: 1 });
          
          if (rawData.length <= 1) {
            throw new Error('File Excel kosong atau tidak memiliki data.');
          }

          const headers = (rawData[0] as unknown[]).map(h => String(h || '').trim().toLowerCase());
          const parsedStudents: ImportedStudent[] = [];

          for (let i = 1; i < rawData.length; i++) {
            const row = rawData[i] as unknown[];
            if (!row || row.length === 0) continue;
            
            const studentMap: Record<string, string> = {};
            headers.forEach((header, idx) => {
              if (header) {
                studentMap[header] = row[idx] !== undefined && row[idx] !== null ? String(row[idx]).trim() : '';
              }
            });

            const studentObj: ImportedStudent = {
              nis: studentMap.nis || '',
              nisn: studentMap.nisn || '',
              fullName: studentMap.nama || studentMap.name || studentMap.fullname || '',
              gender: (studentMap.gender || studentMap.kelamin || studentMap.sex || studentMap.jk || '').toUpperCase(),
              className: studentMap.kelas || studentMap.class || '',
              phone: studentMap.telepon || studentMap.phone || studentMap.hp || '',
              address: studentMap.alamat || studentMap.address || '',
              guardianName: studentMap.wali || studentMap.parent || studentMap.parentname || '',
            };

            if (!studentObj.nis && !studentObj.nisn && !studentObj.fullName) {
              continue;
            }

            if (!studentObj.nis || !studentObj.nisn || !studentObj.fullName || !studentObj.gender || !studentObj.className) {
              throw new Error(`Baris ${i + 1} tidak lengkap. Kolom wajib: NIS, NISN, Nama, Gender (L/P), dan Kelas.`);
            }

            if (studentObj.gender !== 'L' && studentObj.gender !== 'P') {
              throw new Error(`Baris ${i + 1}: Gender harus L (Laki-laki) atau P (Perempuan), ditemukan: "${studentObj.gender}".`);
            }

            const matchedClass = classes.find(c => c.name.toLowerCase() === studentObj.className.toLowerCase());
            if (!matchedClass) {
              throw new Error(`Baris ${i + 1}: Kelas "${studentObj.className}" tidak ditemukan di database. Pastikan nama kelas persis sama.`);
            }
            studentObj.classId = matchedClass.id;
            studentObj.classNameMatched = matchedClass.name;

            parsedStudents.push(studentObj);
          }

          setImportPreview(parsedStudents);
        } catch (err: unknown) {
          setImportError(err instanceof Error ? err.message : 'Gagal memproses file Excel.');
          setImportPreview([]);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const text = event.target?.result as string;
          const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
          if (lines.length <= 1) {
            throw new Error('File CSV kosong atau tidak memiliki data.');
          }

          const delimiter = lines[0].includes(';') ? ';' : ',';
          const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase());
          
          const parsedStudents: ImportedStudent[] = [];
          
          for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ''));
            if (cols.length < 5) continue;

            const studentMap: Record<string, string> = {};
            headers.forEach((header, idx) => {
              studentMap[header] = cols[idx] || '';
            });

            const studentObj: ImportedStudent = {
              nis: studentMap.nis || '',
              nisn: studentMap.nisn || '',
              fullName: studentMap.nama || studentMap.name || studentMap.fullname || '',
              gender: (studentMap.gender || studentMap.kelamin || studentMap.sex || studentMap.jk || '').toUpperCase(),
              className: studentMap.kelas || studentMap.class || '',
              phone: studentMap.telepon || studentMap.phone || studentMap.hp || '',
              address: studentMap.alamat || studentMap.address || '',
              guardianName: studentMap.wali || studentMap.parent || studentMap.parentname || '',
            };

            if (!studentObj.nis || !studentObj.nisn || !studentObj.fullName || !studentObj.gender || !studentObj.className) {
              throw new Error(`Baris ${i + 1} tidak lengkap. Kolom wajib: NIS, NISN, Nama, Gender (L/P), dan Kelas.`);
            }

            if (studentObj.gender !== 'L' && studentObj.gender !== 'P') {
              throw new Error(`Baris ${i + 1}: Gender harus L (Laki-laki) atau P (Perempuan), ditemukan: "${studentObj.gender}".`);
            }

            const matchedClass = classes.find(c => c.name.toLowerCase() === studentObj.className.toLowerCase());
            if (!matchedClass) {
              throw new Error(`Baris ${i + 1}: Kelas "${studentObj.className}" tidak ditemukan di database. Pastikan nama kelas persis sama.`);
            }
            studentObj.classId = matchedClass.id;
            studentObj.classNameMatched = matchedClass.name;

            parsedStudents.push(studentObj);
          }

          setImportPreview(parsedStudents);
        } catch (err: unknown) {
          setImportError(err instanceof Error ? err.message : 'Gagal memproses file CSV.');
          setImportPreview([]);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSaveImport = async () => {
    if (importPreview.length === 0) return;
    setSubmitLoading(true);
    setImportError('');
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/school-admin/students/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students: importPreview })
      });
      const data = await res.json() as { success?: boolean; count?: number; error?: string };
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan data impor');

      setSuccess(`Berhasil mengimpor ${data.count || 0} data siswa baru!`);
      setImportModalOpen(false);
      setImportFile(null);
      setImportPreview([]);
      fetchStudents();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: unknown) {
      setImportError(err instanceof Error ? err.message : 'Terjadi kesalahan.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const downloadCSVSample = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "nis,nisn,nama,gender,kelas,telepon,alamat,wali\n"
      + "10001,0091234567,Ahmad Fauzi,L,Kelas 10-A,08123456789,Jl. Mawar No.1,Budi Fauzi\n"
      + "10002,0097654321,Siti Aminah,P,Kelas 10-A,08129876543,Jl. Melati No.2,Hasan Aminah\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "sample_impor_siswa.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadExcelSample = async () => {
    try {
      const { utils, write } = await import('xlsx');
      const headers = ["nis", "nisn", "nama", "gender", "kelas", "telepon", "alamat", "wali"];
      const data = [
        headers,
        ["10001", "0091234567", "Ahmad Fauzi", "L", "Kelas 10-A", "08123456789", "Jl. Mawar No.1", "Budi Fauzi"],
        ["10002", "0097654321", "Siti Aminah", "P", "Kelas 10-A", "08129876543", "Jl. Melati No.2", "Hasan Aminah"]
      ];
      
      const worksheet = utils.aoa_to_sheet(data);
      const workbook = utils.book_new();
      utils.book_append_sheet(workbook, worksheet, "Template Siswa");
      
      const excelBuffer = write(workbook, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.setAttribute("download", "template_impor_siswa.xlsx");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      setImportError('Gagal mengunduh template Excel.');
    }
  };

  const fetchClasses = useCallback(async () => {
    try {
      const res = await fetch('/api/school-admin/classes');
      if (res.ok) {
        const data = await res.json();
        setClasses(data);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchStudents = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedClassId) params.append('classId', selectedClassId);

      const res = await fetch(`/api/school-admin/students?${params.toString()}`);
      if (!res.ok) throw new Error('Gagal mengambil daftar siswa');
      const data = await res.json();
      setStudents(data);
      setError('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }, [selectedClassId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClasses();
      fetchStudents();
    }, 0);
    return () => clearTimeout(timer);
  }, [selectedClassId, fetchClasses, fetchStudents]);

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
    setClassId(classes.length > 0 ? classes[0].id : '');
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
    // Format date string to yyyy-MM-dd
    const formattedDate = s.birthDate ? s.birthDate.substring(0, 10) : '';
    setBirthDate(formattedDate);
    setReligion(s.religion);
    setAddress(s.address);
    setParentName(s.parentName);
    setParentPhone(s.parentPhone);
    setClassId(s.classId);
    setStatus(s.status);
    setKkFile(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !nis || !nisn || !gender || !birthPlace || !birthDate || !religion || !address || !parentName || !parentPhone || !classId) {
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
      formData.append('classId', classId);
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
      if (!res.ok) throw new Error(data.error || 'Gagal memproses data siswa');

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

  // Local Search filtering
  const filteredStudents = students.filter((s) => 
    s.fullName.toLowerCase().includes(search.toLowerCase()) || 
    s.nis.includes(search) || 
    s.nisn.includes(search)
  );

  const totalItems = filteredStudents.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div>
      <div className="page-header">
        <div className="page-title-section">
          <h1>Kelola Data Murid</h1>
          <p>Kelola data registrasi murid, unggahan KK orang tua, mutasi kelas, kelulusan, dan status keaktifan</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={fetchStudents} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} /> Segarkan
          </button>
          <button className="btn btn-secondary" onClick={() => setImportModalOpen(true)} disabled={classes.length === 0} style={{ marginRight: '8px' }}>
            <Upload size={16} /> Impor CSV
          </button>
          <button className="btn btn-primary" onClick={openCreateModal} disabled={classes.length === 0}>
            <Plus size={16} /> Tambah Siswa
          </button>
        </div>
      </div>

      {error && (
        <div style={styles.errorAlert}>
          <ShieldAlert size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div style={{ ...styles.errorAlert, background: 'var(--success-light)', color: 'var(--success)', border: '1px solid hsl(142, 76%, 85%)' }}>
          <Check size={18} />
          <span>{success}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="glass" style={styles.filterCard}>
        <div style={styles.filterForm}>
          <div className="form-group" style={{ ...styles.filterCol, flexGrow: 2 }}>
            <label className="form-label">Cari Nama / NIS / NISN</label>
            <div style={styles.searchWrapper}>
              <Search size={18} style={styles.searchIcon} />
              <input
                type="text"
                className="form-input"
                placeholder="Masukkan nama lengkap, NIS, atau NISN murid..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          </div>

          <div className="form-group" style={styles.filterCol}>
            <label className="form-label">Filter Kelas</label>
            <select
              className="form-input"
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">Semua Kelas</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={styles.loadingArea}>
          <div className="spinner gradient-bg" style={{ width: '40px', height: '40px' }}></div>
          <p style={{ marginTop: '15px', color: 'var(--muted)' }}>Memuat data siswa...</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div style={styles.emptyArea} className="glass">
          <Users size={48} color="var(--muted)" />
          <h3>Tidak ada kecocokan murid</h3>
          <p>Belum ada siswa terdaftar pada kelas terpilih atau kriteria pencarian tidak ditemukan.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nama Murid</th>
                <th>NIS / NISN</th>
                <th>Kelas</th>
                <th>Orang Tua & Kontak</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginatedStudents.map((s) => (
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
                    <span className="badge badge-active" style={{ background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: '700' }}>
                      {s.class?.name || '-'}
                    </span>
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
                          : s.status === 'GRADUATED'
                          ? 'badge-active'
                          : 'badge-inactive'
                      }`}
                      style={s.status === 'GRADUATED' ? { background: 'var(--primary-light)', color: 'var(--primary)' } : undefined}
                    >
                      {s.status === 'ACTIVE' 
                        ? 'Aktif' 
                        : s.status === 'MUTATED' 
                        ? 'Mutasi' 
                        : s.status === 'GRADUATED'
                        ? 'Lulus'
                        : 'Nonaktif'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => setSelectedStudent(s)} 
                        className="btn btn-secondary" 
                        style={{ padding: '6px 10px', fontSize: '0.8rem', display: 'flex', gap: '4px' }}
                        title="Lihat Detail Murid"
                      >
                        <Eye size={14} /> Detail
                      </button>
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
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* PAGINATION CONTROLS */}
          {totalPages > 1 && (
            <div style={styles.paginationContainer}>
              <div style={styles.paginationInfo}>
                Menampilkan <strong>{Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, totalItems)}</strong> - <strong>{Math.min(currentPage * ITEMS_PER_PAGE, totalItems)}</strong> dari <strong>{totalItems}</strong> murid
              </div>
              <div style={styles.paginationButtons}>
                {currentPage > 1 && (
                  <>
                    <button 
                      type="button"
                      onClick={() => setCurrentPage(1)} 
                      className="btn btn-secondary" 
                      style={styles.pageBtn}
                      title="Halaman Pertama"
                    >
                      <ChevronsLeft size={16} />
                    </button>
                    <button 
                      type="button"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                      className="btn btn-secondary" 
                      style={styles.pageBtn}
                      title="Halaman Sebelumnya"
                    >
                      <ChevronLeft size={16} />
                    </button>
                  </>
                )}

                <span style={styles.pageIndicator}>
                  Halaman <strong>{currentPage}</strong> dari <strong>{totalPages}</strong>
                </span>

                {currentPage < totalPages && (
                  <>
                    <button 
                      type="button"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                      className="btn btn-secondary" 
                      style={styles.pageBtn}
                      title="Halaman Berikutnya"
                    >
                      <ChevronRight size={16} />
                    </button>
                    <button 
                      type="button"
                      onClick={() => setCurrentPage(totalPages)} 
                      className="btn btn-secondary" 
                      style={styles.pageBtn}
                      title="Halaman Terakhir"
                    >
                      <ChevronsRight size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CREATE & EDIT FORM MODAL */}
      {isModalOpen && (
        <div style={styles.modalOverlay}>
          <div className="glass" style={{ ...styles.modalCard, maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={styles.modalHeader}>
              <h3>{modalMode === 'CREATE' ? 'Pendaftaran Murid Baru' : 'Ubah Data Murid'}</h3>
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
                  <label className="form-label">NIS (Nomor Induk Siswa)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Masukkan NIS"
                    value={nis}
                    onChange={(e) => setNis(e.target.value)}
                    disabled={submitLoading}
                  />
                </div>
                <div className="form-group" style={styles.col}>
                  <label className="form-label">NISN (Nasional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Masukkan NISN"
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
                  <label className="form-label">Kelas Penempatan</label>
                  <select
                    className="form-input"
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    disabled={submitLoading}
                  >
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
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

      {/* DETAIL MODAL */}
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

      {/* CSV / EXCEL IMPORT MODAL */}
      {importModalOpen && (
        <div style={styles.modalOverlay}>
          <div className="glass" style={{ ...styles.modalCard, maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={styles.modalHeader}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Upload size={20} /> Impor Data Murid Massal (CSV / Excel)
              </h3>
              <button style={styles.modalCloseBtn} onClick={() => { setImportModalOpen(false); setImportFile(null); setImportPreview([]); setImportError(''); }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '16px 0', color: 'var(--foreground)' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '16px' }}>
                Gunakan fitur ini untuk mendaftarkan murid dalam jumlah banyak sekaligus. Pastikan file berformat **CSV (.csv)** atau **Excel (.xlsx, .xls)** dengan judul kolom sesuai template.
              </p>

              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <button type="button" onClick={downloadCSVSample} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                  <Download size={14} /> Unduh Contoh Template CSV
                </button>
                <button type="button" onClick={downloadExcelSample} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                  <Download size={14} /> Unduh Contoh Template Excel (.xlsx)
                </button>
              </div>

              {/* Upload Box */}
              <div style={{
                border: '2px dashed var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '30px 20px',
                textAlign: 'center',
                background: 'rgba(255, 255, 255, 0.02)',
                marginBottom: '20px'
              }}>
                <input
                  type="file"
                  id="csv-file-input"
                  accept=".csv, .xlsx, .xls"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <label htmlFor="csv-file-input" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  <Upload size={32} color="var(--primary)" />
                  <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                    {importFile ? importFile.name : 'Pilih atau Seret File CSV / Excel ke Sini'}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Format Maksimal file: 5MB</span>
                </label>
              </div>

              {importError && (
                <div style={{ ...styles.errorAlert, marginBottom: '20px' }}>
                  <ShieldAlert size={18} />
                  <span>{importError}</span>
                </div>
              )}

              {/* Import Preview */}
              {importPreview.length > 0 && (
                <div>
                  <h4 style={{ marginBottom: '10px', fontSize: '0.95rem', fontWeight: '700' }}>
                    Pratinjau Data Impor ({importPreview.length} Murid Terdeteksi)
                  </h4>
                  <div style={{ overflowX: 'auto', maxHeight: '250px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                      <thead style={{ background: 'rgba(255,255,255,0.05)', position: 'sticky', top: 0, borderBottom: '1px solid var(--border)' }}>
                        <tr>
                          <th style={{ padding: '8px', textAlign: 'left' }}>NIS</th>
                          <th style={{ padding: '8px', textAlign: 'left' }}>NISN</th>
                          <th style={{ padding: '8px', textAlign: 'left' }}>Nama</th>
                          <th style={{ padding: '8px', textAlign: 'center' }}>JK</th>
                          <th style={{ padding: '8px', textAlign: 'left' }}>Kelas Tujuan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importPreview.map((s, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                            <td style={{ padding: '8px' }}>{s.nis}</td>
                            <td style={{ padding: '8px' }}>{s.nisn}</td>
                            <td style={{ padding: '8px', fontWeight: '600' }}>{s.fullName}</td>
                            <td style={{ padding: '8px', textAlign: 'center' }}>
                              <span className={`badge ${s.gender === 'L' ? 'badge-active' : 'badge-inactive'}`}>
                                {s.gender === 'L' ? 'L' : 'P'}
                              </span>
                            </td>
                            <td style={{ padding: '8px', color: 'var(--success)' }}>{s.classNameMatched}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                    <button
                      type="button"
                      onClick={() => { setImportFile(null); setImportPreview([]); }}
                      className="btn btn-secondary"
                      disabled={submitLoading}
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveImport}
                      className="btn btn-primary"
                      disabled={submitLoading}
                    >
                      {submitLoading ? <RefreshCw size={16} className="spin" /> : <Plus size={16} />} Simpan Semua Data Murid
                    </button>
                  </div>
                </div>
              )}
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
  paginationContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '20px',
    padding: '12px 20px',
    background: 'var(--card-bg)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border)',
    flexWrap: 'wrap',
    gap: '12px',
  },
  paginationInfo: {
    fontSize: '0.85rem',
    color: 'var(--muted)',
  },
  paginationButtons: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  pageIndicator: {
    fontSize: '0.85rem',
    color: 'var(--foreground)',
    margin: '0 8px',
  },
  pageBtn: {
    padding: '0',
    height: '36px',
    width: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};
