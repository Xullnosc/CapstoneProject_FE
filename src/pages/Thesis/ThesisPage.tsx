import { useState, useEffect } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { semesterService, type Semester } from '../../services/semesterService';

interface Thesis {
    id: string;
    title: string;
    teamName: string;
    supervisor: string;
    status: 'Approved' | 'Pending' | 'Rejected';
    date: string;
}

interface Criteria {
    id: string;
    content: string;
}

const ThesisPage = () => {
    // State
    const [semesters, setSemesters] = useState<Semester[]>([]);
    const [selectedSemester, setSelectedSemester] = useState<Semester | null>(null);
    const [criteriaDialogVisible, setCriteriaDialogVisible] = useState(false);
    const [criteriaList, setCriteriaList] = useState<Criteria[]>([
        { id: '1', content: 'Topic matches the semester theme.' },
        { id: '2', content: 'Feasibility of the technology stack.' },
        { id: '3', content: 'Clear problem statement and solution.' },
        { id: '4', content: 'Team members have required skills.' }
    ]);
    const [newCriteria, setNewCriteria] = useState('');
    const [editingCriteriaId, setEditingCriteriaId] = useState<string | null>(null);
    const [editingText, setEditingText] = useState('');

    // Mock Data
    const theses: Thesis[] = [
        { id: '1', title: 'AI-Powered Traffic Management', teamName: 'UrbanFlow', supervisor: 'Dr. Alan Grant', status: 'Approved', date: '2023-10-15' },
        { id: '2', title: 'Blockchain Voting System', teamName: 'SecureVote', supervisor: 'Prof. Sarah Connor', status: 'Pending', date: '2023-10-20' },
        { id: '3', title: 'Smart Agriculture IoT', teamName: 'GreenTech', supervisor: 'Dr. Ellie Sattler', status: 'Approved', date: '2023-10-10' },
        { id: '4', title: 'E-Learning Platform for Kids', teamName: 'EduKid', supervisor: 'Mr. John Hammond', status: 'Rejected', date: '2023-10-25' },
        { id: '5', title: 'Mental Health Chatbot', teamName: 'MindCare', supervisor: 'Ms. Claire Dearing', status: 'Approved', date: '2023-11-01' },
    ];

    useEffect(() => {
        const fetchSemesters = async () => {
            try {
                const data = await semesterService.getAllSemesters();
                setSemesters(data);
                const current = await semesterService.getCurrentSemester();
                if (current) {
                    setSelectedSemester(current);
                } else if (data.length > 0) {
                    setSelectedSemester(data[0]);
                }
            } catch (error) {
                console.error("Failed to fetch semesters", error);
            }
        };
        fetchSemesters();
    }, []);

    // Criteria Handlers
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

    // Render Helpers
    const statusBodyTemplate = (rowData: Thesis) => {
        const severity = rowData.status === 'Approved' ? 'success' : rowData.status === 'Rejected' ? 'danger' : 'warning';
        return <Tag value={rowData.status} severity={severity} rounded></Tag>;
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 lg:p-10 font-sans text-gray-800">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-600">
                        Thesis Management
                    </h1>
                    <p className="text-gray-500 mt-1">Overview and management of semester topics.</p>
                </div>
                <div className="w-full md:w-64">
                    <Dropdown
                        value={selectedSemester}
                        onChange={(e) => setSelectedSemester(e.value)}
                        options={semesters}
                        optionLabel="semesterCode"
                        placeholder="Select Semester"
                        className="w-full shadow-sm border-gray-200"
                        pt={{
                            root: { className: 'rounded-xl border-none ring-1 ring-gray-200 hover:ring-orange-500 transition-all' },
                            input: { className: 'text-gray-700 font-medium' },
                            trigger: { className: 'text-gray-500' }
                        }}
                    />
                </div>
            </div>

            {/* Stats Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all duration-300">
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Total Theses</p>
                        <h2 className="text-3xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">124</h2>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                        <i className="pi pi-book text-xl"></i>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all duration-300">
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Pending Approval</p>
                        <h2 className="text-3xl font-bold text-gray-800 group-hover:text-amber-600 transition-colors">18</h2>
                    </div>
                    <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                        <i className="pi pi-clock text-xl"></i>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all duration-300">
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Published</p>
                        <h2 className="text-3xl font-bold text-gray-800 group-hover:text-green-600 transition-colors">86</h2>
                    </div>
                    <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform">
                        <i className="pi pi-check-circle text-xl"></i>
                    </div>
                </div>
            </div>

            {/* Main Content Areas */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Published Theses Table (Takes up 2 cols) */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                        <h3 className="text-lg font-bold text-gray-800">Published Theses</h3>
                        <Button label="Export" icon="pi pi-external-link" size="small" outlined className="!text-xs !py-1 !px-3 !rounded-lg" />
                    </div>
                    <div className="p-2">
                        <DataTable value={theses} paginator rows={5} className="text-sm" rowHover stripedRows tableStyle={{ minWidth: '40rem' }}>
                            <Column field="title" header="Topic" sortable className="font-medium text-gray-700"></Column>
                            <Column field="teamName" header="Team" sortable></Column>
                            <Column field="supervisor" header="Supervisor" sortable className="hidden sm:table-cell"></Column>
                            <Column field="status" header="Status" body={statusBodyTemplate} sortable></Column>
                        </DataTable>
                    </div>
                </div>

                {/* Actions & Checklist (Takes up 1 col) */}
                <div className="flex flex-col gap-6">
                    {/* Action Card */}
                    <div className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl p-6 text-white shadow-lg shadow-orange-200">
                        <h3 className="text-xl font-bold mb-2">Evaluation Criteria</h3>
                        <p className="text-orange-50 text-sm mb-6 opacity-90">Manage the checklist used to evaluate propose topics.</p>
                        <button
                            onClick={() => setCriteriaDialogVisible(true)}
                            className="bg-white text-orange-600 px-4 py-3 rounded-xl font-semibold w-full hover:bg-orange-50 transition-all flex items-center justify-center gap-2 shadow-sm"
                        >
                            <i className="pi pi-list"></i>
                            Manage Criteria
                        </button>
                    </div>

                    {/* Mini List Preview (Optional) */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex-1">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-bold text-gray-700">Quick Preview</h4>
                            <span className="text-xs text-gray-400">{criteriaList.length} items</span>
                        </div>
                        <ul className="space-y-3">
                            {criteriaList.slice(0, 5).map((item, index) => (
                                <li key={item.id} className="flex items-start gap-2 text-sm text-gray-600">
                                    <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 mt-0.5 shrink-0">
                                        {index + 1}
                                    </span>
                                    <span className="line-clamp-2">{item.content}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Criteria Management Dialog */}
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
                    {/* Add New Input */}
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

                    {/* List */}
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
                                        <i className="pi pi-check-circle text-gray-400 group-hover:text-orange-500 transition-colors"></i>
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
