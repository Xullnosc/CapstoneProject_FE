import React, { useEffect, useState } from 'react';
import { accessLogService } from '../../services/accessLogService';
import type { AccessLogDTO } from '../../services/accessLogService';
import { DataTable, type DataTableStateEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { ProgressBar } from 'primereact/progressbar';

const AccessLogPage: React.FC = () => {
    const [logs, setLogs] = useState<AccessLogDTO[]>([]);
    const [totalRecords, setTotalRecords] = useState(0);
    const [loading, setLoading] = useState(true);
    const [lazyParams, setLazyParams] = useState({
        first: 0,
        rows: 10,
        page: 1,
    });

    useEffect(() => {
        loadLogs(lazyParams.page, lazyParams.rows);
    }, [lazyParams]);

    const loadLogs = async (page: number, pageSize: number) => {
        setLoading(true);
        try {
            const response = await accessLogService.getPaginatedLogs(page, pageSize);
            setLogs(response.data);
            setTotalRecords(response.totalCount);
        } catch (error) {
            console.error("Failed to fetch access logs", error);
        } finally {
            setLoading(false);
        }
    };

    const onPage = (event: DataTableStateEvent) => {
        setLazyParams({
            first: event.first,
            rows: event.rows,
            page: (event.page ?? 0) + 1,
        });
    };

    const dateBodyTemplate = (rowData: AccessLogDTO) => {
        return new Date(rowData.createdAt).toLocaleString();
    };

    const statusBodyTemplate = (rowData: AccessLogDTO) => {
        return (
            <Tag
                value={rowData.isSuccess ? 'Success' : 'Failed'}
                severity={rowData.isSuccess ? 'success' : 'danger'}
                className="px-3 py-1 text-sm rounded-md"
            />
        );
    };

    const userBodyTemplate = (rowData: AccessLogDTO) => {
        return (
            <div className="flex flex-col">
                <span className="font-semibold">{rowData.fullName || 'Unknown'}</span>
                <span className="text-gray-500 text-sm">{rowData.userEmail}</span>
            </div>
        );
    };

    return (
        <div className="card p-6 bg-white shadow-lg rounded-xl flex flex-col gap-6 animate-fade-in relative overflow-hidden">
            {loading && (
                <ProgressBar
                    mode="indeterminate"
                    style={{ height: '4px' }}
                    className="w-full absolute top-0 left-0 bg-orange-100"
                    color="#f97316"
                />
            )}

            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Access Logs</h2>
                    <p className="text-gray-500 text-sm mt-1">
                        View system login and authentication histories
                    </p>
                </div>
            </div>

            {/* Data Table Section */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
                <DataTable
                    value={logs}
                    lazy
                    paginator
                    first={lazyParams.first}
                    rows={lazyParams.rows}
                    totalRecords={totalRecords}
                    onPage={onPage}
                    loading={loading}
                    dataKey="id"
                    className="p-datatable-sm w-full"
                    emptyMessage="No access logs found."
                    stripedRows
                    rowHover
                    tableStyle={{ minWidth: '50rem' }}
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} logs"
                    rowsPerPageOptions={[10, 20, 50]}
                >
                    <Column
                        field="action"
                        header="Action"
                        style={{ width: '15%' }}
                        body={(rowData: AccessLogDTO) => <span className="font-medium text-gray-700">{rowData.action}</span>}
                    />
                    <Column
                        header="User"
                        body={userBodyTemplate}
                        style={{ width: '25%' }}
                    />
                    <Column
                        field="ipAddress"
                        header="IP Address"
                        style={{ width: '15%' }}
                        body={(rowData: AccessLogDTO) => <span className="font-mono text-sm text-gray-600">{rowData.ipAddress || 'N/A'}</span>}
                    />
                    <Column
                        header="Status"
                        body={statusBodyTemplate}
                        style={{ width: '15%' }}
                    />
                    <Column
                        field="createdAt"
                        header="Timestamp"
                        body={dateBodyTemplate}
                        style={{ width: '20%' }}
                    />
                </DataTable>
            </div>
        </div>
    );
};

export default AccessLogPage;
