import type { ThesisStatus } from '../../types/thesis';

interface Props {
    status: ThesisStatus;
}

const STATUS_CONFIG: Record<ThesisStatus, { label: string; classes: string }> = {
    Published: {
        label: 'Published',
        classes: 'bg-blue-100 text-blue-700'
    },
    Updated: {
        label: 'Updated',
        classes: 'bg-indigo-100 text-indigo-700'
    },
    'Need Update': {
        label: 'Need Update',
        classes: 'bg-amber-100 text-amber-700'
    },
    Reviewing: {
        label: 'Reviewing',
        classes: 'bg-orange-100 text-orange-700'
    },
    Rejected: {
        label: 'Rejected',
        classes: 'bg-red-100 text-red-700'
    },
    Registered: {
        label: 'Registered',
        classes: 'bg-green-100 text-green-700'
    }
};

const ThesisStatusBadge = ({ status }: Props) => {
    const config = STATUS_CONFIG[status] ?? {
        label: status,
        classes: 'bg-gray-100 text-gray-600'
    };

    return (
        <span
            className={`shrink-0 px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${config.classes}`}
        >
            {config.label}
        </span>
    );
};

export default ThesisStatusBadge;
