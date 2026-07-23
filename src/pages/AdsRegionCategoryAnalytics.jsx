import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ReactApexChart from 'react-apexcharts';

const AdsRegionCategoryAnalytics = () => {
    const [stats, setStats] = useState([]);
    const [seriesMeta, setSeriesMeta] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const API_URL = 'https://api.sooq-com.com/api';
                const { data } = await axios.get(`${API_URL}/tracking/regional-category-stats`);
                if (data.data && data.series_meta) {
                    setStats(data.data);
                    setSeriesMeta(data.series_meta);
                } else {
                    // Fallback if backend wasn't updated yet
                    setStats(data || []);
                }
            } catch (err) {
                console.error("Error fetching regional stats:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return <div style={{ padding: '40px', textAlign: 'center' }}>جاري التحميل...</div>;
    }

    if (stats.length === 0) {
        return <div style={{ padding: '40px', textAlign: 'center' }}>لا توجد بيانات...</div>;
    }

    // Chart Configuration for Grouped Stacked Column
    const chartOptions = {
        chart: {
            type: 'bar',
            height: 500,
            stacked: true, // Must be true for grouped stacked columns
            toolbar: { show: false },
            fontFamily: 'inherit'
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '60%',
                borderRadius: 2,
            },
        },
        dataLabels: {
            enabled: true,
            style: {
                fontSize: '11px',
                colors: ["#fff"]
            },
            formatter: (val) => val > 0 ? val : ""
        },
        stroke: {
            show: true,
            width: 1,
            colors: ['transparent']
        },
        xaxis: {
            categories: stats.map(s => s.region),
            labels: {
                style: { fontSize: '13px', fontFamily: 'inherit' },
                rotate: -45,
                hideOverlappingLabels: false
            }
        },
        yaxis: {
            title: {
                text: 'عدد الإعلانات',
                style: { fontFamily: 'inherit' }
            }
        },
        fill: {
            opacity: 1
        },
        tooltip: {
            y: {
                formatter: (val) => val + " إعلان"
            }
        },
        // We provide a distinct color palette for the stacked items
        theme: {
            palette: 'palette1'
        },
        legend: {
            position: 'top',
            horizontalAlign: 'left',
            offsetX: 40
        }
    };

    // If we have seriesMeta (new API), build the grouped series
    let series = [];
    if (seriesMeta.length > 0) {
        series = seriesMeta.map(meta => ({
            name: meta.name,
            group: meta.group, // Crucial for Grouped Stacked Bars
            data: stats.map(s => s[meta.name] || 0)
        }));
    } else {
        // Fallback for old API
        series = [
            { name: 'للإيجار', data: stats.map(s => s['للإيجار'] || 0) },
            { name: 'للبيع', data: stats.map(s => s['للبيع'] || 0) },
            { name: 'الأراضي', data: stats.map(s => s['الأراضي'] || 0) }
        ];
    }

    return (
        <div style={{ padding: '24px', direction: 'rtl' }}>
            <h2 style={{ marginBottom: '24px', color: '#1E293B', fontWeight: 'bold' }}>توزيع الإعلانات جغرافياً (الأقسام الفرعية)</h2>
            
            <div style={{ 
                backgroundColor: '#fff', 
                padding: '24px', 
                borderRadius: '16px', 
                border: '1px solid #E2E8F0', 
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                overflowX: 'auto'
            }} className="custom-scrollbar">
                <div style={{ minWidth: `${Math.max(1000, stats.length * 80)}px` }}>
                    <ReactApexChart options={chartOptions} series={series} type="bar" height={500} />
                </div>
            </div>
        </div>
    );
};

export default AdsRegionCategoryAnalytics;
