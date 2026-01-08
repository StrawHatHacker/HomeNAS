export type FSEntryViewMode = 'list' | 'grid';

/**
 * @description Utility class for LocalStorage. Uses getters and setters.
 * Use when the component is mounted!!!
 * 
 * Not checking if window and localstorage is available interanlly, it's up to YOU to make sure it is available.
 */
export class LocalStorageUtil {
    private static readonly _fsEntryViewModeKey = 'fsEntryViewMode';
    static readonly defaultfsEntryViewMode: FSEntryViewMode = 'grid';

    /** 
     * @description Getter for the FSEntryViewMode
     */
    static get fsEntryViewMode(): FSEntryViewMode {
        return localStorage.getItem(this._fsEntryViewModeKey) as FSEntryViewMode ?? this.defaultfsEntryViewMode;
    }

    /** 
     * @description Setter for the FSEntryViewMode
     */
    static set fsEntryViewMode(mode: FSEntryViewMode) {
        localStorage.setItem(this._fsEntryViewModeKey, mode);
    }
}