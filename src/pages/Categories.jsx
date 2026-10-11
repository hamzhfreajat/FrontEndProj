import React, { useEffect, useMemo, useState } from 'react';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import { ChevronDown, ChevronLeft, Folder, FolderTree, GripVertical, Pencil, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import { API_URL, api, errorMessage } from '../lib/api';
import { Alert, Badge, Button, Card, EmptyState, ErrorState, Field, Input, Modal, PageHeader, Select, SkeletonRows, formatNumber, useFeedback } from '../ui';

const DEFAULT_COLOR = '#1557f5';
// Sub-sections can be added down to this depth (0 is a main section)
const MAX_ADD_DEPTH = 2;
const BLANK = { name: '', icon_name: '', color_hex: DEFAULT_COLOR, tag: '', parent_id: '', tags: [] };

const byOrder = (a, b) => (a.order_index || 0) - (b.order_index || 0);
const isImage = (icon) => /^(https?:|\/|data:)/.test(icon || '');
const imageUrl = (icon) => (icon.startsWith('/') ? `${(API_URL || '').replace(/\/api$/, '')}${icon}` : icon);

function CategoryIcon({ node }) {
  const style = node.color_hex ? { background: `${node.color_hex}1f`, color: node.color_hex } : undefined;
  return (
    <span className="tree-icon" style={style}>
      {isImage(node.icon_name) ? (
        <img src={imageUrl(node.icon_name)} alt="" />
      ) : node.icon_name ? (
        // Some sections carry an emoji, others the name of a Material icon ("apartment")
        <span className={/^[a-z0-9_]+$/.test(node.icon_name) ? 'material-icons' : undefined} style={{ fontSize: 18 }}>
          {node.icon_name}
        </span>
      ) : (
        <Folder size={17} />
      )}
    </span>
  );
}

/** The search words of a section: typed one at a time, with the words other sections already use offered. */
function TagsInput({ value, onChange, known }) {
  const [text, setText] = useState('');
  const suggestions = text.trim() ? known.filter((tag) => tag.toLowerCase().includes(text.trim().toLowerCase()) && !value.includes(tag)).slice(0, 5) : [];

  const add = (raw) => {
    const tag = raw.trim();
    if (tag && !value.includes(tag)) onChange([...value, tag]);
    setText('');
  };

  return (
    <div style={{ position: 'relative' }}>
      <div className="tag-input">
        {value.map((tag) => (
          <span key={tag} className="tag-pill">
            {tag}
            <button type="button" onClick={() => onChange(value.filter((item) => item !== tag))} aria-label={`حذف ${tag}`}>
              <X size={13} />
            </button>
          </span>
        ))}
        <input
          value={text}
          placeholder={value.length === 0 ? 'اكتب كلمة ثم Enter' : ''}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              add(text);
            }
          }}
        />
      </div>
      {suggestions.length > 0 && (
        <div className="suggest">
          {suggestions.map((tag) => (
            <button key={tag} type="button" onClick={() => add(tag)}>
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Categories() {
  const { toast, confirm } = useFeedback();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(() => new Set());
  const [fetched, setFetched] = useState(() => new Set());
  // null when closed; { mode: 'add', parentId } or { mode: 'edit', id }
  const [dialog, setDialog] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);

  /** Loads one level: the main sections (parentId null) or the sub-sections of one section. */
  const load = async (parentId = null) => {
    if (parentId === null) {
      setLoading(true);
      setError(null);
    }
    try {
      const { data } = await api.get('/categories', { params: { parent_id: parentId === null ? 'null' : parentId } });
      const ids = new Set(data.map((item) => item.id));
      setCategories((current) => [...current.filter((item) => !ids.has(item.id)), ...data]);
      setFetched((current) => new Set(current).add(parentId));
    } catch (failure) {
      if (parentId === null) setError(errorMessage(failure, 'تعذّر تحميل الأقسام.'));
      else toast(errorMessage(failure, 'تعذّر تحميل الأقسام الفرعية.'), 'error');
    } finally {
      if (parentId === null) setLoading(false);
    }
  };

  useEffect(() => {
    load(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reload = () => {
    setCategories([]);
    setExpanded(new Set());
    setFetched(new Set());
    load(null);
  };

  const childrenOf = (parentId) => categories.filter((item) => (item.parent_id || null) === parentId).sort(byOrder);
  const knownTags = useMemo(() => [...new Set(categories.flatMap((item) => (item.linked_tags || []).map((tag) => tag.name)))], [categories]);

  const toggle = (id) => {
    const next = new Set(expanded);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
      if (!fetched.has(id)) load(id);
    }
    setExpanded(next);
  };

  const openAdd = (parentId = null) => {
    setForm({ ...BLANK, parent_id: parentId || '' });
    setDialog({ mode: 'add', parentId });
  };

  const openEdit = (category) => {
    setForm({
      name: category.name || '',
      icon_name: category.icon_name || '',
      color_hex: category.color_hex || DEFAULT_COLOR,
      tag: category.tag || '',
      parent_id: category.parent_id || '',
      tags: (category.linked_tags || []).map((tag) => tag.name),
    });
    setDialog({ mode: 'edit', id: category.id });
  };

  const save = async (event) => {
    event.preventDefault();
    const payload = {
      name: form.name.trim(),
      icon_name: form.icon_name.trim() || null,
      color_hex: form.color_hex || null,
      tag: form.tag.trim() || null,
      parent_id: form.parent_id ? Number(form.parent_id) : null,
      linked_tags: form.tags,
    };
    setSaving(true);
    try {
      if (dialog.mode === 'add') {
        const { data } = await api.post('/categories', payload);
        setCategories((current) => [...current, data]);
        if (data.parent_id && !expanded.has(data.parent_id)) toggle(data.parent_id);
        toast('أُضيف القسم');
      } else {
        const { data } = await api.put(`/categories/${dialog.id}`, payload);
        setCategories((current) => current.map((item) => (item.id === data.id ? data : item)));
        toast('حُفظت التعديلات');
      }
      setDialog(null);
    } catch (failure) {
      toast(errorMessage(failure, 'تعذّر حفظ القسم.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (category) => {
    if (categories.some((item) => item.parent_id === category.id)) {
      toast('هذا القسم فيه أقسام فرعية. احذفها أولاً.', 'error');
      return;
    }
    const agreed = await confirm({
      title: 'حذف القسم؟',
      message: `سيُحذف قسم «${category.name}» نهائياً، ولا يمكن التراجع.`,
      confirmLabel: 'حذف',
      danger: true,
    });
    if (!agreed) return;
    try {
      await api.delete(`/categories/${category.id}`);
      setCategories((current) => current.filter((item) => item.id !== category.id));
      toast('حُذف القسم');
    } catch (failure) {
      toast(errorMessage(failure, 'تعذّر حذف القسم. قد يكون فيه أقسام فرعية أو إعلانات.'), 'error');
    }
  };

  /** Moving a section: a new place among its siblings, or under another section. */
  const onDragEnd = async ({ destination, draggableId }) => {
    if (!destination) return;
    const target = destination.droppableId.replace('level-', '');
    const newParent = target === 'root' ? null : Number(target);
    const id = Number(draggableId);
    const moved = categories.find((item) => item.id === id);
    if (!moved) return;

    const isInside = (candidate, ancestor) => {
      if (candidate === ancestor) return true;
      const node = categories.find((item) => item.id === candidate);
      return node && node.parent_id ? isInside(node.parent_id, ancestor) : false;
    };
    if (newParent && isInside(newParent, id)) {
      toast('لا يمكن نقل قسم إلى داخل أحد فروعه.', 'error');
      return;
    }

    const before = categories;
    const siblings = childrenOf(newParent).filter((item) => item.id !== id);
    siblings.splice(destination.index, 0, moved);
    const order = new Map(siblings.map((item, index) => [item.id, index]));
    const parentChanged = (moved.parent_id || null) !== newParent;

    setCategories(before.map((item) => (order.has(item.id) ? { ...item, order_index: order.get(item.id), parent_id: item.id === id ? newParent : item.parent_id } : item)));
    if (newParent) setExpanded((current) => new Set(current).add(newParent));

    try {
      if (parentChanged) await api.put(`/categories/${id}`, { parent_id: newParent });
      await api.put('/categories/reorder', siblings.map((item, index) => ({ id: item.id, order_index: index })));
    } catch (failure) {
      setCategories(before);
      toast(errorMessage(failure, 'تعذّر نقل القسم. أُعيد إلى مكانه.'), 'error');
    }
  };

  const renderNode = (node, depth, index) => {
    const open = expanded.has(node.id);
    const children = childrenOf(node.id);
    const mayHaveChildren = children.length > 0 || !fetched.has(node.id);
    return (
      <Draggable key={node.id} draggableId={String(node.id)} index={index}>
        {(drag, state) => (
          <div ref={drag.innerRef} {...drag.draggableProps} className={`tree-node${depth === 0 ? ' is-root' : ''}${state.isDragging ? ' is-dragging' : ''}`}>
            <div className="tree-row" onClick={() => toggle(node.id)}>
              <span {...drag.dragHandleProps} className="tree-grip" title="اسحب لإعادة الترتيب" onClick={(event) => event.stopPropagation()}>
                <GripVertical size={16} />
              </span>
              <span className="tree-toggle">{mayHaveChildren ? open ? <ChevronDown size={17} /> : <ChevronLeft size={17} /> : null}</span>
              <CategoryIcon node={node} />
              <span className="tree-name truncate">{node.name}</span>
              {node.tag && <Badge tone="blue">{node.tag}</Badge>}
              <span className="cell-sub num hide-mobile">#{node.id}</span>
              <span className="tree-actions" onClick={(event) => event.stopPropagation()}>
                {depth < MAX_ADD_DEPTH && <Button variant="ghost" size="sm" icon={Plus} title="إضافة قسم فرعي" aria-label="إضافة قسم فرعي" onClick={() => openAdd(node.id)} />}
                <Button variant="ghost" size="sm" icon={Pencil} title="تعديل" aria-label="تعديل" onClick={() => openEdit(node)} />
                <Button variant="ghost" size="sm" icon={Trash2} title="حذف" aria-label="حذف" onClick={() => remove(node)} />
              </span>
            </div>
            {(open || state.isDragging) && (
              <Droppable droppableId={`level-${node.id}`} type="category">
                {(drop, dropState) => (
                  <div ref={drop.innerRef} {...drop.droppableProps} className={`tree-children${dropState.isDraggingOver ? ' is-over' : ''}`}>
                    {children.map((child, childIndex) => renderNode(child, depth + 1, childIndex))}
                    {open && fetched.has(node.id) && children.length === 0 && <div className="cell-sub" style={{ padding: '6px 10px' }}>لا توجد أقسام فرعية</div>}
                    {drop.placeholder}
                  </div>
                )}
              </Droppable>
            )}
          </div>
        )}
      </Draggable>
    );
  };

  const roots = childrenOf(null);
  // A section three levels down has a parent the list below does not offer; without this its parent would be lost on save
  const listed = new Set(roots.flatMap((root) => [root.id, ...childrenOf(root.id).map((child) => child.id)]));
  const deepParent = form.parent_id && !listed.has(Number(form.parent_id)) ? categories.find((item) => item.id === Number(form.parent_id)) : null;
  const parent = dialog && dialog.mode === 'add' && dialog.parentId ? categories.find((item) => item.id === dialog.parentId) : null;

  return (
    <div className="stack">
      <PageHeader title="الأقسام" subtitle="شجرة أقسام الموقع والتطبيق. أي تغيير هنا يظهر للمستخدمين مباشرة.">
        <Button variant="secondary" icon={RefreshCw} loading={loading} onClick={reload}>
          تحديث
        </Button>
        <Button icon={Plus} onClick={() => openAdd(null)}>
          قسم رئيسي
        </Button>
      </PageHeader>

      <Alert icon={FolderTree}>اضغط على قسم لعرض فروعه. اسحب القسم من المقبض لتغيير ترتيبه أو لنقله إلى قسم آخر مفتوح.</Alert>

      <Card title="شجرة الأقسام" subtitle={loading ? undefined : `${formatNumber(roots.length)} قسم رئيسي`} flush>
        {error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : loading ? (
          <SkeletonRows rows={6} columns={3} />
        ) : roots.length === 0 ? (
          <EmptyState icon={FolderTree} title="لا توجد أقسام بعد">
            <Button size="sm" icon={Plus} onClick={() => openAdd(null)}>
              إضافة أول قسم
            </Button>
          </EmptyState>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="level-root" type="category">
              {(drop, dropState) => (
                <div ref={drop.innerRef} {...drop.droppableProps} className={`tree${dropState.isDraggingOver ? ' is-over' : ''}`}>
                  {roots.map((node, index) => renderNode(node, 0, index))}
                  {drop.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </Card>

      <Modal
        open={!!dialog}
        title={dialog && dialog.mode === 'edit' ? 'تعديل القسم' : parent ? `قسم فرعي في «${parent.name}»` : 'قسم جديد'}
        onClose={() => setDialog(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDialog(null)}>
              إلغاء
            </Button>
            <Button type="submit" form="category-form" loading={saving}>
              {dialog && dialog.mode === 'edit' ? 'حفظ التعديلات' : 'إضافة القسم'}
            </Button>
          </>
        }
      >
        <form id="category-form" className="form-grid" onSubmit={save}>
          <Field label="اسم القسم" className="span-2">
            <Input required autoFocus value={form.name} placeholder="مثال: شقق للإيجار" onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </Field>
          <Field
            label="الأيقونة"
            hint={
              <>
                رمز تعبيري (🏠)، أو اسم أيقونة من{' '}
                <a href="https://fonts.google.com/icons" target="_blank" rel="noreferrer">
                  Material Icons
                </a>{' '}
                أو رابط صورة
              </>
            }
          >
            <Input value={form.icon_name} placeholder="🏠" onChange={(event) => setForm({ ...form, icon_name: event.target.value })} />
          </Field>
          <Field label="لون الأيقونة">
            <div className="row" style={{ flexWrap: 'nowrap' }}>
              <input type="color" className="color-input" value={form.color_hex || DEFAULT_COLOR} onChange={(event) => setForm({ ...form, color_hex: event.target.value })} aria-label="اختيار اللون" />
              <Input className="ltr" value={form.color_hex} placeholder={DEFAULT_COLOR} onChange={(event) => setForm({ ...form, color_hex: event.target.value })} />
            </div>
          </Field>
          <Field label="شارة تظهر بجانب الاسم" hint="اختياري، مثل «الأكثر طلباً»">
            <Input value={form.tag} onChange={(event) => setForm({ ...form, tag: event.target.value })} />
          </Field>
          <Field label="يتبع القسم">
            <Select value={form.parent_id} onChange={(event) => setForm({ ...form, parent_id: event.target.value })}>
              <option value="">قسم رئيسي (لا يتبع قسماً)</option>
              {deepParent && <option value={deepParent.id}>{deepParent.name}</option>}
              {roots.map((root) => (
                <React.Fragment key={root.id}>
                  <option value={root.id} disabled={dialog && dialog.id === root.id}>
                    {root.name}
                  </option>
                  {childrenOf(root.id).map((child) => (
                    <option key={child.id} value={child.id} disabled={dialog && dialog.id === child.id}>
                      {'   ↳ '}
                      {child.name}
                    </option>
                  ))}
                </React.Fragment>
              ))}
            </Select>
          </Field>
          {/* Not a <label>: a click on its text would press the first tag's remove button */}
          <div className="field span-2">
            <span className="field-label">كلمات البحث</span>
            <TagsInput value={form.tags} onChange={(tags) => setForm({ ...form, tags })} known={knownTags} />
            <span className="field-hint">كلمات يجد بها المستخدم هذا القسم عند البحث</span>
          </div>
        </form>
      </Modal>
    </div>
  );
}
