/* eslint-disable react-hooks/incompatible-library */
import { useEffect, type FC } from 'react';
import { useForm } from 'react-hook-form';
import { semesterService } from '../../services/semesterService';
import type { Semester } from '../../services/semesterService';
import Swal from '../../utils/swal';
import { Dialog } from 'primereact/dialog';

interface SemesterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    semesterData?: Semester; // Optional: If present, mode is EDIT
}

interface SemesterFormInputs {
    semesterId?: number;
    semesterCode: string;
    semesterName: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
}

const SemesterModal: FC<SemesterModalProps> = ({ isOpen, onClose, onSuccess, semesterData }) => {
    const isEditMode = !!semesterData;
    const { register, handleSubmit, formState: { errors, isSubmitting }, reset, watch, setValue } = useForm<SemesterFormInputs>();
    const startDate = watch('startDate');
    const endDate = watch('endDate');

    // Load initial data when modal opens or semesterData changes
    useEffect(() => {
        if (isOpen) {
            if (semesterData) {
                // Edit Mode
                setValue('semesterId', semesterData.semesterId);
                setValue('semesterCode', semesterData.semesterCode);
                setValue('semesterName', semesterData.semesterName);
                setValue('startDate', new Date(semesterData.startDate).toISOString().split('T')[0]);
                setValue('endDate', new Date(semesterData.endDate).toISOString().split('T')[0]);
                setValue('isActive', semesterData.isActive);
            } else {
                // Create Mode -> Reset
                reset({
                    semesterCode: '',
                    semesterName: '',
                    startDate: '',
                    endDate: '',
                    isActive: false
                });
            }
        }
    }, [isOpen, semesterData, setValue, reset]);

    // Basic date validation logic
    const isEndDateInvalid = startDate && endDate && new Date(endDate) <= new Date(startDate);

    // Advanced Logic Validation
    const validateLogic = (data: SemesterFormInputs) => {
        const { semesterCode, semesterName } = data;
        const codePrefix = semesterCode.substring(0, 2).toUpperCase();

        if (codePrefix === 'SP' && !semesterName.toLowerCase().includes('spring')) return "Code 'SP' (Spring) requires 'Spring' in Semester Name";
        if (codePrefix === 'SU' && !semesterName.toLowerCase().includes('summer')) return "Code 'SU' (Summer) requires 'Summer' in Semester Name";
        if (codePrefix === 'FA' && !semesterName.toLowerCase().includes('fall')) return "Code 'FA' (Fall) requires 'Fall' in Semester Name";

        return null;
    };

    const onSubmit = async (data: SemesterFormInputs) => {
        if (isEndDateInvalid) return;

        const logicError = validateLogic(data);
        if (logicError) {
            Swal.fire({
                icon: 'warning',
                title: 'Validation Error',
                text: logicError,
            });
            return;
        }

        try {
            if (isEditMode && semesterData) {
                await semesterService.updateSemester(semesterData.semesterId, {
                    semesterCode: data.semesterCode,
                    semesterName: data.semesterName,
                    startDate: data.startDate,
                    endDate: data.endDate
                });
            } else {
                await semesterService.createSemester(data);
            }

            // Dispatch event to update Header
            window.dispatchEvent(new Event('semesterChanged'));

            Swal.fire({
                icon: 'success',
                title: 'Success',
                text: `Semester ${isEditMode ? 'updated' : 'created'} successfully!`,
                timer: 1500,
                showConfirmButton: false
            });

            if (!isEditMode) reset(); // Only reset on create (edit might stay open or close)
            onClose();
            if (onSuccess) onSuccess();
        } catch (error: unknown) {
            const errorMessage = error instanceof Error && 'response' in error
                ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
                : undefined;
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: errorMessage || `Failed to ${isEditMode ? 'update' : 'create'} semester. Please try again.`,
            });
        }
    };

    const header = (
        <div className="flex flex-col gap-1">
            <h2 className="text-gray-900 text-2xl font-bold tracking-tight m-0">
                {isEditMode ? 'Edit Semester' : 'Create New Semester'}
            </h2>
            <p className="text-gray-500 text-sm font-normal m-0">
                {isEditMode
                    ? <>Update the details for <span className="font-semibold text-orange-600">{semesterData?.semesterName}</span>.</>
                    : 'Define the timeframe and status for the upcoming academic period.'
                }
            </p>
        </div>
    );

    const footer = (
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors cursor-pointer"
            >
                {isEditMode ? 'Close' : 'Cancel'}
            </button>
            {/* Show Save/Create button only if active or if it's create mode */}
            {(!isEditMode || semesterData?.isActive) && (
                <button
                    type="submit"
                    form="semester-form"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-orange-500 text-white font-bold text-sm shadow-lg shadow-orange-500/20 hover:bg-orange-600 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                >
                    {isSubmitting ? (
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                            <span>{isEditMode ? 'Saving...' : 'Creating...'}</span>
                        </div>
                    ) : (
                        isEditMode ? 'Save Changes' : 'Create Semester'
                    )}
                </button>
            )}
        </div>
    );

    return (
        <Dialog
            header={header}
            visible={isOpen}
            onHide={onClose}
            className="w-full max-w-160"
            footer={footer}
            blockScroll
            draggable={false}
        >
            <form id="semester-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 pt-2">
                {isEditMode && semesterData && !semesterData.isActive && (
                    <div className="bg-orange-50 border border-orange-200 text-orange-800 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
                        <span className="material-symbols-outlined">lock</span>
                        This semester has ended and cannot be modified.
                    </div>
                )}

                <fieldset disabled={isEditMode && semesterData && !semesterData.isActive} className="contents disabled:opacity-60">
                    {/* Hidden ID field for edit */}
                    {isEditMode && <input type="hidden" {...register('semesterId')} />}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-gray-900 text-sm font-semibold">Semester Code <span className="text-red-500">*</span></label>
                            <input
                                {...register('semesterCode', { required: 'Semester Code is required', pattern: { value: /^(SP|SU|FA)\d{2}$/, message: 'Format: SP/SU/FA + 2 digits (e.g., FA24)' } })}
                                className={`w-full rounded-xl border border-gray-300 bg-white h-12 px-4 text-sm font-medium shadow-sm placeholder:text-gray-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all ${errors.semesterCode ? 'border-red-500' : ''}`}
                                placeholder="e.g., FA24"
                                type="text"

                            />
                            {errors.semesterCode && <span className="text-xs text-red-500">{errors.semesterCode.message}</span>}
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-gray-900 text-sm font-semibold">Semester Name <span className="text-red-500">*</span></label>
                            <input
                                {...register('semesterName', { required: 'Semester Name is required' })}
                                className="w-full rounded-xl border border-gray-300 bg-white h-12 px-4 text-sm font-medium shadow-sm placeholder:text-gray-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                                placeholder="e.g., Fall 2024"
                                type="text"

                            />
                            {errors.semesterName && <span className="text-xs text-red-500">{errors.semesterName.message}</span>}
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <label className="text-gray-900 text-sm font-semibold">Duration <span className="text-red-500">*</span></label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Start Date</label>
                                <input
                                    {...register('startDate', { required: 'Start Date is required' })}
                                    type="date"
                                    className="w-full rounded-xl border border-gray-300 bg-white h-12 px-4 text-sm font-medium shadow-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                                />

                                {errors.startDate && <span className="text-xs text-red-500">{errors.startDate.message}</span>}
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">End Date</label>
                                <input
                                    {...register('endDate', { required: 'End Date is required' })}
                                    type="date"
                                    className="w-full rounded-xl border border-gray-300 bg-white h-12 px-4 text-sm font-medium shadow-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                                />

                                {errors.endDate && <span className="text-xs text-red-500">{errors.endDate.message}</span>}
                            </div>
                        </div>
                        {isEndDateInvalid && (
                            <div className="flex items-center gap-1.5 text-red-600 text-xs font-medium px-1">
                                <span className="material-symbols-outlined text-base">error</span>
                                <p>End date must be after start date</p>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm">

                        <div className="flex flex-col gap-1">
                            <p className="text-gray-900 text-base font-bold leading-tight">Set as Active Semester</p>
                            <p className="text-gray-500 text-xs font-normal leading-normal">Make this the current semester for all department activities.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input {...register('isActive')} type="checkbox" className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                        </label>
                    </div>
                </fieldset>
            </form>
        </Dialog>
    );
};

export default SemesterModal;
