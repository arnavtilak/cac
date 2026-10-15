export async function photoToDataUrl(file) {
    if (!file.type.startsWith("image/")) {
        throw new Error("Choose an image file.");
    }

    const bitmap = await createImageBitmap(file);
    const maxDimension = 1280;
    const scale = Math.min(1, maxDimension / bitmap.width, maxDimension / bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);

    const context = canvas.getContext("2d");
    if (!context) {
        bitmap.close();
        throw new Error("Could not process this image.");
    }

    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    return canvas.toDataURL("image/jpeg", 0.82);
}