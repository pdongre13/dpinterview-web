import { Pool } from 'pg';

let connection: Pool | undefined;

if (!connection) {
    connection = new Pool({
        user: process.env.PG_user,
        host: process.env.PG_host,
        database: process.env.PG_database,
        password: process.env.PG_password,
        port: process.env.PG_port ? parseInt(process.env.PG_port, 10) : undefined,
        ssl: process.env.PG_ssl === 'false' ? false : { rejectUnauthorized: false },
    });
}

export function getConnection(): Pool {
    if (!connection) {
        throw new Error("Database connection is undefined");
    }
    return connection;
}

export default connection;
