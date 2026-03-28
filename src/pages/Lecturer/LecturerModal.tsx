import { useState, useEffect, type FC } from 'react';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputSwitch } from 'primereact/inputswitch';
import { lecturerService, type Lecturer } from '../../services/lecturerService';
import { authService } from '../../services/authService';
import Swal from '../../utils/swal';

interface LecturerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    lecturerData?: Lecturer | null;
}

const LecturerModal: FC<LecturerModalProps> = ({ isOpen, onClose, onSuccess, lecturerData }) => {
    const [formData, setFormData] = useState<Partial<Lecturer>>({
        email: '',
        fullName: '',
        campus: '',
        isActive: true
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const currentUser = authService.getUser();
    const isHOD = currentUser?.roleName === 'HOD';

    useEffect(() => {
        if (lecturerData) {
            setFormData({
                ...lecturerData
            });
        } else {
            setFormData({
                email: '',
                fullName: '',
                campus: isHOD ? (currentUser?.campus || '') : '',
                isActive: true
            });
        }
    }, [lecturerData, isOpen, isHOD, currentUser?.campus]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target as HTMLInputElement;
        const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
        setFormData(prev => ({ ...prev, [name]: val }));
    };

    const campusOptions = [
        { label: 'FU-Hòa Lạc', value: 'FU-Hòa Lạc' },
        { label: 'FU-Hồ Chí Minh', value: 'FU-Hồ Chí Minh' },
        { label: 'FU-Đà Nẵng', value: 'FU-Đà Nẵng' },
        { label: 'FU-Cần Thơ', value: 'FU-Cần Thơ' },
        { label: 'FU-Quy Nhơn', value: 'FU-Quy Nhơn' }
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.email) {
            Swal.fire('Error', 'Email is required', 'error');
            return;
        }

        try {
            setIsSubmitting(true);
            if (lecturerData?.lecturerId) {
                await lecturerService.updateLecturer(lecturerData.lecturerId, formData);
                Swal.fire({
                    icon: 'success',
                    title: 'Updated!',
                    text: 'Lecturer information has been updated.',
                    timer: 1500,
                    showConfirmButton: false
                });
            } else {
                await lecturerService.createLecturer(formData);
                Swal.fire({
                    icon: 'success',
                    title: 'Created!',
                    text: 'New lecturer has been added to the pool.',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
            onSuccess();
        } catch (error: unknown) {
            console.error(error);
            const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to save lecturer';
            Swal.fire('Error', message, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const dialogHeader = (
        <div className="flex items-center gap-3 text-gray-800">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${lecturerData ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                <span className="material-symbols-outlined">{lecturerData ? 'edit_square' : 'person_add'}</span>
            </div>
            <div>
                <h3 className="text-xl font-bold">{lecturerData ? 'Edit Lecturer' : 'Add New Lecturer'}</h3>
                <p className="text-xs text-gray-500 font-normal">Manage lecturer information in the system pool</p>
            </div>
        </div>
    );

    return (
        <Dialog
            header={dialogHeader}
            visible={isOpen}
            style={{ width: '500px' }}
            onHide={onClose}
            className="font-sans"
            contentClassName="rounded-b-2xl"
            headerClassName="rounded-t-2xl border-b border-gray-100 bg-white p-6"
            maskClassName="bg-gray-900/40 backdrop-blur-sm"
        >
            <form onSubmit={handleSubmit} className="flex flex-col gap-5 py-4">
                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-bold text-gray-700 ml-1">Full Name</label>
                    <input
                        type="text"
                        name="fullName"
                        value={formData.fullName || ''}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none text-gray-900"
                        placeholder="e.g. Vo Van Vuong"
                    />
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-bold text-gray-700 ml-1">Email <span className="text-red-500">*</span></label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email || ''}
                        onChange={handleChange}
                        required
                        disabled={!!lecturerData}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none text-gray-900 disabled:opacity-60"
                        placeholder="lecturer@fpt.edu.vn"
                    />
                </div>

                <div className={`grid ${isHOD ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
                    {!isHOD && (
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-bold text-gray-700 ml-1">Campus</label>
                            <Dropdown
                                value={formData.campus}
                                onChange={(e) => setFormData(prev => ({ ...prev, campus: e.value }))}
                                options={campusOptions}
                                optionLabel="label"
                                placeholder="Select Campus"
                                appendTo="self"
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none text-gray-900"
                                pt={{
                                    root: { style: { padding: '4px 8px' } },
                                    input: { className: 'text-sm font-medium py-2' },
                                    item: { className: 'text-sm' }
                                }}
                            />
                        </div>
                    )}

                    <div className="flex flex-col gap-1.5 items-start">
                        <label className="text-sm font-bold text-gray-700 ml-1 mb-1">Status</label>
                        <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 w-full">
                            <InputSwitch
                                checked={formData.isActive || false}
                                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.value }))}
                                className={formData.isActive ? 'orange-switch' : ''}
                            />
                            <span className={`text-sm font-bold ${formData.isActive ? 'text-orange-600' : 'text-gray-500'}`}>
                                {formData.isActive ? 'Currently Active' : 'Inactive'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="mt-4 p-4 bg-orange-50 border border-orange-100 rounded-xl">
                    <div className="flex gap-3">
                        <span className="material-symbols-outlined text-orange-500 text-lg">info</span>
                        <p className="text-xs text-orange-700 leading-relaxed font-medium">
                            Active lecturers are automatically added to the whitelist of all ongoing and upcoming semesters.
                        </p>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-8 py-2.5 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 shadow-lg shadow-orange-500/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                    >
                        {isSubmitting && <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>}
                        {lecturerData ? 'Update Lecturer' : 'Add Lecturer'}
                    </button>
                </div>
            </form>
        </Dialog>
    );
};

export default LecturerModal;
