import Database from 'better-sqlite3';
import fs from 'node:fs';

fs.mkdirSync('db', { recursive: true });
export const db = new Database('db/nas.db', {});

db.pragma('journal_mode = WAL');