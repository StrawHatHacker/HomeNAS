import { createSHA256 } from "hash-wasm";

export class FileUtil {

    /**
     * @description Chunks and hashes a file with SHA256
     */
    static async getChecksum(file: File) {
        const hasher = await createSHA256();
        const chunkSize = 2 * 1024 * 1024; // 2MB
        let offset = 0;

        while (offset < file.size) {
            const chunk = file.slice(offset, offset + chunkSize);
            const buffer = await chunk.arrayBuffer();

            // Update the hash state with the new chunk
            hasher.update(new Uint8Array(buffer));

            offset += chunkSize;
        }

        return hasher.digest(); // Returns the final hash
    }

    static sizeToReadable(size: number, decimals: number = 2) {
        if (size === 0) return "0 B";

        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ["B", "KB", "MB", "GB", "TB", "PB"];

        // Calculate which unit index to use
        // Math.log(size) / Math.log(k) returns the power of 1024 the size represent
        const i = Math.floor(Math.log(size) / Math.log(k));

        return `${parseFloat((size / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    }
}