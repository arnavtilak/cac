// Each emoji with the words that should suggest it.
const KEYWORDS = [
    ["🔑", "key keys keychain"],
    ["👛", "wallet purse"],
    ["💳", "card credit debit"],
    ["🪪", "id license passport badge"],
    ["📱", "phone iphone android cellphone tablet ipad"],
    ["💻", "laptop computer macbook chromebook"],
    ["🎧", "headphones headphone earbuds airpods headset"],
    ["🎒", "backpack bag bookbag"],
    ["💼", "briefcase"],
    ["🧳", "suitcase luggage"],
    ["👓", "glasses eyeglasses"],
    ["🕶️", "sunglasses shades"],
    ["🥽", "goggles"],
    ["⌚", "watch smartwatch"],
    ["🔌", "charger cable cord plug"],
    ["🔋", "battery powerbank"],
    ["🧢", "hat cap"],
    ["🧥", "jacket coat hoodie"],
    ["🧤", "gloves"],
    ["🧣", "scarf"],
    ["👟", "shoes sneakers cleats"],
    ["☂️", "umbrella"],
    ["🥤", "bottle cup tumbler"],
    ["📚", "book books textbook"],
    ["📓", "notebook binder folder"],
    ["✏️", "pencil pen"],
    ["🧮", "calculator"],
    ["🎮", "controller gamepad console switch"],
    ["⌨️", "keyboard"],
    ["🖱️", "mouse"],
    ["📷", "camera"],
    ["🚲", "bike bicycle"],
    ["🛴", "scooter"],
    ["🛹", "skateboard"],
    ["🚗", "car"],
    ["⚽", "ball soccer"],
    ["🏀", "basketball"],
    ["🏈", "football"],
    ["⚾", "baseball"],
    ["🎾", "tennis racket"],
    ["🎸", "guitar"],
    ["💍", "ring"],
    ["📿", "necklace bracelet"],
    ["💊", "medicine meds pills"],
    ["🔦", "flashlight"],
    ["🔒", "lock padlock"],
    ["🎟️", "ticket pass"],
    ["🪥", "toothbrush"],
    ["💄", "lipstick makeup"],
    ["🧸", "toy teddy"],
];

// flip the list into a lookup table: "airpods" -> "🎧"
const EMOJI_FOR_WORD = new Map(
    KEYWORDS.flatMap(([emoji, words]) => words.split(" ").map((word) => [word, emoji]))
);

// Suggests an emoji for an item name, or returns null if no word matches.
// Words are checked from the end because the last word is usually the thing itself:
// "car keys" -> 🔑, "phone charger" -> 🔌, "laptop bag" -> 🎒
export function suggestEmoji(name) {
    const words = name.toLowerCase().split(/[^a-z]+/).filter(Boolean).reverse();
    for (const word of words) {
        // also try without a trailing "s" so "rings" finds "ring"
        const emoji = EMOJI_FOR_WORD.get(word) ?? EMOJI_FOR_WORD.get(word.replace(/s$/, ""));
        if (emoji) {
            return emoji;
        }
    }
    return null;
}

// A segmenter splits text into what people see as single characters,
// so multi-part emoji like 👨‍👩‍👧 or 🇺🇸 count as one.
const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });

// Returns the emoji if the text is exactly one emoji, otherwise null.
export function getSingleEmoji(text) {
    const characters = [...segmenter.segment(text.trim())];
    if (characters.length !== 1) {
        return null;
    }
    const character = characters[0].segment;
    return /\p{Extended_Pictographic}|\p{Regional_Indicator}/u.test(character) ? character : null;
}

// How to open the emoji keyboard on this device.
export function emojiKeyboardHint() {
    if (window.matchMedia("(pointer: coarse)").matches) {
        return "Tap the 😀 key on your keyboard.";
    }
    if (/Mac/.test(navigator.userAgent)) {
        return "Press Ctrl + Cmd + Space to open the emoji picker.";
    }
    return "Press Win + . to open the emoji panel.";
}
