// Resolves to { lat, lng, accuracy }, or null if location is unavailable or denied.
export function getCurrentLocation() {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            resolve(null);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => resolve({
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                accuracy: position.coords.accuracy,
            }),
            () => resolve(null),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
        );
    });
}
