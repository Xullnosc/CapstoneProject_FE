/* eslint-disable react-hooks/incompatible-library */
import React from 'react';
import { useForm } from 'react-hook-form';
import { semesterService } from '../../services/semesterService';
import Swal from 'sweetalert2';

interface CreateSemesterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

interface CreateSemesterFormInputs {
    semesterCode: string;
    semesterName: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
}

const CreateSemesterModal: React.FC<CreateSemesterModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const { register, handleSubmit, formState: { errors, isSubmitting }, reset, watch } = useForm<CreateSemesterFormInputs>();
    const startDate = watch('startDate');
    const endDate = watch('endDate');

    // Basic date validation logic
    const isEndDateInvalid = startDate && endDate && new Date(endDate) <= new Date(startDate);

    // Advanced Logic Validation
    const validateLogic = (data: CreateSemesterFormInputs) => {
        const { semesterCode, semesterName } = data;
        const codePrefix = semesterCode.substring(0, 2).toUpperCase();

        // Check Season Match (Code vs Name)
        if (codePrefix === 'SP' && !semesterName.toLowerCase().includes('spring')) return "Code 'SP' (Spring) requires 'Spring' in Semester Name";
        if (codePrefix === 'SU' && !semesterName.toLowerCase().includes('summer')) return "Code 'SU' (Summer) requires 'Summer' in Semester Name";
        if (codePrefix === 'FA' && !semesterName.toLowerCase().includes('fall')) return "Code 'FA' (Fall) requires 'Fall' in Semester Name";

        return null;
    };

    const onSubmit = async (data: CreateSemesterFormInputs) => {
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
            await semesterService.createSemester(data);

            // Dispatch event to update Header
            window.dispatchEvent(new Event('semesterChanged'));

            Swal.fire({
                icon: 'success',
                title: 'Success',
                text: 'Semester created successfully!',
                timer: 1500,
                showConfirmButton: false
            });
            reset();
            onClose();
            if (onSuccess) onSuccess();
        } catch (error: unknown) {
            const errorMessage = error instanceof Error && 'response' in error
                ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
                : undefined;
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: errorMessage || 'Failed to create semester. Please try again.',
            });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative z-10 w-full max-w-[640px] bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex items-start justify-between px-10 pt-10 pb-6 border-b border-gray-100">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-gray-900 text-2xl font-bold tracking-tight">Create New Semester</h2>
                        <p className="text-gray-500 text-sm font-normal">Define the timeframe and status for the upcoming academic period.</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
                        <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="contents">
                    <div className="px-10 py-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-gray-900 text-sm font-semibold">Semester Code <span className="text-red-500">*</span></label>
                                <input
                                    {...register('semesterCode', { required: 'Semester Code is required', pattern: { value: /^(SP|SU|FA)\d{2}$/, message: 'Format: SP/SU/FA + 2 digits (e.g., FA24)' } })}
                                    className={`w-full rounded-xl border-gray-200 bg-white h-12 px-4 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all ${errors.semesterCode ? 'border-red-500' : ''}`}
                                    placeholder="e.g., FA24"
                                    type="text"
                                />
                                {errors.semesterCode && <span className="text-xs text-red-500">{errors.semesterCode.message}</span>}
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-gray-900 text-sm font-semibold">Semester Name <span className="text-red-500">*</span></label>
                                <input
                                    {...register('semesterName', { required: 'Semester Name is required' })}
                                    className="w-full rounded-xl border-gray-200 bg-white h-12 px-4 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
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
                                        className="w-full rounded-xl border-gray-200 bg-white h-12 px-4 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                                    />
                                    {errors.startDate && <span className="text-xs text-red-500">{errors.startDate.message}</span>}
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">End Date</label>
                                    <input
                                        {...register('endDate', { required: 'End Date is required' })}
                                        type="date"
                                        className="w-full rounded-xl border-gray-200 bg-white h-12 px-4 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
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

                        <div className="flex items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-6 mt-2">
                            <div className="flex flex-col gap-1">
                                <p className="text-gray-900 text-base font-bold leading-tight">Set as Active Semester</p>
                                <p className="text-gray-500 text-xs font-normal leading-normal">Make this the current semester for all department activities.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input {...register('isActive')} type="checkbox" className="sr-only peer" />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                            </label>
                        </div>
                    </div>

                    <div className="px-10 py-8 flex items-center justify-end gap-4 border-t border-gray-50 bg-white">
                        <button type="button" onClick={onClose} className="px-8 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={isSubmitting} className="px-8 py-3 rounded-xl bg-orange-500 text-white font-bold text-sm shadow-xl shadow-orange-500/25 hover:bg-orange-600 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed">
                            {isSubmitting ? 'Creating...' : 'Create Semester'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateSemesterModal;
