import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Checkbox } from 'primereact/checkbox';
import type { CheckboxChangeEvent } from 'primereact/checkbox';
import { authService } from '../../services/authService';
import { thesisService } from '../../services/thesisService';
import { teamService } from '../../services/teamService';
import { thesisFormService } from '../../services/thesisFormService';
import { semesterService } from '../../services/semesterService';
import { systemService } from '../../services/systemService';
import { userService, type UserInfo } from '../../services/userService';
import Swal from '../../utils/swal';
import { AxiosError } from 'axios';
import type { ThesisForm } from '../../types/thesisForm';
import { AutoComplete } from 'primereact/autocomplete';
import type { AutoCompleteCompleteEvent } from 'primereact/autocomplete';
import MemberAvatar from '../../components/team/MemberAvatar';

const ProposeThesisPage = () => {
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [hasAccess, setHasAccess] = useState(true);
    const [accessMessage, setAccessMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingAccess, setIsLoadingAccess] = useState(true);
    const [user, setUser] = useState<UserInfo | undefined>(undefined);
    const [isHOD, setIsHOD] = useState(false);
    const [selectedLecturer, setSelectedLecturer] = useState<UserInfo | undefined>(undefined);
    const [filteredLecturers, setFilteredLecturers] = useState<UserInfo[]>([]);
    const [latestForm, setLatestForm] = useState<ThesisForm | null>(null);
    const [thesisNameEn, setThesisNameEn] = useState('');
    const [thesisNameVi, setThesisNameVi] = useState('');
    const [abbreviation, setAbbreviation] = useState('');
    const [isFromEnterprise, setIsFromEnterprise] = useState(false);
    const [enterpriseName, setEnterpriseName] = useState('');
    const [isApplied, setIsApplied] = useState(false);
    const [isAppUsed, setIsAppUsed] = useState(false);
    const [filteredEnterprises, setFilteredEnterprises] = useState<string[]>([]);
    const [fileSizeLimit, setFileSizeLimit] = useState(10);
    const [isProposingForOther, setIsProposingForOther] = useState(false);
    const [isAssigningStudents, setIsAssigningStudents] = useState(false);
    const [selectedStudents, setSelectedStudents] = useState<UserInfo[]>([]);
    const [leaderUserId, setLeaderUserId] = useState<number | null>(null);
    const [filteredStudents, setFilteredStudents] = useState<UserInfo[]>([]);
    const studentAutoCompleteRef = useRef<AutoComplete>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const searchEnterprise = async (event: AutoCompleteCompleteEvent) => {
        try {
            const results = await thesisService.searchEnterprises(event.query);
            setFilteredEnterprises(results);
        } catch (error) {
            console.error("Failed to search enterprises", error);
        }
    };

    const searchLecturers = async (event: AutoCompleteCompleteEvent) => {
        try {
            const results = await userService.searchLecturers(event.query);
            setFilteredLecturers(results);
        } catch (error) {
            console.error("Failed to search lecturers", error);
        }
    };

    const searchStudents = async (event: AutoCompleteCompleteEvent) => {
        try {
            const results = await userService.searchStudents(event.query);
            setFilteredStudents(results);
        } catch (error) {
            console.error("Failed to search students", error);
        }
    };

    useEffect(() => {
        const fetchLatestForm = async () => {
            try {
                const data = await thesisFormService.getLatestForm();
                setLatestForm(data.data);
            } catch (error) {
                console.error("Failed to fetch latest thesis form", error);
            }
        };

        const checkAccess = async () => {
            setIsLoadingAccess(true);
            try {
                const currentUser = authService.getUser();
                setUser(currentUser);
                if (!currentUser) {
                    setHasAccess(false);
                    setAccessMessage('Please log in to propose a thesis.');
                    return;
                }

                setIsHOD(currentUser.roleName === 'HOD' || currentUser.roleName === 'Head of Department' || currentUser.roleName === 'Admin');

                // Based on user persona constraints
                if (currentUser.roleName === 'Lecturer' || currentUser.roleName === 'Admin' || currentUser.roleName === 'HOD') {
                    setHasAccess(true);
                } else if (currentUser.roleName === 'Student') {
                    try {
                        const config = await systemService.getPublicConfig();
                        setFileSizeLimit(config.fileSizeLimit);
                        if (!config.isOpen) {
                            setHasAccess(false);
                            setAccessMessage('Thesis registration is currently closed by administrator.');
                            return;
                        }

                        const myTeam = await teamService.getMyTeam();
                        if (!myTeam) {
                            setHasAccess(false);
                            setAccessMessage('You must be in a team to propose a thesis.');
                        } else {
                            // Fetch current semester context
                            const currentSemester = await semesterService.getCurrentSemester();

                            // 1. Check if the team leader has any ACTIVE thesis in the CURRENT semester (Strict rule)
                            const leaderTheses = await thesisService.getAllTheses({
                                userId: myTeam.leaderId,
                                semesterId: currentSemester?.semesterId
                            });
                            const hasActiveThesis = leaderTheses && leaderTheses.some(
                                t => t.status !== 'Cancelled' && t.status !== 'Rejected'
                            );

                            if (hasActiveThesis) {
                                navigate('/my-thesis', { replace: true });
                                return;
                            }

                            // 2. Check if the TEAM is already matched/registered with ANY thesis
                            const teamTheses = await thesisService.getAllTheses({
                                teamId: myTeam.teamId
                            });
                            const isTeamRegistered = teamTheses && teamTheses.some(t => t.status === 'Registered');

                            if (isTeamRegistered) {
                                setHasAccess(false);
                                setAccessMessage('Your team is already registered to a thesis. You cannot propose another one.');
                                return;
                            }

                            // If not proposed, only leader has access to the propose form
                            if (user && myTeam.leaderId !== user.userId) {
                                setHasAccess(false);
                                setAccessMessage('Only the Team Leader can propose a thesis.');
                            } else {
                                setHasAccess(true);
                            }
                        }
                    } catch {
                        setHasAccess(false);
                        setAccessMessage('Unable to verify team status.');
                    }
                } else {
                    setHasAccess(false);
                    setAccessMessage('You do not have permission to propose a thesis.');
                }
            } finally {
                setIsLoadingAccess(false);
            }
        };

        checkAccess();
        fetchLatestForm();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navigate]);

    const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFiles = e.dataTransfer.files;
        handleFiles(droppedFiles);
    };

    const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            handleFiles(e.target.files);
        }
    };

    const handleFiles = (files: FileList) => {
        if (files.length > 0) {
            const selectedFile = files[0];
            // Accept word documents
            if (selectedFile.type === 'application/msword' || selectedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || selectedFile.name.endsWith('.doc') || selectedFile.name.endsWith('.docx')) {
                setFile(selectedFile);
                // Autofill title if empty
                if (!title.trim()) {
                    const fileName = selectedFile.name.replace(/\.[^/.]+$/, "");
                    setTitle(fileName);
                }
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Invalid File',
                    text: 'Please upload a Word document (.doc or .docx)',
                    confirmButtonColor: '#f97415'
                });
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // [NEW] Direct Student Assignment Validation
        if (isAssigningStudents && user?.roleName === 'Lecturer') {
            if (selectedStudents.length < 4 || selectedStudents.length > 5) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Invalid Team Size',
                    text: 'A team must have exactly 4 or 5 members.',
                    confirmButtonColor: '#f97415'
                });
                return;
            }
            if (!leaderUserId) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Leader Required',
                    text: 'Please select a Leader for the team (click the crown icon next to a student).',
                    confirmButtonColor: '#f97415'
                });
                return;
            }
        }


        if (!title.trim() || !description.trim() || !file || !thesisNameEn.trim() || !thesisNameVi.trim() || !abbreviation.trim()) {
            Swal.fire({
                icon: 'warning',
                title: 'Missing Fields',
                text: 'Please fill in all mandatory fields (Title, English/Vietnamese Names, Abbreviation, Description) and attach a file.',
                confirmButtonColor: '#f97415'
            });
            return;
        }

        // Abbreviation validation: Alphanumeric, max 5 characters
        const abbrRegex = /^[a-zA-Z0-9]{1,5}$/;
        if (!abbrRegex.test(abbreviation)) {
            Swal.fire({
                icon: 'error',
                title: 'Invalid Abbreviation',
                text: 'Abbreviation must only contain English letters and numbers, and be at most 5 characters long.',
                confirmButtonColor: '#f97415'
            });
            return;
        }

        if (isFromEnterprise && !enterpriseName.trim()) {
            Swal.fire({
                icon: 'warning',
                title: 'Missing Enterprise Name',
                text: 'Please provide the name of the enterprise.',
                confirmButtonColor: '#f97415'
            });
            return;
        }

        const isStaff = user?.roleName === 'Lecturer' || user?.roleName === 'HOD' || user?.roleName === 'Admin';

        setIsSubmitting(true);
        try {
            await thesisService.proposeThesis({
                title: title.trim(),
                shortDescription: description.trim(),
                file: file,
                thesisNameEn: thesisNameEn.trim(),
                thesisNameVi: thesisNameVi.trim(),
                abbreviation: abbreviation.trim().toUpperCase(),
                isFromEnterprise,
                enterpriseName: isFromEnterprise ? enterpriseName.trim() : undefined,
                isApplied,
                isAppUsed,
                authorId: isProposingForOther ? selectedLecturer?.userId : undefined,
                memberIds: (isAssigningStudents && isStaff) ? selectedStudents.map(s => s.userId) : undefined,
                leaderId: (isAssigningStudents && isStaff) ? (leaderUserId ?? undefined) : undefined
            });

            Swal.fire({
                icon: 'success',
                title: 'Success',
                text: 'Thesis proposal submitted successfully!',
                confirmButtonColor: '#f97415'
            }).then(() => {
                const targetPath = (isHOD && isProposingForOther) ? '/thesis' : '/my-thesis';
                navigate(targetPath);
            });

            // Reset form
            setTitle('');
            setDescription('');
            setFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (err: unknown) {
            console.error('Submit error:', err);
            const axiosError = err as AxiosError<{ message?: string, errors?: Record<string, unknown> }>;

            let errorText = 'There was an error submitting your proposal. Please try again.';
            if (axiosError.response?.data) {
                if (axiosError.response.data.message) {
                    errorText = axiosError.response.data.message;
                } else if (axiosError.response.data.errors) {
                    errorText = JSON.stringify(axiosError.response.data.errors);
                } else {
                    errorText = JSON.stringify(axiosError.response.data);
                }
            } else if (axiosError.message) {
                errorText = axiosError.message;
            }

            Swal.fire({
                icon: 'error',
                title: 'Submission Failed',
                text: errorText,
                confirmButtonColor: '#f97415'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoadingAccess) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <i className="pi pi-spin pi-spinner text-4xl text-orange-500"></i>
            </div>
        );
    }

    if (!hasAccess) {
        return (
            <div className="min-h-screen bg-gray-50 p-6 lg:p-10 font-sans flex items-center justify-center">
                <div className="bg-white rounded-2xl p-10 shadow-sm border border-gray-100 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500 mx-auto mb-4">
                        <i className="pi pi-lock text-3xl"></i>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
                    <p className="text-gray-500">{accessMessage}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6 lg:p-10 font-sans text-gray-800">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8 border-b border-gray-100 pb-8 flex flex-col gap-6">
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-600 mb-2 mt-2">
                            Propose New Thesis
                        </h1>
                        <p className="text-gray-500">Submit a new thesis topic along with a detailed proposal document.</p>
                    </div>

                    {/* Download Global Thesis Form Section - Styled like Document Preview */}
                    <div className="w-full">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                            <i className="pi pi-file"></i>
                            Official Template
                        </h3>
                        {latestForm ? (
                            <div
                                className="border-2 border-dashed border-slate-200 rounded-xl p-5 md:p-6 flex flex-col sm:flex-row items-center justify-between bg-slate-50/50 transition-all hover:border-primary/50 group cursor-pointer relative overflow-hidden gap-4 shadow-sm hover:shadow"
                                onClick={() => window.open(latestForm.fileUrl, '_blank')}
                            >
                                <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto text-center sm:text-left">
                                    <div className="bg-white p-3 rounded-full shadow-sm border border-slate-100 flex-shrink-0">
                                        <i className="pi pi-file-word text-4xl text-slate-300 group-hover:text-blue-500 transition-colors" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-700 text-base mb-1">
                                            Thesis_Form.docx
                                        </p>
                                        <p className="text-sm text-slate-500">
                                            Please download and use this template for your proposal
                                        </p>
                                    </div>
                                </div>

                                <button
                                    className="w-full cursor-pointer sm:w-auto flex items-center justify-center gap-2 bg-white border border-slate-200 hover:border-primary/30 hover:bg-primary/5 text-primary px-6 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-md group-hover:-translate-y-0.5"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(latestForm.fileUrl, '_blank');
                                    }}
                                >
                                    <i className="pi pi-download"></i>
                                    <span>Download Template</span>
                                </button>
                            </div>
                        ) : (
                            <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center bg-slate-50/50 text-center">
                                <i className="pi pi-info-circle text-2xl text-slate-300 mb-2" />
                                <p className="text-sm text-slate-500 italic">No official template available yet.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-6">

                        {/* HOD: Target Author Management */}
                        {isHOD && (
                            <div className="flex flex-col gap-4 p-5 bg-orange-50/30 rounded-2xl border border-orange-100">
                                <div 
                                    className="flex items-center gap-2 group cursor-pointer transition-colors"
                                    onClick={() => {
                                        const newVal = !isProposingForOther;
                                        setIsProposingForOther(newVal);
                                        if (!newVal) setSelectedLecturer(undefined);
                                    }}
                                >
                                    <Checkbox
                                        inputId="isProposingForOther"
                                        checked={isProposingForOther}
                                        onChange={(e: CheckboxChangeEvent) => {
                                            e.originalEvent?.stopPropagation();
                                            setIsProposingForOther(e.checked ?? false);
                                            if (!e.checked) setSelectedLecturer(undefined);
                                        }}
                                        pt={{
                                            box: ({ context }: { context: { checked: boolean } }) => ({
                                                className: context.checked ? 'bg-orange-500 border-orange-500' : ''
                                            })
                                        }}
                                    />
                                    <span className="font-bold text-slate-700 group-hover:text-orange-600 transition-colors select-none">Propose for another lecturer</span>
                                </div>

                                {isProposingForOther && (
                                    <div className="flex flex-col gap-2 animate-fade-in border-t border-orange-100 pt-4 mt-2">
                                        <label htmlFor="lecturer" className="font-bold text-orange-900 flex items-center gap-2">
                                            <i className="pi pi-user-plus"></i>
                                            Author (Lecturer)
                                        </label>
                                        <p className="text-xs text-orange-600 mb-1">Search and select the lecturer who will be the primary author of this thesis topic.</p>

                                        {!selectedLecturer ? (
                                        <AutoComplete<UserInfo>
                                            id="lecturer"
                                            value={selectedLecturer}
                                            suggestions={filteredLecturers}
                                            completeMethod={searchLecturers}
                                            field="fullName"
                                            onChange={(e) => setSelectedLecturer(e.value)}
                                            placeholder="Type lecturer name or email..."
                                            className="w-full"
                                            appendTo="self"
                                            inputClassName="w-full p-4 rounded-xl border-2 border-orange-100 hover:border-orange-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all duration-200 shadow-sm"
                                            pt={{
                                                dropdownButton: {
                                                    root: { className: 'bg-orange-500 border-orange-500 hover:bg-orange-600 hover:border-orange-600 rounded-r-xl w-12 transition-colors' }
                                                },
                                                loadingIcon: { className: 'text-orange-500' },
                                                panel: { className: 'border-none shadow-2xl rounded-2xl overflow-hidden mt-2 animate-fade-in bg-white' },
                                                list: { className: 'p-2' },
                                                item: ({ context }: { context: { selected: boolean, focused: boolean } }) => ({
                                                    className: `flex items-center gap-3 p-3 rounded-xl transition-all duration-200 cursor-pointer mb-1 ${context.selected
                                                        ? 'bg-orange-500 text-white shadow-md'
                                                        : context.focused
                                                            ? 'bg-orange-50 text-orange-900'
                                                            : 'text-slate-700 hover:bg-orange-50/50'
                                                        }`
                                                })
                                            }}
                                            itemTemplate={(item: UserInfo) => {
                                                const isSelected = (selectedLecturer as unknown as UserInfo)?.userId === item.userId;
                                                return (
                                                    <div className="flex items-center gap-3">
                                                        <MemberAvatar
                                                            email={item.email}
                                                            fullName={item.fullName}
                                                            avatarUrl={item.avatar}
                                                            className={`size-10 rounded-full shrink-0 border-2 ${isSelected ? 'border-white/30' : 'border-orange-100'}`}
                                                        />
                                                        <div className="flex flex-col min-w-0">
                                                            <span className={`font-bold text-sm truncate ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                                                                {item.fullName}
                                                            </span>
                                                            <span className={`text-xs truncate ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
                                                                {item.email}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            }}
                                            dropdown
                                        />
                                        ) : (
                                            <div className="flex items-center justify-between p-3 bg-white border-2 border-orange-200 rounded-2xl shadow-sm animate-fade-in">
                                                <div className="flex items-center gap-4">
                                                    <MemberAvatar
                                                        email={selectedLecturer?.email ?? ""}
                                                        fullName={selectedLecturer?.fullName ?? ""}
                                                        avatarUrl={selectedLecturer?.avatar}
                                                        className="size-12 rounded-2xl shrink-0"
                                                    />
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-lg text-slate-800 leading-tight">{selectedLecturer?.fullName}</span>
                                                        <span className="text-sm text-slate-500">{selectedLecturer?.email}</span>
                                                    </div>
                                                </div>
                                                <Button
                                                    icon="pi pi-times"
                                                    onClick={() => setSelectedLecturer(undefined)}
                                                    className="p-button-rounded p-button-text p-button-danger hover:bg-red-50"
                                                    tooltip="Change Lecturer"
                                                    tooltipOptions={{ position: 'left' }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Direct Student Assignment Section (Staff Only) */}
                        {(user?.roleName === 'Lecturer' || user?.roleName === 'HOD') && (
                            <div className="flex flex-col gap-4 p-6 bg-slate-50/50 rounded-2xl border border-slate-200 mb-6 shadow-sm">
                                <div 
                                    className="flex items-start gap-3 group cursor-pointer transition-all"
                                    onClick={() => setIsAssigningStudents(!isAssigningStudents)}
                                >
                                    <div className="pt-0.5">
                                        <Checkbox
                                            inputId="isAssigningStudents"
                                            checked={isAssigningStudents}
                                            onChange={(e: CheckboxChangeEvent) => {
                                                e.originalEvent?.stopPropagation();
                                                setIsAssigningStudents(e.checked ?? false);
                                                if (!e.checked) {
                                                    setSelectedStudents([]);
                                                    setLeaderUserId(null);
                                                }
                                            }}
                                            pt={{
                                                box: ({ context }: { context: { checked: boolean } }) => ({
                                                    className: context.checked ? 'bg-[#00a699] border-[#00a699]' : 'border-slate-300'
                                                })
                                            }}
                                        />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-700 group-hover:text-[#00a699] transition-colors select-none text-base">Direct Student Assignment</span>
                                        <span className="text-sm text-slate-500">Automatically create a Team for these students when the proposal is submitted.</span>
                                    </div>
                                </div>

                                {isAssigningStudents && (
                                    <div className="flex flex-col gap-6 animate-fade-in border-t border-slate-100 pt-5 mt-2">
                                        {/* Search Student */}
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[11px] font-black uppercase tracking-[0.15em] text-[#f97415] flex items-center gap-2 mb-1">
                                                SEARCH STUDENTS (4 - 5 MEMBERS)
                                            </label>
                                            <AutoComplete
                                                ref={studentAutoCompleteRef}
                                                multiple
                                                value={selectedStudents}
                                                suggestions={filteredStudents}
                                                completeMethod={searchStudents}
                                                field="fullName"
                                                onChange={(e) => {
                                                    const val = e.value as UserInfo[];
                                                    const valid = val.filter(s => !s.hasTeam);
                                                    if (valid.length > 5) {
                                                        Swal.fire({ icon: 'info', title: 'Limit Reached', text: 'Maximum 5 students allowed.', confirmButtonColor: '#f97415' });
                                                        setSelectedStudents(valid.slice(0, 5));
                                                    } else {
                                                        setSelectedStudents(valid);
                                                    }
                                                }}
                                                onSelect={() => {
                                                    setTimeout(() => {
                                                        studentAutoCompleteRef.current?.show();
                                                    }, 0);
                                                }}
                                                placeholder="Type name, email or Student ID to add members..."
                                                className="w-full"
                                                appendTo="self"
                                                inputClassName="w-full !p-3 !border-none outline-none bg-transparent shadow-none"
                                                panelClassName="premium-autocomplete-panel"
                                                pt={{
                                                    root: { className: 'w-full' },
                                                    container: { className: 'w-full p-1 rounded-xl border border-slate-200 hover:border-[#f97415] focus-within:border-[#f97415] focus-within:ring-4 focus-within:ring-[#f97415]/5 transition-all bg-white shadow-sm' },
                                                    token: { style: { display: 'none' } },
                                                    inputToken: { className: 'w-full !m-0 !p-0' },
                                                    panel: { className: 'bg-white shadow-2xl border border-slate-100 rounded-2xl mt-2 overflow-hidden' },
                                                    list: { className: 'p-2' },
                                                    item: { className: 'rounded-xl mb-1 last:mb-0 transition-colors' }
                                                }}
                                                itemTemplate={(item: UserInfo) => (
                                                    <div className={`flex items-center justify-between gap-3 p-3 rounded-xl ${
                                                        item.hasTeam 
                                                        ? 'opacity-40 grayscale cursor-not-allowed bg-slate-50' 
                                                        : 'hover:bg-slate-50 cursor-pointer'
                                                    }`}>
                                                        <div className="flex items-center gap-4">
                                                            <div className="relative">
                                                                <MemberAvatar email={item.email} fullName={item.fullName} avatarUrl={item.avatar} className="size-11 rounded-xl border border-slate-100 shadow-sm" />
                                                                {selectedStudents.some(s => s.userId === item.userId) && (
                                                                    <div className="absolute -top-1.5 -right-1.5 bg-green-500 text-white size-5 rounded-full flex items-center justify-center border-2 border-white shadow-md z-10 animate-in zoom-in duration-300">
                                                                        <i className="pi pi-check text-[9px] font-bold"></i>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-bold text-slate-800 text-sm">{item.fullName}</span>
                                                                    <span className="font-mono text-[10px] text-slate-400 font-medium tracking-tight">#{item.studentCode}</span>
                                                                </div>
                                                                <span className="text-xs text-slate-500 mt-0.5">{item.email}</span>
                                                            </div>
                                                        </div>
                                                        {item.hasTeam ? (
                                                            <span className="text-[9px] bg-red-50 text-red-500 px-2 py-1 rounded-full font-black uppercase tracking-tighter shadow-sm border border-red-100">In a Team</span>
                                                        ) : (
                                                            selectedStudents.some(s => s.userId === item.userId) && (
                                                                <span className="text-[9px] text-white font-bold bg-green-500 px-2.5 py-1 rounded-full shadow-sm">Selected</span>
                                                            )
                                                        )}
                                                    </div>
                                                )}
                                            />
                                        </div>

                                        {/* Selected Students List */}
                                        <div className="flex flex-col gap-3">
                                            {/* Logic: Leader always at top, then sort others by name */}
                                            {(() => {
                                                const sortedSelectedStudents = [...selectedStudents].sort((a, b) => {
                                                    if (a.userId === leaderUserId) return -1;
                                                    if (b.userId === leaderUserId) return 1;
                                                    return a.fullName.localeCompare(b.fullName);
                                                });

                                                return (
                                                    <>
                                            <div className="flex items-center justify-between mb-1">
                                                <h4 className="text-[11px] font-black text-[#f97415] uppercase tracking-[0.15em]">Selected Members ({selectedStudents.length})</h4>
                                                {selectedStudents.length > 0 && !leaderUserId && (
                                                    <span className="text-[10px] text-orange-500 font-bold animate-pulse flex items-center gap-1">
                                                        <i className="pi pi-info-circle"></i>
                                                        Please appoint a lead member
                                                    </span>
                                                )}
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {sortedSelectedStudents.map((stu) => (
                                                    <div 
                                                        key={stu.userId} 
                                                        className={`group relative flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl ${
                                                            leaderUserId === stu.userId 
                                                            ? 'border-orange-500 bg-orange-50/55 shadow-sm' 
                                                            : 'border-slate-100 bg-white hover:border-orange-200'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-4 min-w-0">
                                                            <div className="relative">
                                                                <MemberAvatar 
                                                                    email={stu.email} 
                                                                    fullName={stu.fullName} 
                                                                    avatarUrl={stu.avatar} 
                                                                    className={`size-14 rounded-2xl shadow-sm transition-transform group-hover:scale-105 border-2 ${leaderUserId === stu.userId ? 'border-orange-200' : 'border-white'}`} 
                                                                />
                                                                {leaderUserId === stu.userId && (
                                                                    <div className="absolute -top-2 -right-2 bg-gradient-to-br from-orange-400 to-orange-600 text-white size-7 rounded-full flex items-center justify-center shadow-lg border-2 border-white animate-bounce-subtle">
                                                                        <i className="pi pi-crown text-xs"></i>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-col min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-bold text-slate-800 text-base truncate">{stu.fullName}</span>
                                                                    {leaderUserId === stu.userId && (
                                                                        <span className="text-[8px] font-black bg-orange-500 text-white px-1.5 py-0.5 rounded-sm uppercase tracking-tighter">Leader</span>
                                                                    )}
                                                                </div>
                                                                <span className="font-mono text-xs text-slate-400 tracking-wider">#{stu.studentCode}</span>
                                                                <span className="text-xs text-slate-500 truncate mt-0.5">{stu.email}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Button 
                                                                icon="pi pi-crown" 
                                                                className={`p-button-rounded p-button-sm transition-all ${
                                                                    leaderUserId === stu.userId 
                                                                    ? 'bg-orange-500 text-white border-orange-500 shadow-md ring-4 ring-orange-500/10' 
                                                                    : 'p-button-text text-slate-300 hover:text-orange-500 hover:bg-orange-50'
                                                                }`}
                                                                onClick={() => setLeaderUserId(stu.userId)}
                                                                tooltip="Set as Team Leader"
                                                                tooltipOptions={{ position: 'top' }}
                                                                type="button"
                                                            />
                                                            <Button 
                                                                icon="pi pi-trash" 
                                                                className="p-button-rounded p-button-text p-button-secondary p-button-sm hover:text-red-500 hover:bg-red-50"
                                                                onClick={() => {
                                                                    setSelectedStudents(selectedStudents.filter(s => s.userId !== stu.userId));
                                                                    if (leaderUserId === stu.userId) setLeaderUserId(null);
                                                                }}
                                                                type="button"
                                                                tooltip="Remove Member"
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                                {selectedStudents.length === 0 && (
                                                    <div className="col-span-full py-12 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/30 text-slate-400 transition-colors hover:bg-slate-50 hover:border-orange-200">
                                                        <div className="bg-white size-14 rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 mb-3 text-orange-300">
                                                            <i className="pi pi-user-plus text-2xl"></i>
                                                        </div>
                                                        <p className="text-sm font-medium italic">No students selected yet</p>
                                                        <p className="text-[10px] uppercase tracking-widest mt-1 opacity-60">Use the search bar above to add members</p>
                                                    </div>
                                                )}
                                            </div>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}


                        {/* Title Input */}
                        <div className="flex flex-col gap-2">
                            <label htmlFor="title" className="font-semibold text-gray-700">Display Title <span className="text-red-500">*</span></label>
                            <InputTextarea
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter a public display title"
                                rows={1}
                                autoResize
                                className="w-full p-3 rounded-xl border border-gray-300 hover:border-orange-400 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all shadow-none focus:shadow-none resize-none"
                            />
                        </div>

                        {/* English Name */}
                        <div className="flex flex-col gap-2">
                            <label htmlFor="thesisNameEn" className="font-semibold text-gray-700">English Name <span className="text-red-500">*</span></label>
                            <InputTextarea
                                id="thesisNameEn"
                                value={thesisNameEn}
                                onChange={(e) => setThesisNameEn(e.target.value)}
                                placeholder="Official English Title"
                                rows={1}
                                autoResize
                                className="w-full p-3 rounded-xl border border-gray-300 hover:border-orange-400 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all shadow-none focus:shadow-none resize-none"
                            />
                        </div>

                        {/* Vietnamese Name */}
                        <div className="flex flex-col gap-2">
                            <label htmlFor="thesisNameVi" className="font-semibold text-gray-700">Vietnamese Name <span className="text-red-500">*</span></label>
                            <InputTextarea
                                id="thesisNameVi"
                                value={thesisNameVi}
                                onChange={(e) => setThesisNameVi(e.target.value)}
                                placeholder="Official Vietnamese Title"
                                rows={1}
                                autoResize
                                className="w-full p-3 rounded-xl border border-gray-300 hover:border-orange-400 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all shadow-none focus:shadow-none resize-none"
                            />
                        </div>

                        {/* Abbreviation & Classification Row */}
                        <div className="flex flex-col md:flex-row items-end gap-6 overflow-hidden">
                            {/* Abbreviation */}
                            <div className="flex flex-col gap-2 w-full md:w-[180px]">
                                <label htmlFor="abbreviation" className="font-semibold text-gray-700">Abbreviation <span className="text-red-500">*</span></label>
                                <InputText
                                    id="abbreviation"
                                    value={abbreviation}
                                    onChange={(e) => setAbbreviation(e.target.value.toUpperCase())}
                                    placeholder="e.g. FCTMS"
                                    maxLength={5}
                                    className="w-full p-3 rounded-xl border border-gray-300 hover:border-orange-400 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors shadow-none focus:shadow-none"
                                />
                            </div>

                            {/* Applied & AppUsed Checkboxes */}
                            <div className="flex items-center gap-6 pb-3 pt-2">
                                <div 
                                    className="flex items-center gap-2 group cursor-pointer transition-colors"
                                    onClick={() => setIsApplied(!isApplied)}
                                >
                                    <Checkbox
                                        inputId="isApplied"
                                        checked={isApplied}
                                        onChange={(e: CheckboxChangeEvent) => {
                                            e.originalEvent?.stopPropagation();
                                            setIsApplied(e.checked ?? false);
                                        }}
                                        pt={{
                                            box: ({ context }: { context: { checked: boolean } }) => ({
                                                className: context.checked ? 'bg-orange-500 border-orange-500' : ''
                                            })
                                        }}
                                    />
                                    <span className="text-sm font-medium text-slate-600 group-hover:text-orange-600 transition-colors whitespace-nowrap select-none">Has Application Value</span>
                                </div>
                                <div 
                                    className="flex items-center gap-2 group cursor-pointer transition-colors"
                                    onClick={() => setIsAppUsed(!isAppUsed)}
                                >
                                    <Checkbox
                                        inputId="isAppUsed"
                                        checked={isAppUsed}
                                        onChange={(e: CheckboxChangeEvent) => {
                                            e.originalEvent?.stopPropagation();
                                            setIsAppUsed(e.checked ?? false);
                                        }}
                                        pt={{
                                            box: ({ context }: { context: { checked: boolean } }) => ({
                                                className: context.checked ? 'bg-orange-500 border-orange-500' : ''
                                            })
                                        }}
                                    />
                                    <span className="text-sm font-medium text-slate-600 group-hover:text-orange-600 transition-colors whitespace-nowrap select-none">Uses App</span>
                                </div>
                            </div>
                        </div>

                        {/* Enterprise Section */}
                        <div className="flex flex-col gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 shadow-inner">
                            <div 
                                className="flex items-center gap-2 group cursor-pointer transition-colors"
                                onClick={() => setIsFromEnterprise(!isFromEnterprise)}
                            >
                                <Checkbox
                                    inputId="isFromEnterprise"
                                    checked={isFromEnterprise}
                                    onChange={(e: CheckboxChangeEvent) => {
                                        e.originalEvent?.stopPropagation();
                                        setIsFromEnterprise(e.checked ?? false);
                                        if (!(e.checked)) setEnterpriseName('');
                                    }}
                                    pt={{
                                        box: ({ context }: { context: { checked: boolean } }) => ({
                                            className: context.checked ? 'bg-orange-500 border-orange-500' : ''
                                        })
                                    }}
                                />
                                <span className="font-semibold text-gray-700 text-sm group-hover:text-orange-600 transition-colors select-none">Enterprise related</span>
                            </div>

                            {isFromEnterprise && (
                                <div className="flex flex-col gap-2 animate-fade-in">
                                    <label htmlFor="enterpriseName" className="text-sm font-medium text-gray-600">Enterprise Name <span className="text-red-500">*</span></label>
                                    <AutoComplete
                                        id="enterpriseName"
                                        value={enterpriseName}
                                        suggestions={filteredEnterprises}
                                        completeMethod={searchEnterprise}
                                        onChange={(e) => setEnterpriseName(e.value)}
                                        placeholder="Name of the partnering company"
                                        className="w-full"
                                        appendTo="self"
                                        inputClassName="w-full p-3 rounded-xl border border-gray-300 hover:border-orange-400 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all shadow-none focus:shadow-none"
                                        loadingIcon={<></>}
                                        pt={{
                                            loadingIcon: { className: 'hidden', style: { display: 'none' } }
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Description Input */}
                        <div className="flex flex-col gap-2">
                            <label htmlFor="description" className="font-semibold text-gray-700">Short Description <span className="text-red-500">*</span></label>
                            <InputTextarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={4}
                                placeholder="Provide a brief summary of the thesis objectives and scope"
                                className="w-full p-3 rounded-xl border border-gray-300 hover:border-orange-400 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors shadow-sm resize-none"
                                pt={{
                                    root: { className: 'font-medium text-gray-800' }
                                }}
                            />
                        </div>

                        {/* File Upload Area */}
                        <div className="flex flex-col gap-2">
                            <label className="font-semibold text-gray-700">Detailed Proposal Document (Word) <span className="text-red-500">*</span></label>

                            <div
                                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-4 ${isDragging ? 'border-orange-500 bg-orange-50 scale-[1.01]' : 'border-gray-300 hover:border-orange-400 hover:bg-orange-50/30'} ${file ? 'bg-orange-50/50 border-orange-300' : ''}`}
                                onDragOver={onDragOver}
                                onDragLeave={onDragLeave}
                                onDrop={onDrop}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                    onChange={onFileSelect}
                                />

                                {file ? (
                                    <>
                                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-blue-500 shadow-sm mb-2">
                                            <i className="pi pi-file-word text-3xl"></i>
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800 text-lg">{file.name}</p>
                                            <p className="text-sm text-gray-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                        <Button
                                            label="Change File"
                                            icon="pi pi-refresh"
                                            size="small"
                                            outlined
                                            severity="secondary"
                                            className="mt-2 rounded-xl"
                                            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                                            type="button"
                                        />
                                    </>
                                ) : (
                                    <>
                                        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center text-orange-500 mb-2 group-hover:scale-110 transition-transform">
                                            <i className="pi pi-cloud-upload text-3xl"></i>
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800 text-lg">Click to upload or drag and drop</p>
                                            <p className="text-sm text-gray-500 mt-1">Word Documents (.doc, .docx) up to {fileSizeLimit}MB</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Submit Actions */}
                        <div className="flex justify-end gap-4 border-t border-gray-100 pt-6 mt-2">
                            <Button
                                label={isSubmitting ? "Submitting..." : "Submit Proposal"}
                                type="submit"
                                disabled={isSubmitting}
                                className={`px-8 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 border-none font-bold text-white transition-all duration-300 ${!isSubmitting ? 'hover:from-orange-600 hover:to-orange-700 shadow-md shadow-orange-200/50' : 'opacity-70 cursor-not-allowed'}`}
                                pt={{
                                    root: { className: 'focus:ring-2 focus:ring-offset-2 focus:ring-orange-500' }
                                }}
                            />
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ProposeThesisPage;
