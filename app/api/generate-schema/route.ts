import { NextResponse } from 'next/server';

function capitalize(name: string) {
  if (!name) return 'Model';
  return name[0].toUpperCase() + name.slice(1);
}
function uncapitalize(name: string) {
  if (!name) return 'model';
  return name[0].toLowerCase() + name.slice(1);
}
function pluralize(name: string) {
  if (!name) return 'items';
  return name.endsWith('s') ? name + 'es' : name + 's';
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const nodes: Array<any> = body.nodes || [];
    const edges: Array<any> = body.edges || [];

    const models: Record<string, { name: string; fields: string[] }> = {};

    // Initialize models from nodes
    for (const n of nodes) {
      const modelName = capitalize(String(n.name || n.id || 'Model'));
      models[n.id] = { name: modelName, fields: [] };

      // add id field
      models[n.id].fields.push('id String @id @default(auto()) @map("_id") @db.ObjectId');

      // attributes
      for (const attr of (n.attributes || [])) {
        const fieldName = attr.name || 'field';
        // Ensure we work with the Prisma type strings (like String, Int, DateTime, etc.)
        let fieldType = String(attr.type || 'String');

        // LIST handling
        const isList = attr?.constraint?.list === true || attr?.list === true;

        if (isList) {
          fieldType = `${fieldType}[]`;
        }

        // optional marker (NOT allowed for lists)
        const isRequired = Boolean(attr?.constraint?.required === true || attr?.required === true);
        const optionalMarker = isList ? '' : (isRequired ? '' : '?');

        // Handle default values and special DateTime @updatedAt
        let decorators: string[] = [];
        
        const defVal = attr?.constraint?.value ?? attr?.default;

        if (defVal !== undefined && defVal !== null && String(defVal).length > 0) {
          const dv = String(defVal).trim();
          if (/^now\(\)$/.test(dv)) {
            decorators.push('@default(now())');
          } else if (/^Boolean$/i.test(fieldType) && /^true|false$/i.test(dv)) {
            decorators.push(`@default(${dv.toLowerCase()})`);
          } else if (/^Int$|^BigInt$|^Float$|^Decimal$/i.test(fieldType) && /^-?\d+$/.test(dv)) {
            decorators.push(`@default(${dv})`);
          } else if (fieldType.endsWith('[]') && /^\[.*\]$/.test(dv)) {
            // array default, keep as-is
            decorators.push(`@default(${dv})`);
          } else if (!/^DateTime$/i.test(fieldType)) {
            // assume string default for non-DateTime types
            decorators.push(`@default(\"${dv.replace(/\"/g, '\\\"')}\")`);
          }
        }

        // unique
        if (attr?.constraint?.unique === true || attr?.unique === true || attr?.constraint?.type === 'unique') {
          decorators.push('@unique');
        }

        // updatedat
        if (attr?.constraint?.updatedat === true || attr?.updatedat === true || attr?.constraint?.type === 'updatedat') {
          decorators.push('@updatedAt');
        }

        //Is Id
        if (attr?.constraint?.IsId === true || attr?.IsId === true || attr?.constraint?.type === 'Is Id') {
          decorators.push('@db.ObjectId');
        }

        // join decorators
        const decoratorStr = decorators.length > 0 ? ' ' + decorators.join(' ') : '';

        models[n.id].fields.push(`  ${fieldName} ${fieldType}${optionalMarker}${decoratorStr}`);
      }
    }

    // Handle basic 1-m relations
    for (const e of edges) {
      const edgeType = e.type || '';
      const source = e.source;
      const target = e.target;
      if (!models[source] || !models[target]) continue;

      const sourceModel = models[source].name;
      const targetModel = models[target].name;
      const sourceFieldPlural = pluralize(targetModel.toLowerCase());
      const sourceField = `  ${sourceFieldPlural} ${targetModel}[]`;

      const targetFieldId = `${uncapitalize(sourceModel)}Id`;
      const targetFieldRelation = `  ${uncapitalize(sourceModel)} ${sourceModel} @relation(fields: [${targetFieldId}], references: [id])`;
      const targetFieldIdLine = `  ${targetFieldId} String`;

      if (edgeType === '1-m') {
        // add to source model a list field (one side)
        if (!models[source].fields.includes(sourceField)) models[source].fields.push(sourceField);

        // add to target model a relation field + foreign key
        if (!models[target].fields.includes(targetFieldIdLine)) models[target].fields.push(targetFieldIdLine);
        if (!models[target].fields.includes(targetFieldRelation)) models[target].fields.push(targetFieldRelation);
      } else if (edgeType === '1-1') {
        // simple 1-1: add optional fields on both sides
        const aField = `  ${uncapitalize(targetModel)} ${targetModel}?`;
        const aFieldId = `  ${uncapitalize(targetModel)}Id Int?`;
        if (!models[source].fields.includes(aFieldId)) models[source].fields.push(aFieldId);
        if (!models[source].fields.includes(aField)) models[source].fields.push(aField);

        const bField = `  ${uncapitalize(sourceModel)} ${sourceModel}?`;
        if (!models[target].fields.includes(bField)) models[target].fields.push(bField);
      } else if (edgeType === 'm-n' || edgeType === 'm-1') {
        // add basic many relation placeholders
        const aField = `  ${pluralize(targetModel.toLowerCase())} ${targetModel}[]`;
        const bField = `  ${pluralize(sourceModel.toLowerCase())} ${sourceModel}[]`;
        if (!models[source].fields.includes(aField)) models[source].fields.push(aField);
        if (!models[target].fields.includes(bField)) models[target].fields.push(bField);
      } else {
        // unknown relation type: add a comment
        models[source].fields.push(`  // relation to ${targetModel} (${edgeType || 'unknown'})`);
      }
    }

    // Build schema text
  const header = `generator client {
  provider = "prisma-client-js"
  }

  datasource db {
    provider = "mongodb"
    url      = env("DATABASE_URL")
  }

  `;

      let bodyText = '';
      for (const id of Object.keys(models)) {
        const m = models[id];
        bodyText += `model ${m.name} {
  `;
        bodyText += m.fields.join('\n');
        bodyText += `
  }

  `;
      }

      const schemaText = header + bodyText;

      return NextResponse.json({ schema: schemaText });
    } catch (err: any) {
      console.error(err);
      return new Response(String(err?.message || 'error'), { status: 500 });
    }
  }
