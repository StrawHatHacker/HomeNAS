import path from "node:path";
import { watchPath } from "./fileWatcher";
import fs from "node:fs/promises";
import type { UserFolderType } from "$lib/types";

export class NAS {
    static async createUserFolders(folderName: string) {
        // Recursive:true makes it so it doesn't throw error if the folder already exists
        await fs.mkdir(`${watchPath}/${folderName}/crypt`, { recursive: true });
        await fs.mkdir(`${watchPath}/${folderName}/encrypted`, { recursive: true });
        // await fs.mkdir(`${watchPath}/${folderName}/music`, { recursive: true });
    }

    static async createDir(userFolder: string, folderType: UserFolderType, relativePath: string, name: string) {
        const targetDir = path.join(watchPath, userFolder, folderType, relativePath);

        try {
            await fs.access(targetDir);
        } catch {
            throw new Error(`Directory does not exist: ${userFolder}/${folderType}/${relativePath}`);
        }

        const finalPath = path.join(targetDir, name);
        await fs.mkdir(finalPath);

        return finalPath;
    }

    static async saveFileToDir(userFolder: string, fileName: string, buffer: Buffer, relativePath: string, folderType: UserFolderType) {
        const targetDir = path.join(watchPath, userFolder, folderType, relativePath);

        try {
            await fs.access(targetDir);
        } catch {
            throw new Error(`Directory does not exist: ${userFolder}/${folderType}/${relativePath}`);
        }

        const finalPath = path.join(targetDir, fileName);
        await fs.writeFile(finalPath, buffer);

        return finalPath;
    }
}