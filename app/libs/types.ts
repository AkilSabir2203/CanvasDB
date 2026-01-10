export type Attribute = "String" | "Boolean" | "Int" | "BigInt" | "Float" | "Decimal" | "Json" | "Bytes" | "DateTime" | 'String[]' | 'Boolean[]' | 'Int[]' | 'BigInt[]' | 'Float[]' | 'Decimal[]' | 'Json[]' | 'Bytes[]' | 'DateTime[]';
export type ConstraintType = "required" | "unique" | "optional" | "default";
export interface Entity {
  name: string;
  attributes: Array<{ name: string; type: Attribute, constraint?: {value?:string, type:ConstraintType }}>;
}

export interface Relation {
  from: string;
  to: string;
  type: "1-1" | "1-m" | "m-1" | "m-n";
}
export interface GenerateFormData {
  name: string;
  description?: string;
  entities: Entity[];
  relations: Relation[];
  auth: boolean;
}