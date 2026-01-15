"use client"
import { addEdge, Background, BackgroundVariant, MiniMap, ReactFlow, useEdgesState, useNodesState, type Node, type Edge } from '@xyflow/react';

import '@xyflow/react/dist/style.css';
import React, { useCallback } from 'react';
import EntityNode, { EntityNodeProps } from './EntityNode';
import RelationEdge, { RelationEdgeProps } from './RelationEdge';
import Toolbar from './Toolbar';
import DownloadButton from './DownloadButton';
import  Sidebar  from "./Sidebar";
import CreateSchemaModal from '@/app/components/modals/CreateSchemaModal';
import SaveSchemaModal from '@/app/components/modals/SaveSchemaModal';
import OpenDocumentModal from '@/app/components/modals/OpenDocumentModal';
import useSaveSchemaModal from '@/app/hooks/useSaveSchemaModal';
import { useAutosave } from '@/app/hooks/useAutosave';
import useSaveSchemaStore from '@/app/hooks/useSaveSchemaStore';

const initialNodes: EntityNodeProps[] = [
    { id: '1', position: { x: 410, y:100 }, data: { name: '', attributes: [{ name: "", type: "String" }], open: true }, type: 'entity' },
    { id: '2', position: { x: 850, y: 450 }, data: { name: '', attributes: [{ name: "", type: "String" }], open: false }, type: 'entity' },
];
const initialEdges: RelationEdgeProps[] = [{ id: 'e1-2', source: '1', target: '2', type: "relation", data: { type: "1-m" } }];

import useCanvasStore from '@/app/hooks/useCanvasStore';

const edgeTypes = {
    'relation': RelationEdge
};

const nodeTypes = {
    'entity': EntityNode,
};

export default function ErdBoard() {
    const canvasStore = useCanvasStore();
    const saveSchemaModal = useSaveSchemaModal();
    const { currentSchemaId } = useSaveSchemaStore();

    // Read persisted state directly to determine if we should restore saved canvas
    let persistedNodes: EntityNodeProps[] | undefined = undefined;
    let persistedEdges: RelationEdgeProps[] | undefined = undefined;

    if (typeof window !== 'undefined') {
        const raw = localStorage.getItem('canvas-storage-v1');
        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                const s = parsed.state ?? parsed;
                if (Array.isArray(s.nodes)) persistedNodes = s.nodes as EntityNodeProps[];
                if (Array.isArray(s.edges)) persistedEdges = s.edges as RelationEdgeProps[];
            } catch (e) {
                // ignore parse errors
            }
        }
    }

    const [nodes, setNodes, onNodesChange] = useNodesState(persistedNodes ?? initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(persistedEdges ?? initialEdges);

    // Initialize autosave with nodes and edges - DISABLED, users must save manually
    useAutosave(nodes, edges, {
        enabled: false, // Autosave disabled - manual save only
        debounceMs: 3000,
    });

    // Sync react-flow changes into the persisted store
    React.useEffect(() => {
        canvasStore.setNodes(nodes);
    }, [nodes]);

    React.useEffect(() => {
        canvasStore.setEdges(edges);
    }, [edges]);
    const onConnect = useCallback(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (params: any) => setEdges((eds) => addEdge({ ...params, type: "relation", data: { type: "1-m" } }, eds)),
        [setEdges],
    )

    const handleSchemaCreate = useCallback((newNodes: any[], newEdges: any[]) => {
        setNodes(newNodes);
        setEdges(newEdges);
    }, [setNodes, setEdges]);

    const handleLoadSchema = useCallback((newNodes: Node[], newEdges: Edge[]) => {
        setNodes(newNodes as any);
        setEdges(newEdges as any);
    }, [setNodes, setEdges]);

    return (
        <div className='relative w-full grow h-[100vh] rounded'>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                minZoom={0.1}
            >
                <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
                <Sidebar />
                <DownloadButton />
                <Toolbar />
                <MiniMap />
            </ReactFlow>
            <CreateSchemaModal onSchemaCreate={handleSchemaCreate} />
            <SaveSchemaModal 
                isOpen={saveSchemaModal.isOpen} 
                onClose={saveSchemaModal.onClose}
                nodes={nodes}
                edges={edges}
                onLoadSchema={handleLoadSchema}
            />
            <OpenDocumentModal onLoadSchema={handleLoadSchema} />
        </div>
    )
}