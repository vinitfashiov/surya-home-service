import { useState, useCallback, useRef } from 'react';
import { GoogleMap, Polygon, DrawingManager } from '@react-google-maps/api';
import { Button } from '@/components/ui/button';
import { Trash2, Undo } from 'lucide-react';

const mapContainerStyle = {
  width: '100%',
  height: '500px',
};

const defaultCenter = { lat: 20.5937, lng: 78.9629 }; // Center of India

interface ZoneMapEditorProps {
  initialPolygon?: { lat: number; lng: number }[];
  onPolygonChange: (coordinates: { lat: number; lng: number }[]) => void;
  center?: { lat: number; lng: number };
}

export default function ZoneMapEditor({
  initialPolygon,
  onPolygonChange,
  center = defaultCenter,
}: ZoneMapEditorProps) {
  const [polygon, setPolygon] = useState<{ lat: number; lng: number }[]>(initialPolygon || []);
  const [isDrawing, setIsDrawing] = useState(!initialPolygon);
  const polygonRef = useRef<google.maps.Polygon | null>(null);

  const handlePolygonComplete = useCallback((poly: google.maps.Polygon) => {
    const path = poly.getPath();
    const coords: { lat: number; lng: number }[] = [];
    
    for (let i = 0; i < path.getLength(); i++) {
      const point = path.getAt(i);
      coords.push({ lat: point.lat(), lng: point.lng() });
    }
    
    setPolygon(coords);
    onPolygonChange(coords);
    setIsDrawing(false);
    poly.setMap(null); // Remove drawing polygon, we'll render our own
  }, [onPolygonChange]);

  const handlePolygonEdit = useCallback(() => {
    if (!polygonRef.current) return;
    
    const path = polygonRef.current.getPath();
    const coords: { lat: number; lng: number }[] = [];
    
    for (let i = 0; i < path.getLength(); i++) {
      const point = path.getAt(i);
      coords.push({ lat: point.lat(), lng: point.lng() });
    }
    
    setPolygon(coords);
    onPolygonChange(coords);
  }, [onPolygonChange]);

  const clearPolygon = () => {
    setPolygon([]);
    onPolygonChange([]);
    setIsDrawing(true);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {polygon.length > 0 && (
          <>
            <Button variant="outline" size="sm" onClick={clearPolygon} className="gap-1.5">
              <Trash2 className="h-3.5 w-3.5" /> Clear Zone
            </Button>
            <span className="text-xs text-muted-foreground">
              {polygon.length} points · Drag points to adjust
            </span>
          </>
        )}
        {isDrawing && (
          <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-md border border-primary/20">
            <span className="text-xs text-primary font-medium">
              ✏️ Drawing mode active — click on the map to place points, then close the shape by clicking the first point
            </span>
          </div>
        )}
      </div>

      <div className="rounded-lg overflow-hidden border">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={5}
          options={{
            mapTypeControl: true,
            streetViewControl: false,
            fullscreenControl: true,
          }}
        >
          {isDrawing && (
            <DrawingManager
              drawingMode={google.maps.drawing.OverlayType.POLYGON}
              onPolygonComplete={handlePolygonComplete}
              options={{
                drawingControl: true,
                drawingControlOptions: {
                  position: google.maps.ControlPosition.TOP_CENTER,
                  drawingModes: [google.maps.drawing.OverlayType.POLYGON],
                },
                polygonOptions: {
                  fillColor: '#7c3aed',
                  fillOpacity: 0.3,
                  strokeWeight: 2,
                  strokeColor: '#7c3aed',
                  editable: true,
                  draggable: true,
                  clickable: true,
                },
              }}
            />
          )}

          {polygon.length > 0 && !isDrawing && (
            <Polygon
              paths={polygon}
              options={{
                fillColor: 'hsl(var(--primary))',
                fillOpacity: 0.3,
                strokeWeight: 2,
                strokeColor: 'hsl(var(--primary))',
                editable: true,
                draggable: true,
              }}
              onMouseUp={handlePolygonEdit}
              onDragEnd={handlePolygonEdit}
              onLoad={(poly) => {
                polygonRef.current = poly;
              }}
            />
          )}
        </GoogleMap>
      </div>
    </div>
  );
}
