import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { api } from '../api/axios.js';
import TreeNode from '../components/TreeNode.jsx';

export default function GenealogyTreePage() {
  const { user } = useSelector((state) => state.auth);
  const [tree, setTree] = useState(null);
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [highlightId, setHighlightId] = useState(null);
  const [selectedTreeId, setSelectedTreeId] = useState(null);
  const [forceOpenIds, setForceOpenIds] = useState([]);
  const [expandAll, setExpandAll] = useState(null);
  const [zoom, setZoom] = useState(1);
  const viewportRef = useRef(null);
  const transformRef = useRef({ zoom: 1, pan: { x: 0, y: 0 } });
  const panRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0,
    startOffsetX: 0,
    startOffsetY: 0,
    moved: false
  });
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const MIN_ZOOM = 0.05;
  const MAX_ZOOM = 20;
  const ZOOM_STEP = 1.1;

  useEffect(() => {
    transformRef.current = { zoom, pan };
  }, [zoom, pan]);

  useEffect(() => {
    if (!user?.userId) return;
    api.get(`/api/users/${user.userId}/tree`).then(({ data }) => setTree(data.data));
  }, [user?.userId]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!search) return setSuggestions([]);
      const { data } = await api.get(`/api/users/search?q=${encodeURIComponent(search)}`);
      setSuggestions(data.data);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const findPath = (node, targetId, trail = []) => {
    if (!node) {
      return null;
    }

    const currentTrail = [...trail, node.userId];
    if (node.userId === targetId) {
      return currentTrail;
    }

    for (const child of node.children || []) {
      const result = findPath(child, targetId, currentTrail);
      if (result) {
        return result;
      }
    }

    return null;
  };

  const focusTreeNode = (userId) => {
    setHighlightId(userId);
    setSelectedTreeId(userId);
    setSearch(userId);
    setExpandAll(null);

    if (!tree) {
      return;
    }

    const path = findPath(tree, userId) || [];
    setForceOpenIds(path.slice(0, -1));
  };

  const clampZoom = (value) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));

  const zoomToPoint = (nextZoom, clientX, clientY) => {
    const viewport = viewportRef.current;

    if (!viewport) {
      return;
    }

    const rect = viewport.getBoundingClientRect();
    const pointX = clientX - rect.left;
    const pointY = clientY - rect.top;
    const currentTransform = transformRef.current;
    const safeZoom = clampZoom(nextZoom);
    const worldX = (pointX - currentTransform.pan.x) / currentTransform.zoom;
    const worldY = (pointY - currentTransform.pan.y) / currentTransform.zoom;
    const nextPan = {
      x: pointX - worldX * safeZoom,
      y: pointY - worldY * safeZoom
    };

    transformRef.current = { zoom: safeZoom, pan: nextPan };
    setZoom(safeZoom);
    setPan(nextPan);
  };

  const startPan = (event) => {
    if (event.button !== 0) {
      return;
    }

    const target = event.target;
    if (target.closest('button') || target.closest('input') || target.closest('a')) {
      return;
    }

    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }

    panRef.current = {
      active: true,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: transformRef.current.pan.x,
      offsetY: transformRef.current.pan.y,
      startOffsetX: transformRef.current.pan.x,
      startOffsetY: transformRef.current.pan.y,
      moved: false
    };

    event.preventDefault();
    viewport.setPointerCapture(event.pointerId);
    viewport.classList.add('is-panning');
  };

  const movePan = (event) => {
    const viewport = viewportRef.current;
    const panState = panRef.current;

    if (!viewport || !panState.active) {
      return;
    }

    const deltaX = event.clientX - panState.startX;
    const deltaY = event.clientY - panState.startY;

    if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
      panState.moved = true;
    }

    const nextPan = {
      x: panState.startOffsetX + deltaX,
      y: panState.startOffsetY + deltaY
    };

    transformRef.current = {
      zoom: transformRef.current.zoom,
      pan: nextPan
    };
    setPan(nextPan);
  };

  const endPan = (event) => {
    const viewport = viewportRef.current;
    const panState = panRef.current;

    if (viewport?.hasPointerCapture?.(event.pointerId)) {
      viewport.releasePointerCapture(event.pointerId);
    }

    if (viewport) {
      viewport.classList.remove('is-panning');
    }

    if (panState.active && panState.moved) {
      event.preventDefault();
    }

    panRef.current = { active: false, startX: 0, startY: 0, scrollLeft: 0, scrollTop: 0, moved: false };
  };

  const resetTree = () => {
    const nextTransform = { zoom: 1, pan: { x: 0, y: 0 } };
    transformRef.current = nextTransform;
    setZoom(nextTransform.zoom);
    setPan(nextTransform.pan);
    setSelectedTreeId(null);
    setForceOpenIds([]);
    setExpandAll(null);
  };

  const handleWheel = (event) => {
    event.preventDefault();
    event.stopPropagation();

    const wheelSteps = event.deltaY / 100;
    const factor = Math.pow(ZOOM_STEP, -wheelSteps);
    zoomToPoint(transformRef.current.zoom * factor, event.clientX, event.clientY);
  };

  const zoomIn = () => {
    const viewport = viewportRef.current;
    const rect = viewport?.getBoundingClientRect();
    const centerX = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    const centerY = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
    zoomToPoint(transformRef.current.zoom * ZOOM_STEP, centerX, centerY);
  };

  const zoomOut = () => {
    const viewport = viewportRef.current;
    const rect = viewport?.getBoundingClientRect();
    const centerX = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    const centerY = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
    zoomToPoint(transformRef.current.zoom / ZOOM_STEP, centerX, centerY);
  };

  const toggleTreeExpansion = () => {
    setExpandAll((current) => (current === true ? false : true));
  };

  useEffect(() => {
    if (!selectedTreeId || !tree) {
      return;
    }

    let animationFrame = 0;

    const centerSelectedNode = () => {
      const viewport = viewportRef.current;
      const nodeElement = document.querySelector(`[data-node-id="${selectedTreeId}"]`);

      if (!viewport || !nodeElement) {
        return;
      }

      const viewportRect = viewport.getBoundingClientRect();
      const nodeRect = nodeElement.getBoundingClientRect();
      const deltaX = viewportRect.left + viewportRect.width / 2 - (nodeRect.left + nodeRect.width / 2);
      const deltaY = viewportRect.top + viewportRect.height / 2 - (nodeRect.top + nodeRect.height / 2);
      const nextPan = {
        x: transformRef.current.pan.x + deltaX,
        y: transformRef.current.pan.y + deltaY
      };

      transformRef.current = {
        zoom: transformRef.current.zoom,
        pan: nextPan
      };

      setPan(nextPan);
    };

    animationFrame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(centerSelectedNode);
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, [selectedTreeId, tree, forceOpenIds]);

  return (
    <div className="page-stack">
      <div className="toolbar panel-card">
        <input placeholder="Search User ID" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="toolbar-actions">
          <button onClick={zoomOut}>Zoom Out</button>
          <button onClick={zoomIn}>Zoom In</button>
          <button onClick={toggleTreeExpansion}>{expandAll === true ? 'Collapse All' : 'Expand All'}</button>
          <button onClick={resetTree}>Center Tree</button>
        </div>
        {suggestions.length > 0 && (
          <div className="suggestions">
            {suggestions.map((item) => (
              <button key={item.userId} onClick={() => focusTreeNode(item.userId)}>
                {item.userId} - {item.fullName}
              </button>
            ))}
          </div>
        )}
      </div>
      <div
        ref={viewportRef}
        className="tree-viewport"
        onPointerDown={startPan}
        onPointerMove={movePan}
        onPointerUp={endPan}
        onPointerCancel={endPan}
        onWheel={handleWheel}
      >
        <div className="tree-canvas" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}>
          {tree ? <TreeNode node={tree} highlightId={highlightId} defaultExpanded forceOpenIds={forceOpenIds} expandAll={expandAll} /> : <div className="panel-card">Loading tree...</div>}
        </div>
      </div>
    </div>
  );
}