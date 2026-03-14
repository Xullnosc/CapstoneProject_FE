import type { ThesisStatus } from '../../types/thesis';

interface Props {
    status: ThesisStatus;
}

const STATUS_CONFIG: Record<ThesisStatus, { label: string; icon: string; classes: string }> = {
    Published: {
        label: 'Published',
        icon: 'pi pi-check-circle',
        classes: 'bg-emerald-50 text-emerald-700 border-emerald-100'
    },
    Updated: {
        label: 'Updated',
        icon: 'pi pi-sync',
        classes: 'bg-indigo-50 text-indigo-700 border-indigo-100'
    },
    'Need Update': {
        label: 'Need Update',
        icon: 'pi pi-exclamation-triangle',
        classes: 'bg-amber-50 text-amber-700 border-amber-100'
    },
    Reviewing: {
        label: 'Reviewing',
        icon: 'pi pi-clock',
        classes: 'bg-sky-50 text-sky-700 border-sky-100'
    },
    'On Mentor Inviting': {
        label: 'On Mentor Inviting',
        icon: 'pi pi-user-plus',
        classes: 'bg-purple-50 text-purple-700 border-purple-100'
    },
    Rejected: {
        label: 'Rejected',
        icon: 'pi pi-times-circle',
        classes: 'bg-rose-50 text-rose-700 border-rose-100'
    },
    Registered: {
        label: 'Registered',
        icon: 'pi pi-bookmark-fill',
        classes: 'bg-green-50 text-green-700 border-green-100'
    },
    Cancelled: {
        label: 'Cancelled',
        icon: 'pi pi-trash',
        classes: 'bg-slate-100 text-slate-600 border-slate-200'
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
            className={`flex items-center gap-2 px-3.5 py-1.5 text-[10px] font-black rounded-full uppercase tracking-widest border shadow-sm transition-all hover:shadow-md ${config.classes}`}
        >
            <i className={`${config.icon} text-sm`} />
            {config.label}
        </span>
    );
};

export default ThesisStatusBadge;
