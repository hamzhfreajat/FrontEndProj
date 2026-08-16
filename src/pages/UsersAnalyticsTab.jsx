import React, { useState } from 'react';
import ReactApexChart from 'react-apexcharts';

// UsersAnalyticsTab removed mock data
const UsersAnalyticsTab = ({ data }) => {
    if (!data) {
        return <div style={{ padding: '40px', textAlign: 'center' }}>جاري تحميل البيانات الحقيقية...</div>;
    }

    const {
        total_users = 0,
        dau = 0,
        mau = 0,
        stickiness = 0,
        growth_rate = "0%",
        ttv = "0",
        total_ads_posted = 0,
        charts = {}
    } = data;

    const {
        active_users = { categories: [], mau: [], dau: [] },
        funnel = [100, 0, 0, 0],
        geo = { labels: [], data: [] }
    } = charts;

    // 1. DAU/MAU Growth Chart
    const activeUsersChartOptions = {
        chart: { type: 'area', toolbar: { show: false }, fontFamily: 'inherit' },
        colors: ['#3B82F6', '#10B981'],
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: 3 },
        xaxis: { categories: active_users.categories },
        yaxis: { labels: { formatter: (val) => val.toLocaleString() } },
        tooltip: { theme: 'light' },
        fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 100] } }
    };
    const activeUsersSeries = [
        { name: 'المستخدمين النشطين شهرياً (MAU)', data: active_users.mau },
        { name: 'المستخدمين النشطين يومياً (DAU - Avg)', data: active_users.dau }
    ];

    // 3. Onboarding Funnel (Bar Chart)
    const funnelOptions = {
        chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'inherit' },
        plotOptions: { bar: { borderRadius: 4, horizontal: true, dataLabels: { position: 'center' } } },
        colors: ['#8B5CF6'],
        dataLabels: { enabled: true, textAnchor: 'middle', style: { colors: ['#fff'] }, formatter: (val) => val + '%' },
        xaxis: { categories: ['إجمالي المسجلين', 'قام بتسجيل الدخول (نشط)', 'قام بالبحث', 'قام بإضافة إعلان'] },
        title: { text: 'معدل تفاعل المستخدمين (Engagement Funnel)', align: 'right', style: { fontFamily: 'inherit' } }
    };
    const funnelSeries = [{ name: 'نسبة التفاعل', data: funnel }];

    // 4. Geographic Distribution (Donut / Bar)
    const geoOptions = {
        chart: { type: 'donut', fontFamily: 'inherit' },
        labels: geo.labels,
        colors: ['#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#64748B'],
        plotOptions: { pie: { donut: { size: '70%' } } },
        title: { text: 'التوزيع الجغرافي للمستخدمين (مستنتج من الهاتف)', align: 'right', style: { fontFamily: 'inherit' } },
        legend: { position: 'bottom' }
    };
    const geoSeries = geo.data;

    return (
        <div style={{ width: '100%', direction: 'rtl', fontFamily: 'inherit', paddingTop: '20px' }}>
            
            {/* KPI Metric Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                <MetricCard title="إجمالي المستخدمين (Total)" value={total_users.toLocaleString()} subtext={`${growth_rate} نمو في آخر 30 يوم`} color="#3B82F6" />
                <MetricCard title="نشطين يومياً (DAU)" value={dau.toLocaleString()} subtext="من إجمالي النشطين شهرياً" color="#10B981" />
                <MetricCard title="تفاعل المستخدم (Stickiness)" value={`${stickiness}%`} subtext="نسبة DAU / MAU" color="#F59E0B" />
                <MetricCard title="المعلنين النشطين" value={total_ads_posted.toLocaleString()} subtext="إجمالي الحسابات التي أضافت إعلانات" color="#EF4444" isGood={true} />
                <MetricCard title="وقت إدراك القيمة (TTV)" value={ttv} subtext="متوسط الوقت لإضافة أول إعلان" color="#8B5CF6" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '24px', marginBottom: '24px' }}>
                {/* Active Users Growth */}
                <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#1E293B' }}>نمو المستخدمين النشطين (التاريخي)</h3>
                    <ReactApexChart options={activeUsersChartOptions} series={activeUsersSeries} type="area" height={350} />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '24px' }}>
                {/* Onboarding Funnel */}
                <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <ReactApexChart options={funnelOptions} series={funnelSeries} type="bar" height={300} />
                </div>

                {/* Geographic & Sentiment */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', flex: 1 }}>
                        <ReactApexChart options={geoOptions} series={geoSeries} type="donut" height={300} />
                    </div>
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

export default React.memo(UsersAnalyticsTab);
