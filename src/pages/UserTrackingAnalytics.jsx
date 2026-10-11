import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ReactApexChart from 'react-apexcharts';
import { Bot, FolderTree, Layers, MousePointerClick, RefreshCw, Route, Search, UserRound, X, XCircle } from 'lucide-react';
import { api } from '../lib/api';
import {
  Alert, Badge, BarChart, Button, Card, EmptyState, ErrorState, Input, MeterList, PageHeader, Select, SkeletonRows, Stat, Tabs, formatNumber, useLoad,
} from '../ui';

/** What the app calls each screen -> what an admin calls it. */
const SCREENS = {
  login: 'تسجيل الدخول',
  home: 'الرئيسية',
  search: 'البحث',
  my_ads: 'إعلاناتي',
  my_account: 'حسابي',
  profile: 'حسابي',
  messages: 'الرسائل',
  ad_details: 'تفاصيل الإعلان',
  categories: 'الأقسام',
  Categories: 'الأقسام',
  categories_tab: 'الأقسام',
  add_ad: 'إضافة إعلان',
  add_ad_wizard: 'إضافة إعلان: القسم',
  add_ad_subcategories: 'إضافة إعلان: القسم الفرعي',
  add_ad_city: 'إضافة إعلان: المدينة',
  add_ad_region: 'إضافة إعلان: المنطقة',
  add_ad_map: 'إضافة إعلان: الخريطة',
  add_ad_basic_info: 'إضافة إعلان: المعلومات الأساسية',
  add_ad_details: 'إضافة إعلان: التفاصيل',
  add_ad_images: 'إضافة إعلان: الصور',
  add_ad_reels: 'إضافة إعلان: الفيديو',
  add_ad_preview: 'إضافة إعلان: المعاينة',
  premium_chat_screen: 'المحادثات المميزة',
  premium_inbox_screen: 'صندوق الوارد المميز',
};
/** The steps of adding an ad, in the order the app shows them. */
const ADD_AD_STEPS = ['add_ad_images', 'add_ad_reels', 'add_ad_wizard', 'add_ad_subcategories', 'add_ad_city', 'add_ad_region', 'add_ad_map', 'add_ad_details', 'add_ad_basic_info', 'add_ad_preview'];
const SALE_ROOT = 2;
const RENT_ROOT = 3;

const flatten = (list, into = []) => {
  (list || []).forEach((item) => {
    into.push(item);
    if (Array.isArray(item.children)) flatten(item.children, into);
  });
  return into;
};
const sameSpelling = (text) => String(text).replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه');

/**
 * Turns the recorded screen-to-screen moves into the diagram's boxes and lines:
 * login -> home -> search / sections -> property sections -> ad details, and the add-ad steps.
 */
function buildFlow(sankey, categoryList) {
  const index = new Map();
  (sankey.nodes || []).forEach((node, position) => {
    if (node.name === null || node.name === undefined) return;
    index.set(String(node.name), position);
    index.set(sameSpelling(node.name), position);
  });
  const moves = new Map((sankey.links || []).map((link) => [`${link.source}-${link.target}`, link.value]));
  const position = (name) => (name === null || name === undefined ? undefined : index.has(String(name)) ? index.get(String(name)) : index.get(sameSpelling(name)));
  const flow = (from, to) => {
    const source = position(from);
    const target = position(to);
    return source === undefined || target === undefined ? 0 : moves.get(`${source}-${target}`) || 0;
  };

  const titles = new Map([
    ['login', SCREENS.login], ['home', SCREENS.home], ['search', SCREENS.search], ['my_ads', SCREENS.my_ads],
    ['my_account', SCREENS.my_account], ['ad_details', SCREENS.ad_details], ['categories_tab', SCREENS.categories_tab],
  ]);
  ADD_AD_STEPS.forEach((step) => titles.set(step, SCREENS[step].replace('إضافة إعلان: ', '')));
  const edges = [];

  // The app has recorded some screens under two names ("home" / "Home", a section's id / its name)
  const connect = (source, target, otherSource = null, otherTarget = null) => {
    let value = flow(source, target);
    if (otherSource) value += flow(otherSource, target);
    if (otherTarget) value += flow(source, otherTarget);
    if (otherSource && otherTarget) value += flow(otherSource, otherTarget);
    if (source === 'home' || otherSource === 'home') {
      value += flow('Home', target);
      if (otherTarget) value += flow('Home', otherTarget);
    }
    if (value > 0) edges.push({ source, target, value });
  };

  connect('login', 'home');
  connect('login', 'my_ads');
  connect('login', 'my_account');
  connect('login', 'categories_tab', 'Login', 'Categories');
  connect('home', 'search');
  connect('home', 'my_ads');
  connect('home', 'my_account');
  connect('home', 'categories_tab', 'Home', 'Categories');
  connect('home', 'add_ad_images');
  connect('my_account', 'add_ad_images');
  connect('my_ads', 'add_ad_images');
  // People skip steps (the map, the video), so every forward jump counts
  ADD_AD_STEPS.forEach((step, at) => ADD_AD_STEPS.slice(at + 1).forEach((later) => connect(step, later)));

  // Going back home after publishing would make a loop, which the diagram cannot draw
  titles.set('ad_published', 'نُشر الإعلان');
  const published = flow('add_ad_preview', 'home') + flow('add_ad_preview', 'my_ads');
  if (published > 0) edges.push({ source: 'add_ad_preview', target: 'ad_published', value: published });

  const all = flatten(categoryList);
  let roots = all.filter((item) => item.id === SALE_ROOT || item.id === RENT_ROOT);
  if (roots.length === 0) roots = all.filter((item) => (item.name || '').includes('عقارات'));
  const leaves = new Set();

  const walk = (parent, suffix, seen) => {
    if (seen.has(parent.id)) return;
    seen.add(parent.id);
    const children = all.filter((item) => item.parent_id === parent.id);
    if (children.length === 0) {
      leaves.add(String(parent.id));
      return;
    }
    children.forEach((child) => {
      const childSuffix = /للبيع|للايجار|للإيجار/.test(child.name) ? '' : suffix;
      titles.set(String(child.id), child.name + childSuffix);
      connect(String(parent.id), String(child.id), parent.name, child.name);
      connect('categories_tab', String(child.id), 'Categories', child.name);
      connect('search', String(child.id), 'Search', child.name);
      walk(child, childSuffix, new Set(seen));
    });
  };
  roots.forEach((root) => {
    titles.set(String(root.id), root.name);
    connect('home', String(root.id), null, root.name);
    connect('search', String(root.id), 'Search', root.name);
    connect('categories_tab', String(root.id), 'Categories', root.name);
    walk(root, root.id === SALE_ROOT ? ' (للبيع)' : root.id === RENT_ROOT ? ' (للإيجار)' : '', new Set());
  });
  leaves.forEach((leaf) => connect(leaf, 'ad_details', titles.get(leaf), null));
  connect('search', 'ad_details');

  // Visits that end on a screen (no ad opened) are sent to one "left" box; without it the
  // diagram drops those branches entirely
  titles.set('left', 'تصفّح دون فتح إعلان');
  const balance = {};
  edges.forEach((edge) => {
    balance[edge.target] = (balance[edge.target] || 0) + edge.value;
    balance[edge.source] = (balance[edge.source] || 0) - edge.value;
  });
  Object.keys(balance).forEach((id) => {
    if (balance[id] > 0 && !['left', 'ad_details', 'home', 'login', 'search'].includes(id)) edges.push({ source: id, target: 'left', value: balance[id] });
  });

  // Boxes with no line make the diagram library hang
  const used = new Set(edges.flatMap((edge) => [edge.source, edge.target]));
  return { nodes: [...titles].filter(([id]) => used.has(id)).map(([id, title]) => ({ id, title })), edges };
}

const FLOW_WIDTH = 1400;
const FLOW_HEIGHT = 720;

function FlowChart({ sankey, categories }) {
  const holder = useRef(null);
  const [state, setState] = useState('loading');
  const flow = useMemo(() => (sankey ? buildFlow(sankey, categories) : null), [sankey, categories]);

  useEffect(() => {
    if (!flow || !holder.current) return undefined;
    if (flow.edges.length === 0) {
      setState('empty');
      return undefined;
    }
    let timer = null;
    let tries = 0;
    const draw = () => {
      if (!holder.current) return;
      // The diagram library is loaded by the page itself and may arrive a moment later
      if (!window.ApexSankey) {
        tries += 1;
        if (tries > 80) setState('failed');
        else timer = setTimeout(draw, 100);
        return;
      }
      try {
        holder.current.innerHTML = '';
        const canvas = document.createElement('div');
        canvas.style.cssText = `min-width:${FLOW_WIDTH}px;height:100%`;
        canvas.dir = 'ltr';
        holder.current.appendChild(canvas);
        new window.ApexSankey(canvas, { width: Math.max(holder.current.clientWidth || 0, FLOW_WIDTH), height: FLOW_HEIGHT }).render(flow);
        setState('drawn');
      } catch (failure) {
        setState('failed');
      }
    };
    setState('loading');
    draw();
    return () => clearTimeout(timer);
  }, [flow]);

  if (!sankey) return <EmptyState icon={Route} title="لا توجد بيانات تنقّل بعد" description="تظهر المسارات بعد أن يستخدم الناس التطبيق." />;
  return (
    <>
      {state === 'empty' && <EmptyState icon={Route} title="لا توجد تنقّلات مسجّلة" description="لم يُسجَّل انتقال بين الشاشات في هذه البيانات." />}
      {state === 'failed' && <EmptyState icon={XCircle} title="تعذّر رسم المخطط" description="لم تُحمَّل مكتبة الرسم. حدّث الصفحة وحاول مرة أخرى." />}
      {state === 'loading' && <SkeletonRows rows={6} columns={3} />}
      <div className="table-wrap flow-chart" ref={holder} dir="ltr" style={{ display: state === 'drawn' ? 'block' : 'none' }} />
    </>
  );
}

/** Where on the screen people tapped, drawn on a phone outline. `data`: [{ screen, x, y }] */
function TapMap({ title, hint, color, data, screenName }) {
  const [screen, setScreen] = useState('');
  const screens = useMemo(() => [...new Set(data.map((tap) => tap.screen || ''))], [data]);
  const series = useMemo(() => {
    const groups = {};
    data.forEach((tap) => {
      const key = tap.screen || '';
      if (screen && key !== screen) return;
      (groups[key] = groups[key] || []).push([tap.x, tap.y]);
    });
    return Object.keys(groups).map((key) => ({ name: screenName(key), data: groups[key] }));
  }, [data, screen, screenName]);

  return (
    <Card title={title} subtitle={hint} actions={<Badge tone={data.length ? 'amber' : undefined}>{formatNumber(data.length)} نقرة</Badge>}>
      {data.length === 0 ? (
        <EmptyState icon={MousePointerClick} title="لا توجد نقرات مسجّلة" />
      ) : (
        <div className="stack">
          <Select value={screen} onChange={(event) => setScreen(event.target.value)} aria-label="الشاشة">
            <option value="">كل الشاشات</option>
            {screens.filter(Boolean).map((name) => (
              <option key={name} value={name}>
                {screenName(name)}
              </option>
            ))}
          </Select>
          <div className="phone-frame" dir="ltr">
            <ReactApexChart
              type="scatter"
              height="100%"
              series={series}
              options={{
                chart: { type: 'scatter', toolbar: { show: false }, zoom: { enabled: false }, fontFamily: 'inherit', animations: { enabled: false } },
                colors: [color],
                xaxis: { min: 0, max: 400, tickAmount: 4, labels: { show: false }, axisBorder: { show: false }, axisTicks: { show: false }, tooltip: { enabled: false } },
                yaxis: { min: 0, max: 900, reversed: true, tickAmount: 5, labels: { show: false } },
                grid: { strokeDashArray: 4, borderColor: '#e6e9ef', padding: { left: 0, right: 0 } },
                markers: { size: screen ? 7 : 4, fillOpacity: 0.65, strokeWidth: 0 },
                legend: { show: false },
                tooltip: { x: { show: false }, y: { formatter: (value) => `${Math.round(value)}`, title: { formatter: (name) => `${name}:` } } },
              }}
            />
          </div>
        </div>
      )}
    </Card>
  );
}

function Friction({ friction, screenName }) {
  if (!friction) return <Card><EmptyState icon={MousePointerClick} title="لا توجد بيانات عن عوائق الاستخدام بعد" /></Card>;
  const rage = friction.rage_taps || [];
  const dead = friction.dead_clicks || [];
  const abandoned = (friction.form_abandonment || []).map((row) => ({ label: row.form_field || 'حقل غير معروف', value: row.count }));
  const turns = (friction.u_turns || []).map((row) => ({ label: screenName(row.screen), value: row.count }));
  const sum = (items) => items.reduce((total, item) => total + item.value, 0);

  return (
    <div className="stack">
      <div className="grid grid-4 keep-2">
        <Stat icon={MousePointerClick} tone="red" label="نقرات غاضبة" value={formatNumber(rage.length)} hint="نقر متكرر سريع على المكان نفسه" />
        <Stat icon={MousePointerClick} tone="amber" label="نقرات بلا استجابة" value={formatNumber(dead.length)} hint="نقر على شيء لا يفعل شيئاً" />
        <Stat icon={XCircle} tone="violet" label="حقول تُركت" value={formatNumber(sum(abandoned))} hint="بدأ التعبئة ثم غادر" />
        <Stat icon={Route} label="رجوع فوري" value={formatNumber(sum(turns))} hint="فتح الشاشة وعاد في ثوانٍ" />
      </div>
      <div className="grid grid-2">
        <TapMap title="النقرات الغاضبة" hint="أماكن ينقر عليها المستخدم مراراً لأن التطبيق لا يستجيب كما يتوقع." color="#d92d20" data={rage} screenName={screenName} />
        <TapMap title="نقرات بلا استجابة" hint="أماكن يظنها المستخدم أزراراً وهي ليست كذلك." color="#dc6803" data={dead} screenName={screenName} />
      </div>
      <div className="grid grid-2">
        <Card title="حقول يتوقف عندها المستخدم" subtitle="الحقل الأخير الذي لمسه قبل أن يترك النموذج.">
          <MeterList items={abandoned.slice(0, 12)} />
        </Card>
        <Card title="شاشات يعود منها فوراً" subtitle="شاشة تُفتح ثم تُغلق خلال ثوانٍ: غالباً لم تكن ما توقعه.">
          <MeterList items={turns.slice(0, 12)} />
        </Card>
      </div>
    </div>
  );
}

/** How the AI sorted scraped posts into sections. */
function Classification({ data }) {
  if (!data) return <Card><EmptyState icon={Bot} title="لا توجد بيانات عن التصنيف الآلي بعد" /></Card>;
  const volume = (data.classification_volume || []).map((row) => ({ label: row.category, value: row.volume }));
  const trend = (data.charts && data.charts.trend) || { categories: [], data: [] };
  const days = (trend.categories || []).map((day, at) => ({ label: String(day), value: Number((trend.data || [])[at]) || 0 }));
  const failed = Number(data.failed_rate) || 0;

  return (
    <div className="stack">
      <div className="grid grid-4 keep-2">
        <Stat icon={FolderTree} label="الأقسام" value={formatNumber(data.total_categories)} hint="كل الأقسام المسجّلة" />
        <Stat icon={Layers} tone="green" label="أقسام نشطة" value={formatNumber(data.active_categories)} hint="فيها إعلانات خلال 30 يوماً" />
        <Stat icon={Bot} tone="violet" label="تصنيفات آلية" value={formatNumber(data.total_classifications)} hint="منشورات صنّفها الذكاء الاصطناعي" />
        <Stat icon={XCircle} tone={failed >= 5 ? 'red' : 'green'} label="نسبة الفشل" value={`${failed}%`} hint={failed >= 5 ? 'أعلى من المقبول (5%)' : 'ضمن المقبول'} hintTone={failed >= 5 ? 'down' : 'up'} />
      </div>
      <div className="grid grid-main">
        <Card title="التصنيفات يومياً" subtitle="آخر 7 أيام">
          <BarChart points={days} />
        </Card>
        <Card title="الأقسام الأكثر تصنيفاً">
          <MeterList items={volume.slice(0, 10)} />
        </Card>
      </div>
    </div>
  );
}

async function loadPage() {
  const optional = (request) => request.then((response) => response.data || null).catch(() => null);
  const [telemetry, categories, advanced] = await Promise.all([
    api.get('/telemetry/analytics').then((response) => response.data || null),
    optional(api.get('/categories')),
    optional(api.get('/telemetry/advanced-analytics')),
  ]);
  return { telemetry, categories: Array.isArray(categories) ? categories : [], classification: advanced ? advanced.categories || null : null };
}

export default function UserTrackingAnalytics() {
  const { data, loading, error, reload } = useLoad(loadPage);
  const [tab, setTab] = useState('flow');
  const [email, setEmail] = useState('');
  // One person's own moves, when the admin searched for them: { email, sankey, friction }
  const [person, setPerson] = useState(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  const categoryNames = useMemo(() => new Map(flatten(data ? data.categories : []).map((item) => [String(item.id), item.name])), [data]);
  const screenName = useMemo(() => (key) => (!key || key === 'Unknown' ? 'شاشة غير معروفة' : categoryNames.get(String(key)) || SCREENS[key] || String(key)), [categoryNames]);

  const findPerson = async (event) => {
    if (event) event.preventDefault();
    const wanted = email.trim();
    if (!wanted) return;
    setSearching(true);
    setSearchError(null);
    try {
      const { data: body } = await api.get('/telemetry/user-sankey', { params: { email: wanted } });
      setPerson({ email: wanted, sankey: body.sankey || null, friction: body.friction_metrics || null });
    } catch (failure) {
      setPerson(null);
      setSearchError('لا توجد بيانات لهذا المستخدم. تأكد من البريد الإلكتروني.');
    } finally {
      setSearching(false);
    }
  };

  const clearPerson = () => {
    setPerson(null);
    setEmail('');
    setSearchError(null);
  };

  const header = (
    <PageHeader title="سلوك المستخدمين" subtitle="كيف يتنقّل الناس داخل التطبيق، وأين يتعثّرون.">
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
          <SkeletonRows rows={8} />
        </div>
      </>
    );
  }

  const telemetry = data.telemetry || {};
  const sankey = person ? person.sankey : telemetry.sankey;
  const friction = person ? person.friction : telemetry.friction_metrics;

  return (
    <div className="stack">
      {header}

      <Card flush>
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: 'flow', label: 'مسارات التنقّل', icon: Route },
            { value: 'friction', label: 'عوائق الاستخدام', icon: MousePointerClick },
            { value: 'ai', label: 'التصنيف الآلي', icon: Bot },
          ]}
        />
        {tab !== 'ai' && (
          <form className="toolbar" onSubmit={findPerson}>
            <Input type="email" className="ltr" style={{ maxWidth: 320 }} value={email} placeholder="user@example.com" aria-label="بريد المستخدم" onChange={(event) => setEmail(event.target.value)} />
            <Button type="submit" variant="secondary" icon={Search} loading={searching} disabled={!email.trim()}>
              عرض مستخدم واحد
            </Button>
            {person && (
              <Button variant="ghost" icon={X} onClick={clearPerson}>
                كل المستخدمين
              </Button>
            )}
            <span className="toolbar-spacer" />
            {person ? (
              <Badge tone="blue">
                <UserRound size={12} /> {person.email}
              </Badge>
            ) : (
              <span className="cell-sub">تُعرض بيانات كل المستخدمين</span>
            )}
          </form>
        )}
        {tab !== 'ai' && searchError && (
          <div className="card-body">
            <Alert tone="red">{searchError}</Alert>
          </div>
        )}
        {tab === 'flow' && (
          <>
            <div className="card-body">
              <Alert icon={Route}>كل خط هو انتقال من شاشة إلى أخرى، وسماكته بعدد مرات الانتقال. اسحب أفقياً لرؤية المخطط كاملاً.</Alert>
            </div>
            <FlowChart sankey={sankey} categories={data.categories} />
          </>
        )}
      </Card>

      {tab === 'friction' && <Friction friction={friction} screenName={screenName} />}
      {tab === 'ai' && <Classification data={data.classification} />}

      <p className="cell-sub">
        أعداد المستخدمين ونموّهم في <Link to="/user-analytics">تسجيل المستخدمين</Link>، وتوزيع الإعلانات على المناطق والأقسام في <Link to="/geo-analytics">الإعلانات حسب المنطقة</Link>.
      </p>
    </div>
  );
}
