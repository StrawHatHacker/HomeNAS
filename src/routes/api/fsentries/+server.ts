import { Auth } from "$lib/server/auth.js";
import { NAS } from "$lib/server/providers/nas.js";
import { USER_FOLDERS_TYPES, type DataOrErr, type UserFolderType } from "$lib/types";
import { error, json } from "@sveltejs/kit";
import * as Queries from "$lib/server/queries";
import { FileUtil } from "$lib/utils/fileUtil";
import { errorMap } from "$lib/server/errorMap.js";

export const POST = async ({ request, getClientAddress, cookies }) => {
    Auth.checkRatelimit(request, getClientAddress);
    const session = Auth.verifySession(cookies);

    const validateBody = await validatePOSTBody(await request.formData());
    if (!validateBody.ok) return error(400, validateBody.error);
    const { file, folderType, relativePath, parentId, mimeType, checksum } = validateBody.data;

    try {
        // TODO transaction
        const dirExists = Queries.checkIfDirExists(parentId, session.user.id);
        if (!dirExists) throw new Error('Directory does not exist.');

        Queries.upsertFile(parentId, session.user.id, file, checksum, mimeType?.toString());

        await NAS.saveFileToDir(session.user.rootFolder.name, file, Buffer.from(await file.arrayBuffer()), relativePath.toString(), folderType);
    } catch (e) {
        if (e instanceof Error) return error(400, e.message);
        return error(500, "Failed to upload file.");
    }

    return json({});
};
const validatePOSTBody = async (data: FormData): Promise<DataOrErr<{ file: File, folderType: UserFolderType, relativePath: string, parentId: number, mimeType: string, checksum: string }, string>> => {
    const file = data.get('file');
    const folderType = data.get('folderType');
    const relativePath = data.get('relativePath');
    let mimeType = data.get('mimeType');
    const checksum = data.get('checksum');

    if (!file || file instanceof File === false) return { ok: false, error: errorMap.goAway };
    if (!Object.keys(USER_FOLDERS_TYPES).includes(folderType?.toString() ?? ''))
        return { ok: false, error: errorMap.goAway };
    // relativePath can be '' empty string and still be valid
    if (relativePath === null) return { ok: false, error: errorMap.goAway };

    const parentId = Number(data.get('parentId'));
    if (Number.isNaN(Number(parentId))) return { ok: false, error: errorMap.goAway };

    if (!mimeType) mimeType = 'application/octet-stream';
    if (checksum !== await FileUtil.getChecksum(file)) return { ok: false, error: errorMap.goAway };

    return { ok: true, data: { file, folderType: folderType as UserFolderType, relativePath: relativePath.toString(), parentId, mimeType: mimeType.toString(), checksum } };
};

export const PUT = async ({ request, getClientAddress, cookies }) => {
    Auth.checkRatelimit(request, getClientAddress);
    const session = Auth.verifySession(cookies);

    const validateBody = validatePUTBody(await request.json());
    if (!validateBody.ok) return error(400, validateBody.error);
    let { relativePath, folderType, oldName, newName, fsEntryId } = validateBody.data;

    try {
        newName = FileUtil.sanitizeFilename(newName);
        oldName = FileUtil.sanitizeFilename(oldName);
    } catch (e) {
        if (e instanceof Error) return error(400, e.message);
        return error(500, "Sanitization failed.");
    }

    if (newName === oldName) return json({});

    try {
        // TODO transaction

        const fsEntry = Queries.getFSEntryById(fsEntryId, session.user.id);
        if (!fsEntry) throw new Error('File or directory does not exist.');

        const newFSEntryExists = Queries.fsEntryExists(newName, session.user.id, false);
        if (newFSEntryExists) throw new Error('File or directory already exists with that name.');

        Queries.renameFSEntry(fsEntryId, newName, session.user.id);

        NAS.renameFSEntry(session.user.rootFolder.name, relativePath, folderType, oldName, newName);

    } catch (e) {
        if (e instanceof Error) return error(400, e.message);
        return error(500, "Failed to rename file.");
    }

    return json({});
}

const validatePUTBody = (body: any): DataOrErr<{ relativePath: string, folderType: UserFolderType, oldName: string, newName: string, fsEntryId: number }, string> => {

    if (!body || typeof body !== 'object') return { ok: false, error: errorMap.goAway };
    if (!('relativePath' in body) || typeof body.relativePath !== 'string') return { ok: false, error: errorMap.goAway };
    if (!('folderType' in body) || !Object.keys(USER_FOLDERS_TYPES).includes(body.folderType)) return { ok: false, error: errorMap.goAway };
    if (!('oldName' in body) || typeof body.oldName !== 'string') return { ok: false, error: errorMap.goAway };
    if (!('newName' in body) || typeof body.newName !== 'string') return { ok: false, error: errorMap.goAway };
    if (!('fsEntryId' in body) || typeof body.fsEntryId !== 'number' || Number.isNaN(Number(body.fsEntryId))) return { ok: false, error: errorMap.goAway };

    return { ok: true, data: { relativePath: body.relativePath, folderType: body.folderType, oldName: body.oldName, newName: body.newName, fsEntryId: body.fsEntryId } };
}

export const DELETE = async ({ request, getClientAddress, cookies }) => {
    Auth.checkRatelimit(request, getClientAddress);
    const session = Auth.verifySession(cookies);

    const validatedBody = validateDELETEBody(await request.json());
    if (!validatedBody.ok) return error(400, validatedBody.error);
    const { relativePath, folderType, fsEntries } = validatedBody.data;

    return json({});
}

const validateDELETEBody = (body: any): DataOrErr<{ relativePath: string, folderType: UserFolderType, fsEntries: number[] }, string> => {

    if (!body || typeof body !== 'object') return { ok: false, error: errorMap.goAway };
    if (!('relativePath' in body) || typeof body.relativePath !== 'string') return { ok: false, error: errorMap.goAway };
    if (!('folderType' in body) || !Object.keys(USER_FOLDERS_TYPES).includes(body.folderType)) return { ok: false, error: errorMap.goAway };
    if (!('fsEntries' in body) || !Array.isArray(body.fsEntries)) return { ok: false, error: errorMap.goAway };

    for (const fsEntryId of body.fsEntries) {
        if (Number.isNaN(Number(fsEntryId))) return { ok: false, error: errorMap.goAway };
    }

    return { ok: true, data: { relativePath: body.relativePath, folderType: body.folderType, fsEntries: body.fsEntries } };
}