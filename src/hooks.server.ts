import { ADMIN_EMAIL, ADMIN_NAME } from '$env/static/private';
import { db } from '$lib/server/providers/db';
import * as FileWatcher from '$lib/server/providers/fileWatcher';
import { NAS } from '$lib/server/providers/nas';
import type { ServerInit } from '@sveltejs/kit';

export const init: ServerInit = async () => {
    initDB();
    FileWatcher.initListeners();
};

export const initDB = async () => {
    try {
        db.prepare(`SELECT 1`).run();

        db.prepare(
            `CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT, 
                name TEXT NOT NULL,
                email TEXT UNIQUE,
                created_at INTEGER NOT NULL)
            `).run();

        db.prepare(
            `CREATE TABLE IF NOT EXISTS temp_auth_codes (
                id INTEGER PRIMARY KEY AUTOINCREMENT, 
                user_id  INTEGER NOT NULL,
                code TEXT NOT NULL,
                created_at INTEGER NOT NULL)
            `).run();

        db.prepare(
            `CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT, 
                user_id  INTEGER NOT NULL,
                token TEXT NOT NULL,
                created_at INTEGER NOT NULL)
            `).run();

        db.prepare(
            `CREATE TABLE IF NOT EXISTS tags (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                color TEXT NOT NULL)
            `).run();

        db.prepare(
            `CREATE TABLE IF NOT EXISTS fs_entries (
                id INTEGER PRIMARY KEY,
                parent_id INTEGER,
                user_id INTEGER NOT NULL,

                name TEXT NOT NULL COLLATE NOCASE,
                is_dir INTEGER NOT NULL CHECK (is_dir IN (0,1)),

                size INTEGER,                -- NULL for directories
                mime_type TEXT,              -- NULL for directories
                checksum TEXT,               -- for sync / dedup
                tag INTEGER,                    
                modified_at INTEGER NOT NULL,
                created_at INTEGER NOT NULL ,

                FOREIGN KEY (parent_id) REFERENCES fs_entries(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE SET NULL,

                UNIQUE (parent_id, name)
            )`).run();

        db.prepare(`CREATE UNIQUE INDEX IF NOT EXISTS ui_fs_entries_path ON fs_entries (parent_id, name) WHERE parent_id IS NOT NULL`).run();
        db.prepare(`CREATE UNIQUE INDEX IF NOT EXISTS ui_fs_entries_root_path ON fs_entries (name) WHERE parent_id IS NULL`).run();

        // TODO we will see about these indexes
        db.prepare(`CREATE INDEX IF NOT EXISTS idx_fs_parent ON fs_entries(parent_id);`).run();
        db.prepare(`CREATE INDEX IF NOT EXISTS idx_fs_user ON fs_entries(user_id);`).run();
        db.prepare(`CREATE INDEX IF NOT EXISTS idx_fs_user_parent ON fs_entries(user_id, parent_id);`).run();

        // Crucial for ON CONFLICT
        db.prepare(`CREATE UNIQUE INDEX IF NOT EXISTS idx_file_path_identity ON fs_entries (parent_id, user_id, name);`).run();

        // Check if env vars are set (Admin has special priviledges)
        if (!ADMIN_EMAIL) throw new Error('env var ADMIN_EMAIL is not set');
        if (!ADMIN_NAME) throw new Error('env var ADMIN_NAME is not set');

        // Adding users by hand to avoid developer mistakes
        const users = [{ name: ADMIN_NAME, email: ADMIN_EMAIL },] as const;
        const { checkIfUserDirExists, createUserDirs, upsertUser } = await import('$lib/server/queries');

        users.forEach(async (user) => {
            const u = upsertUser(user.name, user.email);
            if (!u) throw new Error('Failed to upsert user');

            // Database operations
            const adminDirExists = checkIfUserDirExists(user.name);
            if (!adminDirExists) createUserDirs(u.id, user.name);

            // Filesystem operations
            await NAS.createUserFolders(user.name);
        });
    } catch (error) {
        if (error instanceof Error) console.error(error.message);
        process.exit('Database error');
    }
};