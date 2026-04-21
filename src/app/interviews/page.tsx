'use client'
import * as React from 'react';

import Link from '@mui/material/Link';
import Typography from '@mui/joy/Typography';
import Alert from '@mui/joy/Alert';
import { GridColDef } from '@mui/x-data-grid';
import { Dashboard } from '@mui/icons-material';

import { DbInterview, DbInterviewEnhanced } from '@/lib/types/interview';
import MuiDataGrid, { MuiDataGridProps } from '@/components/mui/MuiDataGrid';

export default function Interviews() {
    const [dataGridProps, setDataGridProps] = React.useState<MuiDataGridProps | null>(null);

    const columns: GridColDef[] = React.useMemo(() => [
        {
            field: 'interview_name',
            headerName: 'Interview Name',
            width: 350,
            renderCell: (params) => (
                <Link href={`/interviews/${params.value}`}>{params.value}</Link>
            )
        },
        { field: 'interview_type', headerName: 'Interview Type', width: 150 },
        { field: 'subject_id', headerName: 'Subject ID', width: 150 },
        { field: 'study_id', headerName: 'Study ID', width: 150 },
        { field: 'interview_day', headerName: 'Day', width: 80 },
        {
            field: 'interview_datetime',
            headerName: 'Interview Date',
            width: 180,
            renderCell: (params) => (
                params.value
                    ? new Date(params.value).toLocaleDateString()
                    : 'N/A'
            )
        },
    ], []);

    React.useEffect(() => {
        // Fetch data from the API
        fetch('/api/v1/interviews/list?limit=20000')
            .then((res) => res.json())
            .then((data) => {

                // parse to grid rows
                const gridRows = data.rows.map((interview: DbInterviewEnhanced) => ({
                    id: interview.interview_name,
                    interview_name: interview.interview_name,
                    interview_type: interview.interview_type,
                    subject_id: interview.subject_id,
                    study_id: interview.study_id,
                    interview_day: interview.interview_day,
                    interview_datetime: interview.interview_datetime,
                }));

                const props: MuiDataGridProps = {
                    columns,
                    rows: gridRows,
                    height: 670,
                    pageSizeOptions: [10, 20],
                    selectable: true
                };
                setDataGridProps(props);
            });
    }, [columns]);

    return (
        <>
            <div className="container mx-auto p-4">
                <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
                    <Alert
                        variant="soft"
                        color="neutral"
                        startDecorator={<Dashboard />}
                        sx={{
                            mb: 2,
                            textAlign: 'center',
                            p: 3,
                            borderRadius: 4
                        }}
                    >
                        <Typography level="body-md">
                            Please use Superset Dashboard to look at the Aggregated Interview data.
                        </Typography>
                    </Alert>
                </div>

                {!dataGridProps ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-pulse text-center">
                            <div className="h-6 w-32 bg-gray-200 rounded mb-4 mx-auto"></div>
                            <Typography level="body-sm" color="neutral">Loading interview data...</Typography>
                        </div>
                    </div>
                ) : dataGridProps.rows.length === 0 ? (
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mt-4">
                        <Typography level="body-md">
                            No interviews found.
                        </Typography>
                    </div>
                ) : (
                    <>
                        <Typography level="body-md" sx={{ mb: 2, fontWeight: 'medium', color: 'neutral.600' }}>
                            The following {dataGridProps.rows.length} interviews have been identified for processing.
                        </Typography>
                        <div className="mt-4">
                            <MuiDataGrid {...dataGridProps} />
                        </div>
                    </>
                )}
            </div>
        </>
    );
}
