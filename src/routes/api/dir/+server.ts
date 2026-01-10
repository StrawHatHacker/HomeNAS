import { Auth } from "$lib/server/auth.js";
import { NAS } from "$lib/server/providers/nas.js";
import { USER_FOLDERS_TYPES, type DataOrErr, type UserFolderType } from "$lib/types";
import { error, json } from "@sveltejs/kit";
import * as Queries from "$lib/server/queries";
import { errorMap } from "$lib/server/errorMap";

// CREATE DIRECTORY
export const POST = async ({ request, getClientAddress, cookies }) => {
    Auth.checkRatelimit(request, getClientAddress);
    const session = Auth.verifySession(cookies);

    const body = await request.json();
    const validatedBody = validatePOSTBody(body);
    if (!validatedBody.ok) return error(400, validatedBody.error);
    const { data } = validatedBody;

    try {
        // TODO transaction

        // No point in creating a directory if it already exists
        const dir = Queries.getDirByName(data.dirName, session.user.id, data.parentDirId);
        if (dir) throw new Error('Directory already exists.');

        // Check if parent directory exists
        const parent = Queries.getDirById(data.parentDirId, session.user.id);
        if (!parent) throw new Error('Parent directory does not exist.');

        // Create the directory
        Queries.createDir(session.user.id, data.dirName, parent.id);

        await NAS.createDir(session.user.rootFolder.name, USER_FOLDERS_TYPES.crypt, data.relativePath.join('/'), data.dirName);
    } catch (e) {
        if (e instanceof Error) throw error(400, e.message);
        throw error(500, "Failed to create directory.");
    }

    return json({});
};

const validatePOSTBody = (body: any): DataOrErr<{ dirName: string, relativePath: string[], parentDirId: number }, string> => {

    if (!body || typeof body !== 'object') return { ok: false, error: errorMap.goAway };
    if (!('dirName' in body) || typeof body.dirName !== 'string') return { ok: false, error: errorMap.goAway };
    if (!('relativePath' in body) || !Array.isArray(body.relativePath)) return { ok: false, error: errorMap.goAway };
    for (const lp of body.relativePath) if (typeof lp !== 'string') return { ok: false, error: errorMap.goAway };
    if (!('parentDirId' in body) || typeof body.parentDirId !== 'number' || Number.isNaN(Number(body.parentDirId))) return { ok: false, error: errorMap.goAway };
    if (!('type' in body) || !Object.keys(USER_FOLDERS_TYPES).includes(body.type)) return { ok: false, error: errorMap.goAway };

    return { ok: true, data: body };
}

// GET ALL CONTENTS OF A DIRECTORY (files and directories)
export const GET = async ({ request, getClientAddress, cookies, url }) => {
    Auth.checkRatelimit(request, getClientAddress);
    const session = Auth.verifySession(cookies);

    const QcurrentDirId = url.searchParams.get('currentDirId');
    if (!QcurrentDirId || Number.isNaN(Number(QcurrentDirId))) return error(400, errorMap.goAway);

    const currentDirId = Number(QcurrentDirId);

    const dirContents = Queries.getFSEntriesOfDir(currentDirId, session.user.id);

    return json(dirContents);
}
