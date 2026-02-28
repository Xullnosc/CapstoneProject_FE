import { useState, useEffect } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { checklistService, type ChecklistItem, type ChecklistCreatePayload } from '../../services/checklistService';
import Swal from '../../utils/swal';

const ChecklistPage = () => {
    const [items, setItems] = useState<ChecklistItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [content, setContent] = useState('');
    const [displayOrder, setDisplayOrder] = useState(0);
    const [submitting, setSubmitting] = useState(false);

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

    const openCreate = () => {
        setEditingId(null);
        setContent('');
        setDisplayOrder(items.length > 0 ? Math.max(...items.map((i) => i.displayOrder)) + 1 : 0);
        setDialogVisible(true);
    };

    const openEdit = (row: ChecklistItem) => {
        setEditingId(row.checklistId);
        setContent(row.content);
        setDisplayOrder(row.displayOrder);
        setDialogVisible(true);
    };

    const handleSave = async () => {
        const trimmed = content?.trim();
        if (!trimmed) {
            Swal.fire('Validation', 'Content is required', 'warning');
            return;
        }
        setSubmitting(true);
        try {
            if (editingId != null) {
                await checklistService.update(editingId, { content: trimmed, displayOrder });
                Swal.fire('Updated', 'Checklist item updated.', 'success');
            } else {
                const payload: ChecklistCreatePayload = { content: trimmed, displayOrder };
                await checklistService.create(payload);
                Swal.fire('Created', 'Checklist item added.', 'success');
            }
            setDialogVisible(false);
            fetchList();
        } catch (e: unknown) {
            const msg = e && typeof e === 'object' && 'response' in e && typeof (e as { response: { data?: { message?: string } } }).response?.data?.message === 'string'
                ? (e as { response: { data: { message: string } } }).response.data.message
                : 'Action failed';
            Swal.fire('Error', msg, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (row: ChecklistItem) => {
        const result = await Swal.fire({
            title: 'Delete item?',
            text: `"${row.content.slice(0, 50)}${row.content.length > 50 ? '...' : ''}"`,
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

    const footer = (
        <div className="flex justify-end gap-2">
            <Button label="Cancel" severity="secondary" onClick={() => setDialogVisible(false)} />
            <Button label={editingId != null ? 'Update' : 'Add'} onClick={handleSave} loading={submitting} disabled={!content?.trim()} />
        </div>
    );

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-[900px] mx-auto p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Evaluation Checklist</h2>
                        <p className="text-gray-500 text-sm mt-1">Criteria used to evaluate proposed thesis topics (HOD)</p>
                    </div>
                    <Button label="Add item" icon="pi pi-plus" onClick={openCreate} className="bg-orange-500 border-orange-500" />
                </div>

                <div className="card border border-gray-100 rounded-xl overflow-hidden">
                    <DataTable
                        value={items}
                        loading={loading}
                        emptyMessage="No checklist items yet. Add one to get started."
                        size="small"
                        stripedRows
                    >
                        <Column field="displayOrder" header="#" style={{ width: '60px' }} />
                        <Column field="content" header="Content" />
                        <Column
                            header="Actions"
                            body={(row: ChecklistItem) => (
                                <div className="flex gap-2">
                                    <Button icon="pi pi-pencil" rounded text severity="info" size="small" onClick={() => openEdit(row)} />
                                    <Button icon="pi pi-trash" rounded text severity="danger" size="small" onClick={() => handleDelete(row)} />
                                </div>
                            )}
                            style={{ width: '120px' }}
                        />
                    </DataTable>
                </div>

                <Dialog
                    header={editingId != null ? 'Edit item' : 'Add item'}
                    visible={dialogVisible}
                    onHide={() => setDialogVisible(false)}
                    footer={footer}
                    style={{ width: '90vw', maxWidth: '480px' }}
                >
                    <div className="flex flex-col gap-4 pt-2">
                        <label className="font-medium text-gray-700">Content</label>
                        <InputText
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="e.g. Topic matches the semester theme"
                            className="w-full"
                        />
                        <label className="font-medium text-gray-700">Display order</label>
                        <InputText
                            type="number"
                            value={displayOrder}
                            onChange={(e) => setDisplayOrder(parseInt(e.target.value, 10) || 0)}
                            min={0}
                            className="w-full"
                        />
                    </div>
                </Dialog>
            </div>
        </div>
    );
};

export default ChecklistPage;
