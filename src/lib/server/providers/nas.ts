import type { UserFolderType } from "$lib/types";
import fs from "node:fs/promises";
import path from "node:path";
import { watchPath } from "./fileWatcher";

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

    static async saveFileToDir(userFolder: string, file: File, buffer: Buffer, relativePath: string, folderType: UserFolderType) {
        const targetDir = path.join(watchPath, userFolder, folderType, relativePath);

        try {
            await fs.access(targetDir);
        } catch {
            throw new Error(`Directory does not exist: ${userFolder}/${folderType}/${relativePath}`);
        }

        const finalPath = path.join(targetDir, file.name);
        await fs.writeFile(finalPath, buffer);

        return finalPath;
    }

    static async renameFSEntry(
        userFolder: UserFolderType,
        relativePath: string,
        folderType: UserFolderType,
        oldName: string,
        newName: string
    ) {
        const targetDir = path.join(watchPath, userFolder, folderType, relativePath);
        const oldPath = path.join(targetDir, oldName);
        const newPath = path.join(targetDir, newName);

        // Verify the old file exists
        try {
            await fs.access(oldPath);
        } catch {
            throw new Error(`Item does not exist: ${userFolder}/${folderType}/${relativePath}/${oldName}`);
        }

        // Prevent overwriting an existing file/folder
        try {
            await fs.access(newPath);
            throw new Error(`The name "${newName}" is already taken in this folder.`);
        } catch (err: any) {
            // If the error is 'ENOENT', it means the path is available, which is what we want
            if (err.code !== 'ENOENT') throw err;
        }

        // Rename works for both files and directories
        await fs.rename(oldPath, newPath);
    }

    /**
     * Delete a list of files or directories under a directory, by name
     */
    static async deleteFSEntries(
        userFolder: UserFolderType,
        relativePath: string,
        folderType: UserFolderType,
        fsEntryNames: string[]
    ) {
        const targetDir = path.join(watchPath, userFolder, folderType, relativePath);

        // Verify the directory exists
        try {
            await fs.access(targetDir);
        } catch {
            throw new Error(`Directory does not exist: ${userFolder}/${folderType}/${relativePath}`);
        }

        for (const name of fsEntryNames) {
            const fsEntryPath = path.join(targetDir, name);

            // Recursive to delete directories. Force to not throw if file/dir doesn't exist
            await fs.rm(fsEntryPath, { recursive: true, force: true });
        }
    }
}