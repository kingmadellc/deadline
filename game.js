const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ============================================
// RESOLUTION SCALING SYSTEM
// ============================================
const displaySettings = {
    baseWidth: 640,
    baseHeight: 640,
    scale: 1,
    fullscreen: false,
    currentResolution: '640x640'
};

// Available resolutions with aspect ratio info
const RESOLUTIONS = {
    // Square resolutions (1:1)
    '640x640': { width: 640, height: 640, scale: 1, aspectRatio: '1:1' },
    '800x800': { width: 800, height: 800, scale: 1.25, aspectRatio: '1:1' },
    '960x960': { width: 960, height: 960, scale: 1.5, aspectRatio: '1:1' },
    '1024x1024': { width: 1024, height: 1024, scale: 1.6, aspectRatio: '1:1' },
    '1280x1280': { width: 1280, height: 1280, scale: 2, aspectRatio: '1:1' },
    // Widescreen resolutions (16:9)
    '1280x720': { width: 1280, height: 720, scale: 1.125, aspectRatio: '16:9' },
    '1920x1080': { width: 1920, height: 1080, scale: 1.6875, aspectRatio: '16:9' },
    // Steam Deck resolution (16:10)
    '1280x800': { width: 1280, height: 800, scale: 1.25, aspectRatio: '16:10' }
};

// Dynamically calculate tile size based on resolution and map height
function getTileSize() {
    const res = RESOLUTIONS[displaySettings.currentResolution] || RESOLUTIONS['640x640'];
    // Use height to determine tile size (maintains vertical tile count)
    return Math.floor(res.height / MAP_HEIGHT);
}

// Get current aspect ratio from resolution
function getCurrentAspectRatio() {
    const res = RESOLUTIONS[displaySettings.currentResolution] || RESOLUTIONS['640x640'];
    return res.aspectRatio || '1:1';
}

let TILE_SIZE = 32; // Will be updated dynamically
let MAP_WIDTH = 20; // Horizontal tiles (variable based on floor and aspect ratio)
let MAP_HEIGHT = 20; // Vertical tiles (variable based on floor)

// Load powerup images
const powerupImages = {
    speed: new Image(),
    knockout: new Image(),
    electric: new Image(),
    shield: new Image(),
    companion: new Image()
};
powerupImages.speed.src = 'powerup-speed.png';
powerupImages.knockout.src = 'powerup-knockout.png';
powerupImages.electric.src = 'powerup-electric.png';
// Garden/Dog park powerups - will fall back to drawn versions if images don't exist
powerupImages.shield.src = 'powerup-shield.png';
powerupImages.companion.src = 'powerup-companion.png';

// Atmospheric background images for different screens
const atmosphericBackgrounds = {
    // Title screen - dramatic office/building imagery (full rotation)
    titleScreen: [
        'atmosphere1.webp',
        'atmosphere2.jpg',
        'atmosphere3.webp',
        'atmosphere4.webp',
        'atmosphere5.webp',
        'atmosphere6.webp',
        'atmosphere7.webp',
        'atmosphere8.jpg',
        'atmosphere9.jpg',
        'atmosphere10.webp',
        'atmosphere11.jpg',
        'atmosphere12.jpg',
        'atmosphere13.jpg',
        'atmosphere14.webp',
        'atmosphere15.webp',
        'atmosphere16.webp',
        'atmosphere17.webp',
        'atmosphere18.webp',
        'atmosphere19.webp',
        'atmosphere20.webp',
        'atmosphere21.webp',
        'atmosphere22.webp',
        'atmosphere23.webp',
        'atmosphere24.webp',
        'atmosphere25.webp',
        'atmosphere26.webp',
        'atmosphere27.webp',
        'atmosphere28.jpg',
        'atmosphere29.webp',
        'atmosphere30.webp'
    ],
    // Level transitions - office interiors, descending feel
    levelTransition: [
        'atmosphere5.webp',   // Person walking toward explosion in office
        'atmosphere7.webp',   // Destroyed office with sunset
        'atmosphere10.webp',  // Person running through exploding office
        'atmosphere13.jpg',   // Person running through office
        'atmosphere2.jpg'     // Office interior with explosion
    ],
    // Game over - dramatic, intense imagery
    gameOver: [
        'atmosphere4.webp',   // Looking up at building exploding
        'atmosphere8.jpg',    // Looking down at falling building
        'atmosphere9.jpg',    // Person leaping from building
        'atmosphere12.jpg'    // Person reaching toward explosion
    ],
    // Victory - calmer, escape achieved
    victory: [
        'atmosphere1.webp',   // Office with sunset through windows
        'atmosphere3.webp',   // City skyline with sunset
        'atmosphere7.webp'    // Destroyed office aftermath
    ],
    // Pause screen - atmospheric office views
    pause: [
        'atmosphere7.webp',
        'atmosphere11.jpg',   // Multi-floor view
        'atmosphere1.webp'
    ]
};

// ============================================
// CHARACTER ASSET SYSTEM
// ============================================
const CHARACTER_ASSETS = {
    corporate_employee: {
        id: 'corporate_employee',
        name: 'Corporate Employee',
        description: 'Just trying to survive another day',
        unlocked: true,
        portrait: {
            src: 'assets/characters/corporate-employee-portrait.jpg',
            loaded: false,
            image: null
        },
        animation: {
            type: 'spritesheet',
            src: 'assets/characters/corporate-employee-spritesheet.png',
            loaded: false,
            image: null,
            frameCount: 8,
            frameWidth: 78,
            frameHeight: 78,
            frameDuration: 0.083  // ~12fps for smooth running
        },
        trailColor: {
            primary: '#00d2d3',
            secondary: '#00b8b8',
            glow: 'rgba(0, 210, 211, 0.6)'
        }
    },
    intern: {
        id: 'intern',
        name: 'The Intern',
        description: 'Gets coffee faster than anyone',
        unlockCondition: 'Complete a run without getting hit',
        portrait: {
            src: 'assets/characters/intern-portrait.jpg',
            loaded: false,
            image: null
        },
        animation: {
            type: 'spritesheet',
            src: 'assets/characters/intern-spritesheet.png',
            loaded: false,
            image: null,
            frameCount: 8,
            frameWidth: 78,
            frameHeight: 78,
            frameDuration: 0.083
        },
        trailColor: {
            primary: '#3498db',
            secondary: '#2980b9',
            glow: 'rgba(52, 152, 219, 0.6)'
        }
    },
    it_support: {
        id: 'it_support',
        name: 'IT Support',
        description: 'Have you tried turning it off and on?',
        unlockCondition: 'Zap 50 coworkers total',
        portrait: {
            src: 'assets/characters/it-support-portrait.webp',
            loaded: false,
            image: null
        },
        animation: {
            type: 'spritesheet',
            src: 'assets/characters/it-support-spritesheet.png',
            loaded: false,
            image: null,
            frameCount: 8,
            frameWidth: 78,
            frameHeight: 78,
            frameDuration: 0.083
        },
        trailColor: {
            primary: '#9b59b6',
            secondary: '#8e44ad',
            glow: 'rgba(155, 89, 182, 0.6)'
        }
    },
    hr_karen: {
        id: 'hr_karen',
        name: 'HR Karen',
        description: 'Would like to speak to the manager',
        unlockCondition: 'Punch 100 coworkers total',
        portrait: {
            src: 'assets/characters/hr-karen-portrait.jpg',
            loaded: false,
            image: null
        },
        animation: {
            type: 'spritesheet',
            src: 'assets/characters/hr-karen-spritesheet.png',
            loaded: false,
            image: null,
            frameCount: 8,
            frameWidth: 78,
            frameHeight: 78,
            frameDuration: 0.083
        },
        trailColor: {
            primary: '#c0392b',
            secondary: '#a93226',
            glow: 'rgba(192, 57, 43, 0.6)'
        }
    }
};

// Enemy/Coworker character assets (AI opponents)
const ENEMY_ASSETS = {
    // Generic coworker enemy (default)
    coworker: {
        id: 'coworker',
        name: 'Coworker',
        animation: {
            type: 'spritesheet',
            src: 'assets/characters/coworker-spritesheet.png',
            loaded: false,
            image: null,
            frameCount: 8,
            frameWidth: 78,
            frameHeight: 78,
            frameDuration: 0.083
        },
        trailColor: {
            primary: '#e74c3c',
            secondary: '#c0392b',
            glow: 'rgba(231, 76, 60, 0.6)'
        }
    }
};

// Enemy animation state tracking
const enemyAnimationStates = new Map();

// Currently selected character (defaults to corporate_employee)
let selectedCharacter = 'corporate_employee';

// Mapping from progression character IDs to asset IDs
const CHARACTER_ID_TO_ASSET = {
    'default': 'corporate_employee',
    'speedster': 'intern',
    'tank': 'it_support',
    'fighter': 'hr_karen',
    'ghost': 'corporate_employee'  // Ghost uses default sprite (no unique spritesheet)
};

// Character asset loader
const characterAssetLoader = {
    loadedCount: 0,
    totalCount: 0,

    async preloadAll() {
        const characters = Object.values(CHARACTER_ASSETS);
        const enemies = Object.values(ENEMY_ASSETS);
        this.totalCount = characters.length * 2 + enemies.length; // portraits + animations + enemy animations
        this.loadedCount = 0;

        const promises = [];

        // Load player character assets
        for (const char of characters) {
            // Load portrait
            promises.push(this.loadImage(char.portrait));

            // Load animation sprite sheet
            if (char.animation.type === 'spritesheet') {
                promises.push(this.loadImage(char.animation));
            }
        }

        // Load enemy assets
        for (const enemy of enemies) {
            if (enemy.animation.type === 'spritesheet') {
                promises.push(this.loadImage(enemy.animation));
            }
        }

        await Promise.allSettled(promises);
        console.log(`Character assets loaded: ${this.loadedCount}/${this.totalCount}`);
        return this.loadedCount;
    },

    loadImage(assetConfig) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                assetConfig.image = img;
                assetConfig.loaded = true;
                this.loadedCount++;
                resolve(true);
            };
            img.onerror = () => {
                assetConfig.loaded = false;
                console.warn(`Failed to load character asset: ${assetConfig.src}`);
                resolve(false);
            };
            img.src = assetConfig.src;
        });
    }
};

// Animation state tracking for sprite-based characters
const characterAnimationState = {
    player: { frame: 0, lastUpdate: 0, isMoving: false, facingDirection: 1 }
};

// Smart background cycling - tracks which images have been shown per category
const backgroundCycleState = {};

// Get next background from a category (no repeats until all shown)
function getRandomBackground(category) {
    const backgrounds = atmosphericBackgrounds[category];
    if (!backgrounds || backgrounds.length === 0) return '';

    // Initialize cycle state for this category if needed
    if (!backgroundCycleState[category] || backgroundCycleState[category].length === 0) {
        // Shuffle array to randomize order
        backgroundCycleState[category] = [...backgrounds].sort(() => Math.random() - 0.5);
    }

    // Pop the next image from the shuffled queue
    return backgroundCycleState[category].pop();
}

// Set title screen background to next atmospheric image in cycle
function setTitleBackground() {
    const bg = getRandomBackground('titleScreen');
    const messageEl = document.getElementById('message');
    if (messageEl) {
        messageEl.style.backgroundImage = `url('${bg}')`;
    }
}

function setResolution(resKey) {
    const res = RESOLUTIONS[resKey];
    if (!res) return;

    displaySettings.currentResolution = resKey;
    displaySettings.scale = res.scale;

    // Update canvas size
    canvas.width = res.width;
    canvas.height = res.height;

    // Recalculate tile size
    TILE_SIZE = getTileSize();

    // Save preference
    saveSettings();

    console.log(`Resolution set to ${resKey}, tile size: ${TILE_SIZE}`);
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log('Fullscreen request failed:', err);
        });
        displaySettings.fullscreen = true;
    } else {
        document.exitFullscreen();
        displaySettings.fullscreen = false;
    }
    saveSettings();
}

// Handle fullscreen change events
document.addEventListener('fullscreenchange', () => {
    displaySettings.fullscreen = !!document.fullscreenElement;
});

// ============================================
// AUDIO SYSTEM
// ============================================
const AudioManager = {
    context: null,
    masterGain: null,
    musicGain: null,
    sfxGain: null,
    initialized: false,
    sounds: {},
    music: null,
    musicPlaying: false,
    musicSource: null,
    musicBuffers: {},
    currentTrack: null,
    musicFadeTimeout: null,

    // Initialize audio context (must be called after user interaction)
    init() {
        if (this.initialized) return;

        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();

            // Create gain nodes for volume control
            this.masterGain = this.context.createGain();
            this.masterGain.connect(this.context.destination);

            this.musicGain = this.context.createGain();
            this.musicGain.connect(this.masterGain);

            this.sfxGain = this.context.createGain();
            this.sfxGain.connect(this.masterGain);

            // Set initial volumes from settings
            this.setMasterVolume(settings.masterVolume);
            this.setMusicVolume(settings.musicVolume);
            this.setSfxVolume(settings.sfxVolume);

            this.initialized = true;
            console.log('Audio system initialized');

            // Generate procedural sounds
            this.generateSounds();
        } catch (e) {
            console.log('Audio initialization failed:', e);
        }
    },

    // Generate procedural AAA CINEMATIC sounds (professional game audio design)
    generateSounds() {
        // Footstep - muffled carpet thud (low freq, quick decay)
        this.sounds.footstep = this.createSound((t) => {
            const freq = 180 + Math.random() * 40;
            const thud = Math.sin(t * freq * Math.PI * 2) * Math.exp(-t * 50);
            const carpet = (Math.random() * 2 - 1) * Math.exp(-t * 80) * 0.3;
            return thud * 0.5 + carpet;
        }, 0.1);

        // Powerup collect - tactical acquisition (descending, slightly ominous)
        this.sounds.powerup = this.createSound((t) => {
            const baseFreq = 500 - t * 300;
            const main = Math.sin(t * baseFreq * Math.PI * 2);
            const dissonance = Math.sin(t * (baseFreq * 1.414) * Math.PI * 2) * 0.2;
            const envelope = Math.exp(-t * 4) * Math.min(1, t * 20);
            return (main * 0.6 + dissonance) * envelope;
        }, 0.35);

        // === PUNCH VARIANTS - AAA Cinematic Impact Design ===
        // 5-layer surgical frequency separation: Click (5-8kHz) + Thwack (120-180Hz) + Meat (300-600Hz) + Noise + Sub (40-60Hz)

        // PUNCH 1 - HEAVY DEVASTATOR (0.25s)
        this.sounds.punch1 = this.createSound((t) => {
            // === TRANSIENT CLICK (5-8 kHz) - The "snap" ===
            const clickFreq = 6000 + Math.random() * 1000;
            const click = Math.sin(t * clickFreq * Math.PI * 2);
            const clickEnv = Math.exp(-t * 80);

            // === BODY THWACK (120-180 Hz) - The "felt" impact ===
            const thwackFreq = 150 - t * 40;
            const thwack = Math.sin(t * thwackFreq * Math.PI * 2);
            const thwack2 = Math.sin(t * thwackFreq * 2 * Math.PI * 2) * 0.3;
            const thwackEnv = Math.exp(-t * 15);

            // === MID MEAT (300-600 Hz) - Character/tone with saturation ===
            const meatFreq = 400 - t * 150;
            const meat = Math.sin(t * meatFreq * Math.PI * 2) * 0.7;
            const meatSat = Math.tanh(meat * 1.5) * 0.8;
            const meatEnv = Math.exp(-t * 20);

            // === PINK NOISE TEXTURE - Realism ===
            const noise = (Math.random() * 2 - 1);
            const pinkNoise = noise * (1 / (1 + t * 50));
            const noiseEnv = Math.exp(-t * 30);

            // === SUB IMPACT (40-60 Hz) - Felt not heard ===
            const sub = Math.sin(t * 50 * Math.PI * 2);
            const subEnv = Math.exp(-t * 12);

            // ATTACK: 3ms to full (professional standard)
            const attack = Math.min(1, t * 333);

            return attack * (
                click * clickEnv * 0.25 +
                (thwack + thwack2) * thwackEnv * 0.35 +
                meatSat * meatEnv * 0.2 +
                pinkNoise * noiseEnv * 0.1 +
                sub * subEnv * 0.1
            );
        }, 0.25);

        // PUNCH 2 - QUICK SNAP JAB (0.15s)
        this.sounds.punch2 = this.createSound((t) => {
            const click = Math.sin(t * 7500 * Math.PI * 2) * Math.exp(-t * 120);
            const thwack = Math.sin(t * 180 * Math.PI * 2) * Math.exp(-t * 25);
            const meat = Math.tanh(Math.sin(t * 600 * Math.PI * 2) * 1.3) * Math.exp(-t * 35);
            const noise = (Math.random() * 2 - 1) * Math.exp(-t * 50) * 0.15;
            const attack = Math.min(1, t * 500);

            return attack * (click * 0.3 + thwack * 0.35 + meat * 0.25 + noise);
        }, 0.15);

        // PUNCH 3 - MEATY BODY BLOW (0.22s)
        this.sounds.punch3 = this.createSound((t) => {
            const click = Math.sin(t * 4500 * Math.PI * 2) * Math.exp(-t * 60);
            const thwack = Math.sin(t * 100 * Math.PI * 2) * Math.exp(-t * 10);
            const thwack2 = Math.sin(t * 200 * Math.PI * 2) * 0.4 * Math.exp(-t * 14);
            const meat = Math.tanh(Math.sin(t * 280 * Math.PI * 2) * 1.8) * Math.exp(-t * 16);
            const sub = Math.sin(t * 40 * Math.PI * 2) * Math.exp(-t * 8);
            const cloth = Math.sin(t * 800 * Math.PI * 2) * (Math.random() * 0.5 + 0.5) * Math.exp(-t * 20);
            const attack = Math.min(1, t * 400);

            return attack * (click * 0.15 + (thwack + thwack2) * 0.35 + meat * 0.2 + sub * 0.15 + cloth * 0.15);
        }, 0.22);

        // Punch - legacy/fallback
        this.sounds.punch = this.sounds.punch1;

        // Electric zap - harsh industrial crackle
        this.sounds.zap = this.createSound((t) => {
            const buzz = Math.sin(t * 55 * Math.PI * 2) * Math.sin(t * 2800 * Math.PI * 2);
            const crackle = Math.pow(Math.random(), 2.5) * 2 - 1;
            const hum = Math.sin(t * 110 * Math.PI * 2);
            const envelope = Math.exp(-t * 2.5) * Math.min(1, t * 15);
            return (buzz * 0.35 + crackle * 0.4 + hum * 0.25) * envelope;
        }, 0.35);

        // Timer warning - dread-building tritone pulse
        this.sounds.warning = this.createSound((t) => {
            const note1 = Math.sin(t * 392 * Math.PI * 2);
            const note2 = Math.sin(t * 554 * Math.PI * 2);
            const pulse = Math.sin(t * 6 * Math.PI * 2) * 0.4 + 0.6;
            const envelope = Math.exp(-t * 1.5);
            return (note1 + note2 * 0.7) * pulse * envelope * 0.4;
        }, 0.4);

        // Floor collapse - deep sub-bass rumble with debris
        this.sounds.collapse = this.createSound((t) => {
            const subBass = Math.sin(t * 22 * Math.PI * 2);
            const rumble = Math.sin(t * 45 * Math.PI * 2) + Math.sin(t * 65 * Math.PI * 2);
            const debris = Math.pow(Math.random(), 1.8) * 2 - 1;
            const creak = Math.sin(t * 200 * Math.PI * 2) * Math.exp(-t * 3) * 0.2;
            const envelope = Math.min(1, t * 2.5) * Math.exp(-t * 0.7);
            return (subBass * 0.35 + rumble * 0.25 + debris * 0.3 + creak) * envelope;
        }, 1.2);

        // === EXIT DOOR - Cinematic Horror Creak (1.0s) ===
        this.sounds.exit = this.createSound((t) => {
            // === SUB-BASS DREAD (25-40 Hz) ===
            const subFreq = 30 + Math.sin(t * 0.8 * Math.PI * 2) * 5;
            const sub = Math.sin(t * subFreq * Math.PI * 2) * 0.2;
            const subEnv = Math.pow(Math.max(0, 1 - t / 1.0), 0.3);

            // === WOOD CREAK (150-400 Hz) - Friction stick-slip ===
            const creakBase = 180 + t * 80;
            const warble = Math.sin(t * 4.2 * Math.PI * 2) * 20 +
                           Math.sin(t * 7.3 * Math.PI * 2) * 12;
            const creakFreq = creakBase + warble;

            // Odd harmonics = harsh wooden timbre
            let creak = Math.sin(t * creakFreq * Math.PI * 2) * 0.4;
            creak += Math.sin(t * creakFreq * 3 * Math.PI * 2) * 0.2;
            creak += Math.sin(t * creakFreq * 5 * Math.PI * 2) * 0.1;
            creak += Math.sin(t * creakFreq * 7 * Math.PI * 2) * 0.05;

            // Soft saturation for wood resonance
            creak = Math.tanh(creak * 2) * 0.6;

            // === MULTIPLE CREAK EVENTS ===
            const creak1Env = (1 - Math.exp(-t * 8)) * Math.exp(-Math.max(0, t - 0.2) * 3);
            const creak2Start = 0.3;
            const creak2Env = (1 - Math.exp(-Math.max(0, t - creak2Start) * 6)) *
                              Math.exp(-Math.max(0, t - creak2Start - 0.15) * 2.5) *
                              (t > creak2Start ? 0.7 : 0);
            const creak3Start = 0.6;
            const creak3Env = (1 - Math.exp(-Math.max(0, t - creak3Start) * 5)) *
                              Math.exp(-Math.max(0, t - creak3Start - 0.1) * 2) *
                              (t > creak3Start ? 0.5 : 0);

            const creakEnv = creak1Env + creak2Env + creak3Env;

            // === HIGH FREQUENCY SQUEAK (2-4 kHz) - Hinge ===
            const squeakFreq = 2800 + Math.sin(t * 11 * Math.PI * 2) * 400;
            const squeak = Math.sin(t * squeakFreq * Math.PI * 2) * 0.15;
            const squeakEnv = Math.exp(-Math.pow((t - 0.4) * 8, 2)) * 0.4;

            // === AIR MOVEMENT ===
            const airNoise = (Math.random() * 2 - 1);
            const air = airNoise * Math.sin(t * 600 * Math.PI * 2) * 0.1;
            const airEnv = Math.sin(t * Math.PI) * Math.max(0, 1 - t);

            return (
                sub * subEnv +
                creak * creakEnv * 0.5 +
                squeak * squeakEnv +
                air * airEnv
            ) * 0.9;
        }, 1.0);

        // Player hit - visceral impact with dissonant ring
        this.sounds.hit = this.createSound((t) => {
            const impact = Math.sin(t * 80 * Math.PI * 2) * Math.exp(-t * 8);
            const dissonant = Math.sin(t * 180 * Math.PI * 2) * Math.sin(t * 195 * Math.PI * 2);
            const noise = (Math.random() * 2 - 1) * Math.exp(-t * 20);
            return impact * 0.5 + dissonant * Math.exp(-t * 10) * 0.3 + noise * 0.2;
        }, 0.25);

        // Menu select - subtle mechanical click
        this.sounds.select = this.createSound((t) => {
            const click = Math.sin(t * 450 * Math.PI * 2) * Math.exp(-t * 25);
            const resonance = Math.sin(t * 900 * Math.PI * 2) * Math.exp(-t * 40) * 0.3;
            return click + resonance;
        }, 0.08);

        // Victory - tense relief in minor key
        this.sounds.victory = this.createSound((t) => {
            const notes = [220, 262, 330, 392];
            const noteIndex = Math.floor(t * 5) % 4;
            const freq = notes[noteIndex];
            const vibrato = Math.sin(t * 5 * Math.PI * 2) * 3;
            const tone = Math.sin(t * (freq + vibrato) * Math.PI * 2);
            const envelope = (1 - (t % 0.2) * 3) * Math.min(1, (0.8 - t) * 3) * Math.max(0, 1 - t * 0.8);
            return tone * envelope * 0.6;
        }, 0.8);

        // === POWERUP-SPECIFIC SOUNDS ===

        // === SPEED COLLECT - Doppler Acceleration (0.35s) ===
        this.sounds.speedCollect = this.createSound((t) => {
            // Triple ascending tones with exponential sweep
            const freq1 = 300 + Math.pow(t / 0.35, 1.5) * 600;
            const tone1 = Math.sin(t * freq1 * Math.PI * 2);
            const env1 = (1 - Math.exp(-t * 50)) * Math.exp(-Math.max(0, t - 0.25) * 10);

            const t2 = Math.max(0, t - 0.05);
            const freq2 = 500 + Math.pow(t2 / 0.3, 1.5) * 1000;
            const tone2 = Math.sin(t * freq2 * Math.PI * 2) * (t > 0.05 ? 1 : 0);
            const env2 = (1 - Math.exp(-t2 * 40)) * Math.exp(-Math.max(0, t2 - 0.2) * 8);

            const t3 = Math.max(0, t - 0.1);
            const freq3 = 800 + Math.pow(t3 / 0.25, 1.5) * 2200;
            const tone3 = Math.sin(t * freq3 * Math.PI * 2) * (t > 0.1 ? 1 : 0);
            const env3 = (1 - Math.exp(-t3 * 35)) * Math.exp(-Math.max(0, t3 - 0.15) * 6);

            // Doppler whoosh
            const whooshFreq = 1200 + Math.sin(t * 6 * Math.PI * 2) * 400;
            const whoosh = (Math.random() * 2 - 1) * Math.sin(t * whooshFreq * Math.PI * 2);
            const whooshEnv = Math.sin(t / 0.35 * Math.PI) * 0.15;

            // Sparkle transients
            const sparkle = Math.sin(t * 8000 * Math.PI * 2) *
                            (Math.sin(t * 23 * Math.PI * 2) > 0.7 ? 1 : 0);
            const sparkleEnv = Math.exp(-t * 4) * 0.1;

            // Soft saturation for warmth
            const tones = tone1 * env1 * 0.35 + tone2 * env2 * 0.3 + tone3 * env3 * 0.25;
            const saturated = Math.tanh(tones * 1.5) * 0.7;

            return saturated + whoosh * whooshEnv + sparkle * sparkleEnv;
        }, 0.35);

        // === ELECTRIC COLLECT - Tesla Coil Discharge (0.3s) ===
        this.sounds.electricCollect = this.createSound((t) => {
            // Arc discharge crackle (6-12 kHz)
            const arcFreq = 8000 + Math.sin(t * 200 * Math.PI * 2) * 3000;
            const arc = Math.sin(t * arcFreq * Math.PI * 2);
            const arcEnv = Math.exp(-t * 5);

            // Stochastic zap bursts
            const zap1 = Math.sin(t * 9000 * Math.PI * 2) * Math.exp(-Math.pow((t - 0.015) * 60, 2));
            const zap2 = Math.sin(t * 11000 * Math.PI * 2) * Math.exp(-Math.pow((t - 0.06) * 50, 2));
            const zap3 = Math.sin(t * 7000 * Math.PI * 2) * Math.exp(-Math.pow((t - 0.11) * 45, 2));
            const zap4 = Math.sin(t * 10000 * Math.PI * 2) * Math.exp(-Math.pow((t - 0.17) * 40, 2));
            const zap5 = Math.sin(t * 8500 * Math.PI * 2) * Math.exp(-Math.pow((t - 0.23) * 35, 2));

            // Crackling noise
            const noise = Math.pow(Math.random(), 2) * 2 - 1;
            const noiseGate = Math.abs(Math.sin(t * 120 * Math.PI * 2));
            const crackle = noise * noiseGate;
            const crackleEnv = Math.exp(-t * 6) * 0.4;

            // 60 Hz power hum
            const hum = Math.sin(t * 60 * Math.PI * 2);
            const hum2 = Math.sin(t * 120 * Math.PI * 2) * 0.5;
            const humEnv = Math.exp(-t * 3) * 0.15;

            // Amplitude flutter
            const flutter = 0.6 + Math.sin(t * 300 * Math.PI * 2) * 0.4;

            // Positive feedback tone (reward feel)
            const rewardFreq = 1000 + t * 800;
            const reward = Math.sin(t * rewardFreq * Math.PI * 2);
            const rewardEnv = (1 - Math.exp(-t * 30)) * Math.exp(-Math.max(0, t - 0.2) * 8) * 0.2;

            return flutter * (
                arc * arcEnv * 0.2 +
                (zap1 + zap2 + zap3 + zap4 + zap5) * 0.35 +
                crackle * crackleEnv +
                (hum + hum2) * humEnv +
                reward * rewardEnv
            ) * 0.8;
        }, 0.3);

        // === GHOST COLLECT - Ethereal Phase (0.5s) ===
        this.sounds.ghostCollect = this.createSound((t) => {
            // Slow attack (~200ms)
            const attack = 1 - Math.exp(-t * 5);

            // Hollow resonance (pure sines, 5th intervals)
            const baseFreq = 800 + Math.sin(t * 1.5 * Math.PI * 2) * 50;
            const tone1 = Math.sin(t * baseFreq * Math.PI * 2);
            const tone2 = Math.sin(t * baseFreq * 1.5 * Math.PI * 2) * 0.5;
            const tone3 = Math.sin(t * baseFreq * 2 * Math.PI * 2) * 0.25;
            const tone4 = Math.sin(t * baseFreq * 3 * Math.PI * 2) * 0.1;

            // Phase chorus (detuned)
            const detune = 8;
            const chorus1 = Math.sin(t * (baseFreq + detune) * Math.PI * 2) * 0.3;
            const chorus2 = Math.sin(t * (baseFreq - detune) * Math.PI * 2) * 0.3;

            // Breathy whisper
            const breath = (Math.random() * 2 - 1);
            const whisper = breath * Math.sin(t * 3000 * Math.PI * 2) * 0.1;
            const whisperEnv = Math.sin(t / 0.5 * Math.PI) * attack;

            // Shimmer
            const shimmer = Math.sin(t * 6000 * Math.PI * 2) *
                            (0.5 + Math.sin(t * 8 * Math.PI * 2) * 0.5) * 0.05;

            // Envelope
            const sustain = Math.exp(-Math.max(0, t - 0.3) * 3);
            const wobble = 1 + Math.sin(t * 4 * Math.PI * 2) * 0.05;
            const env = attack * sustain * wobble;

            const tones = (tone1 + tone2 + tone3 + tone4 + chorus1 + chorus2);

            return (tones * env * 0.4 + whisper * whisperEnv + shimmer * env) * 0.8;
        }, 0.5);

        // === KNOCKOUT COLLECT - Power Charge (0.4s) ===
        this.sounds.knockoutCollect = this.createSound((t) => {
            // Rising fundamental (100->600 Hz exponential)
            const baseFreq = 100 + Math.pow(t / 0.4, 2) * 500;
            const fundamental = Math.sin(t * baseFreq * Math.PI * 2);

            // Harmonics building in
            const h2Gain = Math.min(1, t * 3);
            const h3Gain = Math.min(1, Math.max(0, t - 0.1) * 4);
            const h4Gain = Math.min(1, Math.max(0, t - 0.2) * 5);
            const h5Gain = Math.min(1, Math.max(0, t - 0.25) * 6);

            const harm2 = Math.sin(t * baseFreq * 2 * Math.PI * 2) * h2Gain * 0.4;
            const harm3 = Math.sin(t * baseFreq * 3 * Math.PI * 2) * h3Gain * 0.25;
            const harm4 = Math.sin(t * baseFreq * 4 * Math.PI * 2) * h4Gain * 0.15;
            const harm5 = Math.sin(t * baseFreq * 5 * Math.PI * 2) * h5Gain * 0.1;

            // Accelerating pulse (6->36 Hz)
            const pulseRate = 6 + Math.pow(t / 0.4, 2) * 30;
            const pulse = 0.5 + Math.sin(t * pulseRate * Math.PI * 2) * 0.5;

            // Bass rumble
            const rumble = Math.sin(t * 50 * Math.PI * 2) * 0.2;
            const rumbleEnv = Math.max(0, 1 - t * 2);

            // Climax burst (final 0.08s)
            const climaxT = Math.max(0, t - 0.32);
            const climaxFreq = 2000 + climaxT * 4000;
            const climax = Math.sin(t * climaxFreq * Math.PI * 2);
            const climaxEnv = (1 - Math.exp(-climaxT * 40)) * Math.exp(-climaxT * 15) * (t > 0.32 ? 0.4 : 0);

            // Energy crackle
            const crackle = (Math.random() * 2 - 1) * Math.sin(t * 4000 * Math.PI * 2);
            const crackleEnv = Math.min(1, t * 5) * 0.1;

            // Saturate combined signal
            const charge = fundamental * 0.3 + harm2 + harm3 + harm4 + harm5;
            const saturated = Math.tanh(charge * pulse * 2) * 0.5;

            const env = (1 - Math.exp(-t * 15)) * Math.exp(-Math.max(0, t - 0.35) * 10);

            return (
                saturated * env +
                rumble * rumbleEnv +
                climax * climaxEnv +
                crackle * crackleEnv
            ) * 0.85;
        }, 0.4);

        // === POWERUP EXPIRE - System Failure (0.4s) ===
        this.sounds.powerupExpire = this.createSound((t) => {
            // Descending fundamental (600->80 Hz)
            const dropCurve = Math.exp(-t * 5);
            const baseFreq = 80 + 520 * dropCurve;
            const fundamental = Math.sin(t * baseFreq * Math.PI * 2);

            // Harmonics dropping out
            const h2Decay = Math.max(0, 1 - t * 4);
            const h3Decay = Math.max(0, 1 - t * 6);
            const h4Decay = Math.max(0, 1 - t * 8);

            const harm2 = Math.sin(t * baseFreq * 2 * Math.PI * 2) * h2Decay * 0.4;
            const harm3 = Math.sin(t * baseFreq * 3 * Math.PI * 2) * h3Decay * 0.25;
            const harm4 = Math.sin(t * baseFreq * 4 * Math.PI * 2) * h4Decay * 0.15;

            // Slowing warble (power failing)
            const warbleRate = Math.max(2, 20 - t * 45);
            const warble = 1 + Math.sin(t * warbleRate * Math.PI * 2) * 0.15;

            // Stutter (power cutting after 0.2s)
            const stutter = t > 0.2 ?
                (Math.sin(t * 50 * Math.PI * 2) > 0 ? 1 : 0.2) : 1;

            // Final thunk (system off)
            const thunkT = Math.max(0, t - 0.32);
            const thunk = Math.sin(thunkT * 60 * Math.PI * 2);
            const thunkEnv = (1 - Math.exp(-thunkT * 50)) * Math.exp(-thunkT * 12) * (t > 0.32 ? 0.4 : 0);

            // Dying crackle
            const crackle = (Math.random() * 2 - 1) * 0.15;
            const crackleEnv = Math.exp(-t * 3) * stutter;

            // Envelope
            const env = Math.exp(-t * 3) * warble * stutter;

            const tones = fundamental * 0.35 + harm2 + harm3 + harm4;

            return (
                tones * env +
                thunk * thunkEnv +
                crackle * crackleEnv
            ) * 0.75;
        }, 0.4);

        // Door open - mechanical slide with pneumatic hiss
        this.sounds.doorOpen = this.createSound((t) => {
            const slide = Math.sin(t * (60.0 + t * 100.0) * Math.PI * 2) * 0.4;
            const hiss = Math.sin(t * 31.0) * Math.sin(t * 2000.0 * Math.PI * 2) * 0.3 * Math.exp(-t * 6.0);
            const click = Math.sin(t * 400.0 * Math.PI * 2) * Math.exp(-Math.pow((t - 0.35) * 30.0, 2)) * 0.5;
            return (slide + hiss + click) * Math.exp(-t * 3.0);
        }, 0.4);

        console.log('AAA cinematic sounds generated');
    },


    // Create a sound buffer from a generator function
    createSound(generator, duration) {
        if (!this.context) return null;

        const sampleRate = this.context.sampleRate;
        const samples = Math.floor(sampleRate * duration);
        const buffer = this.context.createBuffer(1, samples, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < samples; i++) {
            const t = i / sampleRate;
            data[i] = generator(t) * 0.5; // Scale to prevent clipping
        }

        return buffer;
    },

    // Play a sound effect
    play(soundName, volume = 1.0) {
        if (!this.initialized || !this.sounds[soundName]) return;

        try {
            const source = this.context.createBufferSource();
            source.buffer = this.sounds[soundName];

            const gainNode = this.context.createGain();
            gainNode.gain.value = volume;

            source.connect(gainNode);
            gainNode.connect(this.sfxGain);
            source.start();
        } catch (e) {
            // Ignore audio errors silently
        }
    },

    // Play a positional/spatial sound effect (pans left/right based on position)
    playPositional(soundName, sourceX, sourceY, playerX, playerY, volume = 1.0, maxDistance = 10) {
        if (!this.initialized || !this.sounds[soundName]) return;
        if (!settings.audioProximityCues) return; // Respect user setting

        try {
            // Calculate distance and pan
            const dx = sourceX - playerX;
            const dy = sourceY - playerY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Volume falls off with distance
            const distanceFactor = Math.max(0, 1 - (distance / maxDistance));
            if (distanceFactor <= 0) return; // Too far away

            // Pan based on horizontal offset (-1 = full left, 1 = full right)
            const pan = Math.max(-1, Math.min(1, dx / 8));

            const source = this.context.createBufferSource();
            source.buffer = this.sounds[soundName];

            const gainNode = this.context.createGain();
            gainNode.gain.value = volume * distanceFactor;

            // Create stereo panner for spatial effect
            const panner = this.context.createStereoPanner();
            panner.pan.value = pan;

            source.connect(gainNode);
            gainNode.connect(panner);
            panner.connect(this.sfxGain);
            source.start();
        } catch (e) {
            // Ignore audio errors silently
        }
    },

    // Play heartbeat pulse (for low timer tension)
    playHeartbeat(intensity = 1.0) {
        if (!this.initialized || !this.sounds.heartbeat) return;
        if (!settings.audioProximityCues) return;

        try {
            const source = this.context.createBufferSource();
            source.buffer = this.sounds.heartbeat;

            const gainNode = this.context.createGain();
            gainNode.gain.value = 0.4 * intensity;

            source.connect(gainNode);
            gainNode.connect(this.sfxGain);
            source.start();
        } catch (e) {
            // Ignore audio errors silently
        }
    },

    // Play a random punch variant for variety
    playRandomPunch(volume = 1.0) {
        const variants = ['punch1', 'punch2', 'punch3'];
        const randomVariant = variants[Math.floor(Math.random() * variants.length)];
        this.play(randomVariant, volume);
    },

    // Set master volume (0-1)
    setMasterVolume(value) {
        if (this.masterGain) {
            this.masterGain.gain.value = value;
        }
    },

    // Set music volume (0-1)
    setMusicVolume(value) {
        if (this.musicGain) {
            this.musicGain.gain.value = value;
        }
    },

    // Set SFX volume (0-1)
    setSfxVolume(value) {
        if (this.sfxGain) {
            this.sfxGain.gain.value = value;
        }
    },

    // Resume audio context (required after user interaction on some browsers)
    resume() {
        if (this.context && this.context.state === 'suspended') {
            this.context.resume();
        }
    },

    // ============================================
    // BACKGROUND MUSIC SYSTEM
    // ============================================

    // Load a music track (async)
    async loadMusic(trackName) {
        if (!this.initialized || this.musicBuffers[trackName]) return;

        try {
            const response = await fetch(`music-${trackName}.mp3`);
            if (!response.ok) {
                console.log(`Music track not found: music-${trackName}.mp3`);
                return;
            }
            const arrayBuffer = await response.arrayBuffer();
            this.musicBuffers[trackName] = await this.context.decodeAudioData(arrayBuffer);
            console.log(`Music loaded: ${trackName}`);
        } catch (e) {
            console.log(`Failed to load music: ${trackName}`, e);
        }
    },

    // Play a music track
    playMusic(trackName, loop = true, fadeInDuration = 1.0) {
        if (!this.initialized) return;

        // If same track is already playing, don't restart
        if (this.currentTrack === trackName && this.musicPlaying) return;

        // Stop current music with fade
        if (this.musicPlaying) {
            this.stopMusic(0.5);
        }

        // Check if track is loaded
        const buffer = this.musicBuffers[trackName];
        if (!buffer) {
            console.log(`Music not loaded: ${trackName}`);
            return;
        }

        // Clear any pending fade timeout
        if (this.musicFadeTimeout) {
            clearTimeout(this.musicFadeTimeout);
            this.musicFadeTimeout = null;
        }

        // Create new source
        this.musicSource = this.context.createBufferSource();
        this.musicSource.buffer = buffer;
        this.musicSource.loop = loop;
        this.musicSource.connect(this.musicGain);

        // Fade in
        const targetVolume = settings.musicVolume || 0.5;
        this.musicGain.gain.setValueAtTime(0, this.context.currentTime);
        this.musicGain.gain.linearRampToValueAtTime(
            targetVolume,
            this.context.currentTime + fadeInDuration
        );

        this.musicSource.start();
        this.musicPlaying = true;
        this.currentTrack = trackName;
        console.log(`Playing music: ${trackName}`);
    },

    // Stop music with optional fade out
    stopMusic(fadeOutDuration = 1.0) {
        if (!this.musicSource || !this.musicPlaying) return;

        const source = this.musicSource;

        // Fade out
        this.musicGain.gain.linearRampToValueAtTime(
            0,
            this.context.currentTime + fadeOutDuration
        );

        // Stop after fade completes
        this.musicFadeTimeout = setTimeout(() => {
            try {
                source.stop();
            } catch (e) {
                // Source may already be stopped
            }
        }, fadeOutDuration * 1000);

        this.musicSource = null;
        this.musicPlaying = false;
        this.currentTrack = null;
    },

    // Preload all music tracks
    async preloadAllMusic() {
        const tracks = ['menu', 'gameplay', 'victory', 'gameover'];
        for (const track of tracks) {
            await this.loadMusic(track);
        }
    }
};

// ============================================
// SCREEN SHAKE SYSTEM
// ============================================
const screenShake = {
    intensity: 0,
    duration: 0,
    offsetX: 0,
    offsetY: 0,

    // Trigger screen shake
    trigger(intensity, duration) {
        if (!settings.screenShake) return;

        // Don't override stronger shakes
        if (this.intensity < intensity) {
            this.intensity = intensity;
            this.duration = duration;
        }
    },

    // Update shake effect (call in game loop)
    update(deltaTime) {
        if (this.duration > 0) {
            this.offsetX = (Math.random() - 0.5) * this.intensity * 2;
            this.offsetY = (Math.random() - 0.5) * this.intensity * 2;
            this.duration -= deltaTime;
            this.intensity *= 0.92; // Decay
        } else {
            this.offsetX = 0;
            this.offsetY = 0;
            this.intensity = 0;
        }
    }
};

// Auto-detect best resolution based on screen size and aspect ratio
function autoDetectResolution() {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const aspectRatio = screenWidth / screenHeight;

    // Detect widescreen aspect ratios
    if (aspectRatio >= 1.7 && aspectRatio <= 1.8) {
        // 16:9 aspect ratio (ROG Ally, standard monitors)
        if (screenHeight >= 1080) return '1920x1080';
        return '1280x720';
    } else if (aspectRatio >= 1.55 && aspectRatio < 1.7) {
        // 16:10 aspect ratio (Steam Deck)
        return '1280x800';
    }

    // Fall back to square resolution detection for 1:1 displays
    const minDim = Math.min(screenWidth, screenHeight);
    const targetSize = minDim * 0.85;

    let bestRes = '640x640';
    for (const [key, res] of Object.entries(RESOLUTIONS)) {
        if (res.aspectRatio === '1:1' && res.width <= targetSize) {
            bestRes = key;
        }
    }

    return bestRes;
}

// Get base map height based on floor number - INCREASED DIFFICULTY
function getBaseMapHeightForFloor(floor) {
    // DIFFICULTY INCREASE: Larger maps throughout, no easy small maps
    // Floor 23-20: Start at 22 tiles high - challenging from the start
    if (floor >= 20) return 22;
    // Floors 19-15: 24 tiles high - medium-large
    if (floor >= 15) return 24;
    // Floors 14-8: 26 tiles high - large maps
    if (floor >= 8) return 26;
    // Floors 7-4: 28 tiles high - huge maps
    if (floor >= 4) return 28;
    // Floors 3-1: 30 tiles high - massive finale
    return 30;
}

// Get map dimensions based on floor number and current aspect ratio
function getMapDimensionsForFloor(floor) {
    const baseHeight = getBaseMapHeightForFloor(floor);
    const aspectRatio = getCurrentAspectRatio();

    let width;
    if (aspectRatio === '16:9') {
        // 16:9 widescreen - wider maps (use floor to avoid canvas overflow)
        width = Math.floor(baseHeight * 16 / 9);
    } else if (aspectRatio === '16:10') {
        // 16:10 (Steam Deck) - slightly wider maps (use floor to avoid canvas overflow)
        width = Math.floor(baseHeight * 16 / 10);
    } else {
        // Square (1:1)
        width = baseHeight;
    }

    return { width, height: baseHeight };
}

// Legacy function for backwards compatibility
function getMapSizeForFloor(floor) {
    return getBaseMapHeightForFloor(floor);
}

// Get number of enemies for floor - scales with map area
function getEnemyCountForFloor(floor) {
    const dims = getMapDimensionsForFloor(floor);
    const totalTiles = dims.width * dims.height;
    // Base enemies scales with map area
    let baseEnemies = Math.floor(totalTiles / 100);
    // Add more as floors descend
    baseEnemies += Math.floor((23 - floor) / 3);
    // Cap at reasonable number
    return Math.min(baseEnemies, 15);
}

// Get number of fires that can spawn on floor
function getMaxFiresForFloor(floor) {
    // Fires now start from floor 23 (level 1) with gradual increase
    if (floor >= 22) return 1;   // Floors 23-22: 1 fire (intro to mechanic)
    if (floor >= 20) return 2;   // Floors 21-20: 2 fires
    if (floor >= 15) return 3;   // Floors 19-15: 3 fires
    if (floor >= 10) return 5;   // Floors 14-10: 5 fires
    if (floor >= 5) return 7;    // Floors 9-5: 7 fires
    return 10;                    // Floors 4-1: 10 fires (inferno finale)
}

// Enhanced 8-bit color palette
const COLORS = {
    // Walls - MODERN OFFICE PARTITIONS
    wallDark: '#1a1a1a',       // Deep shadow
    wallMid: '#2c2c2c',        // Partition fabric
    wallLight: '#404040',      // Top edge highlight
    wallHighlight: '#555555',  // Vertical accent
    wallTrim: '#606060',       // Metal trim accent

    // Floor - REALISTIC OFFICE CARPET (muted gray-brown tones)
    floorDark: '#3a3a3a',      // Dark gray carpet base
    floorMid: '#454545',        // Medium gray carpet
    floorLight: '#505050',      // Light accent
    floorAccent: '#5a5a5a',     // Highlight accent
    floorFiber: '#3d3d3d',      // Carpet fiber detail
    floorWear: '#333333',       // Worn/traffic areas

    // Cafeteria
    cafeteriaFloor: '#f5e6d3',
    cafeteriaFloorAlt: '#ede0d4',
    cafeteriaTable: '#8b4513',
    cafeteriaChair: '#a0522d',

    // Bathroom
    bathroomFloor: '#e8f4f8',
    bathroomFloorAlt: '#d4eaf0',
    bathroomTile: '#b8d4e3',

    // Desk
    deskWood: '#8b5a2b',
    deskWoodLight: '#a0522d',
    deskWoodDark: '#654321',
    deskTop: '#2c3e50',
    deskScreen: '#74b9ff',
    deskScreenGlow: '#a8d8ff',

    // Player - PROFESSIONAL BUSINESSMAN IN SUIT
    playerSkin: '#d4a574',      // Realistic skin tone
    playerHair: '#2c2c2c',       // Dark professional hair
    playerShirt: '#2c3e50',      // Dark charcoal suit jacket
    playerShirtLight: '#34495e', // Suit highlight
    playerShirtDark: '#1a252f',  // Suit shadow
    playerPants: '#1a1a2e',      // Dark suit pants
    playerTie: '#c0392b',        // Red power tie
    playerDressShirt: '#ecf0f1', // White dress shirt collar

    // Enemy - THREATENING MANAGER/SECURITY FIGURE
    enemySkin: '#c9a66b',        // Slightly different skin tone
    enemyHair: '#1a1a1a',        // Dark slicked hair
    enemyShirt: '#1a1a2e',       // Dark menacing suit
    enemyShirtLight: '#2c2c3e',  // Suit highlight
    enemyShirtDark: '#0d0d15',   // Deep shadow
    enemyTie: '#8b0000',         // Dark red tie
    enemyBadge: '#ffd700',       // Gold security badge

    // Exit
    exitFrame: '#f39c12',
    exitDoor: '#27ae60',
    exitDoorLight: '#2ecc71',
    exitSign: '#e74c3c',
    exitGlow: '#f1c40f',

    // Secret exit (floor 13)
    secretDoor: '#4a0080',
    secretGlow: '#9b59b6',

    // Powerups
    speedBlue: '#00d2d3',
    speedBlueLight: '#48dbfb',
    speedBlueDark: '#0097a7',
    knockoutRed: '#ee5a24',
    knockoutRedLight: '#ff7f50',
    knockoutRedDark: '#c0392b',
    electricYellow: '#f1c40f',
    electricYellowLight: '#f9e79f',
    electricYellowDark: '#d4ac0d',

    // Crispy enemy
    crispy: '#2c2c2c',
    crispyLight: '#4a4a4a',

    stunned: '#95a5a6',
    stunnedLight: '#bdc3c7',

    // Fire hazards
    fireCore: '#ffcc00',
    fireInner: '#ff6600',
    fireOuter: '#ff3300',
    fireGlow: 'rgba(255, 100, 0, 0.6)',
    burnEffect: '#ff4500',

    // Garden (outdoor rooftop garden)
    gardenGrass: '#4caf50',
    gardenGrassDark: '#388e3c',
    gardenFlower1: '#e91e63',
    gardenFlower2: '#ffeb3b',
    gardenFlower3: '#9c27b0',
    gardenPath: '#a1887f',
    gardenBench: '#795548',

    // Dog Park (outdoor recreation area)
    dogParkGrass: '#8bc34a',
    dogParkGrassDark: '#689f38',
    dogParkFence: '#8d6e63',
    dogParkSand: '#fff8e1',
    dogParkToy: '#f44336'
};

// Store original colors for colorblind mode toggle
const ORIGINAL_COLORS = { ...COLORS };

// Colorblind-friendly palettes for different types of color vision deficiency
const COLORBLIND_PALETTES = {
    // Deuteranopia - red-green colorblindness (most common, ~6% of males)
    deuteranopia: {
        playerShirt: '#0077BB',
        playerShirtLight: '#33AADD',
        playerShirtDark: '#005588',
        enemyShirt: '#EE7733',
        enemyShirtLight: '#FFAA66',
        enemyShirtDark: '#CC5511',
        speedBlue: '#33BBEE',
        speedBlueLight: '#77DDFF',
        speedBlueDark: '#0099CC',
        knockoutRed: '#EE3377',
        knockoutRedLight: '#FF77AA',
        knockoutRedDark: '#CC1155',
        electricYellow: '#CCBB44',
        fireCore: '#FFCC00',
        fireInner: '#EE3377',
        fireOuter: '#CC1155',
        burnEffect: '#EE3377',
        gardenGrass: '#009988',
        gardenGrassDark: '#007766',
        gardenFlower1: '#EE3377',
        gardenFlower2: '#CCBB44',
        gardenFlower3: '#33BBEE',
        exitDoor: '#33BBEE',
        exitDoorLight: '#77DDFF',
        dogParkGrass: '#009988',
        dogParkGrassDark: '#007766',
        dogParkToy: '#EE3377'
    },
    // Protanopia - red-blind (~1% of males)
    protanopia: {
        playerShirt: '#0088CC',
        playerShirtLight: '#44AAEE',
        playerShirtDark: '#006699',
        enemyShirt: '#DDAA00',
        enemyShirtLight: '#FFCC44',
        enemyShirtDark: '#BB8800',
        speedBlue: '#00BBDD',
        speedBlueLight: '#44DDFF',
        speedBlueDark: '#0099BB',
        knockoutRed: '#AA00AA',
        knockoutRedLight: '#DD44DD',
        knockoutRedDark: '#880088',
        electricYellow: '#DDCC00',
        fireCore: '#FFEE00',
        fireInner: '#DD00DD',
        fireOuter: '#AA00AA',
        burnEffect: '#DD00DD',
        gardenGrass: '#00AA99',
        gardenGrassDark: '#008877',
        gardenFlower1: '#DD00DD',
        gardenFlower2: '#DDCC00',
        gardenFlower3: '#00BBDD',
        exitDoor: '#00DDAA',
        exitDoorLight: '#44FFCC',
        dogParkGrass: '#00AA99',
        dogParkGrassDark: '#008877',
        dogParkToy: '#DD00DD'
    },
    // Tritanopia - blue-yellow colorblindness (very rare, ~0.01%)
    tritanopia: {
        playerShirt: '#00AA77',
        playerShirtLight: '#44CC99',
        playerShirtDark: '#008855',
        enemyShirt: '#DD4444',
        enemyShirtLight: '#FF7777',
        enemyShirtDark: '#BB2222',
        speedBlue: '#00DDAA',
        speedBlueLight: '#44FFCC',
        speedBlueDark: '#00BB88',
        knockoutRed: '#FF5555',
        knockoutRedLight: '#FF8888',
        knockoutRedDark: '#DD3333',
        electricYellow: '#FFAAAA',
        fireCore: '#FF8888',
        fireInner: '#FF5555',
        fireOuter: '#DD3333',
        burnEffect: '#FF5555',
        gardenGrass: '#00CC88',
        gardenGrassDark: '#00AA66',
        gardenFlower1: '#FF5555',
        gardenFlower2: '#FFAAAA',
        gardenFlower3: '#00DDAA',
        exitDoor: '#00FFAA',
        exitDoorLight: '#66FFCC',
        dogParkGrass: '#00CC88',
        dogParkGrassDark: '#00AA66',
        dogParkToy: '#FF5555'
    }
};

// Legacy alias for compatibility
const COLORBLIND_OVERRIDES = COLORBLIND_PALETTES.deuteranopia;

// Apply or remove colorblind mode based on settings
function applyColorblindMode(mode) {
    if (mode && mode !== 'off' && mode !== false) {
        const palette = COLORBLIND_PALETTES[mode] || COLORBLIND_PALETTES.deuteranopia;
        Object.assign(COLORS, palette);
    } else {
        Object.assign(COLORS, ORIGINAL_COLORS);
    }
}

// Tile types
const TILE = {
    FLOOR: 0,
    WALL: 1,
    DESK: 2,
    CAFETERIA: 3,
    BATHROOM: 4,
    SECRET_EXIT: 5,
    FIRE: 6,
    GARDEN: 7,
    DOG_PARK: 8
};

// Checkpoint system constants (must be defined before gameState)
const CHECKPOINT_FLOORS = [20, 15, 10, 5];
const MAX_CONTINUES = 3;

// Game state
let gameState = {
    floor: 23,
    timer: 30,
    powerup: null,
    powerupTimer: 0,
    player: {
        x: 10, y: 10, speed: 1, stunned: 0,
        frame: 0, direction: 0,
        hitCount: 0,  // Track number of times hit
        lastHitTime: 0,  // For resetting hit count after a while
        burning: 0,  // Burn effect timer (drains time 2x faster)
        shielded: 0,  // Shield timer (immune to damage from garden powerup)
        companion: null  // Dog companion from dog park (chases enemies)
    },
    enemies: [],
    powerups: [],
    crispyEffects: [],  // Track frying animations when enemies get zapped
    exits: [],
    secretExit: null,
    maze: [],
    zones: {
        cafeteria: [],
        bathroom: [],
        garden: null,
        dogPark: null
    },
    fires: [],  // Dynamic fire hazards
    fireSpawnTimer: 0,  // Timer for spawning new fires
    gameOver: false,
    won: false,
    imploding: false,
    implosionFrame: 0,
    particles: [],
    started: false,
    animationTime: 0,
    enemiesKnockedOut: 0,
    enemiesZapped: 0,
    enemiesDodged: 0,  // Track close calls
    paused: false,
    lastChance: false,     // "Last chance" grace period active
    lastChanceTimer: 0,    // Grace period countdown
    punchEffects: [],  // Visual effects when punching enemies
    collectingPowerups: [],  // Powerups being "sucked in" toward player
    // Run timing
    runStartTime: 0,  // When the run started
    runTotalTime: 0,  // Total time for completed run
    floorTimes: [],    // Time spent on each floor
    // Checkpoint system (Playtest Feature #2)
    lastCheckpoint: null,
    continuesRemaining: MAX_CONTINUES,
    // Celebration system (Playtest Feature #3)
    celebrations: [],  // Active celebration popups
    floorHits: 0,      // Hits taken this floor (for flawless tracking)
    // Zen mode flag
    zenMode: false,
    // === NEW: Collectibles System (Dopamine Breadcrumbs) ===
    coins: [],              // Coins scattered throughout maze
    coinsCollected: 0,      // Coins collected this run
    coinCombo: 0,           // Rapid collection combo
    coinComboTimer: 0,      // Time remaining for combo
    // === NEW: Quick Run Mode ===
    quickRunMode: false,    // 7-floor quick run
    quickRunStartFloor: 7   // Starting floor for quick run
};

// Comprehensive stats tracking (persisted)
let playerStats = {
    totalRuns: 0,
    totalWins: 0,
    totalDeaths: 0,
    fastestWin: null,  // Best completion time
    enemiesPunched: 0,
    enemiesZapped: 0,
    enemiesDodged: 0,  // Close calls
    totalFloorsCleared: 0,
    timesStunned: 0,
    timesBurned: 0,
    powerupsCollected: 0,
    secretExitsFound: 0,
    bestFloor: 23,  // Lowest floor reached
    totalPlayTime: 0,  // Total time playing
    // === NEW: Escape Points System (Meta-Progression) ===
    escapePoints: 0,        // Persistent currency earned from runs
    totalCoinsCollected: 0  // Lifetime coins collected
};

// Load stats from localStorage
function loadStats() {
    const saved = localStorage.getItem('deadline_stats');
    if (saved) {
        const parsed = JSON.parse(saved);
        Object.assign(playerStats, parsed);
    }
}

// Save stats to localStorage
function saveStats() {
    localStorage.setItem('deadline_stats', JSON.stringify(playerStats));
}

// Alias for consistency
function savePlayerStats() {
    saveStats();
}

// Show milestone unlock notifications
function showMilestoneUnlocks(milestones) {
    // Queue milestone notifications
    milestones.forEach((milestone, index) => {
        setTimeout(() => {
            showMilestonePopup(milestone);
        }, index * 2000); // Stagger notifications
    });
}

function showMilestonePopup(milestone) {
    // Create popup element
    const popup = document.createElement('div');
    popup.className = 'milestone-popup';
    popup.innerHTML = `
        <div class="milestone-icon">🏆</div>
        <div class="milestone-content">
            <div class="milestone-title">MILESTONE UNLOCKED!</div>
            <div class="milestone-name">${milestone.name}</div>
            <div class="milestone-reward">${milestone.reward.description}</div>
        </div>
    `;

    document.body.appendChild(popup);

    // Animate in
    setTimeout(() => popup.classList.add('show'), 10);

    // Remove after delay
    setTimeout(() => {
        popup.classList.remove('show');
        setTimeout(() => popup.remove(), 500);
    }, 3000);
}

// Show milestones menu
function showMilestonesMenu() {
    const menu = document.getElementById('milestonesMenu');
    const content = document.getElementById('milestonesContent');
    const statsEl = document.getElementById('milestonesStats');

    if (!menu) return;

    // Load current state
    loadStats();
    loadMilestones();

    // Build milestone cards
    let html = '';
    for (const [id, milestone] of Object.entries(MILESTONES)) {
        const isUnlocked = unlockedMilestones.includes(id);
        const progress = getMilestoneProgress(id);

        html += `
            <div class="milestone-card ${isUnlocked ? 'unlocked' : 'locked'}">
                <div class="milestone-card-icon">${isUnlocked ? '🏆' : '🔒'}</div>
                <div class="milestone-card-info">
                    <div class="milestone-card-name">${milestone.name}</div>
                    <div class="milestone-card-desc">${milestone.description}</div>
                    <div class="milestone-card-reward">Reward: ${milestone.reward.description}</div>
                    ${!isUnlocked && progress ? `<div class="milestone-card-progress">${progress}</div>` : ''}
                </div>
            </div>
        `;
    }
    content.innerHTML = html;

    // Build stats summary
    const rewards = getMilestoneRewards();
    statsEl.innerHTML = `
        <h3>CURRENT BONUSES</h3>
        <div class="stats-grid">
            <div class="stat-item">
                <div class="stat-value">+${rewards.bonusTime}s</div>
                <div class="stat-label">Bonus Time</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${unlockedMilestones.length}/${Object.keys(MILESTONES).length}</div>
                <div class="stat-label">Unlocked</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${playerStats.totalFloorsCleared || 0}</div>
                <div class="stat-label">Floors Cleared</div>
            </div>
        </div>
    `;

    menu.style.display = 'flex';
}

function hideMilestonesMenu() {
    const menu = document.getElementById('milestonesMenu');
    if (menu) {
        menu.style.display = 'none';
    }
}

// Get progress text for a milestone
function getMilestoneProgress(milestoneId) {
    const milestone = MILESTONES[milestoneId];
    if (!milestone) return '';

    switch (milestoneId) {
        case 'rookie':
            return `Progress: ${playerStats.totalFloorsCleared || 0}/10 floors`;
        case 'veteran':
            return `Progress: ${playerStats.totalFloorsCleared || 0}/50 floors`;
        case 'survivor':
            return `Progress: ${playerStats.totalWins || 0}/1 wins`;
        case 'speedster':
            const best = playerStats.fastestWin ? Math.floor(playerStats.fastestWin) + 's' : 'No wins yet';
            return `Best time: ${best} (need <5min)`;
        case 'fireproof':
            return `Progress: ${playerStats.timesBurned || 0}/10 burns`;
        case 'puncher':
            return `Progress: ${playerStats.enemiesPunched || 0}/50 knockouts`;
        case 'explorer':
            return `Progress: ${playerStats.secretExitsFound || 0}/1 found`;
        default:
            return '';
    }
}

// ============================================
// DAILY CHALLENGE MODE
// ============================================

// Seeded random number generator (Mulberry32)
function seededRandom(seed) {
    return function() {
        let t = seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

// Daily challenge state
const dailyChallenge = {
    active: false,
    seed: 0,
    date: '',
    random: null,  // Seeded RNG function
    completed: false,
    bestTime: null,
    leaderboard: []  // Local leaderboard storage
};

// Get today's date string for seed
function getTodayDateString() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

// Convert date string to numeric seed
function dateToSeed(dateStr) {
    let hash = 0;
    for (let i = 0; i < dateStr.length; i++) {
        const char = dateStr.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash);
}

// Initialize daily challenge
function initDailyChallenge() {
    const today = getTodayDateString();
    dailyChallenge.date = today;
    dailyChallenge.seed = dateToSeed(today);
    dailyChallenge.random = seededRandom(dailyChallenge.seed);
    dailyChallenge.active = true;
    dailyChallenge.completed = false;

    // Load today's best time
    loadDailyChallengeData();
}

// Save daily challenge data
function saveDailyChallengeData() {
    const data = {
        date: dailyChallenge.date,
        bestTime: dailyChallenge.bestTime,
        completed: dailyChallenge.completed,
        leaderboard: dailyChallenge.leaderboard.slice(0, 10)  // Top 10
    };
    localStorage.setItem('deadline_dailyChallenge', JSON.stringify(data));
}

// Load daily challenge data
function loadDailyChallengeData() {
    const saved = localStorage.getItem('deadline_dailyChallenge');
    if (saved) {
        const data = JSON.parse(saved);
        // Only load if it's today's challenge
        if (data.date === dailyChallenge.date) {
            dailyChallenge.bestTime = data.bestTime;
            dailyChallenge.completed = data.completed;
            dailyChallenge.leaderboard = data.leaderboard || [];
        } else {
            // New day, reset
            dailyChallenge.bestTime = null;
            dailyChallenge.completed = false;
            dailyChallenge.leaderboard = [];
        }
    }
}

// Get seeded random (uses daily seed when in challenge mode, Math.random otherwise)
function gameRandom() {
    if (dailyChallenge.active && dailyChallenge.random) {
        return dailyChallenge.random();
    }
    return Math.random();
}

// Submit score to local leaderboard
function submitDailyChallengeScore(time) {
    if (!dailyChallenge.active) return;

    dailyChallenge.completed = true;

    // Update best time
    if (!dailyChallenge.bestTime || time < dailyChallenge.bestTime) {
        dailyChallenge.bestTime = time;
    }

    // Add to leaderboard
    const entry = {
        time: time,
        date: new Date().toISOString(),
        floor: 1  // Made it to the end
    };

    dailyChallenge.leaderboard.push(entry);
    dailyChallenge.leaderboard.sort((a, b) => a.time - b.time);
    dailyChallenge.leaderboard = dailyChallenge.leaderboard.slice(0, 10);

    saveDailyChallengeData();
}

// Start daily challenge game
function startDailyChallenge() {
    initDailyChallenge();
    document.getElementById('message').style.display = 'none';
    if (document.getElementById('dailyChallengeMenu')) {
        document.getElementById('dailyChallengeMenu').style.display = 'none';
    }

    // Store weekly challenge modifiers for use during gameplay
    gameState.weeklyChallenge = getWeeklyChallenge();

    gameState.floor = 23;
    gameState.gameOver = false;
    gameState.won = false;
    gameState.started = true;
    gameState.paused = false;
    gameState.player.hitCount = 0;
    gameState.player.lastHitTime = 0;
    gameState.player.burning = 0;
    gameState.enemiesKnockedOut = 0;
    gameState.enemiesZapped = 0;
    gameState.enemiesDodged = 0;
    gameState.fires = [];
    gameState.fireSpawnTimer = 0;
    gameState.runStartTime = Date.now();
    gameState.runTotalTime = 0;
    gameState.floorTimes = [];
    playerProgress.wasHitThisRun = false;
    playerStats.totalRuns++;
    saveStats();
    updatePlayerColors();
    initLevel();
}

// End daily challenge (called when player wins)
function endDailyChallenge() {
    if (dailyChallenge.active && gameState.won) {
        submitDailyChallengeScore(gameState.runTotalTime);
    }
    dailyChallenge.active = false;
}

// Format time for display
function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const hundredths = Math.floor((ms % 1000) / 10);
    return `${minutes}:${String(seconds).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`;
}

// Show daily challenge menu
function showDailyChallenge() {
    const menu = document.getElementById('dailyChallengeMenu');
    const dateEl = document.getElementById('dailyDate');
    const bestTimeEl = document.getElementById('dailyBestTime');
    const leaderboardList = document.getElementById('leaderboardList');
    const weeklyModEl = document.getElementById('weeklyModifier');

    // Initialize to get today's data
    const today = getTodayDateString();
    dailyChallenge.date = today;
    dailyChallenge.seed = dateToSeed(today);
    loadDailyChallengeData();

    // Format date nicely
    const dateObj = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateEl.textContent = dateObj.toLocaleDateString('en-US', options);

    // Show weekly challenge modifier
    const weeklyChallenge = getWeeklyChallenge();
    if (weeklyModEl) {
        weeklyModEl.innerHTML = `
            <span class="weekly-label">WEEKLY MODIFIER:</span>
            <span class="weekly-name">${weeklyChallenge.name}</span>
            <span class="weekly-desc">${weeklyChallenge.description}</span>
        `;
    }

    // Show best time
    if (dailyChallenge.bestTime) {
        bestTimeEl.textContent = formatTime(dailyChallenge.bestTime);
    } else {
        bestTimeEl.textContent = '--:--.--';
    }

    // Show leaderboard
    leaderboardList.innerHTML = '';
    if (dailyChallenge.leaderboard && dailyChallenge.leaderboard.length > 0) {
        dailyChallenge.leaderboard.forEach((entry, index) => {
            const li = document.createElement('li');
            li.textContent = formatTime(entry.time);
            leaderboardList.appendChild(li);
        });
    } else {
        const li = document.createElement('li');
        li.textContent = 'No runs yet today';
        li.style.listStyle = 'none';
        li.style.marginLeft = '-25px';
        leaderboardList.appendChild(li);
    }

    document.getElementById('message').style.display = 'none';
    menu.style.display = 'flex';
}

// Hide daily challenge menu
function hideDailyChallenge() {
    document.getElementById('dailyChallengeMenu').style.display = 'none';
    document.getElementById('message').style.display = 'block';
}

// Show how to play menu
function showHowToPlay() {
    document.getElementById('message').style.display = 'none';
    document.getElementById('howToPlayMenu').style.display = 'flex';
}

// Hide how to play menu
function hideHowToPlay() {
    document.getElementById('howToPlayMenu').style.display = 'none';
    document.getElementById('message').style.display = 'block';
}

let keys = {};
let lastMove = 0;
const MOVE_DELAY = 150;

// ============================================
// GAMEPAD / CONTROLLER SUPPORT
// ============================================
const gamepadState = {
    connected: false,
    index: -1,
    lastInput: {
        up: false, down: false, left: false, right: false,
        action: false, pause: false
    },
    deadzone: 0.3,
    buttonCooldown: 0
};

// Input abstraction - combines keyboard and gamepad
const input = {
    up: false,
    down: false,
    left: false,
    right: false,
    action: false,
    pause: false
};

function updateGamepadInput() {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    let gamepad = null;

    // Find first connected gamepad
    for (let i = 0; i < gamepads.length; i++) {
        if (gamepads[i] && gamepads[i].connected) {
            gamepad = gamepads[i];
            gamepadState.connected = true;
            gamepadState.index = i;
            break;
        }
    }

    if (!gamepad) {
        gamepadState.connected = false;
        return;
    }

    // Standard gamepad mapping (Xbox/PlayStation style)
    // Left stick or D-pad for movement
    const leftStickX = gamepad.axes[0] || 0;
    const leftStickY = gamepad.axes[1] || 0;

    // D-pad buttons (standard mapping: 12=up, 13=down, 14=left, 15=right)
    const dpadUp = gamepad.buttons[12] ? gamepad.buttons[12].pressed : false;
    const dpadDown = gamepad.buttons[13] ? gamepad.buttons[13].pressed : false;
    const dpadLeft = gamepad.buttons[14] ? gamepad.buttons[14].pressed : false;
    const dpadRight = gamepad.buttons[15] ? gamepad.buttons[15].pressed : false;

    // Action button (A on Xbox, X on PlayStation) - button 0
    const actionButton = gamepad.buttons[0] ? gamepad.buttons[0].pressed : false;

    // Pause button (Start) - button 9
    const pauseButton = gamepad.buttons[9] ? gamepad.buttons[9].pressed : false;

    // Apply deadzone to stick
    const stickUp = leftStickY < -gamepadState.deadzone;
    const stickDown = leftStickY > gamepadState.deadzone;
    const stickLeft = leftStickX < -gamepadState.deadzone;
    const stickRight = leftStickX > gamepadState.deadzone;

    // Store current state (combine stick and d-pad)
    gamepadState.lastInput.up = stickUp || dpadUp;
    gamepadState.lastInput.down = stickDown || dpadDown;
    gamepadState.lastInput.left = stickLeft || dpadLeft;
    gamepadState.lastInput.right = stickRight || dpadRight;
    gamepadState.lastInput.action = actionButton;
    gamepadState.lastInput.pause = pauseButton;
}

function getInput() {
    // Update gamepad state
    updateGamepadInput();

    // Helper to check if any key in the binding is pressed
    const isKeyPressed = (binding) => {
        if (!binding) return false;
        return binding.some(key => keys[key]);
    };

    // Get control bindings (use defaults if not set)
    const controls = settings.controls || DEFAULT_SETTINGS.controls;

    // Combine keyboard (with remappable controls) and gamepad inputs
    input.up = isKeyPressed(controls.up) || gamepadState.lastInput.up;
    input.down = isKeyPressed(controls.down) || gamepadState.lastInput.down;
    input.left = isKeyPressed(controls.left) || gamepadState.lastInput.left;
    input.right = isKeyPressed(controls.right) || gamepadState.lastInput.right;
    input.action = isKeyPressed(controls.action) || gamepadState.lastInput.action;
    input.pause = isKeyPressed(controls.pause) || gamepadState.lastInput.pause;

    return input;
}

// Gamepad connection events
window.addEventListener('gamepadconnected', (e) => {
    console.log('Gamepad connected:', e.gamepad.id);
    gamepadState.connected = true;
    gamepadState.index = e.gamepad.index;
    showControllerNotification(true);
});

window.addEventListener('gamepaddisconnected', (e) => {
    console.log('Gamepad disconnected');
    gamepadState.connected = false;
    gamepadState.index = -1;
    showControllerNotification(false);
});

// ============================================
// DIFFICULTY PRESETS (Playtest Feature #1)
// ============================================
const DIFFICULTY_PRESETS = {
    chill: {
        id: 'chill',
        name: 'Chill Mode',
        timerMultiplier: 2.0,
        enemyMultiplier: 0.5,
        fireEnabled: false,
        description: 'Relaxed pace, fewer enemies, no fire hazards'
    },
    normal: {
        id: 'normal',
        name: 'Normal',
        timerMultiplier: 1.0,
        enemyMultiplier: 1.0,
        fireEnabled: true,
        description: 'The intended experience'
    },
    intense: {
        id: 'intense',
        name: 'Intense',
        timerMultiplier: 0.75,
        enemyMultiplier: 1.5,
        fireEnabled: true,
        fireSpreadFaster: true,
        description: 'For experienced escapers only'
    },
    crunch: {
        id: 'crunch',
        name: 'Crunch Time',
        timerMultiplier: 0.5,
        enemyMultiplier: 2.0,
        fireEnabled: true,
        fireSpreadFaster: true,
        description: 'Mandatory overtime. No survivors.'
    },
    zen: {
        id: 'zen',
        name: 'Zen Mode',
        timerMultiplier: 0,  // No timer
        enemyMultiplier: 0,  // No enemies
        fireEnabled: false,
        description: 'Explore mazes peacefully. No timer, no enemies.'
    }
};

// Difficulty slider mapping (index -> difficulty id)
const DIFFICULTY_SLIDER_MAP = ['zen', 'chill', 'normal', 'intense', 'crunch'];
const DIFFICULTY_LABELS = {
    zen: { emoji: '🧘', name: 'ZEN MODE', desc: 'No timer, no enemies. Just explore.' },
    chill: { emoji: '😌', name: 'CHILL', desc: 'Relaxed pace, fewer enemies' },
    normal: { emoji: '⚡', name: 'NORMAL', desc: 'The intended experience' },
    intense: { emoji: '🔥', name: 'INTENSE', desc: 'For experienced escapers' },
    crunch: { emoji: '💀', name: 'CRUNCH TIME', desc: 'Mandatory overtime. No survivors.' }
};

// Celebration events (Playtest Feature #3)
// Note: CHECKPOINT_FLOORS and MAX_CONTINUES moved before gameState to avoid temporal dead zone
const CELEBRATIONS = {
    closeDodge: { text: 'CLOSE ONE!', color: '#ff6b6b' },
    combo: { text: 'COMBO x{n}!', color: '#ffd93d' },
    speedster: { text: 'SPEEDSTER!', color: '#6bcb77' },
    flawless: { text: 'FLAWLESS!', color: '#4d96ff' },
    niceUse: { text: 'NICE!', color: '#9b59b6' },
    checkpoint: { text: 'CHECKPOINT!', color: '#00d2d3' },
    // === NEW: Close Call & Coin Celebrations ===
    closeCall: { text: 'CLOSE CALL!', color: '#ff4757' },
    clutchEscape: { text: 'CLUTCH!', color: '#ffa502' },
    coinStreak: { text: 'COIN STREAK x{n}!', color: '#f1c40f' },
    coinMaster: { text: 'COIN MASTER!', color: '#f39c12' }
};

// ============================================
// SETTINGS PERSISTENCE (LocalStorage)
// ============================================
const DEFAULT_SETTINGS = {
    resolution: '640x640',
    fullscreen: false,
    screenShake: true,
    screenShakeIntensity: 100,  // 0-100% for motion sensitivity
    colorblindMode: 'off',      // 'off', 'deuteranopia', 'protanopia', 'tritanopia'
    showFPS: false,
    masterVolume: 1.0,
    musicVolume: 0.7,
    sfxVolume: 0.8,
    // New playtest settings
    difficulty: 'normal',
    gameSpeed: 1.0,
    audioProximityCues: true,   // Enable spatial audio by default
    highContrast: false,
    // Remappable controls
    controls: {
        up: ['KeyW', 'ArrowUp'],
        down: ['KeyS', 'ArrowDown'],
        left: ['KeyA', 'ArrowLeft'],
        right: ['KeyD', 'ArrowRight'],
        action: ['Space'],
        pause: ['KeyP', 'Escape']
    },
    // Game Feel settings (Super Meat Boy consultant recommendations)
    instantRestartEnabled: true,
    instantRestartKey: 'KeyR',
    inputBufferingEnabled: true,
    inputBufferWindow: 80,           // milliseconds
    freezeFramesEnabled: true,
    freezeFrameIntensity: 1.0,       // 0.5-1.5 range
    squashStretchEnabled: true,
    squashStretchIntensity: 1.0,     // 0.5-1.5 range
    ghostEnabled: true,
    ghostOpacity: 0.4
};

// ============================================
// META-PROGRESSION MILESTONES SYSTEM
// ============================================
const MILESTONES = {
    rookie: {
        id: 'rookie',
        name: 'Rookie',
        description: 'Clear 10 total floors',
        requirement: (stats) => stats.totalFloorsCleared >= 10,
        reward: { bonusTime: 1, description: '+1s starting time' }
    },
    veteran: {
        id: 'veteran',
        name: 'Veteran',
        description: 'Clear 50 total floors',
        requirement: (stats) => stats.totalFloorsCleared >= 50,
        reward: { skin: 'nightShift', description: 'Unlock "Night Shift" skin' }
    },
    survivor: {
        id: 'survivor',
        name: 'Survivor',
        description: 'Win your first run',
        requirement: (stats) => stats.totalWins >= 1,
        reward: { bonusTime: 2, description: '+2s starting time' }
    },
    speedster: {
        id: 'speedster',
        name: 'Speedster',
        description: 'Win in under 5 minutes',
        requirement: (stats) => stats.fastestWin && stats.fastestWin < 300,
        reward: { trailColor: 'gold', description: 'Unlock gold speed trail' }
    },
    fireproof: {
        id: 'fireproof',
        name: 'Fireproof',
        description: 'Survive 10 burns',
        requirement: (stats) => stats.timesBurned >= 10,
        reward: { fireResistance: 1, description: '1s fire immunity after burn' }
    },
    puncher: {
        id: 'puncher',
        name: 'Office Brawler',
        description: 'Knock out 50 enemies',
        requirement: (stats) => stats.enemiesPunched >= 50,
        reward: { punchRange: 1, description: '+1 punch range' }
    },
    explorer: {
        id: 'explorer',
        name: 'Secret Seeker',
        description: 'Find the secret exit',
        requirement: (stats) => stats.secretExitsFound >= 1,
        reward: { skin: 'ghost', description: 'Unlock "Ghost" skin' }
    }
};

// Track unlocked milestones
let unlockedMilestones = [];

function loadMilestones() {
    try {
        const saved = localStorage.getItem('deadline_milestones');
        if (saved) {
            unlockedMilestones = JSON.parse(saved);
        }
    } catch (e) {
        console.log('Failed to load milestones:', e);
        unlockedMilestones = [];
    }
}

function saveMilestones() {
    try {
        localStorage.setItem('deadline_milestones', JSON.stringify(unlockedMilestones));
    } catch (e) {
        console.log('Failed to save milestones:', e);
    }
}

function checkMilestones() {
    let newUnlocks = [];
    for (const [id, milestone] of Object.entries(MILESTONES)) {
        if (!unlockedMilestones.includes(id) && milestone.requirement(playerStats)) {
            unlockedMilestones.push(id);
            newUnlocks.push(milestone);
        }
    }
    if (newUnlocks.length > 0) {
        saveMilestones();
    }
    return newUnlocks;
}

function getMilestoneRewards() {
    const rewards = {
        bonusTime: 0,
        fireResistance: 0,
        punchRange: 0,
        skins: [],
        trailColor: null
    };

    for (const id of unlockedMilestones) {
        const milestone = MILESTONES[id];
        if (milestone && milestone.reward) {
            if (milestone.reward.bonusTime) rewards.bonusTime += milestone.reward.bonusTime;
            if (milestone.reward.fireResistance) rewards.fireResistance += milestone.reward.fireResistance;
            if (milestone.reward.punchRange) rewards.punchRange += milestone.reward.punchRange;
            if (milestone.reward.skin) rewards.skins.push(milestone.reward.skin);
            if (milestone.reward.trailColor) rewards.trailColor = milestone.reward.trailColor;
        }
    }

    return rewards;
}

// ============================================
// WEEKLY CHALLENGE MODIFIERS
// ============================================
const WEEKLY_CHALLENGES = [
    {
        id: 'speedDemon',
        name: 'Speed Demon',
        description: '50% less time, but 2x speed powerups',
        modifiers: { timeMultiplier: 0.5, speedPowerupMultiplier: 2 }
    },
    {
        id: 'inferno',
        name: 'Inferno',
        description: 'Double fires, but shields spawn more often',
        modifiers: { fireMultiplier: 2, shieldSpawnChance: 0.3 }
    },
    {
        id: 'stealth',
        name: 'Stealth Run',
        description: 'Enemies have wider vision, more powerups',
        modifiers: { enemyVisionMultiplier: 2, powerupMultiplier: 1.5 }
    },
    {
        id: 'minimalist',
        name: 'Minimalist',
        description: 'No powerups spawn',
        modifiers: { powerupMultiplier: 0 }
    }
];

function getWeeklyChallenge() {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((now - startOfYear) / (24 * 60 * 60 * 1000));
    const weekIndex = Math.floor(dayOfYear / 7) % WEEKLY_CHALLENGES.length;
    return WEEKLY_CHALLENGES[weekIndex];
}

let settings = { ...DEFAULT_SETTINGS };

function loadSettings() {
    try {
        const saved = localStorage.getItem('deadline_settings');
        if (saved) {
            settings = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
        }

        // Apply loaded settings
        displaySettings.currentResolution = settings.resolution;
        displaySettings.fullscreen = settings.fullscreen;

        // Set resolution
        setResolution(settings.resolution);

        // Apply colorblind mode if enabled
        if (settings.colorblindMode && settings.colorblindMode !== 'off') {
            applyColorblindMode(settings.colorblindMode);
        }

        console.log('Settings loaded:', settings);
    } catch (e) {
        console.log('Failed to load settings:', e);
        settings = { ...DEFAULT_SETTINGS };
    }
}

function saveSettings() {
    try {
        settings.resolution = displaySettings.currentResolution;
        settings.fullscreen = displaySettings.fullscreen;
        localStorage.setItem('deadline_settings', JSON.stringify(settings));
        console.log('Settings saved');
    } catch (e) {
        console.log('Failed to save settings:', e);
    }
}

function resetSettings() {
    settings = { ...DEFAULT_SETTINGS };
    saveSettings();
    loadSettings();
}

// Set difficulty from title screen (Playtest Feature #1 & #5)
function setDifficulty(difficultyId) {
    if (!DIFFICULTY_PRESETS[difficultyId]) return;

    settings.difficulty = difficultyId;
    saveSettings();

    // Update slider UI
    updateDifficultySliderUI(difficultyId);

    console.log(`Difficulty set to: ${difficultyId}`);
}

// Update difficulty from slider input
function updateDifficultyFromSlider(value) {
    const difficultyId = DIFFICULTY_SLIDER_MAP[parseInt(value)];
    if (difficultyId) {
        setDifficulty(difficultyId);
    }
}

// Update the slider UI to match current difficulty
function updateDifficultySliderUI(difficultyId) {
    const slider = document.getElementById('difficultySlider');
    const label = document.getElementById('difficultyLabel');
    const desc = document.getElementById('difficultyDesc');

    if (!slider || !label || !desc) return;

    const sliderIndex = DIFFICULTY_SLIDER_MAP.indexOf(difficultyId);
    if (sliderIndex >= 0) {
        slider.value = sliderIndex;
    }

    const labelData = DIFFICULTY_LABELS[difficultyId];
    if (labelData) {
        label.textContent = `${labelData.emoji} ${labelData.name}`;
        desc.textContent = labelData.desc;

        // Update color class
        label.className = 'difficulty-label ' + difficultyId;
    }
}

// Initialize difficulty slider on page load
function initDifficultyButtons() {
    const currentDiff = settings.difficulty || 'normal';
    updateDifficultySliderUI(currentDiff);
}

// Show main settings menu (Characters, Achievements, Stats)
function showMainSettings() {
    document.getElementById('mainSettingsMenu').style.display = 'flex';
}

// Hide main settings menu
function hideMainSettings() {
    document.getElementById('mainSettingsMenu').style.display = 'none';
}

// ============================================
// META-PROGRESSION SYSTEM
// ============================================
const CHARACTERS = {
    default: {
        id: 'default',
        name: 'Corporate Employee',
        description: 'Just trying to survive another day',
        unlocked: true,
        unlockCondition: null,
        colors: {
            shirt: '#00b894',
            shirtLight: '#55efc4',
            shirtDark: '#00a884',
            hair: '#5f3dc4',
            pants: '#2d3436'
        }
    },
    speedster: {
        id: 'speedster',
        name: 'The Intern',
        description: 'Gets coffee faster than anyone',
        unlocked: false,
        unlockCondition: 'Complete a run without getting hit',
        colors: {
            shirt: '#0984e3',
            shirtLight: '#74b9ff',
            shirtDark: '#0652DD',
            hair: '#fdcb6e',
            pants: '#2d3436'
        },
        bonus: { speedMultiplier: 1.1 }
    },
    tank: {
        id: 'tank',
        name: 'IT Support',
        description: 'Have you tried turning it off and on?',
        unlocked: false,
        unlockCondition: 'Zap 50 coworkers total',
        colors: {
            shirt: '#6c5ce7',
            shirtLight: '#a29bfe',
            shirtDark: '#5b4cdb',
            hair: '#2d3436',
            pants: '#636e72'
        },
        bonus: { stunResistance: 0.5 }
    },
    fighter: {
        id: 'fighter',
        name: 'HR Karen',
        description: 'Would like to speak to the manager',
        unlocked: false,
        unlockCondition: 'Punch 100 coworkers total',
        colors: {
            shirt: '#d63031',
            shirtLight: '#ff7675',
            shirtDark: '#b71c1c',
            hair: '#fdcb6e',
            pants: '#2d3436'
        },
        bonus: { punchRange: 4 }
    },
    ghost: {
        id: 'ghost',
        name: 'The Quiet One',
        description: 'Nobody notices them in meetings',
        unlocked: false,
        unlockCondition: 'Find the Floor 13 secret exit',
        colors: {
            shirt: '#636e72',
            shirtLight: '#b2bec3',
            shirtDark: '#2d3436',
            hair: '#dfe6e9',
            pants: '#2d3436'
        },
        bonus: { enemyDetectionRange: 0.8 }
    }
};

let playerProgress = {
    selectedCharacter: 'default',
    unlockedCharacters: ['default'],
    totalRuns: 0,
    totalWins: 0,
    totalPunches: 0,
    totalZaps: 0,
    totalFloorsCleared: 0,
    bestFloor: 23,
    secretExitFound: false,
    perfectRunAchieved: false,
    achievements: [],
    wasHitThisRun: false
};

function loadProgress() {
    try {
        const saved = localStorage.getItem('deadline_progress');
        if (saved) {
            playerProgress = { ...playerProgress, ...JSON.parse(saved) };
        }
        // Sync the global selectedCharacter for asset lookups
        selectedCharacter = CHARACTER_ID_TO_ASSET[playerProgress.selectedCharacter] || 'corporate_employee';
        checkUnlocks();
    } catch (e) {
        console.log('Failed to load progress:', e);
    }
}

function saveProgress() {
    try {
        localStorage.setItem('deadline_progress', JSON.stringify(playerProgress));
    } catch (e) {
        console.log('Failed to save progress:', e);
    }
}

// ============================================
// SAVE/RESUME GAME STATE
// ============================================
function saveGameState() {
    const saveData = {
        floor: gameState.floor,
        timer: gameState.timer,
        powerup: gameState.powerup,
        powerupTimer: gameState.powerupTimer,
        player: { ...gameState.player },
        enemies: gameState.enemies.map(e => ({ ...e })),
        enemiesKnockedOut: gameState.enemiesKnockedOut,
        enemiesZapped: gameState.enemiesZapped,
        wasHitThisRun: playerProgress.wasHitThisRun,
        savedAt: Date.now()
    };

    try {
        localStorage.setItem('deadline_savedGame', JSON.stringify(saveData));
        showSaveNotification('Game saved!');
        console.log('Game saved at floor', gameState.floor);
        return true;
    } catch (e) {
        console.log('Failed to save game:', e);
        return false;
    }
}

function loadGameState() {
    try {
        const saved = localStorage.getItem('deadline_savedGame');
        if (!saved) return null;
        return JSON.parse(saved);
    } catch (e) {
        console.log('Failed to load saved game:', e);
        return null;
    }
}

function hasSavedGame() {
    return localStorage.getItem('deadline_savedGame') !== null;
}

function clearSavedGame() {
    localStorage.removeItem('deadline_savedGame');
}

function resumeGame() {
    const saveData = loadGameState();
    if (!saveData) {
        console.log('No saved game found');
        return false;
    }

    // Check if save is recent (within 24 hours)
    const age = Date.now() - saveData.savedAt;
    if (age > 24 * 60 * 60 * 1000) {
        console.log('Save too old, clearing');
        clearSavedGame();
        return false;
    }

    // Restore game state
    gameState.floor = saveData.floor;
    gameState.enemiesKnockedOut = saveData.enemiesKnockedOut || 0;
    gameState.enemiesZapped = saveData.enemiesZapped || 0;
    playerProgress.wasHitThisRun = saveData.wasHitThisRun || false;

    // Initialize the level first to set up the maze
    document.getElementById('message').style.display = 'none';
    gameState.gameOver = false;
    gameState.won = false;
    gameState.started = true;
    gameState.paused = false;
    updatePlayerColors();
    initLevel();

    // Override with saved values
    gameState.timer = saveData.timer;
    gameState.powerup = saveData.powerup;
    gameState.powerupTimer = saveData.powerupTimer;
    gameState.player.x = saveData.player.x;
    gameState.player.y = saveData.player.y;
    gameState.player.hitCount = saveData.player.hitCount || 0;
    gameState.player.stunned = 0; // Reset stun on resume

    // Clear the saved game after loading
    clearSavedGame();

    showSaveNotification('Game resumed!');
    console.log('Game resumed at floor', gameState.floor);
    return true;
}

function showSaveNotification(message) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `position:fixed;top:80px;left:50%;transform:translateX(-50%);padding:10px 25px;background:rgba(46,204,113,0.9);color:#fff;font-family:'Courier New',monospace;font-size:14px;border-radius:6px;border:2px solid #27ae60;z-index:1000;`;
    document.body.appendChild(notification);
    setTimeout(() => { notification.style.opacity = '0'; notification.style.transition = 'opacity 0.5s'; setTimeout(() => notification.remove(), 500); }, 2000);
}

function checkUnlocks() {
    let newUnlocks = [];
    if (playerProgress.perfectRunAchieved && !playerProgress.unlockedCharacters.includes('speedster')) {
        playerProgress.unlockedCharacters.push('speedster');
        newUnlocks.push(CHARACTERS.speedster);
    }
    if (playerProgress.totalZaps >= 50 && !playerProgress.unlockedCharacters.includes('tank')) {
        playerProgress.unlockedCharacters.push('tank');
        newUnlocks.push(CHARACTERS.tank);
    }
    if (playerProgress.totalPunches >= 100 && !playerProgress.unlockedCharacters.includes('fighter')) {
        playerProgress.unlockedCharacters.push('fighter');
        newUnlocks.push(CHARACTERS.fighter);
    }
    if (playerProgress.secretExitFound && !playerProgress.unlockedCharacters.includes('ghost')) {
        playerProgress.unlockedCharacters.push('ghost');
        newUnlocks.push(CHARACTERS.ghost);
    }
    for (const char of newUnlocks) {
        showCharacterUnlock(char);
    }
    saveProgress();
    return newUnlocks;
}

function showCharacterUnlock(character) {
    const notification = document.createElement('div');
    notification.innerHTML = `<div style="font-size:48px;margin-bottom:10px">🔓</div>
        <div style="font-size:14px;color:#fff;letter-spacing:3px;margin-bottom:8px">CHARACTER UNLOCKED!</div>
        <div style="font-size:24px;color:#ffe66d;font-weight:bold;margin-bottom:5px">${character.name}</div>
        <div style="font-size:12px;color:rgba(255,255,255,0.8)">${character.description}</div>`;
    notification.style.cssText = `position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:linear-gradient(180deg,rgba(78,205,196,0.95) 0%,rgba(46,134,130,0.95) 100%);padding:30px 50px;border-radius:12px;border:3px solid #ffe66d;box-shadow:0 0 60px rgba(255,230,109,0.6);z-index:500;text-align:center;font-family:'Courier New',monospace;`;
    document.body.appendChild(notification);
    setTimeout(() => { notification.style.opacity = '0'; notification.style.transition = 'opacity 0.5s'; setTimeout(() => notification.remove(), 500); }, 3000);
}

function getSelectedCharacter() {
    return CHARACTERS[playerProgress.selectedCharacter] || CHARACTERS.default;
}

function selectCharacter(charId) {
    if (playerProgress.unlockedCharacters.includes(charId)) {
        playerProgress.selectedCharacter = charId;
        // Update the global selectedCharacter for asset lookups
        selectedCharacter = CHARACTER_ID_TO_ASSET[charId] || 'corporate_employee';
        saveProgress();
        updatePlayerColors();
        return true;
    }
    return false;
}

function updatePlayerColors() {
    const char = getSelectedCharacter();
    if (char.colors) {
        COLORS.playerShirt = char.colors.shirt;
        COLORS.playerShirtLight = char.colors.shirtLight;
        COLORS.playerShirtDark = char.colors.shirtDark;
        COLORS.playerHair = char.colors.hair;
        COLORS.playerPants = char.colors.pants;
    }
}

function updateProgressAfterRun(won) {
    playerProgress.totalRuns++;
    playerProgress.totalPunches += gameState.enemiesKnockedOut || 0;
    playerProgress.totalZaps += gameState.enemiesZapped || 0;
    playerProgress.totalFloorsCleared += (23 - gameState.floor);

    // Also update playerStats for milestones
    playerStats.totalFloorsCleared += (23 - gameState.floor);
    playerStats.enemiesPunched += gameState.enemiesKnockedOut || 0;
    playerStats.enemiesZapped += gameState.enemiesZapped || 0;
    playerStats.totalRuns++;

    // === NEW: Escape Points System (Meta-Progression) ===
    // Award escape points based on performance - even failed runs give progress
    const floorsDescended = (gameState.quickRunMode ? 7 : 23) - gameState.floor;
    let escapePointsEarned = 0;

    // Base points for floors cleared (10 per floor)
    escapePointsEarned += floorsDescended * 10;

    // Bonus for coins collected (1 point per 10 coins)
    escapePointsEarned += Math.floor((gameState.coinsCollected || 0) / 10);

    // Bonus for enemies knocked out (5 per knockout)
    escapePointsEarned += (gameState.enemiesKnockedOut || 0) * 5;

    // Bonus for enemies zapped (3 per zap)
    escapePointsEarned += (gameState.enemiesZapped || 0) * 3;

    // Victory bonus (100 points)
    if (won) {
        escapePointsEarned += 100;

        // Perfect run bonus (no hits taken)
        if (!playerProgress.wasHitThisRun) {
            escapePointsEarned += 50;
        }

        // Quick Run completion bonus
        if (gameState.quickRunMode) {
            escapePointsEarned += 25;
        }
    }

    // Update persistent escape points
    playerStats.escapePoints = (playerStats.escapePoints || 0) + escapePointsEarned;
    playerStats.totalCoinsCollected = (playerStats.totalCoinsCollected || 0) + (gameState.coinsCollected || 0);

    console.log(`Earned ${escapePointsEarned} escape points. Total: ${playerStats.escapePoints}`);

    if (won) {
        playerProgress.totalWins++;
        playerStats.totalWins++;
        if (!playerProgress.wasHitThisRun) {
            playerProgress.perfectRunAchieved = true;
        }
        // Track fastest win
        if (gameState.runTime && (!playerStats.fastestWin || gameState.runTime < playerStats.fastestWin)) {
            playerStats.fastestWin = gameState.runTime;
        }
    } else {
        playerStats.totalDeaths++;
    }

    if (gameState.floor < playerProgress.bestFloor) {
        playerProgress.bestFloor = gameState.floor;
    }
    if (gameState.floor < playerStats.bestFloor) {
        playerStats.bestFloor = gameState.floor;
    }

    // Save playerStats
    savePlayerStats();

    // Check for new milestone unlocks
    const newMilestones = checkMilestones();
    if (newMilestones.length > 0) {
        showMilestoneUnlocks(newMilestones);
    }

    checkUnlocks();
    checkAchievements();
    saveProgress();
}

// ============================================
// ACHIEVEMENTS SYSTEM
// ============================================
const ACHIEVEMENTS = {
    first_escape: { id: 'first_escape', name: 'Freedom!', description: 'Complete your first escape', icon: '🏃', condition: () => playerProgress.totalWins >= 1 },
    serial_escaper: { id: 'serial_escaper', name: 'Serial Escaper', description: 'Complete 10 escapes', icon: '🏆', condition: () => playerProgress.totalWins >= 10 },
    punchy: { id: 'punchy', name: 'Punchy', description: 'Knock out 50 coworkers', icon: '🥊', condition: () => playerProgress.totalPunches >= 50 },
    hr_nightmare: { id: 'hr_nightmare', name: 'HR Nightmare', description: 'Knock out 100 coworkers', icon: '💢', condition: () => playerProgress.totalPunches >= 100 },
    zap_happy: { id: 'zap_happy', name: 'Zap Happy', description: 'Zap 25 coworkers', icon: '⚡', condition: () => playerProgress.totalZaps >= 25 },
    electric_personality: { id: 'electric_personality', name: 'Electric Personality', description: 'Zap 50 coworkers', icon: '🔌', condition: () => playerProgress.totalZaps >= 50 },
    flawless: { id: 'flawless', name: 'Flawless Victory', description: 'Complete a run without getting hit', icon: '✨', condition: () => playerProgress.perfectRunAchieved },
    secret_finder: { id: 'secret_finder', name: 'Secret Finder', description: 'Find the Floor 13 secret exit', icon: '🔮', condition: () => playerProgress.secretExitFound },
    dedicated: { id: 'dedicated', name: 'Dedicated', description: 'Attempt 25 runs', icon: '💪', condition: () => playerProgress.totalRuns >= 25 },
    veteran: { id: 'veteran', name: 'Veteran', description: 'Attempt 100 runs', icon: '🎖️', condition: () => playerProgress.totalRuns >= 100 },
    floor_master: { id: 'floor_master', name: 'Floor Master', description: 'Clear 100 total floors', icon: '🏢', condition: () => playerProgress.totalFloorsCleared >= 100 },
    speed_demon: { id: 'speed_demon', name: 'Speed Demon', description: 'Reach Floor 10 in a single run', icon: '💨', condition: () => playerProgress.bestFloor <= 10 },
    almost_there: { id: 'almost_there', name: 'Almost There', description: 'Reach Floor 5 in a single run', icon: '🎯', condition: () => playerProgress.bestFloor <= 5 }
};

function checkAchievements() {
    let newAchievements = [];
    for (const [id, achievement] of Object.entries(ACHIEVEMENTS)) {
        if (!playerProgress.achievements.includes(id) && achievement.condition()) {
            playerProgress.achievements.push(id);
            newAchievements.push(achievement);
        }
    }
    for (const achievement of newAchievements) {
        showAchievementUnlock(achievement);
    }
    return newAchievements;
}

function showAchievementUnlock(achievement) {
    const notification = document.createElement('div');
    notification.innerHTML = `<div style="display:flex;align-items:center;gap:15px;">
        <div style="font-size:36px">${achievement.icon}</div>
        <div>
            <div style="font-size:11px;color:#ffe66d;letter-spacing:2px;margin-bottom:3px">ACHIEVEMENT UNLOCKED</div>
            <div style="font-size:16px;color:#fff;font-weight:bold">${achievement.name}</div>
            <div style="font-size:11px;color:#aaa">${achievement.description}</div>
        </div>
    </div>`;
    notification.style.cssText = `position:fixed;top:20px;right:20px;background:linear-gradient(180deg,rgba(40,50,70,0.95) 0%,rgba(25,30,45,0.95) 100%);padding:15px 25px;border-radius:8px;border:2px solid #ffe66d;box-shadow:0 0 30px rgba(255,230,109,0.4);z-index:500;font-family:'Courier New',monospace;animation:slideIn 0.5s ease-out;`;

    // Add animation keyframes
    if (!document.getElementById('achievementStyles')) {
        const style = document.createElement('style');
        style.id = 'achievementStyles';
        style.textContent = `@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}`;
        document.head.appendChild(style);
    }

    document.body.appendChild(notification);
    setTimeout(() => { notification.style.opacity = '0'; notification.style.transition = 'opacity 0.5s'; setTimeout(() => notification.remove(), 500); }, 4000);
}

function showAchievementsScreen() {
    let modal = document.getElementById('achievementsModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'achievementsModal';
        modal.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);display:flex;justify-content:center;align-items:center;z-index:400;`;
        document.body.appendChild(modal);
    }

    const unlocked = playerProgress.achievements.length;
    const total = Object.keys(ACHIEVEMENTS).length;

    let html = `<div style="background:linear-gradient(180deg,rgba(30,40,60,0.98) 0%,rgba(15,20,35,0.99) 100%);padding:30px;border-radius:12px;border:3px solid #ffe66d;max-width:600px;max-height:80vh;overflow-y:auto;">
        <h2 style="color:#ffe66d;text-align:center;margin-bottom:5px;letter-spacing:3px;">ACHIEVEMENTS</h2>
        <div style="color:#888;text-align:center;margin-bottom:20px;font-size:12px;">${unlocked}/${total} Unlocked</div>
        <div style="display:grid;gap:10px;">`;

    for (const [id, achievement] of Object.entries(ACHIEVEMENTS)) {
        const earned = playerProgress.achievements.includes(id);
        const opacity = earned ? '1' : '0.4';
        const borderColor = earned ? '#ffe66d' : '#333';

        html += `<div style="display:flex;align-items:center;gap:15px;background:rgba(0,0,0,0.4);border:1px solid ${borderColor};border-radius:6px;padding:10px 15px;opacity:${opacity};">
            <div style="font-size:24px;filter:${earned ? 'none' : 'grayscale(100%)'}">${achievement.icon}</div>
            <div style="flex:1">
                <div style="color:#fff;font-size:13px;font-weight:bold">${achievement.name}</div>
                <div style="color:#888;font-size:11px">${achievement.description}</div>
            </div>
            ${earned ? '<div style="color:#ffe66d;font-size:10px">✓</div>' : ''}
        </div>`;
    }

    html += `</div>
        <div style="text-align:center;margin-top:20px;">
            <button onclick="document.getElementById('achievementsModal').style.display='none'" style="padding:12px 30px;font-size:14px;background:linear-gradient(180deg,#ffe66d 0%,#f39c12 100%);color:#000;border:none;cursor:pointer;font-family:'Courier New',monospace;text-transform:uppercase;border-radius:4px;letter-spacing:2px;font-weight:bold;">BACK</button>
        </div>
    </div>`;

    modal.innerHTML = html;
    modal.style.display = 'flex';
}

function addAchievementsToTitle() {
    const tertiaryRow = document.getElementById('tertiaryButtons');
    if (tertiaryRow && !document.getElementById('titleAchievementsBtn')) {
        const achieveBtn = document.createElement('button');
        achieveBtn.id = 'titleAchievementsBtn';
        achieveBtn.className = 'btn-tertiary';
        achieveBtn.textContent = 'ACHIEVEMENTS';
        achieveBtn.onclick = showAchievementsScreen;
        tertiaryRow.appendChild(achieveBtn);
    }
}

// ============================================
// STATISTICS SCREEN
// ============================================
function showStatsScreen() {
    let modal = document.getElementById('statsModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'statsModal';
        modal.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);display:flex;justify-content:center;align-items:center;z-index:400;`;
        document.body.appendChild(modal);
    }

    const winRate = playerProgress.totalRuns > 0 ? Math.round((playerProgress.totalWins / playerProgress.totalRuns) * 100) : 0;
    const avgFloorsPerRun = playerProgress.totalRuns > 0 ? (playerProgress.totalFloorsCleared / playerProgress.totalRuns).toFixed(1) : 0;

    const stats = [
        { label: 'Total Runs', value: playerProgress.totalRuns, icon: '🎮' },
        { label: 'Total Wins', value: playerProgress.totalWins, icon: '🏆' },
        { label: 'Win Rate', value: winRate + '%', icon: '📊' },
        { label: 'Best Floor Reached', value: playerProgress.bestFloor === 23 ? 'N/A' : `Floor ${playerProgress.bestFloor}`, icon: '⬇️' },
        { label: 'Total Floors Cleared', value: playerProgress.totalFloorsCleared, icon: '🏢' },
        { label: 'Avg Floors/Run', value: avgFloorsPerRun, icon: '📈' },
        { label: 'Coworkers Punched', value: playerProgress.totalPunches, icon: '🥊' },
        { label: 'Coworkers Zapped', value: playerProgress.totalZaps, icon: '⚡' },
        { label: 'Secret Exit Found', value: playerProgress.secretExitFound ? 'Yes!' : 'Not yet', icon: '🔮' },
        { label: 'Perfect Run', value: playerProgress.perfectRunAchieved ? 'Achieved!' : 'Not yet', icon: '✨' },
        { label: 'Characters Unlocked', value: `${playerProgress.unlockedCharacters.length}/${Object.keys(CHARACTERS).length}`, icon: '👥' },
        { label: 'Achievements Earned', value: `${playerProgress.achievements.length}/${Object.keys(ACHIEVEMENTS).length}`, icon: '🏅' }
    ];

    let html = `<div style="background:linear-gradient(180deg,rgba(30,40,60,0.98) 0%,rgba(15,20,35,0.99) 100%);padding:30px 40px;border-radius:12px;border:3px solid #3498db;max-width:500px;max-height:80vh;overflow-y:auto;">
        <h2 style="color:#3498db;text-align:center;margin-bottom:20px;letter-spacing:3px;">STATISTICS</h2>
        <div style="display:grid;gap:8px;">`;

    for (const stat of stats) {
        html += `<div style="display:flex;justify-content:space-between;align-items:center;background:rgba(0,0,0,0.4);padding:10px 15px;border-radius:6px;border-left:3px solid #3498db;">
            <span style="color:#888;font-size:13px;">${stat.icon} ${stat.label}</span>
            <span style="color:#fff;font-size:14px;font-weight:bold;">${stat.value}</span>
        </div>`;
    }

    html += `</div>
        <div style="text-align:center;margin-top:25px;">
            <button onclick="resetAllProgress()" style="padding:10px 20px;font-size:12px;background:linear-gradient(180deg,#e74c3c 0%,#c0392b 100%);color:#fff;border:none;cursor:pointer;font-family:'Courier New',monospace;text-transform:uppercase;border-radius:4px;letter-spacing:1px;margin-right:15px;">RESET ALL DATA</button>
            <button onclick="document.getElementById('statsModal').style.display='none'" style="padding:10px 25px;font-size:14px;background:linear-gradient(180deg,#3498db 0%,#2980b9 100%);color:#fff;border:none;cursor:pointer;font-family:'Courier New',monospace;text-transform:uppercase;border-radius:4px;letter-spacing:2px;">BACK</button>
        </div>
    </div>`;

    modal.innerHTML = html;
    modal.style.display = 'flex';
}

function resetAllProgress() {
    if (confirm('Are you sure you want to reset ALL progress? This cannot be undone!')) {
        playerProgress = {
            selectedCharacter: 'default',
            unlockedCharacters: ['default'],
            totalRuns: 0,
            totalWins: 0,
            totalPunches: 0,
            totalZaps: 0,
            totalFloorsCleared: 0,
            bestFloor: 23,
            secretExitFound: false,
            perfectRunAchieved: false,
            achievements: [],
            wasHitThisRun: false
        };
        saveProgress();
        clearSavedGame();
        showStatsScreen(); // Refresh the screen
        updateResumeButton();
    }
}

function addStatsToTitle() {
    const tertiaryRow = document.getElementById('tertiaryButtons');
    if (tertiaryRow && !document.getElementById('titleStatsBtn')) {
        const statsBtn = document.createElement('button');
        statsBtn.id = 'titleStatsBtn';
        statsBtn.className = 'btn-tertiary';
        statsBtn.textContent = 'STATS';
        statsBtn.onclick = showStatsScreen;
        tertiaryRow.appendChild(statsBtn);
    }
}

function showControllerNotification(connected) {
    // Create or update notification element
    let notification = document.getElementById('controllerNotification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'controllerNotification';
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 12px 24px;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            z-index: 1000;
            transition: opacity 0.3s ease;
            pointer-events: none;
        `;
        document.body.appendChild(notification);
    }

    if (connected) {
        notification.textContent = '🎮 Controller connected';
        notification.style.background = 'rgba(46, 204, 113, 0.9)';
        notification.style.color = '#fff';
        notification.style.border = '2px solid #27ae60';
    } else {
        notification.textContent = '🎮 Controller disconnected';
        notification.style.background = 'rgba(231, 76, 60, 0.9)';
        notification.style.color = '#fff';
        notification.style.border = '2px solid #c0392b';
    }

    notification.style.opacity = '1';

    // Fade out after 2 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
    }, 2000);
}

// Check if position is in a special zone
function isInCafeteria(x, y) {
    if (!gameState.maze[y] || gameState.maze[y][x] === undefined) return false;
    return gameState.maze[y][x] === TILE.CAFETERIA;
}

function isInBathroom(x, y) {
    if (!gameState.maze[y] || gameState.maze[y][x] === undefined) return false;
    return gameState.maze[y][x] === TILE.BATHROOM;
}

// Get stun duration based on hit count - more forgiving
function getStunDuration(hitCount) {
    if (hitCount <= 1) return 1.5;  // First hit: 1.5 seconds
    if (hitCount === 2) return 2;    // Second hit: 2 seconds
    if (hitCount === 3) return 2.5;  // Third hit: 2.5 seconds
    if (hitCount === 4) return 3;    // Fourth hit: 3 seconds
    return 4; // Max stun: 4 seconds (was 15!)
}

// BFS pathfinding to check if path exists between two points
function hasPath(maze, startX, startY, endX, endY) {
    if (!maze[startY] || !maze[endY]) return false;

    const isWalkable = (x, y) => {
        if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) return false;
        const tile = maze[y][x];
        return tile !== TILE.WALL && tile !== TILE.DESK;
    };

    if (!isWalkable(startX, startY) || !isWalkable(endX, endY)) return false;

    const visited = new Set();
    const queue = [[startX, startY]];
    visited.add(`${startX},${startY}`);

    while (queue.length > 0) {
        const [x, y] = queue.shift();

        if (x === endX && y === endY) return true;

        const neighbors = [[x+1, y], [x-1, y], [x, y+1], [x, y-1]];
        for (const [nx, ny] of neighbors) {
            const key = `${nx},${ny}`;
            if (!visited.has(key) && isWalkable(nx, ny)) {
                visited.add(key);
                queue.push([nx, ny]);
            }
        }
    }

    return false;
}

// Carve a guaranteed path between two points
function carvePath(maze, startX, startY, endX, endY) {
    let cx = startX;
    let cy = startY;

    while (cx !== endX || cy !== endY) {
        // Make sure current position is walkable
        if (maze[cy][cx] === TILE.WALL || maze[cy][cx] === TILE.DESK) {
            maze[cy][cx] = TILE.FLOOR;
        }

        // Also clear adjacent tiles to make wider paths (prevents getting boxed in)
        if (Math.random() > 0.5) {
            const clearDirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
            const dir = clearDirs[Math.floor(Math.random() * clearDirs.length)];
            const adjX = cx + dir[0];
            const adjY = cy + dir[1];
            if (adjX > 0 && adjX < MAP_WIDTH - 1 && adjY > 0 && adjY < MAP_HEIGHT - 1) {
                if (maze[adjY][adjX] === TILE.WALL) {
                    maze[adjY][adjX] = TILE.FLOOR;
                }
            }
        }

        // Move towards destination
        if (Math.random() > 0.3) {
            if (cx < endX) cx++;
            else if (cx > endX) cx--;
        } else {
            if (cy < endY) cy++;
            else if (cy > endY) cy--;
        }
    }

    // Make sure endpoint is walkable
    if (maze[endY][endX] === TILE.WALL || maze[endY][endX] === TILE.DESK) {
        maze[endY][endX] = TILE.FLOOR;
    }
}

// Force clear a path - more aggressive than carvePath
function forcePathClear(maze, startX, startY, endX, endY) {
    let cx = startX;
    let cy = startY;

    // Clear a 3-wide path
    while (cx !== endX || cy !== endY) {
        // Clear current tile and neighbors
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const nx = cx + dx;
                const ny = cy + dy;
                if (nx > 0 && nx < MAP_WIDTH - 1 && ny > 0 && ny < MAP_HEIGHT - 1) {
                    if (maze[ny][nx] === TILE.WALL || maze[ny][nx] === TILE.DESK) {
                        maze[ny][nx] = TILE.FLOOR;
                    }
                }
            }
        }

        // Move towards destination
        if (cx < endX) cx++;
        else if (cx > endX) cx--;
        else if (cy < endY) cy++;
        else if (cy > endY) cy--;
    }

    // Clear around endpoint
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            const nx = endX + dx;
            const ny = endY + dy;
            if (nx > 0 && nx < MAP_WIDTH - 1 && ny > 0 && ny < MAP_HEIGHT - 1) {
                if (maze[ny][nx] === TILE.WALL || maze[ny][nx] === TILE.DESK) {
                    maze[ny][nx] = TILE.FLOOR;
                }
            }
        }
    }
}

// Last resort - clear a straight line path
function straightLineClear(maze, startX, startY, endX, endY) {
    // Clear horizontal path
    const minX = Math.min(startX, endX);
    const maxX = Math.max(startX, endX);
    for (let x = minX; x <= maxX; x++) {
        if (maze[startY][x] === TILE.WALL || maze[startY][x] === TILE.DESK) {
            maze[startY][x] = TILE.FLOOR;
        }
        // Also clear tile above and below
        if (startY > 1 && (maze[startY-1][x] === TILE.WALL || maze[startY-1][x] === TILE.DESK)) {
            maze[startY-1][x] = TILE.FLOOR;
        }
        if (startY < MAP_HEIGHT - 2 && (maze[startY+1][x] === TILE.WALL || maze[startY+1][x] === TILE.DESK)) {
            maze[startY+1][x] = TILE.FLOOR;
        }
    }

    // Clear vertical path
    const minY = Math.min(startY, endY);
    const maxY = Math.max(startY, endY);
    for (let y = minY; y <= maxY; y++) {
        if (maze[y][endX] === TILE.WALL || maze[y][endX] === TILE.DESK) {
            maze[y][endX] = TILE.FLOOR;
        }
        // Also clear tile left and right
        if (endX > 1 && (maze[y][endX-1] === TILE.WALL || maze[y][endX-1] === TILE.DESK)) {
            maze[y][endX-1] = TILE.FLOOR;
        }
        if (endX < MAP_WIDTH - 2 && (maze[y][endX+1] === TILE.WALL || maze[y][endX+1] === TILE.DESK)) {
            maze[y][endX+1] = TILE.FLOOR;
        }
    }
}

// Generate maze with GUARANTEED paths to all exits
// This uses a simple approach: start with all floors, then add walls that DON'T block paths
function generateMaze() {
    const maze = [];
    const startX = Math.floor(MAP_WIDTH / 2);
    const startY = Math.floor(MAP_HEIGHT / 2);

    // Exit positions (corners)
    const corners = [
        { x: 1, y: 1 },
        { x: MAP_WIDTH - 2, y: 1 },
        { x: 1, y: MAP_HEIGHT - 2 },
        { x: MAP_WIDTH - 2, y: MAP_HEIGHT - 2 }
    ];

    // Start with all FLOOR tiles
    for (let y = 0; y < MAP_HEIGHT; y++) {
        maze[y] = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            // Border is always wall
            if (x === 0 || x === MAP_WIDTH - 1 || y === 0 || y === MAP_HEIGHT - 1) {
                maze[y][x] = TILE.WALL;
            } else {
                maze[y][x] = TILE.FLOOR;
            }
        }
    }

    // Now ADD walls randomly, but verify each wall doesn't block any path
    const wallsToAdd = 80; // Number of wall tiles to try adding
    let wallsAdded = 0;
    let attempts = 0;
    const maxAttempts = 300;

    while (wallsAdded < wallsToAdd && attempts < maxAttempts) {
        attempts++;
        const x = Math.floor(gameRandom() * (MAP_WIDTH - 2)) + 1;
        const y = Math.floor(gameRandom() * (MAP_HEIGHT - 2)) + 1;

        // Don't place walls near center (player spawn)
        if (Math.abs(x - startX) <= 2 && Math.abs(y - startY) <= 2) continue;

        // Don't place walls near exits
        let nearExit = false;
        for (const corner of corners) {
            if (Math.abs(x - corner.x) <= 2 && Math.abs(y - corner.y) <= 2) {
                nearExit = true;
                break;
            }
        }
        if (nearExit) continue;

        // Skip if already a wall
        if (maze[y][x] !== TILE.FLOOR) continue;

        // Temporarily place wall
        maze[y][x] = TILE.WALL;

        // Check if ALL paths still exist
        let allPathsExist = true;
        for (const corner of corners) {
            if (!hasPath(maze, startX, startY, corner.x, corner.y)) {
                allPathsExist = false;
                break;
            }
        }

        if (allPathsExist) {
            wallsAdded++;
        } else {
            // Remove wall if it blocks any path
            maze[y][x] = TILE.FLOOR;
        }
    }

    console.log(`Maze generated: ${wallsAdded} walls added, paths verified`);

    // === NEW: Add bottleneck corridors near exits ===
    // Creates chokepoints that force player-enemy confrontation
    addBottleneckCorridors(maze, corners, startX, startY);

    return maze;
}

// === NEW: Create bottleneck corridors near exits ===
// This forces confrontation by creating narrow paths that players and enemies must share
function addBottleneckCorridors(maze, corners, startX, startY) {
    for (const corner of corners) {
        // Create a 1-tile wide corridor leading to each exit
        // The corridor is 3-4 tiles long, positioned 3-4 tiles away from the exit

        // Determine corridor direction based on which corner
        const isTopCorner = corner.y < MAP_HEIGHT / 2;
        const isLeftCorner = corner.x < MAP_WIDTH / 2;

        // Create horizontal or vertical bottleneck based on corner position
        if (Math.random() > 0.5) {
            // Horizontal bottleneck
            const bottleneckY = corner.y + (isTopCorner ? 3 : -3);
            const startBottleneckX = corner.x + (isLeftCorner ? 2 : -4);

            if (bottleneckY > 1 && bottleneckY < MAP_HEIGHT - 2) {
                // Create walls above and below to form corridor
                for (let i = 0; i < 3; i++) {
                    const wallX = startBottleneckX + i;
                    if (wallX > 1 && wallX < MAP_WIDTH - 2) {
                        // Wall above corridor
                        if (bottleneckY - 1 > 0 && maze[bottleneckY - 1][wallX] === TILE.FLOOR) {
                            maze[bottleneckY - 1][wallX] = TILE.WALL;
                        }
                        // Wall below corridor
                        if (bottleneckY + 1 < MAP_HEIGHT - 1 && maze[bottleneckY + 1][wallX] === TILE.FLOOR) {
                            maze[bottleneckY + 1][wallX] = TILE.WALL;
                        }
                        // Ensure corridor itself is clear
                        if (maze[bottleneckY][wallX] === TILE.WALL) {
                            maze[bottleneckY][wallX] = TILE.FLOOR;
                        }
                    }
                }
            }
        } else {
            // Vertical bottleneck
            const bottleneckX = corner.x + (isLeftCorner ? 3 : -3);
            const startBottleneckY = corner.y + (isTopCorner ? 2 : -4);

            if (bottleneckX > 1 && bottleneckX < MAP_WIDTH - 2) {
                // Create walls left and right to form corridor
                for (let i = 0; i < 3; i++) {
                    const wallY = startBottleneckY + i;
                    if (wallY > 1 && wallY < MAP_HEIGHT - 2) {
                        // Wall left of corridor
                        if (bottleneckX - 1 > 0 && maze[wallY][bottleneckX - 1] === TILE.FLOOR) {
                            maze[wallY][bottleneckX - 1] = TILE.WALL;
                        }
                        // Wall right of corridor
                        if (bottleneckX + 1 < MAP_WIDTH - 1 && maze[wallY][bottleneckX + 1] === TILE.FLOOR) {
                            maze[wallY][bottleneckX + 1] = TILE.WALL;
                        }
                        // Ensure corridor itself is clear
                        if (maze[wallY][bottleneckX] === TILE.WALL) {
                            maze[wallY][bottleneckX] = TILE.FLOOR;
                        }
                    }
                }
            }
        }
    }

    // Verify paths still exist after adding bottlenecks
    for (const corner of corners) {
        if (!hasPath(maze, startX, startY, corner.x, corner.y)) {
            // If bottleneck blocked a path, force clear it
            forcePathClear(maze, startX, startY, corner.x, corner.y);
        }
    }

    console.log('Bottleneck corridors added near exits');
}

// Add desks after maze generation, verifying they don't block paths
function addDesksToMaze(maze) {
    const startX = Math.floor(MAP_WIDTH / 2);
    const startY = Math.floor(MAP_HEIGHT / 2);
    const corners = [
        { x: 1, y: 1 },
        { x: MAP_WIDTH - 2, y: 1 },
        { x: 1, y: MAP_HEIGHT - 2 },
        { x: MAP_WIDTH - 2, y: MAP_HEIGHT - 2 }
    ];

    let desksAdded = 0;
    let attempts = 0;
    const maxDesks = 8;
    const maxAttempts = 80;

    while (desksAdded < maxDesks && attempts < maxAttempts) {
        attempts++;
        const x = Math.floor(gameRandom() * (MAP_WIDTH - 8)) + 4;
        const y = Math.floor(gameRandom() * (MAP_HEIGHT - 8)) + 4;

        // Skip if not floor
        if (maze[y][x] !== TILE.FLOOR) continue;

        // Skip if near center (player spawn) - larger buffer
        if (Math.abs(x - startX) < 4 && Math.abs(y - startY) < 4) continue;

        // Skip if near any exit - larger buffer
        let nearExit = false;
        for (const corner of corners) {
            if (Math.abs(x - corner.x) < 4 && Math.abs(y - corner.y) < 4) {
                nearExit = true;
                break;
            }
        }
        if (nearExit) continue;

        // Temporarily place desk and check if paths still exist
        maze[y][x] = TILE.DESK;

        let allPathsExist = true;
        for (const corner of corners) {
            if (!hasPath(maze, startX, startY, corner.x, corner.y)) {
                allPathsExist = false;
                break;
            }
        }

        if (allPathsExist) {
            desksAdded++;
        } else {
            // Remove desk if it blocks a path
            maze[y][x] = TILE.FLOOR;
        }
    }
    console.log(`Added ${desksAdded} desks`);
}

// Add cafeteria zone (on some floors)
function addCafeteria(maze) {
    // Place cafeteria in a middle area that doesn't block exits
    const cafeteriaX = 7;
    const cafeteriaY = 7;
    const width = 4;
    const height = 3;

    // Make sure area around cafeteria is walkable first
    for (let y = cafeteriaY - 1; y <= cafeteriaY + height; y++) {
        for (let x = cafeteriaX - 1; x <= cafeteriaX + width; x++) {
            if (y > 0 && y < MAP_HEIGHT - 1 && x > 0 && x < MAP_WIDTH - 1) {
                if (maze[y][x] === TILE.WALL || maze[y][x] === TILE.DESK) {
                    maze[y][x] = TILE.FLOOR;
                }
            }
        }
    }

    // Now place the cafeteria tiles
    for (let y = cafeteriaY; y < cafeteriaY + height; y++) {
        for (let x = cafeteriaX; x < cafeteriaX + width; x++) {
            if (y > 0 && y < MAP_HEIGHT - 1 && x > 0 && x < MAP_WIDTH - 1) {
                maze[y][x] = TILE.CAFETERIA;
            }
        }
    }

    // Ensure multiple entrances
    maze[cafeteriaY + height][cafeteriaX + 1] = TILE.FLOOR;
    maze[cafeteriaY + height][cafeteriaX + 2] = TILE.FLOOR;
    maze[cafeteriaY - 1][cafeteriaX + 1] = TILE.FLOOR;
    maze[cafeteriaY - 1][cafeteriaX + 2] = TILE.FLOOR;
    maze[cafeteriaY + 1][cafeteriaX - 1] = TILE.FLOOR;
    maze[cafeteriaY + 1][cafeteriaX + width] = TILE.FLOOR;

    return { x: cafeteriaX, y: cafeteriaY, width, height };
}

// Add bathroom zone (on every other floor)
function addBathroom(maze) {
    // Place bathroom opposite side (bottom-right area)
    const bathroomX = MAP_WIDTH - 6;
    const bathroomY = MAP_HEIGHT - 6;
    const width = 3;
    const height = 3;

    // Make sure area around bathroom is walkable first
    for (let y = bathroomY - 1; y <= bathroomY + height; y++) {
        for (let x = bathroomX - 1; x <= bathroomX + width; x++) {
            if (y > 0 && y < MAP_HEIGHT - 1 && x > 0 && x < MAP_WIDTH - 1) {
                if (maze[y][x] === TILE.WALL || maze[y][x] === TILE.DESK) {
                    maze[y][x] = TILE.FLOOR;
                }
            }
        }
    }

    // Now place the bathroom tiles
    for (let y = bathroomY; y < bathroomY + height; y++) {
        for (let x = bathroomX; x < bathroomX + width; x++) {
            if (y > 0 && y < MAP_HEIGHT - 1 && x > 0 && x < MAP_WIDTH - 1) {
                maze[y][x] = TILE.BATHROOM;
            }
        }
    }

    // Ensure multiple entrances
    maze[bathroomY][bathroomX - 1] = TILE.FLOOR;
    maze[bathroomY + 1][bathroomX - 1] = TILE.FLOOR;
    maze[bathroomY - 1][bathroomX + 1] = TILE.FLOOR;
    maze[bathroomY + height][bathroomX + 1] = TILE.FLOOR;

    return { x: bathroomX, y: bathroomY, width, height };
}

// Add rooftop garden zone (outdoor area with plants and flowers)
function addGarden(maze) {
    // Place garden in the top-middle area
    const gardenX = Math.floor(MAP_WIDTH / 2) - 2;
    const gardenY = 3;
    const width = 5;
    const height = 4;

    // Make sure area around garden is walkable first
    for (let y = gardenY - 1; y <= gardenY + height; y++) {
        for (let x = gardenX - 1; x <= gardenX + width; x++) {
            if (y > 0 && y < MAP_HEIGHT - 1 && x > 0 && x < MAP_WIDTH - 1) {
                if (maze[y][x] === TILE.WALL || maze[y][x] === TILE.DESK) {
                    maze[y][x] = TILE.FLOOR;
                }
            }
        }
    }

    // Now place the garden tiles
    for (let y = gardenY; y < gardenY + height; y++) {
        for (let x = gardenX; x < gardenX + width; x++) {
            if (y > 0 && y < MAP_HEIGHT - 1 && x > 0 && x < MAP_WIDTH - 1) {
                maze[y][x] = TILE.GARDEN;
            }
        }
    }

    // Ensure multiple entrances
    maze[gardenY + height][gardenX + 1] = TILE.FLOOR;
    maze[gardenY + height][gardenX + 3] = TILE.FLOOR;
    maze[gardenY - 1][gardenX + 2] = TILE.FLOOR;

    return { x: gardenX, y: gardenY, width, height };
}

// Add dog park zone (outdoor recreation area with friendly dog companion powerup)
function addDogPark(maze) {
    // Place dog park on the left side
    const dogParkX = 3;
    const dogParkY = Math.floor(MAP_HEIGHT / 2) - 2;
    const width = 4;
    const height = 5;

    // Make sure area around dog park is walkable first
    for (let y = dogParkY - 1; y <= dogParkY + height; y++) {
        for (let x = dogParkX - 1; x <= dogParkX + width; x++) {
            if (y > 0 && y < MAP_HEIGHT - 1 && x > 0 && x < MAP_WIDTH - 1) {
                if (maze[y][x] === TILE.WALL || maze[y][x] === TILE.DESK) {
                    maze[y][x] = TILE.FLOOR;
                }
            }
        }
    }

    // Now place the dog park tiles
    for (let y = dogParkY; y < dogParkY + height; y++) {
        for (let x = dogParkX; x < dogParkX + width; x++) {
            if (y > 0 && y < MAP_HEIGHT - 1 && x > 0 && x < MAP_WIDTH - 1) {
                maze[y][x] = TILE.DOG_PARK;
            }
        }
    }

    // Ensure multiple entrances
    maze[dogParkY + 2][dogParkX - 1] = TILE.FLOOR;
    maze[dogParkY + 2][dogParkX + width] = TILE.FLOOR;
    maze[dogParkY - 1][dogParkX + 1] = TILE.FLOOR;
    maze[dogParkY + height][dogParkX + 2] = TILE.FLOOR;

    return { x: dogParkX, y: dogParkY, width, height };
}

// Check if position is in garden
function isInGarden(x, y) {
    if (!gameState.maze[y] || gameState.maze[y][x] === undefined) return false;
    return gameState.maze[y][x] === TILE.GARDEN;
}

// Check if position is in dog park
function isInDogPark(x, y) {
    if (!gameState.maze[y] || gameState.maze[y][x] === undefined) return false;
    return gameState.maze[y][x] === TILE.DOG_PARK;
}

// Add secret exit on floor 13
function addSecretExit(maze) {
    // Place it in an alcove on the right side - visible but requires finding the path
    const secretX = MAP_WIDTH - 2;
    const secretY = Math.floor(MAP_HEIGHT / 2);

    // Create small hidden room
    maze[secretY][secretX] = TILE.SECRET_EXIT;
    maze[secretY][secretX - 1] = TILE.FLOOR;
    maze[secretY - 1][secretX - 1] = TILE.FLOOR;
    maze[secretY + 1][secretX - 1] = TILE.FLOOR;

    // Carve a clear path to it from center
    const startX = Math.floor(MAP_WIDTH / 2);
    carvePath(maze, startX, secretY, secretX - 1, secretY);

    return { x: secretX, y: secretY };
}

function initLevel() {
    // Set map dimensions based on floor and aspect ratio
    const dims = getMapDimensionsForFloor(gameState.floor);
    MAP_WIDTH = dims.width;
    MAP_HEIGHT = dims.height;

    // Update tile size based on current resolution and map height
    TILE_SIZE = getTileSize();

    // Canvas size is determined by resolution setting, not map size
    const res = RESOLUTIONS[displaySettings.currentResolution] || RESOLUTIONS['640x640'];
    canvas.width = res.width;
    canvas.height = res.height;

    gameState.maze = generateMaze();

    // Timer calculation - tighter on early floors for more engagement
    // Floor 23: 38s, scaling down gradually
    if (gameState.floor >= 20) {
        // Opening floors (23-20): Start at 38s, decrease by 2s per floor
        // Floor 23: 38s, Floor 22: 36s, Floor 21: 34s, Floor 20: 32s
        gameState.timer = 38 - (23 - gameState.floor) * 2;
    } else if (gameState.floor >= 15) {
        // Early floors (19-15): 35s base
        gameState.timer = 35 - (19 - gameState.floor) * 2;
    } else if (gameState.floor >= 10) {
        // Mid floors (14-10): 30s base
        gameState.timer = 30 - (14 - gameState.floor) * 1;
    } else {
        // Late floors (9-1): 25s base, but more challenging
        gameState.timer = 25;
    }

    // Give more time on larger maps (based on area)
    const mapArea = MAP_WIDTH * MAP_HEIGHT;
    if (mapArea >= 900) gameState.timer += 15;  // Large widescreen maps
    else if (mapArea >= 576) gameState.timer += 12;
    else if (mapArea >= 400) gameState.timer += 6;

    // Apply milestone bonus time rewards
    const rewards = getMilestoneRewards();
    if (rewards.bonusTime > 0) {
        gameState.timer += rewards.bonusTime;
    }

    // Store rewards for use during gameplay
    gameState.milestoneRewards = rewards;

    // Apply weekly challenge modifiers (for daily challenge mode)
    if (dailyChallenge.active && gameState.weeklyChallenge) {
        const mods = gameState.weeklyChallenge.modifiers;
        if (mods.timeMultiplier) {
            gameState.timer = Math.floor(gameState.timer * mods.timeMultiplier);
        }
    }

    gameState.player.x = Math.floor(MAP_WIDTH / 2);
    gameState.player.y = Math.floor(MAP_HEIGHT / 2);
    gameState.player.stunned = 0;
    gameState.player.speed = 1;
    gameState.player.frame = 0;
    // Reset hitCount each floor for fairness
    gameState.player.hitCount = 0;
    gameState.player.lastHitTime = 0;
    gameState.player.burning = 0;
    gameState.punchEffects = [];

    // Reset fires for new floor
    gameState.fires = [];
    gameState.fireSpawnTimer = 5;  // Start spawning fires after 5 seconds

    // Clear around player (2 tile radius for safety)
    for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
            const nx = gameState.player.x + dx;
            const ny = gameState.player.y + dy;
            if (nx > 0 && nx < MAP_WIDTH - 1 && ny > 0 && ny < MAP_HEIGHT - 1) {
                if (gameState.maze[ny][nx] === TILE.WALL || gameState.maze[ny][nx] === TILE.DESK) {
                    gameState.maze[ny][nx] = TILE.FLOOR;
                }
            }
        }
    }

    // Reset zones
    gameState.zones = { cafeteria: null, bathroom: null, garden: null, dogPark: null };
    gameState.secretExit = null;

    // Reset outdoor powerup effects
    gameState.player.shielded = 0;
    gameState.player.companion = null;

    // Add cafeteria on floors 20, 15, 10, 5
    if (gameState.floor === 20 || gameState.floor === 15 || gameState.floor === 10 || gameState.floor === 5) {
        gameState.zones.cafeteria = addCafeteria(gameState.maze);
    }

    // Add bathroom on every other floor
    if (gameState.floor % 2 === 0) {
        gameState.zones.bathroom = addBathroom(gameState.maze);
    }

    // Add rooftop garden on floors 18, 12, 6 (gives shield powerup)
    if (gameState.floor === 18 || gameState.floor === 12 || gameState.floor === 6) {
        gameState.zones.garden = addGarden(gameState.maze);
    }

    // Add dog park on floors 16, 9, 3 (gives companion powerup)
    if (gameState.floor === 16 || gameState.floor === 9 || gameState.floor === 3) {
        gameState.zones.dogPark = addDogPark(gameState.maze);
    }

    // Add secret exit on floor 13
    if (gameState.floor === 13) {
        gameState.secretExit = addSecretExit(gameState.maze);
    }

    // Add desks AFTER special zones, with path verification
    addDesksToMaze(gameState.maze);

    gameState.exits = [
        { x: 1, y: 1 },
        { x: MAP_WIDTH - 2, y: 1 },
        { x: 1, y: MAP_HEIGHT - 2 },
        { x: MAP_WIDTH - 2, y: MAP_HEIGHT - 2 }
    ];

    // FINAL VERIFICATION: Ensure paths exist to ALL exits
    // If any path is blocked, FORCE a clear path
    const startX = gameState.player.x;
    const startY = gameState.player.y;

    for (const exit of gameState.exits) {
        if (!hasPath(gameState.maze, startX, startY, exit.x, exit.y)) {
            console.log(`EMERGENCY: Path blocked to exit at (${exit.x}, ${exit.y}), forcing clear path...`);
            forcePathClear(gameState.maze, startX, startY, exit.x, exit.y);
        }
    }

    // Double-check ALL paths one more time - if still blocked, force clear again
    for (const exit of gameState.exits) {
        if (!hasPath(gameState.maze, startX, startY, exit.x, exit.y)) {
            console.log(`CRITICAL: Still no path to (${exit.x}, ${exit.y}), doing straight-line clear...`);
            straightLineClear(gameState.maze, startX, startY, exit.x, exit.y);
        }
    }

    // Also verify secret exit on floor 13
    if (gameState.floor === 13 && gameState.secretExit) {
        if (!hasPath(gameState.maze, startX, startY, gameState.secretExit.x, gameState.secretExit.y)) {
            console.log('Path blocked to secret exit, forcing clear path...');
            forcePathClear(gameState.maze, startX, startY, gameState.secretExit.x - 1, gameState.secretExit.y);
        }
    }

    // Log final verification
    let allPathsOk = true;
    for (const exit of gameState.exits) {
        if (!hasPath(gameState.maze, startX, startY, exit.x, exit.y)) {
            console.error(`FAILED: No path to exit at (${exit.x}, ${exit.y})`);
            allPathsOk = false;
        }
    }
    if (allPathsOk) {
        console.log('All exit paths verified OK');
    }

    // Progressive enemy introduction
    // Floor 23-22: 1 enemy (very easy start)
    // Floor 21-20: 2 enemies
    // Floor 19-15: 3 enemies
    // Floor 14-10: 4 enemies
    // Floor 9-5: 5 enemies
    // Floor 4-1: 6 enemies
    gameState.enemies = [];

    // Zen mode: no enemies (Playtest Feature #4)
    if (gameState.zenMode) {
        // Skip enemy spawning entirely in Zen mode
    } else {
        let numEnemies;
        // Increased enemy counts on opening floors for more challenge
        if (gameState.floor === 23) numEnemies = 2;      // Was 1
        else if (gameState.floor >= 20) numEnemies = 3;  // Was 2 for 22-20
        else if (gameState.floor >= 15) numEnemies = 3;
        else if (gameState.floor >= 10) numEnemies = 4;
        else if (gameState.floor >= 5) numEnemies = 5;
        else numEnemies = 6;

        // Apply difficulty multiplier (Playtest Feature #1)
        const difficultyPreset = DIFFICULTY_PRESETS[settings.difficulty] || DIFFICULTY_PRESETS.normal;
        numEnemies = Math.max(1, Math.round(numEnemies * (difficultyPreset.enemyMultiplier || 1.0)));

    // Enemy AI difficulty also scales - tighter curve for more challenge
    // Floor 23 only: Easy (slower, more random movement)
    // Floors 22-12: Medium (normal speed, some chasing)
    // Floors 11-1: Hard (faster, aggressive chasing)
    const enemyDifficulty = gameState.floor >= 23 ? 'easy' : (gameState.floor >= 12 ? 'medium' : 'hard');

    for (let i = 0; i < numEnemies; i++) {
        let ex, ey, attempts = 0;
        do {
            ex = Math.floor(gameRandom() * (MAP_WIDTH - 4)) + 2;
            ey = Math.floor(gameRandom() * (MAP_HEIGHT - 4)) + 2;
            attempts++;
        } while ((gameState.maze[ey][ex] !== TILE.FLOOR ||
                 (Math.abs(ex - gameState.player.x) < 5 && Math.abs(ey - gameState.player.y) < 5)) && attempts < 100);

        if (attempts < 100) {
            gameState.enemies.push({
                x: ex,
                y: ey,
                direction: Math.floor(gameRandom() * 4),
                stunned: 0,
                hitCount: 0,
                moveTimer: 0,
                lastAttackTime: 0,
                frame: gameRandom() * Math.PI * 2,
                difficulty: enemyDifficulty,
                scared: 0,  // For dog companion scare effect
                spawnTimer: 0.8  // Spawn warning animation duration
            });
        }
    }
    } // Close the else block for non-zen mode enemy spawning

    gameState.powerups = [];
    // === CHANGED: Increased power-up density for better flow ===
    // More power-ups = more tactical decisions = more engagement
    let numPowerups;
    if (gameState.floor >= 20) {
        numPowerups = 5 + Math.floor(gameRandom() * 3);  // 5-7 powerups (was 2-3)
    } else if (gameState.floor >= 10) {
        numPowerups = 6 + Math.floor(gameRandom() * 4);  // 6-9 powerups (was 3-5)
    } else {
        numPowerups = 8 + Math.floor(gameRandom() * 4);  // 8-11 powerups (late game gets more chaos)
    }
    const MIN_POWERUP_DISTANCE = 6; // Reduced from 8 to allow more density

    for (let i = 0; i < numPowerups; i++) {
        let px, py, attempts = 0;
        let validPlacement = false;

        do {
            px = Math.floor(gameRandom() * (MAP_WIDTH - 4)) + 2;
            py = Math.floor(gameRandom() * (MAP_HEIGHT - 4)) + 2;
            attempts++;

            // Check if tile is floor
            if (gameState.maze[py][px] !== TILE.FLOOR) continue;

            // ANTI-CLUSTERING: Check distance from ALL existing powerups
            validPlacement = gameState.powerups.every(p =>
                Math.abs(px - p.x) + Math.abs(py - p.y) >= MIN_POWERUP_DISTANCE
            );

        } while (!validPlacement && attempts < 200);

        if (attempts < 200) {
            gameState.powerups.push({
                x: px,
                y: py,
                type: ['speed', 'knockout', 'electric'][Math.floor(gameRandom() * 3)]
            });
        }
    }

    // Add special powerup in garden (shield)
    if (gameState.zones.garden) {
        const garden = gameState.zones.garden;
        const shieldX = garden.x + Math.floor(garden.width / 2);
        const shieldY = garden.y + Math.floor(garden.height / 2);
        gameState.powerups.push({
            x: shieldX,
            y: shieldY,
            type: 'shield'
        });
    }

    // Add special powerup in dog park (companion)
    if (gameState.zones.dogPark) {
        const dogPark = gameState.zones.dogPark;
        const companionX = dogPark.x + Math.floor(dogPark.width / 2);
        const companionY = dogPark.y + Math.floor(dogPark.height / 2);
        gameState.powerups.push({
            x: companionX,
            y: companionY,
            type: 'companion'
        });
    }

    gameState.powerup = null;
    gameState.powerupTimer = 0;
    gameState.imploding = false;
    gameState.implosionFrame = 0;
    gameState.particles = [];
    gameState.crispyEffects = [];
    gameState.lastChance = false;
    gameState.lastChanceTimer = 0;

    // === NEW: Spawn Coins (Dopamine Breadcrumbs) ===
    // Lots of coins scattered throughout for constant micro-rewards
    gameState.coins = [];
    const numCoins = 15 + Math.floor(gameRandom() * 10); // 15-25 coins per floor
    const MIN_COIN_DISTANCE = 4; // Minimum distance between coins

    for (let i = 0; i < numCoins; i++) {
        let cx, cy, attempts = 0;
        let validPlacement = false;

        do {
            cx = Math.floor(gameRandom() * (MAP_WIDTH - 4)) + 2;
            cy = Math.floor(gameRandom() * (MAP_HEIGHT - 4)) + 2;
            attempts++;

            // Check if tile is floor
            if (gameState.maze[cy][cx] !== TILE.FLOOR) continue;

            // Don't place coins near player spawn
            if (Math.abs(cx - gameState.player.x) < 3 && Math.abs(cy - gameState.player.y) < 3) continue;

            // Don't place coins near exits (save for exciting final dash)
            let nearExit = false;
            for (const exit of gameState.exits) {
                if (Math.abs(cx - exit.x) < 2 && Math.abs(cy - exit.y) < 2) {
                    nearExit = true;
                    break;
                }
            }
            if (nearExit) continue;

            // Check distance from existing coins (slight clustering is ok)
            validPlacement = gameState.coins.every(c =>
                Math.abs(cx - c.x) + Math.abs(cy - c.y) >= MIN_COIN_DISTANCE
            );

        } while (!validPlacement && attempts < 100);

        if (attempts < 100) {
            gameState.coins.push({
                x: cx,
                y: cy,
                value: 10, // Base coin value
                collected: false,
                bobOffset: gameRandom() * Math.PI * 2, // For bobbing animation
                sparkle: gameRandom() * Math.PI * 2   // For sparkle effect
            });
        }
    }
}

function drawPixel(x, y, size, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.floor(x), Math.floor(y), size, size);
}

function drawTile(x, y) {
    const screenX = x * TILE_SIZE;
    const screenY = y * TILE_SIZE;
    const tile = gameState.maze[y][x];

    if (tile === TILE.CAFETERIA) {
        // Cafeteria floor - warm tiles
        const baseColor = (x + y) % 2 === 0 ? COLORS.cafeteriaFloor : COLORS.cafeteriaFloorAlt;
        ctx.fillStyle = baseColor;
        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

        // Draw table/chairs occasionally
        if ((x + y) % 4 === 0) {
            ctx.fillStyle = COLORS.cafeteriaTable;
            ctx.fillRect(screenX + 8, screenY + 8, 16, 16);
            ctx.fillStyle = COLORS.cafeteriaChair;
            ctx.fillRect(screenX + 2, screenY + 12, 4, 8);
            ctx.fillRect(screenX + 26, screenY + 12, 4, 8);
        }

        // "CAFETERIA" indicator - green tint overlay
        ctx.fillStyle = 'rgba(46, 204, 113, 0.15)';
        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
        return;
    }

    if (tile === TILE.BATHROOM) {
        // Bathroom floor - blue/white tiles
        const baseColor = (x + y) % 2 === 0 ? COLORS.bathroomFloor : COLORS.bathroomFloorAlt;
        ctx.fillStyle = baseColor;
        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

        // Tile pattern
        ctx.strokeStyle = COLORS.bathroomTile;
        ctx.lineWidth = 1;
        ctx.strokeRect(screenX + 2, screenY + 2, TILE_SIZE - 4, TILE_SIZE - 4);

        // Blue tint overlay
        ctx.fillStyle = 'rgba(52, 152, 219, 0.15)';
        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
        return;
    }

    if (tile === TILE.GARDEN) {
        // Rooftop garden - grass and flowers
        const baseColor = (x + y) % 2 === 0 ? COLORS.gardenGrass : COLORS.gardenGrassDark;
        ctx.fillStyle = baseColor;
        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

        // Draw grass blades
        ctx.fillStyle = '#66bb6a';
        for (let i = 0; i < 4; i++) {
            const gx = screenX + 4 + i * 8;
            const gy = screenY + TILE_SIZE - 6;
            ctx.fillRect(gx, gy, 2, 6);
            ctx.fillRect(gx + 3, gy + 2, 2, 4);
        }

        // Draw flowers on some tiles (based on position for variety)
        const flowerSeed = (x * 7 + y * 13) % 5;
        if (flowerSeed < 2) {
            const flowerColors = [COLORS.gardenFlower1, COLORS.gardenFlower2, COLORS.gardenFlower3];
            const flowerColor = flowerColors[(x + y) % 3];
            const fx = screenX + 12 + Math.sin(x * 3) * 4;
            const fy = screenY + 10 + Math.cos(y * 2) * 3;

            // Stem
            ctx.fillStyle = '#2e7d32';
            ctx.fillRect(fx + 2, fy + 4, 2, 8);

            // Flower petals (animated sway)
            const sway = Math.sin(gameState.animationTime * 2 + x + y) * 1;
            ctx.fillStyle = flowerColor;
            ctx.beginPath();
            ctx.arc(fx + 3 + sway, fy + 2, 4, 0, Math.PI * 2);
            ctx.fill();

            // Flower center
            ctx.fillStyle = '#fff59d';
            ctx.beginPath();
            ctx.arc(fx + 3 + sway, fy + 2, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw stone path on some tiles
        if ((x + y) % 3 === 0) {
            ctx.fillStyle = COLORS.gardenPath;
            ctx.fillRect(screenX + 8, screenY + 10, 6, 4);
            ctx.fillRect(screenX + 16, screenY + 16, 5, 4);
        }

        // Garden tint overlay
        ctx.fillStyle = 'rgba(76, 175, 80, 0.1)';
        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
        return;
    }

    if (tile === TILE.DOG_PARK) {
        // Dog park - grass with play elements
        const baseColor = (x + y) % 2 === 0 ? COLORS.dogParkGrass : COLORS.dogParkGrassDark;
        ctx.fillStyle = baseColor;
        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

        // Draw fence posts on edge tiles
        const zone = gameState.zones.dogPark;
        if (zone) {
            const isEdge = x === zone.x || x === zone.x + zone.width - 1 ||
                          y === zone.y || y === zone.y + zone.height - 1;
            if (isEdge && (x + y) % 2 === 0) {
                ctx.fillStyle = COLORS.dogParkFence;
                ctx.fillRect(screenX + 14, screenY + 2, 4, TILE_SIZE - 4);
                ctx.fillRect(screenX + 12, screenY + 4, 8, 3);
                ctx.fillRect(screenX + 12, screenY + TILE_SIZE - 8, 8, 3);
            }
        }

        // Draw dog toys and play equipment
        const toyType = (x * 5 + y * 11) % 7;
        if (toyType === 0) {
            // Red ball
            const bounce = Math.sin(gameState.animationTime * 4 + x) * 2;
            ctx.fillStyle = COLORS.dogParkToy;
            ctx.beginPath();
            ctx.arc(screenX + 20, screenY + 18 + bounce, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffcdd2';
            ctx.beginPath();
            ctx.arc(screenX + 18, screenY + 16 + bounce, 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (toyType === 1) {
            // Sand/dirt patch
            ctx.fillStyle = COLORS.dogParkSand;
            ctx.beginPath();
            ctx.ellipse(screenX + 16, screenY + 20, 10, 6, 0, 0, Math.PI * 2);
            ctx.fill();
        } else if (toyType === 2) {
            // Small paw prints
            ctx.fillStyle = 'rgba(62, 39, 35, 0.3)';
            ctx.beginPath();
            ctx.arc(screenX + 8, screenY + 12, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(screenX + 20, screenY + 20, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Dog park tint overlay
        ctx.fillStyle = 'rgba(139, 195, 74, 0.1)';
        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
        return;
    }

    if (tile === TILE.SECRET_EXIT) {
        // Secret exit on floor 13 - purple mysterious door
        const pulse = Math.sin(gameState.animationTime * 3) * 0.3 + 0.7;

        // Floor
        ctx.fillStyle = COLORS.floorDark;
        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

        // Purple glow
        ctx.fillStyle = `rgba(155, 89, 182, ${pulse * 0.5})`;
        ctx.beginPath();
        ctx.arc(screenX + 16, screenY + 16, 20, 0, Math.PI * 2);
        ctx.fill();

        // Mysterious door
        ctx.fillStyle = COLORS.secretDoor;
        ctx.fillRect(screenX + 4, screenY + 2, TILE_SIZE - 8, TILE_SIZE - 4);

        // Door highlight
        ctx.fillStyle = '#6a0dad';
        ctx.fillRect(screenX + 4, screenY + 2, TILE_SIZE - 8, 4);

        // Mystical symbol (13 -> 1)
        ctx.fillStyle = '#fff';
        ctx.font = '10px monospace';
        ctx.fillText('13', screenX + 8, screenY + 14);
        ctx.fillText('↓', screenX + 12, screenY + 22);
        ctx.fillText('1', screenX + 12, screenY + 30);

        // Sparkles
        const sparkle = Math.sin(gameState.animationTime * 8) * 3;
        ctx.fillStyle = '#e8daef';
        ctx.fillRect(screenX + 6 + sparkle, screenY + 6, 2, 2);
        ctx.fillRect(screenX + 22 - sparkle, screenY + 24, 2, 2);
        return;
    }

    // Regular office carpet floor - REALISTIC TEXTURE
    const baseColor = (x + y) % 2 === 0 ? COLORS.floorDark : COLORS.floorMid;
    ctx.fillStyle = baseColor;
    ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

    // Carpet fiber texture (subtle dots for realism)
    const seed = (x * 31 + y * 17) % 100; // Deterministic random per tile
    ctx.fillStyle = COLORS.floorFiber || '#3d3d3d';
    for (let i = 0; i < 5; i++) {
        const fx = screenX + ((seed + i * 7) % TILE_SIZE);
        const fy = screenY + ((seed + i * 11) % TILE_SIZE);
        ctx.fillRect(fx, fy, 1, 1);
    }

    // Subtle carpet grain lines (horizontal)
    if ((y % 2) === 0) {
        ctx.fillStyle = 'rgba(80, 80, 80, 0.15)';
        ctx.fillRect(screenX, screenY + TILE_SIZE / 2 - 1, TILE_SIZE, 1);
    }

    // Occasional wear marks (darker spots) in traffic areas
    if ((x + y * 3) % 11 === 0) {
        ctx.fillStyle = COLORS.floorWear || '#333333';
        ctx.beginPath();
        ctx.ellipse(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2, 6, 4, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    // Light highlights for depth
    ctx.fillStyle = COLORS.floorLight;
    if ((x + y) % 4 === 0) {
        ctx.fillRect(screenX + 8, screenY + 8, 2, 2);
        ctx.fillRect(screenX + 20, screenY + 18, 2, 2);
    }

    if (tile === TILE.WALL) {
        // Cubicle wall
        ctx.fillStyle = COLORS.wallMid;
        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

        ctx.fillStyle = COLORS.wallLight;
        ctx.fillRect(screenX, screenY, TILE_SIZE, 4);
        ctx.fillRect(screenX, screenY, 4, TILE_SIZE);

        ctx.fillStyle = COLORS.wallDark;
        ctx.fillRect(screenX, screenY + TILE_SIZE - 4, TILE_SIZE, 4);
        ctx.fillRect(screenX + TILE_SIZE - 4, screenY, 4, TILE_SIZE);

        ctx.fillStyle = COLORS.wallHighlight;
        ctx.fillRect(screenX + 8, screenY + 6, 2, TILE_SIZE - 12);
        ctx.fillRect(screenX + TILE_SIZE - 10, screenY + 6, 2, TILE_SIZE - 12);

    } else if (tile === TILE.DESK) {
        // Office desk with computer
        ctx.fillStyle = COLORS.deskWood;
        ctx.fillRect(screenX + 2, screenY + 12, TILE_SIZE - 4, TILE_SIZE - 14);

        ctx.fillStyle = COLORS.deskWoodLight;
        ctx.fillRect(screenX + 2, screenY + 12, TILE_SIZE - 4, 3);

        ctx.fillStyle = COLORS.deskWoodDark;
        ctx.fillRect(screenX + 2, screenY + TILE_SIZE - 4, TILE_SIZE - 4, 2);

        ctx.fillStyle = COLORS.deskTop;
        ctx.fillRect(screenX + 8, screenY + 2, 16, 12);

        ctx.fillStyle = COLORS.deskScreen;
        ctx.fillRect(screenX + 10, screenY + 4, 12, 8);

        const glowOffset = Math.sin(gameState.animationTime * 3 + x + y) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(168, 216, 255, ${0.3 + glowOffset * 0.4})`;
        ctx.fillRect(screenX + 11, screenY + 5, 10, 2);
        ctx.fillRect(screenX + 11, screenY + 8, 6, 2);

        ctx.fillStyle = COLORS.deskTop;
        ctx.fillRect(screenX + 14, screenY + 14, 4, 2);
    }
}

// ============================================
// SPRITE-BASED CHARACTER RENDERING
// ============================================

// Helper function to convert hex color to RGB components
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ?
        `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` :
        '0, 210, 211';
}

// Get powerup overlay color for sprite tinting
function getPowerupOverlayColor(powerupType, stunned) {
    if (stunned > 0) {
        return 'rgba(155, 89, 182, 0.35)';  // Purple stun tint
    }
    switch (powerupType) {
        case 'speed':
            return 'rgba(0, 210, 211, 0.25)';   // Cyan tint
        case 'knockout':
            return 'rgba(231, 76, 60, 0.25)';   // Red tint
        case 'electric':
            return 'rgba(241, 196, 15, 0.25)';  // Yellow tint
        default:
            return null;
    }
}

// Draw character from sprite sheet
function drawCharacterSprite(x, y, facingRight, powerupOverlay) {
    const charAsset = CHARACTER_ASSETS[selectedCharacter];
    if (!charAsset || !charAsset.animation.loaded || !charAsset.animation.image) {
        return false;  // Fall back to procedural rendering
    }

    const anim = charAsset.animation;
    const state = characterAnimationState.player;

    // Calculate source rectangle on sprite sheet
    const srcX = state.frame * anim.frameWidth;
    const srcY = 0;

    // Draw sprite larger than tile size for better visibility
    // Scale factor: sprite should be about 2.5x tile size for prominent character
    const spriteScale = 2.5;
    const destSize = Math.floor(TILE_SIZE * spriteScale);
    // Center the larger sprite on the tile position
    const offsetX = Math.floor((TILE_SIZE - destSize) / 2);
    const offsetY = Math.floor((TILE_SIZE - destSize) / 2) - 12; // Shift up so feet align with tile bottom

    ctx.save();

    // Get squash/stretch scale factors (Super Meat Boy feel)
    const squashStretch = characterAnimationState.player.squashStretch || { scaleX: 1, scaleY: 1 };
    const scaleX = squashStretch.scaleX;
    const scaleY = squashStretch.scaleY;

    // Handle direction flipping
    if (!facingRight) {
        ctx.translate(x + TILE_SIZE, y);
        ctx.scale(-1, 1);
        x = 0;
        y = 0;
    }

    // Apply squash/stretch transform (pivot at bottom center of sprite)
    if (scaleX !== 1 || scaleY !== 1) {
        const pivotX = x + offsetX + destSize / 2;
        const pivotY = y + offsetY + destSize; // Bottom of sprite
        ctx.translate(pivotX, pivotY);
        ctx.scale(scaleX, scaleY);
        ctx.translate(-pivotX, -pivotY);
    }

    // Draw the sprite frame at larger size
    ctx.drawImage(
        anim.image,
        srcX, srcY, anim.frameWidth, anim.frameHeight,  // Source
        x + offsetX, y + offsetY, destSize, destSize     // Destination (larger, centered)
    );

    // Apply powerup color overlay using multiply-like effect
    if (powerupOverlay) {
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = powerupOverlay;
        ctx.fillRect(x + offsetX, y + offsetY, destSize, destSize);
        ctx.globalCompositeOperation = 'source-over';
    }

    ctx.restore();
    return true;
}

// Draw enhanced speed trail effect (matching MP4 style)
function drawCharacterSpeedTrail(x, y, isSpeedPowerup) {
    const charAsset = CHARACTER_ASSETS[selectedCharacter];
    const trail = charAsset ? charAsset.trailColor : { primary: '#00d2d3', glow: 'rgba(0, 210, 211, 0.6)' };
    const state = characterAnimationState.player;

    // Only draw trail when moving
    if (!state.isMoving) return;

    const time = gameState.animationTime;

    // Ground glow/splash effect (like in MP4)
    const glowPulse = Math.sin(time * 12) * 0.3 + 0.7;
    ctx.shadowColor = trail.primary;
    ctx.shadowBlur = 15;
    ctx.fillStyle = trail.glow;

    // Splash at feet
    ctx.beginPath();
    ctx.ellipse(x + TILE_SIZE/2, y + TILE_SIZE - 2, 10 * glowPulse, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Only draw full particle trail with speed powerup
    if (isSpeedPowerup) {
        const facingDir = state.facingDirection;

        // Motion blur afterimages - ghostly silhouettes trailing behind
        for (let i = 1; i <= 4; i++) {
            const afterimageAlpha = 0.25 - (i * 0.05);
            const offsetX = -facingDir * i * 8;

            ctx.globalAlpha = afterimageAlpha;
            ctx.fillStyle = trail.primary;

            // Simple silhouette rectangle for afterimage
            ctx.fillRect(x + 8 + offsetX, y + 4, 16, 26);

            ctx.globalAlpha = 1;
        }

        // Speed lines emanating from player
        ctx.strokeStyle = trail.primary;
        ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
            const lineAlpha = 0.4 - (i * 0.07);
            const startX = x + TILE_SIZE/2 - (facingDir * 10);
            const startY = y + 6 + i * 5;
            const lineLength = 15 + Math.sin(time * 20 + i) * 5;

            ctx.strokeStyle = `rgba(${hexToRgb(trail.primary)}, ${lineAlpha})`;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(startX - (facingDir * lineLength), startY);
            ctx.stroke();
        }

        // Particle trail behind character
        ctx.shadowBlur = 5;
        for (let i = 0; i < 6; i++) {
            const trailAlpha = (6 - i) * 0.12;
            const trailX = x + TILE_SIZE/2 - (facingDir * i * 6) + Math.sin(time * 15 + i) * 2;
            const trailY = y + TILE_SIZE/2 + Math.cos(time * 12 + i * 0.5) * 4;
            const particleSize = 3 - (i * 0.3);

            ctx.fillStyle = `rgba(${hexToRgb(trail.primary)}, ${trailAlpha})`;
            ctx.beginPath();
            ctx.arc(trailX, trailY, particleSize, 0, Math.PI * 2);
            ctx.fill();
        }

        // Floating square particles (like the cyan squares in MP4)
        for (let i = 0; i < 4; i++) {
            const particleX = x + TILE_SIZE/2 - (facingDir * (12 + i * 8)) + Math.sin(time * 8 + i * 2) * 3;
            const particleY = y + 8 + Math.cos(time * 10 + i) * 12;
            const alpha = 0.5 - (i * 0.1);

            ctx.fillStyle = `rgba(${hexToRgb(trail.primary)}, ${alpha})`;
            ctx.fillRect(particleX, particleY, 2, 2);
        }

        // Energetic sparks around player
        for (let i = 0; i < 3; i++) {
            const sparkAngle = time * 15 + i * (Math.PI * 2 / 3);
            const sparkDist = 12 + Math.sin(time * 20 + i) * 4;
            const sparkX = x + TILE_SIZE/2 + Math.cos(sparkAngle) * sparkDist;
            const sparkY = y + TILE_SIZE/2 + Math.sin(sparkAngle) * sparkDist * 0.5;

            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(sparkX, sparkY, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    ctx.shadowBlur = 0;
}

// Draw enemy character from sprite sheet
function drawEnemySprite(enemy, x, y) {
    const enemyAsset = ENEMY_ASSETS.coworker;
    if (!enemyAsset || !enemyAsset.animation.loaded || !enemyAsset.animation.image) {
        return false;  // Fall back to procedural rendering
    }

    const anim = enemyAsset.animation;

    // Get or create animation state for this enemy
    const enemyId = `enemy_${enemy.x}_${enemy.y}_${enemy.frame}`;
    if (!enemyAnimationStates.has(enemyId)) {
        enemyAnimationStates.set(enemyId, {
            frame: Math.floor(Math.random() * anim.frameCount),  // Random start frame
            lastUpdate: performance.now() / 1000,
            facingDirection: 1
        });
    }
    const state = enemyAnimationStates.get(enemyId);

    // Update animation frame
    const now = performance.now() / 1000;
    if (now - state.lastUpdate > anim.frameDuration) {
        state.frame = (state.frame + 1) % anim.frameCount;
        state.lastUpdate = now;
    }

    // Track enemy facing direction based on movement
    if (enemy.lastX !== undefined && enemy.x !== enemy.lastX) {
        state.facingDirection = enemy.x > enemy.lastX ? 1 : -1;
    }

    // Calculate source rectangle on sprite sheet
    const srcX = state.frame * anim.frameWidth;
    const srcY = 0;

    // Draw sprite slightly smaller than player (enemy artwork fills more of frame)
    const spriteScale = 2.0;
    const destSize = Math.floor(TILE_SIZE * spriteScale);
    const offsetX = Math.floor((TILE_SIZE - destSize) / 2);
    const offsetY = Math.floor((TILE_SIZE - destSize) / 2) - 12;

    ctx.save();

    // Handle direction flipping
    const facingRight = state.facingDirection >= 0;
    if (!facingRight) {
        ctx.translate(x + TILE_SIZE, y);
        ctx.scale(-1, 1);
        x = 0;
        y = 0;
    }

    // Apply stun tint if stunned
    if (enemy.stunned > 0) {
        ctx.filter = 'grayscale(50%) brightness(1.3)';
    }

    // Draw the sprite frame
    ctx.drawImage(
        anim.image,
        srcX, srcY, anim.frameWidth, anim.frameHeight,
        x + offsetX, y + offsetY, destSize, destSize
    );

    ctx.filter = 'none';
    ctx.restore();

    // Store position for next frame direction detection
    enemy.lastX = enemy.x;
    enemy.lastY = enemy.y;

    return true;
}

function drawPlayer() {
    const x = gameState.player.x * TILE_SIZE;
    const y = gameState.player.y * TILE_SIZE;
    const bobOffset = Math.sin(gameState.animationTime * 8) * 1;

    // Check if in safe zone
    const inBathroom = isInBathroom(gameState.player.x, gameState.player.y);
    const inCafeteria = isInCafeteria(gameState.player.x, gameState.player.y);

    let shirtColor = COLORS.playerShirt;
    let shirtLight = COLORS.playerShirtLight;
    let shirtDark = COLORS.playerShirtDark;

    if (gameState.player.stunned > 0) {
        shirtColor = COLORS.stunned;
        shirtLight = COLORS.stunnedLight;
        shirtDark = COLORS.stunned;
    } else if (gameState.powerup === 'speed') {
        shirtColor = COLORS.speedBlue;
        shirtLight = COLORS.speedBlueLight;
        shirtDark = COLORS.speedBlueDark;
    } else if (gameState.powerup === 'knockout') {
        shirtColor = COLORS.knockoutRed;
        shirtLight = COLORS.knockoutRedLight;
        shirtDark = COLORS.knockoutRedDark;
    } else if (gameState.powerup === 'electric') {
        shirtColor = COLORS.electricYellow;
        shirtLight = COLORS.electricYellowLight;
        shirtDark = COLORS.electricYellowDark;
    }

    // Shadow - slightly larger for more presence
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(x + 16, y + 30, 9, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Try sprite-based rendering first
    const facingRight = characterAnimationState.player.facingDirection >= 0;
    const powerupOverlay = getPowerupOverlayColor(gameState.powerup, gameState.player.stunned);
    const spriteDrawn = drawCharacterSprite(x, y, facingRight, powerupOverlay);

    // Draw enhanced speed trail (works with both sprite and procedural)
    drawCharacterSpeedTrail(x, y, gameState.powerup === 'speed');

    // Fall back to procedural rendering if sprite not available
    if (!spriteDrawn) {
        // Legs (dark suit pants)
        ctx.fillStyle = COLORS.playerPants;
        ctx.fillRect(x + 10, y + 22 + bobOffset, 5, 8);
        ctx.fillRect(x + 17, y + 22 + bobOffset, 5, 8);
        // Shoe detail
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(x + 10, y + 28 + bobOffset, 5, 2);
        ctx.fillRect(x + 17, y + 28 + bobOffset, 5, 2);

        // Body (suit jacket)
        ctx.fillStyle = shirtColor;
        ctx.fillRect(x + 8, y + 12 + bobOffset, 16, 12);

        // Suit jacket highlights and shadows for depth
        ctx.fillStyle = shirtLight;
        ctx.fillRect(x + 8, y + 12 + bobOffset, 16, 2);
        ctx.fillRect(x + 8, y + 12 + bobOffset, 2, 12);

        ctx.fillStyle = shirtDark;
        ctx.fillRect(x + 22, y + 12 + bobOffset, 2, 12);
        ctx.fillRect(x + 8, y + 22 + bobOffset, 16, 2);

        // White dress shirt collar (visible at neckline)
        ctx.fillStyle = COLORS.playerDressShirt || '#ecf0f1';
        ctx.fillRect(x + 12, y + 12 + bobOffset, 8, 3);

        // Power tie
        ctx.fillStyle = COLORS.playerTie || '#c0392b';
        ctx.fillRect(x + 15, y + 13 + bobOffset, 2, 10);
        // Tie knot
        ctx.fillRect(x + 14, y + 12 + bobOffset, 4, 2);

        // Head
        ctx.fillStyle = COLORS.playerSkin;
        ctx.fillRect(x + 10, y + 2 + bobOffset, 12, 12);

        // Hair - professional style
        ctx.fillStyle = COLORS.playerHair;
        ctx.fillRect(x + 9, y + 1 + bobOffset, 14, 4);
        ctx.fillRect(x + 9, y + 1 + bobOffset, 2, 6);
        // Side part detail
        ctx.fillStyle = '#3a3a3a';
        ctx.fillRect(x + 12, y + 2 + bobOffset, 1, 3);

        // Eyes
        ctx.fillStyle = '#fff';
        ctx.fillRect(x + 12, y + 6 + bobOffset, 4, 4);
        ctx.fillRect(x + 18, y + 6 + bobOffset, 4, 4);

        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(x + 14, y + 7 + bobOffset, 2, 2);
        ctx.fillRect(x + 20, y + 7 + bobOffset, 2, 2);

        // Eyebrows (professional/focused look)
        ctx.fillStyle = COLORS.playerHair;
        ctx.fillRect(x + 12, y + 5 + bobOffset, 4, 1);
        ctx.fillRect(x + 18, y + 5 + bobOffset, 4, 1);

        // Mouth - determined expression
        ctx.fillStyle = '#8b6c5c';
        ctx.fillRect(x + 14, y + 11 + bobOffset, 4, 1);
    }

    // Stun effect
    if (gameState.player.stunned > 0) {
        const starOffset = Math.sin(gameState.animationTime * 10) * 4;
        ctx.fillStyle = '#f1c40f';
        drawStar(x + 6 + starOffset, y - 2, 4);
        drawStar(x + 22 - starOffset, y - 2, 4);
    }

    // Burn effect - player on fire!
    if (gameState.player.burning > 0) {
        const burnPulse = Math.sin(gameState.animationTime * 15) * 0.3 + 0.7;

        // Orange-red glow around player
        ctx.shadowColor = COLORS.fireOuter;
        ctx.shadowBlur = 20 * burnPulse;

        // Fire particles rising
        ctx.fillStyle = COLORS.fireOuter;
        for (let i = 0; i < 4; i++) {
            const fireX = x + 8 + Math.sin(gameState.animationTime * 12 + i * 2) * 8;
            const fireY = y - 5 - Math.abs(Math.sin(gameState.animationTime * 8 + i)) * 10;
            ctx.beginPath();
            ctx.arc(fireX, fireY, 3 * burnPulse, 0, Math.PI * 2);
            ctx.fill();
        }

        // Inner flames
        ctx.fillStyle = COLORS.fireCore;
        for (let i = 0; i < 3; i++) {
            const fireX = x + 10 + Math.cos(gameState.animationTime * 10 + i) * 5;
            const fireY = y - 2 - Math.abs(Math.sin(gameState.animationTime * 6 + i)) * 8;
            ctx.beginPath();
            ctx.arc(fireX, fireY, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.shadowBlur = 0;

        // "BURNING!" text
        ctx.fillStyle = '#ff4500';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('🔥', x + TILE_SIZE/2, y - 8);
        ctx.textAlign = 'left';
    }

    // Speed effect - blue glowing feet
    if (gameState.powerup === 'speed') {
        const glowPulse = Math.sin(gameState.animationTime * 12) * 0.3 + 0.7;

        // Glowing aura under feet
        ctx.shadowColor = '#00d2d3';
        ctx.shadowBlur = 15;
        ctx.fillStyle = `rgba(0, 210, 211, ${glowPulse * 0.8})`;
        ctx.fillRect(x + 8, y + 26 + bobOffset, 6, 6);   // Left foot glow
        ctx.fillRect(x + 18, y + 26 + bobOffset, 6, 6);  // Right foot glow

        // Speed lines trailing behind
        ctx.shadowBlur = 5;
        for (let i = 0; i < 3; i++) {
            const trailAlpha = (3 - i) * 0.15;
            const trailOffset = i * 5;
            ctx.fillStyle = `rgba(0, 210, 211, ${trailAlpha})`;
            ctx.fillRect(x + 6 - trailOffset, y + 28 + bobOffset, 4, 3);
            ctx.fillRect(x + 22 - trailOffset, y + 28 + bobOffset, 4, 3);
        }
        ctx.shadowBlur = 0;
    }

    // Electric aura effect
    if (gameState.powerup === 'electric') {
        const pulse = Math.sin(gameState.animationTime * 12) * 0.3 + 0.5;
        ctx.strokeStyle = `rgba(241, 196, 15, ${pulse})`;
        ctx.lineWidth = 2;

        // Electric arcs around player
        const arc1 = Math.sin(gameState.animationTime * 20) * 6;
        const arc2 = Math.cos(gameState.animationTime * 18) * 6;

        ctx.beginPath();
        ctx.moveTo(x + 2, y + 10 + arc1);
        ctx.lineTo(x - 4, y + 6 + arc1);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x + 30, y + 10 - arc1);
        ctx.lineTo(x + 36, y + 6 - arc1);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x + 16, y - 4 + arc2);
        ctx.lineTo(x + 14, y - 10 + arc2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x + 16, y + 34 - arc2);
        ctx.lineTo(x + 18, y + 40 - arc2);
        ctx.stroke();

        // Glow around player
        ctx.fillStyle = `rgba(241, 196, 15, ${pulse * 0.3})`;
        ctx.beginPath();
        ctx.arc(x + 16, y + 16, 20, 0, Math.PI * 2);
        ctx.fill();
    }

    // Safe zone indicator
    if (inBathroom || inCafeteria) {
        ctx.strokeStyle = inCafeteria ? '#2ecc71' : '#3498db';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(x + 2, y, TILE_SIZE - 4, TILE_SIZE);
        ctx.setLineDash([]);
    }

    // Shield effect - green protective bubble
    if (gameState.player.shielded > 0) {
        const shieldPulse = Math.sin(gameState.animationTime * 6) * 0.2 + 0.6;
        const flickering = gameState.player.shielded < 2 ? Math.sin(gameState.animationTime * 20) * 0.3 : 0;

        // Outer shield glow
        ctx.shadowColor = '#4caf50';
        ctx.shadowBlur = 15;

        // Shield bubble
        ctx.strokeStyle = `rgba(76, 175, 80, ${shieldPulse + flickering})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, TILE_SIZE / 2 + 4, 0, Math.PI * 2);
        ctx.stroke();

        // Inner glow
        ctx.fillStyle = `rgba(129, 199, 132, ${(shieldPulse * 0.3) + flickering})`;
        ctx.beginPath();
        ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, TILE_SIZE / 2 + 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;

        // Shield icon above player
        ctx.fillStyle = '#4caf50';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🛡️', x + TILE_SIZE / 2, y - 6);
        ctx.textAlign = 'left';
    }
}

// Draw dog companion
function drawCompanion() {
    if (!gameState.player.companion) return;

    const comp = gameState.player.companion;
    const x = comp.x * TILE_SIZE;
    const y = comp.y * TILE_SIZE;
    const bounce = Math.sin(comp.frame) * 2;
    const wagAngle = Math.sin(comp.frame * 1.5) * 0.6;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(x + TILE_SIZE / 2, y + TILE_SIZE - 4, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dog body (larger)
    ctx.fillStyle = '#8d6e63';
    ctx.beginPath();
    ctx.ellipse(x + TILE_SIZE / 2, y + TILE_SIZE / 2 + 4 + bounce, 12, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dog head
    ctx.fillStyle = '#a1887f';
    ctx.beginPath();
    ctx.arc(x + TILE_SIZE / 2 + 8, y + TILE_SIZE / 2 - 4 + bounce, 9, 0, Math.PI * 2);
    ctx.fill();

    // Ears (floppy)
    ctx.fillStyle = '#6d4c41';
    const earFlop = Math.sin(comp.frame * 2) * 2;
    ctx.beginPath();
    ctx.ellipse(x + TILE_SIZE / 2 + 2, y + TILE_SIZE / 2 - 10 + bounce + earFlop, 4, 6, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + TILE_SIZE / 2 + 14, y + TILE_SIZE / 2 - 10 + bounce + earFlop, 4, 6, 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Snout
    ctx.fillStyle = '#bcaaa4';
    ctx.beginPath();
    ctx.ellipse(x + TILE_SIZE / 2 + 14, y + TILE_SIZE / 2 - 2 + bounce, 5, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eyes (happy)
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(x + TILE_SIZE / 2 + 5, y + TILE_SIZE / 2 - 6 + bounce, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + TILE_SIZE / 2 + 11, y + TILE_SIZE / 2 - 6 + bounce, 2, 0, Math.PI * 2);
    ctx.fill();

    // Nose
    ctx.fillStyle = '#3e2723';
    ctx.beginPath();
    ctx.arc(x + TILE_SIZE / 2 + 16, y + TILE_SIZE / 2 - 2 + bounce, 3, 0, Math.PI * 2);
    ctx.fill();

    // Tongue (panting)
    if (Math.sin(comp.frame * 3) > 0) {
        ctx.fillStyle = '#f48fb1';
        ctx.beginPath();
        ctx.ellipse(x + TILE_SIZE / 2 + 14, y + TILE_SIZE / 2 + 4 + bounce, 2, 4, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    // Wagging tail
    ctx.strokeStyle = '#8d6e63';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x + TILE_SIZE / 2 - 10, y + TILE_SIZE / 2 + 4 + bounce);
    ctx.quadraticCurveTo(
        x + TILE_SIZE / 2 - 18 + wagAngle * 8, y + TILE_SIZE / 2 - 6 + bounce,
        x + TILE_SIZE / 2 - 16 + wagAngle * 10, y + TILE_SIZE / 2 - 14 + bounce
    );
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.lineCap = 'butt';

    // Legs (walking animation)
    ctx.fillStyle = '#8d6e63';
    const legOffset = Math.sin(comp.frame * 2) * 3;
    ctx.fillRect(x + TILE_SIZE / 2 - 6, y + TILE_SIZE / 2 + 10 + bounce + legOffset, 4, 6);
    ctx.fillRect(x + TILE_SIZE / 2 + 2, y + TILE_SIZE / 2 + 10 + bounce - legOffset, 4, 6);

    // Happy aura when near scared enemies
    let nearScaredEnemy = false;
    for (const enemy of gameState.enemies) {
        if (enemy.scared > 0 && Math.abs(enemy.x - comp.x) + Math.abs(enemy.y - comp.y) < 5) {
            nearScaredEnemy = true;
            break;
        }
    }

    if (nearScaredEnemy) {
        // Bark effect
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        const barkPulse = Math.sin(comp.frame * 4) > 0;
        if (barkPulse) {
            ctx.fillText('WOOF!', x + TILE_SIZE / 2, y - 8);
        }
        ctx.textAlign = 'left';
    }

    // Timer indicator (fading paw prints when about to expire)
    if (comp.timer < 3) {
        const fadeAlpha = comp.timer / 3;
        ctx.fillStyle = `rgba(139, 195, 74, ${fadeAlpha})`;
        ctx.font = '10px sans-serif';
        ctx.fillText('🐾', x - 4, y + TILE_SIZE + 8);
    }
}

function drawStar(x, y, size) {
    ctx.fillRect(x + size/2 - 1, y, 2, size);
    ctx.fillRect(x, y + size/2 - 1, size, 2);
    ctx.fillRect(x + 1, y + 1, 2, 2);
    ctx.fillRect(x + size - 3, y + 1, 2, 2);
    ctx.fillRect(x + 1, y + size - 3, 2, 2);
    ctx.fillRect(x + size - 3, y + size - 3, 2, 2);
}

function drawCrispyEffect(crispy) {
    const x = crispy.x * TILE_SIZE;
    const y = crispy.y * TILE_SIZE;
    const fade = crispy.timer / 2.0;  // Fade out over time

    // Smoke particles rising
    ctx.fillStyle = `rgba(100, 100, 100, ${fade * 0.5})`;
    const smokeOffset1 = Math.sin(gameState.animationTime * 5 + crispy.x) * 4;
    const smokeOffset2 = Math.cos(gameState.animationTime * 4 + crispy.y) * 4;
    const rise = (2.0 - crispy.timer) * 20;

    ctx.beginPath();
    ctx.arc(x + 12 + smokeOffset1, y + 10 - rise, 4 + (2 - crispy.timer) * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 20 + smokeOffset2, y + 8 - rise * 0.8, 3 + (2 - crispy.timer) * 2, 0, Math.PI * 2);
    ctx.fill();

    // Charred remains on ground
    ctx.fillStyle = `rgba(44, 44, 44, ${fade})`;
    ctx.fillRect(x + 6, y + 20, 20, 8);
    ctx.fillRect(x + 10, y + 16, 12, 6);

    // Crispy bits
    ctx.fillStyle = `rgba(74, 74, 74, ${fade})`;
    ctx.fillRect(x + 8, y + 18, 4, 4);
    ctx.fillRect(x + 18, y + 19, 5, 3);
    ctx.fillRect(x + 12, y + 22, 6, 4);

    // Electric sparks (if recent)
    if (crispy.timer > 1.5) {
        ctx.strokeStyle = `rgba(241, 196, 15, ${(crispy.timer - 1.5) * 2})`;
        ctx.lineWidth = 2;
        const spark1 = Math.sin(gameState.animationTime * 20) * 8;
        const spark2 = Math.cos(gameState.animationTime * 18) * 8;

        ctx.beginPath();
        ctx.moveTo(x + 16, y + 16);
        ctx.lineTo(x + 16 + spark1, y + 10 + spark2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x + 16, y + 16);
        ctx.lineTo(x + 10 - spark2, y + 20 + spark1);
        ctx.stroke();
    }
}

function drawPunchEffect(punch) {
    // Update and draw particles
    for (const p of punch.particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.size *= 0.9;

        // Draw particle
        ctx.fillStyle = p.color;
        ctx.shadowColor = '#ee5a24';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw "POW" text if recent
    if (punch.timer > 0.3) {
        const x = punch.x * TILE_SIZE + TILE_SIZE / 2;
        const y = punch.y * TILE_SIZE;
        const scale = 1 + (0.5 - punch.timer) * 2;

        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        ctx.fillStyle = '#ff7f50';
        ctx.strokeStyle = '#8b0000';
        ctx.lineWidth = 3;
        ctx.font = 'bold 16px "Courier New"';
        ctx.textAlign = 'center';
        ctx.strokeText('POW!', 0, 0);
        ctx.fillText('POW!', 0, 0);
        ctx.restore();
    }

    ctx.shadowBlur = 0;
}

function drawEnemy(enemy) {
    const x = enemy.x * TILE_SIZE;
    const y = enemy.y * TILE_SIZE;
    const bobOffset = Math.sin(gameState.animationTime * 6 + enemy.frame) * 2;

    // Spawn warning animation - draw warning effect and semi-transparent enemy
    if (enemy.spawnTimer > 0) {
        const progress = 1 - (enemy.spawnTimer / 0.8); // 0 to 1 over 0.8s
        const warningPulse = Math.sin(gameState.animationTime * 15) * 0.3 + 0.7;

        // Pulsing red warning circle
        ctx.beginPath();
        ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 18 * warningPulse, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(231, 76, 60, ${(1 - progress) * 0.5})`;
        ctx.fill();

        // Pulsing ring
        ctx.strokeStyle = `rgba(231, 76, 60, ${(1 - progress) * 0.8})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 16 + progress * 8, 0, Math.PI * 2);
        ctx.stroke();

        // Exclamation mark warning
        if (progress < 0.7) {
            ctx.fillStyle = `rgba(255, 255, 255, ${(1 - progress) * warningPulse})`;
            ctx.font = 'bold 18px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('!', x + TILE_SIZE / 2, y + TILE_SIZE / 2 + 6);
            ctx.textAlign = 'left';
        }

        // Make enemy semi-transparent while spawning
        ctx.globalAlpha = progress * 0.8 + 0.2;
    }

    const isStunned = enemy.stunned > 0;

    // Try sprite-based rendering first
    const spriteDrawn = drawEnemySprite(enemy, x, y);

    if (spriteDrawn) {
        // Draw stun stars even with sprite
        if (isStunned) {
            ctx.fillStyle = '#f1c40f';
            const starOffset1 = Math.sin(gameState.animationTime * 8) * 5;
            const starOffset2 = Math.cos(gameState.animationTime * 8) * 5;
            drawStar(x + 4 + starOffset1, y - 6 + starOffset2, 6);
            drawStar(x + 22 - starOffset1, y - 4 - starOffset2, 5);
            drawStar(x + 14, y - 8 + starOffset1, 4);
        }

        // Scared effect (from dog companion)
        if (enemy.scared > 0) {
            ctx.fillStyle = '#81d4fa';
            const sweatDrop = Math.sin(gameState.animationTime * 10) * 2;
            ctx.beginPath();
            ctx.ellipse(x + 6, y + 4 + sweatDrop, 2, 3, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(x + 26, y + 6 + sweatDrop * 0.8, 2, 3, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('😰', x + TILE_SIZE / 2, y - 4);
            ctx.textAlign = 'left';
        }

        // Reset spawn alpha
        if (enemy.spawnTimer > 0) {
            ctx.globalAlpha = 1;
        }
        return;
    }

    // Fallback to procedural rendering
    const shirtColor = isStunned ? COLORS.stunned : COLORS.enemyShirt;
    const shirtLight = isStunned ? COLORS.stunnedLight : COLORS.enemyShirtLight;
    const shirtDark = isStunned ? COLORS.stunned : COLORS.enemyShirtDark;

    // Shadow - larger/darker for more menacing presence
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.ellipse(x + 16, y + 31, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Legs (dark suit pants)
    ctx.fillStyle = '#0d0d15';
    ctx.fillRect(x + 9, y + 22 + bobOffset, 6, 9);
    ctx.fillRect(x + 17, y + 22 + bobOffset, 6, 9);
    // Shoes
    ctx.fillStyle = '#000';
    ctx.fillRect(x + 9, y + 29 + bobOffset, 6, 2);
    ctx.fillRect(x + 17, y + 29 + bobOffset, 6, 2);

    // Body (dark menacing suit - slightly larger)
    ctx.fillStyle = shirtColor;
    ctx.fillRect(x + 6, y + 11 + bobOffset, 20, 13);

    // Suit shoulders (broader)
    ctx.fillStyle = shirtLight;
    ctx.fillRect(x + 6, y + 11 + bobOffset, 20, 2);
    ctx.fillRect(x + 4, y + 12 + bobOffset, 4, 6);
    ctx.fillRect(x + 24, y + 12 + bobOffset, 4, 6);

    ctx.fillStyle = shirtDark;
    ctx.fillRect(x + 24, y + 11 + bobOffset, 2, 13);
    ctx.fillRect(x + 6, y + 22 + bobOffset, 20, 2);

    // White dress shirt (small collar visible)
    ctx.fillStyle = '#d0d0d0';
    ctx.fillRect(x + 12, y + 11 + bobOffset, 8, 2);

    // Dark red tie
    ctx.fillStyle = COLORS.enemyTie || '#8b0000';
    ctx.fillRect(x + 15, y + 12 + bobOffset, 2, 11);
    ctx.fillRect(x + 14, y + 11 + bobOffset, 4, 2);

    // Security badge (gold)
    ctx.fillStyle = COLORS.enemyBadge || '#ffd700';
    ctx.fillRect(x + 20, y + 15 + bobOffset, 4, 5);
    ctx.fillStyle = '#b8860b';
    ctx.fillRect(x + 21, y + 16 + bobOffset, 2, 3);

    // Head (slightly larger for intimidation)
    ctx.fillStyle = COLORS.enemySkin;
    ctx.fillRect(x + 9, y + 1 + bobOffset, 14, 12);

    // Slicked back dark hair (professional but menacing)
    ctx.fillStyle = COLORS.enemyHair;
    ctx.fillRect(x + 8, y + 0 + bobOffset, 16, 4);
    ctx.fillRect(x + 7, y + 1 + bobOffset, 2, 5);
    ctx.fillRect(x + 23, y + 1 + bobOffset, 2, 5);

    // Eyes (narrowed, intense)
    ctx.fillStyle = '#fff';
    ctx.fillRect(x + 11, y + 5 + bobOffset, 5, 4);
    ctx.fillRect(x + 17, y + 5 + bobOffset, 5, 4);

    // Dark intense pupils
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(x + 13, y + 6 + bobOffset, 2, 3);
    ctx.fillRect(x + 19, y + 6 + bobOffset, 2, 3);

    // Angry furrowed eyebrows (thicker, more menacing)
    ctx.fillStyle = COLORS.enemyHair;
    ctx.fillRect(x + 10, y + 3 + bobOffset, 6, 2);
    ctx.fillRect(x + 17, y + 3 + bobOffset, 6, 2);
    // Angled for anger
    ctx.fillRect(x + 9, y + 4 + bobOffset, 2, 2);
    ctx.fillRect(x + 22, y + 4 + bobOffset, 2, 2);

    // Grimacing mouth
    ctx.fillStyle = '#4a0000';
    ctx.fillRect(x + 12, y + 10 + bobOffset, 8, 2);
    // Downturned corners for angry expression
    ctx.fillRect(x + 11, y + 11 + bobOffset, 2, 1);
    ctx.fillRect(x + 19, y + 11 + bobOffset, 2, 1);

    // Stun stars
    if (isStunned) {
        ctx.fillStyle = '#f1c40f';
        const starOffset1 = Math.sin(gameState.animationTime * 8) * 5;
        const starOffset2 = Math.cos(gameState.animationTime * 8) * 5;
        drawStar(x + 4 + starOffset1, y - 6 + starOffset2, 6);
        drawStar(x + 22 - starOffset1, y - 4 - starOffset2, 5);
        drawStar(x + 14, y - 8 + starOffset1, 4);
    }

    // Scared effect (from dog companion)
    if (enemy.scared > 0) {
        // Fear sweat drops
        ctx.fillStyle = '#81d4fa';
        const sweatDrop = Math.sin(gameState.animationTime * 10) * 2;
        ctx.beginPath();
        ctx.ellipse(x + 6, y + 4 + sweatDrop, 2, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + 26, y + 6 + sweatDrop * 0.8, 2, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Scared expression indicator
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('😰', x + TILE_SIZE / 2, y - 4);
        ctx.textAlign = 'left';

        // Motion blur effect (running away)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        for (let i = 1; i <= 2; i++) {
            ctx.fillRect(x - i * 6, y + 12 + bobOffset, 4, 10);
        }
    }

    // Reset alpha if spawn animation was active
    if (enemy.spawnTimer > 0) {
        ctx.globalAlpha = 1;
    }

    // Colorblind mode: Add danger indicator pattern around enemies
    if (settings.colorblindMode && settings.colorblindMode !== 'off') {
        drawColorblindEnemyIndicator(x, y);
    }
}

// Draw colorblind-friendly danger indicator around enemies
function drawColorblindEnemyIndicator(x, y) {
    const cx = x + TILE_SIZE / 2;
    const cy = y + TILE_SIZE / 2;
    const pulse = Math.sin(gameState.animationTime * 6) * 0.2 + 0.8;

    // Exclamation pattern border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 2;

    // Draw triangular danger symbol above enemy
    ctx.beginPath();
    ctx.moveTo(cx, y - 12);
    ctx.lineTo(cx - 8, y - 2);
    ctx.lineTo(cx + 8, y - 2);
    ctx.closePath();
    ctx.fillStyle = `rgba(231, 76, 60, ${pulse})`;
    ctx.fill();
    ctx.stroke();

    // Exclamation mark inside triangle
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx - 1, y - 10, 2, 4);
    ctx.fillRect(cx - 1, y - 5, 2, 2);

    ctx.shadowBlur = 0;
    ctx.lineWidth = 1;
}

function drawExit(exit) {
    const x = exit.x * TILE_SIZE;
    const y = exit.y * TILE_SIZE;
    const pulse = Math.sin(gameState.animationTime * 4) * 0.3 + 0.7;
    const arrowBob = Math.sin(gameState.animationTime * 6) * 2;

    // Radiating "beckoning" rings - 3 expanding concentric circles
    for (let i = 0; i < 3; i++) {
        const phase = (gameState.animationTime * 1.5 + i * 0.33) % 1;
        const radius = 18 + phase * 20;
        const alpha = (1 - phase) * 0.25;

        ctx.strokeStyle = `rgba(241, 196, 15, ${alpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, radius, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Glow
    ctx.fillStyle = `rgba(241, 196, 15, ${pulse * 0.4})`;
    ctx.beginPath();
    ctx.arc(x + 16, y + 16, 24, 0, Math.PI * 2);
    ctx.fill();

    // Door frame
    ctx.fillStyle = COLORS.exitFrame;
    ctx.fillRect(x + 2, y, TILE_SIZE - 4, TILE_SIZE);

    ctx.fillStyle = '#c77c02';
    ctx.fillRect(x + 4, y + 2, TILE_SIZE - 8, TILE_SIZE - 2);

    // Door
    ctx.fillStyle = COLORS.exitDoor;
    ctx.fillRect(x + 6, y + 4, TILE_SIZE - 12, TILE_SIZE - 6);

    ctx.fillStyle = COLORS.exitDoorLight;
    ctx.fillRect(x + 6, y + 4, TILE_SIZE - 12, 4);
    ctx.fillRect(x + 6, y + 4, 3, TILE_SIZE - 6);

    // Handle
    ctx.fillStyle = '#f39c12';
    ctx.fillRect(x + 18, y + 14, 4, 6);

    // EXIT sign
    ctx.fillStyle = COLORS.exitSign;
    ctx.fillRect(x + 6, y - 6, 20, 8);
    ctx.fillStyle = '#fff';
    ctx.fillRect(x + 8, y - 4, 1, 4);
    ctx.fillRect(x + 8, y - 4, 3, 1);
    ctx.fillRect(x + 8, y - 2, 2, 1);
    ctx.fillRect(x + 8, y, 3, 1);
    ctx.fillRect(x + 12, y - 4, 1, 1);
    ctx.fillRect(x + 14, y - 4, 1, 1);
    ctx.fillRect(x + 13, y - 3, 1, 2);
    ctx.fillRect(x + 12, y, 1, 1);
    ctx.fillRect(x + 14, y, 1, 1);
    ctx.fillRect(x + 17, y - 4, 1, 5);
    ctx.fillRect(x + 20, y - 4, 3, 1);
    ctx.fillRect(x + 21, y - 4, 1, 5);

    // Arrow
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(x + 16, y + 26 + arrowBob);
    ctx.lineTo(x + 10, y + 18 + arrowBob);
    ctx.lineTo(x + 14, y + 18 + arrowBob);
    ctx.lineTo(x + 14, y + 12 + arrowBob);
    ctx.lineTo(x + 18, y + 12 + arrowBob);
    ctx.lineTo(x + 18, y + 18 + arrowBob);
    ctx.lineTo(x + 22, y + 18 + arrowBob);
    ctx.closePath();
    ctx.fill();
}

// === NEW: Draw Coin (Dopamine Breadcrumb) ===
function drawCoin(coin) {
    if (coin.collected) return;

    const x = coin.x * TILE_SIZE;
    const y = coin.y * TILE_SIZE;
    const bob = Math.sin(gameState.animationTime * 4 + coin.bobOffset) * 2;
    const sparkle = Math.sin(gameState.animationTime * 8 + coin.sparkle);

    // Coin glow
    ctx.shadowColor = '#f1c40f';
    ctx.shadowBlur = 8 + sparkle * 4;

    // Coin body (golden circle)
    const cx = x + TILE_SIZE / 2;
    const cy = y + TILE_SIZE / 2 + bob;
    const radius = TILE_SIZE / 4;

    // Outer gold ring
    ctx.fillStyle = '#f39c12';
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    // Inner bright gold
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.75, 0, Math.PI * 2);
    ctx.fill();

    // Highlight (gives 3D effect)
    ctx.fillStyle = '#fff9c4';
    ctx.beginPath();
    ctx.arc(cx - radius * 0.25, cy - radius * 0.25, radius * 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Sparkle effect
    if (sparkle > 0.5) {
        ctx.fillStyle = `rgba(255, 255, 255, ${(sparkle - 0.5) * 2})`;
        ctx.beginPath();
        ctx.arc(cx + radius * 0.4, cy - radius * 0.4, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.shadowBlur = 0;
}

function drawPowerup(powerup) {
    const x = powerup.x * TILE_SIZE;
    const y = powerup.y * TILE_SIZE;
    const bounce = Math.sin(gameState.animationTime * 5) * 4;
    const pulse = Math.sin(gameState.animationTime * 8) * 0.15 + 0.85;

    // Get the appropriate image and glow color
    let img, glowColor, shadowColor, drawFallback = false;
    if (powerup.type === 'speed') {
        img = powerupImages.speed;
        glowColor = 'rgba(0, 210, 211, 0.6)';
        shadowColor = '#00d2d3';
    } else if (powerup.type === 'knockout') {
        img = powerupImages.knockout;
        glowColor = 'rgba(238, 90, 36, 0.6)';
        shadowColor = '#ee5a24';
    } else if (powerup.type === 'electric') {
        img = powerupImages.electric;
        glowColor = 'rgba(241, 196, 15, 0.6)';
        shadowColor = '#f1c40f';
    } else if (powerup.type === 'shield') {
        img = powerupImages.shield;
        glowColor = 'rgba(76, 175, 80, 0.6)';
        shadowColor = '#4caf50';
        drawFallback = !img || !img.complete;
    } else if (powerup.type === 'companion') {
        img = powerupImages.companion;
        glowColor = 'rgba(139, 195, 74, 0.6)';
        shadowColor = '#8bc34a';
        drawFallback = !img || !img.complete;
    }

    // Draw glow effect behind powerup
    ctx.shadowColor = shadowColor;
    ctx.shadowBlur = 15 * pulse;
    ctx.fillStyle = glowColor;
    ctx.beginPath();
    ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2 + bounce, TILE_SIZE / 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw the powerup image or fallback
    // Check if image is valid (complete and not broken/errored)
    const imgValid = img && img.complete && img.naturalWidth > 0;
    if (imgValid && !drawFallback) {
        const imgSize = TILE_SIZE * 0.9;
        const offset = (TILE_SIZE - imgSize) / 2;
        ctx.drawImage(img, x + offset, y + offset + bounce, imgSize, imgSize);
    } else if (powerup.type === 'shield') {
        // Fallback: Draw shield icon
        const cx = x + TILE_SIZE / 2;
        const cy = y + TILE_SIZE / 2 + bounce;

        // Shield shape
        ctx.fillStyle = '#4caf50';
        ctx.beginPath();
        ctx.moveTo(cx, cy - 12);
        ctx.lineTo(cx + 10, cy - 6);
        ctx.lineTo(cx + 10, cy + 4);
        ctx.lineTo(cx, cy + 12);
        ctx.lineTo(cx - 10, cy + 4);
        ctx.lineTo(cx - 10, cy - 6);
        ctx.closePath();
        ctx.fill();

        // Inner highlight
        ctx.fillStyle = '#81c784';
        ctx.beginPath();
        ctx.moveTo(cx, cy - 8);
        ctx.lineTo(cx + 6, cy - 4);
        ctx.lineTo(cx + 6, cy + 2);
        ctx.lineTo(cx, cy + 8);
        ctx.lineTo(cx - 6, cy + 2);
        ctx.lineTo(cx - 6, cy - 4);
        ctx.closePath();
        ctx.fill();

        // Star/leaf emblem
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('✿', cx, cy + 3);
        ctx.textAlign = 'left';
    } else if (powerup.type === 'companion') {
        // Fallback: Draw cute dog icon
        const cx = x + TILE_SIZE / 2;
        const cy = y + TILE_SIZE / 2 + bounce;

        // Dog body
        ctx.fillStyle = '#8d6e63';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 2, 10, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Dog head
        ctx.fillStyle = '#a1887f';
        ctx.beginPath();
        ctx.arc(cx, cy - 6, 7, 0, Math.PI * 2);
        ctx.fill();

        // Ears
        ctx.fillStyle = '#6d4c41';
        ctx.beginPath();
        ctx.ellipse(cx - 6, cy - 10, 3, 5, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx + 6, cy - 10, 3, 5, 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(cx - 3, cy - 6, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 3, cy - 6, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Nose
        ctx.fillStyle = '#3e2723';
        ctx.beginPath();
        ctx.arc(cx, cy - 3, 2, 0, Math.PI * 2);
        ctx.fill();

        // Wagging tail
        const wagAngle = Math.sin(gameState.animationTime * 10) * 0.5;
        ctx.strokeStyle = '#8d6e63';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx + 8, cy + 2);
        ctx.quadraticCurveTo(cx + 14 + wagAngle * 4, cy - 4, cx + 12 + wagAngle * 6, cy - 8);
        ctx.stroke();
        ctx.lineWidth = 1;
    }

    // Add sparkle effects
    ctx.fillStyle = '#fff';
    const sparkle1 = Math.sin(gameState.animationTime * 10) * 3;
    const sparkle2 = Math.cos(gameState.animationTime * 12) * 3;
    ctx.fillRect(x + 4 + sparkle1, y + 6 + bounce, 2, 2);
    ctx.fillRect(x + TILE_SIZE - 6 + sparkle2, y + TILE_SIZE - 10 + bounce, 2, 2);

    // Colorblind mode: Add distinctive shape icons on top of powerups
    if (settings.colorblindMode && settings.colorblindMode !== 'off') {
        const cx = x + TILE_SIZE / 2;
        const cy = y + TILE_SIZE / 2 + bounce;

        ctx.strokeStyle = '#ffffff';
        ctx.fillStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 3;

        if (powerup.type === 'speed') {
            // Lightning bolt icon for speed
            ctx.beginPath();
            ctx.moveTo(cx + 2, cy - 10);
            ctx.lineTo(cx - 4, cy);
            ctx.lineTo(cx, cy);
            ctx.lineTo(cx - 2, cy + 10);
            ctx.lineTo(cx + 4, cy);
            ctx.lineTo(cx, cy);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        } else if (powerup.type === 'knockout') {
            // Star burst icon for knockout
            drawColorblindStar(cx, cy, 8, 5);
        } else if (powerup.type === 'electric') {
            // Zigzag spark icon for electric
            ctx.beginPath();
            ctx.moveTo(cx - 8, cy - 4);
            ctx.lineTo(cx - 3, cy - 4);
            ctx.lineTo(cx, cy);
            ctx.lineTo(cx + 3, cy - 4);
            ctx.lineTo(cx + 8, cy - 4);
            ctx.moveTo(cx - 6, cy + 4);
            ctx.lineTo(cx - 1, cy + 4);
            ctx.lineTo(cx + 2, cy);
            ctx.lineTo(cx + 5, cy + 4);
            ctx.stroke();
        } else if (powerup.type === 'shield') {
            // Shield shape outline
            ctx.beginPath();
            ctx.moveTo(cx, cy - 8);
            ctx.lineTo(cx + 7, cy - 4);
            ctx.lineTo(cx + 7, cy + 2);
            ctx.lineTo(cx, cy + 8);
            ctx.lineTo(cx - 7, cy + 2);
            ctx.lineTo(cx - 7, cy - 4);
            ctx.closePath();
            ctx.stroke();
        } else if (powerup.type === 'companion') {
            // Paw print icon for companion
            ctx.beginPath();
            ctx.arc(cx, cy + 3, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(cx - 5, cy - 2, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(cx + 5, cy - 2, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(cx - 2, cy - 5, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(cx + 2, cy - 5, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.shadowBlur = 0;
        ctx.lineWidth = 1;
    }
}

// Draw a star shape for colorblind mode
function drawColorblindStar(cx, cy, outerRadius, points) {
    const innerRadius = outerRadius * 0.5;
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (i * Math.PI) / points - Math.PI / 2;
        const px = cx + Math.cos(angle) * radius;
        const py = cy + Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}

// Update collecting powerups (suction animation)
function updateCollectingPowerups(deltaTime) {
    for (let i = gameState.collectingPowerups.length - 1; i >= 0; i--) {
        const cp = gameState.collectingPowerups[i];
        cp.collectTimer += deltaTime;

        // Animation complete after 0.25 seconds
        if (cp.collectTimer >= 0.25) {
            gameState.collectingPowerups.splice(i, 1);
        }
    }
}

// Draw collecting powerups with suction effect
function drawCollectingPowerups() {
    for (const cp of gameState.collectingPowerups) {
        const progress = Math.min(cp.collectTimer / 0.25, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic

        // Target is the player position
        const targetX = gameState.player.x * TILE_SIZE + TILE_SIZE / 2;
        const targetY = gameState.player.y * TILE_SIZE + TILE_SIZE / 2;

        // Interpolate position
        const currentX = cp.startX + (targetX - cp.startX) * easeProgress;
        const currentY = cp.startY + (targetY - cp.startY) * easeProgress;

        // Scale down as it approaches
        const scale = 1 - progress * 0.6;

        // Get glow color based on type
        let glowColor;
        if (cp.type === 'speed') glowColor = '#00d2d3';
        else if (cp.type === 'knockout') glowColor = '#ee5a24';
        else if (cp.type === 'electric') glowColor = '#f1c40f';
        else if (cp.type === 'shield') glowColor = '#4caf50';
        else glowColor = '#8bc34a';

        ctx.save();
        ctx.translate(currentX, currentY);
        ctx.scale(scale, scale);

        // Draw glowing orb
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 15;
        ctx.fillStyle = glowColor;
        ctx.globalAlpha = 1 - progress * 0.5;
        ctx.beginPath();
        ctx.arc(0, 0, TILE_SIZE / 3, 0, Math.PI * 2);
        ctx.fill();

        // Inner bright core
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(0, 0, TILE_SIZE / 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

function drawZoneLabels() {
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';

    // Cafeteria label
    if (gameState.zones.cafeteria) {
        const cf = gameState.zones.cafeteria;
        const cx = (cf.x + cf.width / 2) * TILE_SIZE;
        const cy = cf.y * TILE_SIZE - 8;

        ctx.fillStyle = 'rgba(46, 204, 113, 0.8)';
        ctx.fillRect(cx - 35, cy - 8, 70, 12);
        ctx.fillStyle = '#fff';
        ctx.fillText('☕ CAFETERIA', cx, cy);
    }

    // Bathroom label
    if (gameState.zones.bathroom) {
        const br = gameState.zones.bathroom;
        const bx = (br.x + br.width / 2) * TILE_SIZE;
        const by = br.y * TILE_SIZE - 8;

        ctx.fillStyle = 'rgba(52, 152, 219, 0.8)';
        ctx.fillRect(bx - 35, by - 8, 70, 12);
        ctx.fillStyle = '#fff';
        ctx.fillText('🚻 RESTROOM', bx, by);
    }

    // Garden label
    if (gameState.zones.garden) {
        const gd = gameState.zones.garden;
        const gx = (gd.x + gd.width / 2) * TILE_SIZE;
        const gy = gd.y * TILE_SIZE - 8;

        ctx.fillStyle = 'rgba(76, 175, 80, 0.9)';
        ctx.fillRect(gx - 50, gy - 8, 100, 12);
        ctx.fillStyle = '#fff';
        ctx.fillText('🌸 ROOFTOP GARDEN', gx, gy);
    }

    // Dog Park label
    if (gameState.zones.dogPark) {
        const dp = gameState.zones.dogPark;
        const dx = (dp.x + dp.width / 2) * TILE_SIZE;
        const dy = dp.y * TILE_SIZE - 8;

        ctx.fillStyle = 'rgba(139, 195, 74, 0.9)';
        ctx.fillRect(dx - 40, dy - 8, 80, 12);
        ctx.fillStyle = '#fff';
        ctx.fillText('🐕 DOG PARK', dx, dy);
    }

    ctx.textAlign = 'left';
}

// Draw hints pointing to the secret exit on Floor 13
function drawSecretExitHints() {
    if (!gameState.secretExit) return;

    const secretX = gameState.secretExit.x * TILE_SIZE + TILE_SIZE / 2;
    const secretY = gameState.secretExit.y * TILE_SIZE + TILE_SIZE / 2;
    const playerX = gameState.player.x * TILE_SIZE + TILE_SIZE / 2;
    const playerY = gameState.player.y * TILE_SIZE + TILE_SIZE / 2;

    // Floating particles drifting towards secret exit
    const time = gameState.animationTime;
    for (let i = 0; i < 5; i++) {
        const offset = i * 1.2;
        const px = playerX + Math.sin(time * 2 + offset) * 50 + (secretX - playerX) * 0.1;
        const py = playerY + Math.cos(time * 1.5 + offset) * 50 + (secretY - playerY) * 0.1;
        const alpha = Math.sin(time * 3 + i) * 0.3 + 0.4;

        ctx.fillStyle = `rgba(155, 89, 182, ${alpha})`;
        ctx.beginPath();
        ctx.arc(px, py, 3 + Math.sin(time * 5 + i) * 1, 0, Math.PI * 2);
        ctx.fill();
    }

    // "Something feels different..." text at top
    const pulse = Math.sin(time * 2) * 0.2 + 0.8;
    ctx.fillStyle = `rgba(155, 89, 182, ${pulse * 0.9})`;
    ctx.fillRect(canvas.width / 2 - 90, 40, 180, 20);
    ctx.fillStyle = '#e8daef';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Floor 13... Something is different', canvas.width / 2, 54);
    ctx.textAlign = 'left';

    // Subtle arrow/light beam pointing toward secret exit (only if player is far away)
    const dist = Math.sqrt(Math.pow(secretX - playerX, 2) + Math.pow(secretY - playerY, 2));
    if (dist > 150) {
        const angle = Math.atan2(secretY - playerY, secretX - playerX);
        const beamStartX = playerX + Math.cos(angle) * 40;
        const beamStartY = playerY + Math.sin(angle) * 40;

        // Draw pulsing arrow
        ctx.save();
        ctx.translate(beamStartX, beamStartY);
        ctx.rotate(angle);

        const arrowPulse = Math.sin(time * 4) * 0.3 + 0.5;
        ctx.fillStyle = `rgba(155, 89, 182, ${arrowPulse})`;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-8, -5);
        ctx.lineTo(-5, 0);
        ctx.lineTo(-8, 5);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }
}

function drawImplosion() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const progress = gameState.implosionFrame / 60;

    const shake = (1 - progress) * 15;
    ctx.save();
    ctx.translate(
        Math.random() * shake - shake / 2,
        Math.random() * shake - shake / 2
    );

    const scale = 1 - progress;
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(progress * 0.5);
    ctx.scale(scale, scale);
    ctx.translate(-centerX, -centerY);

    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            drawTile(x, y);
        }
    }
    ctx.restore();

    for (const particle of gameState.particles) {
        ctx.fillStyle = particle.color + '40';
        ctx.fillRect(particle.x - particle.vx * 2, particle.y - particle.vy * 2, particle.size * 0.7, particle.size * 0.7);
        ctx.fillStyle = particle.color;
        ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
    }

    ctx.strokeStyle = `rgba(233, 69, 96, ${progress * 0.8})`;
    ctx.lineWidth = 3;
    for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, (1 - progress) * (300 + i * 30), progress * Math.PI * 4, progress * Math.PI * 4 + Math.PI);
        ctx.stroke();
    }

    ctx.fillStyle = `rgba(255, 255, 255, ${progress * 0.5})`;
    ctx.beginPath();
    ctx.arc(centerX, centerY, (1 - progress) * 50 + 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

// ============================================
// TUTORIAL SYSTEM
// ============================================
const tutorialState = {
    shown: {
        movement: false,
        powerup: false,
        exit: false,
        cafeteria: false,
        bathroom: false,
        enemy: false,
        secret: false
    },
    currentHint: null,
    hintTimer: 0
};

function showTutorialHint(key, text, duration = 4) {
    // Only show each hint once per session, and only on first few runs
    if (tutorialState.shown[key] || playerProgress.totalRuns > 3) return;

    tutorialState.shown[key] = true;
    tutorialState.currentHint = text;
    tutorialState.hintTimer = duration;
}

// ============================================
// CELEBRATION SYSTEM (Playtest Feature #3)
// ============================================
function showCelebration(type, extra = {}) {
    const celDef = CELEBRATIONS[type];
    if (!celDef) return;

    let text = celDef.text;
    if (extra.n) text = text.replace('{n}', extra.n);

    gameState.celebrations.push({
        text: text,
        color: celDef.color,
        x: gameState.player.x * TILE_SIZE + TILE_SIZE / 2,
        y: gameState.player.y * TILE_SIZE,
        timer: 1.5,
        offsetY: 0
    });
}

function updateCelebrations(deltaTime) {
    for (let i = gameState.celebrations.length - 1; i >= 0; i--) {
        const cel = gameState.celebrations[i];
        cel.timer -= deltaTime;
        cel.offsetY -= deltaTime * 50; // Float upward
        if (cel.timer <= 0) {
            gameState.celebrations.splice(i, 1);
        }
    }
}

function drawCelebrations() {
    for (const cel of gameState.celebrations) {
        const alpha = Math.min(1, cel.timer / 0.5); // Fade out in last 0.5s
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = cel.color;
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 4;
        ctx.fillText(cel.text, cel.x, cel.y + cel.offsetY);
        ctx.restore();
    }
}

// Check for celebration triggers
function checkCelebrationTriggers(event, data = {}) {
    switch (event) {
        case 'floorComplete':
            // Speedster: cleared with 10+ seconds
            if (gameState.timer >= 10) {
                showCelebration('speedster');
            }
            // Flawless: no hits this floor
            if (gameState.floorHits === 0) {
                showCelebration('flawless');
            }
            break;
        case 'enemyStunned':
            if (data.count >= 2) {
                showCelebration('combo', { n: data.count });
            } else {
                showCelebration('niceUse');
            }
            break;
        case 'closeDodge':
            showCelebration('closeDodge');
            break;
        case 'checkpoint':
            showCelebration('checkpoint');
            break;
    }
}

function updateTutorial(deltaTime) {
    if (tutorialState.hintTimer > 0) {
        tutorialState.hintTimer -= deltaTime;
        if (tutorialState.hintTimer <= 0) {
            tutorialState.currentHint = null;
        }
    }

    // Check for tutorial triggers
    if (gameState.floor === 23 && !tutorialState.shown.movement) {
        showTutorialHint('movement', 'Use WASD or Arrow Keys to move. Reach the EXIT in the corners!', 5);
    }

    // First powerup pickup
    if (gameState.powerup && !tutorialState.shown.powerup) {
        const powerupName = gameState.powerup === 'speed' ? 'CAFFEINE RUSH' :
                           gameState.powerup === 'knockout' ? 'PINK SLIP' : 'STATIC SHOCK';
        showTutorialHint('powerup', `You got ${powerupName}! Press SPACE to use it (or it activates on contact).`, 4);
    }

    // Near an exit
    if (!tutorialState.shown.exit) {
        for (const exit of gameState.exits) {
            const dist = Math.abs(exit.x - gameState.player.x) + Math.abs(exit.y - gameState.player.y);
            if (dist <= 3) {
                showTutorialHint('exit', 'Step on the EXIT door to descend to the next floor!', 3);
                break;
            }
        }
    }

    // In cafeteria
    if (isInCafeteria(gameState.player.x, gameState.player.y) && !tutorialState.shown.cafeteria) {
        showTutorialHint('cafeteria', 'CAFETERIA: Timer pauses here! Enemies move slower too.', 4);
    }

    // In bathroom
    if (isInBathroom(gameState.player.x, gameState.player.y) && !tutorialState.shown.bathroom) {
        showTutorialHint('bathroom', 'RESTROOM: Safe zone! Enemies cannot enter here.', 4);
    }

    // Near enemy for first time
    if (!tutorialState.shown.enemy && gameState.enemies.length > 0) {
        for (const enemy of gameState.enemies) {
            const dist = Math.abs(enemy.x - gameState.player.x) + Math.abs(enemy.y - gameState.player.y);
            if (dist <= 4 && enemy.stunned <= 0) {
                showTutorialHint('enemy', 'Watch out! Coworkers will stun you if they catch you.', 3);
                break;
            }
        }
    }

    // Floor 13 secret hint
    if (gameState.floor === 13 && !tutorialState.shown.secret && gameState.secretExit) {
        showTutorialHint('secret', 'Floor 13... Something feels different. Look for a SECRET EXIT!', 5);
    }

    // Fire hazard hint - show when first fire spawns on floor 23
    if (gameState.floor === 23 && !tutorialState.shown.fire && gameState.fires.length > 0) {
        showTutorialHint('fire', 'FIRE! Avoid the flames - they burn and drain your time faster!', 4);
    }
}

function drawTutorialHint() {
    if (!tutorialState.currentHint) return;

    const text = tutorialState.currentHint;
    const alpha = Math.min(1, tutorialState.hintTimer);

    ctx.save();
    ctx.globalAlpha = alpha;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(canvas.width / 2 - 200, canvas.height - 70, 400, 50);

    // Border
    ctx.strokeStyle = '#4ecdc4';
    ctx.lineWidth = 2;
    ctx.strokeRect(canvas.width / 2 - 200, canvas.height - 70, 400, 50);

    // Text
    ctx.fillStyle = '#fff';
    ctx.font = '12px "Courier New", monospace';
    ctx.textAlign = 'center';

    // Word wrap if needed
    const words = text.split(' ');
    let lines = [];
    let currentLine = '';
    for (const word of words) {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        if (ctx.measureText(testLine).width > 380) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    }
    lines.push(currentLine);

    const lineHeight = 14;
    const startY = canvas.height - 55 + (2 - lines.length) * lineHeight / 2;
    for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], canvas.width / 2, startY + i * lineHeight);
    }

    ctx.restore();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!gameState.started || gameState.maze.length === 0) {
        return;
    }

    if (gameState.imploding) {
        drawImplosion();
        return;
    }

    // Apply screen shake offset
    ctx.save();
    ctx.translate(screenShake.offsetX, screenShake.offsetY);

    // Draw tiles
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            drawTile(x, y);
        }
    }

    // Draw zone labels
    drawZoneLabels();

    // Draw secret exit hints on Floor 13
    if (gameState.floor === 13 && gameState.secretExit) {
        drawSecretExitHints();
    }

    // Draw exits
    for (const exit of gameState.exits) {
        drawExit(exit);
    }

    // Draw power-ups
    for (const powerup of gameState.powerups) {
        drawPowerup(powerup);
    }

    // === NEW: Draw coins (dopamine breadcrumbs) ===
    for (const coin of gameState.coins) {
        if (!coin.collected) {
            drawCoin(coin);
        }
    }

    // Draw collecting powerups (suction effect)
    drawCollectingPowerups();

    // Draw fire spread warnings first (under the fires)
    for (const fire of gameState.fires) {
        drawFireSpreadWarning(fire);
    }

    // Draw fires (hazards)
    for (const fire of gameState.fires) {
        drawFire(fire);
    }

    // Draw crispy remains
    for (const crispy of gameState.crispyEffects) {
        drawCrispyEffect(crispy);
    }

    // Draw punch effects
    for (const punch of gameState.punchEffects) {
        drawPunchEffect(punch);
    }

    // Draw enemies
    for (const enemy of gameState.enemies) {
        drawEnemy(enemy);
    }

    // Draw ghost replay (before player so it appears behind)
    drawGhost();

    // Draw player
    drawPlayer();

    // Draw dog companion (if active)
    drawCompanion();

    // Timer urgency vignette - builds up gradually from 10 seconds
    if (gameState.timer <= 10 && gameState.timer > 5 && !gameState.lastChance) {
        const urgency = 1 - (gameState.timer / 10);  // 0 at 10s, 0.5 at 5s
        const pulse = Math.sin(gameState.animationTime * (6 + urgency * 8)) * 0.15 + 0.85;

        // Red vignette effect that intensifies as time decreases
        const gradient = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, canvas.width * 0.35,
            canvas.width / 2, canvas.height / 2, canvas.width * 0.7
        );
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, `rgba(231, 76, 60, ${urgency * 0.35 * pulse})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Timer warning - intense effect below 5 seconds with heartbeat pulse
    if (gameState.timer <= 5 || gameState.lastChance) {
        const flashSpeed = gameState.lastChance ? 20 : 10; // Faster flash during last chance
        const flashIntensity = Math.sin(gameState.animationTime * flashSpeed) * 0.2 + 0.15;
        ctx.fillStyle = `rgba(233, 69, 96, ${flashIntensity})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const gradient = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 100, canvas.width/2, canvas.height/2, 400);
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, `rgba(233, 69, 96, ${0.4 + flashIntensity})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Heartbeat pulse effect - screen edge "throb"
        // Heartbeat rhythm: quick double-beat then pause (lub-dub...lub-dub...)
        const heartbeatSpeed = gameState.lastChance ? 4 : 2; // BPM increases when critical
        const heartPhase = (gameState.animationTime * heartbeatSpeed) % 1;
        let heartbeatIntensity = 0;

        // Double-beat pattern: first beat at 0-0.15, second at 0.2-0.35, rest 0.35-1.0
        if (heartPhase < 0.15) {
            heartbeatIntensity = Math.sin((heartPhase / 0.15) * Math.PI); // First beat
        } else if (heartPhase >= 0.2 && heartPhase < 0.35) {
            heartbeatIntensity = Math.sin(((heartPhase - 0.2) / 0.15) * Math.PI) * 0.7; // Second beat (softer)
        }

        // Apply heartbeat as a screen-edge pulse
        if (heartbeatIntensity > 0) {
            const heartGradient = ctx.createRadialGradient(
                canvas.width / 2, canvas.height / 2, canvas.width * 0.3,
                canvas.width / 2, canvas.height / 2, canvas.width * 0.55
            );
            heartGradient.addColorStop(0, 'rgba(0,0,0,0)');
            heartGradient.addColorStop(1, `rgba(180, 40, 60, ${heartbeatIntensity * 0.4})`);
            ctx.fillStyle = heartGradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Slight scale effect on heartbeat (subtle zoom)
            const scaleAmount = 1 + heartbeatIntensity * 0.008;
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.scale(scaleAmount, scaleAmount);
            ctx.translate(-canvas.width / 2, -canvas.height / 2);
        }
    }

    // LAST CHANCE indicator
    if (gameState.lastChance) {
        const pulse = Math.sin(gameState.animationTime * 15) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(233, 69, 96, 0.9)`;
        ctx.fillRect(canvas.width / 2 - 100, canvas.height / 2 - 30, 200, 60);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.strokeRect(canvas.width / 2 - 100, canvas.height / 2 - 30, 200, 60);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('LAST CHANCE!', canvas.width / 2, canvas.height / 2 - 5);
        ctx.font = 'bold 16px monospace';
        ctx.fillText(`${gameState.lastChanceTimer.toFixed(1)}s`, canvas.width / 2, canvas.height / 2 + 18);
        ctx.textAlign = 'left';
    }

    // Show if in safe zone
    const inCafeteria = isInCafeteria(gameState.player.x, gameState.player.y);
    const inBathroom = isInBathroom(gameState.player.x, gameState.player.y);

    if (inCafeteria || inBathroom) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(canvas.width / 2 - 80, 10, 160, 24);
        ctx.fillStyle = inCafeteria ? '#2ecc71' : '#3498db';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(inCafeteria ? '⏸ TIME PAUSED' : '🛡 SAFE ZONE', canvas.width / 2, 27);
        ctx.textAlign = 'left';
    }

    // Draw tutorial hints
    drawTutorialHint();

    // Draw celebration text (positive feedback system)
    drawCelebrations();

    // === NEW: Timer Danger Visual Feedback ===
    // Screen tint intensifies as timer approaches zero
    if (gameState.timer <= 15 && gameState.timer > 0 && !gameState.paused) {
        const urgency = 1 - (gameState.timer / 15); // 0 at 15s, 1 at 0s
        const pulse = Math.sin(gameState.animationTime * (8 + urgency * 12)) * 0.5 + 0.5;
        const alpha = urgency * 0.3 * pulse;

        // Red vignette effect
        const gradient = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, canvas.width * 0.3,
            canvas.width / 2, canvas.height / 2, canvas.width * 0.7
        );
        gradient.addColorStop(0, 'rgba(255, 0, 0, 0)');
        gradient.addColorStop(1, `rgba(180, 0, 0, ${alpha})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Screen shake when under 5 seconds (if enabled)
        if (gameState.timer <= 5 && settings.screenShake) {
            const shakeIntensity = (1 - gameState.timer / 5) * 3 * pulse;
            ctx.translate(
                (Math.random() - 0.5) * shakeIntensity,
                (Math.random() - 0.5) * shakeIntensity
            );
        }

        // Border pulse effect
        ctx.strokeStyle = `rgba(255, 50, 50, ${alpha * 2})`;
        ctx.lineWidth = 4 + urgency * 4;
        ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
    }

    // Draw mini-map in bottom-right corner
    drawMiniMap();

    // Restore context after screen shake
    ctx.restore();
}

// Draw a mini-map showing player position and exits
function drawMiniMap() {
    const miniMapHeight = 80;
    const padding = 10;
    // Calculate minimap width based on aspect ratio
    const miniMapWidth = Math.round(miniMapHeight * (MAP_WIDTH / MAP_HEIGHT));
    const miniMapX = canvas.width - miniMapWidth - padding;
    const miniMapY = canvas.height - miniMapHeight - padding;
    const cellWidth = miniMapWidth / MAP_WIDTH;
    const cellHeight = miniMapHeight / MAP_HEIGHT;

    // Semi-transparent background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(miniMapX - 2, miniMapY - 2, miniMapWidth + 4, miniMapHeight + 4);

    // Draw maze cells (simplified)
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            const tile = gameState.maze[y][x];
            const px = miniMapX + x * cellWidth;
            const py = miniMapY + y * cellHeight;

            if (tile === TILE.WALL || tile === TILE.DESK) {
                ctx.fillStyle = '#444';
            } else if (tile === TILE.CAFETERIA) {
                ctx.fillStyle = '#5a4a3a';
            } else if (tile === TILE.BATHROOM) {
                ctx.fillStyle = '#3a5a6a';
            } else if (tile === TILE.GARDEN || tile === TILE.DOG_PARK) {
                ctx.fillStyle = '#3a5a3a';
            } else {
                ctx.fillStyle = '#2a3a4a';
            }
            ctx.fillRect(px, py, cellWidth, cellHeight);
        }
    }

    // Draw exits (yellow dots)
    ctx.fillStyle = '#f1c40f';
    for (const exit of gameState.exits) {
        const px = miniMapX + exit.x * cellWidth;
        const py = miniMapY + exit.y * cellHeight;
        ctx.beginPath();
        ctx.arc(px + cellWidth/2, py + cellHeight/2, Math.min(cellWidth, cellHeight) * 0.8, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw enemies (red dots)
    ctx.fillStyle = '#e74c3c';
    for (const enemy of gameState.enemies) {
        if (enemy.stunned <= 0) {
            const px = miniMapX + enemy.x * cellWidth;
            const py = miniMapY + enemy.y * cellHeight;
            ctx.beginPath();
            ctx.arc(px + cellWidth/2, py + cellHeight/2, Math.min(cellWidth, cellHeight) * 0.6, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Draw player (green dot, pulsing)
    const pulse = Math.sin(gameState.animationTime * 8) * 0.2 + 0.8;
    ctx.fillStyle = COLORS.playerShirt;
    const playerPx = miniMapX + gameState.player.x * cellWidth;
    const playerPy = miniMapY + gameState.player.y * cellHeight;
    ctx.beginPath();
    ctx.arc(playerPx + cellWidth/2, playerPy + cellHeight/2, Math.min(cellWidth, cellHeight) * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Border
    ctx.strokeStyle = '#4ecdc4';
    ctx.lineWidth = 1;
    ctx.strokeRect(miniMapX - 2, miniMapY - 2, miniMapWidth + 4, miniMapHeight + 4);
}

function updateHUD() {
    // Floor display with progress indicator
    // === UPDATED: Support Quick Run mode ===
    const startFloor = gameState.quickRunMode ? 7 : 23;
    const floorsCleared = startFloor - gameState.floor;
    const modeLabel = gameState.quickRunMode ? ' [QUICK]' : '';
    document.getElementById('floor').textContent = `Floor: ${gameState.floor} (${floorsCleared}/${startFloor})${modeLabel}`;

    // Timer display - show if burning (drains 2x)
    const timerEl = document.getElementById('timer');
    if (gameState.player.burning > 0) {
        timerEl.textContent = `Time: ${Math.ceil(gameState.timer)} 🔥2X`;
        timerEl.style.color = '#ff4500';
    } else {
        timerEl.textContent = `Time: ${Math.ceil(gameState.timer)}`;
        timerEl.style.color = gameState.timer <= 5 ? '#e94560' : '#ff6b6b';
    }

    // === NEW: Coin display with combo indicator ===
    const coinDisplay = document.getElementById('coinDisplay');
    if (coinDisplay) {
        const comboText = gameState.coinCombo > 1 ? ` x${gameState.coinCombo}` : '';
        coinDisplay.textContent = `🪙 ${gameState.coinsCollected || 0}${comboText}`;
        coinDisplay.style.color = gameState.coinCombo > 2 ? '#f39c12' : '#f1c40f';
    }

    let powerupText = 'None';
    if (gameState.player.burning > 0) {
        // Show burn timer when burning
        powerupText = `🔥 BURNING ${gameState.player.burning.toFixed(1)}s`;
    } else if (gameState.player.stunned > 0) {
        // Show stun timer when stunned
        powerupText = `😵 STUNNED ${gameState.player.stunned.toFixed(1)}s`;
    } else if (gameState.player.shielded > 0) {
        // Show shield timer
        powerupText = `🛡️ SHIELD ${gameState.player.shielded.toFixed(1)}s`;
    } else if (gameState.powerup === 'speed') {
        powerupText = `⚡ Speed ${gameState.powerupTimer.toFixed(1)}s`;
    } else if (gameState.powerup === 'knockout') {
        powerupText = `🥊 Knockout ${gameState.powerupTimer.toFixed(1)}s`;
    } else if (gameState.powerup === 'electric') {
        powerupText = `⚡ ELECTRIC ${gameState.powerupTimer.toFixed(1)}s`;
    }

    // Add companion indicator if active
    if (gameState.player.companion) {
        powerupText += ` | 🐕 ${gameState.player.companion.timer.toFixed(1)}s`;
    }

    document.getElementById('powerup').textContent = `Power: ${powerupText}`;

    // Update run timer display (if element exists)
    const runTimerEl = document.getElementById('runTimer');
    if (runTimerEl && gameState.runStartTime) {
        const elapsed = (Date.now() - gameState.runStartTime) / 1000;
        const mins = Math.floor(elapsed / 60);
        const secs = Math.floor(elapsed % 60);
        runTimerEl.textContent = `Run: ${mins}:${secs.toString().padStart(2, '0')}`;
    }
}

function canMove(x, y) {
    if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) return false;
    const tile = gameState.maze[y][x];
    return tile !== TILE.WALL && tile !== TILE.DESK;
}

function pushEnemyAway(enemy, fromX, fromY) {
    // Push enemy away from a position
    const dx = enemy.x - fromX;
    const dy = enemy.y - fromY;

    // Build a comprehensive list of push options, starting with furthest away
    const pushOptions = [];

    // Try pushing 3 tiles away first (in the direction away from player)
    if (dx !== 0) pushOptions.push({ x: enemy.x + Math.sign(dx) * 3, y: enemy.y });
    if (dy !== 0) pushOptions.push({ x: enemy.x, y: enemy.y + Math.sign(dy) * 3 });

    // Then 2 tiles away
    if (dx !== 0) pushOptions.push({ x: enemy.x + Math.sign(dx) * 2, y: enemy.y });
    if (dy !== 0) pushOptions.push({ x: enemy.x, y: enemy.y + Math.sign(dy) * 2 });

    // Then 1 tile in all directions
    pushOptions.push({ x: enemy.x + 1, y: enemy.y });
    pushOptions.push({ x: enemy.x - 1, y: enemy.y });
    pushOptions.push({ x: enemy.x, y: enemy.y + 1 });
    pushOptions.push({ x: enemy.x, y: enemy.y - 1 });

    // Diagonal pushes as last resort
    pushOptions.push({ x: enemy.x + 1, y: enemy.y + 1 });
    pushOptions.push({ x: enemy.x + 1, y: enemy.y - 1 });
    pushOptions.push({ x: enemy.x - 1, y: enemy.y + 1 });
    pushOptions.push({ x: enemy.x - 1, y: enemy.y - 1 });

    for (const opt of pushOptions) {
        if (canMove(opt.x, opt.y) && !isInBathroom(opt.x, opt.y) &&
            !(opt.x === gameState.player.x && opt.y === gameState.player.y)) {
            enemy.x = opt.x;
            enemy.y = opt.y;
            return true;
        }
    }

    // FALLBACK: If all push options fail, find ANY valid floor tile away from player
    for (let radius = 2; radius <= 5; radius++) {
        for (let checkY = enemy.y - radius; checkY <= enemy.y + radius; checkY++) {
            for (let checkX = enemy.x - radius; checkX <= enemy.x + radius; checkX++) {
                if (canMove(checkX, checkY) && !isInBathroom(checkX, checkY) &&
                    !(checkX === gameState.player.x && checkY === gameState.player.y) &&
                    Math.abs(checkX - fromX) >= 2 && Math.abs(checkY - fromY) >= 2) {
                    enemy.x = checkX;
                    enemy.y = checkY;
                    return true;
                }
            }
        }
    }

    return false;
}

function fryEnemy(enemy) {
    AudioManager.play('zap'); // Electric zap sound
    screenShake.trigger(8, 0.2); // Small shake on zap
    triggerFreezeFrame('electricZap'); // Longer freeze for satisfying zap

    // Create crispy effect at enemy location
    gameState.crispyEffects.push({
        x: enemy.x,
        y: enemy.y,
        timer: 2.0,  // 2 seconds of crispy remains
        frame: 0
    });

    // Remove enemy from the game
    const idx = gameState.enemies.indexOf(enemy);
    if (idx > -1) {
        gameState.enemies.splice(idx, 1);
    }
}

// ============================================
// FIRE HAZARD SYSTEM
// ============================================

// Spawn a new fire at a random floor tile
function spawnFire() {
    const maxFires = getMaxFiresForFloor(gameState.floor);
    if (gameState.fires.length >= maxFires) return;

    // Find a random floor tile that isn't near player, exits, or other fires
    let attempts = 0;
    while (attempts < 50) {
        const x = Math.floor(Math.random() * (MAP_WIDTH - 2)) + 1;
        const y = Math.floor(Math.random() * (MAP_HEIGHT - 2)) + 1;

        // Check if valid floor tile
        if (gameState.maze[y] && gameState.maze[y][x] === TILE.FLOOR) {
            // Not too close to player
            const distToPlayer = Math.abs(x - gameState.player.x) + Math.abs(y - gameState.player.y);
            if (distToPlayer < 5) { attempts++; continue; }

            // Not on or near exits
            let nearExit = false;
            for (const exit of gameState.exits) {
                if (Math.abs(x - exit.x) <= 2 && Math.abs(y - exit.y) <= 2) {
                    nearExit = true;
                    break;
                }
            }
            if (nearExit) { attempts++; continue; }

            // Not on existing fire
            let onFire = false;
            for (const fire of gameState.fires) {
                if (fire.x === x && fire.y === y) {
                    onFire = true;
                    break;
                }
            }
            if (onFire) { attempts++; continue; }

            // FAIRNESS CHECK: Ensure at least one path to an exit remains
            // Temporarily treat this tile as blocked and check paths
            if (!canSpawnFireWithoutBlockingAllPaths(x, y)) {
                attempts++;
                continue;
            }

            // Spawn fire!
            gameState.fires.push({
                x: x,
                y: y,
                size: 1,  // Starts small, grows over time
                age: 0,
                spreadTimer: 0
            });
            return;
        }
        attempts++;
    }
}

// Fairness check: Ensure fire spawn doesn't block all exits (Playtest improvement #9)
function canSpawnFireWithoutBlockingAllPaths(fireX, fireY) {
    // Create a copy of current fire positions + the new fire
    const blockedTiles = new Set();
    for (const fire of gameState.fires) {
        blockedTiles.add(`${fire.x},${fire.y}`);
    }
    blockedTiles.add(`${fireX},${fireY}`);

    // Check if path exists to at least ONE exit while avoiding fires
    const isWalkableAvoidingFires = (x, y) => {
        if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) return false;
        if (blockedTiles.has(`${x},${y}`)) return false;
        const tile = gameState.maze[y][x];
        return tile !== TILE.WALL && tile !== TILE.DESK;
    };

    // BFS from player to any exit, avoiding fires
    const visited = new Set();
    const queue = [[gameState.player.x, gameState.player.y]];
    visited.add(`${gameState.player.x},${gameState.player.y}`);

    while (queue.length > 0) {
        const [x, y] = queue.shift();

        // Check if we reached any exit
        for (const exit of gameState.exits) {
            if (x === exit.x && y === exit.y) {
                return true; // Path exists to at least one exit
            }
        }

        const neighbors = [[x+1, y], [x-1, y], [x, y+1], [x, y-1]];
        for (const [nx, ny] of neighbors) {
            const key = `${nx},${ny}`;
            if (!visited.has(key) && isWalkableAvoidingFires(nx, ny)) {
                visited.add(key);
                queue.push([nx, ny]);
            }
        }
    }

    return false; // No path to any exit - don't spawn fire here
}

// Update spatial audio cues based on nearby threats
function updateSpatialAudio() {
    if (!settings.audioProximityCues) return;

    const px = gameState.player.x;
    const py = gameState.player.y;
    const now = Date.now();

    // Throttle audio updates to prevent overwhelming
    if (!gameState.lastSpatialAudioTime) gameState.lastSpatialAudioTime = 0;
    if (now - gameState.lastSpatialAudioTime < 300) return;
    gameState.lastSpatialAudioTime = now;

    // Play fire crackle sounds for nearby fires
    for (const fire of gameState.fires) {
        const dist = Math.sqrt(Math.pow(fire.x - px, 2) + Math.pow(fire.y - py, 2));
        if (dist < 6 && Math.random() < 0.3) { // Random chance to avoid constant noise
            AudioManager.playPositional('fireCrackle', fire.x, fire.y, px, py, 0.3, 8);
        }
    }

    // Play enemy footstep sounds for nearby enemies
    for (const enemy of gameState.enemies) {
        if (enemy.stunned > 0 || enemy.scared > 0) continue;
        const dist = Math.sqrt(Math.pow(enemy.x - px, 2) + Math.pow(enemy.y - py, 2));
        if (dist < 8 && dist > 2 && Math.random() < 0.2) {
            AudioManager.playPositional('enemyStep', enemy.x, enemy.y, px, py, 0.25, 10);
        }
    }

    // Play exit hum when near an exit
    for (const exit of gameState.exits) {
        const dist = Math.sqrt(Math.pow(exit.x - px, 2) + Math.pow(exit.y - py, 2));
        if (dist < 5 && Math.random() < 0.15) {
            AudioManager.playPositional('exitHum', exit.x, exit.y, px, py, 0.2, 6);
        }
    }
}

// Update fire system
function updateFires(deltaTime) {
    const maxFires = getMaxFiresForFloor(gameState.floor);
    if (maxFires === 0) return;  // No fires on this floor

    // Spawn timer - scales with floor difficulty
    // Early floors: slower spawning to allow learning
    // Later floors: faster spawning for intensity
    gameState.fireSpawnTimer += deltaTime;

    let baseInterval, randomRange;
    if (gameState.floor >= 20) {
        baseInterval = 15;  // Floors 20-23: gentle intro
        randomRange = 5;
    } else if (gameState.floor >= 15) {
        baseInterval = 12;  // Floors 15-19
        randomRange = 4;
    } else if (gameState.floor >= 10) {
        baseInterval = 10;  // Floors 10-14
        randomRange = 4;
    } else {
        baseInterval = 6;   // Floors 1-9: fast spawning
        randomRange = 4;
    }

    if (gameState.fireSpawnTimer > baseInterval + Math.random() * randomRange) {
        spawnFire();
        gameState.fireSpawnTimer = 0;
    }

    // Update each fire
    for (const fire of gameState.fires) {
        fire.age += deltaTime;

        // Fire grows over time (max size 3) - faster on lower floors
        const growthMultiplier = gameState.floor >= 15 ? 1.0 : (gameState.floor >= 10 ? 0.8 : 0.6);
        const size2Threshold = 5 * growthMultiplier;   // 5s / 4s / 3s
        const size3Threshold = 12 * growthMultiplier;  // 12s / 9.6s / 7.2s
        if (fire.age > size2Threshold && fire.size < 2) fire.size = 2;
        if (fire.age > size3Threshold && fire.size < 3) fire.size = 3;

        // Check if player is on fire
        if (fire.x === gameState.player.x && fire.y === gameState.player.y) {
            // Player is BURNING!
            if (gameState.player.burning <= 0) {
                gameState.player.burning = 2.0;  // 2 seconds of burn
                playerStats.timesBurned++;
            }
        }

        // Spread to adjacent tiles occasionally (larger fires spread more)
        fire.spreadTimer += deltaTime;
        if (fire.spreadTimer > 15 / fire.size && gameState.fires.length < maxFires) {
            fire.spreadTimer = 0;
            // Try to spread
            const dirs = [{x: 1, y: 0}, {x: -1, y: 0}, {x: 0, y: 1}, {x: 0, y: -1}];
            const dir = dirs[Math.floor(Math.random() * dirs.length)];
            const newX = fire.x + dir.x;
            const newY = fire.y + dir.y;

            if (gameState.maze[newY] && gameState.maze[newY][newX] === TILE.FLOOR) {
                // Check not already on fire
                let alreadyOnFire = false;
                for (const f of gameState.fires) {
                    if (f.x === newX && f.y === newY) {
                        alreadyOnFire = true;
                        break;
                    }
                }
                // Fairness check: don't spread if it would block all exits
                if (!alreadyOnFire && Math.random() < 0.3 && canSpawnFireWithoutBlockingAllPaths(newX, newY)) {
                    gameState.fires.push({
                        x: newX,
                        y: newY,
                        size: 1,
                        age: 0,
                        spreadTimer: 0
                    });
                }
            }
        }
    }
}

// Draw fire spread warning glow on adjacent tiles
function drawFireSpreadWarning(fire) {
    // Only show warning for fires that are about to spread (size 2+ and spreadTimer near threshold)
    if (fire.size < 2) return;

    const spreadThreshold = 15 / fire.size;
    const timeUntilSpread = spreadThreshold - fire.spreadTimer;

    // Show warning when fire is within 3 seconds of spreading
    if (timeUntilSpread > 3) return;

    const warningIntensity = 1 - (timeUntilSpread / 3); // 0 to 1 as spread approaches
    const pulse = Math.sin(gameState.animationTime * 10) * 0.3 + 0.7;

    // Draw warning glow on adjacent tiles
    const dirs = [{x: 1, y: 0}, {x: -1, y: 0}, {x: 0, y: 1}, {x: 0, y: -1}];
    for (const dir of dirs) {
        const nx = fire.x + dir.x;
        const ny = fire.y + dir.y;

        // Only warn on floor tiles that aren't already on fire
        if (gameState.maze[ny] && gameState.maze[ny][nx] === TILE.FLOOR) {
            let alreadyOnFire = false;
            for (const f of gameState.fires) {
                if (f.x === nx && f.y === ny) {
                    alreadyOnFire = true;
                    break;
                }
            }

            if (!alreadyOnFire) {
                const wx = nx * TILE_SIZE;
                const wy = ny * TILE_SIZE;

                // Pulsing orange warning glow
                ctx.fillStyle = `rgba(255, 102, 0, ${warningIntensity * 0.25 * pulse})`;
                ctx.fillRect(wx, wy, TILE_SIZE, TILE_SIZE);

                // Warning border
                ctx.strokeStyle = `rgba(255, 69, 0, ${warningIntensity * 0.5 * pulse})`;
                ctx.lineWidth = 2;
                ctx.strokeRect(wx + 2, wy + 2, TILE_SIZE - 4, TILE_SIZE - 4);
            }
        }
    }
}

// Draw fire hazard
function drawFire(fire) {
    const x = fire.x * TILE_SIZE;
    const y = fire.y * TILE_SIZE;
    const flicker = Math.sin(gameState.animationTime * 15 + fire.x * 3) * 0.2 + 0.8;
    const size = fire.size;

    // Glow effect
    ctx.shadowColor = COLORS.fireGlow;
    ctx.shadowBlur = 15 * size * flicker;

    // Outer flames
    ctx.fillStyle = COLORS.fireOuter;
    const outerSize = 8 + size * 4;
    for (let i = 0; i < 3 + size; i++) {
        const flameX = x + TILE_SIZE/2 + Math.sin(gameState.animationTime * 10 + i) * (4 * size);
        const flameY = y + TILE_SIZE/2 - Math.cos(gameState.animationTime * 8 + i * 2) * (6 * size);
        ctx.beginPath();
        ctx.arc(flameX, flameY, outerSize * flicker, 0, Math.PI * 2);
        ctx.fill();
    }

    // Inner flames
    ctx.fillStyle = COLORS.fireInner;
    const innerSize = 5 + size * 3;
    for (let i = 0; i < 2 + size; i++) {
        const flameX = x + TILE_SIZE/2 + Math.sin(gameState.animationTime * 12 + i) * (3 * size);
        const flameY = y + TILE_SIZE/2 - Math.cos(gameState.animationTime * 10 + i) * (4 * size);
        ctx.beginPath();
        ctx.arc(flameX, flameY, innerSize * flicker, 0, Math.PI * 2);
        ctx.fill();
    }

    // Core
    ctx.fillStyle = COLORS.fireCore;
    ctx.beginPath();
    ctx.arc(x + TILE_SIZE/2, y + TILE_SIZE/2 + 2, (3 + size * 2) * flicker, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;

    // Colorblind mode: Add animated flame icon overlay
    if (settings.colorblindMode && settings.colorblindMode !== 'off') {
        const cx = x + TILE_SIZE / 2;
        const cy = y + TILE_SIZE / 2;
        const waveOffset = Math.sin(gameState.animationTime * 8) * 2;

        // White outline flame shape for visibility
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 3;

        // Draw animated flame icon
        ctx.beginPath();
        ctx.moveTo(cx, cy - 10 + waveOffset);
        ctx.quadraticCurveTo(cx + 6, cy - 4, cx + 4, cy + 2);
        ctx.quadraticCurveTo(cx + 2, cy + 6, cx, cy + 8);
        ctx.quadraticCurveTo(cx - 2, cy + 6, cx - 4, cy + 2);
        ctx.quadraticCurveTo(cx - 6, cy - 4, cx, cy - 10 + waveOffset);
        ctx.stroke();

        // Inner flame detail
        ctx.beginPath();
        ctx.moveTo(cx, cy - 5 + waveOffset);
        ctx.quadraticCurveTo(cx + 3, cy, cx + 2, cy + 3);
        ctx.quadraticCurveTo(cx, cy + 5, cx - 2, cy + 3);
        ctx.quadraticCurveTo(cx - 3, cy, cx, cy - 5 + waveOffset);
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.lineWidth = 1;
    }
}

// Add punch visual effect
function addPunchEffect(x, y) {
    AudioManager.playRandomPunch(); // Random punch variant for variety
    screenShake.trigger(6, 0.15); // Small shake on punch

    gameState.punchEffects.push({
        x: x,
        y: y,
        timer: 0.5,  // Half second burst
        scale: 1,
        particles: []
    });

    // Add burst particles
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        gameState.punchEffects[gameState.punchEffects.length - 1].particles.push({
            x: x * TILE_SIZE + TILE_SIZE / 2,
            y: y * TILE_SIZE + TILE_SIZE / 2,
            vx: Math.cos(angle) * 3,
            vy: Math.sin(angle) * 3,
            size: 8,
            color: i % 2 === 0 ? '#ee5a24' : '#ff7f50'
        });
    }
}

function handlePlayerEnemyCollision(enemy) {
    const inBathroom = isInBathroom(gameState.player.x, gameState.player.y);

    // No collision effects in bathroom
    if (inBathroom) return;

    // Shield protects player from all damage!
    if (gameState.player.shielded > 0) {
        // Push enemy away and stun briefly without hurting player
        enemy.stunned = 1.5;
        pushEnemyAway(enemy, gameState.player.x, gameState.player.y);
        return;
    }

    // If player has electric powerup, FRY the enemy!
    if (gameState.powerup === 'electric') {
        fryEnemy(enemy);
        gameState.enemiesZapped++;
        // Electric powerup persists until timer runs out
        return;
    }

    // If player has knockout powerup, punch enemy away
    if (gameState.powerup === 'knockout') {
        enemy.hitCount++;
        enemy.stunned = getStunDuration(enemy.hitCount);
        // Mark enemy as having just attacked (cooldown)
        enemy.lastAttackTime = Date.now();
        pushEnemyAway(enemy, gameState.player.x, gameState.player.y);
        gameState.enemiesKnockedOut++;
        // Add punch visual effect
        addPunchEffect(enemy.x, enemy.y);
        triggerFreezeFrame('enemyKnockout'); // Impact freeze for satisfying punch
        // Don't consume the powerup on contact - only on SPACE
        return;
    }

    // If player has speed powerup, they get stunned on collision
    if (gameState.powerup === 'speed') {
        gameState.player.hitCount++;
        gameState.player.lastHitTime = Date.now();
        gameState.player.stunned = getStunDuration(gameState.player.hitCount);
        gameState.powerup = null;
        gameState.powerupTimer = 0;
        playerProgress.wasHitThisRun = true; // Track for perfect run
        // Mark enemy as having just attacked (cooldown)
        enemy.lastAttackTime = Date.now();
        // Push enemy away so player isn't stuck
        pushEnemyAway(enemy, gameState.player.x, gameState.player.y);
        return;
    }

    // Normal collision - player gets stunned with progressive duration
    // Only apply if player isn't already stunned (prevent stacking)
    if (gameState.player.stunned <= 0) {
        AudioManager.play('hit'); // Player hit sound
        screenShake.trigger(10, 0.25); // Medium shake when hit
        triggerFreezeFrame('playerHit'); // Impact freeze frame for game feel

        gameState.player.hitCount++;
        gameState.player.lastHitTime = Date.now();
        const stunDuration = getStunDuration(gameState.player.hitCount);
        gameState.player.stunned = stunDuration;
        playerProgress.wasHitThisRun = true; // Track for perfect run
        console.log(`Player hit #${gameState.player.hitCount}, stunned for ${stunDuration} seconds`);
        // Mark enemy as having just attacked (cooldown) - prevents repeated attacks
        enemy.lastAttackTime = Date.now();
        // Push enemy away so player isn't stuck on same tile
        pushEnemyAway(enemy, gameState.player.x, gameState.player.y);
        // Push ALL nearby enemies away to give player breathing room
        for (const otherEnemy of gameState.enemies) {
            if (otherEnemy !== enemy) {
                const dist = Math.abs(otherEnemy.x - gameState.player.x) + Math.abs(otherEnemy.y - gameState.player.y);
                if (dist <= 2) {
                    pushEnemyAway(otherEnemy, gameState.player.x, gameState.player.y);
                    otherEnemy.lastAttackTime = Date.now(); // Give all nearby enemies cooldown too
                }
            }
        }
    }
}

function movePlayer(dx, dy) {
    if (gameState.player.stunned > 0) return false;
    if (Date.now() - lastMove < MOVE_DELAY / (gameState.powerup === 'speed' ? 2 : 1)) return false;

    const newX = gameState.player.x + dx;
    const newY = gameState.player.y + dy;

    if (canMove(newX, newY)) {
        // Play footstep sound (quieter, randomized)
        if (Math.random() < 0.5) AudioManager.play('footstep', 0.3);
        gameState.player.x = newX;
        gameState.player.y = newY;
        gameState.player.direction = dx !== 0 ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0);
        lastMove = Date.now();

        // Track facing direction for sprite animation (1 = right, -1 = left)
        if (dx !== 0) {
            characterAnimationState.player.facingDirection = dx > 0 ? 1 : -1;
        }
        characterAnimationState.player.isMoving = true;
        characterAnimationState.player.lastMoveTime = Date.now();

        // Trigger stretch animation on movement start (Super Meat Boy feel)
        triggerStretch();

        // Check secret exit on floor 13
        if (gameState.floor === 13 && gameState.secretExit) {
            if (gameState.player.x === gameState.secretExit.x && gameState.player.y === gameState.secretExit.y) {
                // Secret path! Jump straight to floor 1
                gameState.floor = 1;
                gameState.won = true;
                playerProgress.secretExitFound = true; // Unlock ghost character
                checkUnlocks();
                showMessage('SECRET ESCAPE!', 'You found the hidden path from floor 13!', true);
                return;
            }
        }

        // Check regular exits
        for (const exit of gameState.exits) {
            if (gameState.player.x === exit.x && gameState.player.y === exit.y) {
                // === NEW: Close Call Celebration ===
                if (gameState.timer <= 5 && gameState.timer > 0) {
                    showCelebration('clutchEscape');
                    triggerFreezeFrame('closeDodge');
                } else if (gameState.timer <= 10 && gameState.timer > 5) {
                    showCelebration('closeCall');
                }
                nextFloor();
                return;
            }
        }

        // === NEW: Coin Collection (Dopamine Breadcrumbs) ===
        for (let i = gameState.coins.length - 1; i >= 0; i--) {
            const coin = gameState.coins[i];
            if (!coin.collected && gameState.player.x === coin.x && gameState.player.y === coin.y) {
                coin.collected = true;
                gameState.coinsCollected += coin.value;

                // Combo system for rapid collection
                if (gameState.coinComboTimer > 0) {
                    gameState.coinCombo++;
                    if (gameState.coinCombo >= 3) {
                        showCelebration('coinStreak', { n: gameState.coinCombo });
                    }
                    if (gameState.coinCombo >= 10) {
                        showCelebration('coinMaster');
                    }
                } else {
                    gameState.coinCombo = 1;
                }
                gameState.coinComboTimer = 2.0; // 2 seconds to keep combo

                // Play coin collect sound (quick chime)
                AudioManager.play('powerup', 0.5);

                // Visual feedback - small particle burst
                for (let j = 0; j < 4; j++) {
                    gameState.particles.push({
                        x: coin.x * TILE_SIZE + TILE_SIZE / 2,
                        y: coin.y * TILE_SIZE + TILE_SIZE / 2,
                        vx: (Math.random() - 0.5) * 3,
                        vy: (Math.random() - 0.5) * 3 - 2,
                        size: 3,
                        color: '#f1c40f',
                        life: 0.5
                    });
                }
            }
        }

        // Check power-up collision (with suction effect)
        for (let i = gameState.powerups.length - 1; i >= 0; i--) {
            const pu = gameState.powerups[i];
            const dist = Math.abs(pu.x - gameState.player.x) + Math.abs(pu.y - gameState.player.y);

            // Start suction animation when player is 2 tiles away
            if (dist <= 2 && dist > 0 && !pu.collecting) {
                pu.collecting = true;
                pu.collectTimer = 0;
                pu.startX = pu.x * TILE_SIZE + TILE_SIZE / 2;
                pu.startY = pu.y * TILE_SIZE + TILE_SIZE / 2;
                gameState.collectingPowerups.push({...pu, index: i});
            }

            // Immediate collection when on same tile
            if (gameState.player.x === pu.x && gameState.player.y === pu.y) {
                // Play type-specific collection sound
                switch (pu.type) {
                    case 'speed':
                        AudioManager.play('speedCollect');
                        break;
                    case 'electric':
                        AudioManager.play('electricCollect');
                        break;
                    case 'knockout':
                        AudioManager.play('knockoutCollect');
                        break;
                    case 'ghost':
                        AudioManager.play('ghostCollect');
                        break;
                    default:
                        AudioManager.play('powerup'); // Fallback
                }
                // Quick freeze frame on powerup collection
                triggerFreezeFrame('powerupCollect');

                // Handle special outdoor powerups
                if (pu.type === 'shield') {
                    // Shield from garden - 8 seconds of damage immunity
                    gameState.player.shielded = 8;
                    playerStats.powerupsCollected++;
                    saveStats();
                } else if (pu.type === 'companion') {
                    // Dog companion from dog park - follows player and scares enemies
                    gameState.player.companion = {
                        x: gameState.player.x,
                        y: gameState.player.y,
                        timer: 15,  // Lasts 15 seconds
                        frame: 0
                    };
                    playerStats.powerupsCollected++;
                    saveStats();
                } else {
                    // Regular powerups
                    gameState.powerup = pu.type;
                    gameState.powerupTimer = 10;
                }
                // Remove from collecting array if present
                gameState.collectingPowerups = gameState.collectingPowerups.filter(cp => cp.index !== i);
                gameState.powerups.splice(i, 1);
            }
        }

        // Check enemy collision - if walking into enemy
        // Only check if player is not already stunned (shouldn't happen, but safety check)
        if (gameState.player.stunned <= 0) {
            for (const enemy of gameState.enemies) {
                if (enemy.stunned <= 0 &&
                    gameState.player.x === enemy.x &&
                    gameState.player.y === enemy.y) {
                    handlePlayerEnemyCollision(enemy);
                    break; // Only handle one collision at a time
                }
            }
        }
        return true; // Movement successful
    }
    return false; // Movement blocked
}

function usePowerup() {
    if (gameState.powerup === 'knockout') {
        // Punch nearby enemies
        for (const enemy of gameState.enemies) {
            const dist = Math.abs(enemy.x - gameState.player.x) + Math.abs(enemy.y - gameState.player.y);
            if (dist <= 3) {
                enemy.hitCount++;
                enemy.stunned = getStunDuration(enemy.hitCount);

                // Push enemy away
                const dx = enemy.x - gameState.player.x;
                const dy = enemy.y - gameState.player.y;
                const pushX = enemy.x + (dx !== 0 ? Math.sign(dx) : 0);
                const pushY = enemy.y + (dy !== 0 ? Math.sign(dy) : 0);

                if (canMove(pushX, pushY)) {
                    enemy.x = pushX;
                    enemy.y = pushY;
                }
            }
        }
        gameState.powerup = null;
        gameState.powerupTimer = 0;
    }
}

function moveEnemies() {
    // IMPORTANT: Only ONE enemy can attack per frame to prevent stun stacking
    let playerAlreadyHitThisFrame = false;

    // === NEW: Calculate rubber-banding factor ===
    // If player is closer to exits than enemies, enemies speed up (and vice versa)
    // This creates more dramatic close finishes
    let playerMinDistToExit = Infinity;
    for (const exit of gameState.exits) {
        const dist = Math.abs(gameState.player.x - exit.x) + Math.abs(gameState.player.y - exit.y);
        if (dist < playerMinDistToExit) playerMinDistToExit = dist;
    }

    for (const enemy of gameState.enemies) {
        if (enemy.stunned > 0) continue;

        // Update scared timer
        if (enemy.scared > 0) {
            enemy.scared -= 0.02;  // Decay over time
        }

        // Don't move enemies if player is in bathroom
        const playerInBathroom = isInBathroom(gameState.player.x, gameState.player.y);
        const playerInCafeteria = isInCafeteria(gameState.player.x, gameState.player.y);
        const enemyInCafeteria = isInCafeteria(enemy.x, enemy.y);

        enemy.moveTimer++;

        // DIFFICULTY INCREASE: Faster enemy movement
        // OLD: Easy=45, Medium=30, Hard=20 | NEW: Easy=35, Medium=22, Hard=15
        let baseMoveThreshold = enemy.difficulty === 'easy' ? 35 : (enemy.difficulty === 'hard' ? 15 : 22);

        // === NEW: Rubber-banding adjustment ===
        // If player is close to exit, enemies get faster
        // If player is far from exit, enemies slow down slightly
        let rubberBandModifier = 1.0;
        if (playerMinDistToExit < 5) {
            // Player is close to exit - enemies speed up (lower threshold = faster)
            rubberBandModifier = 0.7 + (playerMinDistToExit / 5) * 0.3; // 0.7 to 1.0
        } else if (playerMinDistToExit > 12) {
            // Player is far from exit - enemies slow down (higher threshold = slower)
            rubberBandModifier = 1.0 + (Math.min(playerMinDistToExit - 12, 8) / 8) * 0.3; // 1.0 to 1.3
        }
        baseMoveThreshold = Math.floor(baseMoveThreshold * rubberBandModifier);

        // Enemies move slower in cafeteria (they're distracted by food)
        const moveThreshold = enemyInCafeteria ? baseMoveThreshold + 15 : baseMoveThreshold;
        if (enemy.moveTimer < moveThreshold) continue;
        enemy.moveTimer = 0;

        // Check attack cooldown - enemy can't attack again for 1.5 seconds after last attack (was 2s)
        const attackCooldown = enemy.lastAttackTime ? (Date.now() - enemy.lastAttackTime) : 99999;
        const canAttack = attackCooldown > 1500;

        let dx = 0, dy = 0;

        // Initialize patrol direction if not set (for smarter wandering)
        if (enemy.patrolDir === undefined) {
            enemy.patrolDir = Math.floor(Math.random() * 4);
        }

        // If scared by dog companion, RUN AWAY from the companion!
        if (enemy.scared > 0 && gameState.player.companion) {
            const comp = gameState.player.companion;
            // Run in opposite direction from companion
            if (comp.x < enemy.x) dx = 1;
            else if (comp.x > enemy.x) dx = -1;
            if (Math.random() > 0.5) {
                dx = 0;
                if (comp.y < enemy.y) dy = 1;
                else if (comp.y > enemy.y) dy = -1;
            }
        }
        // DIFFICULTY INCREASE: Higher chase probability
        // OLD: Easy=20%, Medium=50%, Hard=80% | NEW: Easy=40%, Medium=70%, Hard=95%
        else {
            const chaseChance = enemy.difficulty === 'easy' ? 0.4 : (enemy.difficulty === 'hard' ? 0.95 : 0.7);

            // If on cooldown or player is stunned, use patrol behavior instead of pure random
            if (!canAttack || gameState.player.stunned > 0) {
                // Patrol in current direction, change on collision
                const patrolMoves = [[0, -1], [0, 1], [-1, 0], [1, 0]]; // up, down, left, right
                dx = patrolMoves[enemy.patrolDir][0];
                dy = patrolMoves[enemy.patrolDir][1];
            } else if (Math.random() < chaseChance && !playerInBathroom) {
                // SMARTER CHASE: Weight axis selection by distance (less predictable)
                const distX = Math.abs(gameState.player.x - enemy.x);
                const distY = Math.abs(gameState.player.y - enemy.y);
                const totalDist = distX + distY + 0.1; // avoid divide by zero

                // Choose axis based on distance ratio (farther axis = higher chance to move on it)
                if (Math.random() < (distX / totalDist)) {
                    // Move on X axis
                    if (gameState.player.x < enemy.x) dx = -1;
                    else if (gameState.player.x > enemy.x) dx = 1;
                } else {
                    // Move on Y axis
                    if (gameState.player.y < enemy.y) dy = -1;
                    else if (gameState.player.y > enemy.y) dy = 1;
                }
            } else {
                // Patrol behavior instead of pure random (more intimidating movement pattern)
                const patrolMoves = [[0, -1], [0, 1], [-1, 0], [1, 0]];
                dx = patrolMoves[enemy.patrolDir][0];
                dy = patrolMoves[enemy.patrolDir][1];
            }
        }

        const newX = enemy.x + dx;
        const newY = enemy.y + dy;

        // Don't move onto player's tile - instead trigger collision from adjacent
        const wouldLandOnPlayer = (newX === gameState.player.x && newY === gameState.player.y);

        // Enemies can't enter bathroom or land directly on player
        if (canMove(newX, newY) && !isInBathroom(newX, newY) && !wouldLandOnPlayer) {
            enemy.x = newX;
            enemy.y = newY;
        } else {
            // PATROL BEHAVIOR: Change patrol direction on collision (cycle: up→right→down→left)
            enemy.patrolDir = (enemy.patrolDir + 1) % 4;
        }

        // Check if now adjacent to player - but ONLY attack if:
        // 1. Player is NOT stunned
        // 2. Player is NOT in bathroom
        // 3. Enemy is NOT on attack cooldown
        // 4. No other enemy has attacked this frame
        const distToPlayer = Math.abs(enemy.x - gameState.player.x) + Math.abs(enemy.y - gameState.player.y);
        if (distToPlayer === 1 && gameState.player.stunned <= 0 && !playerInBathroom && canAttack && !playerAlreadyHitThisFrame) {
            // Enemy attacks from adjacent tile
            handlePlayerEnemyCollision(enemy);
            playerAlreadyHitThisFrame = true;  // Prevent other enemies from attacking this frame
        }
    }
}

function nextFloor() {
    AudioManager.play('exit'); // Exit door sound

    // Check for celebration triggers before advancing
    checkCelebrationTriggers('floorComplete');

    gameState.floor--;

    // Check for checkpoint (Playtest Feature #2)
    if (CHECKPOINT_FLOORS.includes(gameState.floor)) {
        gameState.lastCheckpoint = gameState.floor;
        checkCelebrationTriggers('checkpoint');
    }

    // Reset floor hits for flawless tracking
    gameState.floorHits = 0;

    if (gameState.floor < 1) {
        gameState.won = true;
        saveGhostReplay(); // Save ghost replay on victory
        AudioManager.play('victory'); // Victory fanfare
        showVictoryScreen();
        return;
    }
    showLevelTransition(gameState.floor);
}

// Level transition particle system
const transitionParticles = {
    particles: [],
    active: false,

    start() {
        this.particles = [];
        this.active = true;
        // Create 40 falling debris particles
        for (let i = 0; i < 40; i++) {
            this.particles.push({
                x: Math.random() * canvas.width,
                y: -20 - Math.random() * 150,
                vy: 2 + Math.random() * 3,
                vx: (Math.random() - 0.5) * 1.5,
                size: 2 + Math.random() * 6,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.2,
                color: ['#1a1a1a', '#2c2c2c', '#454545', '#8b4513', '#666'][Math.floor(Math.random() * 5)],
                alpha: 0.7 + Math.random() * 0.3
            });
        }
    },

    update(deltaTime) {
        if (!this.active) return;
        for (const p of this.particles) {
            p.y += p.vy;
            p.x += p.vx;
            p.rotation += p.rotationSpeed;
            // Accelerate slightly (gravity)
            p.vy += 0.05;
        }
        // Remove particles that have fallen off screen
        this.particles = this.particles.filter(p => p.y < canvas.height + 50);
        if (this.particles.length === 0) {
            this.active = false;
        }
    },

    draw() {
        if (!this.active) return;
        for (const p of this.particles) {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            ctx.restore();
        }
    },

    stop() {
        this.active = false;
        this.particles = [];
    }
};

function showLevelTransition(floor) {
    const transition = document.getElementById('levelTransition');
    const floorNum = document.getElementById('nextFloorNum');
    floorNum.textContent = floor;

    // Set random atmospheric background
    const bg = getRandomBackground('levelTransition');
    transition.style.backgroundImage = `url('${bg}')`;

    transition.style.display = 'flex';

    // Start falling debris particle effect
    transitionParticles.start();

    // Auto-continue after 2 seconds
    setTimeout(() => {
        transition.style.display = 'none';
        transitionParticles.stop();
        initLevel();
    }, 2000);
}

function showVictoryScreen() {
    // Calculate run time (in milliseconds for daily challenge, seconds for display)
    const runTimeMs = Date.now() - gameState.runStartTime;
    gameState.runTotalTime = runTimeMs / 1000;
    const minutes = Math.floor(gameState.runTotalTime / 60);
    const seconds = Math.floor(gameState.runTotalTime % 60);
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    // Handle daily challenge completion
    if (dailyChallenge.active) {
        submitDailyChallengeScore(runTimeMs);
        dailyChallenge.active = false;
    }

    // Check for new best time
    let newRecord = false;
    if (!playerStats.fastestWin || gameState.runTotalTime < playerStats.fastestWin) {
        playerStats.fastestWin = gameState.runTotalTime;
        newRecord = true;
    }

    // Update stats
    playerStats.totalWins++;
    playerStats.enemiesPunched += gameState.enemiesKnockedOut || 0;
    playerStats.enemiesZapped += gameState.enemiesZapped || 0;
    playerStats.totalFloorsCleared += 23;
    saveStats();

    // Update progress
    updateProgressAfterRun(true);

    const victory = document.getElementById('victory');
    const stats = document.getElementById('victoryStats');

    // Set random victory background
    const bg = getRandomBackground('victory');
    victory.style.backgroundImage = `url('${bg}')`;

    const bestTimeStr = playerStats.fastestWin ?
        `${Math.floor(playerStats.fastestWin / 60)}:${Math.floor(playerStats.fastestWin % 60).toString().padStart(2, '0')}` : '--:--';

    // Add daily challenge info if applicable
    let dailyInfo = '';
    if (dailyChallenge.completed && dailyChallenge.bestTime) {
        dailyInfo = `<br><span style="color: #f39c12;">DAILY CHALLENGE: ${formatTime(dailyChallenge.bestTime)}</span>`;
    }

    // === UPDATED: Show coins and escape points ===
    const floorsDescended = gameState.quickRunMode ? 7 : 23;
    const modeLabel = gameState.quickRunMode ? ' (Quick Run)' : '';

    stats.innerHTML = `
        <span style="font-size: 24px; color: #ffe66d;">⏱️ ${timeString}</span>${newRecord ? ' <span style="color: #4ecdc4;">NEW RECORD!</span>' : ''}${dailyInfo}<br><br>
        Floors descended: ${floorsDescended}${modeLabel}<br>
        Coins collected: 🪙 ${gameState.coinsCollected || 0}<br>
        Coworkers punched: ${gameState.enemiesKnockedOut || 0}<br>
        Coworkers zapped: ${gameState.enemiesZapped || 0}<br>
        Best time: ${bestTimeStr}<br>
        Total wins: ${playerStats.totalWins}<br>
        <span style="color: #f39c12;">Escape Points: +${calculateEscapePoints(true)} (Total: ${playerStats.escapePoints || 0})</span><br>
        Status: Unemployed but alive
    `;
    victory.style.display = 'flex';
}

// === NEW: Calculate escape points for display ===
function calculateEscapePoints(won) {
    const floorsDescended = (gameState.quickRunMode ? 7 : 23) - gameState.floor;
    let points = floorsDescended * 10;
    points += Math.floor((gameState.coinsCollected || 0) / 10);
    points += (gameState.enemiesKnockedOut || 0) * 5;
    points += (gameState.enemiesZapped || 0) * 3;
    if (won) {
        points += 100;
        if (!playerProgress.wasHitThisRun) points += 50;
        if (gameState.quickRunMode) points += 25;
    }
    return points;
}

function showGameOverScreen(message) {
    // Save ghost replay if this was a good run
    saveGhostReplay();

    // Update progress
    updateProgressAfterRun(false);

    const gameOver = document.getElementById('gameOver');
    const msg = document.getElementById('gameOverMessage');
    const stats = document.getElementById('gameOverStats');

    // Set random game over background
    const bg = getRandomBackground('gameOver');
    gameOver.style.backgroundImage = `url('${bg}')`;

    // Encouraging messages (Playtest Feature #9)
    const floorNum = gameState.floor;
    const encouragingMessages = [
        'GREAT RUN!',
        'NICE TRY!',
        'SO CLOSE!',
        'GOOD EFFORT!'
    ];
    const encouragement = encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)];

    msg.textContent = message;

    // Build stats with continue option if available (Playtest Feature #2)
    let statsHtml = `<span style="color: #4ecdc4; font-size: 18px;">${encouragement}</span><br>`;
    statsHtml += `You made it to floor ${floorNum}`;

    // === NEW: Show coins and escape points earned (even on failure) ===
    const startFloor = gameState.quickRunMode ? 7 : 23;
    const percentile = Math.min(95, Math.floor((startFloor - floorNum) / startFloor * 100) + 10);
    statsHtml += `<br><span style="color: #aaa; font-size: 12px;">That's better than ~${percentile}% of attempts!</span>`;
    statsHtml += `<br><span style="color: #f1c40f;">🪙 Coins: ${gameState.coinsCollected || 0}</span>`;
    statsHtml += `<br><span style="color: #f39c12;">Escape Points: +${calculateEscapePoints(false)} (Total: ${playerStats.escapePoints || 0})</span>`;

    // Show continue option if checkpoint available
    if (gameState.continuesRemaining > 0 && gameState.lastCheckpoint && !gameState.zenMode) {
        statsHtml += `<br><br><button onclick="continueFromCheckpoint()" class="continue-btn" style="background: #27ae60; border: none; padding: 10px 20px; color: white; font-family: monospace; font-size: 14px; cursor: pointer; border-radius: 5px;">CONTINUE from Floor ${gameState.lastCheckpoint} (${gameState.continuesRemaining} left)</button>`;
    }

    stats.innerHTML = statsHtml;
    gameOver.style.display = 'flex';
}

// Continue from checkpoint (Playtest Feature #2)
function continueFromCheckpoint() {
    if (gameState.continuesRemaining <= 0 || !gameState.lastCheckpoint) return;

    gameState.continuesRemaining--;
    gameState.floor = gameState.lastCheckpoint;
    gameState.gameOver = false;
    gameState.imploding = false;
    gameState.implosionFrame = 0;
    gameState.particles = [];
    gameState.lastChance = false;
    gameState.floorHits = 0;

    document.getElementById('gameOver').style.display = 'none';
    initLevel();
}

function restartGame() {
    // Reset daily challenge state
    dailyChallenge.active = false;

    document.getElementById('gameOver').style.display = 'none';
    document.getElementById('victory').style.display = 'none';
    document.getElementById('message').style.display = 'block';

    // Cycle to new random background
    setTitleBackground();
}

// ============================================
// INSTANT RESTART SYSTEM (Super Meat Boy style)
// ============================================
let restartFlash = { active: false, alpha: 0 };

function instantRestart() {
    // Skip if instant restart disabled
    if (!settings.instantRestartEnabled) return;

    // Brief white flash effect
    triggerRestartFlash();

    // Hide all modals
    document.getElementById('gameOver').style.display = 'none';
    document.getElementById('victory').style.display = 'none';
    document.getElementById('pauseScreen').style.display = 'none';
    document.getElementById('message').style.display = 'none';

    // Reset daily challenge state
    dailyChallenge.active = false;

    // Reset game state for fresh run
    gameState.floor = 23;
    gameState.gameOver = false;
    gameState.won = false;
    gameState.started = true;
    gameState.paused = false;
    gameState.imploding = false;
    gameState.implosionFrame = 0;
    gameState.particles = [];
    gameState.lastChance = false;
    gameState.player.hitCount = 0;
    gameState.player.lastHitTime = 0;
    gameState.player.burning = 0;
    gameState.enemiesKnockedOut = 0;
    gameState.enemiesZapped = 0;
    gameState.fires = [];
    gameState.runStartTime = Date.now();
    gameState.runTotalTime = 0;
    gameState.floorTimes = [];
    playerProgress.wasHitThisRun = false;

    // Reset ghost recording
    gameState.ghostRecording = [];
    gameState.lastGhostRecord = 0;

    // Load previous ghost for playback
    const ghostData = loadGhostReplay();
    gameState.ghostPlayback = ghostData ? ghostData.positions : [];
    gameState.ghostPlaybackIndex = 0;

    // Update colors and init level
    updatePlayerColors();
    initLevel();

    console.log('Instant restart triggered');
}

function triggerRestartFlash() {
    restartFlash.active = true;
    restartFlash.alpha = 0.8;
}

function updateRestartFlash(deltaTime) {
    if (restartFlash.active) {
        restartFlash.alpha -= deltaTime * 4; // Fade over 0.2s
        if (restartFlash.alpha <= 0) {
            restartFlash.active = false;
            restartFlash.alpha = 0;
        }
    }
}

function drawRestartFlash() {
    if (restartFlash.active) {
        ctx.fillStyle = `rgba(255, 255, 255, ${restartFlash.alpha})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

// ============================================
// FREEZE FRAME SYSTEM (Hit Stop)
// ============================================
const FREEZE_DURATIONS = {
    playerHit: 0.05,        // 3 frames at 60fps
    enemyKnockout: 0.067,   // 4 frames
    powerupCollect: 0.033,  // 2 frames
    electricZap: 0.083,     // 5 frames (chain zap is dramatic)
    closeDodge: 0.033       // 2 frames
};

function triggerFreezeFrame(type, customDuration = null) {
    if (!settings.freezeFramesEnabled) return;
    if (gameState.imploding || gameState.gameOver) return; // Don't freeze during game over

    const intensity = settings.freezeFrameIntensity || 1.0;
    const baseDuration = customDuration || FREEZE_DURATIONS[type] || 0.05;
    const duration = baseDuration * intensity;

    // Don't override longer freezes with shorter ones
    if (gameState.freezeFrame && gameState.freezeFrame.active && gameState.freezeFrame.duration > duration) {
        return;
    }

    gameState.freezeFrame = {
        active: true,
        duration: duration,
        maxDuration: duration,
        type: type
    };
}

function updateFreezeFrame(deltaTime) {
    if (!gameState.freezeFrame || !gameState.freezeFrame.active) return false;

    gameState.freezeFrame.duration -= deltaTime;

    if (gameState.freezeFrame.duration <= 0) {
        gameState.freezeFrame.active = false;
        gameState.freezeFrame.duration = 0;
        gameState.freezeFrame.type = null;
        return false;
    }

    return true; // Still frozen
}

function drawFreezeEffect() {
    if (!gameState.freezeFrame || !gameState.freezeFrame.active) return;

    const progress = gameState.freezeFrame.duration / gameState.freezeFrame.maxDuration;

    // Subtle white flash at start of freeze
    if (progress > 0.5) {
        ctx.fillStyle = `rgba(255, 255, 255, ${(progress - 0.5) * 0.2})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

// ============================================
// INPUT BUFFERING SYSTEM
// ============================================
function initInputBuffer() {
    gameState.inputBuffer = {
        direction: null,      // { dx: 0, dy: 0 }
        timestamp: 0,         // When input was buffered
        action: false,        // Buffered action button
        actionTimestamp: 0
    };
}

function bufferMovementInput(dx, dy) {
    if (!settings.inputBufferingEnabled) return;
    if (!gameState.inputBuffer) initInputBuffer();

    const timeSinceMove = Date.now() - lastMove;
    const moveDelay = MOVE_DELAY / (gameState.powerup === 'speed' ? 2 : 1);
    const bufferWindow = settings.inputBufferWindow || 80;

    // Only buffer if we're within the buffer window before next move allowed
    if (timeSinceMove >= moveDelay - bufferWindow && timeSinceMove < moveDelay) {
        gameState.inputBuffer.direction = { dx, dy };
        gameState.inputBuffer.timestamp = Date.now();
    }
}

function bufferActionInput() {
    if (!settings.inputBufferingEnabled) return;
    if (!gameState.inputBuffer) initInputBuffer();

    // Buffer action if we have a powerup but can't use it yet (stunned)
    if (gameState.powerup && gameState.player.stunned > 0) {
        gameState.inputBuffer.action = true;
        gameState.inputBuffer.actionTimestamp = Date.now();
    }
}

function processInputBuffer() {
    if (!settings.inputBufferingEnabled) return;
    if (!gameState.inputBuffer) return;

    const now = Date.now();
    const bufferExpiry = 150; // Buffered inputs expire after 150ms

    // Process buffered movement
    if (gameState.inputBuffer.direction) {
        if (now - gameState.inputBuffer.timestamp < bufferExpiry) {
            const { dx, dy } = gameState.inputBuffer.direction;
            const timeSinceMove = now - lastMove;
            const moveDelay = MOVE_DELAY / (gameState.powerup === 'speed' ? 2 : 1);

            if (timeSinceMove >= moveDelay) {
                movePlayer(dx, dy);
                gameState.inputBuffer.direction = null;
            }
        } else {
            // Buffer expired
            gameState.inputBuffer.direction = null;
        }
    }

    // Process buffered action
    if (gameState.inputBuffer.action) {
        if (now - gameState.inputBuffer.actionTimestamp < bufferExpiry) {
            if (gameState.player.stunned <= 0 && gameState.powerup) {
                usePowerup();
                gameState.inputBuffer.action = false;
            }
        } else {
            gameState.inputBuffer.action = false;
        }
    }
}

// ============================================
// SQUASH & STRETCH ANIMATION SYSTEM
// ============================================
function initSquashStretch() {
    if (!characterAnimationState.player.squashStretch) {
        characterAnimationState.player.squashStretch = {
            scaleX: 1.0,
            scaleY: 1.0,
            targetX: 1.0,
            targetY: 1.0,
            lastMovingState: false
        };
    }
}

function triggerSquash(intensity = 1.0) {
    if (!settings.squashStretchEnabled) return;
    initSquashStretch();
    const mult = settings.squashStretchIntensity || 1.0;
    const state = characterAnimationState.player.squashStretch;
    state.targetX = 1.0 + (0.2 * intensity * mult);  // Wider
    state.targetY = 1.0 - (0.15 * intensity * mult); // Shorter
}

function triggerStretch(intensity = 1.0) {
    if (!settings.squashStretchEnabled) return;
    initSquashStretch();
    const mult = settings.squashStretchIntensity || 1.0;
    const state = characterAnimationState.player.squashStretch;
    state.targetX = 1.0 - (0.12 * intensity * mult); // Narrower
    state.targetY = 1.0 + (0.18 * intensity * mult); // Taller
}

function updateSquashStretch(deltaTime) {
    if (!settings.squashStretchEnabled) return;
    initSquashStretch();

    const state = characterAnimationState.player.squashStretch;
    const lerpSpeed = 12; // Return to normal speed

    // Smoothly interpolate toward target
    state.scaleX += (state.targetX - state.scaleX) * lerpSpeed * deltaTime;
    state.scaleY += (state.targetY - state.scaleY) * lerpSpeed * deltaTime;

    // Decay targets back to 1.0
    state.targetX += (1.0 - state.targetX) * 8 * deltaTime;
    state.targetY += (1.0 - state.targetY) * 8 * deltaTime;

    // Clamp to reasonable bounds
    state.scaleX = Math.max(0.7, Math.min(1.3, state.scaleX));
    state.scaleY = Math.max(0.7, Math.min(1.3, state.scaleY));

    // Detect movement state changes
    const isMoving = characterAnimationState.player.isMoving;
    if (isMoving && !state.lastMovingState) {
        // Just started moving - stretch
        triggerStretch(0.8);
    } else if (!isMoving && state.lastMovingState) {
        // Just stopped moving - squash (landing)
        triggerSquash(1.0);
    }
    state.lastMovingState = isMoving;
}

// ============================================
// GHOST REPLAY SYSTEM
// ============================================
function initGhostSystem() {
    if (!gameState.ghostRecording) {
        gameState.ghostRecording = [];
        gameState.ghostPlayback = [];
        gameState.ghostPlaybackIndex = 0;
        gameState.lastGhostRecord = 0;
        gameState.ghostRecordInterval = 100; // Record every 100ms
    }
}

function recordGhostPosition() {
    if (!settings.ghostEnabled) return;
    initGhostSystem();

    const now = Date.now();
    if (now - gameState.lastGhostRecord < gameState.ghostRecordInterval) return;

    gameState.ghostRecording.push({
        x: gameState.player.x,
        y: gameState.player.y,
        floor: gameState.floor,
        time: now - gameState.runStartTime,
        facingDirection: characterAnimationState.player.facingDirection || 1
    });
    gameState.lastGhostRecord = now;
}

function saveGhostReplay() {
    if (!gameState.ghostRecording || gameState.ghostRecording.length === 0) return;

    // Only save if this run got further or was faster
    const existingGhost = loadGhostReplay();
    const currentProgress = {
        lowestFloor: gameState.floor,
        totalTime: Date.now() - gameState.runStartTime,
        positions: gameState.ghostRecording
    };

    let shouldSave = !existingGhost;
    if (existingGhost) {
        // Save if got further (lower floor number is better)
        if (currentProgress.lowestFloor < existingGhost.lowestFloor) {
            shouldSave = true;
        } else if (currentProgress.lowestFloor === existingGhost.lowestFloor) {
            // Same floor - save if faster
            shouldSave = currentProgress.totalTime < existingGhost.totalTime;
        }
    }

    if (shouldSave) {
        try {
            localStorage.setItem('deadline_ghost_replay', JSON.stringify(currentProgress));
            console.log('Ghost replay saved - Floor:', currentProgress.lowestFloor);
        } catch (e) {
            console.log('Failed to save ghost replay:', e);
        }
    }
}

function loadGhostReplay() {
    try {
        const saved = localStorage.getItem('deadline_ghost_replay');
        return saved ? JSON.parse(saved) : null;
    } catch (e) {
        return null;
    }
}

function updateGhostPlayback() {
    if (!settings.ghostEnabled) return;
    if (!gameState.ghostPlayback || !gameState.ghostPlayback.length) return;

    const runTime = Date.now() - gameState.runStartTime;

    // Find the ghost position for current time
    while (gameState.ghostPlaybackIndex < gameState.ghostPlayback.length - 1) {
        const nextPos = gameState.ghostPlayback[gameState.ghostPlaybackIndex + 1];
        if (nextPos && nextPos.time <= runTime) {
            gameState.ghostPlaybackIndex++;
        } else {
            break;
        }
    }
}

function drawGhost() {
    if (!settings.ghostEnabled) return;
    if (!gameState.ghostPlayback || !gameState.ghostPlayback.length) return;
    if (gameState.ghostPlaybackIndex >= gameState.ghostPlayback.length) return;

    const ghostPos = gameState.ghostPlayback[gameState.ghostPlaybackIndex];
    if (!ghostPos) return;

    // Only draw ghost on same floor
    if (ghostPos.floor !== gameState.floor) return;

    const x = ghostPos.x * TILE_SIZE;
    const y = ghostPos.y * TILE_SIZE;

    ctx.save();
    ctx.globalAlpha = settings.ghostOpacity || 0.4;

    // Draw semi-transparent ghost silhouette
    const charAsset = CHARACTER_ASSETS[selectedCharacter];
    if (charAsset && charAsset.animation && charAsset.animation.loaded && charAsset.animation.image) {
        // Draw sprite with blue/cyan tint
        const anim = charAsset.animation;
        const state = characterAnimationState.player;
        const srcX = (state.frame || 0) * anim.frameWidth;
        const srcY = 0;

        const spriteScale = 2.5;
        const destSize = Math.floor(TILE_SIZE * spriteScale);
        const offsetX = Math.floor((TILE_SIZE - destSize) / 2);
        const offsetY = Math.floor((TILE_SIZE - destSize) / 2) - 12;

        const facingRight = ghostPos.facingDirection >= 0;

        ctx.save();
        if (!facingRight) {
            ctx.translate(x + TILE_SIZE, y);
            ctx.scale(-1, 1);
            ctx.drawImage(anim.image, srcX, srcY, anim.frameWidth, anim.frameHeight,
                          offsetX, offsetY, destSize, destSize);
        } else {
            ctx.drawImage(anim.image, srcX, srcY, anim.frameWidth, anim.frameHeight,
                          x + offsetX, y + offsetY, destSize, destSize);
        }
        ctx.restore();

        // Apply blue tint overlay
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = 'rgba(100, 180, 255, 0.5)';
        ctx.fillRect(x + offsetX, y + offsetY, destSize, destSize);
        ctx.globalCompositeOperation = 'source-over';
    } else {
        // Fallback: simple rectangle ghost
        ctx.fillStyle = 'rgba(100, 180, 255, 0.5)';
        ctx.fillRect(x + 6, y + 4, 20, 26);
    }

    // "GHOST" label above
    ctx.fillStyle = 'rgba(100, 180, 255, 0.7)';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GHOST', x + TILE_SIZE / 2, y - 2);

    ctx.restore();
}

function startImplosion() {
    AudioManager.play('collapse'); // Floor collapse sound
    screenShake.trigger(20, 1.5); // Intense, long shake during collapse

    gameState.imploding = true;
    gameState.implosionFrame = 0;

    for (let i = 0; i < 150; i++) {
        gameState.particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            size: Math.random() * 10 + 3,
            color: [COLORS.wallMid, COLORS.deskWood, COLORS.floorMid, COLORS.enemyShirt, COLORS.exitFrame][Math.floor(Math.random() * 5)]
        });
    }
}

function updateImplosion() {
    gameState.implosionFrame++;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    for (const particle of gameState.particles) {
        const dx = centerX - particle.x;
        const dy = centerY - particle.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        particle.vx += dx / dist * 3;
        particle.vy += dy / dist * 3;
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.size *= 0.98;
    }

    if (gameState.implosionFrame >= 60) {
        gameState.gameOver = true;
        showGameOverScreen('The floor collapsed beneath you!');
    }
}

function showMessage(title, text, isWin) {
    const msg = document.getElementById('message');
    msg.querySelector('h1').textContent = title;
    msg.querySelector('h1').style.color = isWin ? '#4ecdc4' : '#e94560';
    msg.querySelectorAll('p')[0].textContent = text;
    msg.querySelectorAll('p')[1].textContent = isWin ? 'You made it out alive!' : 'Try again?';
    msg.querySelectorAll('p')[2].style.display = 'none';
    msg.querySelector('button').textContent = isWin ? 'PLAY AGAIN' : 'TRY AGAIN';
    msg.style.display = 'block';
}

function update(deltaTime) {
    gameState.animationTime += deltaTime;

    // Update character animation state - reset isMoving if player hasn't moved recently
    if (characterAnimationState.player.lastMoveTime &&
        Date.now() - characterAnimationState.player.lastMoveTime > 150) {
        // Trigger squash when player just stopped moving (Super Meat Boy feel)
        if (characterAnimationState.player.isMoving) {
            triggerSquash();
        }
        characterAnimationState.player.isMoving = false;
    }

    // Update sprite animation frame when moving
    if (characterAnimationState.player.isMoving) {
        const charAsset = CHARACTER_ASSETS[selectedCharacter];
        if (charAsset && charAsset.animation.loaded) {
            const now = performance.now() / 1000;
            if (now - characterAnimationState.player.lastUpdate > charAsset.animation.frameDuration) {
                characterAnimationState.player.frame =
                    (characterAnimationState.player.frame + 1) % charAsset.animation.frameCount;
                characterAnimationState.player.lastUpdate = now;
            }
        }
    } else {
        // Reset to frame 0 when idle
        characterAnimationState.player.frame = 0;
    }

    // Update screen shake
    screenShake.update(deltaTime);

    if (!gameState.started || gameState.gameOver || gameState.won) return;

    if (gameState.imploding) {
        updateImplosion();
        return;
    }

    // Update tutorial system
    updateTutorial(deltaTime);

    // Zen mode: no timer countdown
    if (gameState.zenMode) {
        // Timer stays frozen in Zen mode
    } else {
        // Timer counts down (slowed in cafeteria - rebalanced from full pause)
        const inCafeteria = isInCafeteria(gameState.player.x, gameState.player.y);
        // Cafeteria now runs at 25% speed instead of full pause (Playtest balance fix)
        const cafeteriaMultiplier = inCafeteria ? 0.25 : 1.0;
        // If burning, timer drains 2x faster!
        const burnMultiplier = gameState.player.burning > 0 ? 2 : 1;
        // Apply game speed setting
        const speedMultiplier = settings.gameSpeed || 1.0;
        gameState.timer -= deltaTime * cafeteriaMultiplier * burnMultiplier * speedMultiplier;
    }

    // Update celebrations
    updateCelebrations(deltaTime);

    // === NEW: Update coin combo timer ===
    if (gameState.coinComboTimer > 0) {
        gameState.coinComboTimer -= deltaTime;
        if (gameState.coinComboTimer <= 0) {
            gameState.coinCombo = 0;
        }
    }

    // Timer warning sound (play every ~0.5 seconds when timer is low)
    if (gameState.timer <= 5 && gameState.timer > 0 && !gameState.lastChance) {
        if (!gameState.lastWarningTime || Date.now() - gameState.lastWarningTime > 500) {
            AudioManager.play('warning', 0.4);
            gameState.lastWarningTime = Date.now();
        }
    }

    // Enhanced audio - heartbeat pulse when timer is low
    if (settings.audioProximityCues && gameState.timer <= 10 && gameState.timer > 0) {
        // Heartbeat rate increases as timer gets lower
        const heartbeatInterval = gameState.timer <= 5 ? 400 : 700;
        if (!gameState.lastHeartbeatTime || Date.now() - gameState.lastHeartbeatTime > heartbeatInterval) {
            const intensity = 1 - (gameState.timer / 10);
            AudioManager.playHeartbeat(intensity);
            gameState.lastHeartbeatTime = Date.now();
        }
    }

    // Enhanced audio - spatial proximity cues for enemies and fires
    updateSpatialAudio();

    // Update burn effect
    if (gameState.player.burning > 0) {
        gameState.player.burning -= deltaTime;
    }

    // Update fires - spawn new ones and grow existing
    updateFires(deltaTime);

    // Update collecting powerups (suction animation)
    updateCollectingPowerups(deltaTime);

    // "Last Chance" grace period - gives player 3 seconds when timer hits 0
    if (gameState.timer <= 0 && !gameState.lastChance) {
        gameState.lastChance = true;
        gameState.lastChanceTimer = 3.0; // 3 second grace period
    }

    if (gameState.lastChance) {
        gameState.lastChanceTimer -= deltaTime;
        if (gameState.lastChanceTimer <= 0) {
            startImplosion();
            return;
        }
    }

    // Update stun timers
    if (gameState.player.stunned > 0) {
        gameState.player.stunned -= deltaTime;
    }

    // Ghost replay system - record and playback
    recordGhostPosition();
    updateGhostPlayback();

    // Reset hit count after 20 seconds without being hit
    if (Date.now() - gameState.player.lastHitTime > 20000) {
        gameState.player.hitCount = 0;
    }

    for (const enemy of gameState.enemies) {
        if (enemy.stunned > 0) {
            enemy.stunned -= deltaTime;
        }
        // Update spawn animation timer
        if (enemy.spawnTimer > 0) {
            enemy.spawnTimer -= deltaTime;
        }
    }

    if (gameState.powerupTimer > 0) {
        gameState.powerupTimer -= deltaTime;
        if (gameState.powerupTimer <= 0 && (gameState.powerup === 'speed' || gameState.powerup === 'electric')) {
            AudioManager.play('powerupExpire'); // Power-down sound
            gameState.powerup = null;
        }
    }

    // Update shield timer
    if (gameState.player.shielded > 0) {
        gameState.player.shielded -= deltaTime;
    }

    // Update dog companion
    if (gameState.player.companion) {
        gameState.player.companion.timer -= deltaTime;
        gameState.player.companion.frame += deltaTime * 8;

        // Companion follows player with slight lag
        const comp = gameState.player.companion;
        const dx = gameState.player.x - comp.x;
        const dy = gameState.player.y - comp.y;

        // Move companion toward player if more than 1 tile away
        if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
            if (Math.abs(dx) > Math.abs(dy)) {
                comp.x += dx > 0 ? 1 : -1;
            } else if (dy !== 0) {
                comp.y += dy > 0 ? 1 : -1;
            }
        }

        // Companion scares nearby enemies (they run away)
        for (const enemy of gameState.enemies) {
            if (enemy.stunned <= 0) {
                const dist = Math.abs(enemy.x - comp.x) + Math.abs(enemy.y - comp.y);
                if (dist < 4) {
                    // Enemy is scared and runs away
                    enemy.scared = 2;  // 2 seconds of being scared
                }
            }
        }

        // Remove companion when timer expires
        if (comp.timer <= 0) {
            gameState.player.companion = null;
        }
    }

    // Update crispy effects (decay and remove)
    for (let i = gameState.crispyEffects.length - 1; i >= 0; i--) {
        gameState.crispyEffects[i].timer -= deltaTime;
        if (gameState.crispyEffects[i].timer <= 0) {
            gameState.crispyEffects.splice(i, 1);
        }
    }

    // Update punch effects (decay and remove)
    for (let i = gameState.punchEffects.length - 1; i >= 0; i--) {
        gameState.punchEffects[i].timer -= deltaTime;
        if (gameState.punchEffects[i].timer <= 0) {
            gameState.punchEffects.splice(i, 1);
        }
    }

    // Get combined input from keyboard and gamepad
    const currentInput = getInput();

    // Handle gamepad pause (with cooldown to prevent rapid toggling)
    if (currentInput.pause && gamepadState.buttonCooldown <= 0) {
        togglePause();
        gamepadState.buttonCooldown = 0.3; // 300ms cooldown
    }

    // Handle gamepad action button (with cooldown)
    if (currentInput.action && gamepadState.buttonCooldown <= 0 && gamepadState.connected) {
        usePowerup();
        gamepadState.buttonCooldown = 0.2; // 200ms cooldown
    }

    // Decrease button cooldown
    if (gamepadState.buttonCooldown > 0) {
        gamepadState.buttonCooldown -= deltaTime;
    }

    // Update squash & stretch animation
    updateSquashStretch(deltaTime);

    // Process any buffered inputs first
    processInputBuffer();

    // Movement using combined input (with input buffering support)
    if (currentInput.up) {
        if (!movePlayer(0, -1)) bufferMovementInput(0, -1);
    }
    if (currentInput.down) {
        if (!movePlayer(0, 1)) bufferMovementInput(0, 1);
    }
    if (currentInput.left) {
        if (!movePlayer(-1, 0)) bufferMovementInput(-1, 0);
    }
    if (currentInput.right) {
        if (!movePlayer(1, 0)) bufferMovementInput(1, 0);
    }

    moveEnemies();

    updateHUD();
}

let lastTime = 0;
let fpsCounter = { frames: 0, lastUpdate: 0, fps: 0 };

function gameLoop(timestamp) {
    // Cap deltaTime to prevent huge jumps (e.g., on first frame or after tab switch)
    let deltaTime = (timestamp - lastTime) / 1000;
    if (lastTime === 0 || deltaTime > 0.1) {
        deltaTime = 0.016; // Cap at ~60fps worth of time
    }
    lastTime = timestamp;

    // FPS calculation
    fpsCounter.frames++;
    if (timestamp - fpsCounter.lastUpdate >= 1000) {
        fpsCounter.fps = fpsCounter.frames;
        fpsCounter.frames = 0;
        fpsCounter.lastUpdate = timestamp;
    }

    // Update freeze frame (blocks game updates while active)
    if (updateFreezeFrame(deltaTime)) {
        // Still draw during freeze frame, but skip game logic
        draw();
        drawFreezeEffect();
        drawRestartFlash();
        requestAnimationFrame(gameLoop);
        return;
    }

    // Don't update game state while paused, but still draw
    if (!gameState.paused) {
        update(deltaTime);
    }

    // Update restart flash effect
    updateRestartFlash(deltaTime);

    // Update and draw transition particles (even when paused/between levels)
    transitionParticles.update(deltaTime);

    draw();

    // Draw restart flash on top of everything
    drawRestartFlash();

    // Draw transition particles on top
    transitionParticles.draw();

    // Draw FPS counter if enabled
    if (settings.showFPS && gameState.started) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(5, 5, 60, 20);
        ctx.fillStyle = '#4ecdc4';
        ctx.font = '12px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`FPS: ${fpsCounter.fps}`, 10, 18);
    }

    requestAnimationFrame(gameLoop);
}

function startGame(mode = 'normal') {
    // Initialize audio system on first user interaction
    AudioManager.init();
    AudioManager.resume();
    AudioManager.play('select');

    document.getElementById('message').style.display = 'none';

    // === NEW: Quick Run Mode (7 floors instead of 23) ===
    // Check if mode includes 'quick' prefix
    const isQuickRun = mode.startsWith('quick');
    const actualMode = isQuickRun ? mode.replace('quick_', '') : mode;

    gameState.quickRunMode = isQuickRun;
    gameState.floor = isQuickRun ? 7 : 23; // Quick run starts at floor 7
    gameState.quickRunStartFloor = isQuickRun ? 7 : 23;

    gameState.gameOver = false;
    gameState.won = false;
    gameState.started = true;
    gameState.paused = false;
    gameState.player.hitCount = 0;
    gameState.player.lastHitTime = 0;
    gameState.player.burning = 0;
    gameState.enemiesKnockedOut = 0;
    gameState.enemiesZapped = 0;
    gameState.enemiesDodged = 0;
    gameState.fires = [];
    gameState.fireSpawnTimer = 0;

    // === NEW: Reset coin collection ===
    gameState.coinsCollected = 0;
    gameState.coinCombo = 0;
    gameState.coinComboTimer = 0;

    // Checkpoint system reset (Playtest Feature #2)
    gameState.lastCheckpoint = null;
    gameState.continuesRemaining = MAX_CONTINUES;
    gameState.floorHits = 0;
    gameState.celebrations = [];

    // Set difficulty mode (Playtest Feature #1)
    gameState.zenMode = (actualMode === 'zen');
    settings.difficulty = actualMode;

    // Start run timer
    gameState.runStartTime = Date.now();
    gameState.runTotalTime = 0;
    gameState.floorTimes = [];

    playerProgress.wasHitThisRun = false; // Reset for perfect run tracking

    // Initialize ghost replay system
    initGhostSystem();
    loadGhostReplay();

    // Don't count zen mode runs in stats
    if (!gameState.zenMode) {
        playerStats.totalRuns++;
        saveStats();
    }

    updatePlayerColors(); // Apply selected character colors
    initLevel();
}

// Quick start arcade mode (Playtest Feature #10)
function quickStartArcade() {
    startGame('normal');
}

// Start zen mode (Playtest Feature #4)
function startZenMode() {
    startGame('zen');
}

function togglePause() {
    if (!gameState.started || gameState.gameOver || gameState.won) return;

    gameState.paused = !gameState.paused;
    const pauseScreen = document.getElementById('pauseScreen');

    if (gameState.paused) {
        document.getElementById('pauseFloor').textContent = gameState.floor;
        document.getElementById('pauseTime').textContent = Math.ceil(gameState.timer);

        // Set random atmospheric background for pause screen
        const bg = getRandomBackground('pause');
        pauseScreen.style.backgroundImage = `url('${bg}')`;
        pauseScreen.style.backgroundSize = 'cover';
        pauseScreen.style.backgroundPosition = 'center';

        pauseScreen.style.display = 'flex';
    } else {
        pauseScreen.style.display = 'none';
    }
}

function resumeGame() {
    gameState.paused = false;
    document.getElementById('pauseScreen').style.display = 'none';
}

function quitToMenu() {
    gameState.paused = false;
    gameState.started = false;
    gameState.gameOver = false;
    gameState.won = false;
    document.getElementById('pauseScreen').style.display = 'none';
    document.getElementById('message').style.display = 'block';
    updateResumeButton(); // Update resume button visibility
}

function saveAndQuit() {
    if (saveGameState()) {
        quitToMenu();
    }
}

function updateResumeButton() {
    // Alias for updateTitleMenuState for backwards compatibility
    updateTitleMenuState();
}

function updateTitleMenuState() {
    const primaryGroup = document.getElementById('primaryActionGroup');
    const resumeBtn = document.getElementById('menuResumeBtn');
    const playBtn = document.getElementById('menuPlayBtn');
    const floorInfo = document.getElementById('resumeFloorInfo');

    if (!primaryGroup || !resumeBtn || !playBtn) return;

    if (hasSavedGame()) {
        // Show Resume as primary, Play becomes secondary
        primaryGroup.classList.add('has-save');
        resumeBtn.style.display = 'flex';

        // Get saved floor info to display
        try {
            const saveData = JSON.parse(localStorage.getItem('deadline_savedGame'));
            if (saveData && saveData.floor) {
                floorInfo.textContent = `FLOOR ${saveData.floor}`;
            }
        } catch (e) {
            floorInfo.textContent = '';
        }

        // Change Play button text to indicate new game
        playBtn.innerHTML = '▶ NEW GAME';
    } else {
        // No save - Play is primary
        primaryGroup.classList.remove('has-save');
        resumeBtn.style.display = 'none';
        playBtn.innerHTML = '▶ PLAY';
    }
}

function addResumeButtonToTitle() {
    // Resume button is now in HTML, just update its state
    updateTitleMenuState();
}

document.addEventListener('keydown', (e) => {
    // Escape key behavior
    if (e.code === 'Escape') {
        e.preventDefault();
        // If on title screen (game not started), open settings menu
        if (!gameState.started || gameState.gameOver || gameState.won) {
            const titleScreen = document.getElementById('message');
            if (titleScreen && titleScreen.style.display !== 'none') {
                showMainSettings();
                return;
            }
        }
        // Otherwise toggle pause during gameplay
        togglePause();
        return;
    }

    // P key also pauses during gameplay
    if (e.code === 'KeyP') {
        e.preventDefault();
        togglePause();
        return;
    }

    // Instant Restart (R key by default) - works during gameplay, game over, and implosion
    const restartKey = settings.instantRestartKey || 'KeyR';
    if (e.code === restartKey && settings.instantRestartEnabled) {
        // Only allow during active gameplay states (not on title screen)
        if (gameState.started && !gameState.paused) {
            e.preventDefault();
            instantRestart();
            return;
        }
    }

    // Don't process other keys while paused
    if (gameState.paused) return;

    keys[e.code] = true;
    if (e.code === 'Space') {
        e.preventDefault();
        usePowerup();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

// ============================================
// SETTINGS MENU FUNCTIONS
// ============================================
function showSettingsMenu() {
    document.getElementById('settingsMenu').style.display = 'flex';
    updateSettingsUI();
}

function hideSettingsMenu() {
    document.getElementById('settingsMenu').style.display = 'none';
    saveSettings();
}

function updateSettingsUI() {
    // Update resolution dropdown
    const resSelect = document.getElementById('resolutionSelect');
    if (resSelect) {
        resSelect.value = settings.resolution;
    }

    // Update checkboxes
    const screenShakeToggle = document.getElementById('screenShakeToggle');
    if (screenShakeToggle) {
        screenShakeToggle.checked = settings.screenShake;
    }

    // Update colorblind mode dropdown
    const colorblindMode = document.getElementById('colorblindMode');
    if (colorblindMode) {
        colorblindMode.value = settings.colorblindMode || 'off';
    }

    // Legacy checkbox support (if exists)
    const colorblindToggle = document.getElementById('colorblindToggle');
    if (colorblindToggle) {
        colorblindToggle.checked = settings.colorblindMode && settings.colorblindMode !== 'off';
    }

    // Update keybind buttons
    refreshKeybindUI();

    // Update volume sliders
    const masterVolume = document.getElementById('masterVolume');
    if (masterVolume) {
        masterVolume.value = settings.masterVolume * 100;
        document.getElementById('masterVolumeVal').textContent = Math.round(settings.masterVolume * 100) + '%';
    }

    const musicVolume = document.getElementById('musicVolume');
    if (musicVolume) {
        musicVolume.value = settings.musicVolume * 100;
        document.getElementById('musicVolumeVal').textContent = Math.round(settings.musicVolume * 100) + '%';
    }

    const sfxVolume = document.getElementById('sfxVolume');
    if (sfxVolume) {
        sfxVolume.value = settings.sfxVolume * 100;
        document.getElementById('sfxVolumeVal').textContent = Math.round(settings.sfxVolume * 100) + '%';
    }

    // Update Game Feel settings
    const instantRestartToggle = document.getElementById('instantRestartToggle');
    if (instantRestartToggle) {
        instantRestartToggle.checked = settings.instantRestartEnabled !== false;
    }

    const inputBufferingToggle = document.getElementById('inputBufferingToggle');
    if (inputBufferingToggle) {
        inputBufferingToggle.checked = settings.inputBufferingEnabled !== false;
    }

    const freezeFramesToggle = document.getElementById('freezeFramesToggle');
    if (freezeFramesToggle) {
        freezeFramesToggle.checked = settings.freezeFramesEnabled !== false;
    }

    const freezeIntensity = document.getElementById('freezeIntensity');
    if (freezeIntensity) {
        const val = Math.round((settings.freezeFrameIntensity || 1.0) * 100);
        freezeIntensity.value = val;
        document.getElementById('freezeIntensityVal').textContent = val + '%';
        document.getElementById('freezeIntensityRow').style.opacity = settings.freezeFramesEnabled !== false ? '1' : '0.5';
    }

    const squashStretchToggle = document.getElementById('squashStretchToggle');
    if (squashStretchToggle) {
        squashStretchToggle.checked = settings.squashStretchEnabled !== false;
    }

    const ghostToggle = document.getElementById('ghostToggle');
    if (ghostToggle) {
        ghostToggle.checked = settings.ghostEnabled !== false;
    }

    const ghostOpacity = document.getElementById('ghostOpacity');
    if (ghostOpacity) {
        const val = Math.round((settings.ghostOpacity || 0.4) * 100);
        ghostOpacity.value = val;
        document.getElementById('ghostOpacityVal').textContent = val + '%';
        document.getElementById('ghostOpacityRow').style.opacity = settings.ghostEnabled !== false ? '1' : '0.5';
    }

    // Update controller status
    updateControllerStatus();
}

function updateControllerStatus() {
    const statusEl = document.getElementById('controllerStatus');
    if (statusEl) {
        if (gamepadState.connected) {
            statusEl.textContent = '🎮 Controller connected';
            statusEl.className = 'controller-status connected';
        } else {
            statusEl.textContent = 'No controller detected';
            statusEl.className = 'controller-status';
        }
    }
}

function changeResolution(resKey) {
    settings.resolution = resKey;
    setResolution(resKey);
}

function toggleScreenShake(enabled) {
    settings.screenShake = enabled;
    saveSettings();
}

// ============================================
// GAME FEEL SETTINGS (Super Meat Boy features)
// ============================================

function toggleInstantRestart(enabled) {
    settings.instantRestartEnabled = enabled;
    saveSettings();
}

function toggleInputBuffering(enabled) {
    settings.inputBufferingEnabled = enabled;
    saveSettings();
}

function toggleFreezeFrames(enabled) {
    settings.freezeFramesEnabled = enabled;
    saveSettings();
    // Update slider visibility
    const row = document.getElementById('freezeIntensityRow');
    if (row) row.style.opacity = enabled ? '1' : '0.5';
}

function setFreezeIntensity(value) {
    settings.freezeFrameIntensity = value / 100;
    saveSettings();
    const span = document.getElementById('freezeIntensityVal');
    if (span) span.textContent = value + '%';
}

function toggleSquashStretch(enabled) {
    settings.squashStretchEnabled = enabled;
    saveSettings();
}

function toggleGhost(enabled) {
    settings.ghostEnabled = enabled;
    saveSettings();
    // Update slider visibility
    const row = document.getElementById('ghostOpacityRow');
    if (row) row.style.opacity = enabled ? '1' : '0.5';
}

function setGhostOpacity(value) {
    settings.ghostOpacity = value / 100;
    saveSettings();
    const span = document.getElementById('ghostOpacityVal');
    if (span) span.textContent = value + '%';
}

function toggleColorblindMode(enabled) {
    // Legacy function for checkbox - convert to new format
    settings.colorblindMode = enabled ? 'deuteranopia' : 'off';
    saveSettings();
    applyColorblindMode(settings.colorblindMode);
}

// Set specific colorblind mode from dropdown
function setColorblindMode(mode) {
    settings.colorblindMode = mode;
    saveSettings();
    applyColorblindMode(mode);

    // Update UI dropdown if exists
    const dropdown = document.getElementById('colorblindMode');
    if (dropdown) {
        dropdown.value = mode;
    }
}

// Keybind capture system
let keybindCaptureAction = null;
let keybindCaptureHandler = null;

function captureKeybind(action) {
    // If already capturing, cancel
    if (keybindCaptureAction) {
        cancelKeybindCapture();
    }

    keybindCaptureAction = action;
    const btn = document.getElementById(`keybind-${action}`);
    if (btn) {
        btn.classList.add('capturing');
        btn.textContent = 'Press key...';
    }

    // Add capture handler
    keybindCaptureHandler = function(e) {
        e.preventDefault();
        e.stopPropagation();

        // Get the key code
        const keyCode = e.code;

        // Update the control binding
        if (!settings.controls) {
            settings.controls = { ...DEFAULT_SETTINGS.controls };
        }
        settings.controls[keybindCaptureAction] = [keyCode];

        // Update button text
        updateKeybindDisplay(keybindCaptureAction, keyCode);

        // Save and cleanup
        saveSettings();
        cancelKeybindCapture();
    };

    document.addEventListener('keydown', keybindCaptureHandler, { capture: true });
}

function cancelKeybindCapture() {
    if (keybindCaptureAction) {
        const btn = document.getElementById(`keybind-${keybindCaptureAction}`);
        if (btn) {
            btn.classList.remove('capturing');
            // Restore the current binding display
            const keys = settings.controls?.[keybindCaptureAction] || DEFAULT_SETTINGS.controls[keybindCaptureAction];
            btn.textContent = formatKeybindDisplay(keys);
        }
    }

    if (keybindCaptureHandler) {
        document.removeEventListener('keydown', keybindCaptureHandler, { capture: true });
        keybindCaptureHandler = null;
    }

    keybindCaptureAction = null;
}

function updateKeybindDisplay(action, keyCode) {
    const btn = document.getElementById(`keybind-${action}`);
    if (btn) {
        btn.classList.remove('capturing');
        btn.textContent = formatKeyName(keyCode);
    }
}

function formatKeybindDisplay(keys) {
    if (!keys || keys.length === 0) return '---';
    return keys.map(k => formatKeyName(k)).join(' / ');
}

function formatKeyName(keyCode) {
    // Convert key codes to friendly names
    const keyNames = {
        'KeyW': 'W', 'KeyA': 'A', 'KeyS': 'S', 'KeyD': 'D',
        'KeyP': 'P', 'KeyE': 'E', 'KeyQ': 'Q', 'KeyR': 'R',
        'ArrowUp': '↑', 'ArrowDown': '↓', 'ArrowLeft': '←', 'ArrowRight': '→',
        'Space': 'Space', 'Enter': 'Enter', 'Escape': 'Esc',
        'ShiftLeft': 'L-Shift', 'ShiftRight': 'R-Shift',
        'ControlLeft': 'L-Ctrl', 'ControlRight': 'R-Ctrl',
        'AltLeft': 'L-Alt', 'AltRight': 'R-Alt',
        'Tab': 'Tab', 'Backspace': 'Backspace'
    };

    return keyNames[keyCode] || keyCode.replace('Key', '');
}

function resetKeybinds() {
    settings.controls = { ...DEFAULT_SETTINGS.controls };
    saveSettings();
    refreshKeybindUI();
}

function refreshKeybindUI() {
    const actions = ['up', 'down', 'left', 'right', 'action', 'pause'];
    actions.forEach(action => {
        const btn = document.getElementById(`keybind-${action}`);
        if (btn) {
            const keys = settings.controls?.[action] || DEFAULT_SETTINGS.controls[action];
            btn.textContent = formatKeybindDisplay(keys);
        }
    });
}

// Initialize keybind UI when settings menu opens
function initKeybindUI() {
    refreshKeybindUI();
}

function setMasterVolume(value) {
    settings.masterVolume = value / 100;
    document.getElementById('masterVolumeVal').textContent = value + '%';
    saveSettings();
    AudioManager.setMasterVolume(settings.masterVolume);
}

function setMusicVolume(value) {
    settings.musicVolume = value / 100;
    document.getElementById('musicVolumeVal').textContent = value + '%';
    saveSettings();
    AudioManager.setMusicVolume(settings.musicVolume);
}

function setSfxVolume(value) {
    settings.sfxVolume = value / 100;
    document.getElementById('sfxVolumeVal').textContent = value + '%';
    saveSettings();
    AudioManager.setSfxVolume(settings.sfxVolume);
}

// Add settings button to title screen
function addSettingsToTitle() {
    const tertiaryRow = document.getElementById('tertiaryButtons');
    if (tertiaryRow && !document.getElementById('titleSettingsBtn')) {
        const settingsBtn = document.createElement('button');
        settingsBtn.id = 'titleSettingsBtn';
        settingsBtn.className = 'btn-tertiary';
        settingsBtn.textContent = 'SETTINGS';
        settingsBtn.onclick = showSettingsMenu;
        tertiaryRow.appendChild(settingsBtn);
    }
}

// ============================================
// CHARACTER SELECTION UI
// ============================================
function showCharacterSelect() {
    let modal = document.getElementById('characterSelectModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'characterSelectModal';
        modal.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);display:flex;justify-content:center;align-items:center;z-index:400;`;
        document.body.appendChild(modal);
    }

    let html = `<div style="background:linear-gradient(180deg,rgba(30,40,60,0.98) 0%,rgba(15,20,35,0.99) 100%);padding:30px;border-radius:12px;border:3px solid #4ecdc4;max-width:600px;max-height:80vh;overflow-y:auto;">
        <h2 style="color:#4ecdc4;text-align:center;margin-bottom:20px;letter-spacing:3px;">SELECT CHARACTER</h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:15px;">`;

    for (const [id, char] of Object.entries(CHARACTERS)) {
        const unlocked = playerProgress.unlockedCharacters.includes(id);
        const selected = playerProgress.selectedCharacter === id;
        const borderColor = selected ? '#ffe66d' : (unlocked ? '#4ecdc4' : '#555');
        const opacity = unlocked ? '1' : '0.5';

        html += `<div onclick="${unlocked ? `selectCharacter('${id}');showCharacterSelect();` : ''}" style="background:rgba(0,0,0,0.5);border:2px solid ${borderColor};border-radius:8px;padding:15px;text-align:center;cursor:${unlocked ? 'pointer' : 'not-allowed'};opacity:${opacity};transition:all 0.2s;">
            <div style="width:40px;height:40px;margin:0 auto 10px;background:${char.colors.shirt};border-radius:50%;border:3px solid ${char.colors.hair};"></div>
            <div style="color:#fff;font-size:12px;font-weight:bold;margin-bottom:5px;">${char.name}</div>
            <div style="color:#888;font-size:10px;margin-bottom:5px;">${char.description}</div>
            ${unlocked ? (selected ? '<div style="color:#ffe66d;font-size:10px;">SELECTED</div>' : '') : `<div style="color:#e74c3c;font-size:9px;">🔒 ${char.unlockCondition}</div>`}
        </div>`;
    }

    html += `</div>
        <div style="text-align:center;margin-top:20px;">
            <div style="color:#888;font-size:11px;margin-bottom:10px;">Unlocked: ${playerProgress.unlockedCharacters.length}/${Object.keys(CHARACTERS).length}</div>
            <button onclick="document.getElementById('characterSelectModal').style.display='none'" style="padding:12px 30px;font-size:14px;background:linear-gradient(180deg,#4ecdc4 0%,#2a9d8f 100%);color:#fff;border:none;cursor:pointer;font-family:'Courier New',monospace;text-transform:uppercase;border-radius:4px;letter-spacing:2px;">BACK</button>
        </div>
    </div>`;

    modal.innerHTML = html;
    modal.style.display = 'flex';
}

function addCharacterSelectToTitle() {
    const tertiaryRow = document.getElementById('tertiaryButtons');
    if (tertiaryRow && !document.getElementById('titleCharacterBtn')) {
        const charBtn = document.createElement('button');
        charBtn.id = 'titleCharacterBtn';
        charBtn.className = 'btn-tertiary';
        charBtn.textContent = 'CHARACTERS';
        charBtn.onclick = showCharacterSelect;
        tertiaryRow.appendChild(charBtn);
    }
}

// Initialize settings on load
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    loadProgress();
    initDifficultyButtons();
    addResumeButtonToTitle();
    updatePlayerColors();

    // Preload character assets in background
    characterAssetLoader.preloadAll().then(count => {
        if (count > 0) {
            console.log('Character sprites ready');
        }
    });
});

document.getElementById('message').style.display = 'block';
setTitleBackground();  // Set random atmospheric background
loadSettings();
loadProgress();
initDifficultyButtons();
addResumeButtonToTitle();
updatePlayerColors();
loadStats();  // Load player stats from localStorage
requestAnimationFrame(gameLoop);
