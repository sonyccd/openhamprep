import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { ExamSession } from '@/hooks/useExamSessions';

// Fix for default marker icons in Leaflet with bundlers
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface ExamSessionMapProps {
  sessions: ExamSession[];
  selectedSession?: ExamSession | null;
  onSessionSelect?: (session: ExamSession) => void;
  className?: string;
  hasFilters?: boolean; // Whether filters (state or zip) are applied
}

export const ExamSessionMap = ({
  sessions,
  selectedSession,
  onSessionSelect,
  className = '',
  hasFilters = false,
}: ExamSessionMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map centered on US
    mapInstanceRef.current = L.map(mapRef.current).setView([39.8283, -98.5795], 4);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(mapInstanceRef.current);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Limit to first 50 sessions for map display
    const sessionsWithCoords = sessions
      .filter((s) => s.latitude !== null && s.longitude !== null)
      .slice(0, 50);

    sessionsWithCoords.forEach((session) => {
      if (session.latitude === null || session.longitude === null) return;

      const isSelected = selectedSession?.id === session.id;
      
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div class="w-6 h-6 rounded-full ${
          isSelected ? 'bg-primary ring-4 ring-primary/30' : 'bg-destructive'
        } border-2 border-background shadow-lg flex items-center justify-center">
          <span class="text-xs text-primary-foreground font-bold"></span>
        </div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([session.latitude, session.longitude], { icon })
        .addTo(mapInstanceRef.current!)
        .bindPopup(
          `<div class="p-2">
            <strong>${session.location_name || session.title || 'Exam Session'}</strong><br/>
            ${session.city}, ${session.state} ${session.zip}<br/>
            <em>${new Date(session.exam_date).toLocaleDateString()}</em>
          </div>`
        );

      marker.on('click', () => {
        onSessionSelect?.(session);
      });

      markersRef.current.push(marker);
    });

    // Handle map bounds based on filters
    if (sessionsWithCoords.length > 0 && hasFilters) {
      // If filters are applied, fit to the filtered sessions
      const bounds = L.latLngBounds(
        sessionsWithCoords.map((s) => [s.latitude!, s.longitude!])
      );
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
    } else if (!hasFilters) {
      // No filters - zoom out to show all of US
      mapInstanceRef.current.setView([39.8283, -98.5795], 4);
    }
  }, [sessions, selectedSession, onSessionSelect, hasFilters]);

  // Pan to selected session
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedSession?.latitude || !selectedSession?.longitude) return;
    mapInstanceRef.current.setView([selectedSession.latitude, selectedSession.longitude], 12);
  }, [selectedSession]);

  return (
    <div
      ref={mapRef}
      className={`w-full h-full min-h-[300px] rounded-lg border border-border ${className}`}
    />
  );
};
