import React, { useState, useEffect } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { TriStateCheckbox } from 'primereact/tristatecheckbox';
import { reviewService } from '../../services/reviewService';
import { semesterService } from '../../services/semesterService';
import { authService } from '../../services/authService';
import Swal from '../../utils/swal';
import ReviewBreadcrumb from '../../components/Review/ReviewBreadcrumb';

const ReviewAssessmentPage = () => {
    const user = authService.getUser();
    const [councils, setCouncils] = useState<any[]>([]);
    const [selectedCouncil, setSelectedCouncil] = useState<any>(null);
    const [teams, setTeams] = useState<any[]>([]);
    const [selectedTeam, setSelectedTeam] = useState<any>(null);
    const [round, setRound] = useState<number>(1);
    
    const [questions, setQuestions] = useState<any[]>([]);
    const [results, setResults] = useState<any[]>([]);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadCouncils();
    }, []);

    const loadCouncils = async () => {
        try {
            const current = await semesterService.getCurrentSemester();
            if (current) {
                const list = await reviewService.getCouncils(current.semesterId);
                const filtered = list.filter((c: any) => c.members.some((m: any) => m.lecturerId === user?.userId));
                setCouncils(filtered);
            }
        } catch (error) {}
    };

    const handleCouncilChange = (c: any) => {
        setSelectedCouncil(c);
        setTeams(c.teams.map((t: any) => t.team));
        setSelectedTeam(null);
        setQuestions([]);
    };

    const handleTeamChange = async (team: any) => {
        setSelectedTeam(team);
        loadQuestions(round, team.teamId);
    };

    const loadQuestions = async (r: number, teamId: number) => {
        if (!selectedCouncil) return;
        try {
            setLoading(true);
            const quest = await reviewService.getQuestions(selectedCouncil.councilId, r);
            const existing = await reviewService.getResults(selectedCouncil.councilId, r, teamId);
            
            setQuestions(quest);
            
            const initResults = quest.map((q: any) => {
                const ex = existing.find((e: any) => e.questionId === q.questionId);
                return {
                    councilId: selectedCouncil.councilId,
                    teamId: teamId,
                    questionId: q.questionId,
                    assessment: ex ? ex.assessment : null, 
                    grade: ex ? (ex.grade || 0) : 0,
                    mentorComment: ex ? ex.mentorComment : '',
                    reviewerComment: ex ? ex.reviewerComment : ''
                };
            });
            setResults(initResults);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAssessmentChange = (index: number, val: boolean | null) => {
        const newResults = [...results];
        newResults[index].assessment = val === true ? 'Y' : val === false ? 'N' : null;
        setResults(newResults);
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            await reviewService.submitAssessment(results);
            const summary = await reviewService.evaluateTeam(selectedCouncil.councilId, selectedTeam.teamId);
            
            Swal.fire({
                title: 'Submitted',
                text: `Assessment for ${selectedTeam.teamCode} completed.`,
                icon: 'success'
            });
            
            loadQuestions(round, selectedTeam.teamId);
        } catch (error: any) {
            Swal.fire('Error', error.response?.data?.message || 'Failed to submit assessment', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <ReviewBreadcrumb
                items={[
                    { label: 'Home', path: '/home' },
                    { label: 'Mid-term Review', path: '/review' },
                    { label: 'Project Assessment' }
                ]}
                title="Project Assessment"
                subtitle="Submit evaluation scores for assigned review teams."
            />
            <main className="mx-auto max-w-[1200px] px-6 pb-12">

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left Panel */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="rounded-[24px] bg-white p-6 shadow-sm border border-gray-100">
                            <h3 className="mb-6 text-[9px] font-black uppercase tracking-widest text-gray-400">Selectors</h3>
                            <div className="space-y-4">
                                <div className="p-field">
                                    <label className="mb-1.5 block text-[9px] font-bold text-gray-400 uppercase tracking-widest">Assigned Council</label>
                                    <Dropdown 
                                        value={selectedCouncil} 
                                        options={councils} 
                                        optionLabel="councilName" 
                                        onChange={(e) => handleCouncilChange(e.value)} 
                                        placeholder="Select Council" 
                                        className="w-full rounded-xl border-gray-100 bg-gray-50/50 p-inputtext-sm"
                                    />
                                </div>
                                <div className="p-field">
                                    <label className="mb-1.5 block text-[9px] font-bold text-gray-400 uppercase tracking-widest">Project Team</label>
                                    <Dropdown 
                                        value={selectedTeam} 
                                        options={teams} 
                                        optionLabel="teamCode" 
                                        onChange={(e) => handleTeamChange(e.value)} 
                                        placeholder="Select Team" 
                                        className="w-full rounded-xl border-gray-100 bg-gray-50/50 p-inputtext-sm"
                                        disabled={!selectedCouncil}
                                    />
                                </div>
                                <div className="p-field">
                                    <label className="mb-1.5 block text-[9px] font-bold text-gray-400 uppercase tracking-widest">Review Stage</label>
                                    <Dropdown 
                                        value={round} 
                                        options={[
                                            { label: 'Round 1: Initial Check', value: 1 },
                                            { label: 'Round 2: Progress Audit', value: 2 },
                                            { label: 'Round 3: Final Defense', value: 3 }
                                        ]} 
                                        onChange={(e) => { setRound(e.value); if(selectedTeam) loadQuestions(e.value, selectedTeam.teamId); }} 
                                        className="w-full rounded-xl border-gray-100 bg-gray-50/50 p-inputtext-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {selectedTeam && (
                            <div className="rounded-[24px] bg-slate-900 p-6 text-white shadow-lg">
                                <h4 className="text-xl font-black mb-1 leading-tight">{selectedTeam.teamCode}</h4>
                                <p className="text-[10px] text-gray-400 mb-4 line-clamp-1">{selectedTeam.thesis?.title || 'No topic assigned'}</p>
                                <div className="space-y-1.5 border-t border-white/5 pt-4 text-[10px] font-medium text-gray-400">
                                    <div className="flex justify-between"><span>Round:</span><span className="text-white">#{round}</span></div>
                                    <div className="flex justify-between"><span>Mentor:</span><span className="text-white">{selectedTeam.mentor?.fullName?.split(' ').pop()}</span></div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Panel */}
                    <div className="lg:col-span-8">
                        {!selectedTeam ? (
                            <div className="flex flex-col items-center justify-center p-20 bg-white rounded-[24px] border-2 border-dashed border-gray-100 opacity-50">
                                <i className="pi pi-inbox text-3xl text-gray-200 mb-2"></i>
                                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Select Team to Load Checklist</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {questions.map((q, idx) => (
                                    <div key={q.questionId} className="group rounded-[20px] bg-white p-6 shadow-sm border border-gray-100 transition-all hover:border-gray-200">
                                        <div className="flex justify-between items-start gap-6">
                                            <div className="flex-1">
                                                <div className="mb-2 flex items-center gap-2">
                                                    <span className="text-[10px] font-black text-gray-300">REQ.0{idx + 1}</span>
                                                    {q.priority === 'Mandatory' && (
                                                        <span className="rounded-full bg-red-50 px-2 py-0.5 text-[8px] font-black uppercase text-red-500 border border-red-50">Mandatory</span>
                                                    )}
                                                </div>
                                                <p className="text-sm font-bold text-gray-800 leading-tight">{q.questionText}</p>
                                            </div>

                                            <div className="pt-1">
                                                {round < 3 ? (
                                                    <div className="flex flex-col items-center gap-1.5">
                                                        <TriStateCheckbox 
                                                            value={results[idx]?.assessment === 'Y' ? true : results[idx]?.assessment === 'N' ? false : null} 
                                                            onChange={(e) => handleAssessmentChange(idx, e.value ?? null)} 
                                                        />
                                                        <span className={`text-[8px] font-black uppercase ${results[idx]?.assessment === 'Y' ? 'text-green-500' : results[idx]?.assessment === 'N' ? 'text-red-500' : 'text-gray-300'}`}>
                                                            {results[idx]?.assessment === 'Y' ? 'Pass' : results[idx]?.assessment === 'N' ? 'Fail' : 'TBA'}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-end">
                                                        <InputNumber 
                                                            value={results[idx]?.grade} 
                                                            onValueChange={(e) => {
                                                                const newRes = [...results];
                                                                newRes[idx].grade = e.value;
                                                                setResults(newRes);
                                                            }}
                                                            min={0} max={10} step={0.1} minFractionDigits={1}
                                                            inputClassName="w-16 text-center font-bold text-sm rounded-lg border-gray-100 bg-gray-50 focus:bg-white transition-all text-blue-600"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-4 border-t border-gray-50 pt-3">
                                            <InputTextarea 
                                                value={results[idx]?.reviewerComment} 
                                                onChange={(e) => {
                                                    const newRes = [...results];
                                                    newRes[idx].reviewerComment = e.target.value;
                                                    setResults(newRes);
                                                }}
                                                rows={1} autoResize
                                                placeholder="Add internal lecture notes here..." 
                                                className="w-full text-xs border-none p-0 focus:ring-0 bg-transparent placeholder-gray-300 font-medium text-gray-500 italic"
                                            />
                                        </div>
                                    </div>
                                ))}

                                <div className="mt-8 rounded-[24px] bg-white p-8 shadow-md border border-gray-100">
                                    <h4 className="mb-4 text-sm font-bold text-gray-900">Final Verdict Notes</h4>
                                    <InputTextarea 
                                        value={comment} 
                                        onChange={(e) => setComment(e.target.value)} 
                                        rows={3} 
                                        className="w-full rounded-xl border-gray-100 bg-gray-50 p-4 text-xs font-medium" 
                                        placeholder="Consolidated feedback for the HOD and student..."
                                    />
                                    
                                    <div className="mt-6 flex justify-between items-center bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                                        <div className="text-[10px] text-gray-400">
                                            <p className="font-bold uppercase tracking-widest text-[9px] text-gray-500">Seal Submission</p>
                                            <p>Data will be locked upon final transmission.</p>
                                        </div>
                                        <Button 
                                            label="Transmit Results" 
                                            icon="pi pi-send" 
                                            className="p-button-primary p-button-sm rounded-xl px-6 py-3 font-bold text-[10px] uppercase tracking-widest" 
                                            disabled={loading || questions.length === 0}
                                            onClick={handleSave}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ReviewAssessmentPage;
