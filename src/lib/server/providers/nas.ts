import { watchPath } from "./fileWatcher";
import fs from "node:fs/promises";

export class NAS {
    static async createRootFolder(folderName: string)  {
        // Recursive:true makes it so it doesn't throw error if the folder already exists
        await fs.mkdir(`${watchPath}/${folderName}`, { recursive: true });
    }
}