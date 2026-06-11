import { getConnection } from "@/lib/db";

export async function GET(request: Request): Promise<Response> {
    const connection = getConnection();
    const url = new URL(request.url);
    const interview_name = url.searchParams.get('interview_name');
    const parent_folder = url.searchParams.get('parent_folder');
    const file_name = url.searchParams.get('file_name');

    if (!interview_name || !parent_folder || !file_name) {
        return new Response(JSON.stringify({ error: 'Missing parameters' }), { status: 400 });
    }

    const results = await connection.query(
        `
        SELECT df.destination_path as decrypted_path
        FROM decrypted_files df
        JOIN interview_files if2 ON df.source_path = if2.interview_file
        JOIN interview_parts ip ON if2.interview_path = ip.interview_path
        JOIN interviews i USING (interview_name)
        WHERE i.interview_name = $1
        AND if2.interview_path LIKE $2
        LIMIT 1
        `,
        [interview_name, `%${parent_folder}`]
    );

    if (results.rows.length === 0) {
        return new Response(JSON.stringify({ error: 'Decrypted file not found' }), { status: 404 });
    }

    return new Response(JSON.stringify({ decrypted_path: results.rows[0].decrypted_path }), {
        headers: { 'Content-Type': 'application/json' },
    });
}