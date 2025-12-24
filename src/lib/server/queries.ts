import type { User } from "$lib/types";
import { db } from "./providers/db";

const upsertUserQuery = db.prepare(
    `INSERT INTO users (name, email, created_at) 
        VALUES ($name, $email, $created_at)
        ON CONFLICT(email) DO UPDATE SET 
            name = excluded.name  -- This "update" ensures a row is returned
        RETURNING id`);

const checkIfUserDirExistsQuery = db.prepare(`SELECT 1 FROM fs_entries WHERE parent_id IS NULL AND name = $name LIMIT 1`);

const createUserDirQuery = db.prepare(
    `INSERT INTO fs_entries (user_id, name, is_dir, created_at, modified_at)
    VALUES ( $user_id, $name, 1, $created_at, $modified_at)`);

const getUserByEmailQuery = db.prepare(`SELECT id, name, email, created_at FROM users WHERE email = $email LIMIT 1`);

const createAuthCodeQuery = db.prepare(
    `INSERT INTO temp_auth_codes (user_id, code, created_at)
    VALUES ( $user_id, $code, $created_at)`);

const getValidCodeQuery = db.prepare(
    `SELECT id FROM temp_auth_codes 
    WHERE code = $code AND user_id = $user_id AND created_at > datetime('now', '-2 minutes') LIMIT 1`);

const deleteCodesByUserIdQuery = db.prepare(`DELETE FROM temp_auth_codes WHERE user_id = $id`);

const createSessionQuery = db.prepare(
    `INSERT INTO sessions (user_id, token, created_at)
    VALUES ($user_id, $token, datetime('now'))`);

const getSessionQuery = db.prepare(
    `SELECT sessions.id, sessions.created_at, users.id as user_id, users.name, users.email, users.created_at as user_created_at
    FROM sessions
    JOIN users ON sessions.user_id = users.id
    WHERE sessions.token = $token LIMIT 1`
);

export const createAuthCode = (user_id: number, code: string) => {
    return createAuthCodeQuery.run({ user_id, code, created_at: Date.now() });
}

export const upsertUser = (name: string, email: string) => {
    return upsertUserQuery.get({ name, email, created_at: Date.now() }) as { id: number };
}

export const checkIfUserDirExists = (name: string) => {
    return checkIfUserDirExistsQuery.get({ name }) as { id: number };
}

export const createUserDir = (user_id: number, name: string) => {
    return createUserDirQuery.run({ user_id, name, created_at: Date.now(), modified_at: Date.now() });
}

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
    const s = getSessionQuery.get({ token }) as any;
    return {
        id: s.id,
        created_at: s.created_at,
        user: {
            id: s.user_id,
            name: s.name,
            email: s.email,
            created_at: s.user_created_at
        }
    };
}