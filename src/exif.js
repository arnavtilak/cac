// Reads where and when a photo was taken from the EXIF data hidden inside JPEG files.
// Phones often remove this before a website gets the photo, so expect nulls a lot of the time.

// Resolves to { location: { lat, lng, accuracy } | null, takenAt: Date | null }.
export async function readPhotoInfo(file) {
    try {
        // EXIF sits at the very start of the file, so the first 256 KB is plenty
        const buffer = await file.slice(0, 256 * 1024).arrayBuffer();
        return parseJpeg(new DataView(buffer));
    } catch {
        // not a JPEG, or the data is cut off or broken
        return { location: null, takenAt: null };
    }
}

function parseJpeg(view) {
    // every JPEG starts with the bytes FF D8
    if (view.getUint16(0) !== 0xffd8) {
        return { location: null, takenAt: null };
    }

    // a JPEG is a list of sections, each starting with FF xx and its length.
    // EXIF is in the APP1 section (FF E1), which begins with the letters "Exif".
    let offset = 2;
    while (offset + 4 <= view.byteLength) {
        const marker = view.getUint16(offset);
        if (marker === 0xffe1 && view.getUint32(offset + 4) === 0x45786966) {
            return parseTiff(view, offset + 10);
        }
        // FF DA means the image itself starts, so there's no EXIF after it
        if ((marker & 0xff00) !== 0xff00 || marker === 0xffda) {
            break;
        }
        offset += 2 + view.getUint16(offset + 2);
    }
    return { location: null, takenAt: null };
}

// EXIF data is laid out like a TIFF file: a header, then lists of tagged values (IFDs).
function parseTiff(view, tiff) {
    // "II" means numbers are stored little-endian, "MM" means big-endian
    const little = view.getUint16(tiff) === 0x4949;
    const u16 = (at) => view.getUint16(at, little);
    const u32 = (at) => view.getUint32(at, little);

    // an IFD is a count, then 12-byte entries: tag, type, count, value
    function readIfd(start) {
        const entries = new Map();
        for (let i = 0; i < u16(start); i++) {
            const entry = start + 2 + i * 12;
            entries.set(u16(entry), { count: u32(entry + 4), valueAt: entry + 8 });
        }
        return entries;
    }
    // values longer than 4 bytes don't fit in the entry, so it holds their position instead
    const dataAt = (entry, size) => (entry.count * size > 4 ? tiff + u32(entry.valueAt) : entry.valueAt);
    const text = (entry) => {
        const at = dataAt(entry, 1);
        let result = "";
        for (let i = 0; i < entry.count - 1; i++) {
            result += String.fromCharCode(view.getUint8(at + i));
        }
        return result;
    };
    // GPS positions are stored as degrees, minutes, seconds, each as a fraction
    const degrees = (entry) => {
        const at = dataAt(entry, 8);
        const part = (i) => u32(at + i * 8) / u32(at + i * 8 + 4);
        return part(0) + part(1) / 60 + part(2) / 3600;
    };

    const main = readIfd(tiff + u32(tiff + 4));
    let location = null;
    let takenAt = null;

    // tag 8825 points to the GPS list: 1 = N/S, 2 = latitude, 3 = E/W, 4 = longitude
    const gpsPointer = main.get(0x8825);
    if (gpsPointer) {
        const gps = readIfd(tiff + u32(gpsPointer.valueAt));
        if (gps.has(1) && gps.has(2) && gps.has(3) && gps.has(4)) {
            const lat = degrees(gps.get(2)) * (text(gps.get(1)) === "S" ? -1 : 1);
            const lng = degrees(gps.get(4)) * (text(gps.get(3)) === "W" ? -1 : 1);
            // 0, 0 is what some phones write after removing the real location
            if (Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0)) {
                location = { lat, lng, accuracy: null };
            }
        }
    }

    // tag 8769 points to the camera details; 9003 is when the photo was taken, like "2026:10:20 15:12:45"
    const exifPointer = main.get(0x8769);
    const taken = exifPointer && readIfd(tiff + u32(exifPointer.valueAt)).get(0x9003);
    if (taken) {
        const [date, time] = text(taken).split(" ");
        // no time zone is stored, so this reads it as local time
        const parsed = new Date(`${date.replaceAll(":", "-")}T${time}`);
        if (!Number.isNaN(parsed.getTime())) {
            takenAt = parsed;
        }
    }

    return { location, takenAt };
}
