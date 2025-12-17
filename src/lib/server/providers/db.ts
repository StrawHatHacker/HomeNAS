import Database from 'better-sqlite3';

export const db = new Database('db/nas.db', {});

db.pragma('journal_mode = WAL');