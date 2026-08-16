import React, { useState, useRef } from 'react';
import { useCarLedgerStore } from '../CarLedgerStore';
import type { Vehicle } from '../CarLedgerStore';
import { Car, Pencil, Trash2, Plus, X, Camera } from 'lucide-react';

interface VehiclePageProps {
  store: ReturnType<typeof useCarLedgerStore>;
  onNavigate?: (page: string) => void;
}

const FUEL_TYPES = ['가솔린', '디젤', 'LPG', '전기', '하이브리드', '수소'] as const;

export const VehiclePage: React.FC<VehiclePageProps> = ({ store }) => {
  const { vehicles, addVehicle, updateVehicle, deleteVehicle } = store;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [fuelType, setFuelType] = useState<Vehicle['fuelType']>('가솔린');
  const [currentMileage, setCurrentMileage] = useState<number | ''>('');
  const [insuranceDate, setInsuranceDate] = useState('');
  const [inspectionDate, setInspectionDate] = useState('');
  const [photo, setPhoto] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openAddModal = () => {
    setEditingId(null);
    setName('');
    setNumber('');
    setManufacturer('');
    setModel('');
    setYear(new Date().getFullYear());
    setFuelType('가솔린');
    setCurrentMileage('');
    setInsuranceDate('');
    setInspectionDate('');
    setPhoto('');
    setIsModalOpen(true);
  };

  const openEditModal = (v: Vehicle) => {
    setEditingId(v.id);
    setName(v.name);
    setNumber(v.number);
    setManufacturer(v.manufacturer);
    setModel(v.model);
    setYear(v.year);
    setFuelType(v.fuelType);
    setCurrentMileage(v.currentMileage);
    setInsuranceDate(v.insuranceDate);
    setInspectionDate(v.inspectionDate);
    setPhoto(v.photo);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('이 차량과 관련된 모든 기록이 삭제됩니다. 계속하시겠습니까?')) {
      deleteVehicle(id);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setPhoto(ev.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    
    const data = {
      name,
      number,
      manufacturer,
      model,
      year: Number(year),
      fuelType,
      currentMileage: Number(currentMileage) || 0,
      insuranceDate,
      inspectionDate,
      photo,
    };

    if (editingId) {
      updateVehicle(editingId, data);
    } else {
      addVehicle(data);
    }
    
    setIsModalOpen(false);
  };

  return (
    <div className="cl-page">
      <div className="cl-section-title">내 차량 관리</div>
      
      <div className="cl-vehicle-list">
        {vehicles.map(v => (
          <div key={v.id} className="cl-vehicle-card">
            <div className="cl-vehicle-photo">
              {v.photo ? (
                <img src={v.photo} alt={v.name} />
              ) : (
                <Car size={32} />
              )}
            </div>
            
            <div className="cl-vehicle-details">
              <div className="cl-vehicle-name">{v.name}</div>
              <div className="cl-vehicle-number">{v.number || '번호 없음'}</div>
              <div className="cl-vehicle-meta">
                {v.manufacturer && <span className="cl-vehicle-tag">{v.manufacturer}</span>}
                {v.model && <span className="cl-vehicle-tag">{v.model}</span>}
                <span className="cl-vehicle-tag">{v.year}년식</span>
                <span className="cl-vehicle-tag">{v.fuelType}</span>
                <span className="cl-vehicle-tag">{v.currentMileage.toLocaleString()}km</span>
              </div>
            </div>
            
            <div className="cl-vehicle-actions">
              <button className="cl-icon-btn" onClick={() => openEditModal(v)}>
                <Pencil size={18} />
              </button>
              <button className="cl-icon-btn" style={{ color: '#ef4444' }} onClick={() => handleDelete(v.id)}>
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {vehicles.length === 0 && (
         <div className="cl-empty">
           <Car size={48} />
           <p>등록된 차량이 없습니다.<br/>새로운 차량을 추가해보세요.</p>
         </div>
      )}

      <button className="cl-add-vehicle-btn" style={{ marginTop: '16px' }} onClick={openAddModal}>
        <Plus size={20} />
        <span>+ 차량 추가</span>
      </button>

      {isModalOpen && (
        <div className="cl-modal-overlay">
          <div className="cl-modal-sheet">
            <div className="cl-modal-handle"></div>
            <div className="cl-modal-header">
              <h2>{editingId ? '차량 수정' : '차량 추가'}</h2>
              <button className="cl-icon-btn" onClick={() => setIsModalOpen(false)}>
                <X size={24} />
              </button>
            </div>
            
            <form className="cl-form" onSubmit={handleSubmit}>
              <div className="cl-form-group">
                <label className="cl-form-label">차량 이름</label>
                <input 
                  type="text" 
                  className="cl-form-input" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  required 
                  placeholder="예: 마이카, 코나"
                />
              </div>
              
              <div className="cl-form-group">
                <label className="cl-form-label">차량 번호</label>
                <input 
                  type="text" 
                  className="cl-form-input" 
                  value={number} 
                  onChange={e => setNumber(e.target.value)} 
                  placeholder="12가 3456"
                />
              </div>

              <div className="cl-form-row">
                <div className="cl-form-group">
                  <label className="cl-form-label">제조사</label>
                  <input 
                    type="text" 
                    className="cl-form-input" 
                    value={manufacturer} 
                    onChange={e => setManufacturer(e.target.value)} 
                    placeholder="현대, 기아 등"
                  />
                </div>
                <div className="cl-form-group">
                  <label className="cl-form-label">모델</label>
                  <input 
                    type="text" 
                    className="cl-form-input" 
                    value={model} 
                    onChange={e => setModel(e.target.value)} 
                    placeholder="투싼, 쏘나타 등"
                  />
                </div>
              </div>

              <div className="cl-form-row">
                <div className="cl-form-group">
                  <label className="cl-form-label">연식</label>
                  <input 
                    type="number" 
                    className="cl-form-input" 
                    value={year} 
                    onChange={e => setYear(parseInt(e.target.value))} 
                  />
                </div>
                <div className="cl-form-group">
                  <label className="cl-form-label">현재 주행거리 (km)</label>
                  <input 
                    type="number" 
                    className="cl-form-input" 
                    value={currentMileage} 
                    onChange={e => setCurrentMileage(e.target.value ? parseInt(e.target.value) : '')} 
                  />
                </div>
              </div>

              <div className="cl-form-group">
                <label className="cl-form-label">연료 타입</label>
                <div className="cl-chips">
                  {FUEL_TYPES.map(ft => (
                    <button
                      key={ft}
                      type="button"
                      className={`cl-chip ${fuelType === ft ? 'active' : ''}`}
                      onClick={() => setFuelType(ft)}
                    >
                      {ft}
                    </button>
                  ))}
                </div>
              </div>

              <div className="cl-form-row">
                <div className="cl-form-group">
                  <label className="cl-form-label">보험 만료일</label>
                  <input 
                    type="date" 
                    className="cl-form-input" 
                    value={insuranceDate} 
                    onChange={e => setInsuranceDate(e.target.value)} 
                  />
                </div>
                <div className="cl-form-group">
                  <label className="cl-form-label">검사 만료일</label>
                  <input 
                    type="date" 
                    className="cl-form-input" 
                    value={inspectionDate} 
                    onChange={e => setInspectionDate(e.target.value)} 
                  />
                </div>
              </div>

              <div className="cl-form-group">
                <label className="cl-form-label">차량 사진</label>
                <input 
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handlePhotoUpload}
                />
                <div 
                  className="cl-photo-upload" 
                  onClick={() => fileInputRef.current?.click()}
                  style={{ position: 'relative' }}
                >
                  {photo ? (
                    <img src={photo} alt="Vehicle preview" />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Camera size={24} style={{ marginBottom: 4 }} />
                      <span>사진 업로드</span>
                    </div>
                  )}
                </div>
              </div>

              <button type="submit" className="cl-submit-btn" style={{ marginTop: '10px' }}>
                저장
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
