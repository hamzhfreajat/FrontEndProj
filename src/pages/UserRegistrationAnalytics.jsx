import React from 'react';
import ReactApexChart from 'react-apexcharts';
import { Activity, Clock, FileText, RefreshCw, TrendingUp, Users } from 'lucide-react';
import { api } from '../lib/api';
import { Button, Card, EmptyState, ErrorState, MeterList, PageHeader, SkeletonRows, Stat, formatNumber, useLoad } from '../ui';

const FUNNEL_STEPS = ['إجمالي المسجّلين', 'سجّل الدخول', 'أجرى بحثاً', 'أضاف إعلاناً'];
const font = { fontFamily: 'inherit' };

export default function UserRegistrationAnalytics() {
  const { data, loading, error, reload } = useLoad(() => api.get('/telemetry/advanced-analytics').then((response) => response.data.users || null));

  const header = (
    <PageHeader title="تسجيل المستخدمين" subtitle="نمو قاعدة المستخدمين، نشاطهم اليومي والشهري، وكم منهم يصل إلى نشر إعلان.">
      <Button variant="secondary" icon={RefreshCw} loading={loading} onClick={reload}>
        تحديث
      </Button>
    </PageHeader>
  );

  if (error) {
    return (
      <>
        {header}
        <div className="card">
          <ErrorState message={error} onRetry={reload} />
        </div>
      </>
    );
  }
  if (loading && !data) {
    return (
      <>
        {header}
        <div className="card">
          <SkeletonRows rows={8} />
        </div>
      </>
    );
  }
  if (!data) {
    return (
      <>
        {header}
        <div className="card">
          <EmptyState icon={Users} title="لا توجد بيانات مستخدمين بعد" />
        </div>
      </>
    );
  }

  const charts = data.charts || {};
  const active = charts.active_users || { categories: [], mau: [], dau: [] };
  const funnel = charts.funnel || [];
  const geo = charts.geo || { labels: [], data: [] };

  const activeOptions = {
    chart: { type: 'area', toolbar: { show: false }, ...font },
    colors: ['#1557f5', '#079455'],
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2.5 },
    xaxis: { categories: active.categories, labels: { style: font } },
    yaxis: { labels: { formatter: (value) => formatNumber(Math.round(value)), style: font } },
    grid: { borderColor: '#e6e9ef', strokeDashArray: 4 },
    legend: { position: 'top', ...font },
    fill: { type: 'gradient', gradient: { opacityFrom: 0.35, opacityTo: 0.03 } },
  };

  return (
    <div className="stack">
      {header}

      <div className="grid grid-4 keep-2">
        <Stat icon={Users} label="إجمالي المستخدمين" value={formatNumber(data.total_users || 0)} hint={`${data.growth_rate || '0%'} نمو في آخر 30 يوماً`} />
        <Stat icon={Activity} tone="green" label="نشطون يومياً" value={formatNumber(data.dau || 0)} hint={`من ${formatNumber(data.mau || 0)} نشط شهرياً`} />
        <Stat icon={TrendingUp} tone="amber" label="نسبة العودة اليومية" value={`${data.stickiness || 0}%`} hint="النشطون يومياً من النشطين شهرياً" />
        <Stat icon={FileText} tone="violet" label="مستخدمون نشروا إعلاناً" value={formatNumber(data.total_ads_posted || 0)} hint="حسابات أضافت إعلاناً واحداً على الأقل" />
      </div>

      <Card title="المستخدمون النشطون" subtitle="شهرياً ويومياً عبر الوقت">
        {active.categories.length === 0 ? <EmptyState title="لا توجد بيانات كافية للرسم" /> : <ReactApexChart options={activeOptions} series={[{ name: 'نشطون شهرياً', data: active.mau }, { name: 'نشطون يومياً (متوسط)', data: active.dau }]} type="area" height={320} />}
      </Card>

      <div className="grid grid-2">
        <Card title="من التسجيل إلى النشر" subtitle="نسبة المستخدمين الذين يصلون إلى كل خطوة">
          <MeterList items={FUNNEL_STEPS.map((label, index) => ({ label, value: Number(funnel[index]) || 0 }))} format={(value) => `${value}%`} />
        </Card>

        <Card title="التوزيع الجغرافي" subtitle="مستنتج من أرقام الهواتف">
          <MeterList items={geo.labels.map((label, index) => ({ label, value: Number(geo.data[index]) || 0 }))} />
        </Card>
      </div>

      <Card>
        <div className="row">
          <Clock size={18} className="muted" />
          <span>
            متوسط الوقت من التسجيل حتى نشر أول إعلان: <strong className="strong">{data.ttv || '—'}</strong>
          </span>
        </div>
      </Card>
    </div>
  );
}
