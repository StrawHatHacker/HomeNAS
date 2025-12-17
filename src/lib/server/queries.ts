import { ADMIN_EMAIL, ADMIN_NAME } from "$env/static/private";
import type { User } from "$lib/types";
import { db } from "./providers/db";
import { NAS } from "./providers/nas";

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
