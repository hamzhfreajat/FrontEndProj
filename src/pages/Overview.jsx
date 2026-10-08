import React from 'react';
import { Link } from 'react-router-dom';
import {
  Bot, CheckCircle2, FileText, Flag, MapPin, RefreshCw, ScrollText, Star, TrendingUp, UserPlus, Users,
} from 'lucide-react';
import { api } from '../lib/api';
import {
  Alert, Badge, BarChart, Button, Card, EmptyState, ErrorState, MeterList, PageHeader, SkeletonRows, Stat, formatNumber, formatPrice, timeAgo, useLoad,
} from '../ui';

/** "+12% عن الأسبوع السابق", or nothing when there is no earlier week to compare with. */
function change(current, previous) {
  if (!previous) return { hint: 'لا توجد مقارنة سابقة' };
  const percent = Math.round(((current - previous) / previous) * 100);
  if (percent === 0) return { hint: 'مثل الأسبوع السابق' };
  return { hint: `${percent > 0 ? '+' : ''}${percent}% عن الأسبوع السابق`, hintTone: percent > 0 ? 'up' : 'down' };
}

const isOrganic = (source) => source === 'ORGANIC_USER';

/** What needs the admin's attention today, most urgent first. */
function attentionItems(data) {
  const items = [];
  if (data.attention.pending_reports > 0) {
    items.push({ tone: 'red', icon: Flag, text: `${formatNumber(data.attention.pending_reports)} بلاغ بانتظار المراجعة`, to: '/reports', action: 'مراجعة البلاغات' });
  }
  if (data.attention.new_seekers > 0) {
    items.push({ tone: undefined, icon: UserPlus, text: `${formatNumber(data.attention.new_seekers)} طلب عقار جديد على فيسبوك بانتظار تعليق`, to: '/seekers', action: 'عرض الطلبات' });
  }
  if (data.attention.low_reviews_week > 0) {
    items.push({ tone: 'amber', icon: Star, text: `${formatNumber(data.attention.low_reviews_week)} تقييم منخفض هذا الأسبوع`, to: '/reviews', action: 'عرض التقييمات' });
  }
  if (data.scraping.errors_today > 0) {
    items.push({ tone: 'amber', icon: ScrollText, text: `${formatNumber(data.scraping.errors_today)} خطأ في السحب خلال آخر 24 ساعة`, to: '/scraping-logs', action: 'سجل السحب' });
  }
  if (data.ads.unplaced > 0) {
    items.push({ tone: 'amber', icon: MapPin, text: `${formatNumber(data.ads.unplaced)} إعلان منشور بدون مدينة`, to: '/change-ads-location', action: 'تصحيح المواقع' });
  }
  return items;
}

export default function Overview() {
  const { data, loading, error, reload } = useLoad(() => api.get('/dashboard/overview').then((response) => response.data));

  const header = (
    <PageHeader title="نظرة عامة" subtitle="حالة المنصة الآن: الإعلانات، المستخدمون، وما يحتاج إلى متابعة.">
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

  if (!data) {
    return (
      <>
        {header}
        <div className="card">
          <SkeletonRows rows={8} columns={4} />
        </div>
      </>
    );
  }

  const attention = attentionItems(data);
  const organicShare = data.ads.live ? Math.round((data.ads.live_organic / data.ads.live) * 100) : 0;
  const trend = data.trend.map((day) => ({ label: day.date, short: day.date.slice(5), value: day.organic + day.scraped }));

  return (
    <div className="stack">
      {header}

      <div className="grid grid-4 keep-2">
        <Stat icon={FileText} label="الإعلانات المنشورة" value={formatNumber(data.ads.live)} hint={`من أصل ${formatNumber(data.ads.total)} إعلان`} />
        <Stat icon={TrendingUp} tone="green" label="إعلانات جديدة (7 أيام)" value={formatNumber(data.ads.week)} {...change(data.ads.week, data.ads.previous_week)} />
        <Stat icon={Users} tone="violet" label="المستخدمون" value={formatNumber(data.users.total)} hint={`${formatNumber(data.users.banned)} محظور`} />
        <Stat icon={UserPlus} tone="amber" label="مستخدمون جدد (7 أيام)" value={formatNumber(data.users.week)} {...change(data.users.week, data.users.previous_week)} />
      </div>

      <Card title="يحتاج إلى متابعة" flush>
        {attention.length === 0 ? (
          <EmptyState icon={CheckCircle2} title="لا شيء عاجل" description="لا توجد بلاغات معلّقة ولا أخطاء سحب حديثة." />
        ) : (
          <div className="card-body stack-sm">
            {attention.map((item) => (
              <Alert key={item.to} tone={item.tone} icon={item.icon}>
                <div className="row row-between">
                  <span className="strong" style={{ color: 'inherit' }}>
                    {item.text}
                  </span>
                  <Link to={item.to}>{item.action}</Link>
                </div>
              </Alert>
            ))}
          </div>
        )}
      </Card>

      <div className="grid grid-main">
        <Card title="الإعلانات الجديدة يومياً" subtitle="آخر 14 يوماً، من المستخدمين ومن السحب الآلي معاً">
          <BarChart points={trend} />
        </Card>

        <Card title="مصدر الإعلانات المنشورة">
          <div className="stack">
            <div>
              <div className="meter-head">
                <span>من المستخدمين</span>
                <span className="strong num">
                  {formatNumber(data.ads.live_organic)} ({organicShare}%)
                </span>
              </div>
              <div className="meter">
                <span style={{ width: `${organicShare}%`, background: 'var(--green-600)' }} />
              </div>
            </div>
            <div>
              <div className="meter-head">
                <span>من السحب الآلي</span>
                <span className="strong num">
                  {formatNumber(data.ads.live_scraped)} ({100 - organicShare}%)
                </span>
              </div>
              <div className="meter">
                <span style={{ width: `${100 - organicShare}%`, background: 'var(--amber-600)' }} />
              </div>
            </div>
            <dl className="kv">
              <dt>اليوم</dt>
              <dd className="num">{formatNumber(data.ads.today)} إعلان جديد</dd>
              <dt>مميّزة</dt>
              <dd className="num">{formatNumber(data.ads.featured)}</dd>
              <dt>بدون سعر</dt>
              <dd className="num">{formatNumber(data.ads.no_price)}</dd>
              <dt>مرفوضة</dt>
              <dd className="num">{formatNumber(data.ads.rejected)}</dd>
            </dl>
          </div>
        </Card>
      </div>

      <div className="grid grid-3">
        <Card title="أكثر المدن إعلانات" actions={<Link to="/geo-analytics">التفاصيل</Link>}>
          <MeterList items={data.cities.map((city) => ({ label: city.name, value: city.count }))} />
        </Card>

        <Card title="أكثر الأقسام إعلانات" actions={<Link to="/categories">الأقسام</Link>}>
          <MeterList items={data.categories.map((category) => ({ label: category.name, value: category.count }))} />
        </Card>

        <Card title="السحب الآلي" actions={<Link to="/scraping-logs">السجل</Link>}>
          <dl className="kv">
            <dt>آخر تشغيل</dt>
            <dd>{data.scraping.last_run ? timeAgo(data.scraping.last_run) : 'لم يعمل بعد'}</dd>
            <dt>آخر مجموعة</dt>
            <dd>{data.scraping.last_group || '—'}</dd>
            <dt>حُفظ خلال 24 ساعة</dt>
            <dd className="num">{formatNumber(data.scraping.saved_today)} إعلان</dd>
            <dt>أخطاء خلال 24 ساعة</dt>
            <dd className="num">
              {data.scraping.errors_today > 0 ? <Badge tone="red">{formatNumber(data.scraping.errors_today)}</Badge> : <Badge tone="green">لا أخطاء</Badge>}
            </dd>
          </dl>
        </Card>
      </div>

      <Card title="أحدث الإعلانات" actions={<Link to="/ads">كل الإعلانات</Link>} flush>
        {data.recent_ads.length === 0 ? (
          <EmptyState title="لا توجد إعلانات بعد" />
        ) : (
          <div className="table-wrap">
            <table className="table is-stack">
              <thead>
                <tr>
                  <th>الإعلان</th>
                  <th>السعر</th>
                  <th>الموقع</th>
                  <th>المصدر</th>
                  <th>أُضيف</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_ads.map((ad) => (
                  <tr key={ad.id}>
                    <td className="col-primary">
                      <div className="cell-title">{ad.title || 'بدون عنوان'}</div>
                      <div className="cell-sub num">#{ad.id}</div>
                    </td>
                    <td data-label="السعر" className="num">
                      {ad.price ? formatPrice(ad.price) : <span className="muted">بدون سعر</span>}
                    </td>
                    <td data-label="الموقع">{ad.location || '—'}</td>
                    <td data-label="المصدر">
                      {isOrganic(ad.source_type) ? (
                        <Badge tone="green">
                          <Users size={12} /> مستخدم
                        </Badge>
                      ) : (
                        <Badge tone="amber">
                          <Bot size={12} /> سحب آلي
                        </Badge>
                      )}
                    </td>
                    <td data-label="أُضيف" className="nowrap">
                      {timeAgo(ad.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
