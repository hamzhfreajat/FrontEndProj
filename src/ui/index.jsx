/**
 * The building blocks every page uses. They carry the panel's behaviour as well as its look:
 * loading and empty states, confirmation before destructive actions, tables that turn into
 * cards on a phone.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Inbox as InboxIcon, Loader2, RefreshCw, Search, X, XCircle,
} from 'lucide-react';

const cx = (...names) => names.filter(Boolean).join(' ');

/** A list that is always the same object, for `data || EMPTY` in places where identity matters (memo dependencies). */
export const EMPTY = Object.freeze([]);

// ------------------------------------------------------------------ Formatting

const numberFormat = new Intl.NumberFormat('en-US');

/** 12345 -> "12,345". Empty values become a dash. */
export const formatNumber = (value) => (value === null || value === undefined || value === '' || Number.isNaN(Number(value)) ? '—' : numberFormat.format(Number(value)));

/** A price in dinars, without decimals when there are none. */
export const formatPrice = (value) => (value === null || value === undefined || value === '' ? '—' : `${numberFormat.format(Number(value))} د.أ`);

/** "2026-10-08 14:30", in the admin's own time zone. */
export function formatDate(value, withTime = true) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const pad = (n) => String(n).padStart(2, '0');
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return withTime ? `${day} ${pad(date.getHours())}:${pad(date.getMinutes())}` : day;
}

/** "منذ 5 دقائق" for recent moments, the date for older ones. */
export function timeAgo(value) {
  if (!value) return '—';
  const date = new Date(value);
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (Number.isNaN(seconds)) return '—';
  if (seconds < 60) return 'الآن';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `منذ ${minutes} د`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `منذ ${hours} س`;
  const days = Math.round(hours / 24);
  if (days < 30) return `منذ ${days} يوم`;
  return formatDate(value, false);
}

/** Saves rows as a CSV file that opens correctly in Excel with Arabic text. */
export function downloadCsv(filename, columns, rows) {
  const escape = (value) => {
    const text = value === null || value === undefined ? '' : String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const lines = [columns.map((column) => escape(column.label)).join(',')];
  rows.forEach((row) => lines.push(columns.map((column) => escape(column.value(row))).join(',')));
  const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

// --------------------------------------------------------------------- Basics

export function Button({ variant = 'primary', size, icon: Icon, loading, block, className, children, ...props }) {
  const iconOnly = !children;
  return (
    <button
      type="button"
      {...props}
      disabled={props.disabled || loading}
      className={cx(
        'btn',
        variant !== 'primary' && `btn-${variant}`,
        size && `btn-${size}`,
        iconOnly && 'btn-icon',
        block && 'btn-block',
        className,
      )}
    >
      {loading ? <Loader2 size={16} className="spin" /> : Icon ? <Icon size={size === 'sm' ? 15 : 16} /> : null}
      {children && <span>{children}</span>}
    </button>
  );
}

export function Badge({ tone, dot, children }) {
  return <span className={cx('badge', tone, dot && 'badge-dot')}>{children}</span>;
}

export function Card({ title, subtitle, actions, footer, flush, className, children }) {
  return (
    <section className={cx('card', className)}>
      {(title || actions) && (
        <header className="card-head">
          <div>
            {title && <h2>{title}</h2>}
            {subtitle && <p>{subtitle}</p>}
          </div>
          {actions && <div className="row">{actions}</div>}
        </header>
      )}
      {flush ? children : <div className="card-body">{children}</div>}
      {footer && <footer className="card-foot">{footer}</footer>}
    </section>
  );
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {children && <div className="page-header-actions">{children}</div>}
    </div>
  );
}

export function Stat({ icon: Icon, tone, label, value, hint, hintTone }) {
  return (
    <div className="stat">
      {Icon && (
        <div className={cx('stat-icon', tone)}>
          <Icon size={20} />
        </div>
      )}
      <div className="grow">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        {hint && <div className={cx('stat-hint', hintTone)}>{hint}</div>}
      </div>
    </div>
  );
}

export function Field({ label, hint, error, className, children }) {
  return (
    <label className={cx('field', className)}>
      {label && <span className="field-label">{label}</span>}
      {children}
      {error ? <span className="field-error">{error}</span> : hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  );
}

export const Input = React.forwardRef(({ className, ...props }, ref) => <input ref={ref} {...props} className={cx('input', className)} />);
export const Textarea = ({ className, ...props }) => <textarea {...props} className={cx('textarea', className)} />;
export const Select = ({ className, children, ...props }) => (
  <select {...props} className={cx('select', className)}>
    {children}
  </select>
);

export function Switch({ checked, onChange, disabled, label }) {
  return (
    <span className="switch" title={label}>
      <input type="checkbox" checked={!!checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} aria-label={label} />
      <span />
    </span>
  );
}

export function SearchInput({ value, onChange, onSubmit, placeholder = 'بحث...', ...props }) {
  return (
    <div className="search">
      <Search size={16} />
      <input
        {...props}
        type="search"
        className="input"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && onSubmit) onSubmit(event.target.value);
        }}
      />
    </div>
  );
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((tab) => (
        <button key={tab.value} type="button" role="tab" aria-selected={value === tab.value} className={cx('tab', value === tab.value && 'active')} onClick={() => onChange(tab.value)}>
          {tab.icon && <tab.icon size={16} />}
          {tab.label}
          {tab.count !== undefined && tab.count !== null && <span className="tab-count">{formatNumber(tab.count)}</span>}
        </button>
      ))}
    </div>
  );
}

export function Alert({ tone, icon: Icon = AlertTriangle, children }) {
  return (
    <div className={cx('alert', tone)} role="status">
      <Icon size={17} />
      <div>{children}</div>
    </div>
  );
}

// --------------------------------------------------------------------- States

export function Loading({ label = 'جاري التحميل...' }) {
  return (
    <div className="state">
      <Loader2 size={26} className="spin" />
      <span>{label}</span>
    </div>
  );
}

export function EmptyState({ icon: Icon = InboxIcon, title = 'لا توجد بيانات', description, children }) {
  return (
    <div className="state">
      <div className="state-icon">
        <Icon size={24} />
      </div>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {children}
    </div>
  );
}

export function ErrorState({ message = 'تعذّر تحميل البيانات.', onRetry }) {
  return (
    <div className="state is-error">
      <div className="state-icon">
        <XCircle size={24} />
      </div>
      <h3>حدث خطأ</h3>
      <p>{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" icon={RefreshCw} onClick={onRetry}>
          إعادة المحاولة
        </Button>
      )}
    </div>
  );
}

export function SkeletonRows({ rows = 6, columns = 4 }) {
  return (
    <div className="card-body stack-sm" aria-hidden="true">
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="row" style={{ flexWrap: 'nowrap' }}>
          {Array.from({ length: columns }).map((__, column) => (
            <div key={column} className="skeleton" style={{ height: 14, flex: column === 0 ? 2 : 1 }} />
          ))}
        </div>
      ))}
    </div>
  );
}

// ------------------------------------------------------------------- Dialogs

export function Modal({ open, title, size, onClose, footer, children }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className={cx('dialog', size && `is-${size}`)} role="dialog" aria-modal="true" aria-label={title}>
        <div className="dialog-head">
          <h2>{title}</h2>
          <Button variant="ghost" size="sm" icon={X} onClick={onClose} aria-label="إغلاق" />
        </div>
        <div className="dialog-body">{children}</div>
        {footer && <div className="dialog-foot">{footer}</div>}
      </div>
    </div>
  );
}

const FeedbackContext = createContext(null);

/**
 * Gives every page `toast(message)` and `confirm({...})`. `confirm` returns a promise that
 * resolves to true when the admin agrees, so a destructive action reads:
 *   if (await confirm({ title: 'حذف الإعلان؟', danger: true })) { ... }
 */
export function FeedbackProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [question, setQuestion] = useState(null);
  const resolver = useRef(null);

  const toast = useCallback((message, type = 'success') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((list) => [...list, { id, message, type }]);
    setTimeout(() => setToasts((list) => list.filter((item) => item.id !== id)), 4200);
  }, []);

  const confirm = useCallback(
    (options) =>
      new Promise((resolve) => {
        resolver.current = resolve;
        setQuestion(options);
      }),
    [],
  );

  const answer = (value) => {
    if (resolver.current) resolver.current(value);
    resolver.current = null;
    setQuestion(null);
  };

  const value = useMemo(() => ({ toast, confirm }), [toast, confirm]);

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <Modal
        open={!!question}
        size="narrow"
        title={(question && question.title) || 'تأكيد'}
        onClose={() => answer(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => answer(false)}>
              {(question && question.cancelLabel) || 'إلغاء'}
            </Button>
            <Button variant={question && question.danger ? 'danger' : 'primary'} onClick={() => answer(true)} autoFocus>
              {(question && question.confirmLabel) || 'تأكيد'}
            </Button>
          </>
        }
      >
        <p>{question && question.message}</p>
      </Modal>
      <div className="toasts" aria-live="polite">
        {toasts.map((item) => (
          <div key={item.id} className={cx('toast', item.type)}>
            {item.type === 'error' ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
            <span>{item.message}</span>
          </div>
        ))}
      </div>
    </FeedbackContext.Provider>
  );
}

export const useFeedback = () => useContext(FeedbackContext);

// -------------------------------------------------------------------- Tables

export function Pagination({ page, pageSize, total, onPage }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <div className="pagination">
      <span>
        {formatNumber(from)}–{formatNumber(to)} من {formatNumber(total)}
      </span>
      <div className="pagination-pages">
        <Button variant="secondary" size="sm" icon={ChevronRight} disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="السابق" />
        <span className="num">
          {page} / {pages}
        </span>
        <Button variant="secondary" size="sm" icon={ChevronLeft} disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="التالي" />
      </div>
    </div>
  );
}

/**
 * A table with sorting, paging and its own loading / empty / error states.
 *
 * columns: [{ key, label, render(row), sort(row) -> comparable, primary, align, hideMobile }]
 * On a phone each row becomes a card: the "primary" column is shown as the card's title and
 * the others as "name: value" lines.
 *
 * Paging happens in the browser unless `serverPaging` ({ page, pageSize, total, onPage }) is given.
 */
export function DataTable({
  columns, rows, rowKey = 'id', loading, error, onRetry, empty, pageSize = 25, serverPaging, onRowClick, initialSort,
}) {
  const [sort, setSort] = useState(initialSort || null);
  const [page, setPage] = useState(1);

  const sorted = useMemo(() => {
    if (!rows) return [];
    if (!sort) return rows;
    const column = columns.find((item) => item.key === sort.key);
    if (!column || !column.sort) return rows;
    const direction = sort.dir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const left = column.sort(a);
      const right = column.sort(b);
      if (left === right) return 0;
      if (left === null || left === undefined) return 1;
      if (right === null || right === undefined) return -1;
      return (left > right ? 1 : -1) * direction;
    });
  }, [rows, sort, columns]);

  const rowCount = rows ? rows.length : 0;
  useEffect(() => {
    setPage(1);
  }, [rowCount]);

  if (loading && (!rows || rows.length === 0)) return <SkeletonRows columns={Math.min(columns.length, 5)} />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (!rows || rows.length === 0) return empty || <EmptyState />;

  const visible = serverPaging ? sorted : sorted.slice((page - 1) * pageSize, page * pageSize);
  const keyOf = (row, index) => (typeof rowKey === 'function' ? rowKey(row) : row[rowKey] !== undefined ? row[rowKey] : index);

  const toggleSort = (column) => {
    if (!column.sort) return;
    setSort((current) => (current && current.key === column.key ? (current.dir === 'asc' ? { key: column.key, dir: 'desc' } : null) : { key: column.key, dir: 'asc' }));
  };

  return (
    <>
      <div className="table-wrap">
        <table className="table is-stack">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key} className={cx(column.sort && 'sortable', column.actions && 'col-actions')} onClick={() => toggleSort(column)}>
                  {column.label}
                  {sort && sort.key === column.key && <span className="sort-mark">{sort.dir === 'asc' ? '↑' : '↓'}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((row, index) => (
              <tr key={keyOf(row, index)} className={cx(onRowClick && 'is-clickable')} onClick={onRowClick ? () => onRowClick(row) : undefined}>
                {columns.map((column) => (
                  <td
                    key={column.key}
                    data-label={column.actions || column.primary ? '' : column.label}
                    className={cx(column.primary && 'col-primary', column.actions && 'col-actions', column.hideMobile && 'hide-mobile')}
                    onClick={column.actions ? (event) => event.stopPropagation() : undefined}
                  >
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {serverPaging ? <Pagination {...serverPaging} /> : <Pagination page={page} pageSize={pageSize} total={sorted.length} onPage={setPage} />}
    </>
  );
}

// ---------------------------------------------------------------------- Data

/**
 * Loads data for a page: `{ data, loading, error, reload }`.
 * `load` is called again whenever a value in `deps` changes.
 */
export function useLoad(load, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const latest = useRef(0);

  const run = useCallback(() => {
    const ticket = ++latest.current;
    setState((current) => ({ ...current, loading: true, error: null }));
    Promise.resolve()
      .then(load)
      .then((data) => {
        if (ticket === latest.current) setState({ data, loading: false, error: null });
      })
      .catch((error) => {
        if (ticket !== latest.current) return;
        const detail = error && error.response && error.response.data && error.response.data.detail;
        setState({ data: null, loading: false, error: typeof detail === 'string' ? detail : 'تعذّر تحميل البيانات.' });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(run, [run]);

  return { ...state, reload: run };
}

/** Bars for a short series, e.g. ads per day. `points`: [{ label, value }] */
export function BarChart({ points, format = formatNumber }) {
  if (!points || points.length === 0) return <EmptyState title="لا توجد بيانات كافية" />;
  const max = Math.max(1, ...points.map((point) => point.value));
  const step = Math.ceil(points.length / 8);
  return (
    <div>
      <div className="bars">
        {points.map((point) => (
          <div key={point.label} className="bar" style={{ height: `${Math.max(2, (point.value / max) * 100)}%` }} title={`${point.label}: ${format(point.value)}`} />
        ))}
      </div>
      <div className="bar-labels">
        {points.map((point, index) => (
          <span key={point.label}>{index % step === 0 ? point.short || point.label : ''}</span>
        ))}
      </div>
    </div>
  );
}

/** A ranked list with a bar behind each value. `items`: [{ label, value }] */
export function MeterList({ items, format = formatNumber }) {
  if (!items || items.length === 0) return <EmptyState title="لا توجد بيانات" />;
  const max = Math.max(1, ...items.map((item) => item.value));
  return (
    <div className="meter-list">
      {items.map((item) => (
        <div key={item.label}>
          <div className="meter-head">
            <span className="truncate">{item.label}</span>
            <span className="strong num">{format(item.value)}</span>
          </div>
          <div className="meter">
            <span style={{ width: `${(item.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
