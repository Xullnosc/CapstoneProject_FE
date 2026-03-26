import { useEffect, useState } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import Swal from '../../utils/swal';
import { systemSettingService, type SystemSetting } from '../../services/systemSettingService';
import styles from './HodAccountsPage.module.css'; // Reusing premium styles

const SystemSettingsPage = () => {
    const [settings, setSettings] = useState<SystemSetting[]>([]);
    const [originalSettings, setOriginalSettings] = useState<SystemSetting[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const loadSettings = async () => {
        try {
            setIsLoading(true);
            const data = await systemSettingService.getAll();
            setSettings(data);
            setOriginalSettings(JSON.parse(JSON.stringify(data))); // Deep copy
        } catch (err) {
            console.error(err);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Could not load system settings.',
                confirmButtonColor: '#F26F21'
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadSettings();
    }, []);

    const handleSaveAll = async () => {
        try {
            setIsSaving(true);
            await systemSettingService.bulkUpdate(settings);
            setOriginalSettings(JSON.parse(JSON.stringify(settings))); // Update original reference
            
            Swal.fire({
                icon: 'success',
                title: 'Settings Saved',
                text: 'All system settings have been updated successfully.',
                timer: 2000,
                showConfirmButton: false
            });
        } catch (err) {
            console.error(err);
            Swal.fire({
                icon: 'error',
                title: 'Failed',
                text: 'Could not update settings.',
                confirmButtonColor: '#F26F21'
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleChangeValue = (key: string, newValue: string) => {
        setSettings(prev => prev.map(s => s.settingKey === key ? { ...s, settingValue: newValue } : s));
    };

    const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);

    return (
        <div className={`max-w-4xl mx-auto p-4 sm:p-6 ${styles.adminForm}`}>
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">System Settings</h1>
                <p className="text-gray-500 mt-2 font-medium">Configure global application parameters and contact details.</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-6 sm:p-8">
                <div className="space-y-8">
                    {isLoading ? (
                        <div className="flex flex-col gap-6">
                            {[1, 2].map(i => (
                                <div key={i} className="animate-pulse space-y-3">
                                    <div className="h-4 bg-gray-100 rounded w-32"></div>
                                    <div className="h-12 bg-gray-50 rounded w-full"></div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        settings.map((setting) => (
                            <div key={setting.settingKey} className="group">
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 transition-colors group-hover:text-orange-600">
                                    {setting.settingKey.replace(/([A-Z])/g, ' $1').trim()}
                                </label>
                                <div className="flex flex-col gap-3">
                                    <div className="flex-1 relative">
                                        <InputText
                                            value={setting.settingValue}
                                            onChange={(e) => handleChangeValue(setting.settingKey, e.target.value)}
                                            className="w-full !h-12 !pl-4 !pr-4 border-gray-200 bg-gray-50/50 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all font-medium"
                                            placeholder={`Enter ${setting.settingKey.toLowerCase()}`}
                                        />
                                    </div>
                                </div>
                                {setting.description && (
                                    <p className="mt-2 text-xs text-gray-500 font-medium italic">
                                        {setting.description}
                                    </p>
                                )}
                            </div>
                        ))
                    )}

                    {!isLoading && settings.length > 0 && (
                        <div className="flex justify-end pt-4">
                            <Button
                                label={isSaving ? "Saving..." : "Save All Changes"}
                                icon={isSaving ? "pi pi-spin pi-spinner" : "pi pi-check"}
                                className={`${styles.premiumButton} min-w-[200px] h-14 !text-base !shadow-none`}
                                onClick={handleSaveAll}
                                loading={isSaving}
                                disabled={isLoading || !hasChanges}
                            />
                        </div>
                    )}

                    {!isLoading && settings.length === 0 && (
                        <div className="text-center py-10 text-gray-400">
                            <i className="pi pi-cog text-4xl mb-3 opacity-20"></i>
                            <p className="font-bold">No settings found in the database.</p>
                        </div>
                    )}
                </div>


            </div>
        </div>
    );
};

export default SystemSettingsPage;
