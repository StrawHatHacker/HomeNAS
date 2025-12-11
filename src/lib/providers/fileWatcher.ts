import chokidar, { type FSWatcher } from "chokidar";

class FileWatcher {
    private static instance: FileWatcher;
    public watcher: FSWatcher;

    private constructor() {
        this.watcher = chokidar.watch(FileWatcher.watchPath, { persistent: true });
    }

    static getInstance() {
        if (!FileWatcher.instance) {
            FileWatcher.instance = new FileWatcher();
        }
        return FileWatcher.instance;
    }

    public initListeners() {
        fileWatcher.watcher
            .on("add", path => console.log(`File ${path} has been added`))
            .on("change", path => console.log(`File ${path} has been changed`))
            .on("unlink", path => console.log(`File ${path} has been removed`))
            .on("ready", () => console.log("Watching files for changes..."));
    }

    static readonly watchPath = `${process.cwd()}/ext`;
}

export const fileWatcher = FileWatcher.getInstance();
