import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useEffect } from 'react'

// Fix Leaflet's default icon paths (broken with Vite)
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl : 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl       : 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl     : 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function FlyTo({ lat, lng }) {
  const map = useMap()
  useEffect(() => {
    if (lat && lng) map.flyTo([lat, lng], map.getZoom())
  }, [lat, lng, map])
  return null
}

export default function HiveMap({ latest, hiveName }) {
  const lat = latest?.gps_lat
  const lng = latest?.gps_lng
  const hasPos = lat && lng

  const center = hasPos ? [lat, lng] : [30.4278, -9.5981]

  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ padding: '20px 24px 14px', fontSize: 13, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>
        📍 GPS location
        {hasPos && (
          <span style={{ float: 'right', fontSize: 11, fontWeight: 400, fontFamily: 'monospace', color: 'var(--muted)' }}>
            {lat.toFixed(5)}, {lng.toFixed(5)}
          </span>
        )}
      </div>
      <MapContainer center={center} zoom={15} style={{ height: 280, width: '100%' }} zoomControl={true}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        {hasPos && (
          <>
            <FlyTo lat={lat} lng={lng} />
            <Marker position={[lat, lng]}>
              <Popup>{hiveName || 'Hive'}<br />{lat.toFixed(5)}, {lng.toFixed(5)}</Popup>
            </Marker>
          </>
        )}
      </MapContainer>
      {!hasPos && (
        <div style={{ textAlign: 'center', padding: 20, color: 'var(--muted)', fontSize: 13 }}>
          No GPS fix yet
        </div>
      )}
    </div>
  )
}