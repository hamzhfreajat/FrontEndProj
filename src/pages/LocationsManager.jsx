import React, { useMemo, useState } from 'react';
import { MapPinned, Plus, RefreshCw, X } from 'lucide-react';
import { api, errorMessage } from '../lib/api';
import { EMPTY, Alert, Badge, Button, Card, EmptyState, ErrorState, Field, Input, Modal, PageHeader, SearchInput, Select, SkeletonRows, Stat, formatNumber, useFeedback, useLoad } from '../ui';

/** Areas with fewer ads than this are shown as "weak": their page on the site is thin. */
const WEAK_BELOW = 5;

const fold = (text) => (text || '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').toLowerCase();

export default function LocationsManager() {
  const { toast, confirm } = useFeedback();
  const { data, loading, error, reload } = useLoad(() => api.get('/dashboard/locations').then((response) => response.data));
  const [search, setSearch] = useState('');
  const [cityId, setCityId] = useState('');
  const [filter, setFilter] = useState('all');
  const [regionForm, setRegionForm] = useState(null);
  const [aliasFor, setAliasFor] = useState(null);
  const [aliasName, setAliasName] = useState('');
  const [saving, setSaving] = useState(false);

  const cities = data || EMPTY;

  const totals = useMemo(() => {
    let regions = 0;
    let empty = 0;
    let weak = 0;
    cities.forEach((city) =>
      city.regions.forEach((region) => {
        regions += 1;
        if (region.ads === 0) empty += 1;
        else if (region.ads < WEAK_BELOW) weak += 1;
      }),
    );
    return { regions, empty, weak };
  }, [cities]);

  const visible = useMemo(() => {
    const text = fold(search.trim());
    return cities
      .filter((city) => !cityId || String(city.id) === cityId)
      .map((city) => {
        const cityMatches = !text || fold(city.name_ar).includes(text) || fold(city.name_en).includes(text);
        const regions = city.regions.filter((region) => {
          if (filter === 'empty' && region.ads !== 0) return false;
          if (filter === 'weak' && !(region.ads > 0 && region.ads < WEAK_BELOW)) return false;
          if (cityMatches) return true;
          return fold(region.name_ar).includes(text) || fold(region.name_en).includes(text) || region.aliases.some((alias) => fold(alias.name).includes(text));
        });
        return { ...city, shown: regions };
      })
      .filter((city) => city.shown.length > 0);
  }, [cities, search, cityId, filter]);

  const saveRegion = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post('/dashboard/regions', { city_id: Number(regionForm.cityId), name_ar: regionForm.nameAr, name_en: regionForm.nameEn });
      toast('تمت إضافة المنطقة');
      setRegionForm(null);
      reload();
    } catch (failure) {
      toast(errorMessage(failure, 'تعذّرت إضافة المنطقة.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const saveAlias = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post(`/dashboard/regions/${aliasFor.id}/aliases`, { name: aliasName });
      toast('تمت إضافة الاسم البديل');
      setAliasFor(null);
      setAliasName('');
      reload();
    } catch (failure) {
      toast(errorMessage(failure, 'تعذّرت إضافة الاسم البديل.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const removeAlias = async (region, alias) => {
    if (!(await confirm({ title: 'حذف الاسم البديل؟', message: `لن يُربط «${alias.name}» بالمنطقة «${region.name_ar}» بعد الآن.`, confirmLabel: 'حذف', danger: true }))) return;
    try {
      await api.delete(`/dashboard/aliases/${alias.id}`);
      toast('تم حذف الاسم البديل');
      reload();
    } catch (failure) {
      toast(errorMessage(failure, 'تعذّر حذف الاسم البديل.'), 'error');
    }
  };

  return (
    <div className="stack">
      <PageHeader title="المدن والمناطق" subtitle="المناطق التي تُصنَّف الإعلانات تحتها، وعدد الإعلانات في كل منها. المناطق الفارغة تحتاج إلى مصادر سحب.">
        <Button variant="secondary" icon={RefreshCw} loading={loading} onClick={reload}>
          تحديث
        </Button>
        <Button icon={Plus} disabled={cities.length === 0} onClick={() => setRegionForm({ cityId: cityId || String((cities[0] || {}).id || ''), nameAr: '', nameEn: '' })}>
          إضافة منطقة
        </Button>
      </PageHeader>

      {error ? (
        <div className="card">
          <ErrorState message={error} onRetry={reload} />
        </div>
      ) : !data ? (
        <div className="card">
          <SkeletonRows rows={8} columns={3} />
        </div>
      ) : (
        <>
          <div className="grid grid-4 keep-2">
            <Stat icon={MapPinned} label="المدن" value={formatNumber(cities.length)} />
            <Stat icon={MapPinned} tone="violet" label="المناطق" value={formatNumber(totals.regions)} />
            <Stat icon={MapPinned} tone="red" label="مناطق بلا إعلانات" value={formatNumber(totals.empty)} />
            <Stat icon={MapPinned} tone="amber" label={`مناطق ضعيفة (أقل من ${WEAK_BELOW})`} value={formatNumber(totals.weak)} />
          </div>

          <Card flush>
            <div className="toolbar">
              <SearchInput value={search} onChange={setSearch} placeholder="ابحث عن مدينة، منطقة أو اسم بديل..." />
              <Select value={cityId} onChange={(event) => setCityId(event.target.value)} aria-label="المدينة">
                <option value="">كل المدن</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name_ar} ({city.regions.length})
                  </option>
                ))}
              </Select>
              <Select value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="التصفية">
                <option value="all">كل المناطق</option>
                <option value="empty">بلا إعلانات</option>
                <option value="weak">ضعيفة</option>
              </Select>
            </div>

            {visible.length === 0 ? (
              <EmptyState icon={MapPinned} title="لا توجد مناطق مطابقة" />
            ) : (
              visible.map((city) => (
                <div key={city.id} className="location-city">
                  <div className="location-city-head">
                    <div>
                      <strong>{city.name_ar}</strong> <span className="muted ltr">{city.name_en}</span>
                    </div>
                    <div className="row" style={{ gap: 6 }}>
                      <Badge tone="blue">{formatNumber(city.ads)} إعلان</Badge>
                      <Badge>{city.shown.length} منطقة</Badge>
                    </div>
                  </div>
                  <div className="location-regions">
                    {city.shown.map((region) => (
                      <div key={region.id} className="location-region">
                        <div className="row row-between" style={{ flexWrap: 'nowrap' }}>
                          <div className="grow">
                            <div className="cell-title truncate" title={region.name_ar}>
                              {region.name_ar}
                            </div>
                            <div className="cell-sub ltr truncate">{region.name_en}</div>
                          </div>
                          <Badge tone={region.ads === 0 ? 'red' : region.ads < WEAK_BELOW ? 'amber' : 'green'}>{formatNumber(region.ads)}</Badge>
                        </div>
                        <div className="chips" style={{ marginTop: 8 }}>
                          {region.aliases.map((alias) => (
                            <span key={alias.id} className="badge">
                              {alias.name}
                              <button type="button" className="badge-x" onClick={() => removeAlias(region, alias)} aria-label={`حذف ${alias.name}`}>
                                <X size={11} />
                              </button>
                            </span>
                          ))}
                          <button type="button" className="badge blue badge-add" onClick={() => { setAliasFor(region); setAliasName(''); }}>
                            <Plus size={11} /> اسم بديل
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </Card>
        </>
      )}

      <Modal
        open={!!regionForm}
        title="إضافة منطقة"
        onClose={() => setRegionForm(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setRegionForm(null)}>
              إلغاء
            </Button>
            <Button type="submit" form="region-form" loading={saving} disabled={!regionForm || regionForm.nameAr.trim().length < 3 || !regionForm.nameEn.trim() || !regionForm.cityId}>
              إضافة
            </Button>
          </>
        }
      >
        {regionForm && (
          <form id="region-form" className="stack" onSubmit={saveRegion}>
            <Alert>
              أضف أحياءً ومناطق حقيقية فقط. المعالم (مستشفى، مجمّع، دوّار) والأسماء التي قد تكون اسم شخص تسبّب تصنيف إعلانات في مكان خاطئ. إن كان الاسم طريقة أخرى لكتابة منطقة موجودة فأضفه
              كـ«اسم بديل» لها.
            </Alert>
            <Field label="المدينة">
              <Select value={regionForm.cityId} onChange={(event) => setRegionForm({ ...regionForm, cityId: event.target.value })}>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name_ar}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="form-grid">
              <Field label="الاسم بالعربية">
                <Input value={regionForm.nameAr} onChange={(event) => setRegionForm({ ...regionForm, nameAr: event.target.value })} placeholder="جبل الحديد" autoFocus required />
              </Field>
              <Field label="الاسم بالإنجليزية">
                <Input className="ltr" value={regionForm.nameEn} onChange={(event) => setRegionForm({ ...regionForm, nameEn: event.target.value })} placeholder="Jabal Al-Hadid" required />
              </Field>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        open={!!aliasFor}
        size="narrow"
        title={aliasFor ? `اسم بديل لـ «${aliasFor.name_ar}»` : ''}
        onClose={() => setAliasFor(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setAliasFor(null)}>
              إلغاء
            </Button>
            <Button type="submit" form="alias-form" loading={saving} disabled={aliasName.trim().length < 3}>
              إضافة
            </Button>
          </>
        }
      >
        <form id="alias-form" className="stack" onSubmit={saveAlias}>
          <Field label="الاسم البديل" hint="طريقة أخرى يكتب بها الناس اسم هذه المنطقة، مثل «خريبة السوق» للمنطقة «خربة السوق».">
            <Input value={aliasName} onChange={(event) => setAliasName(event.target.value)} autoFocus required />
          </Field>
        </form>
      </Modal>
    </div>
  );
}
