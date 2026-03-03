import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import type { Thesis, ThesisStatus } from '../../types/thesis';
import { thesisService } from '../../services/thesisService';
import ThesisCard from '../../components/Thesis/ThesisCard';

interface Criteria {
    id: string;
    content: string;
}

const VERIFIED_STATUSES: ThesisStatus[] = ['Published', 'Rejected', 'Need Update'];

const STATUS_OPTIONS: { label: string; value: ThesisStatus | 'Verified' | '' }[] = [
    { label: 'All', value: '' },
    { label: 'Verified by reviewer', value: 'Verified' },
    { label: 'Published', value: 'Published' },
    { label: 'Rejected', value: 'Rejected' },
    { label: 'Need Update', value: 'Need Update' },
    { label: 'Reviewing', value: 'Reviewing' },
    { label: 'Registered', value: 'Registered' },
];

const ThesisPage = () => {
    // Thesis State & Logic (Original)
    const [theses, setTheses] = useState<Thesis[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTitle, setSearchTitle] = useState('');
    const [statusFilter, setStatusFilter] = useState<ThesisStatus | 'Verified' | ''>('Verified');

    // Checklist State (Snippet Revert)
    const [criteriaList, setCriteriaList] = useState<Criteria[]>([
        { id: '1', content: 'Topic matches the semester theme.' },
        { id: '2', content: 'Feasibility of the technology stack.' },
        { id: '3', content: 'Clear problem statement and solution.' },
        { id: '4', content: 'Team members have required skills.' }
    ]);
    const [criteriaDialogVisible, setCriteriaDialogVisible] = useState(false);
    const [newCriteria, setNewCriteria] = useState('');
    const [editingCriteriaId, setEditingCriteriaId] = useState<string | null>(null);
    const [editingText, setEditingText] = useState('');

    const fetchTheses = useCallback(async () => {
        setLoading(true);
        try {
            const data = await thesisService.getAllTheses({
                searchTitle: searchTitle || undefined,
                status: statusFilter === 'Verified' ? undefined : statusFilter || undefined,
            });
            setTheses(data);
        } catch (err) {
            console.error('Failed to fetch theses', err);
            setTheses([]);
        } finally {
            setLoading(false);
        }
    }, [searchTitle, statusFilter]);

    useEffect(() => {
        fetchTheses();
    }, [fetchTheses]);

    const [debouncedSearch, setDebouncedSearch] = useState('');
    useEffect(() => {
        const t = setTimeout(() => setSearchTitle(debouncedSearch), 400);
        return () => clearTimeout(t);
    }, [debouncedSearch]);

    const displayedTheses =
        statusFilter === 'Verified'
            ? theses.filter((t) => VERIFIED_STATUSES.includes(t.status))
            : theses;

    const verifiedCount = theses.filter((t) => VERIFIED_STATUSES.includes(t.status)).length;
    const reviewingCount = theses.filter((t) => t.status === 'Reviewing').length;

    // Criteria Handlers (Snippet Revert)
    const addCriteria = () => {
        if (!newCriteria.trim()) return;
        setCriteriaList([...criteriaList, { id: Date.now().toString(), content: newCriteria }]);
        setNewCriteria('');
    };

    const deleteCriteria = (id: string) => {
        setCriteriaList(criteriaList.filter(c => c.id !== id));
    };

    const startEdit = (c: Criteria) => {
        setEditingCriteriaId(c.id);
        setEditingText(c.content);
    };

    const saveEdit = () => {
        setCriteriaList(criteriaList.map(c => c.id === editingCriteriaId ? { ...c, content: editingText } : c));
        setEditingCriteriaId(null);
        setEditingText('');
    };

    const cancelEdit = () => {
        setEditingCriteriaId(null);
        setEditingText('');
    };

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-[1200px] mx-auto p-8 lg:p-12 space-y-8">
                {/* Breadcrumb */}
                <nav className="flex text-sm text-slate-500">
                    <Link to="/semesters" className="hover:text-orange-600 transition-colors">Semesters</Link>
                    <span className="mx-2">/</span>
                    <span className="font-medium text-orange-600">Thesis List</span>
                </nav>

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-gray-900">Thesis List</h1>
                        <p className="text-gray-500 mt-1">View theses verified by reviewer (Published, Rejected, Need Update)</p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total</p>
                            <p className="text-2xl font-bold text-gray-900">{theses.length}</p>
                        </div>
                        <span className="material-symbols-outlined text-3xl text-gray-300">description</span>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Verified by reviewer</p>
                            <p className="text-2xl font-bold text-orange-600">{verifiedCount}</p>
                        </div>
                        <span className="material-symbols-outlined text-3xl text-orange-200">verified</span>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Reviewing</p>
                            <p className="text-2xl font-bold text-amber-600">{reviewingCount}</p>
                        </div>
                        <span className="material-symbols-outlined text-3xl text-amber-200">schedule</span>
                    </div>
                </div>

                {/* Filters + Integrated Criteria action from snippet */}
                <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1 space-y-4">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">search</span>
                                <input
                                    type="text"
                                    value={debouncedSearch}
                                    onChange={(e) => setDebouncedSearch(e.target.value)}
                                    placeholder="Search by title..."
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                />
                            </div>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as ThesisStatus | 'Verified' | '')}
                                className="min-w-[200px] py-2.5 px-4 border border-gray-200 rounded-xl text-gray-700 font-medium focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            >
                                {STATUS_OPTIONS.map((opt) => (
                                    <option key={opt.value || 'all'} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Thesis grid */}
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="bg-white rounded-2xl p-6 border border-gray-200 animate-pulse">
                                        <div className="h-5 bg-gray-200 rounded w-3/4 mb-4" />
                                        <div className="h-4 bg-gray-100 rounded w-1/2 mb-3" />
                                        <div className="h-3 bg-gray-100 rounded w-full mb-2" />
                                    </div>
                                ))}
                            </div>
                        ) : displayedTheses.length === 0 ? (
                            <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 py-16 text-center">
                                <span className="material-symbols-outlined text-5xl text-gray-300 mb-4 block">description</span>
                                <p className="text-gray-500 font-medium">
                                    {statusFilter === 'Verified'
                                        ? 'No theses verified by reviewer yet.'
                                        : 'No theses match the current filters.'}
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {displayedTheses.map((t) => (
                                    <ThesisCard key={t.thesisId} thesis={t} canUpload={false} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Criteria Sidebar (Snippet Revert) */}
                    <div className="w-full lg:w-[350px] space-y-6">
                        <div className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl p-6 text-white shadow-lg shadow-orange-500/20">
                            <h3 className="text-xl font-bold mb-2">Evaluation Criteria</h3>
                            <p className="text-orange-50 text-sm mb-6 opacity-90">Manage the checklist used to evaluate propose topics.</p>
                            <button
                                onClick={() => setCriteriaDialogVisible(true)}
                                className="bg-white text-orange-600 px-4 py-3 rounded-xl font-semibold w-full hover:bg-orange-50 transition-all flex items-center justify-center gap-2 shadow-sm"
                            >
                                <span className="material-symbols-outlined text-xl">checklist</span>
                                Manage Criteria
                            </button>
                        </div>

                        <div className="bg-white rounded-2xl p-6 border border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="font-bold text-gray-700">Quick Preview</h4>
                                <span className="text-xs text-gray-400">{criteriaList.length} items</span>
                            </div>
                            <ul className="space-y-3">
                                {criteriaList.slice(0, 5).map((item, index) => (
                                    <li key={item.id} className="flex items-start gap-2 text-sm text-gray-600">
                                        <span className="w-5 h-5 rounded-full bg-orange-50 flex items-center justify-center text-[10px] font-bold text-orange-500 mt-0.5 shrink-0">
                                            {index + 1}
                                        </span>
                                        <span className="line-clamp-2">{item.content}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Criteria Management Dialog (Snippet Revert) */}
            <Dialog
                header="Evaluation Criteria"
                visible={criteriaDialogVisible}
                style={{ width: '90vw', maxWidth: '600px' }}
                onHide={() => setCriteriaDialogVisible(false)}
                className="font-sans"
                pt={{
                    header: { className: 'rounded-t-2xl border-b border-gray-100 bg-gray-50/50' },
                    content: { className: 'p-0' }
                }}
            >
                <div className="p-6">
                    <div className="flex gap-2 mb-6">
                        <InputText
                            value={newCriteria}
                            onChange={(e) => setNewCriteria(e.target.value)}
                            placeholder="Add new criteria..."
                            className="w-full"
                            onKeyDown={(e) => e.key === 'Enter' && addCriteria()}
                        />
                        <Button icon="pi pi-plus" onClick={addCriteria} disabled={!newCriteria.trim()} className="!bg-orange-500 !border-orange-500" />
                    </div>

                    <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-1">
                        {criteriaList.map((item) => (
                            <div key={item.id} className="group flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 transition-all">
                                {editingCriteriaId === item.id ? (
                                    <div className="flex gap-2 w-full">
                                        <InputText
                                            value={editingText}
                                            onChange={(e) => setEditingText(e.target.value)}
                                            className="w-full text-sm py-1.5"
                                            autoFocus
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') saveEdit();
                                                if (e.key === 'Escape') cancelEdit();
                                            }}
                                        />
                                        <Button icon="pi pi-check" rounded text severity="success" onClick={saveEdit} />
                                        <Button icon="pi pi-times" rounded text severity="secondary" onClick={cancelEdit} />
                                    </div>
                                ) : (
                                    <>
                                        <i className="pi pi-check_circle text-gray-400 group-hover:text-orange-500 transition-colors material-symbols-outlined"></i>
                                        <span className="flex-1 text-gray-700 text-sm">{item.content}</span>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button icon="pi pi-pencil" rounded text severity="info" size="small" onClick={() => startEdit(item)} />
                                            <Button icon="pi pi-trash" rounded text severity="danger" size="small" onClick={() => deleteCriteria(item.id)} />
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </Dialog>
        </div>
    );
};

export default ThesisPage;
