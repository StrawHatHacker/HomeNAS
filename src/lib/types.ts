// Only import types from server, else you will get a nasty error
import type { getFSEntriesOfDir, getSession } from "./server/queries";

export type Only<T, U> = Pick<T, Exclude<keyof T, keyof U>>;
export type Either<T, U> = Only<U, T> | Only<T, U>;

export type DataOrErr<T, E> =
    | { ok: true; data: T }
    | { ok: false; error: E };

export const COOKIES = {
    session: 'session',
} as const;

export const ROUTES = {
    home: '/',
    crypt: '/u/crypt',
    encrypted: '/u/encrypted',
    shared: '/u/shared',
    bin: '/u/bin',
} as const;

export type User = NonNullable<ReturnType<typeof getSession>>['user'];

export const USER_FOLDERS_TYPES = {
    crypt: 'crypt',
    encrypted: 'encrypted',
} as const;

export type UserFolderType = keyof typeof USER_FOLDERS_TYPES;

export type BreadCrumbsEntry = {
    id: number; name: string
}

export type FSEntries = ReturnType<typeof getFSEntriesOfDir>;

export type ModalState = 'open' | 'closed' | 'loading';