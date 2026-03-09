import { useState, useCallback, useRef } from 'react';
import { GoogleMap, Polygon, Marker, Polyline, Autocomplete } from '@react-google-maps/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, MousePointer, Pencil, Search } from 'lucide-react';

const mapContainerStyle = {
  width: '100%',
  height: '500px',
};

const defaultCenter = { lat: 20.5937, lng: 78.9629 };

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
  const [isDrawing, setIsDrawing] = useState(!initialPolygon || initialPolygon.length === 0);
  const [drawingPoints, setDrawingPoints] = useState<{ lat: number; lng: number }[]>([]);
  const polygonRef = useRef<google.maps.Polygon | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const handlePlaceSelect = useCallback(() => {
    const place = autocompleteRef.current?.getPlace();
    if (place?.geometry?.location) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      mapRef.current?.panTo({ lat, lng });
      mapRef.current?.setZoom(13);
    }
  }, []);

  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (!isDrawing || !e.latLng) return;

      const newPoint = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      const updated = [...drawingPoints, newPoint];
      setDrawingPoints(updated);
    },
    [isDrawing, drawingPoints]
  );

  const finishDrawing = useCallback(() => {
    if (drawingPoints.length < 3) return;
    setPolygon(drawingPoints);
    onPolygonChange(drawingPoints);
    setDrawingPoints([]);
    setIsDrawing(false);
  }, [drawingPoints, onPolygonChange]);

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
    setDrawingPoints([]);
    onPolygonChange([]);
    setIsDrawing(true);
  };

  const undoLastPoint = () => {
    const updated = drawingPoints.slice(0, -1);
    setDrawingPoints(updated);
  };

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        {!isDrawing && polygon.length > 0 && (
          <>
            <Button variant="outline" size="sm" onClick={() => { clearPolygon(); }} className="gap-1.5">
              <Pencil className="h-3.5 w-3.5" /> Redraw
            </Button>
            <Button variant="outline" size="sm" onClick={clearPolygon} className="gap-1.5 text-destructive">
              <Trash2 className="h-3.5 w-3.5" /> Clear Zone
            </Button>
            <span className="text-xs text-muted-foreground">
              {polygon.length} points · Drag points on map to adjust
            </span>
          </>
        )}
        {isDrawing && (
          <div className="flex items-center gap-2 w-full">
            <div className="flex-1 flex items-center gap-2 p-2 bg-primary/10 rounded-md border border-primary/20">
              <MousePointer className="h-4 w-4 text-primary shrink-0" />
              <span className="text-xs text-primary font-medium">
                Click on the map to place boundary points ({drawingPoints.length} placed)
                {drawingPoints.length >= 3 && ' — click "Finish" to close the shape'}
              </span>
            </div>
            {drawingPoints.length > 0 && (
              <Button variant="outline" size="sm" onClick={undoLastPoint}>
                Undo
              </Button>
            )}
            {drawingPoints.length >= 3 && (
              <Button size="sm" onClick={finishDrawing} className="gap-1.5">
                ✓ Finish
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Search box */}
      <div className="relative">
        <Autocomplete
          onLoad={(ac) => { autocompleteRef.current = ac; }}
          onPlaceChanged={handlePlaceSelect}
          options={{ componentRestrictions: { country: 'in' } }}
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search city or area to navigate map..."
              className="pl-10"
            />
          </div>
        </Autocomplete>
      </div>

      {/* Map */}
      <div className="rounded-lg overflow-hidden border">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={polygon.length > 0 ? polygon[0] : center}
          zoom={5}
          onClick={handleMapClick}
          onLoad={(map) => { mapRef.current = map; }}
          options={{
            mapTypeControl: true,
            streetViewControl: false,
            fullscreenControl: true,
            draggableCursor: isDrawing ? 'crosshair' : undefined,
          }}
        >
          {/* Drawing mode: show placed points and connecting lines */}
          {isDrawing && drawingPoints.length > 0 && (
            <>
              <Polyline
                path={drawingPoints}
                options={{
                  strokeColor: '#7c3aed',
                  strokeWeight: 2,
                  strokeOpacity: 0.8,
                }}
              />
              {/* Dashed line from last point back to first to preview closure */}
              {drawingPoints.length >= 3 && (
                <Polyline
                  path={[drawingPoints[drawingPoints.length - 1], drawingPoints[0]]}
                  options={{
                    strokeColor: '#7c3aed',
                    strokeWeight: 2,
                    strokeOpacity: 0.4,
                    icons: [{
                      icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 3 },
                      offset: '0',
                      repeat: '15px',
                    }],
                  }}
                />
              )}
              {drawingPoints.map((point, idx) => (
                <Marker
                  key={idx}
                  position={point}
                  label={{
                    text: String(idx + 1),
                    color: 'white',
                    fontSize: '11px',
                    fontWeight: 'bold',
                  }}
                  icon={{
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 12,
                    fillColor: '#7c3aed',
                    fillOpacity: 1,
                    strokeColor: 'white',
                    strokeWeight: 2,
                  }}
                />
              ))}
            </>
          )}

          {/* Completed polygon */}
          {polygon.length > 0 && !isDrawing && (
            <Polygon
              paths={polygon}
              options={{
                fillColor: '#7c3aed',
                fillOpacity: 0.25,
                strokeWeight: 2,
                strokeColor: '#7c3aed',
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
