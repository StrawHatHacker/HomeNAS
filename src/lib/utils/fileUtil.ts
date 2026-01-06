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
}