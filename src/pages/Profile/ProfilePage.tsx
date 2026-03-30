import { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Password } from 'primereact/password';
import { Avatar } from 'primereact/avatar';
import { Tag } from 'primereact/tag';
import { Divider } from 'primereact/divider';
import { authService } from '../../services/authService';
import { userService } from '../../services/userService';
import PremiumBreadcrumb from '../../components/Common/PremiumBreadcrumb';
import Swal from '../../utils/swal';

const passwordIconStyle = `
  .p-password {
    position: relative !important;
    display: flex !important;
    align-items: center !important;
    width: 100% !important;
  }
  .p-password input {
    width: 100% !important;
    padding-right: 3rem !important;
  }
  .p-password .p-password-toggle-mask,
  .p-password-toggle-mask.pi {
    position: absolute !important;
    top: 50% !important;
    right: 1.25rem !important;
    transform: translateY(-50%) !important;
    margin-top: 0 !important;
    cursor: pointer;
    z-index: 10;
    line-height: normal !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }
  .p-password-toggle-mask svg,
  .p-password-toggle-mask i {
    position: static !important;
    transform: none !important;
  }
`;

const ProfilePage = () => {
    const user = authService.getUser();
    const [profile, setProfile] = useState<typeof user>(user);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [formData, setFormData] = useState({
        fullName: user?.fullName || '',
        email: user?.email || '',
        studentCode: user?.studentCode || '',
        campus: user?.campus || '',
        role: user?.roleName || '',
        phoneNumber: user?.phoneNumber || '',
        githubLink: user?.githubLink || '',
        linkedinLink: user?.linkedinLink || '',
        facebookLink: user?.facebookLink || '',
        dateOfBirth: user?.dateOfBirth ? String(user.dateOfBirth).slice(0, 10) : '',
        gender: user?.gender || '',
        address: user?.address || '',
        major: user?.major || '',
        personalId: user?.personalId || '',
        placeOfBirth: user?.placeOfBirth || '',
        enrollmentYear: user?.enrollmentYear?.toString() || '',
        newPassword: '',
        confirmPassword: ''
    });

    const dataSource = profile || user;

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const data = await userService.getProfile();
                setProfile(data);
                authService.setUser(data);
                setFormData({
                    fullName: data.fullName || '',
                    email: data.email || '',
                    studentCode: data.studentCode || '',
                    campus: data.campus || '',
                    role: data.roleName || '',
                    phoneNumber: data.phoneNumber || '',
                    githubLink: data.githubLink || '',
                    linkedinLink: data.linkedinLink || '',
                    facebookLink: data.facebookLink || '',
                    dateOfBirth: data.dateOfBirth ? String(data.dateOfBirth).slice(0, 10) : '',
                    gender: data.gender || '',
                    address: data.address || '',
                    major: data.major || '',
                    personalId: data.personalId || '',
                    placeOfBirth: data.placeOfBirth || '',
                    enrollmentYear: data.enrollmentYear?.toString() || '',
                    newPassword: '',
                    confirmPassword: ''
                });
            } catch {
                setProfile(user);
            } finally {
                setLoadingProfile(false);
            }
        };
        loadProfile();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const breadcrumbItems = [
        { label: 'Homepage', to: '/home' },
        { label: 'Personal Profile' }
    ];

    const handleEdit = () => setIsEditing(true);
    const handleCancel = () => {
        setIsEditing(false);
        setFormData({
            fullName: dataSource?.fullName || '',
            email: dataSource?.email || '',
            studentCode: dataSource?.studentCode || '',
            campus: dataSource?.campus || '',
            role: dataSource?.roleName || '',
            phoneNumber: dataSource?.phoneNumber || '',
            githubLink: dataSource?.githubLink || '',
            linkedinLink: dataSource?.linkedinLink || '',
            facebookLink: dataSource?.facebookLink || '',
            dateOfBirth: dataSource?.dateOfBirth ? String(dataSource.dateOfBirth).slice(0, 10) : '',
            gender: dataSource?.gender || '',
            address: dataSource?.address || '',
            major: dataSource?.major || '',
            personalId: dataSource?.personalId || '',
            placeOfBirth: dataSource?.placeOfBirth || '',
            enrollmentYear: dataSource?.enrollmentYear?.toString() || '',
            newPassword: '',
            confirmPassword: ''
        });
    };

    const handleSave = async () => {
        // Simple Vietnamese Phone Number validation (10-11 digits)
        const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/g;
        if (formData.phoneNumber && !phoneRegex.test(formData.phoneNumber)) {
            Swal.fire({
                icon: 'error',
                title: 'Invalid Phone Number',
                text: 'Please enter a valid Vietnamese phone number (e.g., 0912345678).',
                confirmButtonColor: '#F26F21'
            });
            return;
        }

        setLoading(true);
            try {
                if (formData.newPassword) {
                    if (formData.newPassword.length < 6) {
                        throw new Error("Password must be at least 6 characters.");
                    }
                    if (formData.newPassword !== formData.confirmPassword) {
                        throw new Error("New password and confirm password do not match.");
                    }
                    try {
                        await userService.updatePassword({ newPassword: formData.newPassword });
                    } catch (passwordError: unknown) {
                        const axiosError = passwordError as { response?: { data?: { message?: string } } };
                        const message = axiosError?.response?.data?.message || "Failed to update password.";
                        throw new Error(`Password Error: ${message}`);
                    }
                }

                try {
                    const updatedUser = await userService.updateProfile({
                        fullName: formData.fullName,
                        phoneNumber: formData.phoneNumber,
                        githubLink: formData.githubLink,
                        linkedinLink: formData.linkedinLink,
                        facebookLink: formData.facebookLink,
                        dateOfBirth: formData.dateOfBirth || null,
                        gender: formData.gender || null,
                        address: formData.address || null,
                        major: formData.major || null,
                        personalId: formData.personalId || null,
                        placeOfBirth: formData.placeOfBirth || null,
                        enrollmentYear: formData.enrollmentYear ? parseInt(formData.enrollmentYear, 10) : null
                    });

                    setProfile(updatedUser);
                    authService.setUser(updatedUser);
                } catch (profileError: unknown) {
                    const axiosError = profileError as { response?: { data?: { message?: string } } };
                    const message = axiosError?.response?.data?.message || "Failed to update profile details.";
                    throw new Error(`Profile Error: ${message}`);
                }

                await Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: 'Account updated successfully!',
                    timer: 2000,
                    showConfirmButton: false
                });
                setIsEditing(false);
            } catch (error: unknown) {
                console.error("Profile save error:", error);
                const axiosError = error as { response?: { data?: { message?: string } } };
                const message = (error as Error).message || axiosError?.response?.data?.message || "An unexpected error occurred.";
                
                Swal.fire({
                    icon: 'error',
                    title: 'Update Failed',
                    text: message,
                    confirmButtonColor: '#F26F21'
                });
            } finally {
                setLoading(false);
            }
    };

    const formatExternalLink = (url: string) => {
        if (!url) return '#';
        if (url.startsWith('http://') || url.startsWith('https://')) return url;
        return `https://${url}`;
    };

    if (loadingProfile) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <i className="pi pi-spin pi-spinner text-4xl text-[#F26F21]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <style>{passwordIconStyle}</style>
            {/* Page Header Area - Aligned with Thesis Administration */}
            <div className="bg-white border-b border-gray-100 -mt-8 pt-8 pb-12">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="mb-6">
                        <PremiumBreadcrumb items={breadcrumbItems} />
                    </div>

                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="relative group">
                                <Avatar
                                    image={dataSource?.avatar || "https://cdn.haitrieu.com/wp-content/uploads/2021/10/Logo-Dai-hoc-FPT.png"}
                                    shape="circle"
                                    size="xlarge"
                                    className="border-2 border-gray-100 shadow-sm transition-transform duration-300 group-hover:scale-105"
                                    style={{ width: '88px', height: '88px' }}
                                />
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-2 border-white rounded-full"></div>
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{formData.fullName}</h1>
                                    <Tag value={formData.role} className="bg-blue-50 text-blue-700 border border-blue-100 font-bold px-3 py-1 text-xs rounded-full" />
                                </div>
                                <p className="text-gray-500 text-sm font-medium">Personal account dashboard and detail management.</p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            {!isEditing ? (
                                <button
                                    onClick={handleEdit}
                                    className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-800 transition-all shadow-md text-sm active:scale-95 cursor-pointer"
                                >
                                    <i className="pi pi-user-edit" />
                                    <span>Edit Profile</span>
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={handleCancel}
                                        disabled={loading}
                                        className="flex items-center gap-2 px-6 py-3 bg-white text-gray-600 font-bold border border-gray-200 rounded-2xl hover:bg-gray-50 transition-all text-sm active:scale-95 cursor-pointer disabled:opacity-50"
                                    >
                                        <i className="pi pi-times" />
                                        <span>Cancel</span>
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={loading}
                                        style={{ backgroundColor: '#F26F21' }}
                                        className="flex items-center gap-2 px-6 py-3 text-white font-bold rounded-2xl hover:brightness-110 transition-all shadow-lg shadow-orange-200 text-sm active:scale-95 cursor-pointer disabled:opacity-50"
                                    >
                                        <i className={loading ? "pi pi-spin pi-spinner" : "pi pi-check"} />
                                        <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Account Summary */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="border-none shadow-sm rounded-[2.5rem]">
                            <div className="p-2">
                                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6 px-2">Identification</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-3xl border border-gray-100 hover:border-orange-200 transition-colors group">
                                        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-[#F26F21] shadow-sm">
                                            <i className="pi pi-id-card text-lg" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">{formData.role === 'Student' ? 'Student' : 'Lecturer'} Code</p>
                                            <p className="text-sm font-bold text-gray-800 tracking-tight">{formData.studentCode || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-3xl border border-gray-100 hover:border-blue-200 transition-colors group">
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm">
                                            <i className="pi pi-map-marker text-lg" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Affiliated Campus</p>
                                            <p className="text-sm font-bold text-gray-800 tracking-tight">{formData.campus || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>

                                <Divider className="my-8" />

                                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6 px-2">Professional Presence</h3>
                                <div className="space-y-4 px-2">
                                    {(isEditing || formData.githubLink) && (
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center text-white shadow-sm">
                                                <i className="pi pi-github text-xs" />
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">GitHub</p>
                                                {isEditing ? (
                                                    <InputText
                                                        value={formData.githubLink}
                                                        onChange={(e) => setFormData({ ...formData, githubLink: e.target.value })}
                                                        placeholder="github.com/username"
                                                        className="w-full py-2! px-3! bg-white! border-gray-200! rounded-xl! focus:border-[#F26F21]! shadow-none text-xs font-bold text-gray-800 focus:ring-2! focus:ring-orange-500/10!"
                                                    />
                                                ) : (
                                                    <a href={formatExternalLink(formData.githubLink)} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-gray-800 hover:text-[#F26F21] transition-colors truncate block">
                                                        {formData.githubLink}
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {(isEditing || formData.linkedinLink) && (
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-[#0077b5] flex items-center justify-center text-white shadow-sm">
                                                <i className="pi pi-list-check text-xs" />
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Jira</p>
                                                {isEditing ? (
                                                    <InputText
                                                        value={formData.linkedinLink}
                                                        onChange={(e) => setFormData({ ...formData, linkedinLink: e.target.value })}
                                                        placeholder="your-domain.atlassian.net"
                                                        className="w-full py-2! px-3! bg-white! border-gray-200! rounded-xl! focus:border-[#F26F21]! shadow-none text-xs font-bold text-gray-800 focus:ring-2! focus:ring-orange-500/10!"
                                                    />
                                                ) : (
                                                    <a href={formatExternalLink(formData.linkedinLink)} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-gray-800 hover:text-[#0077b5] transition-colors truncate block">
                                                        {formData.linkedinLink}
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {(isEditing || formData.facebookLink) && (
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-[#1877f2] flex items-center justify-center text-white shadow-sm">
                                                <i className="pi pi-facebook text-xs" />
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Facebook</p>
                                                {isEditing ? (
                                                    <InputText
                                                        value={formData.facebookLink}
                                                        onChange={(e) => setFormData({ ...formData, facebookLink: e.target.value })}
                                                        placeholder="facebook.com/username"
                                                        className="w-full py-2! px-3! bg-white! border-gray-200! rounded-xl! focus:border-[#F26F21]! shadow-none text-xs font-bold text-gray-800 focus:ring-2! focus:ring-orange-500/10!"
                                                    />
                                                ) : (
                                                    <a href={formatExternalLink(formData.facebookLink)} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-gray-800 hover:text-[#1877f2] transition-colors truncate block">
                                                        {formData.facebookLink}
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Right Column: User Details */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="border-none shadow-sm rounded-[2.5rem]">
                            <div className="p-2">
                                <div className="flex items-center gap-3 mb-8 px-2">
                                    <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center text-white shadow-sm">
                                        <i className="pi pi-info-circle text-xs" />
                                    </div>
                                    <h2 className="text-lg font-bold text-gray-900 uppercase tracking-tight">Access Information</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-2">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 px-1 uppercase tracking-wider">Legal Full Name</label>
                                        {isEditing ? (
                                            <InputText
                                                value={formData.fullName}
                                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                                className="w-full py-3! px-4! rounded-xl! bg-white! border-gray-200! focus:border-orange-500 font-bold text-gray-800 shadow-none text-sm focus:ring-2! focus:ring-orange-500/10!"
                                            />
                                        ) : (
                                            <div className="px-4 py-3 bg-gray-50 rounded-xl border border-transparent font-bold text-gray-900 text-sm shadow-inner">
                                                {formData.fullName}
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 px-1 uppercase tracking-wider">Primary Email</label>
                                        <div className="px-4 py-3 bg-gray-50/50 rounded-xl border border-gray-100 font-bold text-gray-400 text-sm flex items-center justify-between shadow-inner">
                                            <span>{formData.email}</span>
                                            <i className="pi pi-lock text-[10px]" />
                                        </div>
                                        {isEditing && (
                                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider px-1 mt-1 flex items-center gap-1">
                                                <i className="pi pi-info-circle text-[8px]" />
                                                Email updates restricted via SSO
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 px-1 uppercase tracking-wider">Phone Number</label>
                                        {isEditing ? (
                                            <InputText
                                                value={formData.phoneNumber}
                                                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                                placeholder="Enter phone number"
                                                className="w-full py-3! px-4! rounded-xl! bg-white! border-gray-200! focus:border-orange-500 font-bold text-gray-800 shadow-none text-sm focus:ring-2! focus:ring-orange-500/10!"
                                            />
                                        ) : (
                                            <div className="px-4 py-3 bg-gray-50 rounded-xl border border-transparent font-bold text-gray-900 text-sm shadow-inner flex items-center gap-2">
                                                <i className="pi pi-phone text-gray-400 text-xs" />
                                                {formData.phoneNumber || 'Not provided'}
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 px-1 uppercase tracking-wider">Account Password</label>
                                        {isEditing ? (
                                            <div className="flex flex-col gap-3 w-full p-fluid">
                                                <Password
                                                    value={formData.newPassword}
                                                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                                    placeholder="New password (leave blank to keep)"
                                                    className="w-full"
                                                    style={{ width: '100%' }}
                                                    inputStyle={{ width: '100%' }}
                                                    inputClassName="w-full py-3! px-4! bg-white! border-gray-200! focus:border-orange-500 font-bold text-gray-800 shadow-none text-sm focus:ring-2! focus:ring-orange-500/10! rounded-xl!"
                                                    toggleMask
                                                    feedback={false}
                                                />
                                                {formData.newPassword && (
                                                    <div className="space-y-1">
                                                        <Password
                                                            value={formData.confirmPassword}
                                                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                                            placeholder="Confirm new password"
                                                            className="w-full"
                                                            style={{ width: '100%' }}
                                                            inputStyle={{ width: '100%' }}
                                                            inputClassName={`w-full py-3! px-4! bg-white! border-gray-200! focus:border-orange-500 font-bold text-gray-800 shadow-none text-sm focus:ring-2! focus:ring-orange-500/10! rounded-xl! ${formData.confirmPassword && formData.newPassword !== formData.confirmPassword ? 'border-red-500!' : ''}`}
                                                            toggleMask
                                                            feedback={false}
                                                        />
                                                        {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
                                                            <p className="text-red-500 text-[10px] font-bold mt-1 px-1">
                                                                <i className="pi pi-exclamation-circle mr-1" />
                                                                Passwords do not match
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="px-4 py-3 bg-gray-50/50 rounded-xl border border-gray-100 font-bold text-gray-400 text-sm flex items-center justify-between shadow-inner">
                                                <span>••••••••</span>
                                                <i className="pi pi-shield text-[10px]" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <Divider className="my-10" />
                                <div className="flex items-center gap-3 mb-6 px-2">
                                    <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center text-[#F26F21] shadow-sm">
                                        <i className="pi pi-info-circle text-xs" />
                                    </div>
                                    <h2 className="text-lg font-bold text-gray-900 uppercase tracking-tight">Account Details</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-2">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 px-1 uppercase tracking-wider">Date of Birth</label>
                                        {isEditing ? (
                                            <InputText
                                                type="date"
                                                value={formData.dateOfBirth}
                                                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                                                className="w-full py-3! px-4! rounded-xl! bg-white! border-gray-200! focus:border-orange-500 font-bold text-gray-800 shadow-none text-sm focus:ring-2! focus:ring-orange-500/10!"
                                            />
                                        ) : (
                                            <div className="px-4 py-3 bg-gray-50 rounded-xl font-bold text-gray-900 text-sm shadow-inner">
                                                {formData.dateOfBirth || 'N/A'}
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 px-1 uppercase tracking-wider">Gender</label>
                                        {isEditing ? (
                                            <Dropdown
                                                value={formData.gender}
                                                onChange={(e) => setFormData({ ...formData, gender: e.value })}
                                                options={[
                                                    { label: 'Male', value: 'Male' },
                                                    { label: 'Female', value: 'Female' },
                                                    { label: 'Other', value: 'Other' }
                                                ]}
                                                placeholder="Select gender"
                                                appendTo="self"
                                                className="w-full"
                                            />
                                        ) : (
                                            <div className="px-4 py-3 bg-gray-50 rounded-xl font-bold text-gray-900 text-sm shadow-inner">
                                                {formData.gender || 'N/A'}
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-xs font-bold text-gray-500 px-1 uppercase tracking-wider">Address</label>
                                        {isEditing ? (
                                            <InputText
                                                value={formData.address}
                                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                placeholder="Enter address"
                                                className="w-full py-3! px-4! rounded-xl! bg-white! border-gray-200! focus:border-orange-500 font-bold text-gray-800 shadow-none text-sm focus:ring-2! focus:ring-orange-500/10!"
                                            />
                                        ) : (
                                            <div className="px-4 py-3 bg-gray-50 rounded-xl font-bold text-gray-900 text-sm shadow-inner">
                                                {formData.address || 'N/A'}
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 px-1 uppercase tracking-wider">Major</label>
                                        {isEditing ? (
                                            <InputText
                                                value={formData.major}
                                                onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                                                placeholder="e.g. Software Engineering"
                                                className="w-full py-3! px-4! rounded-xl! bg-white! border-gray-200! focus:border-orange-500 font-bold text-gray-800 shadow-none text-sm focus:ring-2! focus:ring-orange-500/10!"
                                            />
                                        ) : (
                                            <div className="px-4 py-3 bg-gray-50 rounded-xl font-bold text-gray-900 text-sm shadow-inner">
                                                {formData.major || 'N/A'}
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 px-1 uppercase tracking-wider">Personal ID (CCCD)</label>
                                        {isEditing ? (
                                            <InputText
                                                value={formData.personalId}
                                                onChange={(e) => setFormData({ ...formData, personalId: e.target.value })}
                                                placeholder="Citizen ID"
                                                className="w-full py-3! px-4! rounded-xl! bg-white! border-gray-200! focus:border-orange-500 font-bold text-gray-800 shadow-none text-sm focus:ring-2! focus:ring-orange-500/10!"
                                            />
                                        ) : (
                                            <div className="px-4 py-3 bg-gray-50 rounded-xl font-bold text-gray-900 text-sm shadow-inner">
                                                {formData.personalId || 'N/A'}
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 px-1 uppercase tracking-wider">Place of Birth</label>
                                        {isEditing ? (
                                            <InputText
                                                value={formData.placeOfBirth}
                                                onChange={(e) => setFormData({ ...formData, placeOfBirth: e.target.value })}
                                                placeholder="City/Province"
                                                className="w-full py-3! px-4! rounded-xl! bg-white! border-gray-200! focus:border-orange-500 font-bold text-gray-800 shadow-none text-sm focus:ring-2! focus:ring-orange-500/10!"
                                            />
                                        ) : (
                                            <div className="px-4 py-3 bg-gray-50 rounded-xl font-bold text-gray-900 text-sm shadow-inner">
                                                {formData.placeOfBirth || 'N/A'}
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 px-1 uppercase tracking-wider">Enrollment Year</label>
                                        {isEditing ? (
                                            <InputText
                                                value={formData.enrollmentYear}
                                                onChange={(e) => setFormData({ ...formData, enrollmentYear: e.target.value })}
                                                placeholder="e.g. 2022"
                                                className="w-full py-3! px-4! rounded-xl! bg-white! border-gray-200! focus:border-orange-500 font-bold text-gray-800 shadow-none text-sm focus:ring-2! focus:ring-orange-500/10!"
                                            />
                                        ) : (
                                            <div className="px-4 py-3 bg-gray-50 rounded-xl font-bold text-gray-900 text-sm shadow-inner">
                                                {formData.enrollmentYear || 'N/A'}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
