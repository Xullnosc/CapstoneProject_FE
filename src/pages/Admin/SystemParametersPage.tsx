import { useState, useEffect } from 'react';
import type { DataTableFilterMetaData } from 'primereact/datatable';
import { DataTable } from 'primereact/datatable';
import type { DataTableFilterMeta } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { systemService } from '../../services/systemService';
import type { SystemParameter } from '../../services/systemService';
import Swal from '../../utils/swal';
import { FilterMatchMode } from 'primereact/api';
import { Dialog } from 'primereact/dialog';

const SystemParametersPage = () => {
    const [parameters, setParameters] = useState<SystemParameter[]>([]);
    const [loading, setLoading] = useState(true);
    const [globalFilterValue, setGlobalFilterValue] = useState('');
    const [filters, setFilters] = useState<DataTableFilterMeta>({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    });

    // Edit modal state
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingParam, setEditingParam] = useState<SystemParameter | null>(null);
    const [editValue, setEditValue] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchParameters();
    }, []);

    const fetchParameters = async () => {
        try {
            setLoading(true);
            const data = await systemService.getParameters();
            setParameters(data);
        } catch (error) {
            console.error('Failed to fetch system parameters', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Could not load system parameters. Please try again.',
            });
        } finally {
            setLoading(false);
        }
    };

    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const _filters = { ...filters };
        (_filters['global'] as DataTableFilterMetaData).value = value;
        setFilters(_filters);
        setGlobalFilterValue(value);
    };

    const handleEditClick = (param: SystemParameter) => {
        setEditingParam(param);
        setEditValue(param.value);
        setEditDescription(param.description || '');
        setIsEditModalOpen(true);
    };

    const saveParameter = async () => {
        if (!editingParam) return;

        if (!editValue.trim()) {
            Swal.fire({ icon: 'warning', title: 'Required', text: 'Value cannot be empty' });
            return;
        }

        try {
            setIsSaving(true);
            await systemService.updateParameter(editingParam.key, {
                value: editValue,
                description: editDescription
            });

            Swal.fire({
                icon: 'success',
                title: 'Saved',
                text: 'System parameter updated successfully.',
                timer: 1500,
                showConfirmButton: false
            });

            setIsEditModalOpen(false);
            fetchParameters(); // refresh table
        } catch {
            Swal.fire({
                icon: 'error',
                title: 'Save Failed',
                text: 'Could not update parameter due to server error.'
            });
        } finally {
            setIsSaving(false);
        }
    };

    // Table Header Component
    const renderHeader = () => {
        return (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-96">
                        <i className="pi pi-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                        <input
                            value={globalFilterValue}
                            onChange={onGlobalFilterChange}
                            placeholder="Keyword Search..."
                            className="w-full h-11 pl-11 pr-4 rounded-xl border border-gray-200 bg-gray-50/50 outline-none focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 text-sm font-medium transition-all"
                        />
                    </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                        icon="pi pi-refresh"
                        outlined
                        severity="secondary"
                        onClick={fetchParameters}
                        tooltip="Refresh Data"
                        tooltipOptions={{ position: 'top' }}
                        className="rounded-xl h-11 w-11 flex items-center justify-center border-gray-200 text-gray-600 hover:bg-gray-50"
                    />
                </div>
            </div>
        );
    };

    // Body Templates
    const keyBodyTemplate = (rowData: SystemParameter) => {
        return (
            <span className="font-bold text-gray-800 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 break-all shadow-sm flex items-center gap-2">
                <i className="pi pi-cog text-orange-500"></i>
                {rowData.key}
            </span>
        );
    };

    const valueBodyTemplate = (rowData: SystemParameter) => {
        return (
            <span className="font-semibold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg">
                {rowData.value}
            </span>
        );
    };

    const dateBodyTemplate = (rowData: SystemParameter) => {
        if (!rowData.updatedAt && !rowData.createdAt) return '-';
        const dateStr = rowData.updatedAt || rowData.createdAt;
        return <span className="text-gray-500 font-medium text-sm">{new Date(dateStr).toLocaleString()}</span>;
    };

    const actionBodyTemplate = (rowData: SystemParameter) => {
        return (
            <Button
                icon="pi pi-pencil"
                rounded
                text
                severity="warning"
                aria-label="Edit"
                onClick={() => handleEditClick(rowData)}
                className="hover:bg-orange-50 transition-colors"
                tooltip="Edit Parameter"
                tooltipOptions={{ position: 'left' }}
            />
        );
    };

    return (
        <div className="p-4 sm:p-6 fadein animation-duration-500">
            {/* Header Section */}
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl flex items-center gap-3">
                        <i className="pi pi-server text-orange-500"></i>
                        System Parameters
                    </h1>
                    <p className="mt-2 text-sm text-gray-500">
                        Manage global configuration settings that power the FC<span className="text-orange-500">TMS</span> platform logic.
                    </p>
                </div>
            </div>

            {/* Content Section */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <DataTable
                    value={parameters}
                    paginator
                    rows={10}
                    rowsPerPageOptions={[10, 25, 50]}
                    loading={loading}
                    dataKey="key"
                    filters={filters}
                    globalFilterFields={['key', 'value', 'description']}
                    header={renderHeader()}
                    emptyMessage="No system parameters found."
                    className="p-datatable-custom"
                    rowHover
                    responsiveLayout="scroll"
                >
                    <Column field="key" header="Parameter Key" body={keyBodyTemplate} sortable style={{ minWidth: '16rem' }}></Column>
                    <Column field="value" header="Current Value" body={valueBodyTemplate} sortable style={{ minWidth: '10rem' }}></Column>
                    <Column field="description" header="Description" sortable className="text-gray-600 text-sm" style={{ minWidth: '20rem' }}></Column>
                    <Column header="Last Updated" body={dateBodyTemplate} sortable sortField="updatedAt" style={{ minWidth: '12rem' }}></Column>
                    <Column header="Action" body={actionBodyTemplate} exportable={false} align="center" style={{ minWidth: '5rem' }}></Column>
                </DataTable>
            </div>

            {/* Edit Modal */}
            <Dialog 
                header={<div className="font-bold text-xl flex items-center gap-2"><i className="pi pi-pencil text-orange-500"></i> Edit Parameter</div>} 
                visible={isEditModalOpen} 
                style={{ width: '90vw', maxWidth: '500px' }} 
                onHide={() => !isSaving && setIsEditModalOpen(false)}
                className="p-fluid rounded-2xl"
                blockScroll
            >
                {editingParam && (
                    <div className="space-y-6 pt-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Parameter Key</label>
                            <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 font-mono text-sm break-all shadow-inner">
                                {editingParam.key}
                            </div>
                            <small className="text-gray-500 mt-1 block px-1">Keys cannot be changed to preserve system integrity.</small>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Value <span className="text-red-500">*</span></label>
                            {editingParam.key === 'THESIS_REGISTRATION_OPEN' ? (
                                <select
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50/50 outline-none focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 text-sm font-medium transition-all"
                                >
                                    <option value="true">true — Registration is open</option>
                                    <option value="false">false — Registration is closed</option>
                                </select>
                            ) : (
                                <input
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50/50 outline-none focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 text-sm font-medium transition-all"
                                    placeholder="Enter configuration value"
                                />
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                            <textarea 
                                value={editDescription} 
                                onChange={(e) => setEditDescription(e.target.value)} 
                                rows={4} 
                                className="w-full p-4 rounded-xl border border-gray-200 bg-gray-50/50 outline-none focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 text-sm font-medium transition-all resize-none"
                                placeholder="Describe what this parameter does..."
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                            <Button 
                                label="Cancel" 
                                icon="pi pi-times" 
                                onClick={() => setIsEditModalOpen(false)} 
                                className="p-button-text text-gray-600 hover:bg-gray-100 px-6 py-2.5 rounded-xl font-bold" 
                                disabled={isSaving}
                            />
                            <Button 
                                label={isSaving ? "Saving..." : "Save Changes"} 
                                icon={isSaving ? "pi pi-spin pi-spinner" : "pi pi-check"} 
                                onClick={saveParameter} 
                                className="bg-orange-500 hover:bg-orange-600 border-none px-6 py-2.5 rounded-xl font-bold shadow-md shadow-orange-200" 
                                disabled={isSaving}
                            />
                        </div>
                    </div>
                )}
            </Dialog>
        </div>
    );
};

export default SystemParametersPage;
