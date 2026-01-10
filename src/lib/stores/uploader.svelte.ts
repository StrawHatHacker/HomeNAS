import type { UserFolderType } from "$lib/types";
import { FileUtil } from "$lib/utils/fileUtil";

export type UploadTask = {
    id: string;
    file: File;
    progress: number;
    folderType: UserFolderType;
    status: 'waiting' | 'uploading' | 'done' | 'error';
    errorMessage?: string;
    /**
     *  Relative path to the target directory.
     *  Helps with saving files to the correct directory using fs
    */
    relativePath: string[];
    /**
     *  The id of the target directory
     *  Helps with creating entries in the database
     */
    parentId: number;
    mimeType: string;
    checksum: string;
    xhr?: XMLHttpRequest;
}

class UploaderQueueStore {
    onUploadSuccess?: (task: UploadTask) => void;

    // Task queue
    tasks = $state<UploadTask[]>([]);

    // Max files to upload at once. The rest wait in the queue
    maxConcurrency = 3;

    activeCount = $derived(this.tasks.filter(t => t.status === 'uploading').length);
    queue = $derived(this.tasks.filter(t => t.status === 'waiting'));

    // Add new files to queue
    async queueFiles(fileList: FileList, relativePath: string[], parentId: number, folderType: UserFolderType) {
        const taskPromises = Array.from(fileList).map(async (file) => {
            // Calculate the checksum here
            const checksumValue = await FileUtil.getChecksum(file);

            const t: UploadTask = {
                id: crypto.randomUUID(),
                file,
                progress: 0,
                folderType,
                status: 'waiting',
                relativePath,
                parentId,
                mimeType: file.type,
                checksum: checksumValue, // This is now a string
            };
            return t;
        });

        const newTasks = await Promise.all(taskPromises);

        this.tasks.push(...newTasks);

        // Process queue immediately so the upload can get started
        this.processQueue();
    }

    // Clear finished tasks
    clearFinished() {
        this.tasks = this.tasks.filter(t => t.status !== 'done' && t.status !== 'error');
    }

    private async processQueue() {
        if (this.activeCount >= this.maxConcurrency) return;

        const nextTask = this.tasks.find(t => t.status === 'waiting');
        if (!nextTask) return;

        console.info('trying to upload file ', nextTask.file.name);

        // Start upload asynchronously
        this.upload(nextTask);

        // Try to fill next slot immediately
        this.processQueue();
    }

    private async upload(task: UploadTask) {
        const xhr = new XMLHttpRequest();

        // On file upload create new xhr with it's own listeners
        task.xhr = xhr;
        task.status = 'uploading';

        // Progress tracking
        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
                task.progress = Math.round((e.loaded / e.total) * 100);
            }
        };

        // On done
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                task.status = 'done';
                task.progress = 100;
                this.onUploadSuccess?.(task);
            } else {
                task.status = 'error';
                const response = JSON.parse(xhr.responseText);
                task.errorMessage = response['message'] || 'Failed to upload file.';
            }
            this.processQueue();
        };

        // Error handling
        xhr.onerror = (e) => {
            console.log(e);

            console.error('Error uploading file', task.file.name);
            task.status = 'error';
            this.processQueue();
        };

        // Send as FormData
        const formData = new FormData();
        formData.append('file', task.file);
        formData.append('folderType', task.folderType);
        formData.append('relativePath', task.relativePath.join('/'));
        formData.append('parentId', task.parentId.toString());
        formData.append('mimeType', task.mimeType);
        formData.append('checksum', task.checksum);

        xhr.open('POST', '/api/fsentries');
        xhr.send(formData);
    }
}

export const Uploader = new UploaderQueueStore();