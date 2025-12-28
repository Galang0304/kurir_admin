import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { shiftsAPI, driversAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { FiPlus, FiTrash2, FiCalendar, FiClock, FiUser, FiX } from 'react-icons/fi';

const AdminShifts = () => {
  const [shifts, setShifts] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    driverId: '',
    date: '',
    shiftType: 'full_day'
  });

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    try {
      const [shiftsRes, driversRes] = await Promise.all([
        shiftsAPI.getAll({ date: selectedDate }),
        driversAPI.getAll()
      ]);
      setShifts(shiftsRes.data);
      setDrivers(driversRes.data);
    } catch (error) {
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddShift = async (e) => {
    e.preventDefault();
    try {
      await shiftsAPI.create({
        ...formData,
        date: selectedDate
      });
      toast.success('Jadwal ditambahkan');
      setShowModal(false);
      fetchData();
    } catch (error) {
      toast.error('Gagal menambah jadwal');
    }
  };

  const handleDeleteShift = async (id) => {
    if (window.confirm('Hapus jadwal ini?')) {
      try {
        await shiftsAPI.delete(id);
        toast.success('Jadwal dihapus');
        fetchData();
      } catch (error) {
        toast.error('Gagal menghapus jadwal');
      }
    }
  };

  const getShiftLabel = (type) => {
    const labels = {
      morning: { label: 'Pagi', time: '06:00 - 14:00', color: '#fbbf24' },
      afternoon: { label: 'Siang', time: '14:00 - 22:00', color: '#f97316' },
      night: { label: 'Malam', time: '22:00 - 06:00', color: '#6366f1' },
      full_day: { label: 'Full Day', time: '24 Jam', color: '#10b981' }
    };
    return labels[type] || labels.full_day;
  };

  // Generate week dates
  const getWeekDates = () => {
    const dates = [];
    const startDate = new Date(selectedDate);
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getWeekDates();
  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  const formatDate = (date) => {
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('id-ID', options);
  };

  if (loading) {
    return (
      <Layout>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Jadwal Piket Driver</h1>
          <p style={styles.subtitle}>Atur jadwal kerja driver</p>
        </div>
        <button 
          style={styles.addButton}
          onClick={() => {
            setFormData({ driverId: '', date: selectedDate, shiftType: 'full_day' });
            setShowModal(true);
          }}
        >
          <FiPlus size={20} />
          Tambah Jadwal
        </button>
      </div>

      {/* Calendar Week View */}
      <div style={styles.calendarCard}>
        <div style={styles.calendarHeader}>
          <FiCalendar size={20} />
          <span>Pilih Tanggal</span>
        </div>
        <div style={styles.weekGrid}>
          {weekDates.map((date, index) => {
            const dateStr = date.toISOString().split('T')[0];
            const isSelected = dateStr === selectedDate;
            const isToday = dateStr === new Date().toISOString().split('T')[0];
            
            return (
              <button
                key={index}
                style={{
                  ...styles.dayButton,
                  ...(isSelected ? styles.dayButtonActive : {}),
                  ...(isToday && !isSelected ? styles.dayButtonToday : {})
                }}
                onClick={() => setSelectedDate(dateStr)}
              >
                <span style={styles.dayName}>{dayNames[index]}</span>
                <span style={styles.dayNumber}>{date.getDate()}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Shifts for selected date */}
      <div style={styles.shiftSection}>
        <div style={styles.shiftHeader}>
          <h2 style={styles.sectionTitle}>
            Jadwal {formatDate(new Date(selectedDate))}
          </h2>
        </div>

        {shifts.length === 0 ? (
          <div style={styles.emptyState}>
            <FiCalendar size={48} style={{ color: '#d1d5db', marginBottom: 16 }} />
            <p style={{ color: '#6b7280', margin: 0 }}>Tidak ada jadwal untuk tanggal ini</p>
            <button 
              style={styles.emptyAddButton}
              onClick={() => setShowModal(true)}
            >
              <FiPlus size={18} /> Tambah Jadwal
            </button>
          </div>
        ) : (
          <div style={styles.shiftGrid}>
            {shifts.map((shift) => {
              const shiftInfo = getShiftLabel(shift.shiftType);
              return (
                <div key={shift.id} style={styles.shiftCard}>
                  <div style={{
                    ...styles.shiftBadge,
                    background: shiftInfo.color
                  }}>
                    <FiClock size={14} />
                    {shiftInfo.label}
                  </div>
                  <div style={styles.shiftBody}>
                    <div style={styles.driverInfo}>
                      <div style={styles.driverAvatar}>
                        {shift.driver?.name?.charAt(0) || 'D'}
                      </div>
                      <div>
                        <div style={styles.driverName}>{shift.driver?.name}</div>
                        <div style={styles.shiftTime}>{shiftInfo.time}</div>
                      </div>
                    </div>
                    <button 
                      style={styles.deleteButton}
                      onClick={() => handleDeleteShift(shift.id)}
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Shift Modal */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Tambah Jadwal Piket</h2>
              <button 
                style={styles.closeButton}
                onClick={() => setShowModal(false)}
              >
                <FiX size={24} />
              </button>
            </div>
            <form onSubmit={handleAddShift}>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <FiUser size={16} /> Driver
                </label>
                <select
                  value={formData.driverId}
                  onChange={(e) => setFormData({...formData, driverId: e.target.value})}
                  style={styles.select}
                  required
                >
                  <option value="">Pilih Driver</option>
                  {drivers.map(driver => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name}
                    </option>
                  ))}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <FiClock size={16} /> Tipe Shift
                </label>
                <div style={styles.shiftOptions}>
                  {[
                    { value: 'morning', label: 'Pagi', time: '06:00 - 14:00', color: '#fbbf24' },
                    { value: 'afternoon', label: 'Siang', time: '14:00 - 22:00', color: '#f97316' },
                    { value: 'night', label: 'Malam', time: '22:00 - 06:00', color: '#6366f1' },
                    { value: 'full_day', label: 'Full Day', time: '24 Jam', color: '#10b981' }
                  ].map(opt => (
                    <div
                      key={opt.value}
                      style={{
                        ...styles.shiftOption,
                        ...(formData.shiftType === opt.value ? {
                          borderColor: opt.color,
                          background: `${opt.color}15`
                        } : {})
                      }}
                      onClick={() => setFormData({...formData, shiftType: opt.value})}
                    >
                      <div style={{
                        ...styles.shiftOptionDot,
                        background: opt.color
                      }} />
                      <div>
                        <div style={styles.shiftOptionLabel}>{opt.label}</div>
                        <div style={styles.shiftOptionTime}>{opt.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={styles.modalFooter}>
                <button 
                  type="button" 
                  style={styles.cancelButton}
                  onClick={() => setShowModal(false)}
                >
                  Batal
                </button>
                <button type="submit" style={styles.submitButton}>
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    flexWrap: 'wrap',
    gap: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 700,
    color: '#1f2937',
    margin: 0,
  },
  subtitle: {
    color: '#6b7280',
    marginTop: 4,
  },
  addButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
  },
  calendarCard: {
    background: 'white',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  },
  calendarHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
    color: '#6b7280',
    fontWeight: 600,
  },
  weekGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: 8,
  },
  dayButton: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '16px 8px',
    border: '2px solid #e5e7eb',
    borderRadius: 16,
    background: 'white',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  dayButtonActive: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderColor: 'transparent',
    color: 'white',
  },
  dayButtonToday: {
    borderColor: '#667eea',
  },
  dayName: {
    fontSize: 12,
    fontWeight: 600,
    opacity: 0.7,
  },
  dayNumber: {
    fontSize: 20,
    fontWeight: 700,
    marginTop: 4,
  },
  shiftSection: {
    background: 'white',
    borderRadius: 20,
    padding: 24,
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  },
  shiftHeader: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: '#1f2937',
    margin: 0,
  },
  emptyState: {
    textAlign: 'center',
    padding: '48px 20px',
  },
  emptyAddButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    padding: '12px 24px',
    background: '#f3f4f6',
    border: 'none',
    borderRadius: 12,
    color: '#6b7280',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  shiftGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: 16,
  },
  shiftCard: {
    border: '1px solid #e5e7eb',
    borderRadius: 16,
    overflow: 'hidden',
  },
  shiftBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '10px 16px',
    color: 'white',
    fontWeight: 600,
    fontSize: 13,
  },
  shiftBody: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  driverInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  driverAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    fontWeight: 700,
  },
  driverName: {
    fontWeight: 600,
    color: '#1f2937',
  },
  shiftTime: {
    fontSize: 13,
    color: '#9ca3af',
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    border: 'none',
    background: '#fef2f2',
    color: '#ef4444',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 20,
  },
  modal: {
    background: 'white',
    borderRadius: 20,
    width: '100%',
    maxWidth: 480,
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottom: '1px solid #f3f4f6',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 700,
    margin: 0,
  },
  closeButton: {
    background: 'transparent',
    border: 'none',
    color: '#9ca3af',
    cursor: 'pointer',
  },
  formGroup: {
    padding: '0 24px',
    marginTop: 20,
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 14,
    fontWeight: 600,
    color: '#374151',
    marginBottom: 10,
  },
  select: {
    width: '100%',
    padding: '14px 16px',
    border: '2px solid #e5e7eb',
    borderRadius: 12,
    fontSize: 15,
    outline: 'none',
  },
  shiftOptions: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
  },
  shiftOption: {
    padding: 16,
    border: '2px solid #e5e7eb',
    borderRadius: 12,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    transition: 'all 0.2s',
  },
  shiftOptionDot: {
    width: 12,
    height: 12,
    borderRadius: '50%',
  },
  shiftOptionLabel: {
    fontWeight: 600,
    color: '#1f2937',
    fontSize: 14,
  },
  shiftOptionTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  modalFooter: {
    display: 'flex',
    gap: 12,
    padding: 24,
  },
  cancelButton: {
    flex: 1,
    padding: '14px 24px',
    background: '#f3f4f6',
    color: '#6b7280',
    border: 'none',
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
  },
  submitButton: {
    flex: 1,
    padding: '14px 24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 400,
  },
  spinner: {
    width: 40,
    height: 40,
    border: '4px solid #e5e7eb',
    borderTopColor: '#667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
};

export default AdminShifts;
