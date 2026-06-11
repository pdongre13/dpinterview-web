import { NextResponse } from 'next/server';
import { TranscriptFiles } from '@/lib/models/TranscriptFiles';

export async function GET(
    request: Request,
    props: { params: Promise<{ interview_name: string }> }
): Promise<Response> {
    const params = await props.params;
    const interview_name = params.interview_name;

    if (!interview_name) {
        return NextResponse.json({ error: 'Missing interview_name parameter' }, { status: 400 });
    }

    const url = new URL(request.url);
    const version = url.searchParams.get('version');

    let transcriptFile: string | null = null;

    if (version) {
        transcriptFile = await TranscriptFiles.getTranscriptFileByVersion(
            interview_name,
            version
        );
    } else {
        transcriptFile = await TranscriptFiles.getTranscriptFile(interview_name);
    }

    if (!transcriptFile) {
        return NextResponse.json(
            { error: 'Transcript file not found' },
            { status: 404 }
        );
    }

    // Proxy through Next.js instead of redirecting to avoid CORS
    const encodedUrl = `http://localhost:45000/payload=%5B${encodeURIComponent(transcriptFile)}%5D`;
    
    const transcriptResponse = await fetch(encodedUrl);
    if (!transcriptResponse.ok) {
        return NextResponse.json({ error: 'Failed to fetch transcript' }, { status: 500 });
    }

    const text = await transcriptResponse.text();

    return new Response(text, {
        headers: {
            'Content-Type': 'text/plain',
        },
    });
}