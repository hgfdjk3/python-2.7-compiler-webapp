import React, { useEffect, useMemo, useRef } from 'react';
import { Badge, Box, Group, Paper, Text, useMantineTheme } from '@mantine/core';
import { useElementSize } from '@mantine/hooks';
import ForceGraph2D from 'react-force-graph-2d';
import { knowledgeGraphLinks, knowledgeGraphNodes } from './knowledgeGraphData';

type GraphNode = (typeof knowledgeGraphNodes)[number] & {
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
};

type GraphLink = (typeof knowledgeGraphLinks)[number];

type GraphRef = {
  zoomToFit?: (durationMs?: number, padding?: number) => void;
};

export const KnowledgeGraphPreview: React.FC = () => {
  const theme = useMantineTheme();
  const graphRef = useRef<GraphRef | null>(null);
  const { ref: viewportRef, width, height } = useElementSize();

  const graphData = useMemo(() => {
    const ringCount = knowledgeGraphNodes.length;
    const radius = 120;

    const nodes: GraphNode[] = knowledgeGraphNodes.map((node, index) => {
      const angle = (Math.PI * 2 * index) / ringCount - Math.PI / 2;
      return {
        ...node,
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius * 0.72,
      };
    });

    const links: GraphLink[] = knowledgeGraphLinks.map(link => ({ 
      ...link,
      // Ensure source and target are strings if they were mutated in a previous mount
      source: typeof link.source === 'object' ? (link.source as any).id : link.source,
      target: typeof link.target === 'object' ? (link.target as any).id : link.target
    }));

    return { nodes, links };
  }, []);

  const [initialized, setInitialized] = React.useState(false);

  useEffect(() => {
    if (graphRef.current && width > 0 && height > 0 && !initialized) {
      setInitialized(true);
      const timeout = setTimeout(() => {
        (graphRef.current as any).zoomToFit(400, 40);
      }, 200);
      return () => clearTimeout(timeout);
    }
  }, [width, height, initialized]);

  const isDarkMode = document.documentElement.getAttribute('data-mantine-color-scheme') === 'dark';
  const nodeRadiusScale = (value: number, widthValue: number, heightValue: number) => {
    const minDimension = Math.min(widthValue, heightValue);
    const base = Math.max(5, Math.min(16, Math.round(minDimension / 34)));
    return Math.max(4, Math.round(base * (value / 20)));
  };

  return (

    <Box
      ref={viewportRef}
      style={{
        flex: 1,
        minHeight: 0,
        borderRadius: 'var(--mantine-radius-md)',
        overflow: 'hidden',
        border: '1px solid var(--mantine-color-default-border)',
        background:
          'linear-gradient(180deg, color-mix(in srgb, var(--mantine-color-body) 92%, transparent), var(--mantine-color-default))',
      }}
    >
      <ForceGraph2D
        ref={graphRef as any}
        graphData={graphData}
        width={width}
        height={Math.max(260, height)}
        backgroundColor="transparent"
        nodeRelSize={1}
        nodeVal={(node: GraphNode) => node.value}
        nodeColor={(node: GraphNode) => node.color}
        nodeLabel={(node: GraphNode) => node.label}
        linkColor={() => (isDarkMode ? 'rgba(148, 163, 184, 0.42)' : 'rgba(71, 85, 105, 0.30)')}
        linkWidth={1.15}
        linkDirectionalParticles={2}
        linkDirectionalParticleSpeed={0.005}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.35}
        warmupTicks={30}
        cooldownTicks={Infinity}
        minZoom={0.6}
        maxZoom={3}
        enablePanInteraction
        enableZoomInteraction
        onNodeClick={(node: GraphNode) => {
          if (node && graphRef.current?.zoomToFit) {
            graphRef.current.zoomToFit(500, 50);
          }
        }}
        onNodeDrag={(node: GraphNode) => {
          node.fx = node.x;
          node.fy = node.y;
        }}
        onNodeDragEnd={(node: GraphNode) => {
          node.fx = undefined;
          node.fy = undefined;
        }}
        nodeCanvasObject={(node: GraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
          const typedNode = node as GraphNode;
          const scale = Math.max(0.7, Math.min(1.02, globalScale));
          const radius = nodeRadiusScale(typedNode.value, ctx.canvas.width / window.devicePixelRatio, ctx.canvas.height / window.devicePixelRatio);
          const labelSize = Math.max(3, Math.min(5, 9 / scale));
          const labelColor = isDarkMode ? theme.white : theme.colors.gray[8];

          ctx.beginPath();
          ctx.fillStyle = typedNode.color;
          ctx.arc(typedNode.x || 0, typedNode.y || 0, radius, 0, Math.PI * 2);
          ctx.fill();

          ctx.beginPath();
          ctx.fillStyle = isDarkMode ? 'rgba(15, 23, 42, 0.58)' : 'rgba(255, 255, 255, 0.56)';
          ctx.arc(typedNode.x || 0, typedNode.y || 0, radius + 4, 0, Math.PI * 2);
          ctx.fill();

          ctx.font = `${labelSize}px Geist, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillStyle = labelColor;
          ctx.fillText(typedNode.label, typedNode.x || 0, (typedNode.y || 0) + radius + 5);
        }}
        nodePointerAreaPaint={(node: GraphNode, color: string, ctx: CanvasRenderingContext2D) => {
          const typedNode = node as GraphNode;
          const radius = nodeRadiusScale(typedNode.value, ctx.canvas.width, ctx.canvas.height);
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(typedNode.x || 0, typedNode.y || 0, radius + 6, 0, Math.PI * 2);
          ctx.fill();
        }}
      />
    </Box>
  );
};
