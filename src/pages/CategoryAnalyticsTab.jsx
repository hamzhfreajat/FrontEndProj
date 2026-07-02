import React from 'react';
import ReactApexChart from 'react-apexcharts';

const CategoryAnalyticsTab = ({ data }) => {
    // If no real data is provided yet, fallback to safe defaults or loading
    if (!data) {
        return <div style={{ padding: '40px', textAlign: 'center' }}>جاري تحميل بيانات الأقسام والذكاء الاصطناعي...</div>;
    }

    const {
        total_categories = 0,
        active_categories = 0,
        total_classifications = 0,
        failed_rate = 0,
        classification_volume = [],
        charts = {}
    } = data;

    const {
        trend = { categories: [], data: [] }
    } = charts;

    // 1. Classification Volume by Category (Bar Chart)
    const volumeChartOptions = {
        chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'inherit' },
        plotOptions: { bar: { borderRadius: 4, horizontal: false, columnWidth: '50%' } },
        dataLabels: { enabled: false },
        colors: ['#3B82F6'],
        xaxis: { categories: classification_volume.map(v => v.category), labels: { style: { fontSize: '12px', fontFamily: 'inherit' } } },
        yaxis: { labels: { style: { fontFamily: 'inherit' } } },
        title: { text: 'حجم التصنيفات حسب القسم (AI Classification Volume)', align: 'right', style: { fontFamily: 'inherit' } },
        grid: { show: true, strokeDashArray: 4, borderColor: '#e2e8f0' }
    };
    const volumeSeries = [{ name: 'عدد التصنيفات', data: classification_volume.map(v => v.volume) }];

    // 2. Category Usage Distribution (Donut Chart)
    const donutOptions = {
        chart: { type: 'donut', fontFamily: 'inherit' },
        labels: classification_volume.map(v => v.category),
        plotOptions: { pie: { donut: { size: '65%' } } },
        title: { text: 'توزيع استخدام الأقسام (Usage Distribution)', align: 'right', style: { fontFamily: 'inherit' } },
        legend: { position: 'bottom', fontFamily: 'inherit' }
    };
    const donutSeries = classification_volume.map(v => v.volume);

    // 3. Classification Trend Line Chart (Real Data)
    const trendOptions = {
        chart: { type: 'area', toolbar: { show: false }, fontFamily: 'inherit' },
        stroke: { curve: 'smooth', width: 3 },
        colors: ['#8B5CF6'],
        xaxis: { categories: trend.categories },
        title: { text: 'حجم التصنيفات اليومي (آخر 7 أيام)', align: 'right', style: { fontFamily: 'inherit' } },
        grid: { show: true, strokeDashArray: 4, borderColor: '#e2e8f0' },
        fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 100] } }
    };
    const trendSeries = [{ name: 'طلبات الذكاء الاصطناعي', data: trend.data }];

    return (
        <div style={{ width: '100%', direction: 'rtl', fontFamily: 'inherit', paddingTop: '20px' }}>
            
            {/* KPI Metric Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                <MetricCard title="إجمالي الأقسام" value={total_categories.toLocaleString()} subtext="جميع الأقسام المسجلة" color="#3B82F6" />
                <MetricCard title="الأقسام النشطة" value={active_categories.toLocaleString()} subtext="أقسام تحتوي إعلانات (آخر 30 يوم)" color="#10B981" />
                <MetricCard title="إجمالي تصنيفات الذكاء الاصطناعي" value={total_classifications.toLocaleString()} subtext="عمليات تمت معالجتها" color="#8B5CF6" />
                <MetricCard title="معدل فشل التصنيف" value={`${failed_rate}%`} subtext="الطلبات غير الناجحة" color="#EF4444" isGood={failed_rate < 5} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '24px', marginBottom: '24px' }}>
                {/* Volume Bar Chart */}
                <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <ReactApexChart options={volumeChartOptions} series={volumeSeries} type="bar" height={350} />
                </div>

                {/* Donut Chart */}
                <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <ReactApexChart options={donutOptions} series={donutSeries} type="donut" height={350} />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '24px', marginBottom: '24px' }}>
                {/* Trend Line Chart */}
                <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <ReactApexChart options={trendOptions} series={trendSeries} type="area" height={300} />
                </div>
            </div>

        </div>
    );
};

// Reusable Metric Card Component
const MetricCard = ({ title, value, subtext, color, isGood = null }) => {
    return (
        <div style={{ 
            backgroundColor: '#fff', 
            padding: '24px', 
            borderRadius: '16px', 
            border: '1px solid #E2E8F0', 
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            borderTop: `4px solid ${color}`
        }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#64748B', fontSize: '14px', fontWeight: '500' }}>{title}</h4>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#0F172A', marginBottom: '8px' }}>{value}</div>
            <div style={{ fontSize: '13px', color: isGood === true ? '#10B981' : isGood === false ? '#EF4444' : '#94A3B8' }}>
                {subtext}
            </div>
        </div>
    );
};

export default CategoryAnalyticsTab;
