export type UploadTask = {
    id: string;
    file: File;
    progress: number;
    encrypted: boolean;
    status: 'waiting' | 'uploading' | 'done' | 'error';
    xhr?: XMLHttpRequest;
}

export type AddFilesOptions = {
    encrypted: boolean;
}

class UploaderQueueStore {
    // Task queue
    tasks = $state<UploadTask[]>([]);

    // Max files to upload at once. The rest wait in the queue
    maxConcurrency = 3;

    activeCount = $derived(this.tasks.filter(t => t.status === 'uploading').length);
    queue = $derived(this.tasks.filter(t => t.status === 'waiting'));

    // Add new files to queue
    addFiles(fileList: FileList, { encrypted }: AddFilesOptions) {
        const newTasks: UploadTask[] = Array.from(fileList).map(file => ({
            id: crypto.randomUUID(),
            file,
            progress: 0,
            encrypted,
            status: 'waiting'
        }));

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
            } else {
                task.status = 'error';
            }
            this.processQueue();
        };

        // Error handling
        xhr.onerror = () => {
            console.error('Error uploading file', task.file.name);
            task.status = 'error';
            this.processQueue();
        };

        // Send as FormData
        const formData = new FormData();
        formData.append('file', task.file);

        xhr.open('POST', '/api/files/upload');
        xhr.send(formData);
    }
}

export const Uploader = new UploaderQueueStore();