import React, { useState } from 'react';
import ReactApexChart from 'react-apexcharts';

// Mock Data for Premium Analytics
const mockData = {
    totalUsers: 45281,
    growthRate: "+12.4%",
    dau: 8240,
    wau: 21105,
    mau: 38450,
    stickiness: "21.4%", // DAU / MAU
    churnRate: "2.8%",
    ttv: "3.2 أيام", // Time to Value
    onboardingComplete: "68%",
    nps: 64, // Net Promoter Score
    csat: "4.6/5"
};

const UsersAnalyticsTab = () => {
    // 1. DAU/MAU Growth Chart
    const activeUsersChartOptions = {
        chart: { type: 'area', toolbar: { show: false }, fontFamily: 'inherit' },
        colors: ['#3B82F6', '#10B981'],
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: 3 },
        xaxis: { categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'] },
        yaxis: { labels: { formatter: (val) => val.toLocaleString() } },
        tooltip: { theme: 'light' },
        fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 100] } }
    };
    const activeUsersSeries = [
        { name: 'المستخدمين النشطين شهرياً (MAU)', data: [25000, 28000, 31000, 33500, 35000, 37200, 38450] },
        { name: 'المستخدمين النشطين يومياً (DAU)', data: [4500, 5200, 6100, 6500, 7100, 7800, 8240] }
    ];

    // 2. Cohort Retention Heatmap
    const cohortChartOptions = {
        chart: { type: 'heatmap', toolbar: { show: false }, fontFamily: 'inherit' },
        dataLabels: { enabled: true, style: { colors: ['#fff'] } },
        colors: ['#0EA5E9'],
        xaxis: { type: 'category', title: { text: 'الأيام منذ التسجيل (D1 - D30)', style: { fontFamily: 'inherit' } } },
        title: { text: 'الاحتفاظ بالمستخدمين (Cohort Retention)', align: 'right', style: { fontFamily: 'inherit' } },
        plotOptions: {
            heatmap: {
                shadeIntensity: 0.5,
                radius: 4,
                useFillColorAsStroke: false,
                colorScale: {
                    ranges: [
                        { from: 0, to: 20, color: '#E0F2FE', name: 'منخفض' },
                        { from: 21, to: 50, color: '#38BDF8', name: 'متوسط' },
                        { from: 51, to: 100, color: '#0284C7', name: 'عالي' }
                    ]
                }
            }
        }
    };
    const cohortSeries = [
        { name: 'أسبوع 1 (هذا الشهر)', data: [{ x: 'D1', y: 85 }, { x: 'D3', y: 65 }, { x: 'D7', y: 45 }, { x: 'D14', y: 35 }, { x: 'D30', y: 28 }] },
        { name: 'أسبوع 2', data: [{ x: 'D1', y: 82 }, { x: 'D3', y: 60 }, { x: 'D7', y: 42 }, { x: 'D14', y: 32 }, { x: 'D30', y: 25 }] },
        { name: 'أسبوع 3', data: [{ x: 'D1', y: 88 }, { x: 'D3', y: 70 }, { x: 'D7', y: 50 }, { x: 'D14', y: 40 }, { x: 'D30', y: 30 }] },
        { name: 'أسبوع 4', data: [{ x: 'D1', y: 75 }, { x: 'D3', y: 55 }, { x: 'D7', y: 38 }, { x: 'D14', y: 28 }, { x: 'D30', y: 20 }] }
    ];

    // 3. Onboarding Funnel (Bar Chart)
    const funnelOptions = {
        chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'inherit' },
        plotOptions: { bar: { borderRadius: 4, horizontal: true, dataLabels: { position: 'center' } } },
        colors: ['#8B5CF6'],
        dataLabels: { enabled: true, textAnchor: 'middle', style: { colors: ['#fff'] }, formatter: (val) => val + '%' },
        xaxis: { categories: ['تسجيل الحساب', 'تأكيد الهاتف', 'تصفح الإعلانات', 'إضافة أول إعلان (TTV)'] },
        title: { text: 'معدل إكمال التسجيل (Onboarding Funnel)', align: 'right', style: { fontFamily: 'inherit' } }
    };
    const funnelSeries = [{ name: 'نسبة الإكمال', data: [100, 85, 72, 35] }];

    // 4. Geographic Distribution (Donut / Bar)
    const geoOptions = {
        chart: { type: 'donut', fontFamily: 'inherit' },
        labels: ['الأردن', 'السعودية', 'الإمارات', 'مصر', 'أخرى'],
        colors: ['#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#64748B'],
        plotOptions: { pie: { donut: { size: '70%' } } },
        title: { text: 'التوزيع الجغرافي للمستخدمين', align: 'right', style: { fontFamily: 'inherit' } },
        legend: { position: 'bottom' }
    };
    const geoSeries = [65, 15, 10, 5, 5];

    return (
        <div style={{ width: '100%', direction: 'rtl', fontFamily: 'inherit', paddingTop: '20px' }}>
            
            {/* KPI Metric Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                <MetricCard title="إجمالي المستخدمين (Total)" value={mockData.totalUsers.toLocaleString()} subtext={`${mockData.growthRate} هذا الشهر`} color="#3B82F6" />
                <MetricCard title="نشطين يومياً (DAU)" value={mockData.dau.toLocaleString()} subtext="من إجمالي النشطين شهرياً" color="#10B981" />
                <MetricCard title="تفاعل المستخدم (Stickiness)" value={mockData.stickiness} subtext="نسبة DAU / MAU" color="#F59E0B" />
                <MetricCard title="معدل التسرب (Churn Rate)" value={mockData.churnRate} subtext="مقارنة بـ 3.5% الشهر الماضي" color="#EF4444" isGood={true} />
                <MetricCard title="وقت إدراك القيمة (TTV)" value={mockData.ttv} subtext="متوسط الوقت لإضافة أول إعلان" color="#8B5CF6" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '24px', marginBottom: '24px' }}>
                {/* Active Users Growth */}
                <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#1E293B' }}>نمو المستخدمين النشطين</h3>
                    <ReactApexChart options={activeUsersChartOptions} series={activeUsersSeries} type="area" height={350} />
                </div>

                {/* Cohort Retention */}
                <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <ReactApexChart options={cohortChartOptions} series={cohortSeries} type="heatmap" height={350} />
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
                
                {/* Sentiment / NPS */}
                <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', color: '#1E293B', textAlign: 'center' }}>مؤشرات رضا المستخدمين</h3>
                    <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#10B981' }}>{mockData.nps}</div>
                            <div style={{ color: '#64748B', fontSize: '14px', marginTop: '8px' }}>مؤشر صافي الترويج (NPS)</div>
                        </div>
                        <div style={{ width: '1px', height: '80px', backgroundColor: '#E2E8F0' }}></div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#3B82F6' }}>{mockData.csat}</div>
                            <div style={{ color: '#64748B', fontSize: '14px', marginTop: '8px' }}>رضا العملاء (CSAT)</div>
                        </div>
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

export default UsersAnalyticsTab;
