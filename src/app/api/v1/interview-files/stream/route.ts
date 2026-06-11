import { NextRequest } from 'next/server';

export async function GET(request: NextRequest): Promise<Response> {
    const url = new URL(request.url);
    const file_path = url.searchParams.get('file_path');

    if (!file_path) {
        return new Response(JSON.stringify({ error: 'Missing file_path' }), { status: 400 });
    }

    const encodedUrl = `http://localhost:45000/payload=%5B${encodeURIComponent(file_path)}%5D`;

    const fileResponse = await fetch(encodedUrl, {
        headers: {
            Range: request.headers.get('Range') || '',
        },
    });

    const headers = new Headers();
    headers.set('Content-Type', fileResponse.headers.get('Content-Type') || 'video/mp4');
    const contentLength = fileResponse.headers.get('Content-Length');
    if (contentLength) headers.set('Content-Length', contentLength);
    const contentRange = fileResponse.headers.get('Content-Range');
    if (contentRange) headers.set('Content-Range', contentRange);
    headers.set('Accept-Ranges', 'bytes');

    return new Response(fileResponse.body, {
        status: fileResponse.status,
        headers,
    });
}