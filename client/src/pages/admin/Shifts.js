import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { shiftsAPI, driversAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { FiPlus, FiTrash2, FiCalendar, FiClock, FiUser, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

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

  // Navigate to previous week
  const goToPrevWeek = () => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() - 7);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  // Navigate to next week
  const goToNextWeek = () => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + 7);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  // Go to today
  const goToToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  // Handle custom date input
  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  // Get month and year label for current week
  const getWeekLabel = () => {
    const dates = getWeekDates();
    const startMonth = dates[0].toLocaleDateString('id-ID', { month: 'short' });
    const endMonth = dates[6].toLocaleDateString('id-ID', { month: 'short' });
    const year = dates[0].getFullYear();
    
    if (startMonth === endMonth) {
      return `${startMonth} ${year}`;
    }
    return `${startMonth} - ${endMonth} ${year}`;
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
          <div style={styles.calendarNav}>
            <button style={styles.navButton} onClick={goToPrevWeek}>
              <FiChevronLeft size={20} />
            </button>
            <div style={styles.calendarTitle}>
              <FiCalendar size={18} />
              <span>{getWeekLabel()}</span>
            </div>
            <button style={styles.navButton} onClick={goToNextWeek}>
              <FiChevronRight size={20} />
            </button>
          </div>
          <div style={styles.calendarActions}>
            <button style={styles.todayButton} onClick={goToToday}>
              Hari Ini
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              style={styles.dateInput}
            />
          </div>
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
    color: '#FFD700',
    margin: 0,
  },
  subtitle: {
    color: '#9CA3AF',
    marginTop: 4,
  },
  addButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #FFD700 0%, #DAA520 100%)',
    color: '#0D0D0D',
    border: 'none',
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(255, 215, 0, 0.4)',
  },
  calendarCard: {
    background: '#1A1A1A',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
    border: '1px solid rgba(255, 215, 0, 0.1)',
  },
  calendarHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 16,
  },
  calendarNav: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    border: '1px solid rgba(255, 215, 0, 0.2)',
    background: '#252525',
    color: '#FFD700',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
  calendarTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: '#FFD700',
    fontWeight: 600,
    fontSize: 16,
    minWidth: 150,
    justifyContent: 'center',
  },
  calendarActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  todayButton: {
    padding: '10px 16px',
    borderRadius: 10,
    border: '1px solid rgba(255, 215, 0, 0.3)',
    background: 'transparent',
    color: '#FFD700',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 14,
    transition: 'all 0.2s',
  },
  dateInput: {
    padding: '10px 16px',
    borderRadius: 10,
    border: '1px solid rgba(255, 215, 0, 0.2)',
    background: '#252525',
    color: '#FFFFFF',
    cursor: 'pointer',
    fontSize: 14,
    outline: 'none',
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
    border: '2px solid rgba(255, 215, 0, 0.15)',
    borderRadius: 16,
    background: '#252525',
    cursor: 'pointer',
    transition: 'all 0.2s',
    color: '#E5E7EB',
  },
  dayButtonActive: {
    background: 'linear-gradient(135deg, #FFD700 0%, #DAA520 100%)',
    borderColor: 'transparent',
    color: '#0D0D0D',
  },
  dayButtonToday: {
    borderColor: '#FFD700',
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
    background: '#1A1A1A',
    borderRadius: 20,
    padding: 24,
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
    border: '1px solid rgba(255, 215, 0, 0.1)',
  },
  shiftHeader: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: '#FFFFFF',
    margin: 0,
  },
  emptyState: {
    textAlign: 'center',
    padding: '48px 20px',
    color: '#9CA3AF',
  },
  emptyAddButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    padding: '12px 24px',
    background: '#252525',
    border: '1px solid rgba(255, 215, 0, 0.2)',
    borderRadius: 12,
    color: '#FFD700',
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
    border: '1px solid rgba(255, 215, 0, 0.1)',
    borderRadius: 16,
    overflow: 'hidden',
    background: '#252525',
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
    background: 'linear-gradient(135deg, #FFD700 0%, #DAA520 100%)',
    color: '#0D0D0D',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    fontWeight: 700,
  },
  driverName: {
    fontWeight: 600,
    color: '#FFFFFF',
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
    background: 'rgba(239, 68, 68, 0.15)',
    color: '#ef4444',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 20,
  },
  modal: {
    background: '#1A1A1A',
    borderRadius: 20,
    width: '100%',
    maxWidth: 480,
    border: '1px solid rgba(255, 215, 0, 0.2)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 700,
    margin: 0,
    color: '#FFD700',
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
    color: '#E5E7EB',
    marginBottom: 10,
  },
  select: {
    width: '100%',
    padding: '14px 16px',
    border: '2px solid rgba(255, 215, 0, 0.2)',
    borderRadius: 12,
    fontSize: 15,
    outline: 'none',
    background: '#252525',
    color: '#FFFFFF',
  },
  shiftOptions: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
  },
  shiftOption: {
    padding: 16,
    border: '2px solid rgba(255, 215, 0, 0.15)',
    borderRadius: 12,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    transition: 'all 0.2s',
    background: '#252525',
  },
  shiftOptionDot: {
    width: 12,
    height: 12,
    borderRadius: '50%',
  },
  shiftOptionLabel: {
    fontWeight: 600,
    color: '#FFFFFF',
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
    background: '#252525',
    color: '#9CA3AF',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
  },
  submitButton: {
    flex: 1,
    padding: '14px 24px',
    background: 'linear-gradient(135deg, #FFD700 0%, #DAA520 100%)',
    color: '#0D0D0D',
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
    border: '4px solid rgba(255, 215, 0, 0.2)',
    borderTopColor: '#FFD700',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
};

export default AdminShifts;
