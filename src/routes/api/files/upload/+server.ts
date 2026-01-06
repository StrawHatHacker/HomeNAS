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
    let targetDirIdData = data.get('targetDirId');
    let mimeType = data.get('mimeType');
    const checksum = data.get('checksum');

    if (!file || file instanceof File === false) return error(400, 'No file');
    if (!Object.keys(USER_FOLDERS_TYPES).includes(folderType))
        return error(400, 'Invalid folder type');

    // relativePath can be '' empty string and still be valid
    if (relativePath === null) return error(400, 'No relative path');
    if (!targetDirIdData) return error(400, 'No targetDirId');

    const targetDirId = Number(targetDirIdData);
    if (Number.isNaN(Number(targetDirId))) return error(400, 'Invalid targetDirId');

    if (!mimeType) mimeType = 'application/octet-stream';
    if (checksum !== await FileUtil.getChecksum(file)) return error(400, 'Invalid checksum');

    try {
        // TODO transaction
        const dirExists = Queries.checkIfDirExists(targetDirId, session.user.id);
        if (!dirExists) throw new Error('Directory does not exist.');

        Queries.upsertFile(targetDirId, session.user.id, file, checksum, mimeType?.toString());

        await NAS.saveFileToDir(session.user.rootFolder.name, file, Buffer.from(await file.arrayBuffer()), relativePath.toString(), folderType);
    } catch (e) {
        if (e instanceof Error) return error(400, e.message);
        return error(500, "Failed to upload file.");
    }

    return json({});
};