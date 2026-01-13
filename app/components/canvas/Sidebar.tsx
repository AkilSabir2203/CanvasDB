"use client";

import React, { useState } from 'react';
import { Panel, useReactFlow } from '@xyflow/react';
import { Button } from '@/app/components/ui/Button';
import Modal from '@/app/components/modals/Modal';
import toast from 'react-hot-toast';
import { Input } from '@/app/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/app/components/ui/Select';
import { attributeTypes } from '@/app/libs/constants';
import { SiPrisma } from "react-icons/si";
import { Loader2, Sparkles, Workflow } from "lucide-react";


export default function Sidebar() {
  const { getNodes, getEdges, setNodes } = useReactFlow();


  const nodes = getNodes().filter((n) => n.type === 'entity') as any[];
  const [isOpen, setIsOpen] = useState(false);
  const [schemaText, setSchemaText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

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
    IsId?: boolean;
    list?: boolean;
    updatedat?: boolean;
  } | null>(null);

  const handleGenerateWithLoader = async () => {
    if (isGenerating) return;

    setIsGenerating(true);

    // show loader for 1 second
    await new Promise((res) => setTimeout(res, 1000));

    await handleGenerateSchema();

    setIsGenerating(false);
  };


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

  // AI Sparkles modal state
  const [isSparklesOpen, setIsSparklesOpen] = useState(false);
  const [sparklesPrompt, setSparklesPrompt] = useState('');
  const [sparklesSchema, setSparklesSchema] = useState('');
  const [isSparklesGenerating, setIsSparklesGenerating] = useState(false);

  const handleSparklesGenerate = async () => {
    if (isSparklesGenerating) return;

    if (!sparklesPrompt) {
      toast.error('Please enter a prompt');
      return;
    }

    try {
      setIsSparklesGenerating(true);

      const res = await fetch('/api/groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: sparklesPrompt }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to generate schema');
      }

      const json = await res.json();
      // Display schema exactly as returned (do not modify)
      setSparklesSchema(json.schema ?? '');
    } catch (err: any) {
      console.error(err);
      toast.error('Error generating schema: ' + err.message);
    } finally {
      setIsSparklesGenerating(false);
    }
  };

  const closeSparklesModal = () => {
    setIsSparklesOpen(false);
    // clear generated schema so modal shows fresh state on reopen
    setSparklesSchema('');
    setIsSparklesGenerating(false);
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
      list: attr?.constraint?.list || attr?.list || false,
      unique: attr?.constraint?.unique || attr?.constraint?.type === 'unique' || false,
      updatedat: attr?.constraint?.updatedat || attr?.constraint?.type === 'updatedat' || false,
      IsId: attr?.constraint?.IsId || attr?.constraint?.type === 'Is Id' || false,
    });

    setIsEditOpen(true);
  }

  function handleCancelEdit() {
    setIsEditOpen(false);
    setEditing(null);
  }

  function handleUpdateField() {
    if (!editing || editing.nodeId === undefined || editing.attrIndex === undefined) return;

    const { nodeId, attrIndex, name, type, defaultValue, required, list, unique, updatedat, IsId } = editing;

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
            list: list || undefined,
            unique: unique || undefined,
            updatedat: updatedat || undefined,
            IsId: IsId || undefined,
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
        <Select value={editing?.type} defaultValue={attributeTypes[0]} onValueChange={(v) => setEditing((s) => s ? { ...s, type: v, updatedat: v === 'DateTime' ? s.updatedat : false, } : s)}>
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
          <input type="checkbox" checked={!!editing?.list} onChange={(e) => setEditing((s) => s ? { ...s, list: e.target.checked } : s)} />
          <span className="text-sm">List</span>
        </label>

        <label className="flex items-center gap-2">
          <input type="checkbox" checked={!!editing?.unique} onChange={(e) => setEditing((s) => s ? { ...s, unique: e.target.checked } : s)} />
          <span className="text-sm">Unique</span>
        </label>

        {editing?.type === 'DateTime' && (
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={!!editing?.updatedat} onChange={(e) => setEditing((s) => s ? { ...s, updatedat: e.target.checked } : s)} />
          <span className="text-sm">UpdatedAt</span>
        </label>)}

        <label className="flex items-center gap-2">
          <input type="checkbox" checked={!!editing?.IsId} onChange={(e) => setEditing((s) => s ? { ...s, IsId: e.target.checked } : s)} />
          <span className="text-sm">Is Id</span>
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
                      <div className="text-xs text-neutral-400">{attr?.constraint?.unique ? 'Unique' : ''}{attr?.constraint?.required ? ' • Required' : ''}{attr?.constraint?.value ? ` • default: ${attr.constraint.value}` : ''}{attr?.constraint?.IsId ? '• ID' : ''}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <Button
            // onClick={handleVisualize}
            // disabled={isvisualizing}
            className="w-full text-white bg-prismaTeal hover:bg-prismadeepTeal gap-3 flex items-center justify-center mb-2"
          >
        
            Visualize Schema
            <Workflow size={18} />
          </Button>

          <div className="mt-auto flex items-center gap-2">
            <Button
              onClick={handleGenerateWithLoader}
              disabled={isGenerating}
              className="w-full text-white bg-prismaTeal hover:bg-prismadeepTeal gap-3 flex items-center justify-center"
            >
              {isGenerating ? "Generating..." : "Generate Schema"}

              {isGenerating ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <SiPrisma size={18} />
              )}
            </Button>
            <Button
              onClick={() => setIsSparklesOpen(true)}
              className="
              relative p-3 text-white
              bg-gradient-to-r from-purple-500 to-pink-500
              before:absolute before:inset-0
              before:rounded-md
              before:bg-gradient-to-r before:from-purple-400 before:to-pink-400
              before:blur-lg before:opacity-0
              hover:before:opacity-70
              transition
            "
            >
              <Sparkles size={18} className="relative z-10"/>
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
        body={<div className="flex flex-col gap-2"> <textarea readOnly value={schemaText} className="w-full h-80 font-mono text-sm p-2 rounded border dark:bg-neutral-700 dark:text-white" /> <div className="text-xs text-neutral-500">You can copy the schema or close this preview.</div> </div>}
      />

      <Modal
        isOpen={isSparklesOpen}
        onClose={closeSparklesModal}
        onSubmit={handleSparklesGenerate}
        title="Prisma AI"
        actionLabel={isSparklesGenerating ? 'Generating...' : 'Generate'}
        disabled={isSparklesGenerating}
        secondaryAction={closeSparklesModal}
        secondaryActionLabel="Close"
        body={
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-2">
              <label className="text-sm font-medium">Prompt</label>
              <textarea
                value={sparklesPrompt}
                onChange={(e) => setSparklesPrompt(e.target.value)}
                placeholder="Enter a short description of the desired Prisma schema"
                className="w-full h-28 p-2 rounded border"
              />
            </div>

            <div className="grid grid-cols-1 gap-2">
              <label className="text-sm font-medium">Generated Prisma Schema</label>
              <textarea readOnly value={sparklesSchema} className="w-full h-64 font-mono text-sm p-2 rounded border dark:bg-neutral-700 dark:text-white" />
            </div>
          </div>
        }
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
