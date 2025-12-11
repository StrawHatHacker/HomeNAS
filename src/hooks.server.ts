import { initDB } from '$lib/providers/db';
import { fileWatcher } from '$lib/providers/fileWatcher';
import type { ServerInit } from '@sveltejs/kit';

export const init: ServerInit = async () => {
    fileWatcher.initListeners();
    await initDB();
};