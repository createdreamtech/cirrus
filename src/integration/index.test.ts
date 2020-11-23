import * as datalog from '@createdreamtech/datalog';
import * as serialize from "../serialize"
import { Cirrus } from "../cirrus";
import { MemoryStorage } from "../storage/memory";
import { Storage, RemoteStorage, SkyDBStorage } from "../storage"
type RemoteStore = Storage & RemoteStorage;
async function testStore(appKey: string, store1: RemoteStore, store2: RemoteStore): Promise<void> {
    describe("integration test that demonstrates query engine working against storage", () => {

        it("should query across two databases", async () => {

            const db1 = new Cirrus(store1, store1.origin())
            const db2 = new Cirrus(store1, store2.origin())

            // Construct schema for database
            const parentSchema = {
                parentID: datalog.NumberType,
                childID: datalog.NumberType,
            }
            const peopleSchema = {
                id: datalog.NumberType,
                name: datalog.StringType
            }

            // construct to seperate tables for the db instances
            // tables show the relationship of a parent and child aka a short little graph 
            for (const db of [db1, db2]) {
                await db.newTable<{ parentID: number, childID: number }>("ParentOf", parentSchema)
                await db.newTable<{ id: number, name: string }>("People", peopleSchema)
            }
            // now we retrieve the data to write to the DB,
            const PeopleTableDB1 = await db1.getTable("People", peopleSchema)
            const PeopleTableDB2 = await db2.getTable("People", peopleSchema)
            // Add people to the DB1
            await PeopleTableDB1.asserts({ id: 100, name: "Jane" })
            await PeopleTableDB1.asserts({ id: 101, name: "Tom" })
            await PeopleTableDB1.asserts({ id: 102, name: "Janice" })

            
            // Add people to the DB2
            await PeopleTableDB2.asserts({ id: 50, name: "John" })
            await PeopleTableDB2.asserts({ id: 51, name: "Zoe" })
            await PeopleTableDB2.asserts({ id: 52, name: "Trip" })

            // Make parents
            const ParentTableDB1 = await db1.getTable("ParentOf", parentSchema)
            await ParentTableDB1.asserts({ parentID: 101, childID: 100 })
            await ParentTableDB1.asserts({ parentID: 102, childID: 100 })
            const ParentTableDB2 = await db2.getTable("ParentOf", parentSchema)
            await ParentTableDB2.asserts({ parentID: 50, childID: 52 })

            // So now let's find all the parents in each database                

            const q1 = datalog.query<{ parentName: string, parentID: number, childID: number }>(({ parentName, parentID, childID }) => {
                PeopleTableDB1({ name: "Jane", id: childID })
                ParentTableDB1({ childID, parentID })
                PeopleTableDB1({ id: parentID, name: parentName })
            })
            let result = q1.view().readAllData();
            expect(result.length === 2).toBe(true)
            expect(result.map((r)=>r.parentName).sort()[0] === "Janice").toBe(true)

            const q2 = datalog.query<{ parentName: string, parentID: number, childID: number }>(({ parentName, parentID, childID }) => {
                PeopleTableDB2({ name: "Trip", id: childID })
                ParentTableDB2({ childID, parentID })
                PeopleTableDB2({ id: parentID, name: parentName })
            })
            result = q2.view().readAllData()
            expect(result.length === 1).toBe(true)
            expect(result.map((r)=>r.parentName)[0] === "John").toBe(true)
            try{
            await db1.save()
            await db2.save()
            }catch(e){
                console.log(e)
            }

            // So let's find all the parents across databases by subscribing to another dataset and querying
            if(store1 instanceof MemoryStorage && store2 instanceof MemoryStorage){
                //because it's memory storage we need a way to retrieve the data in this case we do a little
                // manual linking of the data set
                await store1.addRemote(store2) // this simply alows us to call getForeign with the appropriate data
            }
            // we just specifiy the application key, diregarded for in memory usage 
             await db1.add(appKey,store2.origin())
             let q = datalog.query<{ parentName: string, parentID: number, childID: number }>(({ parentName, parentID, childID}) => {
                PeopleTableDB1({ name: "Trip", id: childID })
                ParentTableDB1({ childID, parentID })
                PeopleTableDB1({ id: parentID, name: parentName })
            })
            result = q.view().readAllData()
            console.log(result)
            expect(result.length === 1).toBe(true)
            expect(result.map((r)=>r.parentName).sort()[0] === "John").toBe(true)
            
            try{
            await db1.save()
            }catch(e){
                console.log(e)
            }
            await db2.save()
            db1.refresh()

           q = datalog.query<{ parentName: string, parentID: number, childID: number }>(({ parentName, parentID, childID }) => {
                PeopleTableDB1({ name: "Trip", id: childID })
                ParentTableDB1({ childID, parentID })
                PeopleTableDB1({ id: parentID, name: parentName })
            })
            result = q.view().readAllData()
            expect(result.length === 1).toBe(true)
            expect(result.map((r)=>r.parentName)[0] === "John").toBe(true) 

        })
    })
}
//testStore("parents", new MemoryStorage("pubkey1"), new MemoryStorage("pubkey2"))
const secret1 = "19181918"
const secret2 = "19181918"
testStore("mypawpaw",new SkyDBStorage(secret1,"mypawpaw"), new SkyDBStorage(secret2, "mypawpaw") )
