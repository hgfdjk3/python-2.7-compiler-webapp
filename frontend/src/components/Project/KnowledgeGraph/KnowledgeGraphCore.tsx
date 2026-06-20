import React, { useEffect, useMemo, useRef } from 'react';
import { Box, useMantineTheme } from '@mantine/core';
import { useElementSize } from '@mantine/hooks';
import ForceGraph from 'force-graph';
import { useLibraryEntities } from '../../../api/library';

interface KnowledgeGraphCoreProps {
  projectId: string;
  interactive?: boolean;
  selectedNodeIds?: string[];
  highlightedNodeIds?: string[];
  focusedNodeId?: string | null;
  onNodeClick?: (nodeId: string, event: MouseEvent) => void;
  onBackgroundClick?: (event: MouseEvent) => void;
}

export const KnowledgeGraphCore: React.FC<KnowledgeGraphCoreProps> = ({
  projectId,
  interactive = true,
  selectedNodeIds = [],
  highlightedNodeIds,
  focusedNodeId,
  onNodeClick,
  onBackgroundClick
}) => {
  const theme = useMantineTheme();
  const { data: entities } = useLibraryEntities(projectId);
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);
  const { ref: viewportRef, width, height } = useElementSize();

  const isDarkMode = document.documentElement.getAttribute('data-mantine-color-scheme') === 'dark';

  // Use refs for callbacks and dynamic state so they can be accessed inside canvas without re-registering
  const selectedNodeIdsRef = useRef(selectedNodeIds);
  selectedNodeIdsRef.current = selectedNodeIds;

  const interactiveRef = useRef(interactive);
  interactiveRef.current = interactive;

  const onNodeClickRef = useRef(onNodeClick);
  onNodeClickRef.current = onNodeClick;

  const onBackgroundClickRef = useRef(onBackgroundClick);
  onBackgroundClickRef.current = onBackgroundClick;

  const nodeRadiusScale = (value: number, widthValue: number, heightValue: number) => {
    const minDimension = Math.min(widthValue, heightValue);
    const base = Math.max(5, Math.min(16, Math.round(minDimension / 34)));
    return Math.max(4, Math.round(base * (value / 20)));
  };

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

  const graphData = useMemo(() => {
    if (!entities) return { nodes: [], links: [] };

    const nodeValueMap = new Map<string, number>();
    entities.forEach(entity => {
      const related = entity.current_state?.related_entities || entity.proposed_state?.related_entities || [];
      nodeValueMap.set(entity.id, related.length * 2 + 10);
    });

    const nodes = entities.map((entity) => ({
      id: entity.id,
      label: entity.current_state?.title || entity.proposed_state?.title || entity.type,
      group: entity.type,
      value: nodeValueMap.get(entity.id) || 10,
      color: typeColors[entity.type] || typeColors.default
    }));

    const links: any[] = [];
    entities.forEach(entity => {
      const related = entity.current_state?.related_entities || entity.proposed_state?.related_entities || [];
      related.forEach(rel => {
        links.push({
          source: entity.id,
          target: rel.entity_id,
          label: rel.connection_type
        });
      });
    });

    return { nodes, links };
  }, [entities, theme]);

  // Initialization
  useEffect(() => {
    if (!containerRef.current) return;

    const ForceGraphFunc = ForceGraph as any;
    const graph = ForceGraphFunc()(containerRef.current);
    graphRef.current = graph;

    // Advanced Organic Constellation Physics
    if (graph.d3Force('charge')) {
      // Push apart strongly, but stop pushing entirely if further than 150px (Less Spreading!)
      graph.d3Force('charge').strength(-200).distanceMax(150);
    }
    if (graph.d3Force('link')) {
      // Pull connected nodes closely together to form tight clusters
      graph.d3Force('link').distance(40);
    }
    if (graph.d3Force('center')) {
      // Gently pull everything towards the center so isolated nodes don't drift away
      graph.d3Force('center').strength(0.08);
    }

    graph
      .nodeRelSize(1)
      .nodeVal((node: any) => node.value)
      .nodeLabel('label')
      .nodeColor((node: any) => node.color)
      .linkWidth(1.15)
      .linkDirectionalParticles(2)
      .linkDirectionalParticleSpeed(0.005)
      .d3AlphaDecay(0.01) // Super slow decay for smooth, fluid settling
      .d3VelocityDecay(0.4) // Medium friction
      .warmupTicks(10) // Let it pre-spread slightly before rendering
      .cooldownTicks(Infinity)
      .minZoom(0.6)
      .maxZoom(3)
      .onNodeClick((node: any, event: MouseEvent) => {
        if (!interactiveRef.current) return;
        
        if (graphRef.current) {
          graphRef.current.centerAt(node.x, node.y, 800);
          graphRef.current.zoom(2, 800);
        }

        onNodeClickRef.current?.(node.id, event);
      })
      .onNodeDrag((node: any) => {
        if (!interactiveRef.current) return;
        node.fx = node.x;
        node.fy = node.y;
      })
      .onNodeDragEnd((node: any) => {
        if (!interactiveRef.current) return;
        node.fx = undefined;
        node.fy = undefined;
      })
      .onBackgroundClick((event: MouseEvent) => {
        if (!interactiveRef.current) return;
        onBackgroundClickRef.current?.(event);
      });

    return () => {
      if (typeof graph._destructor === 'function') {
        graph._destructor();
      }
    };
  }, []);

  // Update Data
  useEffect(() => {
    if (graphRef.current && graphData.nodes.length > 0) {
      graphRef.current.graphData(graphData);
      
      // Initial zoom to fit for preview
      if (!interactive) {
        setTimeout(() => {
          graphRef.current.zoomToFit(400, 40);
        }, 200);
      }
    }
  }, [graphData, interactive]);

  // Update Dimensions
  useEffect(() => {
    if (graphRef.current && width > 0 && height > 0) {
      graphRef.current.width(width);
      graphRef.current.height(Math.max(260, height));
    }
  }, [width, height]);

  // Update Interactive state
  useEffect(() => {
    if (graphRef.current) {
      graphRef.current.enablePanInteraction(interactive);
      graphRef.current.enableZoomInteraction(interactive);
      graphRef.current.enableNodeDrag(interactive);
    }
  }, [interactive]);

  // Handle focused node zoom
  useEffect(() => {
    if (graphRef.current && focusedNodeId) {
      const { nodes } = graphRef.current.graphData();
      const targetNode = nodes.find((n: any) => n.id === focusedNodeId);
      if (targetNode && targetNode.x !== undefined && targetNode.y !== undefined) {
        graphRef.current.centerAt(targetNode.x, targetNode.y, 800);
        graphRef.current.zoom(2, 800);
      }
    }
  }, [focusedNodeId]);

  // Update Canvas Object rendering (depends on theme, selection, isDarkMode)
  useEffect(() => {
    if (graphRef.current) {
      graphRef.current
        .linkColor((link: any) => {
          if (selectedNodeIds.length === 0) return isDarkMode ? 'rgba(148, 163, 184, 0.42)' : 'rgba(71, 85, 105, 0.30)';
          
          const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
          const targetId = typeof link.target === 'object' ? link.target.id : link.target;
          
          if (selectedNodeIds.includes(sourceId) || selectedNodeIds.includes(targetId)) {
            return isDarkMode ? theme.colors.blue[4] : theme.colors.blue[6];
          }
          return isDarkMode ? 'rgba(148, 163, 184, 0.1)' : 'rgba(71, 85, 105, 0.05)';
        })
        .linkWidth((link: any) => {
          if (selectedNodeIds.length === 0) return 1.15;
          const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
          const targetId = typeof link.target === 'object' ? link.target.id : link.target;
          return selectedNodeIds.includes(sourceId) || selectedNodeIds.includes(targetId) ? 2.5 : 0.5;
        })
        .linkDirectionalParticles((link: any) => {
          if (selectedNodeIds.length === 0) return 2;
          const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
          const targetId = typeof link.target === 'object' ? link.target.id : link.target;
          return selectedNodeIds.includes(sourceId) || selectedNodeIds.includes(targetId) ? 4 : 0;
        })
        .nodeCanvasObject((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
          const isSelected = selectedNodeIds.includes(node.id);
          const hasSelection = selectedNodeIds.length > 0;
          
          let isConnected = false;
          if (hasSelection && !isSelected) {
            const { links } = graphRef.current.graphData();
            isConnected = links.some((l: any) => {
              const sid = typeof l.source === 'object' ? l.source.id : l.source;
              const tid = typeof l.target === 'object' ? l.target.id : l.target;
              return (sid === node.id && selectedNodeIds.includes(tid)) || (tid === node.id && selectedNodeIds.includes(sid));
            });
          }

          const isFaded = hasSelection && !isSelected && !isConnected;

          const scale = Math.max(0.7, Math.min(1.02, globalScale));
          const baseRadius = nodeRadiusScale(node.value, ctx.canvas.width / window.devicePixelRatio, ctx.canvas.height / window.devicePixelRatio);
          const radius = isSelected ? baseRadius * 1.3 : baseRadius;
          const labelSize = Math.max(3, Math.min(5, 9 / scale));
          const labelColor = isDarkMode ? theme.white : theme.colors.gray[8];

          ctx.globalAlpha = isFaded ? 0.2 : 1;

          if (isSelected) {
            ctx.beginPath();
            ctx.strokeStyle = theme.colors.blue[5];
            ctx.lineWidth = 2 / globalScale;
            ctx.arc(node.x || 0, node.y || 0, radius + 4, 0, Math.PI * 2);
            ctx.stroke();
          }

          ctx.beginPath();
          ctx.fillStyle = node.color;
          ctx.arc(node.x || 0, node.y || 0, radius, 0, Math.PI * 2);
          ctx.fill();

          ctx.beginPath();
          ctx.fillStyle = isDarkMode ? 'rgba(15, 23, 42, 0.58)' : 'rgba(255, 255, 255, 0.56)';
          ctx.arc(node.x || 0, node.y || 0, radius + 4, 0, Math.PI * 2);
          ctx.fill();

          ctx.font = `${labelSize}px Geist, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillStyle = labelColor;
          ctx.fillText(node.label, node.x || 0, (node.y || 0) + radius + 5);

          ctx.globalAlpha = 1;
        })
        .nodePointerAreaPaint((node: any, color: string, ctx: CanvasRenderingContext2D) => {
          const radius = nodeRadiusScale(node.value, ctx.canvas.width, ctx.canvas.height);
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(node.x || 0, node.y || 0, radius + 6, 0, Math.PI * 2);
          ctx.fill();
        });
    }
  }, [theme, isDarkMode, selectedNodeIds]);

  return (
    <Box ref={viewportRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </Box>
  );
};
