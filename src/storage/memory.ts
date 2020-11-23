import { Actions} from '../actions';
import * as serialize from "../serialize"
import { Storage } from "./storage"
export class MemoryStorage implements Storage{
    storage: Array<serialize.SerializedAction>
    //@ts-ignore
    remote: Storage 
    pubKey: string
    constructor(pubKey: string){
        this.storage = []
        this.pubKey = pubKey;
    }
    async put(action: Actions): Promise<void> {
        if(action.__origin === ""){
            action.__origin = this.pubKey;
        }
        this.storage.push(serialize.actionToJSON(action))
        return 
    }
    async get(): Promise<Array<Actions>> {
            return this.storage.map(serialize.actionFromJSON);
        }

    async clear():Promise<void> {
        this.storage = []
    }

    async flush(): Promise<void> {
        return;
    } 

    async addRemote(remoteStorage: Storage){
        this.remote = remoteStorage;
    }

    // appKey and pubKey are nops in this and assumes user has added a remote storage for in memory purposes 
    async getForeign(_appKey:string, _pubKey:string): Promise<Array<Actions>> {
        return this.remote.get()
    }
}

