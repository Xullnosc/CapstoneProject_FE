import React, { useEffect, useState } from 'react';
import { systemLogService, type SystemErrorLog } from '../../services/systemLogService';
import { DataTable, type DataTableStateEvent, type DataTableRowEvent, type DataTableExpandedRows } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { ProgressBar } from 'primereact/progressbar';
import { Dropdown, type DropdownChangeEvent } from 'primereact/dropdown';

const ErrorLogsPage: React.FC = () => {
    const [logs, setLogs] = useState<SystemErrorLog[]>([]);
    const [totalRecords, setTotalRecords] = useState(0);
    const [loading, setLoading] = useState(true);
    const [lazyParams, setLazyParams] = useState({
        first: 0,
        rows: 10,
        page: 1,
    });
    const [selectedLevel, setSelectedLevel] = useState<string>('All');
    const [expandedRows, setExpandedRows] = useState<DataTableExpandedRows | SystemErrorLog[] | undefined>(undefined);

    const levels = [
        { label: 'All Levels', value: 'All' },
        { label: 'Error', value: 'Error' },
        { label: 'Warning', value: 'Warning' },
        { label: 'Info', value: 'Info' }
    ];

    useEffect(() => {
        loadLogs(lazyParams.page, lazyParams.rows, selectedLevel);
    }, [lazyParams, selectedLevel]);

    const loadLogs = async (page: number, pageSize: number, level: string) => {
        setLoading(true);
        try {
            const response = await systemLogService.getLogs(page, pageSize, level);
            setLogs(response.data);
            setTotalRecords(response.totalCount);
        } catch (error) {
            console.error("Failed to fetch system error logs", error);
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

    const onLevelChange = (e: DropdownChangeEvent) => {
        setSelectedLevel(e.value);
        setLazyParams(prev => ({ ...prev, first: 0, page: 1 }));
    };

    const dateBodyTemplate = (rowData: SystemErrorLog) => {
        return new Date(rowData.timestamp).toLocaleString();
    };

    const levelBodyTemplate = (rowData: SystemErrorLog) => {
        let severity: 'success' | 'info' | 'warning' | 'danger' | null = null;
        switch (rowData.level) {
            case 'Error':
                severity = 'danger';
                break;
            case 'Warning':
                severity = 'warning';
                break;
            case 'Info':
                severity = 'info';
                break;
        }

        return (
            <Tag
                value={rowData.level}
                severity={severity}
                className="px-3 py-1 text-sm rounded-md"
            />
        );
    };

    const rowExpansionTemplate = (data: SystemErrorLog) => {
        return (
            <div className="p-4 bg-gray-50 border border-t-0 border-gray-200">
                <h5 className="font-bold text-gray-700 mb-2">Stack Trace</h5>
                <pre className="text-sm font-mono text-gray-800 whitespace-pre-wrap break-all bg-white p-4 rounded-lg border border-gray-300 shadow-inner max-h-96 overflow-y-auto">
                    {data.stackTrace || "No stack trace available."}
                </pre>
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
                    <h2 className="text-2xl font-bold text-gray-800 tracking-tight">System Error Logs</h2>
                    <p className="text-gray-500 text-sm mt-1">
                        View technical errors and warnings for debugging
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-600">Filter Level:</span>
                    <Dropdown 
                        value={selectedLevel} 
                        options={levels} 
                        onChange={onLevelChange} 
                        className="w-40 border-gray-200 shadow-sm text-sm" 
                    />
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
                    emptyMessage="No system error logs found."
                    stripedRows
                    rowHover
                    expandedRows={expandedRows}
                    onRowToggle={(e: DataTableRowEvent) => setExpandedRows(e.data as DataTableExpandedRows | SystemErrorLog[])}
                    rowExpansionTemplate={rowExpansionTemplate}
                    tableStyle={{ minWidth: '50rem' }}
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} logs"
                    rowsPerPageOptions={[10, 20, 50]}
                >
                    <Column expander style={{ width: '4rem' }} />
                    <Column
                        field="timestamp"
                        header="Timestamp"
                        body={dateBodyTemplate}
                        style={{ width: '20%' }}
                    />
                    <Column
                        header="Level"
                        body={levelBodyTemplate}
                        style={{ width: '15%' }}
                    />
                    <Column
                        field="message"
                        header="Message"
                        style={{ width: '61%' }}
                        body={(rowData: SystemErrorLog) => (
                            <span className="font-medium text-gray-700 truncate block max-w-full" title={rowData.message}>
                                {rowData.message}
                            </span>
                        )}
                    />
                </DataTable>
            </div>
        </div>
    );
};

export default ErrorLogsPage;
