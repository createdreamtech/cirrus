import * as datalog from '@createdreamtech/datalog'
import { Actions } from '../actions'
import { SerializedAction } from '../serialize';
import {Storage, RemoteStorage} from "../storage/storage"
//NOTE tableName is not globally unique you may want to make a globally unique table name when joining facts across appKeys

interface CirrusLookupTable{
    [tableName: string]:CirrusTable<any>
}

export interface CirrusTable<Val> extends datalog.Table<Val > {
    asserts(v: Val, __origin?:string): Promise<void>,
    retracts(v: Val, __origin?:string): Promise<void>,
}
export interface CirrusMetadata {
    __origin?: string
}

interface ForeignKeys {
    appKey: string,
    pubKey: string
}

export class Cirrus{

    storage:Storage & RemoteStorage
    tableLookup: CirrusLookupTable;

    //external pubKeys for databases to read
    foreignKeys: Array<ForeignKeys>;
    defaultOrigin: string;
    
    constructor(storage: Storage & RemoteStorage, defaultOrigin: string){
        this.storage = storage
        this.tableLookup = {}
        this.defaultOrigin = defaultOrigin;
        this.foreignKeys =[]
    }


    async newTable<Val>(tableName: string, schema: datalog.TableSchema<Val>, __origin: string=""): Promise<CirrusTable<Val & CirrusMetadata>> {
        // Strict cast to do the assignments to make equivalent to CirrusTable
        //@ts-ignore
        schema.__origin = datalog.StringType
        const table= datalog.newTable(schema) as CirrusTable<Val & CirrusMetadata>
        table.asserts = async (v: Val, __origin: string = this.defaultOrigin)=> {
            //@ts-ignore
            v.__origin = __origin
            table.assert(v); 
            return this.storage.put({ type:"assert", datum: v, schema, tableName, __origin})
        }
        table.retracts = async (v: Val, __origin: string = this.defaultOrigin) => {
            //@ts-ignore
            v.__origin = __origin
            table.retract(v)
            return this.storage.put({type:"retract", datum: v, schema, tableName, __origin})
        }
        table
        await this.storage.put({type: "newTable", datum: schema, schema, tableName, __origin})
        this.tableLookup[tableName] = this.tableLookup[tableName] || table;
        return table;
    }

    // Either creates or returns empty existing table
    async getTable<Val>(tableName:string, schema: datalog.TableSchema<Val>, __origin: string =""): Promise<CirrusTable<Val & CirrusMetadata>>{
        if(this.tableLookup.hasOwnProperty(tableName))
            return this.tableLookup[tableName]
       return this.newTable(tableName,schema) 
    }

    exists(tableName:string): boolean{
        if(this.tableLookup.hasOwnProperty(tableName))
            return true
        else
            return false
    }

    //TODO watch ordering here may be problematic if  service workers
    async play(actions: Array<Actions>): Promise<void> {
        for(const action of actions){
            switch(action.type){
                
                case "assert":
                    const tt = await this.getTable(action.tableName,action.schema, action.__origin) 
                    await tt.asserts(action.datum, action.__origin)
                    break;
                case "newTable":
                    // this should be a noop because getTable will upsert a new table and
                    // actions can't exist without a table;
                    await this.newTable(action.tableName,action.schema, action.__origin) 
                    break;
                case "retract":    
                    const table = await this.getTable(action.tableName,action.schema, action.__origin) 
                     await table.retracts(action.datum, action.__origin)
                     break;
            }
        }
        return 
    }

    async init() {
        const actions = await this.storage.get()         
       // reset the table lookup 
        this.tableLookup = {}
        this.storage.clear()    
        return this.play(actions)
    }

    //TODO speed this up
    async refresh() {
        // clear any lookup data
        const actions = await this.storage.get()         
       // reset the table lookup 
        this.tableLookup = {}
        // clear any cache
        this.storage.clear()    
        const acts = actions.filter((action)=> action.__origin === this.defaultOrigin)
        //refresh your own actions first 
        await this.play(acts)

        // go forth and grab external actions
        for( const entry of this.foreignKeys){
            const actions = await this.storage.getForeign(entry.appKey, entry.pubKey)      
            await this.play(actions)
        } 
    }

    async saveOnly(filter:(f:Actions)=>boolean){
        return this.storage.flush(filter)
    }

    async save() {
        return this.storage.flush()
    }

    
    async add(appKey: string, pubKey: string) {
        this.foreignKeys.push({appKey, pubKey});
        const actions = await this.storage.getForeign(appKey, pubKey)
        return this.play(actions)
    }

    rm() {
        
    }


}