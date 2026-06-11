import { NextResponse } from 'next/server';
import { PdfReports } from "@/lib/models/PdfReports";

export async function GET(
    request: Request,
    props: { params: Promise<{ interview_name: string }> }
): Promise<Response> {
    const params = await props.params;
    const interview_name = params.interview_name;

    if (!interview_name) {
        return NextResponse.json({ error: 'Missing interview_name parameter' }, { status: 400 });
    }

    const pdfReportData = await PdfReports.get(interview_name);

    if (!pdfReportData) {
        return NextResponse.json({ error: 'PDF report not found' }, { status: 404 });
    }

    const encodedUrl = `http://localhost:45000/payload=%5B${encodeURIComponent(pdfReportData.pr_path)}%5D`;
    
    // Proxy the PDF through Next.js instead of redirecting
    const pdfResponse = await fetch(encodedUrl);
    if (!pdfResponse.ok) {
        return NextResponse.json({ error: 'Failed to fetch PDF' }, { status: 500 });
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();
    
    return new Response(pdfBuffer, {
        headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'inline',
        },
    });
}