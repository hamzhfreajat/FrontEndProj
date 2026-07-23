import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ReactApexChart from 'react-apexcharts';

const AdsRegionCategoryAnalytics = () => {
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const API_URL = 'https://api.sooq-com.com/api';
                const { data } = await axios.get(`${API_URL}/tracking/regional-category-stats`);
                setStats(data || []);
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

    // Chart Configuration
    const chartOptions = {
        chart: {
            type: 'bar',
            height: 500,
            stacked: false, // Grouped side by side
            toolbar: { show: false },
            fontFamily: 'inherit'
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '55%',
                borderRadius: 4,
                dataLabels: {
                    position: 'top', 
                }
            },
        },
        dataLabels: {
            enabled: true,
            offsetY: -20,
            style: {
                fontSize: '12px',
                colors: ["#304758"]
            },
            formatter: (val) => val > 0 ? val : ""
        },
        stroke: {
            show: true,
            width: 2,
            colors: ['transparent']
        },
        xaxis: {
            categories: stats.map(s => s.region),
            labels: {
                style: { fontSize: '13px', fontFamily: 'inherit' }
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
        colors: ['#008FFB', '#00E396', '#FEB019'],
        legend: {
            position: 'top',
            horizontalAlign: 'left',
            offsetX: 40
        }
    };

    const series = [
        {
            name: 'للإيجار',
            data: stats.map(s => s['للإيجار'])
        },
        {
            name: 'للبيع',
            data: stats.map(s => s['للبيع'])
        },
        {
            name: 'الأراضي',
            data: stats.map(s => s['الأراضي'])
        }
    ];

    return (
        <div style={{ padding: '24px', direction: 'rtl' }}>
            <h2 style={{ marginBottom: '24px', color: '#1E293B', fontWeight: 'bold' }}>توزيع الإعلانات جغرافياً حسب القسم</h2>
            
            <div style={{ 
                backgroundColor: '#fff', 
                padding: '24px', 
                borderRadius: '16px', 
                border: '1px solid #E2E8F0', 
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' 
            }}>
                <ReactApexChart options={chartOptions} series={series} type="bar" height={500} />
            </div>
        </div>
    );
};

export default AdsRegionCategoryAnalytics;
