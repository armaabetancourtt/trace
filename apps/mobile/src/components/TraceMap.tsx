import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Mapbox, {
  Camera,
  LineLayer,
  LocationPuck,
  MapView,
  ShapeSource,
} from '@rnmapbox/maps';
import type { Coordinate } from '@trace/shared';

import { colors } from '../theme/tokens';

const token = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;

if (token) {
  Mapbox.setAccessToken(token);
}

export function TraceMap({
  route,
  followUser = true,
}: {
  route?: Coordinate[];
  followUser?: boolean;
}) {
  useEffect(() => {
    Mapbox.locationManager.start();

    return () => {
      Mapbox.locationManager.stop();
    };
  }, []);

  const routeShape = useMemo(() => {
    if (!route || route.length < 2) return null;

    return {
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'LineString' as const,
        coordinates: route.map((point) => [
          point.longitude,
          point.latitude,
        ]),
      },
    };
  }, [route]);

  if (!token) {
    return <View style={styles.mapFallback} />;
  }

  return (
    <MapView
      style={styles.map}
      styleURL={Mapbox.StyleURL.Dark}
      scaleBarEnabled={false}
      logoEnabled={false}
      attributionEnabled={false}
    >
      <Camera
        followUserLocation={followUser}
        followZoomLevel={15.5}
        animationMode="flyTo"
        animationDuration={500}
      />

      <LocationPuck
        puckBearingEnabled
        puckBearing="heading"
        pulsing={{ isEnabled: true }}
      />

      {routeShape ? (
        <ShapeSource id="activity-route-source" shape={routeShape}>
          <LineLayer
            id="activity-route-line"
            style={{
              lineColor: colors.primary,
              lineWidth: 5,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        </ShapeSource>
      ) : null}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  mapFallback: {
    flex: 1,
    backgroundColor: colors.surface,
  },
});
