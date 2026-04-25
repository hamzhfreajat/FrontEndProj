import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Folder, ChevronRight, ChevronDown, List, Plus, Edit2, Trash2, GripVertical, CheckCircle, XCircle } from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
const API_HEADERS = {
    'ngrok-skip-browser-warning': 'true',
    'Bypass-Tunnel-Reminder': 'true',
    'Content-Type': 'application/json'
};

export default function Categories() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedIds, setExpandedIds] = useState(new Set());
    const [fetchedParentIds, setFetchedParentIds] = useState(new Set());

    // Modal & Form State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
    const [activeCategory, setActiveCategory] = useState(null); // Parent category context for 'add', selected category for 'edit'

    const [formData, setFormData] = useState({
        name: '',
        icon_name: '',
        color_hex: '',
        tag: '',
        parent_id: '',
        tags: [] // Array of tag names for the new relational Tag table
    });
    const [tagInputText, setTagInputText] = useState('');
    const [tagSuggestions, setTagSuggestions] = useState([]);

    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
    };

    // Lock body scroll when modal is open
    useEffect(() => {
        if (isModalOpen) {
            const originalOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = originalOverflow;
            };
        }
    }, [isModalOpen]);

    useEffect(() => {
        fetchCategories(null);
    }, []);

    const fetchCategories = async (parentId = null) => {
        if (parentId === null) setLoading(true);
        try {
            const queryParam = parentId === null ? '?parent_id=null' : `?parent_id=${parentId}`;
            const res = await fetch(`${API_BASE_URL}/categories${queryParam}`, { headers: { ...API_HEADERS, 'Content-Type': undefined } });
            if (res.ok) {
                const data = await res.json();

                setCategories(prev => {
                    const newIds = new Set(data.map(d => d.id));
                    const filteredPrev = prev.filter(c => !newIds.has(c.id));
                    return [...filteredPrev, ...data];
                });

                setFetchedParentIds(prev => new Set(prev).add(parentId));
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            showToast('خطأ في الاتصال بالخادم لجلب الأقسام', 'error');
        } finally {
            if (parentId === null) setLoading(false);
        }
    };

    const toggleExpand = async (id) => {
        const newExpanded = new Set(expandedIds);
        let fetchesNeeded = false;
        
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
            if (!fetchedParentIds.has(id)) {
                fetchesNeeded = true;
            }
        }
        setExpandedIds(newExpanded);
        
        if (fetchesNeeded) {
            await fetchCategories(id);
        }
    };

    // --- CRUD Actions ---

    const openAddModal = (parentId = null) => {
        setModalMode('add');
        setActiveCategory(parentId); // Store the parent ID we are adding to (null if top level)
        setFormData({
            name: '',
            icon_name: '',
            color_hex: '#0075FF',
            tag: '',
            parent_id: parentId || '',
            tags: []
        });
        setTagInputText('');
        setIsModalOpen(true);
    };

    const openEditModal = (category) => {
        setModalMode('edit');
        setActiveCategory(category.id); // Store the category ID we are editing
        setFormData({
            name: category.name || '',
            icon_name: category.icon_name || '',
            color_hex: category.color_hex || '#0075FF',
            tag: category.tag || '',
            parent_id: category.parent_id || '',
            tags: category.linked_tags ? category.linked_tags.map(t => t.name) : []
        });
        setTagInputText('');
        setIsModalOpen(true);
    };

    const handleDelete = async (category) => {
        // Prevent deletion if children exist
        const hasChildren = categories.some(c => c.parent_id === category.id);
        if (hasChildren) {
            showToast('لا يمكن حذف هذا القسم لأنه يحتوي على أقسام فرعية. يرجى حذف الفروع أولاً.', 'error');
            return;
        }

        if (!window.confirm(`هل أنت متأكد من حذف قسم "${category.name}"؟ لا يمكن التراجع عن هذا الإجراء.`)) return;

        try {
            const res = await fetch(`${API_BASE_URL}/categories/${category.id}`, {
                method: 'DELETE',
                headers: { 'ngrok-skip-browser-warning': 'true', 'Bypass-Tunnel-Reminder': 'true' }
            });

            if (res.ok) {
                showToast('تم حذف القسم بنجاح', 'success');
                setCategories(categories.filter(c => c.id !== category.id));
            } else {
                showToast('فشل في حذف القسم', 'error');
            }
        } catch (error) {
            showToast('خطأ في الاتصال بالخادم', 'error');
        }
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();

        // Prepare payload mapping local tag names to backend linked_tags expected input
        const payload = {
            name: formData.name,
            icon_name: formData.icon_name || null,
            color_hex: formData.color_hex || null,
            tag: formData.tag || null,
            parent_id: formData.parent_id ? parseInt(formData.parent_id) : null,
            linked_tags: formData.tags
        };

        try {
            let res;
            if (modalMode === 'add') {
                res = await fetch(`${API_BASE_URL}/categories`, {
                    method: 'POST',
                    headers: API_HEADERS,
                    body: JSON.stringify(payload)
                });
            } else {
                res = await fetch(`${API_BASE_URL}/categories/${activeCategory}`, {
                    method: 'PUT',
                    headers: API_HEADERS,
                    body: JSON.stringify(payload)
                });
            }

            if (res.ok) {
                const savedCategory = await res.json();

                if (modalMode === 'add') {
                    setCategories([...categories, savedCategory]);
                    showToast('تم إضافة القسم بنجاح', 'success');
                    // Auto-expand the parent we just added to
                    if (savedCategory.parent_id) toggleExpand(savedCategory.parent_id);
                } else {
                    setCategories(categories.map(c => c.id === savedCategory.id ? savedCategory : c));
                    showToast('تم تعديل القسم بنجاح', 'success');
                }

                setIsModalOpen(false);
            } else {
                showToast('حدث خطأ أثناء حفظ القسم', 'error');
            }
        } catch (error) {
            console.error(error);
            showToast('خطأ في الاتصال بالخادم', 'error');
        }
    };

    // --- Drag and Drop ---

    const handleDragEnd = async (result) => {
        const { source, destination, draggableId } = result;

        // Dropped outside a valid droppable
        if (!destination) return;

        // Extract the parent ID from the droppable ID (format: "droppable-null" or "droppable-123")
        const newParentStr = destination.droppableId.replace('droppable-', '');
        const newParentId = newParentStr === 'null' ? null : parseInt(newParentStr);

        const draggedCategoryId = parseInt(draggableId);
        const draggedCategory = categories.find(c => c.id === draggedCategoryId);

        // Prevent dragging a parent into its own child (infinite loop)
        const isDescendant = (childId, parentId) => {
            if (parentId === childId) return true;
            const childCat = categories.find(c => c.id === childId);
            if (!childCat || !childCat.parent_id) return false;
            return isDescendant(childCat.parent_id, parentId);
        };

        if (newParentId && isDescendant(newParentId, draggedCategoryId)) {
            showToast('لا يمكن نقل القسم الرئيسي ليكون فرعاً من أحد أبنائه.', 'error');
            return;
        }

        // Logic for Same Parent vs Different Parent drops
        let updatedCategories = [...categories];

        // 1. Update the parent ID if it changed
        if (draggedCategory.parent_id !== newParentId) {
            updatedCategories = updatedCategories.map(c =>
                c.id === draggedCategoryId ? { ...c, parent_id: newParentId } : c
            );
        }

        // 2. Re-calculate sort order `order_index` within the same parent branch
        const siblings = updatedCategories
            .filter(c => c.parent_id === newParentId)
            // Sort by existing index to maintain stable baseline before array mutations
            .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

        // Remove item from its original position (if it was already in this array)
        const currentItemIndex = siblings.findIndex(c => c.id === draggedCategoryId);
        if (currentItemIndex !== -1) {
            siblings.splice(currentItemIndex, 1);
        }

        // Insert at new destination
        const draggedItemContext = updatedCategories.find(c => c.id === draggedCategoryId);
        siblings.splice(destination.index, 0, draggedItemContext);

        // Map fresh incremental order indexes
        siblings.forEach((c, index) => {
            c.order_index = index;
        });

        // Overlay new indexes back into the global list
        const finalOptimistic = updatedCategories.map(c => {
            const updatedSibling = siblings.find(s => s.id === c.id);
            return updatedSibling ? { ...c, order_index: updatedSibling.order_index } : c;
        });

        // 3. Update React App State Optimistically
        setCategories(finalOptimistic);

        if (newParentId) {
            const newExp = new Set(expandedIds);
            newExp.add(newParentId);
            setExpandedIds(newExp);
        }

        // 4. Send persistent updates to API 
        try {
            // If parent changed, we must hit the PUT /categories/:id first
            if (draggedCategory.parent_id !== newParentId) {
                await fetch(`${API_BASE_URL}/categories/${draggedCategoryId}`, {
                    method: 'PUT',
                    headers: API_HEADERS,
                    body: JSON.stringify({ parent_id: newParentId })
                });
            }

            // Fire bulk Array reposition Payload 
            const reorderPayload = siblings.map(c => ({
                id: c.id,
                order_index: c.order_index
            }));

            const res = await fetch(`${API_BASE_URL}/categories/reorder`, {
                method: 'PUT',
                headers: API_HEADERS,
                body: JSON.stringify(reorderPayload)
            });

            if (!res.ok) throw new Error('Failed to Reorder Index');

        } catch (error) {
            showToast('فشل النقل، التراجع...', 'error');
            setCategories(categories); // revert fully
        }
    };

    // --- Tags System ---

    // Extract all unique tags dynamically from categories
    useEffect(() => {
        const extractUniqueTags = () => {
            const allTags = new Set();
            categories.forEach(cat => {
                if (cat.linked_tags && Array.isArray(cat.linked_tags)) {
                    cat.linked_tags.forEach(tag => allTags.add(tag.name));
                }
            });
            return Array.from(allTags);
        };

        if (tagInputText.trim() === '') {
            setTagSuggestions([]);
        } else {
            const available = extractUniqueTags();
            const matches = available.filter(t =>
                t.toLowerCase().includes(tagInputText.toLowerCase()) &&
                !formData.tags.includes(t)
            );
            setTagSuggestions(matches.slice(0, 5)); // Suggest top 5
        }
    }, [tagInputText, categories, formData.tags]);

    const handleAddTag = (tagVal) => {
        const val = tagVal.trim();
        if (val && !formData.tags.includes(val)) {
            setFormData(prev => ({ ...prev, tags: [...prev.tags, val] }));
        }
        setTagInputText(''); // Reset input
    };

    const handleRemoveTag = (tagToRemove) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(t => t !== tagToRemove)
        }));
    };

    const handleTagInputKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddTag(tagInputText);
        }
    };


    // --- Rendering ---

    const renderCategoryNode = (node, depth = 0, index) => {
        const isExpanded = expandedIds.has(node.id);
        const children = categories.filter(c => c.parent_id === node.id);
        const childrenFetched = fetchedParentIds.has(node.id);
        const hasChildren = children.length > 0 || (!childrenFetched && depth < 6);

        const isTopLevel = depth === 0;
        const isSecondary = depth === 1;

        return (
            <Draggable key={node.id} draggableId={node.id.toString()} index={index}>
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`category-node-container ${snapshot.isDragging ? 'is-dragging' : ''}`}
                        style={{ ...provided.draggableProps.style, marginLeft: depth > 0 ? '24px' : '0' }}
                    >
                        <div
                            className={`category-row ${isTopLevel ? 'top-level' : isSecondary ? 'secondary-level' : 'third-level'}`}
                            onClick={() => (hasChildren || depth < 6) && toggleExpand(node.id)}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="category-info">
                                <div {...provided.dragHandleProps} className="drag-handle text-muted">
                                    <GripVertical size={16} />
                                </div>

                                <div className="expand-icon" style={{ width: '20px', display: 'flex', justifyContent: 'center' }}>
                                    {hasChildren ? (
                                        isExpanded ? <ChevronDown size={18} color="var(--text-gray)" /> : <ChevronRight size={18} color="var(--text-gray)" />
                                    ) : (
                                        depth < 6 ? <div style={{ width: 18, height: 18, borderRadius: '50%', border: '1px dashed var(--border-color)' }}></div> : <List size={16} color="var(--border-color)" />
                                    )}
                                </div>

                                <div className="category-icon" style={{
                                    backgroundColor: node.color_hex ? `${node.color_hex}20` : 'var(--bg-color)',
                                    color: node.color_hex || 'var(--primary-color)'
                                }}>
                                    {node.icon_name && (node.icon_name.startsWith('http') || node.icon_name.startsWith('/') || node.icon_name.startsWith('data:')) ? (
                                        <img src={node.icon_name.startsWith('/') ? `${API_BASE_URL.replace('/api', '')}${node.icon_name}` : node.icon_name} alt="" style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }} />
                                    ) : node.icon_name ? (
                                        <span className="material-icons" style={{ fontSize: '18px' }}>{node.icon_name}</span>
                                    ) : (
                                        <Folder size={18} />
                                    )}
                                </div>

                                <div className="category-details" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span className="category-name fw-600">
                                        {node.name}
                                    </span>
                                    {node.tag && (
                                        <span className="badge" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)', fontSize: '0.75rem', padding: '2px 8px' }}>
                                            {node.tag}
                                        </span>
                                    )}
                                    <span className="category-id text-muted" style={{ fontSize: '0.75rem' }}>
                                        (ID: {node.id})
                                    </span>
                                </div>
                            </div>

                            <div className="category-actions" onClick={e => e.stopPropagation()}>
                                <button className="btn-icon" title="تعديل تالقسم" onClick={(e) => { e.stopPropagation(); openEditModal(node); }}><Edit2 size={16} color="var(--text-gray)" /></button>
                                {depth < 2 && (
                                    <button className="btn-icon" title="إضافة قسم فرعي" onClick={(e) => { e.stopPropagation(); openAddModal(node.id); }}><Plus size={16} color="var(--primary-color)" /></button>
                                )}
                                <button className="btn-icon" title="حذف القسم" onClick={(e) => { e.stopPropagation(); handleDelete(node); }}><Trash2 size={16} color="var(--danger-color)" /></button>
                            </div>
                        </div>

                        {/* Droppable Area for Children */}
                        {(isExpanded || snapshot.isDragging) && (
                            <Droppable droppableId={`droppable-${node.id}`} type="category">
                                {(provided, childSnapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className={`children-container ${childSnapshot.isDraggingOver ? 'is-dragging-over' : ''}`}
                                    >
                                        {children.map((child, childIdx) => renderCategoryNode(child, depth + 1, childIdx))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        )}
                    </div>
                )}
            </Draggable>
        );
    };

    const topLevelCategories = categories.filter(c => !c.parent_id);

    return (
        <div className="page-container position-relative">
            {toast.show && (
                <div className={`toast-notification ${toast.type}`}>
                    {toast.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
                    <span>{toast.message}</span>
                </div>
            )}

            <div className="page-header justify-content-between align-items-center">
                <div>
                    <h1 className="page-title">إدارة الأقسام والتصنيفات</h1>
                    <p className="page-subtitle">اسحب الأقسام لإعادة ترتيبها أو نقلها بين الفئات</p>
                </div>
                <button className="btn btn-primary" style={{ display: 'flex', gap: '8px', alignItems: 'center' }} onClick={() => openAddModal(null)}>
                    <Plus size={18} /> إضافة قسم رئيسي
                </button>
            </div>

            <div className="card">
                <div className="card-header border-bottom pb-4 mb-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.2rem', margin: 0 }}>شجرة الأقسام الهرمية ({categories.length} قسم)</h2>
                    <span className="text-muted text-sm">التغييرات على الأقسام تنعكس فوراً على التطبيق</span>
                </div>

                {loading ? (
                    <div className="loading-state" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-gray)' }}>
                        جاري تحميل التصنيفات...
                    </div>
                ) : (
                    <div className="categories-tree-wrapper">
                        <DragDropContext onDragEnd={handleDragEnd}>
                            <Droppable droppableId="droppable-null" type="category">
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className={snapshot.isDraggingOver ? 'root-is-dragging-over' : ''}
                                        style={{ minHeight: '200px' }}
                                    >
                                        {topLevelCategories.map((node, index) => renderCategoryNode(node, 0, index))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>
                    </div>
                )}
            </div>

            {/* Modals */}
            {isModalOpen && createPortal(
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">{modalMode === 'add' ? 'إضافة قسم جديد' : 'تعديل القسم'}</h2>
                            <button className="modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
                        </div>

                        <form onSubmit={handleFormSubmit}>
                            <div className="modal-body">
                                {modalMode === 'add' && activeCategory && (
                                    <div className="form-group mb-3">
                                        <div className="badge" style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-color)', display: 'inline-flex', padding: '8px 12px', borderRadius: '8px', width: '100%' }}>
                                            <Folder size={16} className="text-muted ml-2" />
                                            إضافة قسم فرعي تابع لـ: <strong style={{ marginRight: '8px' }}>{categories.find(c => c.id === activeCategory)?.name}</strong>
                                        </div>
                                    </div>
                                )}

                                <div className="form-group grid-1">
                                    <label>اسم القسم <span className="text-danger">*</span></label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        required
                                        placeholder="مثال: سيارات للإيجار"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>

                                <div className="form-group grid-2">
                                    <div>
                                        <label>أيقونة (Material Icon)</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="مثال: directions_car"
                                            value={formData.icon_name}
                                            onChange={e => setFormData({ ...formData, icon_name: e.target.value })}
                                        />
                                        <a href="https://fonts.google.com/icons" target="_blank" rel="noreferrer" className="text-sm text-primary" style={{ display: 'inline-block', marginTop: '4px' }}>تصفح الأيقونات</a>
                                    </div>
                                    <div>
                                        <label>لون الأيقونة (Hex)</label>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <input
                                                type="color"
                                                className="form-control"
                                                style={{ width: '40px', padding: '2px', cursor: 'pointer' }}
                                                value={formData.color_hex}
                                                onChange={e => setFormData({ ...formData, color_hex: e.target.value })}
                                            />
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="#0075FF"
                                                value={formData.color_hex}
                                                onChange={e => setFormData({ ...formData, color_hex: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="form-group grid-2">
                                    <div>
                                        <label>وسم مميز (شريطة)</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="مثال: الأكثر طلباً"
                                            value={formData.tag}
                                            onChange={e => setFormData({ ...formData, tag: e.target.value })}
                                        />
                                    </div>
                                    <div style={{ position: 'relative' }}>
                                        <label>كلمات مفتاحية للبحث (Tags)</label>
                                        <div className="tag-input-container">
                                            {formData.tags.map((t, idx) => (
                                                <span key={idx} className="tag-bubble">
                                                    {t}
                                                    <button type="button" onClick={() => handleRemoveTag(t)}>
                                                        <XCircle size={14} />
                                                    </button>
                                                </span>
                                            ))}
                                            <input
                                                type="text"
                                                className="tag-input-field"
                                                placeholder={formData.tags.length === 0 ? "اكتب ثم اضغط Enter..." : ""}
                                                value={tagInputText}
                                                onChange={e => setTagInputText(e.target.value)}
                                                onKeyDown={handleTagInputKeyDown}
                                            />
                                        </div>
                                        {/* Autocomplete Dropdown */}
                                        {tagSuggestions.length > 0 && (
                                            <div className="autocomplete-dropdown">
                                                {tagSuggestions.map((suggestion, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="autocomplete-item"
                                                        onClick={() => handleAddTag(suggestion)}
                                                    >
                                                        {suggestion}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="form-group grid-1">
                                    <div>
                                        <label>ينتمي إلى</label>
                                        <select
                                            className="form-control"
                                            value={formData.parent_id}
                                            onChange={e => setFormData({ ...formData, parent_id: e.target.value })}
                                        >
                                            <option value="">- قسم رئيسي مقلتس -</option>
                                            {/* Build flat hierarchy dropdown */}
                                            {categories.filter(c => !c.parent_id).map(c1 => (
                                                <React.Fragment key={c1.id}>
                                                    <option value={c1.id} disabled={modalMode === 'edit' && activeCategory === c1.id}>{c1.name}</option>
                                                    {categories.filter(c => c.parent_id === c1.id).map(c2 => (
                                                        <option key={c2.id} value={c2.id} disabled={modalMode === 'edit' && activeCategory === c2.id}>
                                                            &nbsp;&nbsp;&nbsp;↳ {c2.name}
                                                        </option>
                                                    ))}
                                                </React.Fragment>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>إلغاء</button>
                                <button type="submit" className="btn btn-primary">{modalMode === 'add' ? 'إضافة القسم' : 'حفظ التعديلات'}</button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            <style jsx="true">{`
                .toast-notification {
                    position: fixed; top: 20px; right: 20px; z-index: 9999;
                    background: white; padding: 16px 24px; border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15); display: flex; align-items: center; gap: 12px;
                    font-weight: 600; animation: slideIn 0.3s ease-out;
                }
                .toast-notification.success { border-right: 4px solid var(--success-color); color: var(--success-color); }
                .toast-notification.error { border-right: 4px solid var(--danger-color); color: var(--danger-color); }
                
                @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

                .category-node-container { margin-bottom: 2px; }
                .is-dragging {
                    box-shadow: 0 8px 16px rgba(0,0,0,0.12);
                    border-radius: var(--radius-md);
                    background: white;
                    z-index: 100;
                }
                .children-container {
                    margin-top: 2px;
                    border-right: 2px solid var(--border-color);
                    padding-right: 12px;
                    min-height: 5px; /* Important for empty droppables */
                    transition: background 0.2s;
                    border-radius: 4px;
                }
                .children-container.is-dragging-over {
                    background-color: rgba(0, 117, 255, 0.05); /* Highlight droppable area */
                }
                .root-is-dragging-over {
                    background-color: rgba(0, 117, 255, 0.05);
                    border-radius: var(--radius-md);
                }

                .category-row {
                    display: flex; justify-content: space-between; align-items: center;
                    padding: 10px 16px; border-radius: var(--radius-md);
                    transition: all 0.15s; border: 1px solid transparent; background-color: var(--scaffold-bg);
                    gap: 16px;
                }
                .category-row:hover { background-color: white; border-color: var(--border-color); box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
                
                .top-level { background-color: white; border: 1px solid var(--border-color); margin-bottom: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.03); }
                .top-level:hover { box-shadow: 0 4px 8px rgba(0,0,0,0.06); }
                .secondary-level { background-color: var(--bg-color); border: 1px dashed transparent; }
                .third-level { background-color: transparent; }

                .category-info { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; }
                .category-details { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
                
                .drag-handle { cursor: grab; display: flex; align-items: center; justify-content: center; height: 100%; opacity: 0.3; transition: 0.2s; flex-shrink: 0; }
                .category-row:hover .drag-handle { opacity: 1; }
                .drag-handle:active { cursor: grabbing; }

                .category-icon { width: 36px; height: 36px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
                .third-level .category-icon { width: 28px; height: 28px; border-radius: var(--radius-sm); }
                
                .category-actions { display: flex; gap: 4px; opacity: 0; transition: opacity 0.2s; flex-shrink: 0; }
                .category-row:hover .category-actions { opacity: 1; }
                
                .btn-icon { background: none; border: none; cursor: pointer; padding: 6px; border-radius: 6px; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
                .btn-icon:hover { background-color: rgba(0,0,0,0.05); transform: scale(1.05); }

                /* Modals (Re-using generic modal styles) */
                .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 99999; backdrop-filter: blur(4px); }
                .modal-content { position: relative; background: white; width: 95%; max-width: 800px; max-height: 90vh; border-radius: var(--radius-lg); box-shadow: var(--shadow-lg); overflow: hidden; animation: scaleUp 0.2s ease-out; z-index: 100000; display: flex; flex-direction: column; }
                @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                .modal-header { padding: 20px 24px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; background-color: var(--secondary-color); }
                .modal-title { margin: 0; font-size: 1.25rem; font-weight: 700; color: var(--text-color); }
                .modal-close { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-gray); transition: 0.2s; }
                .modal-close:hover { color: var(--danger-color); transform: rotate(90deg); }
                .modal-body { padding: 24px; display: flex; flex-direction: column; gap: 20px; overflow-y: auto; }
                .modal-footer { padding: 16px 24px; border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end; gap: 12px; background-color: var(--secondary-color); flex-shrink: 0; }
                
                .form-control { width: 100%; padding: 10px 14px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 0.95rem; font-family: inherit; transition: 0.2s; }
                .form-control:focus { border-color: var(--primary-color); outline: none; box-shadow: 0 0 0 3px var(--primary-light); }

                /* Tag Input Styles */
                .tag-input-container { display: flex; flex-wrap: wrap; gap: 6px; padding: 6px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); background: white; min-height: 42px; align-items: center; focus-within: border-color: var(--primary-color); focus-within: box-shadow: 0 0 0 3px var(--primary-light); transition: 0.2s; }
                .tag-bubble { display: inline-flex; align-items: center; gap: 4px; background-color: rgba(0, 117, 255, 0.1); color: var(--primary-color); padding: 4px 10px; border-radius: 16px; font-size: 0.85rem; font-weight: 500; }
                .tag-bubble button { background: none; border: none; padding: 0; color: var(--primary-color); opacity: 0.7; cursor: pointer; display: flex; align-items: center; transition: 0.2s; }
                .tag-bubble button:hover { opacity: 1; color: var(--danger-color); }
                .tag-input-field { flex: 1; min-width: 120px; border: none; outline: none; background: transparent; font-size: 0.9rem; padding: 4px; }
                
                /* Autocomplete Dropdown */
                .autocomplete-dropdown { position: absolute; top: calc(100% + 4px); left: 0; right: 0; background: white; border: 1px solid var(--border-color); border-radius: var(--radius-sm); box-shadow: var(--shadow-md); z-index: 10; max-height: 150px; overflow-y: auto; }
                .autocomplete-item { padding: 10px 12px; cursor: pointer; font-size: 0.9rem; transition: background 0.2s; border-bottom: 1px solid #f0f0f0; }
                .autocomplete-item:last-child { border-bottom: none; }
                .autocomplete-item:hover { background-color: var(--bg-hover); color: var(--primary-color); }
            `}</style>
        </div>
    );
}
