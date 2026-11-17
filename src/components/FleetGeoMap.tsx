import React, { useState, useCallback } from "react";
import {
  APIProvider,
  Map as GoogleMap,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useAdvancedMarkerRef,
} from "@vis.gl/react-google-maps";
import { Globe, Activity, Crosshair, AlertTriangle } from "lucide-react";
import { TunnelProfile } from "../utils/networkTools";

interface FleetGeoMapProps {
  profiles: TunnelProfile[];
  selectedProfileId: number | string | null;
  onSelectProfile: (profile: TunnelProfile) => void;
  onProbeProfile: (profile: TunnelProfile) => void;
  probingId?: number | string | null;
  quotaExceeded?: boolean;
}

interface EndpointMarkerProps {
  profile: TunnelProfile;
  isSelected: boolean;
  isOpen: boolean;
  onSelect: () => void;
  onCloseInfo: () => void;
  onProbe: () => void;
  isProbing: boolean;
}

const EndpointMarker: React.FC<EndpointMarkerProps> = ({
  profile,
  isSelected,
  isOpen,
  onSelect,
  onCloseInfo,
  onProbe,
  isProbing,
}) => {
  const [markerRef, marker] = useAdvancedMarkerRef();

  const pinBg = !profile.isActive
    ? "#6b7280"
    : profile.lastRttMs !== null && profile.lastRttMs > 150
    ? "#f59e0b"
    : isSelected
    ? "#3b82f6"
    : "#10b981";

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={{ lat: profile.lat, lng: profile.lng }}
        onClick={onSelect}
        title={`${profile.name} (${profile.locationLabel})`}
      >
        <Pin
          background={pinBg}
          borderColor="#ffffff"
          glyphColor="#000000"
          scale={isSelected ? 1.2 : 1.0}
        />
      </AdvancedMarker>

      {isOpen && marker && (
        <InfoWindow anchor={marker} onCloseClick={onCloseInfo}>
          <div className="bg-[#0a0a0a] text-gray-100 p-2 rounded font-mono text-xs min-w-[200px] space-y-1.5">
            <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1">
              <span className="font-bold text-white uppercase">{profile.name}</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 uppercase">
                {profile.category}
              </span>
            </div>
            <div className="text-[10px] text-gray-400">{profile.locationLabel}</div>
            <div className="text-[10px] text-emerald-400">
              {profile.endpointHost}:{profile.endpointPort}
            </div>
            <div className="flex items-center justify-between text-[10px] pt-1">
              <span className="text-gray-400">Live RTT:</span>
              <span className="font-bold text-white">
                {profile.lastRttMs !== null ? `${profile.lastRttMs} ms` : "Unprobed"}
              </span>
            </div>
            <button
              type="button"
              onClick={onProbe}
              disabled={isProbing}
              className="w-full mt-1 py-1 px-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold uppercase cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50"
            >
              <Crosshair className="h-3 w-3" />
              {isProbing ? "Probing..." : "Run Live Probe"}
            </button>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

export default function FleetGeoMap({
  profiles,
  selectedProfileId,
  onSelectProfile,
  onProbeProfile,
  probingId,
  quotaExceeded = false,
}: FleetGeoMapProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
  const [openMarkerId, setOpenMarkerId] = useState<number | string | null>(null);

  const handleMarkerSelect = useCallback(
    (profile: TunnelProfile) => {
      setOpenMarkerId(profile.id);
      onSelectProfile(profile);
    },
    [onSelectProfile]
  );

  const centerProfile =
    profiles.find((p) => p.id === selectedProfileId) || profiles[0] || {
      lat: 37.7749,
      lng: -122.4194,
    };

  if (!apiKey) {
    return (
      <div className="h-[360px] w-full bg-[#050505] border border-white/10 rounded-lg flex flex-col items-center justify-center p-6 text-center font-mono text-xs text-gray-400 gap-2">
        <AlertTriangle className="h-6 w-6 text-amber-400" />
        <p className="font-bold text-white uppercase">Google Maps API Key Not Configured</p>
        <p className="text-[11px] max-w-md text-gray-500">
          Set VITE_GOOGLE_MAPS_API_KEY to inspect Fleet Endpoint Nodes geographically.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="h-[360px] w-full rounded-lg overflow-hidden border border-white/10 relative bg-[#050505]">
        <APIProvider apiKey={apiKey}>
          <GoogleMap
            defaultCenter={{ lat: centerProfile.lat, lng: centerProfile.lng }}
            defaultZoom={2}
            mapId="DEMO_MAP_ID"
            colorScheme="DARK"
            gestureHandling="greedy"
            disableDefaultUI={false}
            internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
          >
            {profiles.map((profile) => (
              <EndpointMarker
                key={String(profile.id)}
                profile={profile}
                isSelected={profile.id === selectedProfileId}
                isOpen={openMarkerId === profile.id}
                onSelect={() => handleMarkerSelect(profile)}
                onCloseInfo={() => setOpenMarkerId(null)}
                onProbe={() => onProbeProfile(profile)}
                isProbing={probingId === profile.id}
              />
            ))}
          </GoogleMap>
        </APIProvider>

        {quotaExceeded && (
          <div className="absolute bottom-2 left-2 right-2 bg-amber-950/90 border border-amber-500/40 rounded px-3 py-1.5 text-[10px] font-mono text-amber-200 flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            Demo Maps quota reached — switch back to Schematic SVG Topology or attach a personal Maps key.
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-gray-400 px-1">
        <span className="flex items-center gap-1.5">
          <Globe className="h-3.5 w-3.5 text-emerald-400" />
          Showing {profiles.length} Geo-Distributed Fleet Nodes
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Healthy
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500" /> Selected
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> High RTT
          </span>
        </span>
      </div>
    </div>
  );
}
