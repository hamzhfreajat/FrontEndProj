import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts';

const Dashboard = () => {
    const [insights, setInsights] = useState(null);
    const [telemetry, setTelemetry] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Adjust base URL if needed based on your environment
                const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
                const [resInsights, resTelemetry] = await Promise.all([
                    axios.get(`${API_URL}/tracking/insights`).catch(() => ({ data: null })),
                    axios.get(`${API_URL}/telemetry/analytics`).catch(() => ({ data: null }))
                ]);
                setInsights(resInsights.data);
                setTelemetry(resTelemetry.data);
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return <div style={{ padding: 40, textAlign: 'center' }}>جاري تحميل البيانات الحية...</div>;
    }

    return (
        <div className="dashboard-container">
            <div className="page-header">
                <h1>لوحة القيادة ونشاط المستخدمين</h1>
                <p>تتبع حي لسلوك المستخدمين والفلاتر النشطة</p>
            </div>

            <div className="dashboard-content" style={{ display: 'block' }}>

                    {telemetry && (
                        <div className="telemetry-section" style={{ marginBottom: '40px' }}>
                            <h2 style={{ marginBottom: '20px' }}>إحصائيات التتبع والتحليلات (Telemetry)</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
                                
                                <div className="card tracking-card" style={{ padding: '20px' }}>
                                    <h3>المستخدمين النشطين يومياً (DAU)</h3>
                                    <div style={{ height: 300, marginTop: 16 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={telemetry.dau}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                                                <YAxis tick={{ fontSize: 12 }} />
                                                <RechartsTooltip />
                                                <Line type="monotone" dataKey="active_users" stroke="#0075FF" name="مستخدم نشط" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="card tracking-card" style={{ padding: '20px' }}>
                                    <h3>أكثر الشاشات زيارة</h3>
                                    <div style={{ height: 300, marginTop: 16 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={telemetry.top_screens} layout="vertical" margin={{ left: 40 }}>
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eee" />
                                                <XAxis type="number" tick={{ fontSize: 12 }} />
                                                <YAxis dataKey="screen" type="category" tick={{ fontSize: 12 }} width={80} />
                                                <RechartsTooltip />
                                                <Bar dataKey="views" fill="#E94057" name="مشاهدات" radius={[0, 4, 4, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="card tracking-card" style={{ padding: '20px', gridColumn: '1 / -1' }}>
                                    <h3>مسار المستخدم (قمع التحويل)</h3>
                                    <div style={{ height: 300, marginTop: 16 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={telemetry.funnel}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                                <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 'bold' }} />
                                                <YAxis tick={{ fontSize: 12 }} />
                                                <RechartsTooltip />
                                                <Area type="monotone" dataKey="value" stroke="#F27121" fill="#F27121" fillOpacity={0.3} name="عدد المستخدمين" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                
                            </div>
                        </div>
                    )}

                    <div className="card tracking-card mt-4 mb-4" style={{ marginBottom: '24px' }}>
                        <h3>توزيع إعلانات فئات العقارات</h3>
                        <div className="location-stats-list">
                            {insights?.real_estate_stats?.length > 0 ? (
                                insights.real_estate_stats.map((cat, i) => (
                                    <div key={`cat-${i}`} className="location-item">
                                        <div className="loc-city-header">
                                            <span className="loc-city-name">{cat.name}</span>
                                            <span className="loc-city-count badge">{cat.total_count} إعلان مختزن</span>
                                        </div>
                                        {cat.children && (() => {
                                            const total = cat.children.length;
                                            const zero = cat.children.filter(c => c.count === 0).length;
                                            const under10 = cat.children.filter(c => c.count > 0 && c.count < 10).length;
                                            const under20 = cat.children.filter(c => c.count >= 10 && c.count < 20).length;
                                            return (
                                                <div className="stat-summary-row">
                                                    <span>إجمالي الفئات: <b>{total}</b></span>
                                                    <span>بدون إعلانات: <b>{zero}</b> فئة</span>
                                                    <span>أقل من 10: <b>{under10}</b> فئة</span>
                                                    <span>أقل من 20: <b>{under20}</b> فئة</span>
                                                </div>
                                            );
                                        })()}
                                        <div className="loc-regions">
                                            {cat.children && cat.children.map((child, j) => (
                                                <div key={`child-${j}`} className="loc-region-item">
                                                    <span className="loc-reg-name">{child.name}</span>
                                                    <span className="loc-reg-count">{child.count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="empty-state" style={{ minHeight: '60px' }}>لا توجد بيانات فئات متاحة حالياً...</div>
                            )}
                        </div>
                    </div>

                    <div className="card tracking-card mt-4">
                        <h3>توزيع الإعلانات المباشر (توزيع المحافظات والمناطق)</h3>
                        <div className="location-stats-list">
                            {insights?.location_stats?.length > 0 ? (
                                insights.location_stats.map((loc, i) => (
                                    <div key={i} className="location-item">
                                        <div className="loc-city-header">
                                            <span className="loc-city-name">{loc.city}</span>
                                            <span className="loc-city-count badge">{loc.total_ads} إعلان مختزن</span>
                                        </div>
                                        {loc.regions && (() => {
                                            const total = loc.regions.length;
                                            const zero = loc.regions.filter(r => r.count === 0).length;
                                            const under10 = loc.regions.filter(r => r.count > 0 && r.count < 10).length;
                                            const under20 = loc.regions.filter(r => r.count >= 10 && r.count < 20).length;
                                            return (
                                                <div className="stat-summary-row">
                                                    <span>إجمالي المناطق: <b>{total}</b></span>
                                                    <span>بدون إعلانات: <b>{zero}</b> منطقة</span>
                                                    <span>أقل من 10: <b>{under10}</b> منطقة</span>
                                                    <span>أقل من 20: <b>{under20}</b> منطقة</span>
                                                </div>
                                            );
                                        })()}
                                        <div className="loc-regions">
                                            {loc.regions.map((reg, j) => (
                                                <div key={j} className="loc-region-item">
                                                    <span className="loc-reg-name">{reg.name}</span>
                                                    <span className="loc-reg-count">{reg.count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="empty-state" style={{ minHeight: '100px' }}>لا توجد بيانات جغرافية متاحة حالياً، ربما لم يتم رفع التعديلات للخادم بعد...</div>
                            )}
                        </div>
                    </div>
            </div>

            <style jsx>{`
        .page-header {
          margin-bottom: 32px;
        }
        
        .location-stats-list {
          margin-top: 16px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 16px;
        }
        .location-item {
          background: #f9fbfc;
          border: 1px solid #eef2f6;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 12px;
        }
        .cat-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0;
        }
        .loc-city-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding-bottom: 12px;
          border-bottom: 1px dashed #ddd;
        }
        .loc-city-name {
          font-weight: 800;
          font-size: 1.05rem;
          color: var(--text-dark);
        }
        .loc-city-count.badge {
          background: rgba(0, 117, 255, 0.1);
          color: var(--primary-color);
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: bold;
        }
        .loc-regions {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .stat-summary-row {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 0.8rem;
          color: #666;
          background: #f1f5f9;
          padding: 10px 12px;
          border-radius: 6px;
          margin-bottom: 12px;
        }
        .stat-summary-row span {
          display: flex;
          gap: 4px;
        }
        .loc-region-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.9rem;
        }
        .loc-reg-name {
          color: #555;
        }
        .loc-reg-count {
          font-weight: 600;
          color: #888;
          font-size: 0.85rem;
        }

        .empty-state {
          height: 100%;
          min-height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-light);
          font-weight: 600;
        }

        @media (max-width: 768px) {
          .location-stats-list {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
        </div>
    );
};

export default Dashboard;
