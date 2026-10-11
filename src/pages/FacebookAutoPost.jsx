import React, { useMemo, useState } from 'react';
import { CheckCircle2, Copy, Facebook, FileText, Megaphone, Plus, RefreshCw, Settings2, Trash2 } from 'lucide-react';
import { api, errorMessage } from '../lib/api';
import {
  Alert, Badge, Button, Card, DataTable, EmptyState, ErrorState, Field, Input, PageHeader, SearchInput, Select, SkeletonRows, Textarea, formatNumber, useFeedback, useLoad,
} from '../ui';

const FORMATS = [
  { value: 'catalog', label: 'نص مع كتالوج روابط' },
  { value: 'images', label: 'نص مع ألبوم صور (بدون روابط)' },
  { value: 'link', label: 'نص مع رابط واحد' },
  { value: 'text_only', label: 'نص فقط' },
  { value: 'text_link_catalog', label: 'نص فيه رابط + كتالوج روابط' },
  { value: 'text_link_images', label: 'نص فيه رابط + ألبوم صور' },
];
const MAX_ADS = 20;

const hashtag = (words) => words.trim().replace(/\s+/g, '_');

/** The opening lines of a post about one kind of property in one area. */
function openingText(category, region) {
  const kind = category || 'عقار';
  const tags = `#${hashtag(kind)} #${region ? hashtag(region) : 'الاردن'} #عقارات #عقارات_الاردن #سوقكم`;
  return `تبحث عن ${kind} في ${region || 'منطقتك'}؟ 🏡✨\nاكتشف أحدث وأفضل ${category || 'العقارات'} المعروضة لدينا في هذه المجموعة المميزة! 🌟\n\n${tags}`;
}

/** Property sections only: every section under one whose name has "عقار". */
function propertyCategories(all) {
  const ids = new Set(all.filter((item) => (item.name || '').includes('عقار')).map((item) => item.id));
  for (let grew = true; grew; ) {
    grew = false;
    all.forEach((item) => {
      if (item.parent_id && ids.has(item.parent_id) && !ids.has(item.id)) {
        ids.add(item.id);
        grew = true;
      }
    });
  }
  return all.filter((item) => ids.has(item.id));
}

async function loadPage() {
  const optional = (request) => request.then((response) => response.data || []).catch(() => []);
  const [rules, locations, categories, ready] = await Promise.all([
    api.get('/facebook-rules').then((response) => response.data || []),
    optional(api.get('/locations')),
    optional(api.get('/categories')),
    optional(api.get('/facebook/ready-combinations')),
  ]);
  const regions = new Set();
  (Array.isArray(locations) ? locations : []).forEach((city) => {
    if (city.name_ar) regions.add(city.name_ar);
    (city.regions || []).forEach((region) => region.name_ar && regions.add(region.name_ar));
  });
  return { rules, ready, regions: [...regions], categories: propertyCategories(Array.isArray(categories) ? categories : []) };
}

export default function FacebookAutoPost() {
  const { toast, confirm } = useFeedback();
  const { data, loading, error, reload } = useLoad(loadPage);

  const [region, setRegion] = useState('');
  const [category, setCategory] = useState('');
  const [format, setFormat] = useState('catalog');
  const [count, setCount] = useState(10);
  const [text, setText] = useState('');
  // The opening text follows the area and section until the admin edits it by hand
  const [textEdited, setTextEdited] = useState(false);
  const [busy, setBusy] = useState(null);
  const [preview, setPreview] = useState(null);

  const [ruleRegion, setRuleRegion] = useState('');
  const [ruleThreshold, setRuleThreshold] = useState(100);
  const [rules, setRules] = useState(null);
  const [search, setSearch] = useState('');

  const page = data || { rules: [], ready: [], regions: [], categories: [] };
  const shownRules = rules || page.rules;
  const ready = useMemo(() => {
    const words = search.trim();
    const rows = words ? page.ready.filter((row) => `${row.region_name} ${row.category_name}`.includes(words)) : page.ready;
    return rows.map((row, index) => ({ ...row, key: `${row.region_name}-${row.category_id}-${index}` }));
  }, [page.ready, search]);

  const pick = (nextRegion, nextCategory) => {
    setRegion(nextRegion);
    setCategory(nextCategory);
    if (!textEdited) setText(nextRegion || nextCategory ? openingText(nextCategory, nextRegion) : '');
  };

  const request = (regionName) => {
    const found = page.categories.find((item) => item.name === category);
    return {
      region_name: regionName,
      count: Math.max(1, Math.min(MAX_ADS, Number(count) || 1)),
      custom_text: text || undefined,
      category_id: found ? found.id : undefined,
      format,
    };
  };

  const generate = async () => {
    if (!region.trim()) {
      toast('اختر المنطقة أولاً.', 'error');
      return;
    }
    setBusy('generate');
    try {
      const { data: body } = await api.post('/facebook/generate-text', request(region.trim()));
      setPreview({ text: body.text, link: body.main_link, count: body.count });
    } catch (failure) {
      toast(errorMessage(failure, 'تعذّر توليد النص.'), 'error');
    } finally {
      setBusy(null);
    }
  };

  const publish = async (everywhere) => {
    if (!everywhere && !region.trim()) {
      toast('اختر المنطقة أولاً.', 'error');
      return;
    }
    const agreed = await confirm({
      title: 'النشر على صفحة فيسبوك؟',
      message: everywhere
        ? `سيُنشر الآن منشور عام من كل المناطق${category ? ` لقسم «${category}»` : ''} على صفحة سوقكم.`
        : `سيُنشر الآن منشور عن ${category || 'العقارات'} في «${region.trim()}» على صفحة سوقكم.`,
      confirmLabel: 'نشر الآن',
    });
    if (!agreed) return;
    setBusy(everywhere ? 'publish-all' : 'publish');
    try {
      const { data: body } = await api.post('/facebook/manual-publish', request(everywhere ? 'all' : region.trim()));
      toast(`نُشر المنشور وفيه ${formatNumber(body.posted_count)} عقار`);
    } catch (failure) {
      toast(errorMessage(failure, 'تعذّر النشر على فيسبوك.'), 'error');
    } finally {
      setBusy(null);
    }
  };

  const copy = async (value, done) => {
    try {
      await navigator.clipboard.writeText(value);
      toast(done);
    } catch (failure) {
      toast('تعذّر النسخ.', 'error');
    }
  };

  /** A finished post for one ready area and section, straight to the clipboard. */
  const copyReady = async (row) => {
    setBusy(row.key);
    try {
      const { data: body } = await api.post('/facebook/generate-text', {
        region_name: row.region_name,
        count: row.count,
        custom_text: openingText(row.category_name, row.region_name),
        category_id: row.category_id,
        format: 'catalog',
      });
      await copy(body.text, `نُسخ منشور ${row.category_name} في ${row.region_name}`);
    } catch (failure) {
      toast(errorMessage(failure, 'تعذّر توليد المنشور.'), 'error');
    } finally {
      setBusy(null);
    }
  };

  const refreshRules = async () => setRules((await api.get('/facebook-rules')).data || []);

  const addRule = async (event) => {
    event.preventDefault();
    if (!ruleRegion.trim()) return;
    setBusy('rule');
    try {
      await api.post('/facebook-rules', { region_name: ruleRegion.trim(), threshold: Math.max(1, Number(ruleThreshold) || 1) });
      setRuleRegion('');
      setRuleThreshold(100);
      await refreshRules();
      toast('أُضيفت القاعدة');
    } catch (failure) {
      toast(errorMessage(failure, 'تعذّر إضافة القاعدة.'), 'error');
    } finally {
      setBusy(null);
    }
  };

  const removeRule = async (rule) => {
    const agreed = await confirm({ title: 'حذف القاعدة؟', message: `لن يُنشر تلقائياً عن «${rule.region_name}» بعد الآن.`, confirmLabel: 'حذف', danger: true });
    if (!agreed) return;
    try {
      await api.delete(`/facebook-rules/${encodeURIComponent(rule.region_name)}`);
      await refreshRules();
      toast('حُذفت القاعدة');
    } catch (failure) {
      toast(errorMessage(failure, 'تعذّر حذف القاعدة.'), 'error');
    }
  };

  const header = (
    <PageHeader title="النشر على فيسبوك" subtitle="منشورات جاهزة من إعلانات الموقع لصفحة سوقكم: انسخها للمجموعات، أو انشرها مباشرة، أو اتركها تُنشر تلقائياً.">
      <Button variant="secondary" icon={RefreshCw} loading={loading} onClick={() => { setRules(null); reload(); }}>
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
          <SkeletonRows rows={8} />
        </div>
      </>
    );
  }

  const working = busy !== null;

  return (
    <div className="stack">
      {header}
      <datalist id="fb-regions">
        {page.regions.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
      <datalist id="fb-categories">
        {page.categories.map((item) => (
          <option key={item.id} value={item.name} />
        ))}
      </datalist>

      <Card
        title="منشورات جاهزة للنسخ"
        subtitle="مناطق وأقسام فيها 50 إعلاناً أو أكثر. «نسخ» يولّد المنشور كاملاً بروابطه."
        actions={<SearchInput value={search} onChange={setSearch} placeholder="ابحث عن منطقة أو قسم" />}
        flush
      >
        <DataTable
          rows={ready}
          rowKey="key"
          pageSize={10}
          initialSort={{ key: 'count', dir: 'desc' }}
          empty={<EmptyState icon={CheckCircle2} title={search ? 'لا نتائج لهذا البحث' : 'لا توجد تجمعات جاهزة الآن'} description={search ? undefined : 'تظهر هنا كل منطقة وقسم يصل عدد إعلاناتهما إلى 50.'} />}
          columns={[
            { key: 'region', label: 'المنطقة', primary: true, sort: (row) => row.region_name, render: (row) => <span className="cell-title">{row.region_name}</span> },
            { key: 'category', label: 'القسم', sort: (row) => row.category_name, render: (row) => row.category_name },
            { key: 'count', label: 'الإعلانات', sort: (row) => row.actual_count, render: (row) => <Badge tone="blue">{formatNumber(row.actual_count)}</Badge> },
            {
              key: 'actions',
              label: '',
              actions: true,
              render: (row) => (
                <div className="actions">
                  <Button variant="secondary" size="sm" icon={Copy} loading={busy === row.key} disabled={working} onClick={() => copyReady(row)}>
                    نسخ
                  </Button>
                  <Button variant="ghost" size="sm" disabled={working} onClick={() => { pick(row.region_name, row.category_name); window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); }}>
                    تخصيص
                  </Button>
                </div>
              ),
            },
          ]}
        />
      </Card>

      <div className="grid grid-main">
        <Card title="منشور مخصّص" subtitle="اختر المنطقة والقسم والشكل، ثم عاين النص أو انشره.">
          <div className="stack">
            <div className="form-grid">
              <Field label="المنطقة">
                <Input list="fb-regions" value={region} placeholder="اختر أو اكتب اسم المنطقة" onChange={(event) => pick(event.target.value, category)} />
              </Field>
              <Field label="القسم" hint="اختياري">
                <Input list="fb-categories" value={category} placeholder="كل أقسام العقارات" onChange={(event) => pick(region, event.target.value)} />
              </Field>
              <Field label="شكل المنشور">
                <Select value={format} onChange={(event) => setFormat(event.target.value)}>
                  {FORMATS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="عدد الإعلانات" hint={`حتى ${MAX_ADS}`}>
                <Input type="number" min="1" max={MAX_ADS} value={count} onChange={(event) => setCount(event.target.value)} />
              </Field>
              <Field label="النص الافتتاحي" hint="تُضاف قائمة العقارات تحته تلقائياً" className="span-2">
                <Textarea rows={5} value={text} onChange={(event) => { setText(event.target.value); setTextEdited(event.target.value !== ''); }} />
              </Field>
            </div>

            <div className="row">
              <Button variant="secondary" icon={FileText} loading={busy === 'generate'} disabled={working} onClick={generate}>
                معاينة النص
              </Button>
              <Button icon={Facebook} loading={busy === 'publish'} disabled={working} onClick={() => publish(false)}>
                نشر على الصفحة
              </Button>
              <span className="toolbar-spacer" />
              <Button variant="ghost" icon={Megaphone} loading={busy === 'publish-all'} disabled={working} onClick={() => publish(true)}>
                نشر كتالوج من كل المناطق
              </Button>
            </div>

            {preview && (
              <div className="stack-sm">
                <div className="row row-between">
                  <span className="strong">المعاينة ({formatNumber(preview.count)} عقار)</span>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={Copy}
                    onClick={() => copy(preview.link && format !== 'text_only' ? `${preview.text}\n\nالرابط: ${preview.link}` : preview.text, 'نُسخ النص')}
                  >
                    نسخ النص
                  </Button>
                </div>
                <div className="preview-text">{preview.text}</div>
              </div>
            )}
          </div>
        </Card>

        <Card title="النشر التلقائي" subtitle="عندما يصل عدد الإعلانات الجديدة في منطقة إلى الحد، يُنشر عنها منشور دون تدخّل.">
          <div className="stack">
            <form className="row" style={{ alignItems: 'flex-end', flexWrap: 'nowrap' }} onSubmit={addRule}>
              <Field label="المنطقة" className="grow">
                <Input list="fb-regions" required value={ruleRegion} placeholder="اسم المنطقة" onChange={(event) => setRuleRegion(event.target.value)} />
              </Field>
              <Field label="الحد">
                <Input type="number" min="1" required style={{ width: 84 }} value={ruleThreshold} onChange={(event) => setRuleThreshold(event.target.value)} />
              </Field>
              <Button type="submit" icon={Plus} loading={busy === 'rule'} aria-label="إضافة القاعدة" />
            </form>

            {shownRules.length === 0 ? (
              <EmptyState icon={Settings2} title="لا توجد قواعد" description="أضف منطقة وحدّاً ليبدأ النشر التلقائي عنها." />
            ) : (
              <div className="stack-sm">
                {shownRules.map((rule) => (
                  <div key={rule.id || rule.region_name} className="row row-between" style={{ flexWrap: 'nowrap' }}>
                    <span className="strong truncate">{rule.region_name}</span>
                    <span className="row" style={{ flexWrap: 'nowrap' }}>
                      <Badge>كل {formatNumber(rule.threshold)} إعلان</Badge>
                      <Button variant="ghost" size="sm" icon={Trash2} aria-label={`حذف قاعدة ${rule.region_name}`} onClick={() => removeRule(rule)} />
                    </span>
                  </div>
                ))}
              </div>
            )}

            <Alert>النشر المباشر والتلقائي يحتاجان إلى ربط صفحة فيسبوك في إعدادات الخادم. النسخ يعمل دائماً.</Alert>
          </div>
        </Card>
      </div>
    </div>
  );
}
