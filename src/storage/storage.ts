import {Actions, ActionType} from "../actions"
export interface Storage {
    put(action: Actions): Promise<void>
    //TODO make more extensive filtering for now hoist this to the user
    get(): Promise<Array<Actions>>

    // Clears database in memory representation state
    clear(): Promise<void>

    // Not all storage will or can use this but it allows for the user to have more granular control over writing to permanent storage
    flush(): Promise<void>

    origin(): string

}

export interface RemoteStorage {
    getForeign(appKey:string, pubKey: string): Promise<Array<Actions>>
}