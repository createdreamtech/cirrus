
export type Actions = Assert | Retract | NewTable
export type ActionType = "assert" | "retract" | "newTable"
export interface Action {
    type: ActionType 
    datum: any,
    schema: any, 
    tableName: string,
    __origin: string
}
export interface Assert extends Action{
    type: "assert",
} 

export interface Retract extends Action{
    type: "retract",
}

export interface NewTable extends Action{
    type: "newTable",
}
