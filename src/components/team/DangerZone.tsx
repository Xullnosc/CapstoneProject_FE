import React from 'react';

interface DangerZoneProps {
    onDisband: () => void;
}

const DangerZone: React.FC<DangerZoneProps> = ({ onDisband }) => {
    return (
        <section>
            <div className="bg-red-50/50 border-2 border-red-100 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all">
                <div className="flex gap-4">
                    <div className="size-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined">warning</span>
                    </div>
                    <div>
                        <h3 className="text-red-700 text-lg font-bold">Danger Zone: Disband Team</h3>
                        <p className="text-red-600/80 text-sm max-w-md">Warning: This action is irreversible. All team records, proposal histories, and member associations will be permanently deleted.</p>
                    </div>
                </div>
                <button
                    onClick={onDisband}
                    className="h-11 px-6 border-2 border-red-200 bg-white text-red-600 font-bold rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
                >
                    Disband Team
                </button>
            </div>
        </section>
    );
};

export default DangerZone;
