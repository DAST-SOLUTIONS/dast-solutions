/**
 * TakeoffViewerAdvanced Component - Advanced plan viewer with measurement tools
 */
import React, { useState, useRef } from 'react';
import { ZoomIn, ZoomOut, Move, Ruler, Square, Circle } from 'lucide-react';

interface TakeoffViewerAdvancedProps {
  imageUrl?: string;
  onMeasurement?: (measurement: any) => void;
}

export function TakeoffViewerAdvanced({ imageUrl, onMeasurement }: TakeoffViewerAdvancedProps) {
  const [zoom, setZoom] = useState(1);
  const [tool, setTool] = useState<'pan' | 'linear' | 'area' | 'count'>('pan');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const tools = [
    { id: 'pan', icon: Move, label: 'Déplacer' },
    { id: 'linear', icon: Ruler, label: 'Mesure linéaire' },
    { id: 'area', icon: Square, label: 'Mesure de surface' },
    { id: 'count', icon: Circle, label: 'Comptage' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex gap-2">
          {tools.map(t => (
            <button
              key={t.id}
              onClick={() => setTool(t.id as any)}
              className={`p-2 rounded ${tool === t.id ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
              title={t.label}
            >
              <t.icon className="w-5 h-5" />
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setZoom(z => Math.max(0.25, z - 0.25))} className="p-2 hover:bg-gray-100 rounded">
            <ZoomOut className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium w-16 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(4, z + 0.25))} className="p-2 hover:bg-gray-100 rounded">
            <ZoomIn className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div className="relative overflow-auto" style={{ height: '600px' }}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Plan"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
            className="max-w-none"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            Aucun plan chargé
          </div>
        )}
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 pointer-events-auto"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
        />
      </div>
    </div>
  );
}

export default TakeoffViewerAdvanced;
