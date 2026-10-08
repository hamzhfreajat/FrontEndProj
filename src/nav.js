import {
  Activity, AlertOctagon, BellRing, Facebook, FileText, Flag, FolderTree, Gauge, Globe2, LayoutDashboard,
  Link2, MapPin, MapPinned, MessageSquare, PhoneOff, ScrollText, Search, SearchCheck, Settings, Star, UserPlus, Users,
} from 'lucide-react';

/**
 * The panel's pages, grouped the way an admin thinks about the work: what is on the
 * site, who uses it, where the ads come from, how it is performing, and the system itself.
 * The sidebar, the page title in the top bar and the routes are all built from this list.
 */
export const NAV_GROUPS = [
  {
    title: 'الرئيسية',
    items: [{ path: '/', name: 'نظرة عامة', icon: LayoutDashboard, exact: true }],
  },
  {
    title: 'المحتوى',
    items: [
      { path: '/ads', name: 'الإعلانات', icon: FileText },
      { path: '/categories', name: 'الأقسام', icon: FolderTree },
      { path: '/reviews', name: 'التقييمات', icon: Star },
      { path: '/reports', name: 'البلاغات', icon: Flag },
    ],
  },
  {
    title: 'المستخدمون',
    items: [
      { path: '/users', name: 'المستخدمون', icon: Users },
      { path: '/inbox', name: 'رسائل الدعم', icon: MessageSquare, badge: 'inbox' },
      { path: '/send-notification', name: 'إرسال إشعار', icon: BellRing },
      { path: '/blocked-numbers', name: 'الأرقام المحظورة', icon: PhoneOff },
    ],
  },
  {
    title: 'المواقع',
    items: [
      { path: '/locations-manager', name: 'المدن والمناطق', icon: MapPinned },
      { path: '/change-ads-location', name: 'تصحيح مواقع الإعلانات', icon: MapPin },
    ],
  },
  {
    title: 'فيسبوك والسحب',
    items: [
      { path: '/seekers', name: 'طلبات العقارات', icon: SearchCheck },
      { path: '/saved-groups', name: 'مجموعات فيسبوك', icon: Link2 },
      { path: '/facebook-autopost', name: 'النشر على فيسبوك', icon: Facebook },
      { path: '/scraping-logs', name: 'سجل السحب', icon: ScrollText },
    ],
  },
  {
    title: 'التحليلات',
    items: [
      { path: '/user-analytics', name: 'تسجيل المستخدمين', icon: UserPlus },
      { path: '/user-tracking', name: 'سلوك المستخدمين', icon: Activity },
      { path: '/geo-analytics', name: 'الإعلانات حسب المنطقة', icon: Globe2 },
      { path: '/searches', name: 'عمليات البحث', icon: Search },
      { path: '/api-hits', name: 'استهلاك الواجهة البرمجية', icon: Gauge },
    ],
  },
  {
    title: 'النظام',
    items: [
      { path: '/errors', name: 'سجل الأخطاء', icon: AlertOctagon },
      { path: '/app-settings', name: 'إعدادات التطبيق', icon: Settings },
    ],
  },
];

export const NAV_ITEMS = NAV_GROUPS.reduce((all, group) => all.concat(group.items.map((item) => ({ ...item, group: group.title }))), []);

/** The nav entry a URL belongs to (the longest matching path wins). */
export function currentItem(pathname) {
  return (
    NAV_ITEMS.filter((item) => (item.exact ? pathname === item.path : pathname === item.path || pathname.startsWith(`${item.path}/`))).sort(
      (a, b) => b.path.length - a.path.length,
    )[0] || null
  );
}
