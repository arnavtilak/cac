// Resolves to { lat, lng, accuracy }, or null if location is unavailable, denied, or too slow.
export function getCurrentLocation() {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            resolve(null);
            return;
        }

        // the browser's own timeout doesn't count time spent on the "Allow location?" prompt,
        // so an ignored prompt would wait forever. Give up after 15 seconds no matter what.
        // (a promise only resolves once, so whichever finishes first wins)
        setTimeout(() => resolve(null), 15000);

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
