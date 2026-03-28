import type { ThesisStatus } from '../../types/thesis';

interface Props {
    status: ThesisStatus;
}

const STATUS_CONFIG: Record<ThesisStatus, { label: string; icon?: string; classes: string }> = {
    Published: {
        label: 'Published',
        icon: 'pi pi-verified',
        classes: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    'HOD Reviewing': {
        label: 'HOD Reviewing',
        icon: 'pi pi-shield',
        classes: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200'
    },
    Updated: {
        label: 'Updated',
        icon: 'pi pi-refresh',
        classes: 'bg-indigo-50 text-indigo-700 border-indigo-200'
    },
    'Need Update': {
        label: 'Needs Revision',
        icon: 'pi pi-exclamation-circle',
        classes: 'bg-amber-50 text-amber-700 border-amber-200'
    },
    Reviewing: {
        label: 'Reviewing',
        icon: 'pi pi-clock',
        classes: 'bg-sky-50 text-sky-700 border-sky-200'
    },
    'On Mentor Inviting': {
        label: 'Inviting Mentors',
        icon: 'pi pi-user-plus',
        classes: 'bg-purple-50 text-purple-700 border-purple-200'
    },
    Rejected: {
        label: "Consider",
        icon: "pi pi-times-circle",
        classes: "bg-rose-50 text-rose-600 border-rose-200",
    },
    Registered: {
        label: 'Registered',
        icon: 'pi pi-bookmark',
        classes: 'bg-green-50 text-green-700 border-green-200'
    },
    Cancelled: {
        label: 'Cancelled',
        icon: 'pi pi-ban',
        classes: 'bg-slate-50 text-slate-500 border-slate-200'
    }
};

const ThesisStatusBadge = ({ status }: Props) => {
    const config = STATUS_CONFIG[status] ?? {
        label: status,
        icon: 'pi pi-info-circle',
        classes: 'bg-gray-50 text-gray-600 border-gray-100'
    };

    return (
        <span
            className={`inline-flex items-center gap-2 px-3 py-1 text-[10px] font-black rounded-lg uppercase tracking-[0.15em] border shadow-sm transition-all duration-300 hover:shadow-md ${config.classes}`}
        >
            <i className={`${config.icon || 'pi pi-info-circle'} text-[12px]`} />
            {config.label}
        </span>
    );
};

export default ThesisStatusBadge;
