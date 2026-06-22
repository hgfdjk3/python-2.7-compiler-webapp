import React, { useState, useMemo } from 'react';
import { Box, ActionIcon, Group, useMantineTheme, Modal, Button, Text, Textarea, TextInput } from '@mantine/core';
import { useParams, useNavigate } from 'react-router-dom';
import { KnowledgeGraphCore } from '../components/Project/KnowledgeGraph/KnowledgeGraphCore';
import { GraphToolbar } from '../components/Project/KnowledgeGraph/Toolbar/GraphToolbar';
import { GraphSearchWidget } from '../components/Project/KnowledgeGraph/Toolbar/GraphSearchWidget';
import { NodeInfoPanel } from '../components/Project/KnowledgeGraph/InfoPanel/NodeInfoPanel';
import { CreateConnectionModal } from '../components/Project/KnowledgeGraph/InfoPanel/CreateConnectionModal';
import { IconArrowLeft, IconFileText } from '@tabler/icons-react';
import { useLibraryEntities, useDeleteEntity, useExtractDump, useRethinkConnections } from '../api/library';
import { AnimatePresence } from 'motion/react';

export const KnowledgeGraphPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const theme = useMantineTheme();
  
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const { data: entities } = useLibraryEntities(projectId || '');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const deleteEntityMutation = useDeleteEntity(projectId || '');
  
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

  const [extractModalOpen, setExtractModalOpen] = useState(false);
  const [dumpText, setDumpText] = useState('');
  const extractDumpMutation = useExtractDump(projectId || '');
  
  const [rethinkModalOpen, setRethinkModalOpen] = useState(false);
  const [rethinkTopic, setRethinkTopic] = useState('');
  const rethinkConnectionsMutation = useRethinkConnections(projectId || '');

  const typeColors: Record<string, string> = {
    document: theme.colors.blue[6],
    entity: theme.colors.grape[6],
    concept: theme.colors.teal[6],
    person: theme.colors.orange[6],
    organization: theme.colors.indigo[6],
    location: theme.colors.red[6],
    event: theme.colors.yellow[6],
    action: theme.colors.green[6],
    default: theme.colors.gray[6]
  };

  const handleNodeClick = (nodeId: string, event: MouseEvent) => {
    if (event.shiftKey || event.ctrlKey || event.metaKey) {
      setSelectedNodeIds(prev => 
        prev.includes(nodeId) 
          ? prev.filter(id => id !== nodeId) 
          : [...prev, nodeId]
      );
    } else {
      setSelectedNodeIds(prev => 
        prev.length === 1 && prev[0] === nodeId ? [] : [nodeId]
      );
    }
    setFocusedNodeId(null); // Clear manual focus on click
  };

  const handleBackgroundClick = () => {
    setSelectedNodeIds([]);
    setFocusedNodeId(null);
  };

  const handleResultClick = (entityId: string) => {
    setSelectedNodeIds([entityId]);
    setFocusedNodeId(entityId);
  };

  const availableTypes = useMemo(() => {
    if (!entities) return [];
    const types = new Set(entities.map(e => e.type));
    return Array.from(types);
  }, [entities]);

  const handleToggleType = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const highlightedNodeIds = useMemo(() => {
    if (!entities) return undefined;
    if (!searchQuery && selectedTypes.length === 0) return undefined; // undefined = no active highlights

    const query = searchQuery.toLowerCase();
    
    return entities
      .filter(e => {
        const label = (e.current_state?.title || e.proposed_state?.title || e.type).toLowerCase();
        const matchesSearch = query ? label.includes(query) : true;
        const matchesType = selectedTypes.length > 0 ? selectedTypes.includes(e.type) : true;
        return matchesSearch && matchesType;
      })
      .map(e => e.id);
  }, [entities, searchQuery, selectedTypes]);

  const handleEdit = () => console.log('Edit entity', selectedNodeIds[0]);
  const handleConnect = () => setIsConnectModalOpen(true);
  const handleMerge = () => console.log('Merge entities', selectedNodeIds);
  
  const handleDelete = () => setDeleteModalOpen(true);

  const confirmDelete = () => {
    selectedNodeIds.forEach(id => {
      deleteEntityMutation.mutate(id);
    });
    setSelectedNodeIds([]);
    setDeleteModalOpen(false);
  };

  const handleRethinkConnections = () => {
    setRethinkTopic('');
    setRethinkModalOpen(true);
  };

  return (
    <Box style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <Box style={{ position: 'absolute', top: 20, left: 20, zIndex: 10 }}>
        <ActionIcon variant="light" color="gray" size="xl" radius="xl" onClick={() => navigate(`/project/${projectId}`)}>
          <IconArrowLeft size={24} />
        </ActionIcon>
      </Box>

      <Group gap="sm" style={{ position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
        <GraphToolbar
          selectedNodeIds={selectedNodeIds}
          onEdit={handleEdit}
          onConnect={handleConnect}
          onMerge={handleMerge}
          onDelete={handleDelete}
          onExtractText={() => setExtractModalOpen(true)}
          onRethinkConnections={handleRethinkConnections}
        />
      </Group>

      <GraphSearchWidget
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        availableTypes={availableTypes}
        selectedTypes={selectedTypes}
        onToggleType={handleToggleType}
        entities={entities || []}
        typeColors={typeColors}
        onResultClick={handleResultClick}
      />

      <AnimatePresence>
        {selectedNodeIds.length === 1 && entities && (
          <NodeInfoPanel key="info-panel" entity={entities.find(e => e.id === selectedNodeIds[0]) || null} />
        )}
      </AnimatePresence>

      {selectedNodeIds.length > 0 && (
        <CreateConnectionModal 
          projectId={projectId || ''}
          sourceEntityId={selectedNodeIds[0]}
          targetEntityId={selectedNodeIds.length > 1 ? selectedNodeIds[1] : undefined}
          opened={isConnectModalOpen}
          onClose={() => setIsConnectModalOpen(false)}
        />
      )}

      <Box style={{ flex: 1, minHeight: 0 }}>
        <KnowledgeGraphCore 
          projectId={projectId || ''} 
          interactive={true} 
          selectedNodeIds={selectedNodeIds}
          highlightedNodeIds={highlightedNodeIds}
          focusedNodeId={focusedNodeId}
          onNodeClick={handleNodeClick}
          onBackgroundClick={handleBackgroundClick}
        />
      </Box>

      <Modal opened={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Confirm Deletion" centered>
        <Text size="sm" mb="md">
          Are you sure you want to delete {selectedNodeIds.length} selected entit{selectedNodeIds.length === 1 ? 'y' : 'ies'}? This action cannot be undone.
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
          <Button color="red" onClick={confirmDelete} loading={deleteEntityMutation.isPending}>Delete</Button>
        </Group>
      </Modal>

      <Modal opened={extractModalOpen} onClose={() => setExtractModalOpen(false)} title="Extract Entities from Text Dump" centered size="lg">
        <Text size="sm" mb="md" color="dimmed">
          Paste a large block of text below. The AI will analyze it in chunks and propose new entities or relationships for your knowledge graph.
        </Text>
        <Textarea
          placeholder="Paste large text dump here..."
          minRows={10}
          maxRows={20}
          autosize
          value={dumpText}
          onChange={(e) => setDumpText(e.currentTarget.value)}
          mb="md"
        />
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setExtractModalOpen(false)}>Cancel</Button>
          <Button 
            onClick={() => {
              extractDumpMutation.mutate(dumpText, {
                onSuccess: () => {
                  setExtractModalOpen(false);
                  setDumpText('');
                }
              });
            }} 
            loading={extractDumpMutation.isPending}
            disabled={!dumpText.trim()}
          >
            Extract
          </Button>
        </Group>
      </Modal>

      <Modal opened={rethinkModalOpen} onClose={() => setRethinkModalOpen(false)} title="Rethink Connections" centered>
        <Text size="sm" mb="md" color="dimmed">
          Specify an optional topic to guide the connection discovery process. Leave blank for general discovery.
        </Text>
        <TextInput
          placeholder="e.g. funding, acquisitions, technical dependencies..."
          value={rethinkTopic}
          onChange={(e) => setRethinkTopic(e.currentTarget.value)}
          mb="md"
        />
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setRethinkModalOpen(false)}>Cancel</Button>
          <Button 
            onClick={() => {
              rethinkConnectionsMutation.mutate({ 
                entities_ids: selectedNodeIds.length > 0 ? selectedNodeIds : undefined,
                topic: rethinkTopic.trim() || undefined
              }, {
                onSuccess: () => {
                  setRethinkModalOpen(false);
                  setRethinkTopic('');
                }
              });
            }} 
            loading={rethinkConnectionsMutation.isPending}
          >
            Rethink
          </Button>
        </Group>
      </Modal>
    </Box>
  );
};
