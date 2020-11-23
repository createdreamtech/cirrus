import type { TableSchema, TypeValidator } from "@datalogui/datalog";
import * as datalog from "@datalogui/datalog";

//assumes single level data 

type JSONTypes = "array" | "number" | "string" | "object" | "boolean"
export interface JsonTableSchema {
    [key: string]: {
        type: JSONTypes 
    }
}

// TODO add proper type checking for table schemas
export const toDatalogSchema = (jsonBasedSchema: JsonTableSchema): TableSchema<any> => {

    let schema: any = {};
    Object.keys(jsonBasedSchema).forEach((k: string) => {
        switch (jsonBasedSchema[k].type) {
            case "array":
                schema[k] = datalog.ArrayType;
                break;
            case "string":
                schema[k] = datalog.StringType;
                break;
            case "number":
                schema[k] = datalog.NumberType;
                break;
            case "object":
                schema[k] = datalog.ObjectType;
                break;
            case "boolean":
                schema[k] = datalog.BoolType;
                break;
        }

    })
    return schema;


}

// TODO add proper type checking for table schemas
export const fromDatalogSchema = <T>(schema: TableSchema<T>): JsonTableSchema => {

    const jsonSchema: JsonTableSchema = {}
    Object.keys(schema).forEach((k)=>{
        switch(schema[k as keyof T].typeName){
            case "string":
                jsonSchema[k] = {type: "string"}
                break;
            case "number":
                jsonSchema[k] = {type: "number"}
                break;
            case "boolean":
                jsonSchema[k] = {type: "boolean"}
                break;
            case "object":
                if(schema[k as keyof T].validate([])){
                    jsonSchema[k] = {type: "array"}
                }else {
                    jsonSchema[k] = {type: "object"}
                }
        }
            
    })
    return jsonSchema
}