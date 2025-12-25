import { getSession } from "./server/queries";

export type Only<T, U> = Pick<T, Exclude<keyof T, keyof U>>;
export type Either<T, U> = Only<U, T> | Only<T, U>;

export type DataOrErr<T, E> =
    | { ok: true; data: T }
    | { ok: false; error: E };

export const COOKIES =  {
    session: 'session',
} as const;

export const ROUTES = {
    home: '/',
    files: '/u/files',
} as const;

export type User =  ReturnType<typeof getSession>['user'];