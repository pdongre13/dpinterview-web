"use client"
import * as React from 'react';

import { Empty } from 'antd';
import { Skeleton } from '@mui/material';

import { toast } from "sonner";

export type InterviewPdfReportProps = {
    interviewName: string;
}

export default function InterviewPdfReport(props: InterviewPdfReportProps) {
    const { interviewName } = props;
    const [loading, setLoading] = React.useState(true);

    const [pdfFilePath, setPdfFilePath] = React.useState<string | null>(null);

    React.useEffect(() => {
        const fetchData = async () => {
            const response = await fetch(`/api/v2/interviews/${interviewName}/report`);
            if (!response.ok) {
                // Check for 404
                if (response.status === 404) {
                    toast.message('Uh oh! No Interview found.', {
                        description: 'Interview not found.',
                    })
                } else {
                    toast.message('Uh oh! Something went wrong.', {
                        description: 'Request for interview processing data failed.',
                    })
                    throw new Error('Network response was not ok');
                }
            } else {
                // Returns PDF file
                setPdfFilePath(response.url);
            }
            setLoading(false);
        };

        fetchData();
    }
    , [interviewName]);

    return (
        <div className="flex flex-col">
            {loading ? (
                <Skeleton variant="rectangular" height={600} className='w-full' />
            ) : pdfFilePath ? (
                <div className="flex flex-col">
                    <div className="flex flex-col items-center gap-4 p-4">
                        <a 
                            href={pdfFilePath} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                        >
                            Open PDF Report in New Tab
                        </a>
                        <iframe 
                            src={pdfFilePath}
                            className="w-full h-screen"
                            title={`${interviewName} PDF Report`}
                        />
                    </div>
                </div>
            ) : (
                <div className='m-32'>
                    <Empty description="No PDF Report generated yet!" />
                </div>
            )}
        </div>
    )
}