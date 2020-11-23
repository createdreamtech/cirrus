import { Actions} from '../actions';
import * as serialize from "../serialize"
import { SkynetClient, genKeyPairFromSeed } from "skynet-js";
import { Storage, RemoteStorage } from "./storage"
import { MemoryStorage } from './memory';

export class SkyDBStorage implements Storage, RemoteStorage {

    secret:string
    pubKey: string
    appKey: string
    skynetClient: SkynetClient 
    cache: Storage
    constructor(secret: string, appKey: string){
        const {publicKey, privateKey} = genKeyPairFromSeed(secret)
        this.secret = privateKey
        this.pubKey = publicKey
        this.appKey = appKey;
        this.skynetClient = new SkynetClient("https://siasky.net")
        this.cache = new MemoryStorage(this.pubKey);
        
    }

    async put(action: Actions): Promise<void> {
        return this.cache.put(action)
    }
    async get(): Promise<Actions[]> {
        const actions = await this.cache.get()
        if(actions.length === 0){
            const acts = await this.getFromSource(this.appKey, this.pubKey)
            //NOTE this is safe only because we're using MemoryStorage
            for ( const action of acts ) {
                await this.put(action)
            }
            return acts
        }
        return actions 
    }
    async clear(): Promise<void> {
        return this.cache.clear()
    }

    //write data to disk
    async flush(): Promise<void> {
        const actions = await this.cache.get()
        const serializedActions = actions.map(serialize.actionToJSON.bind(this))
        return this.skynetClient.db.setJSON(this.secret, this.appKey, serializedActions).catch((e:Error)=>console.error(e))
    }
    origin(): string {
        return this.pubKey
    }
    async getFromSource(appKey: string, pubKey:string): Promise<Actions[]> {
        const entry = await this.skynetClient.db.getJSON(pubKey, appKey)
        if(entry && entry.data  && Array.isArray(entry.data)){
            return entry.data.map(serialize.actionFromJSON.bind(this))
        }
        return []
    }
    async getForeign(appKey: string, pubKey: string): Promise<Actions[]> {
        return this.getFromSource(appKey, pubKey)
    }
}