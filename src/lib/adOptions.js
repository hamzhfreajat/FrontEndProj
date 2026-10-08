/**
 * The choices offered when an ad's details are edited. They are the same wordings the
 * mobile app saves, so an ad edited here still matches the app's filters.
 */
export const ROOMS = ['ستوديو', '1', '2', '3', '4', '5', '6+'];
export const BATHS = ['1', '2', '3', '4', '5', '6+'];
export const FURNISHED = ['مفروش (فرش كامل / فرش فندقي)', 'شبه مفروش (مطبخ أو أجهزة فقط)', 'فارغ', 'جديد لم يسكن / بناء حديث'];
export const FLOOR = ['طابق تسوية (معلقة / مهوية)', 'طابق أرضي / شبه أرضي', 'طوابق علوية (أول، ثاني، إلخ)', 'أخير مع رووف'];
export const AGE = ['0 - 11 شهر', '1 - 5 سنوات', '6 - 9 سنوات', '10 - 19 سنوات', '20+ سنة'];
export const RENT_DURATION = ['يومي', 'أسبوعي', 'شهري', 'سنوي'];
export const VIEW = ['شمالية', 'جنوبية', 'شرقية', 'غربية', 'شمالية شرقية', 'شمالية غربية', 'جنوبية شرقية', 'جنوبية غربية'];

export const KEY_FEATURES = [
  'تكييف / مكيفات إنفيرتر', 'تدفئة (مركزية / غاز)', 'شرفة / بلكونة', 'غرفة خادمة / غرفة غسيل',
  'خزائن حائط', 'زجاج دبل جلاس / أباجورات كهرباء', 'سخان شمسي / كيزر', 'نقطة شحن سيارة كهربائية',
];
export const ADDITIONAL_FEATURES = [
  'مصعد', 'حديقة', 'كراج خاص / موقف سيارة', 'حارس عمارة', 'كاميرات مراقبة / إنتركم',
  'مطبخ راكب (أمريكي أو منفصل)', 'بلكونة / ترس خارجي', 'منطقة شواء', 'نظام كهرباء احتياطي للطوارئ', 'تسهيلات لأصحاب الهمم',
];
export const NEARBY = [
  'بنك / صراف الآلي', 'دراي كلين', 'سوبر ماركت', 'صالة رياضية / جيم', 'صيدلية', 'محطة باصات',
  'مدرسة', 'مستشفى', 'مسجد', 'مطعم', 'موقف سيارات', 'مول / مركز تسوق',
];
export const TARGET_AUDIENCE = ['عائلات', 'عرسان / عائلة صغيرة', 'طلاب / طالبات', 'موظفين'];
export const PAYMENT_METHOD = [
  'من المالك مباشرة (بدون عمولة)', 'مكتب عقاري (تضاف عمولة)', 'الدفع شهري / الدفع سنوي / دفعات', 'إيجار يومي', 'تقسيط', 'السعر نهائي / قابل للتفاوض',
];

/** Fields that live in the ad's nested "real_estate_detail" object. */
export const REAL_ESTATE_FIELDS = [
  'bathrooms', 'furnished', 'build_area', 'floor', 'building_age', 'rent_duration', 'view_orientation', 'key_features', 'additional_features', 'nearby_locations',
];

export const DUPLICATE_STATUS = {
  ACCEPTED: { label: 'مقبول', tone: 'green' },
  FLAGGED_FOR_REVIEW: { label: 'للمراجعة', tone: 'amber' },
  REJECTED_DUPLICATE: { label: 'مكرر مرفوض', tone: 'red' },
};

/** Facebook's image host refuses requests from other sites, so those go through an image proxy. */
export const proxied = (url) => (!url ? '' : url.includes('fbcdn.net') ? `https://wsrv.nl/?url=${encodeURIComponent(url)}` : url);

/** Every photo of an ad. Older ads keep one address, or a JSON list, in "image_url". */
export function adImages(ad) {
  if (!ad) return [];
  if (Array.isArray(ad.image_urls) && ad.image_urls.length > 0) return ad.image_urls.map(proxied);
  if (!ad.image_url) return [];
  try {
    const parsed = JSON.parse(ad.image_url);
    if (Array.isArray(parsed)) return parsed.map(proxied);
  } catch (error) {
    // A plain address, not a JSON list
  }
  return [proxied(ad.image_url)];
}
