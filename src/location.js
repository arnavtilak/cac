// Asks the device where it is. Resolves to { location, problem }:
// location is { lat, lng, accuracy } or null, and problem says why there's no location:
// "blocked" (permission denied), "unavailable" (couldn't get a fix), "slow", or "unsupported".
export function requestLocation() {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            resolve({ location: null, problem: "unsupported" });
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => resolve({
                location: {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                },
                problem: null,
            }),
            (error) => resolve({
                location: null,
                problem: error.code === error.PERMISSION_DENIED ? "blocked"
                    : error.code === error.TIMEOUT ? "slow"
                    : "unavailable",
            }),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
        );
    });
}

// Waits at most ms for a location request, then gives up.
// The browser's own timeout doesn't count time spent on the "Allow location?" prompt,
// so without this an ignored prompt would wait forever.
export function waitForLocation(request, ms) {
    const giveUp = new Promise((resolve) => {
        setTimeout(() => resolve({ location: null, problem: "slow" }), ms);
    });
    // race settles with whichever promise finishes first
    return Promise.race([request, giveUp]);
}
