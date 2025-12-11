import Database from 'better-sqlite3';
const db = new Database('nas.db', {});

db.pragma('journal_mode = WAL');

db.prepare(
    `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        name TEXT,
        email TEXT
    )
`).run();

export const initDB = () => {
    db.prepare(
        `SELECT 1
    `).run();
};