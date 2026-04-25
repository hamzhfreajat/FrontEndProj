import React, { useEffect, useState } from 'react';
import { Users, FileText, View, Settings, Activity, Target } from 'lucide-react';
import axios from 'axios';

const StatCard = ({ title, value, icon: Icon, colorClass }) => (
    <div className="card stat-card">
        <div className={`icon-wrapper ${colorClass}`}>
            <Icon size={24} />
        </div>
        <div className="stat-info">
            <h3 className="stat-value">{value}</h3>
            <p className="stat-title">{title}</p>
        </div>

        <style jsx>{`
      .stat-card {
        display: flex;
        align-items: center;
        gap: 20px;
        padding: 24px;
      }
      .icon-wrapper {
        width: 60px;
        height: 60px;
        border-radius: var(--radius-round);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .icon-blue { background: rgba(0, 117, 255, 0.1); color: var(--primary-color); }
      .icon-green { background: rgba(124, 179, 66, 0.1); color: var(--success-color); }
      .icon-orange { background: rgba(245, 135, 33, 0.1); color: var(--accent-color); }
      .icon-red { background: rgba(229, 57, 53, 0.1); color: var(--danger-color); }
      
      .stat-info {
        display: flex;
        flex-direction: column;
      }
      .stat-value {
        font-size: 1.8rem;
        font-weight: 900;
        margin-bottom: 4px;
        color: var(--text-dark);
      }
      .stat-title {
        margin: 0;
        font-size: 0.95rem;
        font-weight: 600;
      }
    `}</style>
    </div>
);

const Dashboard = () => {
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInsights = async () => {
            try {
                // Adjust base URL if needed based on your environment
                const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
                const res = await axios.get(`${API_URL}/tracking/insights`);
                setInsights(res.data);
            } catch (error) {
                console.error("Failed to fetch tracking insights:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchInsights();
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

            <div className="stats-grid">
                <StatCard title="إجمالي حركات التتبع" value={insights?.total_logs || 0} icon={Activity} colorClass="icon-blue" />
                <StatCard title="الأقسام المتفاعلة" value={insights?.top_categories?.length || 0} icon={Target} colorClass="icon-red" />
                <StatCard title="الإعلانات النشطة" value="3,890" icon={FileText} colorClass="icon-green" />
                <StatCard title="المشاهدات اليوم" value="12.5k" icon={View} colorClass="icon-orange" />
            </div>

            <div className="dashboard-content">
                <div className="card tracking-card">
                    <h3>النشاط المباشر (Feed)</h3>
                    <div className="feed-list">
                        {insights?.recent_activity?.length > 0 ? (
                            insights.recent_activity.map((act) => (
                                <div key={act.id} className="feed-item">
                                    <div className="feed-time">{new Date(act.time).toLocaleTimeString('ar-EG')}</div>
                                    <div className="feed-details">
                                        <strong>{act.username}</strong> قام بـ <span className="action-tag">{act.action}</span> في <span>{act.category}</span>
                                        {act.filters && (
                                           <div className="feed-filters">
                                               {JSON.stringify(act.filters)}
                                           </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-state">لا يوجد نشاط مسجل بعد</div>
                        )}
                    </div>
                </div>

                <div className="tracking-side">
                    <div className="card tracking-card mb-4">
                        <h3>الخريطة الحرارية للأقسام</h3>
                        <div className="heatmap-list">
                            {insights?.top_categories?.map((cat, i) => (
                                <div key={cat.category_id} className="heatmap-item">
                                    <span className="cat-name">{cat.name}</span>
                                    <div className="bar-bg">
                                        <div className="bar-fill" style={{ width: `${Math.max(10, (cat.count / (insights.top_categories[0]?.count || 1)) * 100)}%` }} />
                                    </div>
                                    <span className="cat-count">{cat.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="card tracking-card">
                        <h3>مؤشرات الفلاتر</h3>
                        <div className="filter-tags">
                            {insights?.filter_analytics?.length > 0 ? (
                                insights.filter_analytics.map((f, i) => (
                                    <div key={i} className="filter-pill">
                                        {f.tags?.join(', ') || 'فلتر عام'} {f.min_price ? `(${f.min_price} - ${f.max_price})` : ''}
                                    </div>
                                ))
                            ) : (
                                <div className="empty-state" style={{ minHeight: '100px' }}>لا توجد فلاتر مستخدمة</div>
                            )}
                        </div>
                    </div>

                    <div className="card tracking-card mt-4" style={{ marginTop: '24px' }}>
                        <h3>توزيع الإعلانات المباشر</h3>
                        <div className="location-stats-list">
                            {insights?.location_stats?.length > 0 ? (
                                insights.location_stats.map((loc, i) => (
                                    <div key={i} className="location-item">
                                        <div className="loc-city-header">
                                            <span className="loc-city-name">{loc.city}</span>
                                            <span className="loc-city-count badge">{loc.total_ads} إعلان</span>
                                        </div>
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
                                <div className="empty-state" style={{ minHeight: '100px' }}>جاري تحميل المواقع...</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
        .page-header {
          margin-bottom: 32px;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 24px;
          margin-bottom: 32px;
        }

        .dashboard-content {
          display: grid;
          grid-template-columns: 2fr 1.2fr;
          gap: 24px;
        }

        .tracking-card {
          padding: 24px;
          background: white;
          border-radius: 16px;
          border: 1px solid var(--border-color);
        }
        
        .mb-4 { margin-bottom: 24px; }

        .feed-list {
          margin-top: 16px;
          max-height: 500px;
          overflow-y: auto;
        }
        .feed-item {
          display: flex;
          gap: 16px;
          padding: 12px 0;
          border-bottom: 1px solid #eee;
        }
        .feed-time {
          font-size: 0.85rem;
          color: #888;
          min-width: 80px;
        }
        .feed-details {
          font-size: 0.95rem;
        }
        .action-tag {
          background: #f0f4f8;
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: bold;
          color: var(--primary-color);
          font-size: 0.8rem;
        }
        .feed-filters {
          font-size: 0.8rem;
          color: #666;
          margin-top: 4px;
          padding: 6px;
          background: #f9f9f9;
          border-radius: 4px;
        }

        .heatmap-list {
          margin-top: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .heatmap-item {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .cat-name {
          width: 80px;
          font-size: 0.85rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .bar-bg {
          flex: 1;
          height: 8px;
          background: #f0f0f0;
          border-radius: 4px;
          overflow: hidden;
        }
        .bar-fill {
          height: 100%;
          background: var(--primary-color);
          border-radius: 4px;
        }
        .cat-count {
          font-size: 0.85rem;
          font-weight: bold;
          width: 30px;
          text-align: left;
        }

        .filter-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 16px;
        }
        .filter-pill {
          background: rgba(0, 117, 255, 0.05);
          border: 1px solid rgba(0, 117, 255, 0.2);
          color: var(--primary-color);
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .location-stats-list {
          margin-top: 16px;
          max-height: 400px;
          overflow-y: auto;
          padding-right: 4px;
        }
        .location-item {
          background: #f9fbfc;
          border: 1px solid #eef2f6;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 12px;
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
      `}</style>
        </div>
    );
};

export default Dashboard;
