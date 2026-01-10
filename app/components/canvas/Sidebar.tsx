"use client";

import React, { useState } from 'react';
import { Panel, useReactFlow } from '@xyflow/react';
import { Button } from '@/app/components/ui/Button';
import Modal from '@/app/components/modals/Modal';
import toast from 'react-hot-toast';
import { Input } from '@/app/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/app/components/ui/Select';
import { attributeTypes } from '@/app/libs/constants';

export default function Sidebar() {
  const { getNodes, getEdges, setNodes } = useReactFlow();

  const nodes = getNodes().filter((n) => n.type === 'entity') as any[];
  const [isOpen, setIsOpen] = useState(false);
  const [schemaText, setSchemaText] = useState('');

  // Edit field modal state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editing, setEditing] = useState<{
    nodeId?: string;
    attrIndex?: number;
    name?: string;
    type?: string;
    defaultValue?: string;
    required?: boolean;
    unique?: boolean;
  } | null>(null);

  const handleGenerateSchema = async () => {
    try {
      const payload = {
        nodes: nodes.map((n) => ({ id: n.id, name: (n.data as any).name, attributes: (n.data as any).attributes })),
        edges: getEdges().map((e) => ({ source: e.source, target: e.target, type: (e.data as any)?.type })),
      };

      const res = await fetch('/api/generate-schema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to generate schema');
      }

      const json = await res.json();
      setSchemaText(json.schema || '');
      setIsOpen(true);
    } catch (err: any) {
      console.error(err);
      toast.error('Error generating schema: ' + err.message);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(schemaText);
      toast.success('Schema copied to clipboard');
    } catch (err) {
      toast.error('Copy failed');
    }
  };

  function openEditModal(nodeId: string, attrIndex: number) {
    const node = getNodes().find((n) => n.id === nodeId);
    const attr = ((node?.data?.attributes as any[]) || [])[attrIndex] || {};

    setEditing({
      nodeId,
      attrIndex,
      name: attr.name || '',
      type: attr.type || attributeTypes[0],
      defaultValue: attr?.constraint?.value || attr?.default || '',
      required: attr?.constraint?.required || attr?.required || false,
      unique: attr?.constraint?.unique || attr?.constraint?.type === 'unique' || false,
    });

    setIsEditOpen(true);
  }

  function handleCancelEdit() {
    setIsEditOpen(false);
    setEditing(null);
  }

  function handleUpdateField() {
    if (!editing || editing.nodeId === undefined || editing.attrIndex === undefined) return;

    const { nodeId, attrIndex, name, type, defaultValue, required, unique } = editing;

    setNodes((prev) =>
      prev.map((n) => {
        if (n.id !== nodeId) return n;
        const attrs = (((n.data || {}).attributes as any[]) || []).slice();
        const old = attrs[attrIndex] || {};
        attrs[attrIndex] = {
          ...old,
          name: name,
          type: type,
          // store constraint as an object that can contain multiple flags
          constraint: {
            ...(old.constraint || {}),
            value: defaultValue || undefined,
            required: required || undefined,
            unique: unique || undefined,
          },
        };

        return { ...n, data: { ...(n.data || {}), attributes: attrs } };
      })
    );

    setIsEditOpen(false);
    setEditing(null);
  }

  const modalBody = (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-2">
        <label className="text-sm font-medium">Name</label>
        <Input value={editing?.name || ''} onChange={(e) => setEditing((s) => s ? { ...s, name: e.target.value } : s)} />
      </div>

      <div className="grid grid-cols-1 gap-2">
        <label className="text-sm font-medium">Type</label>
        <Select value={editing?.type} defaultValue={attributeTypes[0]} onValueChange={(v) => setEditing((s) => s ? { ...s, type: v } : s)}>
          <SelectTrigger>
            {editing?.type}
          </SelectTrigger>
          <SelectContent>
            {attributeTypes.map((t, idx) => (
              <SelectItem key={`attr-type-${idx}`} value={String(t)}>{String(t)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-2">
        <label className="text-sm font-medium">Default Value</label>
        {editing?.type === 'DateTime' ? (
          <Select value={editing?.defaultValue ?? 'none'} defaultValue={'none'} onValueChange={(v) => setEditing((s) => s ? { ...s, defaultValue: v === 'none' ? '' : v } : s)}>
            <SelectTrigger>{editing?.defaultValue ? editing?.defaultValue : 'None'}</SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="now()">now()</SelectItem>
              <SelectItem value="@updatedAt">@updatedAt</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <Input value={editing?.defaultValue || ''} onChange={(e) => setEditing((s) => s ? { ...s, defaultValue: e.target.value } : s)} placeholder={editing?.type === 'Int' ? 'Enter a number' : 'Enter default value'} />
        )}
      </div>

      <div className="flex gap-4 items-center">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={!!editing?.required} onChange={(e) => setEditing((s) => s ? { ...s, required: e.target.checked } : s)} />
          <span className="text-sm">Required</span>
        </label>

        <label className="flex items-center gap-2">
          <input type="checkbox" checked={!!editing?.unique} onChange={(e) => setEditing((s) => s ? { ...s, unique: e.target.checked } : s)} />
          <span className="text-sm">Unique</span>
        </label>

        <label className="flex items-center gap-2">
          <input type="checkbox" checked={!!editing?.required} onChange={(e) => setEditing((s) => s ? { ...s, required: e.target.checked } : s)} />
          <span className="text-sm">Is Id</span>
        </label>

        <label className="flex items-center gap-2">
          <input type="checkbox" checked={!!editing?.required} onChange={(e) => setEditing((s) => s ? { ...s, required: e.target.checked } : s)} />
          <span className="text-sm">List</span>
        </label>
      </div>
    </div>
  );

  return (
    <>
      <Panel position="top-left">
        <div className="w-[36.5vh] h-[96vh] max-h-[78vh] bg-neutral-800 text-white p-4 mt-20 rounded-md flex flex-col">
          <h3 className="text-lg font-semibold mb-2">Models</h3>
          <div className="flex-1 overflow-auto mb-4">
            {nodes.length === 0 && <div className="text-sm text-neutral-300">No models yet. Add entities from the toolbar.</div>}
            {nodes.map((node) => (
              <div key={node.id} className="bg-neutral-700 rounded p-2 mb-2">
                <div className="font-medium">{(node.data as any).name || 'Untitled'}</div>
                <div className="text-sm text-neutral-300 mt-1">
                  {(((node.data as any).attributes || []) as any[]).map((attr: any, i: number) => (
                    <div
                      key={i}
                      className='hover:bg-neutral-800 cursor-pointer flex justify-between gap-2 items-center p-1 rounded'
                      onClick={() => openEditModal(node.id, i)}
                    >
                      <div className="truncate">{attr.name || 'field'}: {String(attr.type)}{!(attr?.constraint?.required || attr?.required) ? '?' : ''}</div>
                      <div className="text-xs text-neutral-400">{attr?.constraint?.unique ? 'Unique' : ''}{attr?.constraint?.required ? ' • Required' : ''}{attr?.constraint?.value ? ` • default: ${attr.constraint.value}` : ''}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-auto">
            <Button onClick={handleGenerateSchema} className="w-full text-white bg-prismaTeal hover:bg-prismadeepTeal">
              Generate Schema
            </Button>
          </div>
        </div>
      </Panel>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSubmit={() => setIsOpen(false)}
        title="Generated Prisma Schema"
        actionLabel="Close"
        secondaryAction={copyToClipboard}
        secondaryActionLabel="Copy"
        body={<div className="flex flex-col gap-2"> <textarea readOnly value={schemaText} className="w-full h-80 font-mono text-sm p-2 rounded border" /> <div className="text-xs text-neutral-500">You can copy the schema or close this preview.</div> </div>}
      />

      <Modal
        isOpen={isEditOpen}
        onClose={handleCancelEdit}
        onSubmit={handleUpdateField}
        title="Edit Field"
        actionLabel="Update Field"
        secondaryAction={handleCancelEdit}
        secondaryActionLabel="Cancel"
        body={modalBody}
      />
    </>
  );
}
