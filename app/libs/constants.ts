import { Attribute, Relation } from "./types";
import { GenerateFormData } from "./types";

export const placeholderData: GenerateFormData = 
{
    "name": "Project01",
    "description": "Project01 description",
    "auth": true,
    "entities": [
        {
            "name": "User",
            "attributes": [
                {
                    "name": "email",
                    "type": "String",
                    "constraint": {
                        "type": "unique"
                    }
                },
                {
                    "name": "password",
                    "type": "String"
                },
                {
                    "name": "createdAt",
                    "type": "String"
                }
            ]
        },
        {
            "name": "Task",
            "attributes": [
                {
                    "name": "description",
                    "type": "String"
                },
                {
                    "name": "title",
                    "type": "String"
                },
                {
                    "name": "sequence",
                    "type": "Int"
                }
            ]
        }
    ],
    "relations": [
        {
            "from": "User",
            "to": "Task",
            "type": "1-m",
        }
    ]
}
export const attributeTypes: Attribute[] = ["String", "Boolean", "Int", "BigInt", "Float", "Decimal", "Json", "Bytes", "DateTime"];
export const relationTypes: Relation["type"][] = ["1-1", "m-n", "1-m", "m-1"];