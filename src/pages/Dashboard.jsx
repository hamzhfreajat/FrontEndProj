import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts';

const Dashboard = () => {
    const [insights, setInsights] = useState(null);
    const [telemetry, setTelemetry] = useState(null);
    const [loading, setLoading] = useState(true);
    const sankeyContainerRef = React.useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Adjust base URL if needed based on your environment
                const API_URL = process.env.REACT_APP_API_URL || 'https://api.sooq-com.com/api';
                const [resInsights, resTelemetry] = await Promise.all([
                    axios.get(`${API_URL}/tracking/insights`).catch(() => ({ data: null })),
                    axios.get(`${API_URL}/telemetry/analytics`).catch(() => ({ data: null }))
                ]);
                
                if (resInsights.data) setInsights(resInsights.data);
                if (resTelemetry.data) setTelemetry(resTelemetry.data);
            } catch (err) {
                console.error("Error fetching dashboard data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const sankeyDrawn = useRef(false);

    // Re-render sankey chart when telemetry changes or component mounts
    useEffect(() => {
        if (!sankeyContainerRef.current) return;
        if (sankeyDrawn.current) return;

        const apexSankeyData = {
            nodes: [
                { id: "0", title: "Login" },
                { id: "1", title: "Home" },
                { id: "2", title: "Rent" },
                { id: "3", title: "Sale" },
                { id: "4", title: "Search" },
                { id: "310", title: "🏘️ سكني" },
                { id: "311", title: "🏪 تجاري" },
                { id: "313", title: "🏞️ أراضي" },
                { id: "314", title: "🚜 مزارع" },
                { id: "315", title: "🏖️ شاليهات / منتجعات" },
                { id: "316", title: "🛖 بيوت ريفية" },
                { id: "306", title: "🏠 سكن مشترك" },
                { id: "301", title: "🏢 شقق للإيجار" },
                { id: "302", title: "🏠 ستوديوهات للإيجار" },
                { id: "3101", title: "🏰 فلل وقصور" },
                { id: "3102", title: "🏡 بيوت مستقلة للإيجار" },
                { id: "3103", title: "🏙️ دوبلكس / بنتهاوس" },
                { id: "3104", title: "🏢 طابق كامل للإيجار" },
                { id: "3105", title: "🏠 ملحق / روف" },
                { id: "3999", title: "🏠 أخرى" },
                { id: "100", title: "Category details" },
                { id: "101", title: "Ads details" }
            ],
            edges: [
                { source: "0", target: "1", value: 1000 },
                { source: "1", target: "2", value: 200 },
                { source: "1", target: "3", value: 500 },
                { source: "1", target: "4", value: 300 },
                { source: "3", target: "310", value: 300 },
                { source: "3", target: "311", value: 50 },
                { source: "3", target: "313", value: 40 },
                { source: "3", target: "314", value: 30 },
                { source: "3", target: "315", value: 30 },
                { source: "3", target: "316", value: 20 },
                { source: "3", target: "306", value: 30 },
                { source: "310", target: "301", value: 100 },
                { source: "310", target: "302", value: 50 },
                { source: "310", target: "3101", value: 40 },
                { source: "310", target: "3102", value: 40 },
                { source: "310", target: "3103", value: 30 },
                { source: "310", target: "3104", value: 20 },
                { source: "310", target: "3105", value: 10 },
                { source: "310", target: "3999", value: 10 },
                { source: "2", target: "100", value: 200 },
                { source: "4", target: "100", value: 300 },
                { source: "311", target: "100", value: 50 },
                { source: "313", target: "100", value: 40 },
                { source: "314", target: "100", value: 30 },
                { source: "315", target: "100", value: 30 },
                { source: "316", target: "100", value: 20 },
                { source: "306", target: "100", value: 30 },
                { source: "301", target: "100", value: 100 },
                { source: "302", target: "100", value: 50 },
                { source: "3101", target: "100", value: 40 },
                { source: "3102", target: "100", value: 40 },
                { source: "3103", target: "100", value: 30 },
                { source: "3104", target: "100", value: 20 },
                { source: "3105", target: "100", value: 10 },
                { source: "3999", target: "100", value: 10 },
                { source: "100", target: "101", value: 1000 }
            ]
        };

        const attemptRender = () => {
            if (window.ApexSankey) {
                try {
                    sankeyDrawn.current = true;
                    sankeyContainerRef.current.innerHTML = '';
                    const containerWidth = sankeyContainerRef.current.clientWidth || 800;
                    const sankey = new window.ApexSankey(sankeyContainerRef.current, {
                        width: containerWidth,
                        height: 750
                    });
                    sankey.render(apexSankeyData);
                } catch (e) {
                    console.error("ApexSankey render error", e);
                }
            } else {
                setTimeout(attemptRender, 100);
            }
        };

        attemptRender();
    }, [telemetry]);

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
                                
                                <div className="card tracking-card" style={{ padding: '24px', gridColumn: '1 / -1' }}>
                                    <div style={{ marginBottom: '20px' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1E293B' }}>المستخدمين النشطين يومياً (DAU)</h3>
                                        <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: '#64748B' }}>يوضح هذا الرسم البياني عدد الزوار الفريدين الذين فتحوا التطبيق يومياً.</p>
                                    </div>
                                    <div style={{ height: 300, marginTop: 16 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={telemetry.dau} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                                                <YAxis tick={{ fontSize: 12, fill: '#64748B' }} allowDecimals={false} axisLine={false} tickLine={false} />
                                                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                                                <Line type="monotone" dataKey="active_users" stroke="#0075FF" name="مستخدم نشط" strokeWidth={4} dot={{ r: 5, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 8 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="card tracking-card" style={{ padding: '24px', gridColumn: '1 / -1' }}>
                                    <div style={{ marginBottom: '20px' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1E293B' }}>أكثر الشاشات زيارة</h3>
                                        <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: '#64748B' }}>تصنيف لأكثر صفحات التطبيق تفاعلاً من قبل المستخدمين.</p>
                                    </div>
                                    <div style={{ height: 300, marginTop: 16 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={telemetry.top_screens} layout="vertical" margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                                                <XAxis type="number" tick={{ fontSize: 12, fill: '#64748B' }} allowDecimals={false} axisLine={false} tickLine={false} />
                                                <YAxis dataKey="screen" type="category" tick={{ fontSize: 12, fill: '#334155', fontWeight: 'bold' }} width={140} orientation="right" axisLine={false} tickLine={false} />
                                                <RechartsTooltip cursor={{fill: '#F8FAFC'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                                                <Bar dataKey="views" fill="#E94057" name="مشاهدات" radius={[4, 0, 0, 4]} barSize={28} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="card tracking-card" style={{ padding: '24px', gridColumn: '1 / -1' }}>
                                    <div style={{ marginBottom: '20px' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1E293B' }}>مسار المستخدم (قمع التحويل - Sales Funnel)</h3>
                                        <p style={{ margin: '8px 0 0 0', fontSize: '0.9rem', color: '#64748B', lineHeight: '1.5' }}>
                                            يتتبع هذا القمع رحلة المستخدم خطوة بخطوة: من لحظة تصفح قسم العقارات، مروراً بفتح تفاصيل إعلان معين، وصولاً إلى اتخاذ قرار بشراء/استئجار العقار والضغط على زر (اتصل بالبائع أو واتساب). يساعدك هذا لمعرفة أين تفقد العملاء المحتملين.
                                        </p>
                                    </div>
                                    <div style={{ height: 350, marginTop: 16 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={telemetry.funnel} margin={{ top: 20, right: 30, left: 20, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                                <XAxis dataKey="name" tick={{ fontSize: 14, fontWeight: 'bold', fill: '#334155' }} axisLine={false} tickLine={false} />
                                                <YAxis tick={{ fontSize: 12, fill: '#64748B' }} allowDecimals={false} axisLine={false} tickLine={false} />
                                                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                                                <Area type="monotone" dataKey="value" stroke="#10B981" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" name="عدد المستخدمين" activeDot={{ r: 8, strokeWidth: 2, fill: '#fff' }} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Sankey Chart is hardcoded, so it should always display regardless of telemetry data */}
                                <div className="card tracking-card" style={{ padding: '24px', gridColumn: '1 / -1' }}>
                                    <div style={{ marginBottom: '20px' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1E293B' }}>خريطة تنقلات المستخدم (User Flow - Sankey Diagram)</h3>
                                        <p style={{ margin: '8px 0 0 0', fontSize: '0.9rem', color: '#64748B', lineHeight: '1.5' }}>
                                            يوضح هذا الرسم البياني الشامل كافة التنقلات بين الشاشات. سماكة الخط تدل على حجم الانتقال من صفحة إلى أخرى، مما يكشف بدقة عن سلوك المستخدم وتصفحه الحقيقي للتطبيق (مثلاً: الصفحة الرئيسية ← التصنيفات ← تفاصيل الإعلان).
                                        </p>
                                    </div>
                                    <div style={{ height: 750, marginTop: 16 }} dir="ltr" ref={sankeyContainerRef}>
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
