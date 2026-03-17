import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { EnrichedMachineContext } from '@/types/dashboard';

interface MachineMapProps {
    latitude: number;
    longitude: number;
    serial: string;
    context?: EnrichedMachineContext | null;
}

// Custom coffee-cup icon for the machine marker
const machineIcon = L.divIcon({
    html: `<div style="
        background: #1e40af;
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        border: 2px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    ">&#9749;</div>`,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
});

const eventIcon = L.divIcon({
    html: `<div style="
        background: #dc2626;
        color: white;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    ">&#9834;</div>`,
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
});

const venueIcon = L.divIcon({
    html: `<div style="
        background: #2563eb;
        color: white;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    ">&#9899;</div>`,
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
});

export const MachineMap: React.FC<MachineMapProps> = ({ latitude, longitude, serial, context }) => {
    const center = useMemo<[number, number]>(() => [latitude, longitude], [latitude, longitude]);

    const eventMarkers = useMemo(() => {
        if (!context?.events?.items) return [];
        return context.events.items.filter((e) => e.venue_lat && e.venue_lon);
    }, [context?.events?.items]);

    const venue = context?.footfall?.venue;

    return (
        <MapContainer
            center={center}
            zoom={15}
            style={{ height: '400px', width: '100%', borderRadius: '0.5rem' }}
            scrollWheelZoom={true}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* 1km radius circle */}
            <Circle
                center={center}
                radius={1000}
                pathOptions={{
                    color: '#3b82f6',
                    fillColor: '#3b82f6',
                    fillOpacity: 0.05,
                    weight: 1,
                    dashArray: '5, 5',
                }}
            />

            {/* Machine marker */}
            <Marker position={center} icon={machineIcon}>
                <Popup>
                    <div className="text-sm">
                        <p className="font-semibold">{serial}</p>
                        <p className="text-gray-500">Macchina</p>
                    </div>
                </Popup>
            </Marker>

            {/* Event markers */}
            {eventMarkers.map((event) => (
                <Marker
                    key={event.id}
                    position={[event.venue_lat!, event.venue_lon!]}
                    icon={eventIcon}
                >
                    <Popup>
                        <div className="text-sm">
                            <p className="font-semibold">{event.name}</p>
                            <p className="text-gray-500">{event.date}{event.time ? ` - ${event.time}` : ''}</p>
                            <p className="text-gray-500">{event.venue} ({event.distance_km} km)</p>
                        </div>
                    </Popup>
                </Marker>
            ))}

            {/* Venue marker */}
            {venue && (
                <Marker
                    position={[venue.venue_lat, venue.venue_lon]}
                    icon={venueIcon}
                >
                    <Popup>
                        <div className="text-sm">
                            <p className="font-semibold">{venue.venue_name}</p>
                            <p className="text-gray-500">{venue.venue_address}</p>
                            {context?.footfall?.forecast && (
                                <p className="text-blue-600 font-medium">
                                    Affluenza disponibile
                                </p>
                            )}
                        </div>
                    </Popup>
                </Marker>
            )}
        </MapContainer>
    );
};
