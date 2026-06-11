import { getConnection } from "@/lib/db";
import { unformatSQL } from "@/lib/query";

export async function GET(request: Request): Promise<Response> {
    const connection = getConnection();
    const url = new URL(request.url);
    const studyId = url.searchParams.get('study_id');
    const subjectId = url.searchParams.get('subject_id');
    const type = url.searchParams.get('type');
    const limit = url.searchParams.get('limit') || 5;
    const offset = url.searchParams.get('offset') || 0;

    let baseQuery = `
        SELECT
            interviews.interview_name,
            interviews.interview_type,
            interviews.subject_id,
            interviews.study_id,
            MIN(interview_parts.interview_day) as interview_day,
            MIN(interview_parts.interview_datetime) as interview_datetime
        FROM interviews
        LEFT JOIN interview_parts ON interviews.interview_name = interview_parts.interview_name
        AND interview_parts.is_primary = true
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (studyId) {
        baseQuery += ` WHERE interviews.study_id = $${paramIndex++}`;
        params.push(studyId);
    }

    if (subjectId) {
        baseQuery += ` ${params.length ? 'AND' : 'WHERE'} interviews.subject_id = $${paramIndex++}`;
        params.push(subjectId);
    }

    if (type) {
        baseQuery += ` ${params.length ? 'AND' : 'WHERE'} interviews.interview_type = $${paramIndex++}`;
        params.push(type);
    }

    baseQuery += `
        GROUP BY
            interviews.interview_name,
            interviews.interview_type,
            interviews.subject_id,
            interviews.study_id
    `;

    const countQuery = `SELECT COUNT(*) FROM (${baseQuery}) AS total_count`;
    const countResult = await connection.query(countQuery, params);
    const totalRows = countResult.rows[0].count;

    const limitedQuery = `${baseQuery} LIMIT ${limit} OFFSET ${offset}`;
    const { rows } = await connection.query(limitedQuery, params);

    const metadata = {
        query: unformatSQL(limitedQuery),
        totalRows,
        limit,
        offset,
    };

    return new Response(JSON.stringify({ metadata, rows }), {
        headers: {
            'Content-Type': 'application/json',
        },
    });
}