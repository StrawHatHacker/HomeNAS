import { watchPath } from "./fileWatcher";
import fs from "node:fs/promises";

export class NAS {
    static async createUserFolders(folderName: string)  {
        // Recursive:true makes it so it doesn't throw error if the folder already exists
        await fs.mkdir(`${watchPath}/${folderName}/crypt`, { recursive: true });
        await fs.mkdir(`${watchPath}/${folderName}/encrypted`, { recursive: true });
        // await fs.mkdir(`${watchPath}/${folderName}/music`, { recursive: true });
    }
}