import { Auth } from "$lib/server/auth.js";
import { NAS } from "$lib/server/providers/nas.js";
import { USER_FOLDERS_TYPES, type UserFolderType } from "$lib/types";
import { error, json } from "@sveltejs/kit";
import * as Queries from "$lib/server/queries";

export const POST = async ({ request, getClientAddress, cookies }) => {
    Auth.checkRatelimit(request, getClientAddress);
    const session = Auth.verifySession(cookies);

    const data = await request.formData();
    const file = data.get('file') as File;
    const folderType = data.get('folderType') as UserFolderType;
    const relativePath = data.get('relativePath') as string;
    let targetDirIdData = data.get('targetDirId');

    if (!file) return error(400, 'No file');
    if (!Object.keys(USER_FOLDERS_TYPES).includes(folderType))
        return error(400, 'Invalid folder type');

    const targetDirId = Number(targetDirIdData);
    if (Number.isNaN(Number(targetDirId))) return new Response('Invalid targetDirId', { status: 400 });

    try {
        // TODO transaction
        const dirExists = Queries.checkIfDirExists(targetDirId, session.user.id);
        if (!dirExists) throw new Error('Directory does not exist.');

        Queries.createFile(targetDirId, session.user.id, file.name);

        await NAS.saveFileToDir(session.user.rootFolder.name, file.name, Buffer.from(await file.arrayBuffer()), relativePath, folderType);
    } catch (e) {
        if (e instanceof Error) return error(400, e.message);
        return error(500, "Failed to upload file.");
    }

    return json({});
};