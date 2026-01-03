import chokidar, { type FSWatcher } from "chokidar";

export const watchPath = `${process.cwd()}/ext` as const;
export const watcher = chokidar.watch(watchPath, {
    persistent: true, // Keeps the process alive
    ignoreInitial: true, // Don't scan of files on app start
});

export const initListeners = () => {
    watcher
        .on("add", path => console.log(`File ${path} has been added`))
        .on("change", path => console.log(`File ${path} has been changed`))
        .on("unlink", path => console.log(`File ${path} has been removed`))
        .on("ready", () => console.log("Watching files for changes..."));
}
