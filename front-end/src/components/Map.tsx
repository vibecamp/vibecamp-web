import React from 'react'
import { observer } from 'mobx-react-lite'
import { MapContainer } from 'react-leaflet'
import { TileLayer } from 'react-leaflet'
import { Marker } from 'react-leaflet'
import { Popup } from 'react-leaflet'

import Spacer from './core/Spacer'


export default observer(() => {

    return (
        <>
            <h1>Site map</h1>

            <Spacer size={16} />

            {typeof window !== 'undefined' &&
                <MapContainer center={[39.645899, -76.172219]} zoom={16} scrollWheelZoom={false} style={{ height: window.innerHeight * 0.6 }}>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={[39.645899, -76.172219]}>
                        <Popup>
                            A pretty CSS3 popup. <br /> Easily customizable.
                        </Popup>
                    </Marker>
                </MapContainer>}
        </>
    )
})