## Table of Contents
  - [About The Project](#about-the-project)
       - [Motivation](#Motivation)
  - [Getting Started](#getting-started)
      - [Prerequisites](#Prerequisites)
      - [Installation](#Installation)
      - [Examples](#Examples)
  - [Organization](#Organization)
    - [Terms](#Terms)
    - [Architecture](#Architecture)
    - [Components](#Components)
- [Contributing](#Contributing)
- [Resources](#resources)

<!-- about the project -->
## About The Project
Cirrus is a DB Engine that brings together Datalog and essentially logs/streams for SkyDB. It allows you to construct datalog queries to extract data from the facts that are included in the Database. That was alot of coded terminology. Essentially Cirrus provides a way for you to query your data as well as other peoples data in a typed and well structured format. Additionally it utilizes datalog in order to allow you to extract information from the data sets.
### Motivation
The thought here is that SkyDB could benefit from building a database solution that works in line with a streaming architecture. Instead of building mutable data built of less composable items, build immutable atomic data, that can be used to materialize views that represent the current state. Doing this allows for a host of portable applications that can improve the developer experience. 

Simply setting your dataset to be a log stream isn't enough, people need ways to extract value from the data streams. Since business data often mirrors a graph, a future infrastructure leans into this notion to achieve better user query reliability and general data processing performance embracing this see [YedaLog](https://storage.googleapis.com/pub-tools-public-publication-data/pdf/43462.pdf) and [Datomic](https://dataomic.com) 


The goal here is to build a framework, that can allow developers that use skydb to extract value, and to build an extensible knowledge graph across applications, without needing to maintain additional servers. This is a proof of concept implementation and is Experimental

## Getting Started


### Prerequisites

- node v15.x.x or greater.
- npm v6.10.3 or greater.

### Installation

Install via npm package

```bash
npm install -g @createdreamtech/cirrus
```

Then require it into any module.
```js

```
## Examples
[Live React Example](https://siasky.net/EABO8WM06s4wSBbEeB2ssBtV7sxQL1qnpE-3d_yoZAxxhg/)
Example based off the example app that allows you to retrieve someone else's notes created from the example. Github [link](https://github.com/createdreamtech/skydb-example)
## Organization 
```
src
├── actions
│   └── index.ts
├── cirrus
│   └── index.ts
├── index.ts
├── integration
│   └── index.test.ts
├── serialize
│   ├── actions.ts
│   ├── index.ts
│   └── schema.ts
└── storage
    ├── index.ts
    ├── memory.ts
    ├── skydb.ts
    └── storage.ts
```
### Terms
#### Asserts 
These are equivalent to datalog facts. Kind of like database inserts

#### Retractions/Retracts 
These allow you retract a fact, essentially undoing the effect of an fact.

#### AppKey
An application key is just a developer generated public key that they would like to identify their app data by

#### pubKey/origin 
Pubkey generally refers to a user's SkyDB public key, never an application key
         
### Architecture
```
     +-----------------------+                         
     |                       |                         
     |  Datalog Query Engine |                         
     |                       |                         
     +-----------------------+       -                 
                                                    +  
       +------------------+                            
       |  MemoryStorage   |                            
       +------------------+                            
                                                       
     +----------------------+                          
     |                      |                          
     |    SkyDB Storage     |                          
     |                      |                          
     +----------------------+       
```                   
#### Datalog Query Engine
Here the datalog query engine follows closely with datafrog model from the rust borrow checker to deep dive see [here](https://marcopolo.io/code/datafrog-js/). Long and short it works, by linking together facts called asserts in our lib, and does a few things to speed that up.

#### MemoryStorage - Cache
Here Memory storage is used as an alternative store and a cache for SkyDB. Before things are written to skydb they are first written to the cache. this allows us to have smart filters on what we store to the DB.

#### SkyDBStorage - SkyDB interface
The SkyDBStorage is where we construct the local Storage and have the ability to play actions from remote stores. This allows us to integrate changes periodically from other SkyDBs. The cadence is actually set by the application, with their ability to call refresh, which in turn allows the DB. to cycle through it's index of foreign SkyDB application entries. 

                      
### Components
#### Actions
Contains the code to define actions for datalog and the underlying db. These are the fundamental operations that compose views of the database.
##### The actions are: Assert, Retract, NewTable 
 - assert: Asserts a fact, adding data to a table
 - retract: Retracts a fact, canceling data from the table
 - newTable: Creates a new set of Facts unified by a schema
```ts
{
   export interface Action {
    type: ActionType // "assert", "retract", "newTable"
    datum: any,  // Any object data you'd like to store
    schema: any, // Table Schema object 
    tableName: string, // a string name/label for the table in use 
    __origin: string. // origin of the action an identifier tied to public key
}
```
#### Cirrus
Contains the code that encapsulates the database, it is the interface that wraps the datalog query engine to make it useful for SkyDB,
```js
  const db = new Cirrus(new SkyDBStorage(...))
  db.newTable...
```
#### Serialize 
Contains the serialization code for Actions and schemas, which are written to the DB as well, which in theory would allow for dynamic creation of typed data.
#### Storage 
Contains the code that defines what makes a data store it contains, the specific logic for writing to SkyDB. It also provides the ability for users to create their own DB extensions, which allows for application specific customizations to the Storage layer.

## Roadmap

See the [open issues](https://github.com/createdreamtech/cirrus/issues) for a list of proposed features (and known issues).

## Contributing

How to contribute, build and release are outlined in [CONTRIBUTING.md](CONTRIBUTING.md), [BUILDING.md](BUILDING.md) and [RELEASING.md](RELEASING.md) respectively. Commits in this repository follow the [CONVENTIONAL_COMMITS.md](CONVENTIONAL_COMMITS.md) specification.

## License

Apache License 2.0

## Resources


### Special Thanks
[Datalog Primer super Quick](https://x775.net/2019/03/18/Introduction-to-Datalog.html)
[StrangeLoop about Streaming Architectures](https://www.thestrangeloop.com/2019/temporal-databases-for-streaming-architectures.html)
[Datalog definition](https://docs.racket-lang.org/datalog/)
[Datascript a datalog impl with ClojureScript](https://github.com/tonsky/datascript)
[Datafrog in Rust used in borrow checker](https://github.com/frankmcsherry/blog/blob/master/posts/2018-05-19.md)		(Domain Modeling Entity Attribute Value)[https://www.youtube.com/watch?v=oo-7mN9WXTw]
#### Shoutout to and Special thanks to  [Datalog in TS](https://github.com/datalogui/datalog)	
Because of this excellent work I was able to hook in and make a few minor tweaks to be able to have a type safe query engine for Cirrus 									
