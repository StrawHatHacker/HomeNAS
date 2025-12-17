export type User = {
    id: number,
    name: string,
    email: string,
    created_at: number
}

export type Only<T, U> = Pick<T, Exclude<keyof T, keyof U>>;
export type Either<T, U> = Only<U, T> | Only<T, U>;

export type DataOrErr<T, E> =
    | { ok: true; data: T }
    | { ok: false; error: E };