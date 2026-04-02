import { useState, useEffect, type FC } from 'react';
import { Dialog } from 'primereact/dialog';
import { whitelistService } from '../../services/whitelistService';
import type { Whitelist } from '../../services/semesterService';
import Swal from '../../utils/swal';

interface WhitelistStudentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    semesterId: number;
    studentData?: Whitelist | null;
}

const WhitelistStudentModal: FC<WhitelistStudentModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    semesterId,
    studentData
}) => {
    const [formData, setFormData] = useState<Partial<Whitelist>>({
        email: '',
        fullName: '',
        semesterId: semesterId,
        roleId: 3 // Assuming Student role ID is 3
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (studentData) {
            setFormData({
                ...studentData,
                semesterId: semesterId
            });
        } else {
            setFormData({
                email: '',
                fullName: '',
                semesterId: semesterId,
                roleId: 3
            });
        }
    }, [studentData, isOpen, semesterId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.email) {
            Swal.fire('Error', 'Email is required', 'error');
            return;
        }

        try {
            setIsSubmitting(true);

            // Clean up data for backend
            const payload = {
                whitelistId: studentData?.whitelistId,
                email: formData.email,
                fullName: formData.fullName,
                semesterId: formData.semesterId,
                roleId: formData.roleId,
                studentCode: formData.studentCode,
                avatar: formData.avatar,
                isReviewer: formData.isReviewer
            };

            if (studentData?.whitelistId) {
                await whitelistService.updateWhitelist(studentData.whitelistId, payload);
                Swal.fire({
                    icon: 'success',
                    title: 'Updated!',
                    text: 'Student has been updated in whitelist.',
                    timer: 1500,
                    showConfirmButton: false
                });
            } else {
                await whitelistService.addWhitelist(payload);
                Swal.fire({
                    icon: 'success',
                    title: 'Added!',
                    text: 'Student has been added to semester whitelist.',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
            onSuccess();
        } catch (error: unknown) {
            console.error(error);
            const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to save student to whitelist';
            Swal.fire('Error', message, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const dialogHeader = (
        <div className="flex items-center gap-3 text-gray-800">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${studentData ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                <span className="material-symbols-outlined">{studentData ? 'person_edit' : 'person_add'}</span>
            </div>
            <div>
                <h3 className="text-xl font-bold">{studentData ? 'Edit Student' : 'Add Student to Whitelist'}</h3>
                <p className="text-xs text-gray-500 font-normal">Manage student access for this semester</p>
            </div>
        </div>
    );

    return (
        <Dialog
            header={dialogHeader}
            visible={isOpen}
            style={{ width: '450px' }}
            onHide={onClose}
            draggable={false}
            resizable={false}
            className="font-sans"
            headerClassName="border-b border-gray-100 p-6"
            contentClassName="p-6"
            maskClassName="bg-gray-900/40 backdrop-blur-sm"
        >
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-bold text-gray-700">Student Email <span className="text-red-500">*</span></label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email || ''}
                        onChange={handleChange}
                        required
                        disabled={!!studentData}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-sm disabled:opacity-60"
                        placeholder="student_code@fpt.edu.vn"
                    />
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-bold text-gray-700 ml-1">Full Name</label>
                    <input
                        type="text"
                        name="fullName"
                        value={formData.fullName || ''}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-sm"
                        placeholder="e.g. Nguyen Van A"
                    />
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-bold text-gray-700 ml-1">Student Code</label>
                    <input
                        type="text"
                        name="studentCode"
                        value={formData.studentCode || ''}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-sm"
                        placeholder="e.g. SE123456"
                    />
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
                    >
                        {isSubmitting && <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>}
                        {studentData ? 'Update Student' : 'Add to Whitelist'}
                    </button>
                </div>
            </form>
        </Dialog>
    );
};

export default WhitelistStudentModal;
