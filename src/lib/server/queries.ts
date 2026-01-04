import { USER_FOLDERS_TYPES, type User } from "$lib/types";
import { db } from "./providers/db";

const upsertUserQuery = db.prepare(
    `INSERT INTO users (name, email, created_at) 
        VALUES ($name, $email, datetime('now'))
        ON CONFLICT(email) DO UPDATE SET 
            name = excluded.name  -- This "update" ensures a row is returned
        RETURNING id`);

const checkIfUserDirExistsQuery = db.prepare(`SELECT 1 FROM fs_entries WHERE parent_id IS NULL AND name = $name LIMIT 1`);

const checkIfDirExistsQuery = db.prepare(
    `SELECT 1 FROM fs_entries 
    WHERE id = $id AND is_dir = 1 AND user_id = $user_id 
        AND parent_id IS NOT NULL
    LIMIT 1`);

const getDirQuery = db.prepare(`SELECT id, name FROM fs_entries WHERE parent_id = $parent_id AND is_dir = 1 AND user_id = $user_id AND name = $name LIMIT 1`);

const getDirByIdQuery = db.prepare(`SELECT id, name FROM fs_entries WHERE id = $id AND user_id = $user_id AND is_dir = 1 AND user_id = $user_id LIMIT 1`);

const getDirContentsQuery = db.prepare(
    `SELECT id, name, is_dir, user_id, parent_id, created_at, modified_at
    FROM fs_entries 
    WHERE parent_id = $parent_id  AND user_id = $user_id 
    ORDER BY is_dir DESC, name ASC`);

const createDirQuery = db.prepare(
    `INSERT INTO fs_entries (parent_id, user_id, name, is_dir, created_at, modified_at)
    VALUES ($parent_id, $user_id, $name, 1, datetime('now'), datetime('now')) RETURNING id`);

const createUserSubFolderQuery = db.prepare(
    `INSERT INTO fs_entries (parent_id, user_id, name, is_dir, created_at, modified_at)
    VALUES ( $parent_id, $user_id, $name, 1, datetime('now'), datetime('now')) RETURNING id`);

const createFileQuery = db.prepare(
    `INSERT INTO fs_entries (parent_id, user_id, name, is_dir, created_at, modified_at)
    VALUES ( $parent_id, $user_id, $name, 0, datetime('now'), datetime('now'))`);

const getUserByEmailQuery = db.prepare(`SELECT id, name, email, created_at FROM users WHERE email = $email LIMIT 1`);

const createAuthCodeQuery = db.prepare(
    `INSERT INTO temp_auth_codes (user_id, code, created_at)
    VALUES ( $user_id, $code, datetime('now'))`);

const getValidCodeQuery = db.prepare(
    `SELECT id FROM temp_auth_codes 
    WHERE code = $code AND user_id = $user_id AND created_at > datetime('now', '-2 minutes') LIMIT 1`);

const deleteCodesByUserIdQuery = db.prepare(`DELETE FROM temp_auth_codes WHERE user_id = $id`);

const createSessionQuery = db.prepare(
    `INSERT INTO sessions (user_id, token, created_at)
    VALUES ($user_id, $token, datetime('now'))`);

const getSessionQuery = db.prepare(
    `SELECT sessions.id, sessions.created_at, users.id as user_id, users.name, users.email, users.created_at as user_created_at, root.id as root_id, root.name as root_name, subroot.id as subroot_id, subroot.name as subroot_name
    FROM sessions
    JOIN users ON sessions.user_id = users.id
    INNER JOIN fs_entries as root ON users.id = root.user_id AND root.parent_id IS NULL AND root.is_dir = 1
    INNER JOIN fs_entries as subroot ON root.id = subroot.parent_id AND subroot.is_dir = 1
    WHERE sessions.token = $token`
);

const deleteAllSessionsByUserIdQuery = db.prepare(`DELETE FROM sessions WHERE user_id = $id`);

const addFileQuery = db.prepare(
    `INSERT INTO fs_entries (parent_id, user_id, name, is_dir, created_at, modified_at)
    VALUES ( $parent_id, $user_id, $name, 0, datetime('now'), datetime('now'))`);

export const createAuthCode = (user_id: number, code: string) => {
    return createAuthCodeQuery.run({ user_id, code });
}

export const upsertUser = (name: string, email: string) => {
    return upsertUserQuery.get({ name, email }) as { id: number };
}

export const checkIfUserDirExists = (name: string) => {
    return checkIfUserDirExistsQuery.get({ name }) as { id: number };
}

export const checkIfDirExists = (id: number, user_id: number) => {
    return checkIfDirExistsQuery.get({ id, user_id }) as { id: number };
}

export const getDir = (name: string, user_id: number, parent_id: number) => {
    return getDirQuery.get({ name, user_id, parent_id }) as { id: number; name: string }[];
}

export const getDirById = (id: number, user_id: number) => {
    return getDirByIdQuery.get({ id, user_id }) as { id: number; name: string };
}

export const getDirContents = (parent_id: number, user_id: number) => {
    const rows = getDirContentsQuery.all({ parent_id, user_id }) as any[];

    return rows.map((row) => ({
        id: row.id as number,
        name: row.name as string,
        isDir: row.is_dir === 1,
        parentId: row.parent_id as number,
        userId: row.user_id as number,
        createdAt: row.created_at as string,
        modifiedAt: row.modified_at as string
    }));
}

export const createDir = (user_id: number, name: string, parent_id: number) => {
    return createDirQuery.get({ user_id, name, parent_id }) as { id: number };
}

export const createUserDirs = (user_id: number, name: string) => {
    const parent = createDirQuery.get({ user_id, name, parent_id: null }) as { id: number };

    Object.keys(USER_FOLDERS_TYPES).forEach((type) => createUserSubFolderQuery.run({ parent_id: parent.id, user_id, name: type }));
    return;
}

export const createFile = (parent_id: number, user_id: number, name: string) => {
    return createFileQuery.run({ parent_id, user_id, name });
}

export const recursivelyCreateUserDirs = (user_id: number, parent_id: number, dirs: string[]) => {
    let currentParentId = parent_id;

    // Transaction to ensure the directory tree is created atomically
    const createTransaction = db.transaction((pathParts: string[]) => {
        for (const dirName of pathParts) {
            // Check if this folder already exists under the current parent 
            // to avoid unique constraint errors or duplicates
            const exists = db.prepare(`
                SELECT id FROM fs_entries 
                WHERE parent_id = ? AND name = ? AND user_id = ? LIMIT 1
            `).get(currentParentId, dirName, user_id) as { id: number } | undefined;

            if (exists) {
                // Move the pointer to the existing folder's ID
                currentParentId = exists.id;
            } else {
                // Insert and capture the NEW ID to use as the parent for the next iteration
                const result = createUserSubFolderQuery.get({
                    parent_id: currentParentId,
                    user_id,
                    name: dirName
                }) as { id: number };

                currentParentId = result.id;
            }
        }
        return currentParentId;
    });

    return createTransaction(dirs);
};

export const getUserByEmail = (email: string) => {
    return getUserByEmailQuery.get({ email }) as User;
}

export const getValidCode = (code: string, user_id: number) => {
    return getValidCodeQuery.get({ code, user_id }) as { id: number };
}

export const deleteCodesByUserId = (id: number) => {
    return deleteCodesByUserIdQuery.run({ id });
}

export const createSession = (user_id: number, token: string) => {
    return createSessionQuery.run({ user_id, token });
}

export const getSession = (token: string) => {
    const rows = getSessionQuery.all({ token }) as any;
    if (rows.length === 0) return null;

    const first = rows[0];

    // Map all rows to extract the direct subFolders
    const subFolders = rows.map((row: any) => ({
        id: row.subroot_id as number,
        name: row.subroot_name as string
    })) as { id: number, name: string }[];

    return {
        id: first.id as number,
        created_at: first.created_at as number,
        user: {
            id: first.user_id as number,
            name: first.name as string,
            email: first.email as string,
            created_at: first.user_created_at as number,
            rootFolder: {
                id: first.root_id as number,
                name: first.root_name as string,
                subFolders
            }
        },
    };
}

export const deleteAllSessionsByUserId = (id: number) => {
    return deleteAllSessionsByUserIdQuery.run({ id });
}

export const addFile = (parent_id: number, user_id: number, name: string) => {
    return addFileQuery.run({ parent_id, user_id, name });
}