import { Auth } from "$lib/server/auth";
import { errorMap } from "$lib/server/errorMap";
import * as Queries from "$lib/server/queries";
import { error, json } from "@sveltejs/kit";

export const GET = async ({ request, getClientAddress, cookies, url }) => {
    Auth.checkRatelimit(request, getClientAddress);
    const session = Auth.verifySession(cookies);

    const checksum = url.searchParams.get('checksum');

    if (checksum !== null && checksum !== '') {
        const entries = Queries.getFSEntryByChecksum(checksum, session.user.id);
        if (entries.length !== 1) return error(400, 'Invalid checksum.');
        return json(entries[0]);
    }

    return error(400, errorMap.goAway);
}