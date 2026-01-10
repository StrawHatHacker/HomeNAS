import { Auth } from "$lib/server/auth.js";
import { NAS } from "$lib/server/providers/nas.js";
import { USER_FOLDERS_TYPES, type UserFolderType } from "$lib/types";
import { error, json } from "@sveltejs/kit";
import * as Queries from "$lib/server/queries";
import { FileUtil } from "$lib/utils/fileUtil";

export const POST = async ({ request, getClientAddress, cookies }) => {
    Auth.checkRatelimit(request, getClientAddress);
    const session = Auth.verifySession(cookies);

    const data = await request.formData();
    const file = data.get('file') as File;
    const folderType = data.get('folderType') as UserFolderType;
    const relativePath = data.get('relativePath');
    let mimeType = data.get('mimeType');
    const checksum = data.get('checksum');

    if (!file || file instanceof File === false) return error(400, 'No file');
    if (!Object.keys(USER_FOLDERS_TYPES).includes(folderType))
        return error(400, 'Invalid folder type');

    // relativePath can be '' empty string and still be valid
    if (relativePath === null) return error(400, 'No relative path');

    const parentId = Number(data.get('parentId'));
    if (Number.isNaN(Number(parentId))) return error(400, 'Invalid parentId');

    if (!mimeType) mimeType = 'application/octet-stream';
    if (checksum !== await FileUtil.getChecksum(file)) return error(400, 'Invalid checksum');

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

export const PUT = async ({ request, getClientAddress, cookies }) => {
    Auth.checkRatelimit(request, getClientAddress);
    const session = Auth.verifySession(cookies);

    const body = await request.json();
    if (!('relativePath' in body)) return error(400, 'No relative path');
    if (!('folderType' in body)) return error(400, 'No folder type');
    if (!('oldName' in body)) return error(400, 'No old name');
    if (!('newName' in body)) return error(400, 'No new name');
    if (!('fsEntryId' in body)) return error(400, 'No fsEntryId');

    const fsEntryId = Number(body.fsEntryId);
    if (Number.isNaN(Number(fsEntryId))) return error(400, 'Invalid fsEntryId');

    try {
        body.newName = FileUtil.sanitizeFilename(body.newName);
        body.oldName = FileUtil.sanitizeFilename(body.oldName);
    } catch (e) {
        if (e instanceof Error) return error(400, e.message);
        return error(500, "Sanitization failed.");
    }

    if (body.newName === body.oldName) return json({});

    try {
        // TODO transaction

        const fsEntry = Queries.getFSEntryById(fsEntryId, session.user.id);
        if (!fsEntry) throw new Error('File or directory does not exist.');

        const newFSEntryExists = Queries.fsEntryExists(body.newName, session.user.id, false);
        if (newFSEntryExists) throw new Error('File or directory already exists with that name.');

        Queries.renameFSEntry(fsEntryId, body.newName, session.user.id);

        NAS.renameFSEntry(session.user.rootFolder.name, body.relativePath, body.folderType, body.oldName, body.newName);

    } catch (e) {
        if (e instanceof Error) return error(400, e.message);
        return error(500, "Failed to rename file.");
    }

    return json({});
}