import * as datalog from '@createdreamtech/datalog'; 
import * as serialize from "./serialize"
import {Cirrus} from "./cirrus";
import {MemoryStorage} from "./storage/memory";



(async function foo(){
const people = {
    id: datalog.NumberType,
    name: datalog.StringType,
}

const memStorage = new MemoryStorage("asdf");
const memStorage2 = new MemoryStorage("hijk");
const cirrus = new Cirrus(memStorage,"asdf")
await cirrus.init()
const OtherPeople = await cirrus.getTable("People",people)
await OtherPeople.asserts({id:99, name:"hello"})
await OtherPeople.asserts({id:99, name:"goodbye"})

const cirrus2 = new Cirrus(memStorage2, "hijk")
const OtherPeople2 = await cirrus2.getTable("People",people)
const Note2 = await cirrus2.getTable("Note",people)
await OtherPeople2.asserts({id:100, name:"hello"})
await OtherPeople2.asserts({id:101, name:"goodbye"})
memStorage.addRemote(memStorage2)
const acts = await memStorage.getForeign("aaaa","hijk")
await cirrus.play(acts)
//console.log(await cirrus.storage.get())

const mytable = await cirrus.getTable("People",people)
const Query = datalog.query<{name:string, __origin:string, id:number}>(({name,id,__origin}) => {
  OtherPeople({name,id, __origin:"asdf"})
})

console.log(Query.view().readAllData())

//console.log(await memStorage.get())
/*console.log("-------xxxxx-------")
console.log(await cirrus.storage.get())
console.log("-------xxxxx-----")
*/

})()

const people = {
  id: datalog.NumberType,
  name: datalog.StringType,
}
const serialized: any = serialize.fromDatalogSchema(people)
const dType = serialize.toDatalogSchema(serialized)
//console.log(serialize.fromDatalogSchema()
// First we create our Datalog Table. This is what holds our data
const People = datalog.newTable<{ id: number, name: string }>(dType)
const Dog = datalog.newTable<{owner: number, name: string, color:string}> ({
  owner: datalog.NumberType,
  name: datalog.StringType,
  color: datalog.StringType
})




Dog.assert({owner:0, name: "Fido", color: "brown"})
// Add some data
People.assert({id: 0, name: "Alice"})
People.assert({id: 1, name: "Charles"})
People.assert({id: 2, name: "Helen"})

// Define a new table for the ParentOf Relation
const ParentOf = datalog.newTable<{ parentID: number, childID: number }>({
    parentID: datalog.NumberType,
    childID: datalog.NumberType,
})

ParentOf.assert({parentID: 1, childID: 1})
ParentOf.assert({parentID: 1, childID: 0})
ParentOf.assert({parentID: 2, childID: 0})


// Our query. You can think of this as saying:
// Find me a parentName, parentID, and childID such that
// There is a there is a person named "Alice" and their id is childID
// The parent of childID should be parentID
// and and the name of parentID should be parentName
const Query = datalog.query<{parentName: string, parentID: number, childID: number}>(({parentName, parentID, childID}) => {
  People({name: "Alice", id: childID})
  ParentOf({childID, parentID})
  People({id: parentID, name: parentName})
})

//console.log(Query.view().readAllData())
People.assert({id:3, name: "Jack"})
ParentOf.assert({parentID: 3, childID: 0})
let q = datalog.query<{parentName: string, parentID: number, childID: number}>(({parentName, parentID, childID}) => {
  People({name: "Alice", id: childID})
  ParentOf({childID, parentID})
  People({id: parentID, name: parentName})
})

//console.log(q.view().readAllData())

const b = datalog.query<{parentName: string, parentID: number, childID: number, owner: number, color: string, name:string}>(({parentName, parentID, childID, color, name})=>{
  Dog({owner:childID, color, name})
  ParentOf({childID, parentID})
  People({id: parentID, name: parentName})
})
//console.log(b.view().readAllData())