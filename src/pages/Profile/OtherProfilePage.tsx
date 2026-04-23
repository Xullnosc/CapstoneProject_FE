import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from 'primereact/card';
import { Avatar } from 'primereact/avatar';
import { Tag } from 'primereact/tag';
import { Divider } from 'primereact/divider';
import Swal from '../../utils/swal';
import PremiumBreadcrumb from '../../components/Common/PremiumBreadcrumb';
import { authService } from '../../services/authService';
import { userService, type UserInfo } from '../../services/userService';
import { discoveryService } from '../../services/discoveryService';
import type { SkillEntry, UserSkillDto } from '../../types/studentInteraction';

const DEFAULT_AVATAR =
    'https://cdn.haitrieu.com/wp-content/uploads/2021/10/Logo-Dai-hoc-FPT.png';

const normalizeSkillEntry = (s: UserSkillDto): SkillEntry | null => {
    const tag = s.skillTag || s.skillName || '';
    if (!tag) return null;
    const level = s.skillLevel || 'Intermediate';
    return { skillTag: tag, skillLevel: level };
};

const formatExternalLink = (url: string | null | undefined) => {
    if (!url) return '#';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `https://${url}`;
};

const OtherProfilePage = () => {
    const navigate = useNavigate();
    const { userId } = useParams<{ userId: string }>();

    const currentUser = authService.getUser();
    const parsedUserId = useMemo(() => {
        const n = Number(userId);
        return Number.isFinite(n) && n !== 0 ? n : null;
    }, [userId]);

    const [profile, setProfile] = useState<UserInfo | null>(null);
    const [skills, setSkills] = useState<SkillEntry[]>([]);
    const [loading, setLoading] = useState(true);

    const breadcrumbItems = [
        { label: 'Homepage', to: '/home' },
        { label: 'Personal Profile' },
    ];

    useEffect(() => {
        const load = async () => {
            if (!parsedUserId) {
                Swal.fire({
                    icon: 'error',
                    title: 'Invalid Profile',
                    text: 'User id is invalid.',
                });
                navigate('/profile');
                return;
            }

            if (currentUser?.userId === parsedUserId) {
                navigate('/profile', { replace: true });
                return;
            }

            setLoading(true);
            try {
                const data = await userService.getProfileByUserId(parsedUserId);
                setProfile(data);

                // Load skills for this user
                const skillsData = await discoveryService.getUserSkills(parsedUserId);
                const list = Array.isArray(skillsData) ? skillsData : [];
                setSkills(list.map(normalizeSkillEntry).filter((x): x is SkillEntry => x !== null));
            } catch {
                Swal.fire({
                    icon: 'error',
                    title: 'Cannot load profile',
                    text: 'Please try again later.',
                });
                setProfile(null);
            } finally {
                setLoading(false);
            }
        };

        void load();
    }, [navigate, parsedUserId, currentUser?.userId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <i className="pi pi-spin pi-spinner text-4xl text-[#F26F21]" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Card className="w-full max-w-lg">
                    <div className="text-center py-10">
                        <div className="w-16 h-16 mx-auto bg-red-50 rounded-full flex items-center justify-center mb-4">
                            <i className="pi pi-user-minus text-red-500 text-2xl" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Profile not found</h2>
                        <p className="text-gray-500 mt-2 text-sm">The user may not exist.</p>
                        <button
                            onClick={() => navigate('/profile')}
                            className="mt-6 px-5 py-2 rounded-lg bg-gray-900 text-white font-bold hover:bg-gray-800"
                        >
                            Back to my profile
                        </button>
                    </div>
                </Card>
            </div>
        );
    }

    const roleLabel = profile.roleName || 'Unknown';
    const isSelf = currentUser?.userId === profile.userId;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b border-gray-100 -mt-8 pt-8 pb-12">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="mb-6">
                        <PremiumBreadcrumb items={breadcrumbItems} />
                    </div>

                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <Avatar
                                image={profile.avatar || DEFAULT_AVATAR}
                                shape="circle"
                                size="xlarge"
                                className="border-2 border-gray-100 shadow-sm"
                                style={{ width: '88px', height: '88px' }}
                            />
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                                        {profile.fullName}
                                    </h1>
                                    <Tag
                                        value={roleLabel}
                                        className="bg-blue-50 text-blue-700 border border-blue-100 font-bold px-3 py-1 text-xs rounded-full"
                                    />
                                    {isSelf && (
                                        <span className="text-xs font-bold text-orange-600 bg-orange-50 border border-orange-100 px-3 py-1 rounded-full">
                                            (You)
                                        </span>
                                    )}
                                </div>
                                <p className="text-gray-500 text-sm font-medium">
                                    Read-only profile view
                                </p>
                            </div>
                        </div>

                        {!isSelf && (
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => navigate(`/chat?targetUserId=${profile.userId}`)}
                                    className="flex items-center gap-2 px-6 py-3 bg-[#F26F21] text-white font-bold rounded-2xl shadow-lg shadow-orange-200 hover:bg-[#d85d1a] transition-all transform hover:-translate-y-0.5 active:scale-95"
                                >
                                    <i className="pi pi-comments text-lg" />
                                    <span>Message {roleLabel}</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-5 space-y-6">
                        <Card className="border-none shadow-sm rounded-[2.5rem]">
                            <div className="p-2">
                                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6 px-2">
                                    Identification
                                </h3>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-3xl border border-gray-100">
                                        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-[#F26F21] shadow-sm">
                                            <i className="pi pi-id-card text-lg" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">
                                                {roleLabel === 'Student' ? 'Student' : 'Account'} Code
                                            </p>
                                            <p className="text-sm font-bold text-gray-800 tracking-tight">
                                                {profile.studentCode || 'N/A'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-3xl border border-gray-100">
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm">
                                            <i className="pi pi-map-marker text-lg" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">
                                                Affiliated Campus
                                            </p>
                                            <p className="text-sm font-bold text-gray-800 tracking-tight">
                                                {profile.campus || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <Divider className="my-8" />

                                <div className="space-y-6">
                                    <div className="px-2">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                Professional Skills
                                            </h3>
                                        </div>
                                        
                                        <div className="space-y-3">
                                            {skills.length > 0 ? (
                                                skills.map((skill, index) => (
                                                    <div key={index} className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-2xl border border-gray-100 animate-fade-in">
                                                        <span className="text-xs font-bold text-gray-800">{skill.skillTag}</span>
                                                        <Tag value={skill.skillLevel} className="bg-orange-50 text-[#F26F21] border border-orange-100 font-bold px-2 py-0.5 text-[9px] rounded-full" />
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-xs text-gray-400 italic px-2">No skills added yet.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <Divider className="my-8" />

                                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6 px-2">
                                    Professional Presence
                                </h3>

                                <div className="space-y-4 px-2">
                                    {profile.githubLink && (
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center text-white shadow-sm">
                                                <i className="pi pi-github text-xs" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">
                                                    GitHub
                                                </p>
                                                <a
                                                    href={formatExternalLink(profile.githubLink)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs font-bold text-gray-800 hover:text-[#F26F21] transition-colors truncate block"
                                                >
                                                    {profile.githubLink}
                                                </a>
                                            </div>
                                        </div>
                                    )}

                                    {profile.linkedinLink && (
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-[#0077b5] flex items-center justify-center text-white shadow-sm">
                                                <i className="pi pi-list-check text-xs" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">
                                                    LinkedIn
                                                </p>
                                                <a
                                                    href={formatExternalLink(profile.linkedinLink)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs font-bold text-gray-800 hover:text-[#0077b5] transition-colors truncate block"
                                                >
                                                    {profile.linkedinLink}
                                                </a>
                                            </div>
                                        </div>
                                    )}

                                    {profile.facebookLink && (
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-[#1877f2] flex items-center justify-center text-white shadow-sm">
                                                <i className="pi pi-facebook text-xs" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">
                                                    Facebook
                                                </p>
                                                <a
                                                    href={formatExternalLink(profile.facebookLink)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs font-bold text-gray-800 hover:text-[#1877f2] transition-colors truncate block"
                                                >
                                                    {profile.facebookLink}
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    </div>

                    <div className="lg:col-span-7 space-y-6">
                        <Card className="border-none shadow-sm rounded-[2.5rem]">
                            <div className="p-2">
                                <div className="flex items-center gap-3 mb-8 px-2">
                                    <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center text-white shadow-sm">
                                        <i className="pi pi-info-circle text-xs" />
                                    </div>
                                    <h2 className="text-lg font-bold text-gray-900 uppercase tracking-tight">
                                        Access Information
                                    </h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-2">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 px-1 uppercase tracking-wider">
                                            Legal Full Name
                                        </label>
                                        <div className="px-4 py-3 bg-gray-50 rounded-xl border border-transparent font-bold text-gray-900 text-sm shadow-inner">
                                            {profile.fullName}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 px-1 uppercase tracking-wider">
                                            Primary Email
                                        </label>
                                        <div className="px-4 py-3 bg-gray-50/50 rounded-xl border border-gray-100 font-bold text-gray-400 text-sm flex items-center justify-between shadow-inner">
                                            <span>{profile.email}</span>
                                            <i className="pi pi-lock text-[10px]" />
                                        </div>
                                    </div>

                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-xs font-bold text-gray-500 px-1 uppercase tracking-wider">
                                            Phone Number
                                        </label>
                                        <div className="px-4 py-3 bg-gray-50 rounded-xl border border-transparent font-bold text-gray-900 text-sm shadow-inner flex items-center gap-2">
                                            <i className="pi pi-phone text-gray-400 text-xs" />
                                            {profile.phoneNumber || 'Not provided'}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 px-1 uppercase tracking-wider">
                                            Date of Birth
                                        </label>
                                        <div className="px-4 py-3 bg-gray-50 rounded-xl font-bold text-gray-900 text-sm shadow-inner">
                                            {profile.dateOfBirth || 'N/A'}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 px-1 uppercase tracking-wider">
                                            Gender
                                        </label>
                                        <div className="px-4 py-3 bg-gray-50 rounded-xl font-bold text-gray-900 text-sm shadow-inner">
                                            {profile.gender || 'N/A'}
                                        </div>
                                    </div>

                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-xs font-bold text-gray-500 px-1 uppercase tracking-wider">
                                            Address
                                        </label>
                                        <div className="px-4 py-3 bg-gray-50 rounded-xl font-bold text-gray-900 text-sm shadow-inner">
                                            {profile.address || 'N/A'}
                                        </div>
                                    </div>
                                </div>

                                <Divider className="my-10" />

                                <div className="flex items-center gap-3 mb-6 px-2">
                                    <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center text-[#F26F21] shadow-sm">
                                        <i className="pi pi-info-circle text-xs" />
                                    </div>
                                    <h2 className="text-lg font-bold text-gray-900 uppercase tracking-tight">
                                        Account Details
                                    </h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-2">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 px-1 uppercase tracking-wider">
                                            Major
                                        </label>
                                        <div className="px-4 py-3 bg-gray-50 rounded-xl font-bold text-gray-900 text-sm shadow-inner">
                                            {profile.major || 'N/A'}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 px-1 uppercase tracking-wider">
                                            Personal ID (CCCD)
                                        </label>
                                        <div className="px-4 py-3 bg-gray-50 rounded-xl font-bold text-gray-900 text-sm shadow-inner">
                                            {profile.personalId || 'N/A'}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 px-1 uppercase tracking-wider">
                                            Place of Birth
                                        </label>
                                        <div className="px-4 py-3 bg-gray-50 rounded-xl font-bold text-gray-900 text-sm shadow-inner">
                                            {profile.placeOfBirth || 'N/A'}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 px-1 uppercase tracking-wider">
                                            Enrollment Year
                                        </label>
                                        <div className="px-4 py-3 bg-gray-50 rounded-xl font-bold text-gray-900 text-sm shadow-inner">
                                            {profile.enrollmentYear ?? 'N/A'}
                                        </div>
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

export default OtherProfilePage;

