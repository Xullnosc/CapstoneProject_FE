import { useState, useEffect } from 'react';
import { checklistService, type ChecklistItem, type ChecklistCreatePayload } from '../../services/checklistService';
import Swal from '../../utils/swal';

type FilterStatus = 'All' | 'Incomplete' | 'Complete';

const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
        return dateStr;
    }
};

const ChecklistPage = () => {
    const [items, setItems] = useState<ChecklistItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('All');
    const [togglingId, setTogglingId] = useState<number | null>(null);

    const fetchList = async () => {
        try {
            setLoading(true);
            const data = await checklistService.getAll();
            setItems(data);
        } catch (e) {
            console.error('Failed to fetch checklist', e);
            Swal.fire('Error', 'Failed to load checklist', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchList();
    }, []);

    const filteredItems = items.filter((i) => {
        if (filterStatus === 'All') return true;
        if (filterStatus === 'Complete') return i.isCompleted;
        return !i.isCompleted;
    });

    const completedCount = items.filter((i) => i.isCompleted).length;
    const totalCount = items.length;

    const openCreate = () => {
        setEditingId(null);
        setTitle('');
        setContent('');
        setDialogVisible(true);
    };

    const openEdit = (row: ChecklistItem) => {
        setEditingId(row.checklistId);
        setTitle(row.title);
        setContent(row.content);
        setDialogVisible(true);
    };

    const handleSave = async () => {
        const trimmedTitle = title?.trim();
        const trimmedContent = content?.trim();
        if (!trimmedTitle || !trimmedContent) {
            Swal.fire('Validation', 'Title and Content are required', 'warning');
            return;
        }
        setSubmitting(true);
        try {
            if (editingId != null) {
                const row = items.find((i) => i.checklistId === editingId);
                await checklistService.update(editingId, {
                    title: trimmedTitle,
                    content: trimmedContent,
                    displayOrder: row?.displayOrder ?? 0,
                    isCompleted: row?.isCompleted ?? false,
                });
                Swal.fire('Updated', 'Checklist item updated.', 'success');
            } else {
                const payload: ChecklistCreatePayload = {
                    title: trimmedTitle,
                    content: trimmedContent,
                    displayOrder: 0
                };
                await checklistService.create(payload);
                Swal.fire('Created', 'Checklist item added.', 'success');
            }
            setDialogVisible(false);
            fetchList();
        } catch (e: unknown) {
            const msg =
                e &&
                    typeof e === 'object' &&
                    'response' in e &&
                    typeof (e as { response: { data?: { message?: string } } }).response?.data?.message === 'string'
                    ? (e as { response: { data: { message: string } } }).response.data.message
                    : 'Action failed';
            Swal.fire('Error', msg, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleComplete = async (row: ChecklistItem) => {
        setTogglingId(row.checklistId);
        try {
            await checklistService.update(row.checklistId, {
                title: row.title,
                content: row.content,
                displayOrder: row.displayOrder,
                isCompleted: !row.isCompleted,
            });
            await fetchList();
        } catch (e) {
            Swal.fire('Error', 'Failed to update status', 'error');
        } finally {
            setTogglingId(null);
        }
    };

    const handleDelete = async (row: ChecklistItem) => {
        const result = await Swal.fire({
            title: 'Delete item?',
            text: `"${row.title.slice(0, 50)}${row.title.length > 50 ? '...' : ''}"`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Delete',
        });
        if (!result.isConfirmed) return;
        try {
            await checklistService.delete(row.checklistId);
            Swal.fire('Deleted', 'Item removed.', 'success');
            fetchList();
        } catch (e) {
            Swal.fire('Error', 'Failed to delete', 'error');
        }
    };

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-[1200px] mx-auto p-8 lg:p-12 space-y-8">
                {/* Header - match project UI */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-3xl font-black tracking-tight text-gray-900">Evaluation Checklist</h2>
                        <p className="text-gray-500 text-base font-normal">
                            Criteria used to evaluate proposed thesis topics. Mark items complete as you review.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={openCreate}
                        className="cursor-pointer flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 shadow-lg shadow-orange-500/20 transition-all hover:translate-y-[-1px] active:translate-y-[1px]"
                    >
                        <span className="material-symbols-outlined text-xl">add_circle</span>
                        Add item
                    </button>
                </div>

                {/* Stats + Filters */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                    <div className="flex items-center gap-6 text-sm">
                        <span className="text-gray-500">
                            <span className="font-bold text-gray-900">{totalCount}</span> total
                        </span>
                        <span className="text-gray-500">
                            <span className="font-bold text-green-600">{completedCount}</span> complete
                        </span>
                        <span className="text-gray-500">
                            <span className="font-bold text-orange-600">{totalCount - completedCount}</span> incomplete
                        </span>
                    </div>
                    <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
                        {(['All', 'Incomplete', 'Complete'] as const).map((status) => (
                            <button
                                key={status}
                                type="button"
                                onClick={() => setFilterStatus(status)}
                                className={`cursor-pointer px-4 py-2 rounded-lg text-sm font-bold transition-colors ${filterStatus === status
                                    ? 'bg-white text-orange-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                {status === 'All' ? 'All' : status}
                            </button>
                        ))}
                    </div>
                </div>

                {/* List */}
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <span className="material-symbols-outlined animate-spin text-4xl text-orange-500">progress_activity</span>
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 py-16 text-center">
                        <span className="material-symbols-outlined text-5xl text-gray-300 mb-4 block">checklist_rtl</span>
                        <p className="text-gray-500 font-medium">
                            {filterStatus === 'All' ? 'No checklist items yet. Add one to get started.' : `No ${filterStatus.toLowerCase()} items.`}
                        </p>
                        {filterStatus !== 'All' && (
                            <button
                                type="button"
                                onClick={() => setFilterStatus('All')}
                                className="mt-3 text-orange-600 font-bold text-sm hover:underline"
                            >
                                Show all
                            </button>
                        )}
                        {filterStatus === 'All' && (
                            <button
                                type="button"
                                onClick={openCreate}
                                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600"
                            >
                                <span className="material-symbols-outlined text-lg">add</span>
                                Add first item
                            </button>
                        )}
                    </div>
                ) : (
                    <ul className="space-y-3">
                        {filteredItems
                            .map((row) => (
                                <li
                                    key={row.checklistId}
                                    className={`group flex items-start gap-4 p-4 rounded-xl border bg-white transition-colors ${row.isCompleted ? 'border-gray-100 bg-gray-50/50' : 'border-gray-200 hover:border-orange-200'
                                        }`}
                                >
                                    <button
                                        type="button"
                                        onClick={() => handleToggleComplete(row)}
                                        disabled={togglingId === row.checklistId}
                                        className="mt-0.5 flex-shrink-0 cursor-pointer disabled:opacity-50"
                                        title={row.isCompleted ? 'Mark incomplete' : 'Mark as complete'}
                                    >
                                        {togglingId === row.checklistId ? (
                                            <span className="material-symbols-outlined text-2xl text-orange-500 animate-spin">progress_activity</span>
                                        ) : row.isCompleted ? (
                                            <span className="material-symbols-outlined text-2xl text-green-600">check_circle</span>
                                        ) : (
                                            <span className="material-symbols-outlined text-2xl text-gray-300 hover:text-orange-500">radio_button_unchecked</span>
                                        )}
                                    </button>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-lg font-bold text-gray-900 ${row.isCompleted ? 'line-through text-gray-500' : ''}`}>
                                            {row.title}
                                        </p>
                                        <p className={`text-gray-600 text-sm mt-0.5 ${row.isCompleted ? 'line-through text-gray-400' : ''}`}>
                                            {row.content}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            Order #{row.displayOrder}
                                            {row.createdAt && ` · Added ${formatDate(row.createdAt)}`}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            type="button"
                                            onClick={() => openEdit(row)}
                                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-orange-600"
                                            title="Edit"
                                        >
                                            <span className="material-symbols-outlined text-xl">edit</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(row)}
                                            className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600"
                                            title="Delete"
                                        >
                                            <span className="material-symbols-outlined text-xl">delete</span>
                                        </button>
                                    </div>
                                </li>
                            ))}
                    </ul>
                )}

                {/* Add/Edit Dialog */}
                {dialogVisible && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40" onClick={() => setDialogVisible(false)}>
                        <div
                            className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-xl font-bold text-gray-900 mb-4">
                                {editingId != null ? 'Edit item' : 'Add item'}
                            </h3>
                            <div className="flex flex-col gap-4">
                                <div>
                                    <label className="block font-medium text-gray-700 mb-1">Title</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="e.g. Content Quality"
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    />
                                </div>
                                <div>
                                    <label className="block font-medium text-gray-700 mb-1">Content</label>
                                    <textarea
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        placeholder="e.g. Topic matches the semester theme"
                                        rows={3}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setDialogVisible(false)}
                                    className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSave}
                                    disabled={!title?.trim() || !content?.trim() || submitting}
                                    className="px-5 py-2.5 rounded-xl bg-orange-500 text-white font-bold text-sm hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? 'Saving...' : editingId != null ? 'Update' : 'Add'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChecklistPage;
