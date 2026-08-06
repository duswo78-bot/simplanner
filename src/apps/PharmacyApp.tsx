import React, { useState, useEffect } from 'react';
import { AppContainer } from '../components/AppContainer';
import { PharmacyTab } from './Pharmacy/PharmacyTab';
import { HospitalTab } from './Pharmacy/HospitalTab';

interface PharmacyAppProps {
  onBack: () => void;
}

export function PharmacyApp({ onBack }: PharmacyAppProps) {
  const [searchType, setSearchType] = useState<'pharmacy' | 'hospital'>('pharmacy');
  
  // Shared search state (so changing tabs keeps the location selection)
  const [sido, setSido] = useState('');
  const [sigungu, setSigungu] = useState('');
  const [pharmacyName, setPharmacyName] = useState('');
  const [showOpenOnly, setShowOpenOnly] = useState(true);
  
  // Hospital specific state
  const [hospitalTypes, setHospitalTypes] = useState<string[]>([]);

  useEffect(() => {
    // Load last searched region
    const savedSido = localStorage.getItem('pharmacy_sido');
    const savedSigungu = localStorage.getItem('pharmacy_sigungu');
    if (savedSido) setSido(savedSido);
    if (savedSigungu) setSigungu(savedSigungu);
  }, []);

  const bgImage = searchType === 'pharmacy' ? `${import.meta.env.BASE_URL}images/pharmacy_bg.jpg` : `${import.meta.env.BASE_URL}images/hospital_bg.jpg`;

  return (
    <AppContainer title="약국/병원 찾기" onBack={onBack} bgImage={bgImage}>
      {searchType === 'pharmacy' ? (
        <PharmacyTab 
          searchType={searchType} setSearchType={setSearchType}
          sido={sido} setSido={setSido}
          sigungu={sigungu} setSigungu={setSigungu}
          pharmacyName={pharmacyName} setPharmacyName={setPharmacyName}
          showOpenOnly={showOpenOnly} setShowOpenOnly={setShowOpenOnly}
        />
      ) : (
        <HospitalTab 
          searchType={searchType} setSearchType={setSearchType}
          sido={sido} setSido={setSido}
          sigungu={sigungu} setSigungu={setSigungu}
          pharmacyName={pharmacyName} setPharmacyName={setPharmacyName}
          hospitalTypes={hospitalTypes} setHospitalTypes={setHospitalTypes}
          showOpenOnly={showOpenOnly} setShowOpenOnly={setShowOpenOnly}
        />
      )}
    </AppContainer>
  );
}
