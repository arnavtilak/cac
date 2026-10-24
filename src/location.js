// One request to the device. Resolves to { location, problem }:
// location is { lat, lng, accuracy } (accuracy is in meters) or null, and problem says why there's
// no location: "blocked" (permission denied), "unavailable" (couldn't get a fix), "slow", or "unsupported".
function ask(options) {
    return new Promise((resolve) => {
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
            options,
        );
    });
}

// Asks the device where it is, the same { location, problem } shape as above.
// Precise GPS can take a long time indoors, so this asks for two positions at once:
// GPS, and a rough one from Wi-Fi and cell towers that usually arrives in a second or two.
export async function requestLocation() {
    if (!navigator.geolocation) {
        return { location: null, problem: "unsupported" };
    }

    const precise = ask({ enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 });
    // a rough position from the last 5 minutes is fine to reuse
    const rough = ask({ enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 });

    // use GPS if it's ready within 5 seconds
    const quickPrecise = await waitForLocation(precise, 5000);
    if (quickPrecise.location) {
        return quickPrecise;
    }
    // otherwise use the rough position, or GPS if it gets there after all
    const roughResult = await rough;
    if (roughResult.location) {
        return roughResult;
    }
    return precise;
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
