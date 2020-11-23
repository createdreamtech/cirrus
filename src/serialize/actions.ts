import * as actions from '../actions';
import { Action, ActionType, Actions} from "../actions"
import * as serialize from './schema'

export interface SerializedAction {
    type: ActionType,
    tableName: string,
    datum: object,
    schema: serialize.JsonTableSchema,
    __origin: string

}
export function actionToJSON( action :actions.Actions): SerializedAction{
    const {type, tableName, datum, __origin} = action
    const schema = serialize.fromDatalogSchema(action.schema)
    return {type, tableName, datum, schema, __origin}
}

export function actionFromJSON(action: SerializedAction): Actions{
    const schema=serialize.toDatalogSchema(action.schema)
    const {tableName, type, datum, __origin} =action
    return { tableName, type, datum, schema, __origin }
}
