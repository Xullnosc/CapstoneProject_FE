import { useState, useEffect } from 'react';
import { Tag } from 'primereact/tag';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { reviewService } from '../../services/reviewService';
import { semesterService, type Semester } from '../../services/semesterService';
import { authService } from '../../services/authService';
import { teamService } from '../../services/teamService';
import ReviewBreadcrumb from '../../components/Review/ReviewBreadcrumb';

const ReviewResultsPage = () => {
    const user = authService.getUser();
    const [semester, setSemester] = useState<Semester | null>(null);
    const [councils, setCouncils] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const current = await semesterService.getCurrentSemester();
            setSemester(current);
            if (current) {
                // Get teams related to user
                let userTeamIds: number[] = [];
                if (user?.roleName === 'Student') {
                    const myTeam = await teamService.getMyTeam();
                    if (myTeam) userTeamIds = [myTeam.teamId];
                } else if (user?.roleName === 'Lecturer') {
                    const mentorTeams = await teamService.getMentorTeams();
                    userTeamIds = mentorTeams.map(t => t.teamId);
                }

                const list = await reviewService.getCouncils(current.semesterId);
                const filtered = list.filter((c: any) => 
                    c.teams.some((t: any) => userTeamIds.includes(t.teamId))
                );
                
                // For each filtered council, load results for each round
                const enriched = await Promise.all(filtered.map(async (c: any) => {
                    const teamInCouncil = c.teams.find((t: any) => userTeamIds.includes(t.teamId));
                    const teamId = teamInCouncil.teamId;
                    
                    const rounds = [1, 2, 3];
                    const results = await Promise.all(rounds.map(async r => {
                        try {
                            return await reviewService.getResults(c.councilId, r, teamId);
                        } catch {
                            return [];
                        }
                    }));
                    
                    return { ...c, team: teamInCouncil.team, teamId, roundResults: results };
                }));
                
                setCouncils(enriched);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex h-screen items-center justify-center">
            <div className="h-8 w-8 rounded-full border-2 border-gray-100 border-t-indigo-500 animate-spin"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <ReviewBreadcrumb
                items={[
                    { label: 'Home', path: '/home' },
                    { label: 'Mid-term Review', path: '/review' },
                    { label: 'Review Results' }
                ]}
                title="Review Feedback"
                subtitle="Consolidated outcomes, checklist results, and reviewer commentary."
                semesterCode={semester?.semesterCode}
            />

            <main className="mx-auto max-w-[1000px] px-6 mt-8">
                {councils.length === 0 ? (
                    <div className="bg-white rounded-[32px] p-20 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-6">
                            <i className="pi pi-info-circle text-3xl text-gray-200"></i>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">No Results Found</h3>
                        <p className="text-xs text-gray-400 max-w-xs leading-relaxed">You haven't been assigned to a review council yet, or the assessment has not started.</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {councils.map((c, idx) => (
                            <div key={idx} className="space-y-6">
                                <div className="flex items-end justify-between px-2">
                                    <div>
                                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">{c.team?.teamCode}</h2>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Council: {c.councilName}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Mentor</p>
                                        <p className="text-xs font-bold text-indigo-600">{c.team?.mentorName || '—'}</p>
                                    </div>
                                </div>

                                <Accordion multiple activeIndex={[0]} className="review-accordion">
                                    {[1, 2, 3].map(round => {
                                        const roundResults = c.roundResults[round-1];
                                        const hasData = roundResults && roundResults.length > 0;
                                        
                                        return (
                                            <AccordionTab 
                                                key={round} 
                                                header={
                                                    <div className="flex items-center gap-4 w-full">
                                                        <span className="font-bold text-sm">Round {round}</span>
                                                        {!hasData && <Tag value="Pending" severity="warning" className="text-[8px] font-black uppercase px-2 py-0.5" />}
                                                        {hasData && <Tag value="Evaluated" severity="success" className="text-[8px] font-black uppercase px-2 py-0.5" />}
                                                    </div>
                                                }
                                            >
                                                {!hasData ? (
                                                    <div className="py-12 text-center">
                                                        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em]">Evaluation in progress</p>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-6 pt-2">
                                                        {/* Checklist Items */}
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            {roundResults.map((res: any, rIdx: number) => (
                                                                <div key={rIdx} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                                                    <div className="flex-1 pr-4">
                                                                        <p className="text-xs font-medium text-gray-700 leading-snug">{res.questionText}</p>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        {round < 3 ? (
                                                                            <Tag 
                                                                                value={res.assessment === 'Y' ? 'Pass' : res.assessment === 'N' ? 'Fail' : 'N/A'} 
                                                                                severity={res.assessment === 'Y' ? 'success' : res.assessment === 'N' ? 'danger' : 'secondary'}
                                                                                className="text-[9px] font-black uppercase"
                                                                            />
                                                                        ) : (
                                                                            <span className="text-lg font-black text-indigo-600">{res.grade ?? '—'}</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {/* Reviewer Comments */}
                                                        <div className="space-y-3">
                                                            <h5 className="text-[9px] font-black uppercase tracking-[0.15em] text-gray-400 px-1">Reviewer Commentary</h5>
                                                            <div className="grid grid-cols-1 gap-3">
                                                                {roundResults.filter((r: any) => r.comment).map((res: any, rIdx: number) => (
                                                                    <div key={rIdx} className="p-5 rounded-[20px] bg-white border border-gray-100 shadow-sm">
                                                                        <div className="flex items-center gap-2 mb-3">
                                                                            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500">
                                                                                {res.lecturerName?.charAt(0) || 'R'}
                                                                            </div>
                                                                            <span className="text-[10px] font-bold text-gray-900">{res.lecturerName || 'Reviewer'}</span>
                                                                        </div>
                                                                        <p className="text-xs text-gray-500 leading-relaxed italic">"{res.comment}"</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </AccordionTab>
                                        );
                                    })}
                                </Accordion>
                            </div>
                        ))}
                    </div>
                )}
            </main>
            
            <style>{`
                .review-accordion .p-accordion-header-link {
                    background: white !important;
                    border: 1px solid #f3f4f6 !important;
                    border-radius: 20px !important;
                    margin-bottom: 8px !important;
                    padding: 1.25rem 1.5rem !important;
                    box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05) !important;
                }
                .review-accordion .p-accordion-content {
                    background: transparent !important;
                    border: none !important;
                    padding: 1rem 0.5rem 2rem 0.5rem !important;
                }
                .review-accordion .p-accordion-tab-active .p-accordion-header-link {
                    border-bottom-left-radius: 0 !important;
                    border-bottom-right-radius: 0 !important;
                    margin-bottom: 0 !important;
                    border-bottom: none !important;
                }
            `}</style>
        </div>
    );
};

export default ReviewResultsPage;
