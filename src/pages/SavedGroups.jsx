import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Globe, CheckCircle, XCircle } from 'lucide-react';

export default function SavedGroups() {
    const [groups, setGroups] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [url, setUrl] = useState('');
    const [categoryId, setCategoryId] = useState('');

    useEffect(() => {
        fetchMetadata();
    }, []);

    const fetchMetadata = async () => {
        setLoading(true);
        try {
            const [groupsRes, categoriesRes] = await Promise.all([
                fetch(`${process.env.REACT_APP_API_URL}/saved-groups`),
                fetch(`${process.env.REACT_APP_API_URL}/categories`)
            ]);
            const groupsData = await groupsRes.json();
            const catData = await categoriesRes.json();

            setGroups(groupsData);
            setCategories(catData);
        } catch (error) {
            console.error("Error fetching saved groups data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        if (!name || !url) return;

        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/saved-groups`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    url,
                    category_id: categoryId ? parseInt(categoryId) : null,
                    is_active: true
                })
            });

            if (res.ok) {
                setIsModalOpen(false);
                setName('');
                setUrl('');
                setCategoryId('');
                fetchMetadata();
            }
        } catch (error) {
            console.error("Error creating group:", error);
        }
    };

    const handleDeleteGroup = async (id) => {
        if (!window.confirm('هل أنت متأكد من حذف هذا الرابط؟')) return;
        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/saved-groups/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setGroups(groups.filter(g => g.id !== id));
            }
        } catch (error) {
            console.error("Error deleting group:", error);
        }
    };

    const getCategoryName = (id) => {
        const cat = categories.find(c => c.id === id);
        return cat ? cat.name : 'غير محدد';
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    </div>
                <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                    <Plus size={20} />
                    إضافة رابط جديد
                </button>
            </div>

            <div className="card">
                {loading ? (
                    <div className="loading-state">جاري التحميل...</div>
                ) : groups.length === 0 ? (
                    <div className="empty-state">
                        <Globe size={48} className="empty-icon text-muted" />
                        <p>لا يوجد روابط مضافة حالياً.</p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>الاسم</th>
                                    <th>الرابط</th>
                                    <th>القسم المرتبط</th>
                                    <th>الحالة</th>
                                    <th>تاريخ الإضافة</th>
                                    <th>إجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {groups.map((group) => (
                                    <tr key={group.id}>
                                        <td>{group.id}</td>
                                        <td className="fw-600">{group.name}</td>
                                        <td>
                                            <a href={group.url} target="_blank" rel="noreferrer" style={{ color: 'var(--primary-color)' }}>
                                                {group.url.length > 40 ? group.url.substring(0, 40) + '...' : group.url}
                                            </a>
                                        </td>
                                        <td>
                                            <span className="badge bg-secondary-light text-secondary-dark">
                                                {getCategoryName(group.category_id)}
                                            </span>
                                        </td>
                                        <td>
                                            {group.is_active ? (
                                                <span className="badge bg-success-light text-success-dark">
                                                    <CheckCircle size={14} style={{ marginLeft: '4px' }} /> مفعل
                                                </span>
                                            ) : (
                                                <span className="badge bg-danger-light text-danger-dark">
                                                    <XCircle size={14} style={{ marginLeft: '4px' }} /> معطل
                                                </span>
                                            )}
                                        </td>
                                        <td>{new Date(group.created_at).toLocaleDateString('ar-JO')}</td>
                                        <td>
                                            <button
                                                className="btn btn-icon text-danger"
                                                onClick={() => handleDeleteGroup(group.id)}
                                                title="حذف الرابط"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2 className="modal-title">إضافة مصدر سحب جديد</h2>
                            <button className="modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
                        </div>

                        <form onSubmit={handleCreateGroup}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">اسم المجموعة / الصفحة</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        required
                                        placeholder="مثال: شقق للإيجار في عمان"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">رابط فيسبوك</label>
                                    <input
                                        type="url"
                                        className="form-control"
                                        required
                                        placeholder="https://facebook.com/groups/..."
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">ربط بالقسم <span className="text-muted text-sm">(اختياري)</span></label>
                                    <select
                                        className="form-control"
                                        value={categoryId}
                                        onChange={(e) => setCategoryId(e.target.value)}
                                    >
                                        <option value="">اختيار القسم</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                                    إلغاء
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    حفظ المصدر
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style jsx="true">{`
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }
        .modal-content {
          background: white;
          width: 90%;
          max-width: 500px;
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          overflow: hidden;
        }
        .modal-header {
          padding: 20px 24px;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          justify-content: space-between;
          align-items: center;
          background-color: var(--secondary-color);
        }
        .modal-title { margin: 0; font-size: 1.25rem; }
        .modal-close {
          background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-gray);
        }
        .modal-body { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
        .modal-footer {
          padding: 16px 24px;
          border-top: 1px solid var(--border-color);
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          background-color: var(--secondary-color);
        }
        .badge {
          display: inline-flex;
          align-items: center;
          padding: 4px 8px;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
        }
        .bg-success-light { background-color: rgba(76, 175, 80, 0.1); }
        .text-success-dark { color: #2E7D32; }
        .bg-danger-light { background-color: rgba(244, 67, 54, 0.1); }
        .text-danger-dark { color: #C62828; }
        .bg-secondary-light { background-color: rgba(158, 158, 158, 0.1); }
        .text-secondary-dark { color: #616161; }
        .text-muted { color: var(--text-light); }
        .text-sm { font-size: 0.85rem; }
      `}</style>
        </div>
    );
}
