import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Map, MapPin, Search } from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.sooq-com.com/api';

const LocationsManager = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/locations?t=${new Date().getTime()}`);
      setLocations(res.data);
    } catch (error) {
      console.error('Error fetching locations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const filteredLocations = locations.map(city => {
    const cityMatches = city.name_ar.includes(searchTerm) || (city.name_en && city.name_en.includes(searchTerm));
    const matchedRegions = city.regions ? city.regions.filter(region => 
      region.name_ar.includes(searchTerm) || (region.name_en && region.name_en.includes(searchTerm))
    ) : [];
    
    if (cityMatches || matchedRegions.length > 0) {
      return {
        ...city,
        displayRegions: cityMatches ? city.regions : matchedRegions
      };
    }
    return null;
  }).filter(Boolean);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '15px' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
          <Search size={20} color="#6b7280" style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="ابحث عن مدينة أو منطقة..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '12px 45px 12px 15px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none', fontSize: '15px' }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
          جاري التحميل...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {filteredLocations.map(city => (
            <div key={city.id} style={{ backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={20} color="#3b82f6" />
                  {city.name_ar}
                </h2>
                <span style={{ backgroundColor: '#e0e7ff', color: '#4338ca', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                  {city.displayRegions ? city.displayRegions.length : 0} مناطق
                </span>
              </div>
              <div style={{ padding: '20px', maxHeight: '300px', overflowY: 'auto' }}>
                {city.displayRegions && city.displayRegions.length > 0 ? (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {city.displayRegions.map(region => (
                      <li key={region.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', backgroundColor: '#f1f5f9', borderRadius: '8px', color: '#334155', fontSize: '14px', fontWeight: '500' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#94a3b8' }}></div>
                        {region.name_ar}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div style={{ color: '#94a3b8', textAlign: 'center', padding: '20px 0', fontSize: '14px' }}>
                    لا توجد مناطق لعرضها
                  </div>
                )}
              </div>
            </div>
          ))}
          {filteredLocations.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: '#64748b', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
              لا توجد نتائج مطابقة للبحث
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationsManager;
