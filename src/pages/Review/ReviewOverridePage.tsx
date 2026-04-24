import React, { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';
import { Message } from 'primereact/message';
import { reviewService } from '../../services/reviewService';
import { semesterService } from '../../services/semesterService';
import Swal from '../../utils/swal';
import ReviewBreadcrumb from '../../components/Review/ReviewBreadcrumb';

const ReviewOverridePage = () => {
    const [semester, setSemester] = useState<any>(null);
    const [councils, setCouncils] = useState<any[]>([]);
    const [selectedCouncil, setSelectedCouncil] = useState<any>(null);
    const [teams, setTeams] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const [showOverrideModal, setShowOverrideModal] = useState(false);
    const [overrideForm, setOverrideForm] = useState({
        teamId: 0,
        round: 1,
        status: '',
        comment: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const current = await semesterService.getCurrentSemester();
            if (current) {
                setSemester(current);
                const list = await reviewService.getCouncils(current.semesterId);
                setCouncils(list);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCouncilChange = async (council: any) => {
        setSelectedCouncil(council);
        setLoading(true);
        try {
            const detail = await reviewService.getCouncilById(council.councilId);
            setTeams(detail.teams || []);
        } catch (error) {
        } finally {
            setLoading(false);
        }
    };

    const openOverride = (team: any) => {
        setOverrideForm({
            teamId: team.teamId,
            round: 1,
            status: team.round1Status || 'Pending',
            comment: team.hodComment || ''
        });
        setShowOverrideModal(true);
    };

    const handleSaveOverride = async () => {
        try {
            await reviewService.overrideStatus(selectedCouncil.councilId, overrideForm.teamId, {
                round: overrideForm.round,
                status: overrideForm.status,
                comment: overrideForm.comment
            });
            setShowOverrideModal(false);
            handleCouncilChange(selectedCouncil); // refresh
            Swal.fire('Success', 'Status overridden successfully', 'success');
        } catch (error: any) {
            Swal.fire('Error', error.response?.data?.message || 'Failed to override', 'error');
        }
    };

    const statusBody = (rowData: any, round: string) => {
        const val = rowData[round];
        const severity = val === 'Pass' ? 'success' : val === 'Fail' ? 'danger' : 'warning';
        return <Tag value={val || 'N/A'} severity={severity} />;
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <ReviewBreadcrumb
                items={[
                    { label: 'Home', path: '/home' },
                    { label: 'Mid-term Review', path: '/review' },
                    { label: 'HOD Override' }
                ]}
                title="HOD Status Override"
                subtitle="Manually override team assessment results for exceptional cases."
                semesterCode={semester?.semesterCode}
            />
            <main className="max-w-[1200px] mx-auto pb-12 px-6 flex flex-col gap-8">
                <p className="text-gray-500">Review automated project statuses and manually override if necessary.</p>

                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                    <div className="flex items-center gap-4">
                        <div className="w-full max-w-md">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Filter by Council</label>
                            <Dropdown 
                                value={selectedCouncil} 
                                options={councils} 
                                optionLabel="councilName" 
                                onChange={(e) => handleCouncilChange(e.value)} 
                                placeholder="Select Council" 
                                className="w-full rounded-xl"
                            />
                        </div>
                        {loading && <i className="pi pi-spin pi-spinner text-orange-500 mt-6"></i>}
                    </div>
                </div>

                <DataTable value={teams} paginator rows={10} className="p-datatable-sm" emptyMessage="No teams assigned to this council.">
                    <Column field="team.teamCode" header="Team Code" sortable></Column>
                    <Column field="team.thesis.title" header="Project Title" style={{ width: '30%' }}></Column>
                    <Column header="R1 Status" body={(row) => statusBody(row, 'round1Status')}></Column>
                    <Column header="R2 Status" body={(row) => statusBody(row, 'round2Status')}></Column>
                    <Column header="R3 Status" body={(row) => statusBody(row, 'round3Status')}></Column>
                    <Column field="round3Grade" header="R3 Grade" body={(row) => row.round3Grade ? row.round3Grade.toFixed(2) : 'N/A'}></Column>
                    <Column header="Actions" body={(rowData) => (
                        <Button icon="pi pi-shield" label="Override" className="p-button-text p-button-sm p-button-danger font-bold" onClick={() => openOverride(rowData)} />
                    )}></Column>
                </DataTable>
            </main>

            <Dialog header="Manual Status Override" visible={showOverrideModal} style={{ width: '450px' }} onHide={() => setShowOverrideModal(false)} className="rounded-3xl overflow-hidden p-fluid">
                <div className="space-y-4 py-2">
                    <Message severity="warn" text="Overriding will ignore automated checklist logic." className="mb-4" />
                    
                    <div className="field">
                        <label className="text-sm font-bold text-gray-500 mb-1 block">Review Round</label>
                        <Dropdown 
                            value={overrideForm.round} 
                            options={[{ label: 'Round 1', value: 1 }, { label: 'Round 2', value: 2 }, { label: 'Round 3', value: 3 }]} 
                            onChange={(e) => setOverrideForm({ ...overrideForm, round: e.value })} 
                            className="rounded-xl"
                        />
                    </div>
                    
                    <div className="field">
                        <label className="text-sm font-bold text-gray-500 mb-1 block">New Status</label>
                        <Dropdown 
                            value={overrideForm.status} 
                            options={['Pending', 'Pass', 'Fail']} 
                            onChange={(e) => setOverrideForm({ ...overrideForm, status: e.value })} 
                            className="rounded-xl"
                        />
                    </div>

                    <div className="field">
                        <label className="text-sm font-bold text-gray-500 mb-1 block">Override Justification (Reason)</label>
                        <InputTextarea 
                            value={overrideForm.comment} 
                            onChange={(e) => setOverrideForm({ ...overrideForm, comment: e.target.value })} 
                            rows={4} 
                            className="rounded-xl border-gray-200" 
                            placeholder="Why are you changing this status?"
                        />
                    </div>

                    <div className="pt-4">
                        <Button label="Apply Override" className="p-button-danger rounded-xl font-bold py-3 shadow-lg" onClick={handleSaveOverride} />
                    </div>
                </div>
            </Dialog>
        </div>
    );
};

export default ReviewOverridePage;
