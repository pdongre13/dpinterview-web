import { getConnection } from "@/lib/db";

export async function GET(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const file_path = url.searchParams.get('file_path');

    if (!file_path) {
        return new Response(JSON.stringify({ error: 'Missing file_path parameter' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const connection = getConnection();
    const parts = file_path.split('/');
    const filename = parts.pop();           // '2023-08-11 13-05-53.mkv.lock'
    const parentFolder = parts.pop();       // 'CAMI222_230811_13_05_53'

    const result = await connection.query(
        `
        SELECT destination_path
        FROM decrypted_files
        WHERE source_path LIKE $1
        LIMIT 1
        `,
        [`%${parentFolder}/${filename}`]
    );

    if (result.rows.length === 0) {
        return new Response(JSON.stringify({ destination_path: null }), {
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const destination_path = result.rows[0].destination_path?.replace('.mkv', '.mp4');
    
    return new Response(JSON.stringify({ destination_path: destination_path }), {
        headers: { 'Content-Type': 'application/json' },
    });
}