import { useState, useEffect, type FC } from 'react';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { semesterService, type Whitelist } from '../../services/semesterService';
import { teamService } from '../../services/teamService';
import Swal from '../../utils/swal';

interface ForceCreateTeamModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    semesterId: number;
}

const ForceCreateTeamModal: FC<ForceCreateTeamModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    semesterId
}) => {
    const [teamName, setTeamName] = useState('');
    const [description, setDescription] = useState('');
    const [orphanedStudents, setOrphanedStudents] = useState<Whitelist[]>([]);
    const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
    const [leaderEmail, setLeaderEmail] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingStudents, setIsLoadingStudents] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setTeamName('');
            setDescription('');
            setSelectedEmails([]);
            setLeaderEmail(null);
            fetchOrphanedStudents();
        }
    }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchOrphanedStudents = async () => {
        setIsLoadingStudents(true);
        try {
            const data = await semesterService.getOrphanedStudents(semesterId, 1, 1000);
            setOrphanedStudents(data.items);
        } catch {
            setOrphanedStudents([]);
        } finally {
            setIsLoadingStudents(false);
        }
    };

    const toggleMember = (email: string) => {
        setSelectedEmails(prev => {
            const isSelected = prev.includes(email);
            if (isSelected) {
                if (leaderEmail === email) setLeaderEmail(null);
                return prev.filter(e => e !== email);
            }
            if (prev.length >= 5) return prev;
            return [...prev, email];
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!teamName.trim()) {
            Swal.fire({ icon: 'warning', title: 'Missing Info', text: 'Team name is required.' });
            return;
        }
        if (teamName.trim().length < 3) {
            Swal.fire({ icon: 'warning', title: 'Invalid Name', text: 'Team name must be at least 3 characters long.' });
            return;
        }
        if (selectedEmails.length === 0) {
            Swal.fire({ icon: 'warning', title: 'Missing Info', text: 'Select at least one member.' });
            return;
        }
        if (!leaderEmail) {
            Swal.fire({ icon: 'warning', title: 'Missing Info', text: 'Please select a team leader.' });
            return;
        }

        try {
            setIsSubmitting(true);
            await teamService.forceCreateTeam({
                teamName: teamName.trim(),
                description: description.trim() || undefined,
                semesterId,
                leaderEmail,
                memberEmails: selectedEmails,
            });
            Swal.fire({ icon: 'success', title: 'Team Created!', text: 'Team has been created successfully.', timer: 1500, showConfirmButton: false });
            onClose();
            onSuccess();
        } catch (error: unknown) {
            let message = 'Failed to create team.';
            
            const err = error as { response?: { data?: { errors?: Record<string, string[]>, message?: string } } };

            // Handle ASP.NET Core Validation Errors (errors object)
            if (err.response?.data?.errors) {
                const errors = err.response.data.errors;
                const errorMessages = Object.values(errors).flat();
                if (errorMessages.length > 0) {
                   message = errorMessages.join('\n');
                }
            } else if (err.response?.data?.message) {
                message = err.response.data.message;
            }

            Swal.fire({ icon: 'error', title: 'Error', text: message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const leaderOptions = selectedEmails.map(email => {
        const s = orphanedStudents.find(st => st.email === email);
        return { label: s ? `${s.fullName || s.email} (${s.email})` : email, value: email };
    });

    const dialogHeader = (
        <div className="flex items-center gap-3 text-gray-800">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-orange-100 text-orange-600">
                <span className="material-symbols-outlined">group_add</span>
            </div>
            <div>
                <h3 className="text-xl font-bold">Force Create Team</h3>
                <p className="text-xs text-gray-500 font-normal">Assign orphaned students to a new team</p>
            </div>
        </div>
    );

    return (
        <Dialog
            header={dialogHeader}
            visible={isOpen}
            style={{ width: '520px' }}
            onHide={onClose}
            draggable={false}
            resizable={false}
            className="font-sans"
            headerClassName="border-b border-gray-100 p-6"
            contentClassName="p-6"
            maskClassName="bg-gray-900/40 backdrop-blur-sm"
            blockScroll
        >
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {/* Team Name */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-bold text-gray-700">Team Name <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none text-sm"
                        placeholder="Enter team name..."
                    />
                </div>

                {/* Description */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-bold text-gray-700">Description</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none text-sm resize-none"
                        placeholder="Optional description..."
                    />
                </div>

                {/* Student Selection */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-bold text-gray-700">
                        Select Members <span className="text-red-500">*</span>
                        {selectedEmails.length > 0 && (
                            <span className={`ml-2 text-xs font-medium px-2 py-0.5 rounded-full ${
                                selectedEmails.length < 4 
                                ? 'bg-amber-50 text-amber-600 border border-amber-100' 
                                : 'bg-orange-50 text-orange-600'
                            }`}>
                                {selectedEmails.length} member{selectedEmails.length > 1 ? 's' : ''} 
                                {selectedEmails.length < 4 && ' (Special)'}
                                {selectedEmails.length === 5 && ' (Max reached)'}
                            </span>
                        )}
                    </label>
                    {selectedEmails.length < 4 && selectedEmails.length > 0 && (
                        <p className="text-[10px] text-amber-600 mt-0.5 italic">
                            Teams with fewer than 4 members will stay as "Special" to bypass requirements.
                        </p>
                    )}

                    {isLoadingStudents ? (
                        <div className="flex items-center justify-center py-8 text-gray-400">
                            <span className="material-symbols-outlined animate-spin text-xl mr-2">progress_activity</span>
                            <span className="text-sm">Loading students...</span>
                        </div>
                    ) : orphanedStudents.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                            <span className="material-symbols-outlined text-3xl mb-2">person_off</span>
                            <p className="text-sm font-medium">No orphaned students available</p>
                        </div>
                    ) : (
                        <div className="max-h-52 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100 bg-gray-50/50">
                            {orphanedStudents.map((s) => {
                                const isChecked = selectedEmails.includes(s.email);
                                return (
                                    <label
                                        key={s.email}
                                        className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-orange-50/60 transition-colors ${isChecked ? 'bg-orange-50' : ''}`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            disabled={!isChecked && selectedEmails.length >= 5}
                                            onChange={() => toggleMember(s.email)}
                                            className="accent-orange-500 w-4 h-4 rounded cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                        />
                                        <img
                                            src={s.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.fullName || 'S')}&background=random&color=fff&size=32`}
                                            alt=""
                                            className="w-8 h-8 rounded-full border border-gray-200 object-cover"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-800 truncate">{s.fullName || 'N/A'}</p>
                                            <p className="text-xs text-gray-500 truncate">{s.email}</p>
                                        </div>
                                        {s.studentCode && (
                                            <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">{s.studentCode}</span>
                                        )}
                                    </label>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Leader Selection (PrimeReact Dropdown) */}
                {selectedEmails.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-bold text-gray-700">Team Leader <span className="text-red-500">*</span></label>
                        <Dropdown
                            value={leaderEmail}
                            onChange={(e) => setLeaderEmail(e.value)}
                            options={leaderOptions}
                            optionLabel="label"
                            placeholder="Select a leader..."
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none text-sm"
                            pt={{
                                root: { style: { padding: '4px 8px' } },
                                input: { className: 'text-sm font-medium py-2' },
                                item: { className: 'text-sm' }
                            }}
                        />
                    </div>
                )}

                {/* Footer Buttons */}
                <div className="flex justify-end gap-3 mt-2 pt-4 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting || selectedEmails.length === 0 || !leaderEmail}
                        className="px-6 py-2.5 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {isSubmitting && <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>}
                        Create Team
                    </button>
                </div>
            </form>
        </Dialog>
    );
};

export default ForceCreateTeamModal;
