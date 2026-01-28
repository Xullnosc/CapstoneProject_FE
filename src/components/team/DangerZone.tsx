import React from 'react';

interface DangerZoneProps {
    onAction: () => void;
    actionType?: 'disband' | 'leave';
}

const DangerZone: React.FC<DangerZoneProps> = ({ onAction, actionType = 'disband' }) => {
    const isDisband = actionType === 'disband';

    const title = isDisband ? "Danger Zone: Disband Team" : "Danger Zone: Leave Team";
    const description = isDisband
        ? "Warning: This action is irreversible. All team records, proposal histories, and member associations will be permanently deleted."
        : "Warning: You are about to leave this team. You will lose access to team resources.";
    const buttonText = isDisband ? "Disband Team" : "Leave Team";
    const icon = isDisband ? "warning" : "logout";

    return (
        <section>
            <div className="bg-red-50/50 border-2 border-red-100 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all">
                <div className="flex gap-4">
                    <div className="size-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined">{icon}</span>
                    </div>
                    <div>
                        <h3 className="text-red-700 text-lg font-bold">{title}</h3>
                        <p className="text-red-600/80 text-sm max-w-md">{description}</p>
                    </div>
                </div>
                <button
                    onClick={onAction}
                    className="h-11 px-6 border-2 cursor-pointer border-red-200 bg-white text-red-600 font-bold rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
                >
                    {buttonText}
                </button>
            </div>
        </section>
    );
};

export default DangerZone;
