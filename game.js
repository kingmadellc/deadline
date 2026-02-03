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

// ============================================
// ENDLESS DESCENT MODE - Configuration
// ============================================
const ENDLESS_MODE_CONFIG = {
    startFloor: 1,              // Internal floor counter starts at 1
    initialTimer: 45,           // Starting timer
    minTimer: 20,               // Minimum timer at high floors
    maxMapSize: 50,             // Maximum map height in tiles
    maxEnemies: 25,             // Maximum enemies to prevent performance issues
    maxFires: 15,               // Maximum active fires
    breatherInterval: 10,       // Breather floor every N floors
    pressureWaveStart: 7,       // Pressure wave starts at floor N of each decade
    pressureWaveEnd: 9          // Pressure wave ends at floor N of each decade
};

// Endless Mode Milestones - Celebration moments with rewards
const ENDLESS_MILESTONES = {
    5: {
        name: 'Warmed Up',
        celebration: 'FLOOR 5 - WARMED UP!',
        reward: { bonusTime: 3, escapePoints: 25 },
        color: '#2ecc71'
    },
    10: {
        name: 'Double Digits',
        celebration: 'FLOOR 10 - DOUBLE DIGITS!',
        reward: { bonusTime: 5, escapePoints: 50 },
        color: '#f39c12'
    },
    15: {
        name: 'Basement Explorer',
        celebration: 'FLOOR 15 - BASEMENT EXPLORER!',
        reward: { bonusTime: 5, escapePoints: 75 },
        color: '#3498db'
    },
    25: {
        name: 'Deep Dweller',
        celebration: 'FLOOR 25 - DEEP DWELLER!',
        reward: { bonusTime: 7, escapePoints: 100 },
        color: '#9b59b6',
        special: 'slowmo'
    },
    50: {
        name: 'Subterranean',
        celebration: 'FLOOR 50 - SUBTERRANEAN!',
        reward: { bonusTime: 10, escapePoints: 250 },
        color: '#e74c3c',
        special: 'screenFlash'
    },
    75: {
        name: 'Core Crawler',
        celebration: 'FLOOR 75 - CORE CRAWLER!',
        reward: { bonusTime: 12, escapePoints: 500 },
        color: '#1abc9c'
    },
    100: {
        name: 'CENTURION',
        celebration: 'FLOOR 100 - CENTURION!',
        reward: { bonusTime: 20, escapePoints: 1000 },
        color: '#ffd700',
        special: 'epicCelebration'
    }
};

// Danger Zones - Special floor modifiers for variety
const DANGER_ZONES = {
    blackout: {
        name: 'BLACKOUT',
        description: 'Reduced visibility',
        color: '#2c3e50',
        floors: [8, 18, 28, 38, 48, 58, 68, 78, 88, 98]
    },
    swarm: {
        name: 'SWARM',
        description: 'Double enemies!',
        color: '#c0392b',
        floors: [12, 24, 36, 48, 60, 72, 84, 96]
    },
    inferno: {
        name: 'INFERNO',
        description: 'Fire spreads faster',
        color: '#e74c3c',
        floors: [15, 30, 45, 60, 75, 90]
    },
    unstable: {
        name: 'UNSTABLE',
        description: 'Walls shift!',
        color: '#8e44ad',
        floors: [20, 40, 60, 80, 100]
    }
};

// Load powerup images
const powerupImages = {
    speed: new Image(),
    knockout: new Image(),
    electric: new Image(),
    shield: new Image(),
    companion: new Image(),
    // === NEW POWER-UPS ===
    timeFreeze: new Image(),
    coinMagnet: new Image(),
    clone: new Image(),
    invincibility: new Image(),
    overclock: new Image(),
    ghost: new Image()
};
powerupImages.speed.src = 'powerup-speed.png';
powerupImages.knockout.src = 'powerup-knockout.png';
powerupImages.electric.src = 'powerup-electric.png';
// Garden/Dog park powerups - will fall back to drawn versions if images don't exist
powerupImages.shield.src = 'powerup-shield.png';
powerupImages.companion.src = 'powerup-companion.png';
// New powerups - will fall back to drawn versions
powerupImages.timeFreeze.src = 'powerup-timefreeze.png';
powerupImages.coinMagnet.src = 'powerup-magnet.png';
powerupImages.clone.src = 'powerup-clone.png';
powerupImages.invincibility.src = 'powerup-invincibility.png';
powerupImages.overclock.src = 'powerup-overclock.png';

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
// Player character asset (single playable character)
const CHARACTER_ASSETS = {
    corporate_employee: {
        id: 'corporate_employee',
        name: 'Corporate Employee',
        description: 'Just trying to survive another day',
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
    }
};

// Enemy/Coworker character assets (AI opponents)
// === ENEMY TYPES WITH UNIQUE BEHAVIORS ===
const ENEMY_TYPES = {
    coworker: {
        id: 'coworker',
        name: 'Coworker',
        description: 'Standard enemy - balanced stats',
        speed: 1.0,           // Movement speed multiplier
        health: 1,            // Hits to stun
        chaseChance: 0.6,     // Probability to chase player
        timeReward: 4,        // Base time reward when stunned
        special: null         // No special ability
    },
    intern: {
        id: 'intern',
        name: 'The Intern',
        description: 'Fast but fragile - high risk, high reward',
        speed: 1.8,           // Much faster
        health: 1,            // Dies in 1 hit
        chaseChance: 0.9,     // Very aggressive
        timeReward: 6,        // Higher reward for difficulty
        special: 'sprint'     // Occasionally sprints toward player
    },
    it_support: {
        id: 'it_support',
        name: 'IT Support',
        description: 'Slow but tough - requires multiple hits',
        speed: 0.6,           // Slower
        health: 3,            // Takes 3 hits to stun
        chaseChance: 0.5,     // Less aggressive
        timeReward: 10,       // Big reward for taking down
        special: 'tank'       // Resistant to knockback
    },
    hr_karen: {
        id: 'hr_karen',
        name: 'HR Karen',
        description: 'Explodes on defeat - damages nearby enemies!',
        speed: 0.9,           // Slightly slower
        health: 1,            // Normal health
        chaseChance: 0.7,     // Moderately aggressive
        timeReward: 5,        // Normal reward
        special: 'explode'    // Explodes on stun, damaging nearby enemies
    },
    hr_assistant: {
        id: 'hr_assistant',
        name: 'HR Assistant',
        description: 'Frantic and aggressive - papers flying everywhere',
        speed: 1.3,           // Faster than average
        health: 1,            // Normal health
        chaseChance: 0.85,    // Very aggressive
        timeReward: 5,        // Normal reward
        special: null         // No special ability
    }
};

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
    },
    // Intern - Sprinter (fast, squishy)
    intern: {
        id: 'intern',
        name: 'Intern',
        animation: {
            type: 'spritesheet',
            src: 'assets/characters/intern-spritesheet.png',
            loaded: false,
            image: null,
            frameCount: 8,
            frameWidth: 78,
            frameHeight: 78,
            frameDuration: 0.06  // Faster animation for sprinter
        },
        trailColor: {
            primary: '#3498db',
            secondary: '#2980b9',
            glow: 'rgba(52, 152, 219, 0.6)'
        }
    },
    // IT Support - Tank (slow, tough)
    it_support: {
        id: 'it_support',
        name: 'IT Support',
        animation: {
            type: 'spritesheet',
            src: 'assets/characters/it-support-spritesheet.png',
            loaded: false,
            image: null,
            frameCount: 8,
            frameWidth: 78,
            frameHeight: 78,
            frameDuration: 0.1  // Slower animation for tank
        },
        trailColor: {
            primary: '#9b59b6',
            secondary: '#8e44ad',
            glow: 'rgba(155, 89, 182, 0.6)'
        }
    },
    // HR Karen - Exploder
    hr_karen: {
        id: 'hr_karen',
        name: 'HR Karen',
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
            primary: '#e67e22',
            secondary: '#d35400',
            glow: 'rgba(230, 126, 34, 0.6)'
        }
    },
    // HR Assistant - Frantic chaser
    hr_assistant: {
        id: 'hr_assistant',
        name: 'HR Assistant',
        animation: {
            type: 'spritesheet',
            src: 'assets/characters/hr-assistant-spritesheet.png',
            loaded: false,
            image: null,
            frameCount: 8,
            frameWidth: 78,
            frameHeight: 78,
            frameDuration: 0.075  // Slightly faster animation for frantic feel
        },
        trailColor: {
            primary: '#e91e63',
            secondary: '#c2185b',
            glow: 'rgba(233, 30, 99, 0.6)'
        }
    }
};

// Dog companion assets (for dog park zones)
const DOG_ASSETS = {
    office_dog: {
        id: 'office_dog',
        name: 'Office Dog',
        portrait: {
            src: 'assets/characters/office-dog-portrait.png',
            loaded: false,
            image: null
        },
        animation: {
            type: 'spritesheet',
            src: 'assets/characters/office-dog-spritesheet.png',
            loaded: false,
            image: null,
            frameCount: 8,
            frameWidth: 78,
            frameHeight: 78,
            frameDuration: 0.083
        }
    }
};

// Enemy animation state tracking
const enemyAnimationStates = new Map();

// Player always uses corporate_employee
const selectedCharacter = 'corporate_employee';

// Character asset loader
const characterAssetLoader = {
    loadedCount: 0,
    totalCount: 0,

    async preloadAll() {
        const characters = Object.values(CHARACTER_ASSETS);
        const enemies = Object.values(ENEMY_ASSETS);
        const dogs = Object.values(DOG_ASSETS);
        this.totalCount = characters.length * 2 + enemies.length + dogs.length * 2; // portraits + animations + enemy animations + dog assets
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

        // Load dog companion assets
        for (const dog of dogs) {
            if (dog.portrait) {
                promises.push(this.loadImage(dog.portrait));
            }
            if (dog.animation.type === 'spritesheet') {
                promises.push(this.loadImage(dog.animation));
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

    // If game is active, update map dimensions and regenerate level
    if (gameState.gameStarted && !gameState.gameOver) {
        // Get new dimensions for current floor based on new aspect ratio
        if (gameState.endlessMode) {
            const dims = getEndlessMapDimensions(gameState.endlessFloor);
            MAP_WIDTH = dims.width;
            MAP_HEIGHT = dims.height;
        } else {
            const dims = getMapDimensionsForFloor(gameState.floor);
            MAP_WIDTH = dims.width;
            MAP_HEIGHT = dims.height;
        }
        // Recalculate tile size with new dimensions
        TILE_SIZE = getTileSize();
        // Regenerate the current level with new dimensions
        initLevel();
        console.log(`Resolution changed mid-game: regenerated level with ${MAP_WIDTH}x${MAP_HEIGHT} tiles`);
    }

    // Save preference
    saveSettings();

    // Fit canvas to viewport
    fitCanvasToViewport();

    console.log(`Resolution set to ${resKey}, tile size: ${TILE_SIZE}`);
}

// Auto-fit canvas to viewport while maintaining aspect ratio
// This ensures the game is visible on devices where the viewport is smaller than the canvas
function fitCanvasToViewport() {
    const maxWidth = window.innerWidth - 20;   // Small margin for edges
    const maxHeight = window.innerHeight - 80; // Account for HUD and margins

    const canvasRatio = canvas.width / canvas.height;
    const viewportRatio = maxWidth / maxHeight;

    if (canvasRatio > viewportRatio) {
        // Canvas is wider than viewport - constrain by width
        canvas.style.width = maxWidth + 'px';
        canvas.style.height = Math.floor(maxWidth / canvasRatio) + 'px';
    } else {
        // Canvas is taller than viewport - constrain by height
        canvas.style.height = maxHeight + 'px';
        canvas.style.width = Math.floor(maxHeight * canvasRatio) + 'px';
    }
}

// Re-fit canvas on window resize
window.addEventListener('resize', () => {
    fitCanvasToViewport();
});

function getDeviceProfileInfo() {
    const ua = navigator.userAgent || '';
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const aspectRatio = screenWidth / screenHeight;
    const dpr = window.devicePixelRatio || 1;

    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    const isAndroid = /Android/i.test(ua);
    const isMobile = isIOS || isAndroid || ('ontouchstart' in window && screenWidth < 900);

    if (isIOS) {
        return { label: 'iPhone/iPad (iOS)', suggested: autoDetectResolution() };
    }
    // Asus ROG Ally and Ally X detection
    if (/ROG Ally|ASUS.*Ally/i.test(ua)) {
        const suggested = (screenHeight >= 1080 && dpr <= 1.5) ? '1920x1080' : '1280x720';
        return { label: 'Asus ROG Ally', suggested };
    }
    // Generic Asus handheld detection (Ally X may not have "ROG" in UA)
    if (/ASUS/i.test(ua) && screenWidth >= 1920 && aspectRatio >= 1.7) {
        return { label: 'Asus Ally X', suggested: '1920x1080' };
    }
    if (/Steam Deck/i.test(ua)) {
        return { label: 'Steam Deck', suggested: '1280x800' };
    }
    if (isAndroid) {
        return { label: 'Android (Mobile)', suggested: autoDetectResolution() };
    }
    if (aspectRatio >= 1.7 && aspectRatio <= 1.8) {
        return { label: 'Desktop 16:9', suggested: autoDetectResolution() };
    }
    if (aspectRatio >= 1.55 && aspectRatio < 1.7) {
        return { label: 'Desktop 16:10', suggested: autoDetectResolution() };
    }
    return { label: 'Desktop', suggested: autoDetectResolution() };
}

function toggleAutoDetectResolution(enabled) {
    settings.autoDetectResolution = enabled;
    if (enabled) {
        const detected = autoDetectResolution();
        setResolution(detected);
    }
    saveSettings();
    updateSettingsUI();
}

function redetectResolution() {
    settings.autoDetectResolution = true;
    const detected = autoDetectResolution();
    setResolution(detected);
    saveSettings();
    updateSettingsUI();
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

// Re-detect resolution on resize/orientation change (if auto-detect enabled)
let _resDetectTimer = null;
window.addEventListener('resize', () => {
    if (!settings.autoDetectResolution) return;
    if (_resDetectTimer) clearTimeout(_resDetectTimer);
    _resDetectTimer = setTimeout(() => {
        const detected = autoDetectResolution();
        setResolution(detected);
        updateSettingsUI();
    }, 250);
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
    sfxMixBoost: 1.15, // Slightly SFX-forward relative to music

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


    // Generate procedural INDUSTRIAL/NOIR sounds (deadline pressure)
    generateSounds() {
        const noise01 = () => (Math.random() * 2 - 1);
        const clamp01 = (v) => Math.max(0, Math.min(1, v));

        // FOOTSTEP - carpeted office jog (heel + toe)
        this.sounds.footstep = this.createSound((t) => {
            const heelFreq = 90 + Math.random() * 20;
            const toeFreq = 140 + Math.random() * 30;
            const heel = Math.sin(t * heelFreq * Math.PI * 2);
            const toe = Math.sin((t - 0.02) * toeFreq * Math.PI * 2);
            const heelEnv = Math.exp(-t * 35);
            const toeEnv = Math.exp(-Math.max(0, t - 0.02) * 60);
            const carpet = noise01() * Math.sin(t * 800 * Math.PI * 2) * 0.2;
            const carpetEnv = Math.exp(-t * 50);
            const attack = Math.min(1, t * 600);
            return attack * (heel * heelEnv * 0.55 + toe * toeEnv * 0.25 + carpet * carpetEnv * 0.2) * 0.6;
        }, 0.09);

        // Powerup collect - soft tech shimmer (neutral)
        this.sounds.powerup = this.createSound((t) => {
            const rise = 480 + Math.pow(t / 0.25, 1.4) * 360;
            const tone = Math.sin(t * rise * Math.PI * 2);
            const chime = Math.sin(t * 1600 * Math.PI * 2) * 0.35;
            const noise = noise01() * Math.sin(t * 2200 * Math.PI * 2) * 0.15;
            const env = (1 - Math.exp(-t * 40)) * Math.exp(-t * 6);
            return (tone * 0.6 + chime + noise) * env * 0.7;
        }, 0.25);

        // === PUNCH VARIANTS - meaty impact with office grit ===
        this.sounds.punch1 = this.createSound((t) => {
            const thump = Math.sin(t * 90 * Math.PI * 2);
            const thumpEnv = Math.exp(-t * 8);
            const smack = Math.sin(t * 260 * Math.PI * 2);
            const smackEnv = Math.exp(-t * 18);
            const crack = Math.sin(t * 2800 * Math.PI * 2);
            const crackEnv = Math.exp(-t * 80);
            const grit = noise01() * Math.sin(t * 1200 * Math.PI * 2) * 0.2;
            const gritEnv = Math.exp(-t * 30);
            const env = Math.min(1, t * 500);
            return env * (thump * thumpEnv * 0.45 + smack * smackEnv * 0.25 + crack * crackEnv * 0.2 + grit * gritEnv * 0.1) * 0.8;
        }, 0.28);

        this.sounds.punch2 = this.createSound((t) => {
            const thump = Math.sin(t * 110 * Math.PI * 2);
            const thumpEnv = Math.exp(-t * 10);
            const crack = Math.sin(t * 3200 * Math.PI * 2) * Math.exp(-t * 90);
            const grit = noise01() * Math.sin(t * 1600 * Math.PI * 2) * 0.18;
            const gritEnv = Math.exp(-t * 35);
            const env = Math.min(1, t * 600);
            return env * (thump * thumpEnv * 0.5 + crack * 0.25 + grit * gritEnv) * 0.7;
        }, 0.22);

        this.sounds.punch3 = this.createSound((t) => {
            const thump = Math.sin(t * 100 * Math.PI * 2);
            const thumpEnv = Math.exp(-t * 9);
            const smack = Math.sin(t * 220 * Math.PI * 2);
            const smackEnv = Math.exp(-t * 16);
            const crack = Math.sin(t * 2400 * Math.PI * 2) * Math.exp(-t * 70);
            const env = Math.min(1, t * 550);
            return env * (thump * thumpEnv * 0.5 + smack * smackEnv * 0.25 + crack * 0.25) * 0.75;
        }, 0.25);

        this.sounds.punch = this.sounds.punch1;

        // Electric zap - sparking arc
        this.sounds.zap = this.createSound((t) => {
            const arc = Math.sin(t * (900 + Math.sin(t * 60 * Math.PI * 2) * 700) * Math.PI * 2);
            const crackle = noise01() * Math.sin(t * 3500 * Math.PI * 2);
            const hum = Math.sin(t * 60 * Math.PI * 2) * 0.3;
            const env = Math.exp(-t * 3) * Math.min(1, t * 20);
            return (arc * 0.35 + crackle * 0.45 + hum * 0.2) * env * 0.9;
        }, 0.3);

        // Timer warning - anxious pulse (short)
        this.sounds.warning = this.createSound((t) => {
            const pulse = Math.sin(t * 6 * Math.PI * 2) * 0.4 + 0.6;
            const tone = Math.sin(t * 520 * Math.PI * 2);
            const dissonance = Math.sin(t * 655 * Math.PI * 2) * 0.6;
            const env = Math.exp(-t * 2.4);
            return (tone + dissonance) * pulse * env * 0.35;
        }, 0.35);

        // Timer warning alias (used in game loop)
        this.sounds.timerWarning = this.sounds.warning;

        // Floor collapse - deep rumble + debris
        this.sounds.collapse = this.createSound((t) => {
            const sub = Math.sin(t * 24 * Math.PI * 2);
            const rumble = Math.sin(t * 50 * Math.PI * 2) + Math.sin(t * 70 * Math.PI * 2);
            const debris = noise01() * Math.sin(t * 900 * Math.PI * 2) * 0.35;
            const creak = Math.sin(t * 160 * Math.PI * 2) * Math.exp(-t * 3) * 0.2;
            const env = Math.min(1, t * 2.5) * Math.exp(-t * 0.7);
            return (sub * 0.4 + rumble * 0.25 + debris * 0.25 + creak * 0.1) * env;
        }, 1.1);

        // EXIT DOOR - Door Open & Close (0.5s)
        this.sounds.exit = this.createSound((t) => {
            // Door handle click (latch release)
            const latch = Math.sin(t * 2000 * Math.PI * 2);
            const latchEnv = Math.exp(-t * 150) * 0.4;

            // Door opening creak (brief, not horror)
            const creakFreq = 300 + t * 100;
            const creak = Math.sin(t * creakFreq * Math.PI * 2);
            const creak2 = Math.sin(t * creakFreq * 1.5 * Math.PI * 2) * 0.3;
            const creakEnv = (t > 0.02 && t < 0.15) ? Math.exp(-(t - 0.08) * 30) : 0;

            // Whoosh (air through doorway)
            const whooshNoise = (Math.random() * 2 - 1);
            const whoosh = whooshNoise * Math.sin(t * 600 * Math.PI * 2);
            const whooshEnv = (t > 0.05 && t < 0.3) ? Math.sin((t - 0.05) / 0.25 * Math.PI) * 0.25 : 0;

            // Door slam (the satisfying close)
            const slamTime = Math.max(0, t - 0.3);
            const slam = Math.sin(slamTime * 80 * Math.PI * 2);
            const slam2 = Math.sin(slamTime * 160 * Math.PI * 2) * 0.4;
            const slamEnv = (t > 0.3) ? Math.exp(-slamTime * 20) : 0;

            // Latch click (door catching)
            const catchTime = Math.max(0, t - 0.35);
            const catch1 = Math.sin(catchTime * 3000 * Math.PI * 2);
            const catchEnv = (t > 0.35) ? Math.exp(-catchTime * 100) * 0.3 : 0;

            // Frame rattle (resonance after slam)
            const rattleTime = Math.max(0, t - 0.32);
            const rattle = Math.sin(rattleTime * 400 * Math.PI * 2) * Math.sin(rattleTime * 25 * Math.PI * 2);
            const rattleEnv = (t > 0.32) ? Math.exp(-rattleTime * 8) * 0.15 : 0;

            return (
                latch * latchEnv +
                (creak + creak2) * creakEnv * 0.3 +
                whoosh * whooshEnv +
                (slam + slam2) * slamEnv * 0.5 +
                catch1 * catchEnv +
                rattle * rattleEnv
            ) * 0.85;
        }, 0.5);

        // Player hit - harsh impact + sting
        this.sounds.hit = this.createSound((t) => {
            const thump = Math.sin(t * 95 * Math.PI * 2) * Math.exp(-t * 9);
            const sting = Math.sin(t * 1100 * Math.PI * 2) * Math.exp(-t * 20) * 0.4;
            const grit = noise01() * Math.sin(t * 1500 * Math.PI * 2) * Math.exp(-t * 25) * 0.2;
            return (thump * 0.6 + sting + grit) * 0.8;
        }, 0.22);

        // Menu select - subtle click
        this.sounds.select = this.createSound((t) => {
            const click = Math.sin(t * 600 * Math.PI * 2) * Math.exp(-t * 30);
            const tick = Math.sin(t * 1600 * Math.PI * 2) * Math.exp(-t * 60) * 0.3;
            return (click + tick) * 0.6;
        }, 0.07);

        // Victory - restrained lift (survival)
        this.sounds.victory = this.createSound((t) => {
            const note1 = Math.sin(t * 262 * Math.PI * 2);
            const note2 = Math.sin(t * 330 * Math.PI * 2) * 0.7;
            const note3 = Math.sin(t * 392 * Math.PI * 2) * 0.5;
            const env = (1 - Math.exp(-t * 20)) * Math.exp(-t * 3);
            return (note1 + note2 + note3) * env * 0.6;
        }, 0.6);

        // Floor clear stinger - triumphant but brief
        this.sounds.floorClear = this.createSound((t) => {
            const a = Math.sin(t * 392 * Math.PI * 2);
            const c = Math.sin(t * 523.25 * Math.PI * 2) * 0.7;
            const e = Math.sin(t * 659.25 * Math.PI * 2) * 0.5;
            const rise = 1 - Math.exp(-t * 25);
            const env = rise * Math.exp(-t * 4);
            return (a + c + e) * env * 0.7;
        }, 0.5);

        // === POWERUP-SPECIFIC SOUNDS ===
        this.sounds.speedCollect = this.createSound((t) => {
            const sweep = 300 + Math.pow(t / 0.25, 2) * 1100;
            const tone = Math.sin(t * sweep * Math.PI * 2);
            const wind = noise01() * Math.sin(t * 1800 * Math.PI * 2) * 0.25;
            const env = (1 - Math.exp(-t * 50)) * Math.exp(-t * 8);
            return (tone * 0.6 + wind) * env * 0.75;
        }, 0.25);

        this.sounds.electricCollect = this.createSound((t) => {
            const tick = Math.sin(t * 1200 * Math.PI * 2) * Math.exp(-t * 30);
            const chime = Math.sin(t * 900 * Math.PI * 2) * Math.exp(-t * 10);
            const zap = Math.sin(t * 3200 * Math.PI * 2) * Math.exp(-t * 50) * 0.2;
            const env = (1 - Math.exp(-t * 40)) * Math.exp(-t * 6);
            return (tick * 0.35 + chime * 0.45 + zap) * env * 0.7;
        }, 0.28);

        this.sounds.ghostCollect = this.createSound((t) => {
            const shimmer = Math.sin(t * 1200 * Math.PI * 2) * 0.3;
            const detune = Math.sin(t * 1180 * Math.PI * 2) * 0.3;
            const breath = noise01() * Math.sin(t * 2400 * Math.PI * 2) * 0.15;
            const env = (1 - Math.exp(-t * 16)) * Math.exp(-t * 6);
            return (shimmer + detune + breath) * env * 0.6;
        }, 0.32);

        this.sounds.knockoutCollect = this.createSound((t) => {
            const strap = Math.sin(t * 280 * Math.PI * 2) * Math.exp(-t * 18);
            const click = Math.sin(t * 1800 * Math.PI * 2) * Math.exp(-t * 60) * 0.4;
            const thump = Math.sin(t * 140 * Math.PI * 2) * Math.exp(-t * 25) * 0.3;
            return (strap * 0.4 + click + thump) * 0.7;
        }, 0.25);

        this.sounds.powerupExpire = this.createSound((t) => {
            const drop = Math.sin(t * (600 - t * 350) * Math.PI * 2);
            const air = noise01() * Math.sin(t * 900 * Math.PI * 2) * 0.2;
            const env = Math.exp(-t * 5);
            return (drop * 0.5 + air) * env * 0.6;
        }, 0.3);

        this.sounds.coin = this.createSound((t) => {
            const ding = Math.sin(t * 2400 * Math.PI * 2);
            const ring = Math.sin(t * 3600 * Math.PI * 2) * 0.5;
            const env = Math.exp(-t * 18);
            return (ding + ring) * env * 0.6;
        }, 0.14);

        this.sounds.countdown = this.createSound((t) => {
            const tick = Math.sin(t * 1400 * Math.PI * 2);
            const env = Math.exp(-t * 70);
            return tick * env * 0.7;
        }, 0.09);

        this.sounds.wallBump = this.createSound((t) => {
            const thud = Math.sin(t * 130 * Math.PI * 2);
            const env = Math.exp(-t * 60);
            const grit = noise01() * Math.sin(t * 900 * Math.PI * 2) * 0.1;
            return (thud * 0.7 + grit) * env * 0.5;
        }, 0.08);

        this.sounds.alert = this.createSound((t) => {
            const tone = Math.sin(t * 880 * Math.PI * 2);
            const tone2 = Math.sin(t * 660 * Math.PI * 2) * 0.6;
            const env = (1 - Math.exp(-t * 50)) * Math.exp(-t * 8);
            return (tone + tone2) * env * 0.45;
        }, 0.2);

        this.sounds.doorOpen = this.createSound((t) => {
            const slide = Math.sin(t * (70 + t * 120) * Math.PI * 2) * 0.4;
            const hiss = noise01() * Math.sin(t * 2000 * Math.PI * 2) * 0.25;
            const hissEnv = Math.exp(-t * 6);
            const click = Math.sin(t * 500 * Math.PI * 2) * Math.exp(-Math.pow((t - 0.28) * 30, 2)) * 0.4;
            return (slide + hiss * hissEnv + click) * Math.exp(-t * 3.2);
        }, 0.35);

        // HEARTBEAT - used for low timer tension
        this.sounds.heartbeat = this.createSound((t) => {
            const beat1 = Math.sin(t * 70 * Math.PI * 2) * Math.exp(-t * 25);
            const beat2 = Math.sin((t - 0.18) * 90 * Math.PI * 2) * Math.exp(-Math.max(0, t - 0.18) * 28);
            const body = (beat1 * 0.8 + beat2 * 0.6) * 0.8;
            return body;
        }, 0.35);

        // PANIC STINGER - timer <= 3s (short, urgent)
        this.sounds.panicStinger = this.createSound((t) => {
            const rise = 700 + t * 900;
            const tone = Math.sin(t * rise * Math.PI * 2);
            const dissonance = Math.sin(t * (rise * 1.414) * Math.PI * 2) * 0.6;
            const grit = noise01() * Math.sin(t * 2200 * Math.PI * 2) * 0.2;
            const env = Math.exp(-t * 8) * Math.min(1, t * 20);
            return (tone + dissonance + grit) * env * 0.6;
        }, 0.18);

        // === POSITIONAL AMBIENCE ===
        this.sounds.fireCrackle = this.createSound((t) => {
            const hiss = noise01() * Math.sin(t * 2200 * Math.PI * 2) * 0.3;
            const pop = Math.sin(t * 300 * Math.PI * 2) * Math.exp(-Math.pow((t - 0.06) * 35, 2)) * 0.4;
            const env = Math.exp(-t * 3);
            return (hiss + pop) * env * 0.6;
        }, 0.4);

        this.sounds.enemyStep = this.createSound((t) => {
            const thump = Math.sin(t * 85 * Math.PI * 2);
            const thumpEnv = Math.exp(-t * 30);
            const grit = noise01() * Math.sin(t * 900 * Math.PI * 2) * 0.1;
            const gritEnv = Math.exp(-t * 45);
            return (thump * thumpEnv * 0.6 + grit * gritEnv) * 0.5;
        }, 0.08);

        this.sounds.exitHum = this.createSound((t) => {
            const hum = Math.sin(t * 120 * Math.PI * 2) * 0.4;
            const shimmer = Math.sin(t * 480 * Math.PI * 2) * 0.15;
            const air = noise01() * Math.sin(t * 1500 * Math.PI * 2) * 0.08;
            const env = clamp01(1 - t / 0.9);
            return (hum + shimmer + air) * env * 0.5;
        }, 0.9);

        // === LEVEL TRANSITION SOUNDS (4 variants for variety) ===

        // Variant 1: Building collapse descent (0.8s)
        this.sounds.levelTransition = this.createSound((t) => {
            // Descending tone (going down floors)
            const descentFreq = 200 - t * 80;
            const descent = Math.sin(t * descentFreq * Math.PI * 2);
            const descent2 = Math.sin(t * descentFreq * 0.5 * Math.PI * 2) * 0.4;
            const descentEnv = (1 - Math.exp(-t * 5)) * Math.exp(-Math.max(0, t - 0.6) * 3);

            // Tension pulse (heartbeat-like)
            const pulseRate = 2.5;
            const pulse = Math.sin(t * pulseRate * Math.PI * 2);
            const pulseEnv = (pulse > 0.7 ? 1 : 0.3) * descentEnv;

            // Building rumble
            const rumble = Math.sin(t * 35 * Math.PI * 2) + Math.sin(t * 45 * Math.PI * 2) * 0.6;
            const rumbleNoise = (Math.random() * 2 - 1) * 0.15;
            const rumbleEnv = Math.min(1, t * 3) * Math.exp(-Math.max(0, t - 0.5) * 2);

            // Metallic stress (building creaking)
            const stressFreq = 600 + Math.sin(t * 3 * Math.PI * 2) * 100;
            const stress = Math.sin(t * stressFreq * Math.PI * 2);
            const stressGate = (Math.sin(t * 4.5 * Math.PI * 2) > 0.8) ? 1 : 0;
            const stressEnv = stressGate * Math.exp(-t * 2) * 0.2;

            // Debris falling
            const debrisGate = (Math.sin(t * 17 * Math.PI * 2) > 0.95) ? 1 : 0;
            const debris = Math.sin(t * 2500 * Math.PI * 2) * debrisGate;
            const debrisEnv = Math.exp(-t * 3) * 0.15;

            // Final impact
            const impactTime = Math.max(0, t - 0.7);
            const impact = Math.sin(impactTime * 60 * Math.PI * 2);
            const impactEnv = (t > 0.7) ? Math.exp(-impactTime * 15) * 0.4 : 0;

            return (
                (descent + descent2) * descentEnv * pulseEnv * 0.3 +
                (rumble + rumbleNoise) * rumbleEnv * 0.25 +
                stress * stressEnv +
                debris * debrisEnv +
                impact * impactEnv
            ) * 0.8;
        }, 0.8);

        // Variant 2: Elevator descent (0.8s)
        this.sounds.levelTransition2 = this.createSound((t) => {
            // Elevator motor hum (descending pitch)
            const motorFreq = 120 - t * 30;
            const motor = Math.sin(t * motorFreq * Math.PI * 2);
            const motor2 = Math.sin(t * motorFreq * 2 * Math.PI * 2) * 0.3;
            const motorEnv = (1 - Math.exp(-t * 8)) * Math.exp(-Math.max(0, t - 0.6) * 4);

            // Cable tension whine
            const cableFreq = 800 + Math.sin(t * 2 * Math.PI * 2) * 200;
            const cable = Math.sin(t * cableFreq * Math.PI * 2);
            const cableEnv = Math.sin(t / 0.8 * Math.PI) * 0.1;

            // Floor number dings (passing floors)
            const ding1 = Math.sin(t * 1500 * Math.PI * 2) * ((t > 0.2 && t < 0.22) ? 1 : 0);
            const ding2 = Math.sin(t * 1500 * Math.PI * 2) * ((t > 0.45 && t < 0.47) ? 1 : 0);
            const dingEnv = 0.25;

            // Arrival thud
            const arriveTime = Math.max(0, t - 0.72);
            const arrive = Math.sin(arriveTime * 70 * Math.PI * 2);
            const arriveEnv = (t > 0.72) ? Math.exp(-arriveTime * 12) * 0.35 : 0;

            return (
                (motor + motor2) * motorEnv * 0.35 +
                cable * cableEnv +
                (ding1 + ding2) * dingEnv +
                arrive * arriveEnv
            ) * 0.75;
        }, 0.8);

        // Variant 3: Stairwell echo descent (0.8s)
        this.sounds.levelTransition3 = this.createSound((t) => {
            // Footsteps descending (fast paced)
            const stepRate = 6;
            const stepPhase = (t * stepRate) % 1;
            const step = (stepPhase < 0.1) ? Math.sin(stepPhase * 10 * 150 * Math.PI * 2) : 0;
            const stepEnv = Math.exp(-stepPhase * 30) * 0.4;

            // Stairwell reverb tail
            const reverbFreq = 200 + Math.sin(t * stepRate * Math.PI * 2) * 50;
            const reverb = Math.sin(t * reverbFreq * Math.PI * 2);
            const reverbEnv = Math.exp(-t * 2) * 0.2;

            // Breathing (urgency)
            const breathRate = 1.5;
            const breath = (Math.random() * 2 - 1) * 0.1;
            const breathEnv = (Math.sin(t * breathRate * Math.PI * 2) > 0.5) ? 0.15 : 0.05;

            // Door burst at end
            const burstTime = Math.max(0, t - 0.7);
            const burst = Math.sin(burstTime * 100 * Math.PI * 2);
            const burstEnv = (t > 0.7) ? Math.exp(-burstTime * 10) * 0.3 : 0;

            return (
                step * stepEnv +
                reverb * reverbEnv +
                breath * breathEnv +
                burst * burstEnv
            ) * 0.8;
        }, 0.8);

        // Variant 4: Ominous silence to impact (0.8s)
        this.sounds.levelTransition4 = this.createSound((t) => {
            // Eerie silence (filtered noise)
            const silence = (Math.random() * 2 - 1) * 0.05;
            const silenceEnv = Math.exp(-t * 0.5);

            // Building sub-bass dread
            const dread = Math.sin(t * 25 * Math.PI * 2);
            const dreadEnv = Math.pow(t / 0.8, 2) * 0.3;

            // Tension riser (ascending noise)
            const riserFreq = 200 + Math.pow(t / 0.8, 2) * 2000;
            const riser = (Math.random() * 2 - 1) * Math.sin(t * riserFreq * Math.PI * 2);
            const riserEnv = Math.pow(t / 0.8, 3) * 0.2;

            // SUDDEN IMPACT (startling)
            const impactTime = Math.max(0, t - 0.75);
            const impact = Math.sin(impactTime * 50 * Math.PI * 2);
            const impact2 = Math.sin(impactTime * 100 * Math.PI * 2) * 0.5;
            const impactEnv = (t > 0.75) ? Math.exp(-impactTime * 8) * 0.6 : 0;

            return (
                silence * silenceEnv +
                dread * dreadEnv +
                riser * riserEnv +
                (impact + impact2) * impactEnv
            ) * 0.85;
        }, 0.8);

        console.log('Industrial/noir sounds generated');
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
    play(soundName, volume = 1.0, pitch = 1.0) {
        if (!this.initialized || !this.sounds[soundName]) return;

        try {
            const source = this.context.createBufferSource();
            source.buffer = this.sounds[soundName];
            const variation = this.getSfxVariation(soundName);
            const palette = this.getFloorPalette();
            source.playbackRate.value = pitch * variation.rate * palette.rate; // Pitch scaling with subtle variation

            const gainNode = this.context.createGain();
            const boosted = volume * this.sfxMixBoost * variation.gain * palette.gain;
            gainNode.gain.value = Math.min(1.0, boosted);

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
            const variation = this.getSfxVariation(soundName);
            const palette = this.getFloorPalette();
            source.playbackRate.value = variation.rate * palette.rate;

            const gainNode = this.context.createGain();
            const boosted = volume * distanceFactor * this.sfxMixBoost * variation.gain * palette.gain;
            gainNode.gain.value = Math.min(1.0, boosted);

            // Create stereo panner for spatial effect
            const panner = this.context.createStereoPanner();
            panner.pan.value = pan;

            // Distance damping: low-pass filter for far sounds
            const filter = this.context.createBiquadFilter();
            filter.type = 'lowpass';
            const baseCutoff = 7000;
            const cutoff = Math.max(600, Math.min(9000, (baseCutoff * (0.4 + 0.6 * distanceFactor)) * palette.lowpass));
            filter.frequency.value = cutoff;

            source.connect(filter);
            filter.connect(gainNode);
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
            gainNode.gain.value = Math.min(1.0, 0.45 * intensity * this.sfxMixBoost);

            source.connect(gainNode);
            gainNode.connect(this.sfxGain);
            source.start();
        } catch (e) {
            // Ignore audio errors silently
        }
    },

    // === PROCEDURAL BACKGROUND MUSIC SYSTEM ===
    proceduralMusic: {
        playing: false,
        oscillators: [],
        gainNodes: [],
        tempo: 120, // BPM
        currentBeat: 0,
        lastBeatTime: 0,
        bassPattern: [0, 0, 7, 0, 5, 0, 3, 0], // Semitones from root
        melodyPattern: [12, 15, 17, 19, 17, 15, 12, 10], // Higher octave
        intensity: 0.5 // 0-1 based on timer
    },

    // Start procedural background music
    startProceduralMusic() {
        if (!this.initialized || this.proceduralMusic.playing) return;
        this.proceduralMusic.playing = true;
        this.proceduralMusic.currentBeat = 0;
        this.proceduralMusic.lastBeatTime = this.context.currentTime;
        this.proceduralMusic.tempo = 120; // Starting tempo
        this.updateProceduralMusic();
    },

    // Stop procedural background music
    stopProceduralMusic() {
        this.proceduralMusic.playing = false;
        // Stop all oscillators
        for (const osc of this.proceduralMusic.oscillators) {
            try { osc.stop(); } catch (e) {}
        }
        this.proceduralMusic.oscillators = [];
        this.proceduralMusic.gainNodes = [];
    },

    // Update tempo based on timer (higher urgency = faster tempo)
    setMusicTempo(timer) {
        if (timer <= 5) {
            this.proceduralMusic.tempo = 180; // Very urgent
            this.proceduralMusic.intensity = 1.0;
        } else if (timer <= 15) {
            this.proceduralMusic.tempo = 150; // Urgent
            this.proceduralMusic.intensity = 0.8;
        } else if (timer <= 30) {
            this.proceduralMusic.tempo = 135; // Moderate tension
            this.proceduralMusic.intensity = 0.6;
        } else {
            this.proceduralMusic.tempo = 120; // Relaxed
            this.proceduralMusic.intensity = 0.4;
        }
    },

    // Update procedural music (called from game loop)
    updateProceduralMusic() {
        if (!this.proceduralMusic.playing || !this.initialized) return;

        const now = this.context.currentTime;
        const beatDuration = 60 / this.proceduralMusic.tempo; // Seconds per beat

        // Check if it's time for next beat
        if (now - this.proceduralMusic.lastBeatTime >= beatDuration * 0.5) {
            this.proceduralMusic.lastBeatTime = now;
            this.proceduralMusic.currentBeat = (this.proceduralMusic.currentBeat + 1) % 8;

            // Play bass note
            this.playProceduralNote(
                55 + this.proceduralMusic.bassPattern[this.proceduralMusic.currentBeat], // A1 = 55Hz + pattern
                0.15,
                0.2 * this.proceduralMusic.intensity,
                'square'
            );

            // Play melody note (every other beat)
            if (this.proceduralMusic.currentBeat % 2 === 0) {
                const melodyNote = 220 * Math.pow(2, this.proceduralMusic.melodyPattern[this.proceduralMusic.currentBeat / 2] / 12);
                this.playProceduralNote(
                    melodyNote,
                    0.1,
                    0.15 * this.proceduralMusic.intensity,
                    'triangle'
                );
            }

            // Percussion on beats 0 and 4
            if (this.proceduralMusic.currentBeat === 0 || this.proceduralMusic.currentBeat === 4) {
                this.playProceduralNoise(0.05, 0.25 * this.proceduralMusic.intensity);
            }
        }
    },

    // Play a single procedural note
    playProceduralNote(frequency, duration, volume, waveType = 'square') {
        if (!this.initialized) return;

        try {
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();

            osc.type = waveType;
            osc.frequency.value = frequency;

            // Quick attack, sustain, quick release envelope
            gain.gain.setValueAtTime(0, this.context.currentTime);
            gain.gain.linearRampToValueAtTime(volume, this.context.currentTime + 0.01);
            gain.gain.linearRampToValueAtTime(volume * 0.7, this.context.currentTime + duration * 0.5);
            gain.gain.linearRampToValueAtTime(0, this.context.currentTime + duration);

            osc.connect(gain);
            gain.connect(this.musicGain);

            osc.start();
            osc.stop(this.context.currentTime + duration);
        } catch (e) {}
    },

    // Play procedural noise (for percussion)
    playProceduralNoise(duration, volume) {
        if (!this.initialized) return;

        try {
            const bufferSize = this.context.sampleRate * duration;
            const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
            const data = buffer.getChannelData(0);

            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
            }

            const source = this.context.createBufferSource();
            source.buffer = buffer;

            const gain = this.context.createGain();
            gain.gain.value = volume;

            source.connect(gain);
            gain.connect(this.musicGain);
            source.start();
        } catch (e) {}
    },

    // Play a random punch variant for variety
    playRandomPunch(volume = 1.0) {
        const variants = ['punch1', 'punch2', 'punch3'];
        const randomVariant = variants[Math.floor(Math.random() * variants.length)];
        this.play(randomVariant, volume);
    },

    // Subtle variation for frequent SFX (avoid repetition)
    getSfxVariation(soundName) {
        const rand = (min, max) => min + Math.random() * (max - min);
        switch (soundName) {
            case 'footstep':
            case 'enemyStep':
                return { rate: rand(0.96, 1.04), gain: rand(0.9, 1.05) };
            case 'coin':
                return { rate: rand(0.97, 1.05), gain: rand(0.9, 1.02) };
            case 'punch1':
            case 'punch2':
            case 'punch3':
                return { rate: rand(0.97, 1.03), gain: rand(0.95, 1.05) };
            default:
                return { rate: 1.0, gain: 1.0 };
        }
    },

    // Per-floor tonal palette (subtle)
    getFloorPalette() {
        try {
            if (typeof gameState === 'undefined') return { rate: 1.0, gain: 1.0, lowpass: 1.0 };
            if (gameState.endlessMode) {
                const f = Math.max(1, gameState.endlessFloor || 1);
                const darken = Math.min(0.2, f / 200);
                return {
                    rate: 1.0 - Math.min(0.04, f / 200),
                    gain: 1.0 + Math.min(0.1, f / 100),
                    lowpass: 1.0 - darken
                };
            }
            if (gameState.floor >= 10) return { rate: 1.02, gain: 1.0, lowpass: 1.05 };
            if (gameState.floor >= 6) return { rate: 1.0, gain: 1.0, lowpass: 1.0 };
            return { rate: 0.98, gain: 1.05, lowpass: 0.85 };
        } catch (e) {
            return { rate: 1.0, gain: 1.0, lowpass: 1.0 };
        }
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
    const dpr = window.devicePixelRatio || 1;
    const ua = navigator.userAgent || '';

    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    const isAndroid = /Android/i.test(ua);
    const isMobile = isIOS || isAndroid || ('ontouchstart' in window && screenWidth < 900);

    // Asus ROG Ally / Ally X detection (1920x1080 native)
    if (/ROG Ally|ASUS.*Ally|ASUS/i.test(ua) && screenWidth >= 1920 && aspectRatio >= 1.7) {
        return '1920x1080';
    }

    // iOS / mobile browsers: keep internal resolution conservative
    if (isIOS || isMobile) {
        if (Math.min(screenWidth, screenHeight) >= 900 || dpr > 2) return '800x800';
        return '640x640';
    }

    // Detect widescreen aspect ratios
    if (aspectRatio >= 1.7 && aspectRatio <= 1.8) {
        // 16:9 aspect ratio (ROG Ally, Ally X, standard monitors)
        if (screenWidth >= 1920 && screenHeight >= 1080 && dpr <= 1.5) return '1920x1080';
        if (screenHeight >= 720) return '1280x720';
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

// Get base map height based on floor number - INCREASED DIFFICULTY (rebalanced for 13 floors)
function getBaseMapHeightForFloor(floor) {
    // DIFFICULTY INCREASE: Larger maps throughout, no easy small maps
    // Floor 13-11: Start at 22 tiles high - challenging from the start
    if (floor >= 11) return 22;
    // Floors 10-8: 24 tiles high - medium-large
    if (floor >= 8) return 24;
    // Floors 7-5: 26 tiles high - large maps
    if (floor >= 5) return 26;
    // Floors 4-2: 28 tiles high - huge maps
    if (floor >= 2) return 28;
    // Floor 1: 30 tiles high - massive finale
    return 30;
}

// Get map dimensions based on floor number
// DESIGN DECISION: Mazes are always SQUARE for authentic skyscraper feel
// The widescreen canvas shows more atmospheric space around the square maze
function getMapDimensionsForFloor(floor) {
    const baseSize = getBaseMapHeightForFloor(floor);
    // Keep mazes square - highrises have square floor plates
    // Slight random variation per floor for authenticity (±1 tile)
    const variation = Math.floor(gameRandom() * 3) - 1; // -1, 0, or +1
    const size = Math.max(14, baseSize + variation);
    return { width: size, height: size };
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
    // Add more as floors descend (rebalanced for 13-floor game)
    baseEnemies += Math.floor((13 - floor) / 2);
    // Cap at reasonable number
    return Math.min(baseEnemies, 15);
}

// Get number of fires that can spawn on floor (rebalanced for 13-floor game)
function getMaxFiresForFloor(floor) {
    // Fires start from floor 13 with gradual increase - INCREASED for more intensity
    // First-run tutorial easing: no fires on floors 13-12, minimal on 11
    if (gameState && gameState.firstRunTutorial) {
        if (floor >= 12) return 0;
        if (floor === 11) return 1;
    }

    let baseMax;
    if (floor >= 12) baseMax = 2;   // Floors 13-12: 2 fires (intro to mechanic)
    else if (floor >= 10) baseMax = 4;   // Floors 11-10: 4 fires
    else if (floor >= 7) baseMax = 6;    // Floors 9-7: 6 fires
    else if (floor >= 4) baseMax = 10;   // Floors 6-4: 10 fires
    else baseMax = 14;                    // Floors 3-1: 14 fires (inferno finale)

    // Weekly modifier (daily challenge): fire multiplier
    if (dailyChallenge.active && gameState && gameState.weeklyChallenge) {
        const mods = gameState.weeklyChallenge.modifiers || {};
        if (mods.fireMultiplier) {
            baseMax = Math.ceil(baseMax * mods.fireMultiplier);
        }
    }

    // Safety cap for standard mode
    return Math.min(baseMax, 18);
}

// ============================================
// ENDLESS DESCENT MODE - Scaling Functions
// ============================================

function getEndlessMapDimensions(floor) {
    const baseSize = 22;
    const floorFactor = Math.floor(Math.log2(floor + 1) * 3);
    const size = Math.min(baseSize + floorFactor, ENDLESS_MODE_CONFIG.maxMapSize);
    // Keep endless mazes square too for consistent feel
    return { width: size, height: size };
}

function getEndlessTimer(floor) {
    const baseTimer = Math.max(ENDLESS_MODE_CONFIG.minTimer, ENDLESS_MODE_CONFIG.initialTimer - Math.floor(floor / 5) * 3);
    const dims = getEndlessMapDimensions(floor);
    const mapBonus = Math.floor((dims.width * dims.height) / 80);
    const decadeFloor = floor % 10;
    const inPressureWave = decadeFloor >= ENDLESS_MODE_CONFIG.pressureWaveStart && decadeFloor <= ENDLESS_MODE_CONFIG.pressureWaveEnd;
    const pressureMultiplier = inPressureWave ? 0.8 : 1.0;
    const isBreather = floor % ENDLESS_MODE_CONFIG.breatherInterval === 0 && floor > 0;
    const breatherMultiplier = isBreather ? 1.2 : 1.0;
    return Math.floor((baseTimer + mapBonus) * pressureMultiplier * breatherMultiplier);
}

function getEndlessEnemyCount(floor) {
    const dims = getEndlessMapDimensions(floor);
    let baseEnemies = Math.floor((dims.width * dims.height) / 80) + Math.floor(floor / 3);
    const preset = DIFFICULTY_PRESETS[settings.difficulty];
    if (preset && preset.enemyMultiplier) baseEnemies = Math.round(baseEnemies * preset.enemyMultiplier);
    if (gameState.endlessDangerZone === 'swarm') baseEnemies *= 2;
    if (floor % ENDLESS_MODE_CONFIG.breatherInterval === 0 && floor > 0) baseEnemies = Math.floor(baseEnemies * 0.7);
    return Math.min(Math.max(baseEnemies, 2), ENDLESS_MODE_CONFIG.maxEnemies);
}

function getEndlessAIDifficulty(floor) {
    if (floor <= 5) return 'easy';
    if (floor <= 12) return 'medium';
    if (floor <= 25) return 'hard';
    return 'brutal';
}

function getEndlessFireCount(floor) {
    if (floor < 5) return 0;
    let baseCount = 1 + Math.floor((floor - 5) / 4);
    if (gameState.endlessDangerZone === 'inferno') baseCount *= 2;
    return Math.min(baseCount, ENDLESS_MODE_CONFIG.maxFires);
}

function getEndlessFireSpawnInterval(floor) {
    let interval = Math.max(15 - Math.min(floor * 0.3, 10), 4);
    if (gameState.endlessDangerZone === 'inferno') interval = Math.max(interval / 2, 2);
    return interval;
}

function selectEndlessEnemyType(floor) {
    const types = ['coworker'];
    if (floor >= 3) types.push('intern');
    if (floor >= 7) types.push('it_support');
    if (floor >= 12) types.push('hr_karen');
    const dangerLevel = Math.min(floor / 20, 1.0);
    if (Math.random() < dangerLevel * 0.4) {
        const dangerTypes = types.filter(t => t !== 'coworker');
        if (dangerTypes.length > 0) return dangerTypes[Math.floor(Math.random() * dangerTypes.length)];
    }
    return types[Math.floor(Math.random() * types.length)];
}

function getEndlessMilestone(floor) {
    if (ENDLESS_MILESTONES[floor]) return ENDLESS_MILESTONES[floor];
    if (floor > 100 && floor % 25 === 0) {
        return { name: `Floor ${floor} Legend`, celebration: `FLOOR ${floor}!`, reward: { bonusTime: 10 + Math.floor(floor / 50), escapePoints: floor * 10 }, color: '#ffd700' };
    }
    return null;
}

function getEndlessDangerZone(floor) {
    for (const [zoneId, zone] of Object.entries(DANGER_ZONES)) {
        if (zone.floors.includes(floor)) return { id: zoneId, ...zone };
    }
    if (floor > 100) {
        if (floor % 10 === 8) return { id: 'blackout', ...DANGER_ZONES.blackout };
        if (floor % 12 === 0) return { id: 'swarm', ...DANGER_ZONES.swarm };
        if (floor % 15 === 0) return { id: 'inferno', ...DANGER_ZONES.inferno };
        if (floor % 20 === 0) return { id: 'unstable', ...DANGER_ZONES.unstable };
    }
    return null;
}

function checkEndlessPersonalBest(currentFloor) {
    const previousBest = playerStats.endlessBestFloor || 0;
    if (currentFloor > previousBest) return { type: 'newRecord', celebration: 'NEW PERSONAL BEST!', previousBest, newBest: currentFloor };
    if (previousBest > 0 && currentFloor >= previousBest - 3 && currentFloor < previousBest) return { type: 'approaching', celebration: `${previousBest - currentFloor} FLOORS TO BEAT!`, target: previousBest };
    return null;
}

function calculateEndlessScore(floor, stats) {
    return floor * 100 + (stats.totalTimeBonus || 0) * 10 + (stats.enemiesKnockedOut || 0) * 50 + (stats.enemiesZapped || 0) * 30 + (stats.maxCombo || 0) * 100 + (stats.coinsCollected || 0) * 5 + (stats.milestoneBonus || 0) + (stats.perfectFloors || 0) * 200;
}

function calculateEndlessEscapePoints(floor, score) {
    let ep = floor * 5 + Math.floor(score / 500);
    if (floor > (playerStats.endlessBestFloor || 0)) ep += 50 + (floor - (playerStats.endlessBestFloor || 0)) * 10;
    return ep;
}

function isEndlessBreatherFloor(floor) {
    return floor > 0 && floor % ENDLESS_MODE_CONFIG.breatherInterval === 0;
}

function showEndlessMilestoneCelebration(milestone) {
    gameState.celebrations.push({ text: milestone.celebration, subtext: milestone.name, color: milestone.color, timer: 3.0, scale: 1.5, flash: true });
    if (milestone.reward) {
        if (milestone.reward.bonusTime) { gameState.timer += milestone.reward.bonusTime; gameState.endlessStats.totalTimeBonus += milestone.reward.bonusTime; }
        if (milestone.reward.escapePoints) { gameState.endlessStats.milestoneBonus += milestone.reward.escapePoints * 10; }
    }
    if (!gameState.endlessStats.milestonesReached.includes(milestone.name)) gameState.endlessStats.milestonesReached.push(milestone.name);
    if (milestone.special === 'slowmo') { gameState.slowMoActive = true; gameState.slowMoTimer = 1.5; gameState.slowMoFactor = 0.3; }
    else if (milestone.special === 'screenFlash') { gameState.milestoneFlash = 1.0; }
    else if (milestone.special === 'epicCelebration') { gameState.slowMoActive = true; gameState.slowMoTimer = 2.0; gameState.slowMoFactor = 0.2; gameState.milestoneFlash = 1.5; }
    AudioManager.play('victory');
}

function showDangerZoneWarning(zone) {
    gameState.celebrations.push({ text: `⚠️ ${zone.name} ⚠️`, subtext: zone.description, color: zone.color, timer: 2.5, scale: 1.3, flash: false });
}

function showBreatherFloorNotification() {
    gameState.celebrations.push({ text: '😮‍💨 BREATHER FLOOR', subtext: 'Easier enemies, more time', color: '#2ecc71', timer: 2.0, scale: 1.2, flash: false });
}

function showPersonalBestProximityAlert(pbStatus) {
    if (pbStatus.type === 'approaching') {
        gameState.celebrations.push({ text: pbStatus.celebration, subtext: `Your best: Floor ${pbStatus.target}`, color: '#f39c12', timer: 2.0, scale: 1.2, flash: false });
    } else if (pbStatus.type === 'newRecord') {
        gameState.celebrations.push({ text: pbStatus.celebration, subtext: `Previous: Floor ${pbStatus.previousBest}`, color: '#ffd700', timer: 3.0, scale: 1.5, flash: true });
        AudioManager.play('victory');
    }
}

// === ENVIRONMENTAL HAZARDS SYSTEM ===
// Additional hazards that appear in later floors

// Get hazards configuration for floor
function getHazardsForFloor(floor) {
    // Hazards start appearing on floor 7 and increase toward floor 1
    if (floor >= 8) return { sparkingWires: 0, coffeeSpills: 0, malfunctioningCopiers: 0 };
    if (floor >= 5) return { sparkingWires: 2, coffeeSpills: 3, malfunctioningCopiers: 1 };
    if (floor >= 3) return { sparkingWires: 4, coffeeSpills: 5, malfunctioningCopiers: 2 };
    return { sparkingWires: 6, coffeeSpills: 7, malfunctioningCopiers: 3 }; // Floors 1-2: maximum chaos
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
const CHECKPOINT_FLOORS = [10, 7, 4];
const MAX_CONTINUES = 3;

// === DASH SYSTEM CONSTANTS (Core Fun Mechanic) ===
const DASH_DISTANCE = 3;          // Tiles traveled per dash
const DASH_COOLDOWN = 1.5;        // Seconds between dashes
const DASH_INVINCIBILITY = 0.25;  // Seconds of i-frames during dash
const DASH_SPEED = 0.05;          // Seconds per tile during dash (fast!)

// === PUNCH SYSTEM CONSTANTS (Default Attack) ===
const PUNCH_RANGE = 2;            // Tiles - punch hits enemies within this range
const PUNCH_COOLDOWN = 0.8;       // Seconds between punches
const PUNCH_STUN_DURATION = 3;    // Seconds enemy is stunned
const PUNCH_TIME_REWARD = 4;      // Seconds added to timer per enemy hit

// === COMBO SYSTEM CONSTANTS (Over-the-top engagement) ===
const COMBO_WINDOW = 2.0;         // Seconds to continue combo after a kill
const COMBO_MAX_MULTIPLIER = 10;  // Maximum combo multiplier
const COMBO_DECAY_RATE = 1.0;     // How fast combo timer decays per second

// === SLOW-MO CONSTANTS ===
const SLOWMO_2_KILLS = 0.3;       // Duration for 2-kill slow-mo
const SLOWMO_3_KILLS = 0.5;       // Duration for 3+ kill slow-mo
const SLOWMO_5_KILLS = 0.8;       // Duration for 5+ kill slow-mo (MASSACRE)
const SLOWMO_FACTOR = 0.25;       // Time scale during slow-mo (0.25 = 4x slower)

// === KILL STREAK THRESHOLDS ===
const STREAK_DOUBLE = 2;
const STREAK_TRIPLE = 3;
const STREAK_RAMPAGE = 5;
const STREAK_UNSTOPPABLE = 10;
const STREAK_GODLIKE = 15;

// === PERK SYSTEM DEFINITIONS ===
const PERKS = {
    // DASH PERKS
    dashRange: {
        id: 'dashRange',
        name: 'Long Legs',
        description: 'Dash travels 4 tiles instead of 3',
        icon: '🦵',
        category: 'dash',
        rarity: 'common'
    },
    dashSpeed: {
        id: 'dashSpeed',
        name: 'Quick Step',
        description: 'Dash cooldown reduced by 40%',
        icon: '💨',
        category: 'dash',
        rarity: 'common'
    },
    dashDamage: {
        id: 'dashDamage',
        name: 'Shoulder Check',
        description: 'Dashing through enemies stuns them',
        icon: '💥',
        category: 'dash',
        rarity: 'rare'
    },
    dashTrail: {
        id: 'dashTrail',
        name: 'Fire Trail',
        description: 'Dash leaves damaging fire behind',
        icon: '🔥',
        category: 'dash',
        rarity: 'epic'
    },
    // PUNCH PERKS
    punchRange: {
        id: 'punchRange',
        name: 'Long Arms',
        description: 'Punch range increased by 1 tile',
        icon: '🥊',
        category: 'punch',
        rarity: 'common'
    },
    punchSpeed: {
        id: 'punchSpeed',
        name: 'Fast Fists',
        description: 'Punch cooldown reduced by 40%',
        icon: '⚡',
        category: 'punch',
        rarity: 'common'
    },
    punchChain: {
        id: 'punchChain',
        name: 'Chain Reaction',
        description: 'Punched enemies explode, hitting nearby enemies',
        icon: '💫',
        category: 'punch',
        rarity: 'rare'
    },
    punchVampire: {
        id: 'punchVampire',
        name: 'Time Vampire',
        description: 'Punches give +50% more time',
        icon: '🧛',
        category: 'punch',
        rarity: 'epic'
    },
    criticalHit: {
        id: 'criticalHit',
        name: 'Lucky Punch',
        description: 'Critical hit chance increased to 25%',
        icon: '🎯',
        category: 'punch',
        rarity: 'rare'
    },
    // PASSIVE PERKS
    speedBoost: {
        id: 'speedBoost',
        name: 'Coffee Boost',
        description: 'Move 25% faster permanently',
        icon: '☕',
        category: 'passive',
        rarity: 'common'
    },
    shieldStart: {
        id: 'shieldStart',
        name: 'Safety First',
        description: 'Start each floor with a shield',
        icon: '🛡️',
        category: 'passive',
        rarity: 'common'
    },
    coinMagnet: {
        id: 'coinMagnet',
        name: 'Money Magnet',
        description: 'Coins are attracted from 3 tiles away',
        icon: '🧲',
        category: 'passive',
        rarity: 'common'
    },
    comboExtend: {
        id: 'comboExtend',
        name: 'Momentum',
        description: 'Combo timer lasts 50% longer',
        icon: '⏱️',
        category: 'passive',
        rarity: 'rare'
    },
    startTime: {
        id: 'startTime',
        name: 'Head Start',
        description: '+5 seconds at floor start',
        icon: '⏰',
        category: 'passive',
        rarity: 'common'
    },
    luckyCoins: {
        id: 'luckyCoins',
        name: 'Lucky Coins',
        description: 'Coins worth double points',
        icon: '🍀',
        category: 'passive',
        rarity: 'rare'
    },
    invincibleDash: {
        id: 'invincibleDash',
        name: 'Ghost Dash',
        description: 'Invincibility during dash lasts twice as long',
        icon: '👻',
        category: 'dash',
        rarity: 'rare'
    },
    explosivePunch: {
        id: 'explosivePunch',
        name: 'Explosive Fists',
        description: 'Punches create a shockwave that pushes all nearby enemies',
        icon: '💣',
        category: 'punch',
        rarity: 'epic'
    },
    // NEW COMPLEMENTARY PERKS (economy balance)
    coinHoarder: {
        id: 'coinHoarder',
        name: 'Penny Pincher',
        description: '15% discount on all shop purchases',
        icon: '💰',
        category: 'passive',
        rarity: 'common'
    },
    deskVault: {
        id: 'deskVault',
        name: 'Desk Vault',
        description: 'Dash through desks (but not walls)',
        icon: '🪑',
        category: 'dash',
        rarity: 'rare'
    },
    ghostTrail: {
        id: 'ghostTrail',
        name: 'Spectral Echo',
        description: 'Ghost Walk power-ups last 50% longer',
        icon: '✨',
        category: 'passive',
        rarity: 'epic'
    },
    // NEW LEGENDARY PERKS (Floor 4+)
    ghostPhase: {
        id: 'ghostPhase',
        name: 'Phase Dash',
        description: 'Dash phases through walls and desks',
        icon: '👻',
        category: 'dash',
        rarity: 'legendary'
    },
    timeLord: {
        id: 'timeLord',
        name: 'Time Lord',
        description: '+10s at floor start, knockouts give +50% time',
        icon: '⏳',
        category: 'passive',
        rarity: 'legendary'
    },
    omnipunch: {
        id: 'omnipunch',
        name: 'Omnipunch',
        description: 'Punch hits ALL enemies in range simultaneously',
        icon: '💢',
        category: 'punch',
        rarity: 'legendary'
    },
    // === ULTIMATE PERKS (Floors 3-1 only, expensive for coin savers) ===
    unstoppable: {
        id: 'unstoppable',
        name: 'Unstoppable',
        description: 'Immune to stuns and knockbacks. Walk through fire unharmed.',
        icon: '🦾',
        category: 'passive',
        rarity: 'ultimate'
    },
    chronoShift: {
        id: 'chronoShift',
        name: 'Chrono Shift',
        description: 'Time slows 50% when timer drops below 10s',
        icon: '⏱️',
        category: 'passive',
        rarity: 'ultimate'
    },
    vaultMaster: {
        id: 'vaultMaster',
        name: 'Vault Master',
        description: 'Triple coins from ALL sources. +100 starting coins next floor.',
        icon: '💎',
        category: 'passive',
        rarity: 'ultimate'
    }
};

// Tier unlock floors - higher tier perks only appear on deeper floors
const PERK_TIER_UNLOCK = {
    common: 13,    // Available from floor 13 (start)
    rare: 10,      // Unlock at floor 10 or below
    epic: 7,       // Unlock at floor 7 or below
    legendary: 4,  // Unlock at floor 4 or below
    ultimate: 3    // Unlock at floor 3 or below (expensive late-game perks)
};

// Get number of shop slots based on floor (more choices on later floors)
function getShopSlotCount(floor) {
    if (floor >= 10) return 3;  // Floors 13-10: 3 choices
    if (floor >= 7) return 4;   // Floors 9-7: 4 choices
    if (floor >= 4) return 5;   // Floors 6-4: 5 choices
    return 6;                    // Floors 3-1: 6 choices (includes legendary)
}

// Get random perks for floor selection (no duplicates from current perks)
function getRandomPerkChoices(count = 3) {
    const currentFloor = gameState.floor;

    const availablePerks = Object.values(PERKS).filter(perk => {
        // Don't offer already-owned perks
        if (gameState.perks.includes(perk.id)) return false;

        // Check tier unlock based on floor
        const unlockFloor = PERK_TIER_UNLOCK[perk.rarity];
        if (unlockFloor === undefined) return true; // Unknown rarity, allow
        return currentFloor <= unlockFloor;
    });

    // Weight towards floor-appropriate tiers (bias toward newly unlocked tiers)
    const weighted = [];
    for (const perk of availablePerks) {
        let weight = 1;
        // Boost weight for tiers that just unlocked (exciting new options!)
        if (perk.rarity === 'rare' && currentFloor === 10) weight = 2;
        if (perk.rarity === 'epic' && currentFloor === 7) weight = 2;
        if (perk.rarity === 'legendary' && currentFloor === 4) weight = 3;
        // Legendary always has higher weight when available (reward for late game)
        if (perk.rarity === 'legendary') weight = 2;
        for (let i = 0; i < weight; i++) weighted.push(perk);
    }

    // Shuffle and take first 'count'
    const shuffled = weighted.sort(() => Math.random() - 0.5);
    // Remove duplicates (from weighting)
    const unique = [];
    const seen = new Set();
    for (const perk of shuffled) {
        if (!seen.has(perk.id)) {
            seen.add(perk.id);
            unique.push(perk);
        }
    }
    return unique.slice(0, Math.min(count, unique.length));
}

// === ENEMY TYPE SELECTION ===
// Determines what enemy type spawns based on floor and enemy index
function selectEnemyType(floor, enemyIndex) {
    // Floor 13-12: Only basic coworkers (tutorial)
    if (floor >= 12) {
        return 'coworker';
    }

    // Floor 11-10: Introduce interns (sprinters)
    if (floor >= 10) {
        return Math.random() < 0.3 ? 'intern' : 'coworker';
    }

    // Floor 9-7: Add IT Support (tanks)
    if (floor >= 7) {
        const roll = Math.random();
        if (roll < 0.2) return 'intern';
        if (roll < 0.35) return 'it_support';
        return 'coworker';
    }

    // Floor 6-4: Add HR Karen (exploders) and HR Assistant (frantic chasers)
    if (floor >= 4) {
        const roll = Math.random();
        if (roll < 0.2) return 'intern';
        if (roll < 0.35) return 'it_support';
        if (roll < 0.5) return 'hr_karen';
        if (roll < 0.6) return 'hr_assistant';
        return 'coworker';
    }

    // Floor 3-1: Full variety, more dangerous mix
    const roll = Math.random();
    if (roll < 0.2) return 'intern';       // 20% fast
    if (roll < 0.35) return 'it_support';  // 15% tank
    if (roll < 0.5) return 'hr_karen';     // 15% exploder
    if (roll < 0.65) return 'hr_assistant'; // 15% frantic
    return 'coworker';                      // 35% basic
}

// Game state
let gameState = {
    floor: 13,
    timer: 30,
    powerup: null,
    powerupTimer: 0,
    player: {
        x: 10, y: 10, speed: 1, stunned: 0,
        frame: 0, direction: 0,
        // === SMOOTH MOVEMENT: Visual position for lerping ===
        visualX: 10, visualY: 10, // Visual position (separate from logical grid position)
        hitCount: 0,  // Track number of times hit
        lastHitTime: 0,  // For resetting hit count after a while
        burning: 0,  // Burn effect timer (drains time 2x faster)
        shielded: 0,  // Shield timer (immune to damage from garden powerup)
        invincible: 0,  // Invincibility timer (rainbow star power!)
        companion: null,  // Dog companion from dog park (chases enemies)
        // === DASH SYSTEM (Core Fun Mechanic) ===
        dashCooldown: 0,      // Time until dash available again
        isDashing: false,     // Currently in dash animation
        dashInvincible: 0,    // Invincibility frames during dash
        lastDashDir: { x: 0, y: 1 },  // Last movement direction for dash
        // === PUNCH SYSTEM (Default Attack) ===
        punchCooldown: 0,     // Time until punch available again
        isPunching: false,    // Currently in punch animation
        // === WALL BREAKER (Secret Ability) ===
        wallBreakCooldown: 0  // Time until wall break available again
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
    // === NEW POWERUP STATES ===
    timeFreezeActive: false,
    timeFreezeTimer: 0,
    coinMagnetActive: false,
    coinMagnetTimer: 0,
    clone: null,  // Decoy that enemies chase
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
    floorStartTime: 0, // Timestamp for current floor start
    firstRunTutorial: false, // Structured first-run onboarding
    // Checkpoint system (Playtest Feature #2)
    lastCheckpoint: null,
    continuesRemaining: MAX_CONTINUES,
    // Celebration system (Playtest Feature #3)
    celebrations: [],  // Active celebration popups
    floorHits: 0,      // Hits taken this floor (for flawless tracking)
    // === FLOW SYSTEM (Momentum Meter) ===
    flow: 0,
    flowStateActive: false,
    lastFlowActionTime: 0,
    flowBonusLastFloor: 0,
    // Zen mode flag
    zenMode: false,
    // === NEW: Collectibles System (Dopamine Breadcrumbs) ===
    coins: [],              // Coins scattered throughout maze
    coinsCollected: 0,      // Coin value collected this run (for points)
    coinsCollectedCount: 0, // Actual number of coins collected (for display)
    coinCombo: 0,           // Rapid collection combo
    coinComboTimer: 0,      // Time remaining for combo
    // === NEW: Quick Run Mode ===
    quickRunMode: false,    // 5-floor quick run
    quickRunStartFloor: 5,   // Starting floor for quick run
    // === COMBO SYSTEM (Over-the-top engagement) ===
    killCombo: 0,           // Current kill combo multiplier
    killComboTimer: 0,      // Time remaining to continue combo (2 seconds)
    maxComboThisRun: 0,     // Highest combo achieved this run
    killStreak: 0,          // Total kills without taking damage
    lastKillTime: 0,        // Timestamp of last kill for combo timing
    // === SLOW-MO SYSTEM ===
    slowMoActive: false,    // Is slow-mo currently active
    slowMoTimer: 0,         // Time remaining in slow-mo
    slowMoFactor: 1.0,      // Current time scale (1.0 = normal, 0.3 = slow)
    // === VISUAL POLISH SYSTEM ===
    lastTimerSecond: -1,    // Track timer changes for pulse effect
    timerPulseScale: 1.0,   // Current timer scale for pulse animation
    enemySpawnFlash: 0,     // Flash when enemies spawn
    damageFlashTimer: 0,    // Red vignette flash when player takes damage
    // === PERK SYSTEM ===
    perks: [],              // Active perks for this run
    perkChoices: null,      // Current floor's perk choices (null = no choice pending)
    perksPicked: 0,         // Number of perks picked this run
    // === ENVIRONMENTAL HAZARDS ===
    sparkingWires: [],      // Electrical hazards that stun player
    coffeeSpills: [],       // Slippery hazards that slow player
    malfunctioningCopiers: [], // Spawn paper enemies periodically
    hazardSpawnTimer: 0,    // Timer for spawning new hazards
    // === EXIT TRACKING (for secret wall-breaker unlock) ===
    exitsUsedThisRun: new Set(), // Track which exit corners used (TL, TR, BL, BR)
    hasWallBreaker: false,   // Secret ability unlocked
    // === ENDLESS DESCENT MODE ===
    endlessMode: false,           // Is endless mode active
    endlessFloor: 0,              // Internal floor counter (1, 2, 3...)
    endlessScore: 0,              // Score for this endless run
    endlessDangerZone: null,      // Current danger zone modifier (blackout, swarm, etc.)
    endlessIsBreatherFloor: false, // Is current floor a breather floor
    endlessWallShiftTimer: 0,     // Timer for unstable floors wall shifting
    endlessBlackoutRadius: 0,     // Visibility radius for blackout floors
    endlessStats: {               // Stats tracked during endless run
        totalTimeBonus: 0,        // Accumulated time bonuses
        maxCombo: 0,              // Highest combo achieved
        perfectFloors: 0,         // Floors completed without taking damage
        milestoneBonus: 0,        // Bonus points from milestones
        milestonesReached: []     // Which milestones were reached
    },
    // === THE VAULT (Floor -100 Per-Run State) ===
    severanceAvailable: true,     // Can use Severance Package this run (resets each run)
    vaultAnimationPlaying: false, // Currently playing vault discovery animation
    showingVaultFloor: false      // Floor -100 has special vault exit rendering
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
    bestFloor: 13,  // Lowest floor reached
    totalPlayTime: 0,  // Total time playing
    // === NEW: Escape Points System (Meta-Progression) ===
    escapePoints: 0,        // Persistent currency earned from runs
    totalCoinsCollected: 0, // Lifetime coins collected
    // === ENDLESS DESCENT MODE STATS ===
    endlessBestFloor: 0,          // Lowest floor reached in endless
    endlessBestScore: 0,          // Highest score achieved in endless
    endlessTotalFloors: 0,        // All-time floors in endless
    endlessRuns: 0,               // Total endless attempts
    endlessAverageFloor: 0,       // Running average floor reached
    endlessMilestonesReached: [], // Which milestones have been hit (ever)
    // === THE VAULT (Floor -100 Secret) ===
    vaultDiscovered: false,       // One-time discovery flag
    vaultDiscoveredDate: null,    // When the vault was discovered
    hasSeverancePackage: false,   // Permanent weapon unlock
    vaultCoins: 0                 // Coins from vault (permanent)
};

// Load stats from localStorage
function loadStats() {
    try {
        const saved = localStorage.getItem('deadline_stats');
        if (saved) {
            const parsed = JSON.parse(saved);
            Object.assign(playerStats, parsed);
        }
    } catch (e) {
        console.log('Failed to load stats:', e);
    }
    // Ensure status theme packs unlock based on loaded stats
    checkStatusThemeUnlocks();
}

// Save stats to localStorage
function saveStats() {
    try {
        localStorage.setItem('deadline_stats', JSON.stringify(playerStats));
    } catch (e) {
        console.log('Failed to save stats:', e);
    }
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
    const vaultSection = playerStats.vaultDiscovered ? `
        <div class="vault-discovery-section">
            <h3>🔐 THE VAULT</h3>
            <div class="vault-info">
                <span class="vault-status">💼 SEVERANCE PACKAGE UNLOCKED</span>
                <span class="vault-date">Discovered: ${new Date(playerStats.vaultDiscoveredDate).toLocaleDateString()}</span>
                <span class="vault-coins">Vault Coins: ${playerStats.vaultCoins.toLocaleString()}</span>
            </div>
        </div>
    ` : '';

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
        ${vaultSection}
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
    try {
        localStorage.setItem('deadline_dailyChallenge', JSON.stringify(data));
    } catch (e) {
        console.log('Failed to save daily challenge:', e);
    }
}

// Load daily challenge data
function loadDailyChallengeData() {
    try {
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
    } catch (e) {
        console.log('Failed to load daily challenge:', e);
        dailyChallenge.bestTime = null;
        dailyChallenge.completed = false;
        dailyChallenge.leaderboard = [];
    }
}

// Get seeded random (uses daily seed when in challenge mode, Math.random otherwise)
function gameRandom() {
    if (dailyChallenge.active && dailyChallenge.random) {
        return dailyChallenge.random();
    }
    return Math.random();
}

function getWeeklyModifiers() {
    if (dailyChallenge.active && gameState && gameState.weeklyChallenge) {
        return gameState.weeklyChallenge.modifiers || null;
    }
    return null;
}

function findValidPowerupTile(options = {}) {
    const minDistToPlayer = options.minDistToPlayer ?? 3;
    const maxDistToPlayer = options.maxDistToPlayer ?? 10;
    const minDistToExits = options.minDistToExits ?? 2;

    const tiles = [];
    const minX = Math.max(1, gameState.player.x - maxDistToPlayer);
    const maxX = Math.min(MAP_WIDTH - 2, gameState.player.x + maxDistToPlayer);
    const minY = Math.max(1, gameState.player.y - maxDistToPlayer);
    const maxY = Math.min(MAP_HEIGHT - 2, gameState.player.y + maxDistToPlayer);

    for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
            const distToPlayer = Math.abs(x - gameState.player.x) + Math.abs(y - gameState.player.y);
            if (distToPlayer < minDistToPlayer || distToPlayer > maxDistToPlayer) continue;
            if (gameState.maze[y][x] !== TILE.FLOOR) continue;

            let nearExit = false;
            for (const exit of gameState.exits) {
                const distToExit = Math.abs(x - exit.x) + Math.abs(y - exit.y);
                if (distToExit < minDistToExits) {
                    nearExit = true;
                    break;
                }
            }
            if (nearExit) continue;

            const occupied = gameState.powerups.some(p => p.x === x && p.y === y);
            if (occupied) continue;

            tiles.push({ x, y });
        }
    }

    if (tiles.length === 0) return null;
    return tiles[Math.floor(gameRandom() * tiles.length)];
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

    gameState.floor = 13;
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
    // === FLOW SYSTEM: Reset for new run ===
    gameState.flow = 0;
    gameState.flowStateActive = false;
    gameState.lastFlowActionTime = 0;
    gameState.flowBonusLastFloor = 0;
    gameState.runStartTime = Date.now();
    gameState.runTotalTime = 0;
    gameState.floorTimes = [];
    gameState.floorStartTime = Date.now();
    gameState.firstRunTutorial = false;
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
let keyPressTime = {}; // Track when each key was first pressed
let keyMoved = {}; // Track if a key has already triggered a move (for tap detection)
let lastMove = 0;
const MOVE_DELAY = 100; // Reduced from 150ms for snappier, more precise movement
const HOLD_THRESHOLD = 180; // Must hold key this long (ms) before continuous movement kicks in

// ============================================
// FLOW SYSTEM (Momentum Meter)
// ============================================
const FLOW_MAX = 100;
const FLOW_GAIN_MOVE = 6;
const FLOW_GAIN_DASH = 10;
const FLOW_DECAY_PER_SEC = 12;
const FLOW_IDLE_GRACE_MS = 600;

function addFlow(amount) {
    if (!gameState || gameState.gameOver || gameState.won) return;
    gameState.flow = Math.min(FLOW_MAX, (gameState.flow || 0) + amount);
    gameState.lastFlowActionTime = Date.now();
    if (gameState.flow >= FLOW_MAX && !gameState.flowStateActive) {
        gameState.flowStateActive = true;
        showCelebration('flowState');
    }
}

function breakFlow() {
    if (!gameState) return;
    gameState.flow = 0;
    gameState.flowStateActive = false;
}

function updateFlow(deltaTime) {
    if (!gameState || !gameState.started || gameState.gameOver || gameState.won) return;
    const now = Date.now();
    const lastAction = gameState.lastFlowActionTime || 0;
    if (now - lastAction > FLOW_IDLE_GRACE_MS) {
        const decay = FLOW_DECAY_PER_SEC * deltaTime;
        gameState.flow = Math.max(0, (gameState.flow || 0) - decay);
        if (gameState.flow < FLOW_MAX) gameState.flowStateActive = false;
    }
}

// Calculate effective move delay with perks and powerups
function getEffectiveMoveDelay() {
    let delay = MOVE_DELAY;
    if (gameState && gameState.perks && gameState.perks.includes('speedBoost')) delay *= 0.75; // 25% faster
    if (gameState && gameState.powerup === 'speed') delay *= 0.5; // Speed powerup stacks
    if (gameState && gameState.powerup === 'overclock') delay *= 0.4; // Panic speed boost
    if (gameState && gameState.playerSlowed) delay *= 1.5; // Coffee spill slow effect
    if (gameState && gameState.flow) {
        const flowBoost = Math.min(gameState.flow, FLOW_MAX) / FLOW_MAX;
        delay *= (1 - (flowBoost * 0.2)); // Up to 20% faster at full flow
    }
    return delay;
}

// ============================================
// GAMEPAD / CONTROLLER SUPPORT
// ============================================
const gamepadState = {
    connected: false,
    index: -1,
    lastInput: {
        up: false, down: false, left: false, right: false,
        // All action buttons mapped to standard gamepad layout
        dash: false,        // A (Xbox) / X (PS) - Button 0
        punch: false,       // X (Xbox) / Square (PS) - Button 2
        action: false,      // B (Xbox) / Circle (PS) - Button 1
        wallBreak: false,   // Y (Xbox) / Triangle (PS) - Button 3
        severance: false,   // LB (Xbox) / L1 (PS) - Button 4
        pause: false        // Start - Button 9
    },
    deadzone: 0.3,
    buttonCooldown: 0
};

// ============================================
// HAPTICS / RUMBLE SUPPORT
// ============================================
const Haptics = {
    enabled: true,
    last: {},
    strength: 1.0,

    getActiveGamepad() {
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        for (let i = 0; i < gamepads.length; i++) {
            const gp = gamepads[i];
            if (gp && gp.connected && (gp.vibrationActuator || (gp.hapticActuators && gp.hapticActuators[0]))) {
                return gp;
            }
        }
        return null;
    },

    _clamp(v, min, max) {
        return Math.min(max, Math.max(min, v));
    },

    _play(strong, weak, duration) {
        const gp = this.getActiveGamepad();
        if (!gp) return;
        const act = gp.vibrationActuator || (gp.hapticActuators && gp.hapticActuators[0]);
        if (!act) return;
        if (this.strength <= 0) return;
        const dur = this._clamp(duration, 20, 1000);
        const s = this._clamp(strong * this.strength, 0, 1);
        const w = this._clamp(weak * this.strength, 0, 1);

        if (act.playEffect) {
            act.playEffect('dual-rumble', {
                duration: dur,
                strongMagnitude: s,
                weakMagnitude: w
            }).catch(() => {});
        } else if (act.pulse) {
            act.pulse(this._clamp(Math.max(s, w), 0, 1), dur);
        }
    },

    pulse(name, strong, weak, duration, minInterval = 80) {
        if (!this.enabled) return;
        const now = performance.now();
        if (this.last[name] && now - this.last[name] < minInterval) return;
        this.last[name] = now;
        this._play(strong, weak, duration);
    },

    sequence(name, steps, minInterval = 200) {
        if (!this.enabled) return;
        const now = performance.now();
        if (this.last[name] && now - this.last[name] < minInterval) return;
        this.last[name] = now;

        let offset = 0;
        steps.forEach((step, i) => {
            const dur = step.duration || 80;
            const delay = step.delayAfter !== undefined ? step.delayAfter : 40;
            setTimeout(() => this._play(step.strong || 0, step.weak || 0, dur), offset);
            offset += dur + delay;
        });
    }
};

// ============================================
// GAMEPAD MENU NAVIGATION
// ============================================
const menuNavigation = {
    enabled: false,
    buttons: [],
    currentIndex: 0,
    lastNavTime: 0,
    navDelay: 180,  // ms between navigation inputs
    lastAButton: false,
    lastBButton: false,
    lastUpDown: false,
    lastLeftRight: false,
    lastMenuVisible: false  // Track menu visibility transitions
};

// Reset menu navigation state (called on menu close or transitions)
function resetMenuNavigationState() {
    menuNavigation.enabled = false;
    menuNavigation.buttons = [];
    menuNavigation.currentIndex = 0;
    menuNavigation.lastAButton = false;
    menuNavigation.lastBButton = false;
    menuNavigation.lastUpDown = false;
    menuNavigation.lastLeftRight = false;
}

// Helper to check if element is visible (works with both CSS and inline styles)
function isElementVisible(el) {
    if (!el) return false;
    const style = getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
}

// Get navigable buttons for current menu state
function getMenuButtons() {
    const messageEl = document.getElementById('message');
    const mainSettingsEl = document.getElementById('mainSettingsMenu');
    const howToPlayEl = document.getElementById('howToPlayMenu');
    const dailyChallengeEl = document.getElementById('dailyChallengeMenu');
    const settingsMenuEl = document.getElementById('settingsMenu');
    const milestonesMenuEl = document.getElementById('milestonesMenu');
    const perkSelectionEl = document.getElementById('perkSelection');
    const pauseScreenEl = document.getElementById('pauseScreen');
    const gameOverEl = document.getElementById('gameOver');
    const victoryEl = document.getElementById('victory');

    // Check which menu is visible (order matters - check sub-menus first)

    // Perk selection screen (between floors)
    if (perkSelectionEl && isElementVisible(perkSelectionEl)) {
        const buttons = [];
        // Get affordable perk cards (those without data-disabled="true")
        const perkCards = perkSelectionEl.querySelectorAll('.perk-card:not([data-disabled="true"])');
        perkCards.forEach(card => buttons.push(card));
        // Get the skip button
        const skipBtn = perkSelectionEl.querySelector('button');
        if (skipBtn && isElementVisible(skipBtn)) buttons.push(skipBtn);
        return buttons;
    }

    // Pause screen
    if (pauseScreenEl && isElementVisible(pauseScreenEl)) {
        return Array.from(pauseScreenEl.querySelectorAll('button')).filter(btn => isElementVisible(btn));
    }

    // Game over screen
    if (gameOverEl && isElementVisible(gameOverEl)) {
        return Array.from(gameOverEl.querySelectorAll('button')).filter(btn => isElementVisible(btn));
    }

    // Victory screen
    if (victoryEl && isElementVisible(victoryEl)) {
        return Array.from(victoryEl.querySelectorAll('button')).filter(btn => isElementVisible(btn));
    }

    // Settings menu (Display, Audio, Controls, etc.)
    if (settingsMenuEl && isElementVisible(settingsMenuEl)) {
        const buttons = [];
        // Get all interactive elements in settings
        const interactives = settingsMenuEl.querySelectorAll('button, select, input[type="checkbox"], input[type="range"]');
        interactives.forEach(el => {
            // Check if element is visible and not disabled
            if (isElementVisible(el) && !el.disabled) {
                buttons.push(el);
            }
        });
        return buttons;
    }

    // Milestones menu
    if (milestonesMenuEl && isElementVisible(milestonesMenuEl)) {
        return Array.from(milestonesMenuEl.querySelectorAll('button')).filter(btn => isElementVisible(btn));
    }

    // Main settings menu (game modes, etc.)
    if (mainSettingsEl && isElementVisible(mainSettingsEl)) {
        // Settings menu - get all menu-option-btn buttons plus back button
        const buttons = Array.from(mainSettingsEl.querySelectorAll('.menu-option-btn, .back-btn'));
        return buttons.filter(btn => isElementVisible(btn));
    }

    if (howToPlayEl && isElementVisible(howToPlayEl)) {
        return Array.from(howToPlayEl.querySelectorAll('.back-btn, button')).filter(btn => isElementVisible(btn));
    }

    if (dailyChallengeEl && isElementVisible(dailyChallengeEl)) {
        return Array.from(dailyChallengeEl.querySelectorAll('button')).filter(btn => isElementVisible(btn));
    }

    if (messageEl && isElementVisible(messageEl)) {
        // Main menu - get primary buttons, settings gear, and difficulty slider
        const buttons = [];

        // Settings gear icon
        const settingsGear = document.querySelector('.corner-settings-btn');
        if (settingsGear && isElementVisible(settingsGear)) buttons.push(settingsGear);

        // Resume button (if visible)
        const resumeBtn = document.getElementById('menuResumeBtn');
        if (resumeBtn && isElementVisible(resumeBtn)) {
            buttons.push(resumeBtn);
        }

        // Play button
        const playBtn = document.getElementById('menuPlayBtn');
        if (playBtn && isElementVisible(playBtn)) buttons.push(playBtn);

        // Difficulty slider (special handling)
        const slider = document.getElementById('difficultySlider');
        if (slider && isElementVisible(slider)) buttons.push(slider);

        return buttons;
    }

    return [];
}

// Update visual focus on menu buttons
function updateMenuFocus() {
    // Remove focus from all buttons
    document.querySelectorAll('.gamepad-focus').forEach(el => {
        el.classList.remove('gamepad-focus');
    });

    if (menuNavigation.buttons.length > 0 && menuNavigation.currentIndex < menuNavigation.buttons.length) {
        const focusedBtn = menuNavigation.buttons[menuNavigation.currentIndex];
        focusedBtn.classList.add('gamepad-focus');

        // Ensure the button is visible (scroll into view if needed)
        if (focusedBtn.scrollIntoViewIfNeeded) {
            focusedBtn.scrollIntoViewIfNeeded();
        } else if (focusedBtn.scrollIntoView) {
            focusedBtn.scrollIntoView({ block: 'nearest' });
        }
    }
}

// Handle gamepad input for menu navigation
function updateGamepadMenuNavigation() {
    if (!gamepadState.connected) return;

    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gamepad = gamepads[gamepadState.index];
    if (!gamepad) return;

    // Check if any menu is visible (using helper for CSS compatibility)
    const messageEl = document.getElementById('message');
    const mainSettingsEl = document.getElementById('mainSettingsMenu');
    const howToPlayEl = document.getElementById('howToPlayMenu');
    const dailyChallengeEl = document.getElementById('dailyChallengeMenu');
    const settingsMenuEl = document.getElementById('settingsMenu');
    const milestonesMenuEl = document.getElementById('milestonesMenu');
    const perkSelectionEl = document.getElementById('perkSelection');
    const pauseScreenEl = document.getElementById('pauseScreen');
    const gameOverEl = document.getElementById('gameOver');
    const victoryEl = document.getElementById('victory');

    const menuVisible = isElementVisible(messageEl) ||
                        isElementVisible(mainSettingsEl) ||
                        isElementVisible(howToPlayEl) ||
                        isElementVisible(dailyChallengeEl) ||
                        isElementVisible(settingsMenuEl) ||
                        isElementVisible(milestonesMenuEl) ||
                        isElementVisible(perkSelectionEl) ||
                        isElementVisible(pauseScreenEl) ||
                        isElementVisible(gameOverEl) ||
                        isElementVisible(victoryEl);

    // Reset input flags when menu visibility changes to avoid ghost inputs
    if (menuVisible && !menuNavigation.lastMenuVisible) {
        menuNavigation.lastAButton = false;
        menuNavigation.lastBButton = false;
        menuNavigation.lastUpDown = false;
        menuNavigation.lastLeftRight = false;
    }
    menuNavigation.lastMenuVisible = menuVisible;

    if (!menuVisible) {
        resetMenuNavigationState();
        return;
    }

    // Refresh button list if menu just became visible
    if (!menuNavigation.enabled) {
        menuNavigation.enabled = true;
        menuNavigation.buttons = getMenuButtons();
        menuNavigation.currentIndex = 0;
        updateMenuFocus();
    }

    const now = Date.now();
    const canNavigate = (now - menuNavigation.lastNavTime) > menuNavigation.navDelay;

    // Read gamepad inputs
    const leftStickY = gamepad.axes[1] || 0;
    const leftStickX = gamepad.axes[0] || 0;
    const dpadUp = gamepad.buttons[12] ? gamepad.buttons[12].pressed : false;
    const dpadDown = gamepad.buttons[13] ? gamepad.buttons[13].pressed : false;
    const dpadLeft = gamepad.buttons[14] ? gamepad.buttons[14].pressed : false;
    const dpadRight = gamepad.buttons[15] ? gamepad.buttons[15].pressed : false;
    const aButton = gamepad.buttons[0] ? gamepad.buttons[0].pressed : false;
    const bButton = gamepad.buttons[1] ? gamepad.buttons[1].pressed : false;

    const upPressed = dpadUp || leftStickY < -gamepadState.deadzone;
    const downPressed = dpadDown || leftStickY > gamepadState.deadzone;
    const leftPressed = dpadLeft || leftStickX < -gamepadState.deadzone;
    const rightPressed = dpadRight || leftStickX > gamepadState.deadzone;

    // Navigate up/down
    if (canNavigate && (upPressed || downPressed) && !menuNavigation.lastUpDown) {
        menuNavigation.buttons = getMenuButtons(); // Refresh in case visibility changed

        if (upPressed && menuNavigation.currentIndex > 0) {
            menuNavigation.currentIndex--;
            menuNavigation.lastNavTime = now;
            updateMenuFocus();
            Haptics.pulse('menuNav', 0.08, 0.12, 40, 80);
        } else if (downPressed && menuNavigation.currentIndex < menuNavigation.buttons.length - 1) {
            menuNavigation.currentIndex++;
            menuNavigation.lastNavTime = now;
            updateMenuFocus();
            Haptics.pulse('menuNav', 0.08, 0.12, 40, 80);
        }
    }
    menuNavigation.lastUpDown = upPressed || downPressed;

    // Handle left/right for perk selection (horizontal layout)
    if (perkSelectionEl && isElementVisible(perkSelectionEl)) {
        if (canNavigate && (leftPressed || rightPressed) && !menuNavigation.lastLeftRight) {
            menuNavigation.buttons = getMenuButtons();

            if (leftPressed && menuNavigation.currentIndex > 0) {
                menuNavigation.currentIndex--;
                menuNavigation.lastNavTime = now;
                updateMenuFocus();
                Haptics.pulse('menuNav', 0.08, 0.12, 40, 80);
            } else if (rightPressed && menuNavigation.currentIndex < menuNavigation.buttons.length - 1) {
                menuNavigation.currentIndex++;
                menuNavigation.lastNavTime = now;
                updateMenuFocus();
                Haptics.pulse('menuNav', 0.08, 0.12, 40, 80);
            }
        }
    }

    // Handle left/right for sliders and selects
    const focusedBtn = menuNavigation.buttons[menuNavigation.currentIndex];
    if (focusedBtn) {
        const tagName = focusedBtn.tagName.toUpperCase();
        const inputType = focusedBtn.type ? focusedBtn.type.toLowerCase() : '';

        // Range sliders (difficulty, volume, etc.)
        if (tagName === 'INPUT' && inputType === 'range') {
            if (canNavigate && (leftPressed || rightPressed) && !menuNavigation.lastLeftRight) {
                const slider = focusedBtn;
                const currentVal = parseInt(slider.value);
                const step = parseInt(slider.step) || 1;
                if (leftPressed && currentVal > parseInt(slider.min)) {
                    slider.value = currentVal - step;
                    slider.dispatchEvent(new Event('input'));
                    slider.dispatchEvent(new Event('change'));
                    menuNavigation.lastNavTime = now;
                } else if (rightPressed && currentVal < parseInt(slider.max)) {
                    slider.value = currentVal + step;
                    slider.dispatchEvent(new Event('input'));
                    slider.dispatchEvent(new Event('change'));
                    menuNavigation.lastNavTime = now;
                }
            }
        }

        // Select dropdowns - left/right cycles options
        if (tagName === 'SELECT') {
            if (canNavigate && (leftPressed || rightPressed) && !menuNavigation.lastLeftRight) {
                const currentIndex = focusedBtn.selectedIndex;
                const optionsCount = focusedBtn.options.length;
                if (leftPressed && currentIndex > 0) {
                    focusedBtn.selectedIndex = currentIndex - 1;
                    focusedBtn.dispatchEvent(new Event('change'));
                    menuNavigation.lastNavTime = now;
                } else if (rightPressed && currentIndex < optionsCount - 1) {
                    focusedBtn.selectedIndex = currentIndex + 1;
                    focusedBtn.dispatchEvent(new Event('change'));
                    menuNavigation.lastNavTime = now;
                }
            }
        }
    }
    menuNavigation.lastLeftRight = leftPressed || rightPressed;

    // A button - activate/click the focused button
    if (aButton && !menuNavigation.lastAButton) {
        if (focusedBtn) {
            const tagName = focusedBtn.tagName.toUpperCase();
            const inputType = focusedBtn.type ? focusedBtn.type.toLowerCase() : '';

            if (tagName === 'INPUT' && inputType === 'checkbox') {
                // Toggle checkbox
                focusedBtn.checked = !focusedBtn.checked;
                focusedBtn.dispatchEvent(new Event('change'));
            } else if (tagName === 'SELECT') {
                // Cycle through select options
                const currentIndex = focusedBtn.selectedIndex;
                const nextIndex = (currentIndex + 1) % focusedBtn.options.length;
                focusedBtn.selectedIndex = nextIndex;
                focusedBtn.dispatchEvent(new Event('change'));
            } else if (tagName === 'INPUT' && inputType === 'range') {
                // Range sliders handled by left/right, skip A button
            } else if (tagName === 'BUTTON') {
                focusedBtn.click();
                Haptics.pulse('menuSelect', 0.2, 0.25, 60, 120);
                // Refresh buttons after click (menu may have changed)
                setTimeout(() => {
                    menuNavigation.buttons = getMenuButtons();
                    menuNavigation.currentIndex = 0;
                    updateMenuFocus();
                }, 100);
            } else if (tagName === 'DIV' && focusedBtn.classList.contains('perk-card')) {
                // Perk card - click if not disabled
                if (focusedBtn.dataset.disabled !== 'true') {
                    focusedBtn.click();
                    Haptics.pulse('menuSelect', 0.2, 0.25, 60, 120);
                }
            }
        }
    }
    menuNavigation.lastAButton = aButton;

    // B button - go back (click back button if available, or close menu)
    if (bButton && !menuNavigation.lastBButton) {
        const backBtn = document.querySelector('.back-btn:not([style*="display: none"])');
        if (backBtn && backBtn.offsetParent !== null) {
            backBtn.click();
            Haptics.pulse('menuBack', 0.18, 0.2, 60, 120);
            setTimeout(() => {
                menuNavigation.buttons = getMenuButtons();
                menuNavigation.currentIndex = 0;
                updateMenuFocus();
            }, 100);
        } else {
            // Fallback actions for screens without back buttons
            if (pauseScreenEl && isElementVisible(pauseScreenEl)) {
                // B on pause screen = resume game (click first button which is Resume)
                const resumeBtn = pauseScreenEl.querySelector('button');
                if (resumeBtn) {
                    resumeBtn.click();
                    Haptics.pulse('menuBack', 0.18, 0.2, 60, 120);
                }
            } else if (perkSelectionEl && isElementVisible(perkSelectionEl)) {
                // B on perk selection = skip shop
                skipShop();
                Haptics.pulse('menuBack', 0.18, 0.2, 60, 120);
            }
        }
    }
    menuNavigation.lastBButton = bButton;
}

// Input abstraction - combines keyboard and gamepad
const input = {
    up: false,
    down: false,
    left: false,
    right: false,
    action: false,
    pause: false
};

// === UNIFIED INPUT ACTIONS SYSTEM ===
// All actions that can be triggered by any input method (keyboard, gamepad, touch)
// This allows the game to be fully playable on any platform
const inputActions = {
    // Movement (continuous while held)
    up: false,
    down: false,
    left: false,
    right: false,
    // Actions (trigger once per press)
    dash: false,
    punch: false,
    action: false,      // Use powerup
    wallBreak: false,   // Secret ability (if unlocked)
    severance: false,   // Ultimate ability (if unlocked)
    pause: false,
    // Internal: track what was pressed last frame to detect rising edge
    _lastDash: false,
    _lastPunch: false,
    _lastAction: false,
    _lastWallBreak: false,
    _lastSeverance: false,
    _lastPause: false
};

// Touch input state (mobile)
const touchState = {
    up: false,
    down: false,
    left: false,
    right: false,
    // Action triggers (set to true on tap, consumed by game loop)
    dashTap: false,
    punchTap: false,
    actionTap: false,
    wallBreakTap: false,
    severanceTap: false,
    pauseTap: false
};

let lastTouchActionTime = 0;

function initTouchControls() {
    const hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    const controls = document.getElementById('touchControls');
    const supportsPointer = 'PointerEvent' in window;
    if (controls && hasTouch) {
        controls.style.display = 'flex';
        controls.style.pointerEvents = 'auto';
        controls.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    }

    const bindHold = (id, setState) => {
        const el = document.getElementById(id);
        if (!el) return;
        const start = (e) => {
            e.preventDefault();
            if (e.pointerId !== undefined && el.setPointerCapture) {
                el.setPointerCapture(e.pointerId);
            }
            setState(true);
        };
        const end = (e) => { e.preventDefault(); setState(false); };
        if (supportsPointer) {
            el.addEventListener('pointerdown', start);
            el.addEventListener('pointerup', end);
            el.addEventListener('pointercancel', end);
            el.addEventListener('pointerleave', end);
        } else {
            el.addEventListener('touchstart', start, { passive: false });
            el.addEventListener('touchend', end, { passive: false });
            el.addEventListener('touchcancel', end, { passive: false });
            el.addEventListener('mousedown', start);
            el.addEventListener('mouseup', end);
            el.addEventListener('mouseleave', end);
        }
    };

    const bindTap = (id, handler) => {
        const el = document.getElementById(id);
        if (!el) return;
        const tap = (e) => {
            e.preventDefault();
            const now = Date.now();
            if (now - lastTouchActionTime < 120) return;
            lastTouchActionTime = now;
            handler();
        };
        if (supportsPointer) {
            el.addEventListener('pointerdown', tap);
        } else {
            el.addEventListener('touchstart', tap, { passive: false });
            el.addEventListener('mousedown', tap);
        }
    };

    bindHold('touchUp', (v) => { touchState.up = v; });
    bindHold('touchDown', (v) => { touchState.down = v; });
    bindHold('touchLeft', (v) => { touchState.left = v; });
    bindHold('touchRight', (v) => { touchState.right = v; });

    // Action button taps - set flag for unified input system
    bindTap('touchDash', () => { touchState.dashTap = true; });
    bindTap('touchPunch', () => { touchState.punchTap = true; });
    bindTap('touchPower', () => { touchState.actionTap = true; });
    bindTap('touchWallBreak', () => { touchState.wallBreakTap = true; });
    bindTap('touchSeverance', () => { touchState.severanceTap = true; });
    bindTap('touchPause', () => { touchState.pauseTap = true; });
}

// Update visibility of special ability touch buttons based on unlock state
function updateSpecialTouchButtons() {
    const wallBreakBtn = document.getElementById('touchWallBreak');
    const severanceBtn = document.getElementById('touchSeverance');

    if (wallBreakBtn) {
        wallBreakBtn.style.display = gameState.hasWallBreaker ? 'flex' : 'none';
    }
    if (severanceBtn) {
        // Show severance button if unlocked AND available this run
        const showSeverance = playerStats.hasSeverancePackage && gameState.severanceAvailable;
        severanceBtn.style.display = showSeverance ? 'flex' : 'none';
    }
}

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

    // === UNIFIED ACTION BUTTON MAPPING ===
    // Standard gamepad layout (works for Xbox, PlayStation, Switch Pro, etc.)
    // Button 0: A (Xbox) / X (PS) / B (Switch) - DASH (primary action)
    // Button 1: B (Xbox) / Circle (PS) / A (Switch) - USE POWERUP
    // Button 2: X (Xbox) / Square (PS) / Y (Switch) - PUNCH
    // Button 3: Y (Xbox) / Triangle (PS) / X (Switch) - WALL BREAK (if unlocked)
    // Button 4: LB (Xbox) / L1 (PS) / L (Switch) - SEVERANCE (if unlocked)
    // Button 5: RB (Xbox) / R1 (PS) / R (Switch) - (unused, could be alt dash)
    // Button 9: Start / Options - PAUSE
    const btn = (i) => gamepad.buttons[i] ? gamepad.buttons[i].pressed : false;

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

    // Action buttons
    gamepadState.lastInput.dash = btn(0) || btn(5);  // A or RB for dash
    gamepadState.lastInput.punch = btn(2);            // X for punch
    gamepadState.lastInput.action = btn(1);           // B for use powerup
    gamepadState.lastInput.wallBreak = btn(3);        // Y for wall break
    gamepadState.lastInput.severance = btn(4);        // LB for severance
    gamepadState.lastInput.pause = btn(9);            // Start for pause
}

function getInput() {
    // Update gamepad state
    updateGamepadInput();

    // Helper to check if any key in the binding is pressed
    const isKeyPressed = (binding) => {
        if (!binding) return false;
        return binding.some(key => keys[key]);
    };

    // Helper to check if direction key should trigger movement
    // Returns true if: key is pressed AND (hasn't moved yet OR held long enough for continuous movement)
    const shouldMove = (binding) => {
        if (!binding) return false;
        const now = Date.now();
        return binding.some(key => {
            if (!keys[key]) return false;
            const pressTime = keyPressTime[key] || 0;
            const holdDuration = now - pressTime;
            const hasMoved = keyMoved[key];

            // Allow move if: never moved yet, OR held past threshold for continuous movement
            return !hasMoved || holdDuration >= HOLD_THRESHOLD;
        });
    };

    // Get control bindings (use defaults if not set)
    const controls = settings.controls || DEFAULT_SETTINGS.controls;

    // Combine keyboard (with remappable controls) and gamepad inputs
    // Direction keys use tap/hold detection for precise control
    input.up = shouldMove(controls.up) || gamepadState.lastInput.up || touchState.up;
    input.down = shouldMove(controls.down) || gamepadState.lastInput.down || touchState.down;
    input.left = shouldMove(controls.left) || gamepadState.lastInput.left || touchState.left;
    input.right = shouldMove(controls.right) || gamepadState.lastInput.right || touchState.right;
    input.action = isKeyPressed(controls.action) || gamepadState.lastInput.action;
    input.pause = isKeyPressed(controls.pause) || gamepadState.lastInput.pause;

    return input;
}

// === UNIFIED INPUT ACTIONS UPDATE ===
// Call this every frame to update the inputActions state
// Handles edge detection (rising edge) so actions only trigger once per press
function updateInputActions() {
    updateGamepadInput();

    // Helper to check if any key in the binding is pressed
    const isKeyPressed = (binding) => {
        if (!binding) return false;
        return binding.some(key => keys[key]);
    };

    // Helper for direction movement (tap/hold detection)
    const shouldMove = (binding) => {
        if (!binding) return false;
        const now = Date.now();
        return binding.some(key => {
            if (!keys[key]) return false;
            const pressTime = keyPressTime[key] || 0;
            const holdDuration = now - pressTime;
            const hasMoved = keyMoved[key];
            return !hasMoved || holdDuration >= HOLD_THRESHOLD;
        });
    };

    const controls = settings.controls || DEFAULT_SETTINGS.controls;

    // === MOVEMENT (continuous while held) ===
    inputActions.up = shouldMove(controls.up) || gamepadState.lastInput.up || touchState.up;
    inputActions.down = shouldMove(controls.down) || gamepadState.lastInput.down || touchState.down;
    inputActions.left = shouldMove(controls.left) || gamepadState.lastInput.left || touchState.left;
    inputActions.right = shouldMove(controls.right) || gamepadState.lastInput.right || touchState.right;

    // === ACTION BUTTONS (edge detection - only trigger on rising edge) ===
    // Combine all input sources for each action
    const dashPressed = keys['Space'] || gamepadState.lastInput.dash || touchState.dashTap;
    const punchPressed = keys['KeyZ'] || keys['KeyX'] || gamepadState.lastInput.punch || touchState.punchTap;
    const actionPressed = isKeyPressed(controls.action) || gamepadState.lastInput.action || touchState.actionTap;
    const wallBreakPressed = keys['ShiftLeft'] || keys['ShiftRight'] || gamepadState.lastInput.wallBreak || touchState.wallBreakTap;
    const severancePressed = keys['KeyV'] || gamepadState.lastInput.severance || touchState.severanceTap;
    const pausePressed = isKeyPressed(controls.pause) || gamepadState.lastInput.pause || touchState.pauseTap;

    // Rising edge detection: only true on the frame the button becomes pressed
    inputActions.dash = dashPressed && !inputActions._lastDash;
    inputActions.punch = punchPressed && !inputActions._lastPunch;
    inputActions.action = actionPressed && !inputActions._lastAction;
    inputActions.wallBreak = wallBreakPressed && !inputActions._lastWallBreak;
    inputActions.severance = severancePressed && !inputActions._lastSeverance;
    inputActions.pause = pausePressed && !inputActions._lastPause;

    // Store current state for next frame's edge detection
    inputActions._lastDash = dashPressed;
    inputActions._lastPunch = punchPressed;
    inputActions._lastAction = actionPressed;
    inputActions._lastWallBreak = wallBreakPressed;
    inputActions._lastSeverance = severancePressed;
    inputActions._lastPause = pausePressed;

    // Clear touch tap flags (they're consumed after one frame)
    touchState.dashTap = false;
    touchState.punchTap = false;
    touchState.actionTap = false;
    touchState.wallBreakTap = false;
    touchState.severanceTap = false;
    touchState.pauseTap = false;

    return inputActions;
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
    speedBonus: { text: '+{coins} SPEED BONUS!', color: '#2ecc71' },
    flawless: { text: 'FLAWLESS!', color: '#4d96ff' },
    flawlessBonus: { text: '+{coins} FLAWLESS BONUS!', color: '#3498db' },
    domination: { text: '👑 DOMINATION! +50', color: '#ffd700' },
    criticalHit: { text: '💥 CRITICAL HIT!', color: '#ffd700' },
    niceUse: { text: 'NICE!', color: '#9b59b6' },
    checkpoint: { text: 'CHECKPOINT!', color: '#00d2d3' },
    // === NEW: Close Call & Coin Celebrations ===
    closeCall: { text: 'CLOSE CALL!', color: '#ff4757' },
    clutchEscape: { text: 'CLUTCH!', color: '#ffa502' },
    coinStreak: { text: 'COIN STREAK x{n}!', color: '#f1c40f' },
    coinMaster: { text: 'COIN MASTER x10!', color: '#f39c12' },
    coinFrenzy: { text: '💰 COIN FRENZY x20+!', color: '#ffd700' },
    // === PUNCH SYSTEM CELEBRATIONS ===
    timeBonus: { text: '+{seconds}s TIME!', color: '#2ecc71' },
    multiPunch: { text: 'MULTI-HIT x{count}!', color: '#e74c3c' },
    dashThrough: { text: 'PHASED!', color: '#00d2d3' },
    // === ELECTRIC CHAIN CELEBRATIONS ===
    electricChain: { text: '⚡ ZAP CHAIN x{count}!', color: '#00d4ff' },
    // === COMBO SYSTEM CELEBRATIONS ===
    comboKill: { text: 'x{combo} COMBO! +{time}s', color: '#ffd700' },
    comboBreak: { text: 'COMBO LOST', color: '#666' },
    // === KILL STREAK CELEBRATIONS ===
    rampage: { text: '🔥 RAMPAGE!', color: '#ff6b00' },
    unstoppable: { text: '⚡ UNSTOPPABLE!', color: '#ff00ff' },
    godlike: { text: '👑 GODLIKE!', color: '#ffd700' },
    massacre: { text: '💀 MASSACRE x{count}!', color: '#ff0000' },
    // === PERK CELEBRATIONS ===
    perkPicked: { text: '✨ {perk}', color: '#00d2d3' },
    perkPurchased: { text: '💰 {perk} (-{price})', color: '#f1c40f' },
    shopSkipped: { text: 'COINS SAVED!', color: '#888' },
    // === ENEMY TYPE CELEBRATIONS ===
    tankHit: { text: '🛡️ {remaining} HITS LEFT', color: '#9b59b6' },
    explosion: { text: '💥 CHAIN REACTION!', color: '#e67e22' },
    // === NEW PERK EFFECT CELEBRATIONS ===
    chainReaction: { text: '⛓️ CHAIN x{count}!', color: '#f1c40f' },
    shockwave: { text: '💫 SHOCKWAVE!', color: '#9b59b6' },
    fireKill: { text: '🔥 BURNED!', color: '#e67e22' },
    // === NEW POWERUP CELEBRATIONS ===
    timeFreeze: { text: '⏸️ TIME FREEZE!', color: '#00d4ff' },
    coinMagnet: { text: '🧲 COIN MAGNET!', color: '#f1c40f' },
    cloneActivated: { text: '👤 DECOY DEPLOYED!', color: '#9b59b6' },
    decoyExpired: { text: '👤 DECOY GONE', color: '#666' },
    invincibility: { text: '⭐ INVINCIBLE!', color: '#ffd700' },
    ghostWalk: { text: '👻 GHOST WALK!', color: '#64b4ff' },
    overclock: { text: '🚨 OVERCLOCK!', color: '#ff6b6b' },
    flowState: { text: 'FLOW STATE!', color: '#6ee7de' },
    flowBonus: { text: '+{seconds}s FLOW BONUS!', color: '#6ee7de' },
    // === ENVIRONMENTAL HAZARD CELEBRATIONS ===
    shocked: { text: '⚡ SHOCKED!', color: '#ffff00' },
    paperJam: { text: '📄 PAPER JAM!', color: '#ffffff' },
    // === SECRET UNLOCK CELEBRATIONS ===
    wallBreakerUnlocked: { text: '🧱💥 WALL BREAKER UNLOCKED!', color: '#ff00ff' },
    wallSmash: { text: '💥 SMASH!', color: '#ff6600' },
    wallBreak: { text: '💥 WALL BREAK!', color: '#95a5a6' },
    cooldown: { text: '⏳ RECHARGING...', color: '#3498db' },
    // === THE VAULT CELEBRATIONS ===
    severance: { text: '💼⚡ SEVERANCE PACKAGE!', color: '#3498db' },
    vaultFound: { text: '🔐💰 VAULT DISCOVERED!', color: '#f1c40f' }
};

// ============================================
// SETTINGS PERSISTENCE (LocalStorage)
// ============================================
const DEFAULT_SETTINGS = {
    resolution: '640x640',
    autoDetectResolution: true,
    fullscreen: false,
    screenShake: true,
    screenShakeIntensity: 100,  // 0-100% for motion sensitivity
    colorblindMode: 'off',      // 'off', 'deuteranopia', 'protanopia', 'tritanopia'
    showFPS: false,
    masterVolume: 1.0,
    musicVolume: 0.7,
    sfxVolume: 0.8,
    hapticsStrength: 1.0,
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
        action: ['KeyE'],
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

        // Set resolution (auto-detect unless user disabled it)
        if (settings.autoDetectResolution) {
            const detected = autoDetectResolution();
            setResolution(detected);
        } else {
            setResolution(settings.resolution);
        }

        // Apply colorblind mode if enabled
        if (settings.colorblindMode && settings.colorblindMode !== 'off') {
            applyColorblindMode(settings.colorblindMode);
        }

        // Apply haptics strength
        Haptics.strength = (settings.hapticsStrength !== undefined) ? settings.hapticsStrength : 1.0;

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
// Single playable character - Corporate Employee
const PLAYER_CHARACTER = {
    id: 'default',
    name: 'Corporate Employee',
    description: 'Just trying to survive another day',
    colors: {
        shirt: '#00b894',
        shirtLight: '#55efc4',
        shirtDark: '#00a884',
        hair: '#5f3dc4',
        pants: '#2d3436'
    }
};

let playerProgress = {
    unlockedStatusThemes: ['core'],
    selectedStatusTheme: 'auto',
    totalRuns: 0,
    totalWins: 0,
    totalPunches: 0,
    totalZaps: 0,
    totalFloorsCleared: 0,
    bestFloor: 13,
    secretExitFound: false,
    perfectRunAchieved: false,
    achievements: [],
    wasHitThisRun: false
};

function loadProgress() {
    try {
        const saved = localStorage.getItem('deadline_progress');
        if (saved) {
            const savedData = JSON.parse(saved);
            // Migrate old save data - ignore character selection fields
            const { selectedCharacter, unlockedCharacters, ...rest } = savedData;
            playerProgress = { ...playerProgress, ...rest };
        }
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
        flow: gameState.flow || 0,
        flowStateActive: gameState.flowStateActive || false,
        flowBonusLastFloor: gameState.flowBonusLastFloor || 0,
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
    gameState.flow = saveData.flow || 0;
    gameState.flowStateActive = saveData.flowStateActive || false;
    gameState.flowBonusLastFloor = saveData.flowBonusLastFloor || 0;
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

function checkProgressUnlocks() {
    // Check for status theme unlocks only (character unlocks removed)
    checkStatusThemeUnlocks();
    saveProgress();
}

function showStatusThemeUnlock(theme) {
    const notification = document.createElement('div');
    notification.innerHTML = `<div style="font-size:48px;margin-bottom:10px">🎭</div>
        <div style="font-size:14px;color:#fff;letter-spacing:3px;margin-bottom:8px">STATUS PACK UNLOCKED!</div>
        <div style="font-size:22px;color:#ffe66d;font-weight:bold;margin-bottom:5px">${theme.name}</div>
        <div style="font-size:12px;color:rgba(255,255,255,0.8)">${theme.description}</div>`;
    notification.style.cssText = `position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:linear-gradient(180deg,rgba(233,69,96,0.95) 0%,rgba(143,45,74,0.95) 100%);padding:28px 46px;border-radius:12px;border:3px solid #ffe66d;box-shadow:0 0 60px rgba(255,230,109,0.6);z-index:500;text-align:center;font-family:'Courier New',monospace;`;
    document.body.appendChild(notification);
    setTimeout(() => { notification.style.opacity = '0'; notification.style.transition = 'opacity 0.5s'; setTimeout(() => notification.remove(), 500); }, 3000);
}

function getSelectedCharacter() {
    return PLAYER_CHARACTER;
}

function updatePlayerColors() {
    const char = PLAYER_CHARACTER;
    if (char.colors) {
        COLORS.playerShirt = char.colors.shirt;
        COLORS.playerShirtLight = char.colors.shirtLight;
        COLORS.playerShirtDark = char.colors.shirtDark;
        COLORS.playerHair = char.colors.hair;
        COLORS.playerPants = char.colors.pants;
    }
}

// === THE VAULT: Update vault badge visibility on title screen ===
function updateVaultBadge() {
    const vaultBadge = document.getElementById('vaultBadge');
    if (vaultBadge && playerStats.vaultDiscovered) {
        vaultBadge.style.display = 'flex';
        vaultBadge.title = `Vault Discovered: ${new Date(playerStats.vaultDiscoveredDate).toLocaleDateString()}`;
    }
}

function updateProgressAfterRun(won) {
    playerProgress.totalRuns++;
    playerProgress.totalPunches += gameState.enemiesKnockedOut || 0;
    playerProgress.totalZaps += gameState.enemiesZapped || 0;
    playerProgress.totalFloorsCleared += (13 - gameState.floor);

    // Also update playerStats for milestones
    playerStats.totalFloorsCleared += (13 - gameState.floor);
    playerStats.enemiesPunched += gameState.enemiesKnockedOut || 0;
    playerStats.enemiesZapped += gameState.enemiesZapped || 0;
    playerStats.totalRuns++;

    // === NEW: Escape Points System (Meta-Progression) ===
    // Award escape points based on performance - even failed runs give progress
    const floorsDescended = (gameState.quickRunMode ? 5 : 13) - gameState.floor;
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

    checkProgressUnlocks();
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
            <div style="font-size:11px;color:#ffe66d;letter-spacing:2px;margin-bottom:3px">AUDIT CLEARED</div>
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
        <h2 style="color:#ffe66d;text-align:center;margin-bottom:5px;letter-spacing:3px;">AUDITS</h2>
        <div style="color:#888;text-align:center;margin-bottom:20px;font-size:12px;">${unlocked}/${total} On file</div>
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
        achieveBtn.textContent = 'AUDITS';
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
        { label: 'Runs on File', value: playerProgress.totalRuns, icon: '🎮' },
        { label: 'Wins on File', value: playerProgress.totalWins, icon: '🏆' },
        { label: 'Win Rate', value: winRate + '%', icon: '📊' },
        { label: 'Best Floor on File', value: playerProgress.bestFloor === 13 ? 'N/A' : `Floor ${playerProgress.bestFloor}`, icon: '⬇️' },
        { label: 'Floors Cleared', value: playerProgress.totalFloorsCleared, icon: '🏢' },
        { label: 'Avg Floors/Run', value: avgFloorsPerRun, icon: '📈' },
        { label: 'Coworkers Punched', value: playerProgress.totalPunches, icon: '🥊' },
        { label: 'Coworkers Zapped', value: playerProgress.totalZaps, icon: '⚡' },
        { label: 'Secret Exit Found', value: playerProgress.secretExitFound ? 'Yes' : 'Not yet', icon: '🔮' },
        { label: 'Perfect Run', value: playerProgress.perfectRunAchieved ? 'Filed' : 'Not yet', icon: '✨' },
        { label: 'Staff Unlocked', value: `${playerProgress.unlockedCharacters.length}/${Object.keys(CHARACTERS).length}`, icon: '👥' },
        { label: 'Audits Cleared', value: `${playerProgress.achievements.length}/${Object.keys(ACHIEVEMENTS).length}`, icon: '🏅' }
    ];

    let html = `<div style="background:linear-gradient(180deg,rgba(30,40,60,0.98) 0%,rgba(15,20,35,0.99) 100%);padding:30px 40px;border-radius:12px;border:3px solid #3498db;max-width:500px;max-height:80vh;overflow-y:auto;">
        <h2 style="color:#3498db;text-align:center;margin-bottom:20px;letter-spacing:3px;">RECORDS</h2>
        <div style="display:grid;gap:8px;">`;

    for (const stat of stats) {
        html += `<div style="display:flex;justify-content:space-between;align-items:center;background:rgba(0,0,0,0.4);padding:10px 15px;border-radius:6px;border-left:3px solid #3498db;">
            <span style="color:#888;font-size:13px;">${stat.icon} ${stat.label}</span>
            <span style="color:#fff;font-size:14px;font-weight:bold;">${stat.value}</span>
        </div>`;
    }

    html += `</div>
        <div style="text-align:center;margin-top:25px;">
            <button onclick="resetAllProgress()" style="padding:10px 20px;font-size:12px;background:linear-gradient(180deg,#e74c3c 0%,#c0392b 100%);color:#fff;border:none;cursor:pointer;font-family:'Courier New',monospace;text-transform:uppercase;border-radius:4px;letter-spacing:1px;margin-right:15px;">PURGE RECORDS</button>
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
            bestFloor: 13,
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
        statsBtn.textContent = 'RECORDS';
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

// === ENDLESS MODE: Shift walls for unstable floors ===
function shiftUnstableWalls() {
    // Play warning sound
    AudioManager.play('alert');

    // Add celebration notification
    gameState.celebrations.push({
        text: '⚠️ WALLS SHIFTING!',
        subtext: '',
        color: '#8e44ad',
        timer: 1.5,
        scale: 1.2,
        flash: false
    });

    // Screen shake effect
    screenShake.add(0.5, 8);

    // Randomly shift some walls
    const maze = gameState.maze;
    const shiftCount = Math.min(20, Math.floor(MAP_WIDTH * MAP_HEIGHT * 0.03)); // 3% of tiles

    for (let i = 0; i < shiftCount; i++) {
        const x = Math.floor(Math.random() * (MAP_WIDTH - 4)) + 2;
        const y = Math.floor(Math.random() * (MAP_HEIGHT - 4)) + 2;

        // Don't modify near player, exits, or special zones
        const nearPlayer = Math.abs(x - gameState.player.x) < 3 && Math.abs(y - gameState.player.y) < 3;
        const nearExit = gameState.exits.some(e => Math.abs(x - e.x) < 2 && Math.abs(y - e.y) < 2);

        if (nearPlayer || nearExit) continue;

        // Toggle wall/floor
        if (maze[y][x] === TILE.WALL) {
            maze[y][x] = TILE.FLOOR;
        } else if (maze[y][x] === TILE.FLOOR) {
            // Only add wall if it doesn't block paths
            maze[y][x] = TILE.WALL;
            // Verify paths still exist
            const playerX = gameState.player.x;
            const playerY = gameState.player.y;
            let pathBlocked = false;
            for (const exit of gameState.exits) {
                if (!hasPath(maze, playerX, playerY, exit.x, exit.y)) {
                    pathBlocked = true;
                    break;
                }
            }
            if (pathBlocked) {
                maze[y][x] = TILE.FLOOR; // Revert
            }
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
    // === ENDLESS MODE: Use endless scaling functions ===
    if (gameState.endlessMode) {
        // Get endless-specific dimensions
        const dims = getEndlessMapDimensions(gameState.endlessFloor);
        MAP_WIDTH = dims.width;
        MAP_HEIGHT = dims.height;

        // Check for danger zones
        const dangerZone = getEndlessDangerZone(gameState.endlessFloor);
        gameState.endlessDangerZone = dangerZone ? dangerZone.id : null;

        // Check for breather floor
        gameState.endlessIsBreatherFloor = isEndlessBreatherFloor(gameState.endlessFloor);

        // Setup blackout radius if in blackout zone
        if (gameState.endlessDangerZone === 'blackout') {
            gameState.endlessBlackoutRadius = 5; // Visible radius in tiles
        } else {
            gameState.endlessBlackoutRadius = 0;
        }

        // Setup wall shift timer if in unstable zone
        if (gameState.endlessDangerZone === 'unstable') {
            gameState.endlessWallShiftTimer = 20; // Walls shift every 20 seconds
        }
    } else {
        // Standard mode: Set map dimensions based on floor and aspect ratio
        const dims = getMapDimensionsForFloor(gameState.floor);
        MAP_WIDTH = dims.width;
        MAP_HEIGHT = dims.height;
    }

    // Update tile size based on current resolution and map height
    TILE_SIZE = getTileSize();

    // Canvas size is determined by resolution setting, not map size
    const res = RESOLUTIONS[displaySettings.currentResolution] || RESOLUTIONS['640x640'];
    canvas.width = res.width;
    canvas.height = res.height;

    gameState.maze = generateMaze();

    // === ENDLESS MODE: Timer calculation ===
    if (gameState.endlessMode) {
        gameState.timer = getEndlessTimer(gameState.endlessFloor);
        const difficultyPreset = DIFFICULTY_PRESETS[settings.difficulty] || DIFFICULTY_PRESETS.normal;
        if (difficultyPreset && difficultyPreset.timerMultiplier && difficultyPreset.timerMultiplier > 0) {
            gameState.timer = Math.floor(gameState.timer * difficultyPreset.timerMultiplier);
        }

        // Show notifications for special floors
        if (gameState.endlessDangerZone) {
            const zone = getEndlessDangerZone(gameState.endlessFloor);
            if (zone) showDangerZoneWarning(zone);
        }
        if (gameState.endlessIsBreatherFloor) {
            showBreatherFloorNotification();
        }

        // Check for milestones
        const milestone = getEndlessMilestone(gameState.endlessFloor);
        if (milestone) {
            showEndlessMilestoneCelebration(milestone);
        }

        // Check personal best proximity
        const pbStatus = checkEndlessPersonalBest(gameState.endlessFloor);
        if (pbStatus) {
            showPersonalBestProximityAlert(pbStatus);
        }
    } else {
        // Standard mode timer calculation - smoothed difficulty curve
        // Floor timers (base): 13=45, 12=43, 11=41, 10=38, 9=36, 8=34, 7=31, 6=29, 5=27, 4-1=25
        if (gameState.floor >= 11) {
            // Opening floors (13-11): 45, 43, 41 (2s steps)
            gameState.timer = 45 - (13 - gameState.floor) * 2;
        } else if (gameState.floor >= 8) {
            // Early-mid floors (10-8): 38, 36, 34 (2s steps, smooth transition from 41)
            gameState.timer = 38 - (10 - gameState.floor) * 2;
        } else if (gameState.floor >= 5) {
            // Mid floors (7-5): 31, 29, 27 (2s steps, smooth transition from 34)
            gameState.timer = 31 - (7 - gameState.floor) * 2;
        } else {
            // Late floors (4-1): 25 base
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

        // Apply difficulty timer multiplier
        const difficultyPreset = DIFFICULTY_PRESETS[settings.difficulty] || DIFFICULTY_PRESETS.normal;
        if (difficultyPreset && difficultyPreset.timerMultiplier && difficultyPreset.timerMultiplier > 0) {
            gameState.timer = Math.floor(gameState.timer * difficultyPreset.timerMultiplier);
        }

        // Apply weekly challenge modifiers (for daily challenge mode)
        if (dailyChallenge.active && gameState.weeklyChallenge) {
            const mods = gameState.weeklyChallenge.modifiers;
            if (mods.timeMultiplier) {
                gameState.timer = Math.floor(gameState.timer * mods.timeMultiplier);
            }
        }
    }

    gameState.player.x = Math.floor(MAP_WIDTH / 2);
    gameState.player.y = Math.floor(MAP_HEIGHT / 2);
    // Sync visual position with logical position (no interpolation on floor change)
    gameState.player.visualX = gameState.player.x;
    gameState.player.visualY = gameState.player.y;
    gameState.player.stunned = 0;
    gameState.player.speed = 1;
    gameState.player.frame = 0;
    // Reset hitCount each floor for fairness
    gameState.player.hitCount = 0;
    gameState.player.lastHitTime = 0;
    gameState.player.burning = 0;
    // === DASH/PUNCH: Reset cooldowns on new floor (fresh start) ===
    gameState.player.dashCooldown = 0;
    gameState.player.dashInvincible = 0;
    gameState.player.isDashing = false;
    gameState.player.punchCooldown = 0;
    gameState.player.isPunching = false;
    gameState.punchEffects = [];
    // === COMBO: Keep combo/streak running between floors (reward for momentum) ===
    // Don't reset killCombo, killStreak, or maxComboThisRun - they persist!
    // === SLOW-MO: Reset slow-mo on new floor ===
    gameState.slowMoActive = false;
    gameState.slowMoTimer = 0;
    gameState.slowMoFactor = 1.0;

    // === VISUAL POLISH: Trigger enemy spawn flash ===
    gameState.enemySpawnFlash = 0.15; // Brief white flash when floor starts
    gameState.lastTimerSecond = -1; // Reset timer pulse tracking

    // Track floor start time for recap stats
    gameState.floorStartTime = Date.now();

    // Reset fires for new floor
    gameState.fires = [];
    gameState.fireSpawnTimer = 5;  // Start spawning fires after 5 seconds

    // Reset environmental hazards for new floor
    gameState.sparkingWires = [];
    gameState.coffeeSpills = [];
    gameState.malfunctioningCopiers = [];
    gameState.hazardSpawnTimer = 3; // Spawn hazards after 3 seconds
    gameState.playerSlowed = false;
    gameState.slowedTimer = 0;

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

    // === PERK EFFECTS: Apply perks that activate at floor start ===
    // Safety First: Start each floor with a shield
    if (gameState.perks.includes('shieldStart')) {
        gameState.player.shielded = 5;
    }
    // Head Start / Time Lord: Bonus time at floor start
    if (gameState.perks.includes('startTime')) {
        gameState.timer += 5;
    }
    if (gameState.perks.includes('timeLord')) {
        gameState.timer += 10;
    }
    // Vault Master: +100 starting coins each floor
    if (gameState.perks.includes('vaultMaster')) {
        gameState.coinsCollected += 100;
    }

    // Add cafeteria on floors 10, 7, 4 (rebalanced for 13-floor game)
    if (gameState.floor === 10 || gameState.floor === 7 || gameState.floor === 4) {
        gameState.zones.cafeteria = addCafeteria(gameState.maze);
    }

    // Add bathroom on every other floor
    if (gameState.floor % 2 === 0) {
        gameState.zones.bathroom = addBathroom(gameState.maze);
    }

    // Add rooftop garden on floors 11, 8, 5 (gives shield powerup, rebalanced)
    if (gameState.floor === 11 || gameState.floor === 8 || gameState.floor === 5) {
        gameState.zones.garden = addGarden(gameState.maze);
    }

    // Add dog park on floors 9, 6, 3 (gives companion powerup, rebalanced)
    if (gameState.floor === 9 || gameState.floor === 6 || gameState.floor === 3) {
        gameState.zones.dogPark = addDogPark(gameState.maze);
    }

    // Add secret exit on floor 7 (rebalanced from floor 13)
    if (gameState.floor === 7) {
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

    // Also verify secret exit on floor 7 (rebalanced from floor 13)
    if (gameState.floor === 7 && gameState.secretExit) {
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
    gameState.enemies = [];

    // Zen mode: no enemies (Playtest Feature #4)
    if (gameState.zenMode) {
        // Skip enemy spawning entirely in Zen mode
    } else {
        let numEnemies;
        let enemyDifficulty;

        if (gameState.endlessMode) {
            // === ENDLESS MODE: Use endless scaling ===
            numEnemies = getEndlessEnemyCount(gameState.endlessFloor);
            enemyDifficulty = getEndlessAIDifficulty(gameState.endlessFloor);
        } else {
            // Standard mode: Enemy counts rebalanced for 13-floor game
            if (gameState.floor === 13) numEnemies = 2;      // Tutorial floor
            else if (gameState.floor >= 11) numEnemies = 3;  // Floors 12-11
            else if (gameState.floor >= 8) numEnemies = 4;   // Floors 10-8
            else if (gameState.floor >= 4) numEnemies = 5;   // Floors 7-4
            else numEnemies = 6;                              // Floors 3-1

            // Apply difficulty multiplier (Playtest Feature #1)
            const difficultyPreset = DIFFICULTY_PRESETS[settings.difficulty] || DIFFICULTY_PRESETS.normal;
            numEnemies = Math.max(1, Math.round(numEnemies * (difficultyPreset.enemyMultiplier || 1.0)));

            // Enemy AI difficulty also scales - rebalanced for 13-floor game
            enemyDifficulty = gameState.floor >= 13 ? 'easy' : (gameState.floor >= 7 ? 'medium' : 'hard');

            // First-run onboarding: gentler enemy ramp on early floors
            if (gameState.firstRunTutorial) {
                if (gameState.floor === 13) {
                    numEnemies = 0;
                    enemyDifficulty = 'easy';
                } else if (gameState.floor === 12) {
                    numEnemies = 1;
                    enemyDifficulty = 'easy';
                } else if (gameState.floor === 11) {
                    numEnemies = 2;
                    enemyDifficulty = 'easy';
                }
            }
        }

    for (let i = 0; i < numEnemies; i++) {
        let ex, ey, attempts = 0;
        do {
            ex = Math.floor(gameRandom() * (MAP_WIDTH - 4)) + 2;
            ey = Math.floor(gameRandom() * (MAP_HEIGHT - 4)) + 2;
            attempts++;
        } while ((gameState.maze[ey][ex] !== TILE.FLOOR ||
                 (Math.abs(ex - gameState.player.x) < 5 && Math.abs(ey - gameState.player.y) < 5)) && attempts < 100);

        if (attempts < 100) {
            // === ENEMY VARIETY: Select enemy type based on floor and randomness ===
            let enemyType = gameState.endlessMode ?
                selectEndlessEnemyType(gameState.endlessFloor) :
                selectEnemyType(gameState.floor, i);
            const typeData = ENEMY_TYPES[enemyType] || ENEMY_TYPES.coworker;

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
                spawnTimer: 0.8,  // Spawn warning animation duration
                // === ENEMY TYPE PROPERTIES ===
                enemyType: enemyType,
                health: typeData.health,
                maxHealth: typeData.health,
                speedMultiplier: typeData.speed,
                special: typeData.special
            });
        }
    }
    } // Close the else block for non-zen mode enemy spawning

    gameState.powerups = [];
    // === CHANGED: Increased power-up density for better flow ===
    // More power-ups = more tactical decisions = more engagement (rebalanced for 13 floors)
    let numPowerups;
    if (gameState.floor >= 11) {
        numPowerups = 5 + Math.floor(gameRandom() * 3);  // 5-7 powerups (floors 13-11)
    } else if (gameState.floor >= 6) {
        numPowerups = 6 + Math.floor(gameRandom() * 4);  // 6-9 powerups (floors 10-6)
    } else {
        numPowerups = 8 + Math.floor(gameRandom() * 4);  // 8-11 powerups (late game gets more chaos)
    }
    const weeklyMods = getWeeklyModifiers();
    const powerupsDisabled = weeklyMods && weeklyMods.powerupMultiplier === 0;

    // First-run onboarding: reduce clutter and guarantee core powerups
    const guaranteedPowerups = [];
    if (gameState.firstRunTutorial && !gameState.endlessMode) {
        if (gameState.floor === 13) {
            numPowerups = 1;
            guaranteedPowerups.push({ type: 'speed', minDist: 4, maxDist: 9 });
        } else if (gameState.floor === 12) {
            numPowerups = 2;
            guaranteedPowerups.push({ type: 'knockout', minDist: 5, maxDist: 10 });
        } else if (gameState.floor === 11) {
            numPowerups = Math.min(numPowerups, 4);
        }
    }

    // Weekly modifier: powerup density
    if (weeklyMods && weeklyMods.powerupMultiplier !== undefined) {
        numPowerups = Math.max(0, Math.floor(numPowerups * weeklyMods.powerupMultiplier));
    }

    // Place guaranteed tutorial powerups first (unless powerups disabled)
    if (!powerupsDisabled && guaranteedPowerups.length > 0) {
        for (const gp of guaranteedPowerups) {
            const tile = findValidPowerupTile({
                minDistToPlayer: gp.minDist,
                maxDistToPlayer: gp.maxDist,
                minDistToExits: 2
            });
            if (tile) {
                gameState.powerups.push({ x: tile.x, y: tile.y, type: gp.type });
            }
        }
        // Reduce random count by number placed
        numPowerups = Math.max(0, numPowerups - gameState.powerups.length);
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
            // Determine powerup type based on floor and rarity
            let powerupType;
            const roll = gameRandom();

            if (gameState.floor <= 4 && roll < 0.1) {
                // 10% chance for super-rare powerups on floors 4-1
                powerupType = gameRandom() < 0.5 ? 'clone' : 'invincibility';
            } else if (gameState.floor <= 7 && roll < 0.08) {
                // 8% chance for Ghost Walk on floors 7-1 (pass through walls/desks)
                powerupType = 'ghost';
            } else if (gameState.floor <= 7 && roll < 0.25) {
                // 17% chance for limited powerups on floors 7-1
                powerupType = gameRandom() < 0.5 ? 'timeFreeze' : 'coinMagnet';
            } else if (gameState.floor <= 10 && gameState.floor >= 8 && roll < 0.2) {
                // Panic pickup on floors 10-8: huge speed, no punches
                powerupType = 'overclock';
            } else {
                // Regular powerups
                const speedMult = weeklyMods && weeklyMods.speedPowerupMultiplier ? weeklyMods.speedPowerupMultiplier : 1;
                const overclockWeight = gameState.floor <= 10 ? 0.4 : 0;
                const weights = [speedMult, 1, 1, overclockWeight];
                const total = weights[0] + weights[1] + weights[2] + weights[3];
                const rollPick = gameRandom() * total;
                if (rollPick < weights[0]) powerupType = 'speed';
                else if (rollPick < weights[0] + weights[1]) powerupType = 'knockout';
                else if (rollPick < weights[0] + weights[1] + weights[2]) powerupType = 'electric';
                else powerupType = 'overclock';
            }

            gameState.powerups.push({
                x: px,
                y: py,
                type: powerupType
            });
        }
    }

    // Add special powerup in garden (shield)
    if (gameState.zones.garden && !powerupsDisabled) {
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
    if (gameState.zones.dogPark && !powerupsDisabled) {
        const dogPark = gameState.zones.dogPark;
        const companionX = dogPark.x + Math.floor(dogPark.width / 2);
        const companionY = dogPark.y + Math.floor(dogPark.height / 2);
        gameState.powerups.push({
            x: companionX,
            y: companionY,
            type: 'companion'
        });
    }

    // Weekly modifier: extra shields (daily challenge only)
    if (!powerupsDisabled && weeklyMods && weeklyMods.shieldSpawnChance) {
        if (gameRandom() < weeklyMods.shieldSpawnChance) {
            const tile = findValidPowerupTile({ minDistToPlayer: 4, maxDistToPlayer: 12, minDistToExits: 2 });
            if (tile) {
                gameState.powerups.push({ x: tile.x, y: tile.y, type: 'shield' });
            }
        }
    }

    gameState.powerup = null;
    gameState.powerupTimer = 0;
    gameState.imploding = false;
    gameState.implosionFrame = 0;
    gameState.particles = [];
    gameState.crispyEffects = [];
    gameState.lastChance = false;
    gameState.lastChanceTimer = 0;

    // === COIN SPAWNING: Scaled by floor for economy balance ===
    // Fewer coins spawn on later (lower number) floors to prevent economy overflow
    gameState.coins = [];
    let numCoins;
    if (gameState.floor >= 11) {
        numCoins = 18 + Math.floor(gameRandom() * 8); // 18-25 coins (early floors)
    } else if (gameState.floor >= 7) {
        numCoins = 15 + Math.floor(gameRandom() * 6); // 15-20 coins (mid floors)
    } else if (gameState.floor >= 4) {
        numCoins = 12 + Math.floor(gameRandom() * 5); // 12-16 coins (late floors)
    } else {
        numCoins = 10 + Math.floor(gameRandom() * 4); // 10-13 coins (final floors)
    }
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
            // Scale coin value based on floor (later floors = more coins for shop)
            // Floor 13: 5-10, Floor 7-12: 8-15, Floor 1-6: 10-20
            let baseValue, bonusValue;
            if (gameState.floor >= 11) {
                baseValue = 5;
                bonusValue = Math.floor(gameRandom() * 6); // 5-10
            } else if (gameState.floor >= 7) {
                baseValue = 8;
                bonusValue = Math.floor(gameRandom() * 8); // 8-15
            } else {
                baseValue = 10;
                bonusValue = Math.floor(gameRandom() * 11); // 10-20
            }

            gameState.coins.push({
                x: cx,
                y: cy,
                value: baseValue + bonusValue,
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
        case 'overclock':
            return 'rgba(255, 107, 107, 0.25)';  // Hot red tint
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
    // === ENEMY TYPE: Select correct sprite sheet based on enemy type ===
    const enemyType = enemy.enemyType || 'coworker';
    const enemyAsset = ENEMY_ASSETS[enemyType] || ENEMY_ASSETS.coworker;

    if (!enemyAsset || !enemyAsset.animation.loaded || !enemyAsset.animation.image) {
        return false;  // Fall back to procedural rendering
    }

    const anim = enemyAsset.animation;

    // Get or create animation state for this enemy
    const enemyId = `enemy_${enemy.x}_${enemy.y}_${enemy.frame}_${enemyType}`;
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

    // Draw sprite - HR Karen needs smaller scale to align with other character sizes
    // Other enemies are in running poses with more negative space
    const spriteScale = (enemyType === 'hr_karen') ? 1.4 : 2.0;
    const destSize = Math.floor(TILE_SIZE * spriteScale);
    const offsetX = Math.floor((TILE_SIZE - destSize) / 2);
    // HR Karen needs less vertical offset since she's standing upright
    const offsetY = Math.floor((TILE_SIZE - destSize) / 2) - (enemyType === 'hr_karen' ? 4 : 12);

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
    // Use visual position for smooth movement (fall back to logical if not set)
    const visualX = gameState.player.visualX !== undefined ? gameState.player.visualX : gameState.player.x;
    const visualY = gameState.player.visualY !== undefined ? gameState.player.visualY : gameState.player.y;
    const x = visualX * TILE_SIZE;
    const y = visualY * TILE_SIZE;
    const bobOffset = Math.sin(gameState.animationTime * 8) * 1;

    // Check if in safe zone (use logical position for game logic)
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
    } else if (gameState.powerup === 'ghost') {
        // Ethereal blue tint for ghost walk
        shirtColor = '#64b4ff';
        shirtLight = '#8ecfff';
        shirtDark = '#4090dd';
    }

    // Ghost Walk: semi-transparent effect and ghost particles
    const isGhost = gameState.powerup === 'ghost' && gameState.powerupTimer > 0;
    if (isGhost) {
        ctx.save();
        ctx.globalAlpha = 0.6 + Math.sin(gameState.animationTime * 10) * 0.1; // Pulsing transparency

        // Spawn ghost trail particles occasionally
        if (Math.random() < 0.15) {
            gameState.particles.push({
                x: x + TILE_SIZE / 2 + (Math.random() - 0.5) * 16,
                y: y + TILE_SIZE / 2 + (Math.random() - 0.5) * 16,
                vx: (Math.random() - 0.5) * 0.5,
                vy: -1 - Math.random(),
                size: 4 + Math.random() * 4,
                color: 'rgba(100, 180, 255, 0.6)',
                life: 0.5 + Math.random() * 0.3
            });
        }
    }

    // Shadow - slightly larger for more presence (reduced for ghost)
    ctx.fillStyle = isGhost ? 'rgba(100, 180, 255, 0.2)' : 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(x + 16, y + 30, 9, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Try sprite-based rendering first
    const facingRight = characterAnimationState.player.facingDirection >= 0;
    const powerupOverlay = getPowerupOverlayColor(gameState.powerup, gameState.player.stunned);
    const spriteDrawn = drawCharacterSprite(x, y, facingRight, powerupOverlay);

    // Draw enhanced speed trail (works with both sprite and procedural)
    drawCharacterSpeedTrail(x, y, gameState.powerup === 'speed' || gameState.powerup === 'overclock');

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

    // Ghost Walk aura effect
    if (isGhost) {
        // Ethereal glow around player
        const ghostPulse = Math.sin(gameState.animationTime * 8) * 0.2 + 0.4;
        ctx.fillStyle = `rgba(100, 180, 255, ${ghostPulse * 0.3})`;
        ctx.beginPath();
        ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, TILE_SIZE / 2 + 8, 0, Math.PI * 2);
        ctx.fill();

        // Ghost icon above player
        ctx.fillStyle = '#64b4ff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('👻', x + TILE_SIZE / 2, y - 6);
        ctx.textAlign = 'left';

        ctx.restore(); // Restore from ghost transparency save
    }
}

// Draw dog companion
function drawCompanion() {
    if (!gameState.player.companion) return;

    const comp = gameState.player.companion;
    const x = comp.x * TILE_SIZE;
    const y = comp.y * TILE_SIZE;
    const bounce = Math.sin(comp.frame) * 2;

    // Try to use sprite-based rendering
    const dogAsset = DOG_ASSETS.office_dog;
    if (dogAsset && dogAsset.animation.loaded && dogAsset.animation.image) {
        const anim = dogAsset.animation;
        const frameIndex = Math.floor(comp.frame) % anim.frameCount;
        const srcX = frameIndex * anim.frameWidth;
        const srcY = 0;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.ellipse(x + TILE_SIZE / 2, y + TILE_SIZE - 2, 12, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw sprite with bounce
        const scale = 2.0; // Scale factor for the dog sprite
        const drawWidth = anim.frameWidth * scale * 0.5;
        const drawHeight = anim.frameHeight * scale * 0.5;
        const drawX = x + TILE_SIZE / 2 - drawWidth / 2;
        const drawY = y + TILE_SIZE / 2 - drawHeight / 2 + bounce;

        ctx.drawImage(
            anim.image,
            srcX, srcY, anim.frameWidth, anim.frameHeight,
            drawX, drawY, drawWidth, drawHeight
        );
    } else {
        // Fallback to simple procedural drawing if sprite not loaded
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.ellipse(x + TILE_SIZE / 2, y + TILE_SIZE - 4, 10, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Simple dog body
        ctx.fillStyle = '#8d6e63';
        ctx.beginPath();
        ctx.ellipse(x + TILE_SIZE / 2, y + TILE_SIZE / 2 + 4 + bounce, 12, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Dog head
        ctx.fillStyle = '#a1887f';
        ctx.beginPath();
        ctx.arc(x + TILE_SIZE / 2 + 8, y + TILE_SIZE / 2 - 4 + bounce, 9, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x + TILE_SIZE / 2 + 5, y + TILE_SIZE / 2 - 6 + bounce, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + TILE_SIZE / 2 + 11, y + TILE_SIZE / 2 - 6 + bounce, 2, 0, Math.PI * 2);
        ctx.fill();
    }

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

// Draw clone decoy (enemies chase this instead of player)
function drawClone() {
    if (!gameState.clone) return;

    const clone = gameState.clone;
    const x = clone.x * TILE_SIZE;
    const y = clone.y * TILE_SIZE;
    const pulse = Math.sin(clone.frame) * 0.2 + 0.8;
    const blink = Math.sin(clone.blinkTimer * 10) > 0.8;

    // Ghostly purple glow
    ctx.shadowColor = '#9b59b6';
    ctx.shadowBlur = 15 * pulse;

    // Semi-transparent player silhouette
    const alpha = blink && clone.timer < 3 ? 0.3 : 0.6;
    ctx.fillStyle = `rgba(155, 89, 182, ${alpha})`;

    // Body
    ctx.beginPath();
    ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, TILE_SIZE / 3, 0, Math.PI * 2);
    ctx.fill();

    // "Head"
    ctx.beginPath();
    ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 3 - 2, TILE_SIZE / 4, 0, Math.PI * 2);
    ctx.fill();

    // Hologram lines
    ctx.strokeStyle = `rgba(200, 150, 255, ${alpha * 0.5})`;
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
        const lineY = y + 8 + i * 10 + (gameState.animationTime * 20 + i * 5) % 20;
        if (lineY < y + TILE_SIZE) {
            ctx.beginPath();
            ctx.moveTo(x + 8, lineY);
            ctx.lineTo(x + TILE_SIZE - 8, lineY);
            ctx.stroke();
        }
    }

    ctx.shadowBlur = 0;

    // "DECOY" label above
    if (clone.timer > 3 || Math.sin(clone.blinkTimer * 8) > 0) {
        ctx.fillStyle = '#9b59b6';
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('DECOY', x + TILE_SIZE / 2, y - 4);
        ctx.textAlign = 'left';
    }

    // Timer warning when about to expire
    if (clone.timer < 3) {
        ctx.fillStyle = `rgba(255, 100, 100, ${1 - clone.timer / 3})`;
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${clone.timer.toFixed(1)}s`, x + TILE_SIZE / 2, y + TILE_SIZE + 12);
        ctx.textAlign = 'left';
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
    // Apply knockback visual offset
    const knockbackOffsetX = enemy.knockbackX || 0;
    const knockbackOffsetY = enemy.knockbackY || 0;
    const x = enemy.x * TILE_SIZE + knockbackOffsetX;
    const y = enemy.y * TILE_SIZE + knockbackOffsetY;
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
    // Check if this is the vault floor (Floor -100 in endless mode)
    if (gameState.endlessMode && gameState.endlessFloor === 100 && !playerStats.vaultDiscovered) {
        drawVaultDoor(exit);
        return;
    }

    const x = exit.x * TILE_SIZE;
    const y = exit.y * TILE_SIZE;

    // Enhanced pulse - more urgent when timer is low
    const urgencyBoost = gameState.timer <= 10 ? 1.5 : 1.0;
    const pulseSpeed = 4 * urgencyBoost;
    const pulse = Math.sin(gameState.animationTime * pulseSpeed) * 0.3 + 0.7;
    const arrowBob = Math.sin(gameState.animationTime * 6) * 2;

    // First-run onboarding: extra exit emphasis when nearby
    if (gameState.firstRunTutorial) {
        const distToPlayer = Math.abs(exit.x - gameState.player.x) + Math.abs(exit.y - gameState.player.y);
        if (distToPlayer <= 3) {
            ctx.save();
            ctx.fillStyle = 'rgba(255, 230, 120, 0.8)';
            ctx.beginPath();
            ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 36 + pulse * 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.font = 'bold 14px monospace';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#fff';
            ctx.shadowColor = '#000';
            ctx.shadowBlur = 6;
            ctx.fillText('EXIT', x + TILE_SIZE / 2, y - 12 + arrowBob);
            ctx.restore();
        }
    }

    // Radiating "beckoning" rings - 3 expanding concentric circles (more visible when urgent)
    const ringAlphaBoost = gameState.timer <= 10 ? 1.5 : 1.0;
    for (let i = 0; i < 3; i++) {
        const phase = (gameState.animationTime * 1.5 * urgencyBoost + i * 0.33) % 1;
        const radius = 18 + phase * 25;
        const alpha = (1 - phase) * 0.25 * ringAlphaBoost;

        ctx.strokeStyle = `rgba(241, 196, 15, ${alpha})`;
        ctx.lineWidth = gameState.timer <= 5 ? 3 : 2;
        ctx.beginPath();
        ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, radius, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Enhanced glow - brighter when urgent
    const glowSize = gameState.timer <= 10 ? 28 + pulse * 4 : 24;
    const glowAlpha = gameState.timer <= 10 ? pulse * 0.6 : pulse * 0.4;
    ctx.fillStyle = `rgba(241, 196, 15, ${glowAlpha})`;
    ctx.beginPath();
    ctx.arc(x + 16, y + 16, glowSize, 0, Math.PI * 2);
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

// === THE VAULT: Draw Vault Door for Floor -100 ===
function drawVaultDoor(exit) {
    const x = exit.x * TILE_SIZE;
    const y = exit.y * TILE_SIZE;

    // Ominous slow pulse
    const pulse = Math.sin(gameState.animationTime * 2) * 0.2 + 0.8;
    const glowPulse = Math.sin(gameState.animationTime * 1.5) * 0.3 + 0.7;

    // Dark ominous radiating rings (gold/green corporate colors)
    for (let i = 0; i < 4; i++) {
        const phase = (gameState.animationTime * 0.8 + i * 0.25) % 1;
        const radius = 20 + phase * 35;
        const alpha = (1 - phase) * 0.4;

        ctx.strokeStyle = `rgba(50, 205, 50, ${alpha})`;  // Corporate green
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, radius, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Eerie green glow
    ctx.fillStyle = `rgba(50, 205, 50, ${glowPulse * 0.3})`;
    ctx.beginPath();
    ctx.arc(x + 16, y + 16, 32, 0, Math.PI * 2);
    ctx.fill();

    // Vault door frame (thick metal)
    ctx.fillStyle = '#2c3e50';  // Dark metal
    ctx.fillRect(x, y - 4, TILE_SIZE, TILE_SIZE + 4);

    // Inner vault door (circular)
    ctx.fillStyle = '#34495e';
    ctx.beginPath();
    ctx.arc(x + 16, y + 14, 12, 0, Math.PI * 2);
    ctx.fill();

    // Vault door shine
    ctx.fillStyle = '#4a6278';
    ctx.beginPath();
    ctx.arc(x + 14, y + 12, 10, 0, Math.PI * 2);
    ctx.fill();

    // Vault handle/wheel spokes
    ctx.strokeStyle = '#f1c40f';  // Gold
    ctx.lineWidth = 2;
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 3) {
        const spinAngle = angle + gameState.animationTime * 0.5;
        ctx.beginPath();
        ctx.moveTo(x + 16, y + 14);
        ctx.lineTo(x + 16 + Math.cos(spinAngle) * 8, y + 14 + Math.sin(spinAngle) * 8);
        ctx.stroke();
    }

    // Center hub
    ctx.fillStyle = '#f39c12';
    ctx.beginPath();
    ctx.arc(x + 16, y + 14, 4, 0, Math.PI * 2);
    ctx.fill();

    // Gold center dot
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.arc(x + 16, y + 14, 2, 0, Math.PI * 2);
    ctx.fill();

    // "VAULT" text above (pixel art style)
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(x + 2, y - 10, 28, 8);
    ctx.fillStyle = '#f1c40f';
    ctx.font = '6px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('VAULT', x + 16, y - 4);

    // Locking bolts around the door
    ctx.fillStyle = '#7f8c8d';
    const boltPositions = [[4, 2], [28, 2], [4, 26], [28, 26]];
    for (const [bx, by] of boltPositions) {
        ctx.beginPath();
        ctx.arc(x + bx, y + by, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    // Pulsing "?" or "$" symbol hint
    if (!playerStats.vaultDiscovered) {
        ctx.fillStyle = `rgba(241, 196, 15, ${pulse})`;
        ctx.font = 'bold 10px monospace';
        ctx.fillText('$', x + 16, y + 36);
    }
}

// === NEW: Draw Coin (Dopamine Breadcrumb) ===
function drawCoin(coin) {
    // Handle collecting animation (pop scale then fade)
    if (coin.collecting) {
        const x = coin.x * TILE_SIZE;
        const y = coin.y * TILE_SIZE;
        const cx = x + TILE_SIZE / 2;
        const cy = y + TILE_SIZE / 2;

        // Pop scale and fade out
        const scale = coin.collectScale || 1.0;
        const alpha = coin.collectAlpha || 1.0;
        const radius = (TILE_SIZE / 4) * scale;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.shadowColor = '#f1c40f';
        ctx.shadowBlur = 15;

        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
        return;
    }

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
    } else if (powerup.type === 'overclock') {
        img = powerupImages.overclock;
        glowColor = 'rgba(255, 107, 107, 0.7)';
        shadowColor = '#ff6b6b';
        drawFallback = true;
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
    } else if (powerup.type === 'timeFreeze') {
        img = powerupImages.timeFreeze;
        glowColor = 'rgba(0, 212, 255, 0.6)';
        shadowColor = '#00d4ff';
        drawFallback = true; // Always use fallback for new powerups
    } else if (powerup.type === 'coinMagnet') {
        img = powerupImages.coinMagnet;
        glowColor = 'rgba(241, 196, 15, 0.6)';
        shadowColor = '#f1c40f';
        drawFallback = true;
    } else if (powerup.type === 'clone') {
        img = powerupImages.clone;
        glowColor = 'rgba(155, 89, 182, 0.6)';
        shadowColor = '#9b59b6';
        drawFallback = true;
    } else if (powerup.type === 'invincibility') {
        img = powerupImages.invincibility;
        // Rainbow glow!
        const rainbowHue = (gameState.animationTime * 100) % 360;
        glowColor = `hsla(${rainbowHue}, 100%, 50%, 0.6)`;
        shadowColor = `hsl(${rainbowHue}, 100%, 50%)`;
        drawFallback = true;
    } else if (powerup.type === 'ghost') {
        img = powerupImages.ghost;
        // Ethereal blue glow with pulsing
        glowColor = 'rgba(100, 180, 255, 0.6)';
        shadowColor = '#64b4ff';
        drawFallback = true;
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
    } else if (powerup.type === 'timeFreeze') {
        // Fallback: Clock/stopwatch icon
        const cx = x + TILE_SIZE / 2;
        const cy = y + TILE_SIZE / 2 + bounce;

        // Clock face
        ctx.fillStyle = '#00d4ff';
        ctx.beginPath();
        ctx.arc(cx, cy, 12, 0, Math.PI * 2);
        ctx.fill();

        // Inner face
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(cx, cy, 9, 0, Math.PI * 2);
        ctx.fill();

        // Clock hands
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx, cy - 6);
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + 4, cy);
        ctx.stroke();
        ctx.lineWidth = 1;

        // "Pause" bars
        ctx.fillStyle = '#00d4ff';
        ctx.fillRect(cx - 5, cy + 4, 3, 6);
        ctx.fillRect(cx + 2, cy + 4, 3, 6);
    } else if (powerup.type === 'coinMagnet') {
        // Fallback: Horseshoe magnet icon
        const cx = x + TILE_SIZE / 2;
        const cy = y + TILE_SIZE / 2 + bounce;

        // Magnet body
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(cx, cy, 8, Math.PI, 0, true);
        ctx.stroke();

        // Poles
        ctx.fillStyle = '#c0392b';
        ctx.fillRect(cx - 11, cy - 2, 6, 10);
        ctx.fillStyle = '#3498db';
        ctx.fillRect(cx + 5, cy - 2, 6, 10);
        ctx.lineWidth = 1;

        // Gold sparkles around it
        ctx.fillStyle = '#f1c40f';
        ctx.fillRect(cx - 14, cy - 8, 3, 3);
        ctx.fillRect(cx + 12, cy - 6, 3, 3);
    } else if (powerup.type === 'clone') {
        // Fallback: Two overlapping silhouettes
        const cx = x + TILE_SIZE / 2;
        const cy = y + TILE_SIZE / 2 + bounce;

        // Shadow silhouette
        ctx.fillStyle = 'rgba(155, 89, 182, 0.5)';
        ctx.beginPath();
        ctx.arc(cx + 4, cy - 4, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(cx + 1, cy, 6, 10);

        // Main silhouette
        ctx.fillStyle = '#9b59b6';
        ctx.beginPath();
        ctx.arc(cx - 2, cy - 4, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(cx - 5, cy, 6, 10);
    } else if (powerup.type === 'invincibility') {
        // Fallback: Rainbow star
        const cx = x + TILE_SIZE / 2;
        const cy = y + TILE_SIZE / 2 + bounce;
        const rotation = gameState.animationTime * 2;

        // Star with rainbow gradient
        const hue = (gameState.animationTime * 100) % 360;
        ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rotation);

        // 5-pointed star
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * 4 * Math.PI / 5) - Math.PI / 2;
            const r = i === 0 ? 0 : (i % 2 === 0 ? 12 : 5);
            if (i === 0) {
                ctx.moveTo(Math.cos(-Math.PI / 2) * 12, Math.sin(-Math.PI / 2) * 12);
            } else {
                ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
            }
        }
        // Complete the star manually
        for (let i = 0; i < 10; i++) {
            const angle = (i * Math.PI / 5) - Math.PI / 2;
            const r = i % 2 === 0 ? 12 : 5;
            ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
        }
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    } else if (powerup.type === 'ghost') {
        // Fallback: Ethereal ghost silhouette
        const cx = x + TILE_SIZE / 2;
        const cy = y + TILE_SIZE / 2 + bounce;
        const float = Math.sin(gameState.animationTime * 3) * 2;

        // Ghost body (semi-transparent)
        ctx.fillStyle = 'rgba(100, 180, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(cx, cy - 4 + float, 10, Math.PI, 0, false);
        ctx.lineTo(cx + 10, cy + 8 + float);
        // Wavy bottom
        ctx.quadraticCurveTo(cx + 7, cy + 4 + float, cx + 4, cy + 8 + float);
        ctx.quadraticCurveTo(cx, cy + 4 + float, cx - 4, cy + 8 + float);
        ctx.quadraticCurveTo(cx - 7, cy + 4 + float, cx - 10, cy + 8 + float);
        ctx.lineTo(cx - 10, cy - 4 + float);
        ctx.closePath();
        ctx.fill();

        // Ghost eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(cx - 4, cy - 4 + float, 3, 0, Math.PI * 2);
        ctx.arc(cx + 4, cy - 4 + float, 3, 0, Math.PI * 2);
        ctx.fill();

        // Ghost pupils
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(cx - 4, cy - 4 + float, 1.5, 0, Math.PI * 2);
        ctx.arc(cx + 4, cy - 4 + float, 1.5, 0, Math.PI * 2);
        ctx.fill();
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

        // Pop-in scale animation - starts at 0.5, overshoots to 1.1, settles at 1.0
        if (cel.popScale === undefined) cel.popScale = 0.5;
        if (cel.popScale < 1.0) {
            cel.popScale += deltaTime * 8; // Quickly scale up
            if (cel.popScale > 1.1) cel.popScale = 1.1;
        } else if (cel.popScale > 1.0) {
            cel.popScale -= deltaTime * 2; // Slowly settle
            if (cel.popScale < 1.0) cel.popScale = 1.0;
        }

        if (cel.timer <= 0) {
            gameState.celebrations.splice(i, 1);
        }
    }
}

function drawCelebrations() {
    for (const cel of gameState.celebrations) {
        const alpha = Math.min(1, cel.timer / 0.5); // Fade out in last 0.5s
        const scale = cel.popScale || 1.0;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(cel.x, cel.y + cel.offsetY);
        ctx.scale(scale, scale);
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = cel.color;
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 4;
        ctx.fillText(cel.text, 0, 0);
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
                // Speed bonus coins!
                const speedBonus = Math.floor(gameState.timer * 2);
                gameState.coinsCollected += speedBonus;
                showCelebration('speedBonus', { coins: speedBonus });
            }
            // Flawless: no hits this floor
            if (gameState.floorHits === 0) {
                showCelebration('flawless');
                // Flawless bonus coins!
                const flawlessBonus = 25 + (13 - gameState.floor) * 5; // More on later floors
                gameState.coinsCollected += flawlessBonus;
                showCelebration('flawlessBonus', { coins: flawlessBonus });
            }
            // DOMINATION: Both speedster AND flawless!
            if (gameState.timer >= 10 && gameState.floorHits === 0) {
                showCelebration('domination');
                gameState.coinsCollected += 50; // Extra domination bonus
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
            Haptics.sequence('checkpoint', [
                { strong: 0.2, weak: 0.35, duration: 70 },
                { strong: 0.35, weak: 0.2, duration: 90 }
            ], 400);
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

    // First-run onboarding (structured, minimal)
    if (gameState.firstRunTutorial) {
        if (gameState.floor === 13 && !tutorialState.shown.movement) {
            showTutorialHint('movement', 'Use WASD / Arrows to move. Beat the clock.', 5);
        }
        if (gameState.floor === 13 && !tutorialState.shown.exit) {
            for (const exit of gameState.exits) {
                const dist = Math.abs(exit.x - gameState.player.x) + Math.abs(exit.y - gameState.player.y);
                if (dist <= 3) {
                    showTutorialHint('exit', 'EXIT doors are in the corners. Step on one to descend.', 4);
                    break;
                }
            }
        }
        if (gameState.powerup && !tutorialState.shown.powerup) {
            const powerupName = gameState.powerup === 'speed' ? 'CAFFEINE RUSH' :
                               gameState.powerup === 'knockout' ? 'PINK SLIP' : 'STATIC SHOCK';
            showTutorialHint('powerup', `You got ${powerupName}! Press E to use it.`, 4);
        }
        if (gameState.floor === 12 && !tutorialState.shown.enemy && gameState.enemies.length > 0) {
            for (const enemy of gameState.enemies) {
                const dist = Math.abs(enemy.x - gameState.player.x) + Math.abs(enemy.y - gameState.player.y);
                if (dist <= 4 && enemy.stunned <= 0) {
                    showTutorialHint('enemy', 'Coworkers can stun you. Stun them first to buy time.', 4);
                    break;
                }
            }
        }
    }

    // Check for tutorial triggers (rebalanced for 13-floor game)
    if (gameState.floor === 13 && !tutorialState.shown.movement) {
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

    // Floor 7 secret hint (rebalanced from floor 13)
    if (gameState.floor === 7 && !tutorialState.shown.secret && gameState.secretExit) {
        showTutorialHint('secret', 'Floor 7... Something feels different. Look for a SECRET EXIT!', 5);
    }

    // Fire hazard hint - show when first fire spawns on floor 13
    if (gameState.floor === 13 && !tutorialState.shown.fire && gameState.fires.length > 0) {
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

    // Draw secret exit hints on Floor 7 (rebalanced from floor 13)
    if (gameState.floor === 7 && gameState.secretExit) {
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

    // Draw environmental hazards
    drawEnvironmentalHazards();

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

    // Draw clone decoy (if active)
    drawClone();

    // === TIME FREEZE EFFECT: Blue-tinted screen when enemies frozen ===
    if (gameState.timeFreezeActive) {
        ctx.fillStyle = 'rgba(0, 212, 255, 0.15)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Frozen particle effect
        if (Math.random() < 0.3) {
            const fx = Math.random() * canvas.width;
            const fy = Math.random() * canvas.height;
            ctx.fillStyle = 'rgba(200, 240, 255, 0.8)';
            ctx.fillRect(fx, fy, 2, 2);
        }
    }

    // === INVINCIBILITY EFFECT: Rainbow border when player is invincible ===
    if (gameState.player.invincible > 0) {
        const hue = (gameState.animationTime * 200) % 360;
        const borderWidth = 8;
        ctx.strokeStyle = `hsl(${hue}, 100%, 50%)`;
        ctx.lineWidth = borderWidth;
        ctx.strokeRect(borderWidth / 2, borderWidth / 2, canvas.width - borderWidth, canvas.height - borderWidth);
        ctx.lineWidth = 1;

        // Rainbow sparkles
        for (let i = 0; i < 3; i++) {
            const sparkX = Math.random() * canvas.width;
            const sparkY = Math.random() * canvas.height;
            const sparkHue = (hue + i * 60) % 360;
            ctx.fillStyle = `hsl(${sparkHue}, 100%, 70%)`;
            ctx.beginPath();
            ctx.arc(sparkX, sparkY, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

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

    // === ENDLESS MODE: Blackout danger zone effect ===
    if (gameState.endlessMode && gameState.endlessDangerZone === 'blackout') {
        // Draw darkness with a spotlight around the player
        const playerScreenX = gameState.player.x * TILE_SIZE + TILE_SIZE / 2;
        const playerScreenY = gameState.player.y * TILE_SIZE + TILE_SIZE / 2;
        const visRadius = (gameState.endlessBlackoutRadius || 5) * TILE_SIZE;

        // Create radial gradient for spotlight effect
        const blackoutGradient = ctx.createRadialGradient(
            playerScreenX, playerScreenY, visRadius * 0.3,
            playerScreenX, playerScreenY, visRadius
        );
        blackoutGradient.addColorStop(0, 'rgba(0,0,0,0)');
        blackoutGradient.addColorStop(0.7, 'rgba(0,0,0,0.5)');
        blackoutGradient.addColorStop(1, 'rgba(0,0,0,0.95)');

        ctx.fillStyle = blackoutGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // === ENDLESS MODE: Milestone flash effect ===
    if (gameState.milestoneFlash && gameState.milestoneFlash > 0) {
        const flashAlpha = Math.min(gameState.milestoneFlash, 1) * 0.5;
        ctx.fillStyle = `rgba(255, 215, 0, ${flashAlpha})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
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

    // === ENEMY SPAWN FLASH: Brief white flash when floor starts ===
    if (gameState.enemySpawnFlash > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${gameState.enemySpawnFlash * 0.3})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // === DAMAGE FLASH: Red vignette when player takes damage ===
    if (gameState.damageFlashTimer > 0) {
        const intensity = gameState.damageFlashTimer / 0.3; // Normalize to 0-1
        const gradient = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, canvas.width * 0.2,
            canvas.width / 2, canvas.height / 2, canvas.width * 0.6
        );
        gradient.addColorStop(0, 'rgba(255, 0, 0, 0)');
        gradient.addColorStop(1, `rgba(255, 0, 0, ${intensity * 0.4})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

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
    if (gameState.endlessMode) {
        // === ENDLESS MODE: Show floor as negative with score ===
        const floorDisplay = `-${gameState.endlessFloor}`;
        let modeLabel = ' [ENDLESS]';
        if (gameState.endlessDangerZone) {
            const zone = DANGER_ZONES[gameState.endlessDangerZone];
            modeLabel = ` ⚠️${zone.name}`;
        } else if (gameState.endlessIsBreatherFloor) {
            modeLabel = ' 😮‍💨';
        }
        document.getElementById('floor').textContent = `Floor: ${floorDisplay}${modeLabel}`;
    } else {
        // === Standard/Quick Run mode ===
        const startFloor = gameState.quickRunMode ? 5 : 13;
        const floorsCleared = startFloor - gameState.floor;
        const modeLabel = gameState.quickRunMode ? ' [QUICK]' : '';
        document.getElementById('floor').textContent = `Floor: ${gameState.floor} (${floorsCleared}/${startFloor})${modeLabel}`;
    }

    // Timer display - show if burning (drains 2x)
    const timerEl = document.getElementById('timer');
    const currentSecond = Math.ceil(gameState.timer);

    // Trigger pulse when second changes
    if (currentSecond !== gameState.lastTimerSecond && gameState.lastTimerSecond !== -1) {
        gameState.timerPulseScale = 1.15; // Pop effect
    }
    gameState.lastTimerSecond = currentSecond;

    // Apply pulse scale to timer element
    const pulseScale = gameState.timerPulseScale || 1.0;
    timerEl.style.transform = `scale(${pulseScale})`;
    timerEl.style.transition = 'transform 0.1s ease-out';

    if (gameState.player.burning > 0) {
        timerEl.textContent = `Time: ${currentSecond} 🔥2X`;
        timerEl.style.color = '#ff4500';
    } else {
        timerEl.textContent = `Time: ${currentSecond}`;
        timerEl.style.color = gameState.timer <= 5 ? '#e94560' : '#ff6b6b';
    }

    // === Coin display shows spendable currency (real-time) ===
    const coinDisplay = document.getElementById('coinDisplay');
    if (coinDisplay) {
        const comboText = gameState.coinCombo > 1 ? ` x${gameState.coinCombo}` : '';
        // Show coinsCollected (the actual currency value) not the count
        coinDisplay.textContent = `🪙 ${gameState.coinsCollected || 0}${comboText}`;
        coinDisplay.style.color = gameState.coinCombo > 2 ? '#f39c12' : '#f1c40f';
    }

    // === FLOW DISPLAY ===
    const flowEl = document.getElementById('flow');
    if (flowEl) {
        const flowPercent = Math.round(((gameState.flow || 0) / FLOW_MAX) * 100);
        flowEl.textContent = `FLOW ${flowPercent}%`;
        if (gameState.flowStateActive) {
            const pulse = Math.sin(gameState.animationTime * 8) * 0.5 + 0.5;
            flowEl.style.color = '#9ff3ee';
            flowEl.style.textShadow = `0 0 ${8 + pulse * 10}px rgba(110, 231, 222, ${0.6 + pulse * 0.4})`;
        } else {
            flowEl.style.color = '#6ee7de';
            flowEl.style.textShadow = 'none';
        }
    }

    let powerupText = 'None';
    let powerupExpiring = false; // Track if any powerup is about to expire

    if (gameState.player.burning > 0) {
        // Show burn timer when burning
        powerupText = `🔥 BURNING ${gameState.player.burning.toFixed(1)}s`;
    } else if (gameState.player.stunned > 0) {
        // Show stun timer when stunned
        powerupText = `😵 STUNNED ${gameState.player.stunned.toFixed(1)}s`;
    } else if (gameState.player.shielded > 0) {
        // Show shield timer
        powerupText = `🛡️ SHIELD ${gameState.player.shielded.toFixed(1)}s`;
        powerupExpiring = gameState.player.shielded <= 3;
    } else if (gameState.powerup === 'speed') {
        powerupText = `⚡ Speed ${gameState.powerupTimer.toFixed(1)}s`;
        powerupExpiring = gameState.powerupTimer <= 3;
    } else if (gameState.powerup === 'knockout') {
        powerupText = `🥊 Knockout ${gameState.powerupTimer.toFixed(1)}s`;
        powerupExpiring = gameState.powerupTimer <= 3;
    } else if (gameState.powerup === 'electric') {
        powerupText = `⚡ ELECTRIC ${gameState.powerupTimer.toFixed(1)}s`;
        powerupExpiring = gameState.powerupTimer <= 3;
    } else if (gameState.powerup === 'ghost') {
        powerupText = `👻 GHOST ${gameState.powerupTimer.toFixed(1)}s`;
        powerupExpiring = gameState.powerupTimer <= 1.5; // Shorter warning for shorter powerup
    } else if (gameState.powerup === 'overclock') {
        powerupText = `🚨 OVERCLOCK ${gameState.powerupTimer.toFixed(1)}s`;
        powerupExpiring = gameState.powerupTimer <= 2;
    } else if (gameState.player.invincible > 0) {
        powerupText = `⭐ INVINCIBLE ${gameState.player.invincible.toFixed(1)}s`;
        powerupExpiring = gameState.player.invincible <= 3;
    }

    // Add companion indicator if active
    if (gameState.player.companion) {
        powerupText += ` | 🐕 ${gameState.player.companion.timer.toFixed(1)}s`;
    }

    // Add clone indicator if active
    if (gameState.clone) {
        powerupText += ` | 👤 DECOY ${gameState.clone.timer.toFixed(1)}s`;
    }

    // Add time freeze indicator if active
    if (gameState.timeFreezeActive) {
        powerupText += ` | ⏸️ FREEZE ${gameState.timeFreezeTimer.toFixed(1)}s`;
    }

    // Add coin magnet indicator if active
    if (gameState.coinMagnetActive) {
        powerupText += ` | 🧲 MAGNET ${gameState.coinMagnetTimer.toFixed(1)}s`;
    }

    const powerupEl = document.getElementById('powerup');
    powerupEl.textContent = `Power: ${powerupText}`;

    // === POWERUP EXPIRATION WARNING: Flash when about to expire ===
    if (powerupExpiring) {
        const pulse = Math.sin(gameState.animationTime * 10) * 0.5 + 0.5;
        powerupEl.style.color = `rgb(255, ${Math.floor(100 + pulse * 155)}, ${Math.floor(pulse * 100)})`;
        powerupEl.style.textShadow = `0 0 ${5 + pulse * 10}px rgba(255, 100, 0, ${0.5 + pulse * 0.5})`;

        // Play warning beep at 3s and 1s remaining (scaled)
        const timerVal = gameState.powerupTimer || gameState.player.shielded || gameState.player.invincible || 0;
        if (!gameState._powerupWarnedAt3 && timerVal <= 3 && timerVal > 2.9) {
            AudioManager.play('timerWarning', 0.28, 1.35);
            Haptics.pulse('powerupWarn', 0.18, 0.22, 70, 300);
            gameState._powerupWarnedAt3 = true;
        }
        if (!gameState._powerupWarnedAt1 && timerVal <= 1 && timerVal > 0.9) {
            AudioManager.play('timerWarning', 0.45, 1.8);
            Haptics.pulse('powerupWarn', 0.28, 0.35, 90, 300);
            gameState._powerupWarnedAt1 = true;
        }
    } else {
        powerupEl.style.color = '';
        powerupEl.style.textShadow = '';
        gameState._powerupWarnedAt3 = false;
        gameState._powerupWarnedAt1 = false;
    }

    // === DASH/PUNCH COOLDOWN INDICATORS ===
    const skillsEl = document.getElementById('skillCooldowns');
    if (skillsEl) {
        const dashReady = gameState.player.dashCooldown <= 0;
        const punchReady = gameState.player.punchCooldown <= 0;

        const dashText = dashReady ? '🏃 DASH' : `🏃 ${gameState.player.dashCooldown.toFixed(1)}s`;
        const punchText = punchReady ? '👊 PUNCH' : `👊 ${gameState.player.punchCooldown.toFixed(1)}s`;

        // === WALL BREAKER INDICATOR (only show if unlocked) ===
        let wallBreakText = '';
        if (gameState.hasWallBreaker) {
            const wallBreakReady = gameState.player.wallBreakCooldown <= 0;
            wallBreakText = wallBreakReady ?
                ' | <span style="color:#9b59b6;text-shadow:0 0 5px #9b59b6;">🧱 SMASH</span>' :
                ` | <span style="color:#666">🧱 ${gameState.player.wallBreakCooldown.toFixed(1)}s</span>`;
        }

        // === SEVERANCE PACKAGE INDICATOR (only show if unlocked from Vault) ===
        let severanceText = '';
        if (playerStats.hasSeverancePackage) {
            if (gameState.severanceAvailable) {
                severanceText = ' | <span style="color:#3498db;text-shadow:0 0 8px #3498db;animation:pulse 1s infinite;">💼 [V] SEVERANCE</span>';
            } else {
                severanceText = ' | <span style="color:#666">💼 USED</span>';
            }
        }

        // === COMBO COUNTER ===
        let comboText = '';
        if (gameState.killCombo >= 2) {
            const comboColor = getComboDisplayColor(gameState.killCombo);
            comboText = ` | <span style="color:${comboColor};font-weight:bold;text-shadow:0 0 10px ${comboColor};">x${gameState.killCombo} COMBO</span>`;
        }

        // === KILL STREAK INDICATOR ===
        let streakText = '';
        if (gameState.killStreak >= STREAK_RAMPAGE) {
            const streakColor = gameState.killStreak >= STREAK_GODLIKE ? '#ffd700' :
                               gameState.killStreak >= STREAK_UNSTOPPABLE ? '#ff00ff' : '#ff6b00';
            const streakLabel = gameState.killStreak >= STREAK_GODLIKE ? '👑' :
                               gameState.killStreak >= STREAK_UNSTOPPABLE ? '⚡' : '🔥';
            streakText = ` <span style="color:${streakColor}">${streakLabel}${gameState.killStreak}</span>`;
        }

        skillsEl.innerHTML = `<span style="color:${dashReady ? '#00d2d3' : '#666'}">${dashText}</span> | <span style="color:${punchReady ? '#e74c3c' : '#666'}">${punchText}</span>${wallBreakText}${severanceText}${comboText}${streakText}`;
    }

    // Get combo display color
    function getComboDisplayColor(combo) {
        if (combo >= 8) return '#ff00ff'; // Magenta
        if (combo >= 6) return '#ff4500'; // Orange-red
        if (combo >= 4) return '#ffd700'; // Gold
        return '#ff6b6b'; // Light red
    }

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

    // Ghost Walk power-up: Pass through walls and desks
    if (gameState.powerup === 'ghost' && gameState.powerupTimer > 0) {
        // Can pass through anything except map boundaries (already checked)
        return tile !== undefined;
    }

    // Desk Vault perk: Dash through desks (handled in performDash)
    // Phase Dash perk: Dash through walls AND desks (handled in performDash)

    return tile !== TILE.WALL && tile !== TILE.DESK;
}

function pushEnemyAway(enemy, fromX, fromY) {
    // Push enemy away from a position
    const dx = enemy.x - fromX;
    const dy = enemy.y - fromY;

    // Store original position for knockback visual
    const oldX = enemy.x;
    const oldY = enemy.y;

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

            // === VISUAL KNOCKBACK: Animate enemy being pushed ===
            enemy.knockbackX = (oldX - opt.x) * TILE_SIZE * 0.5; // Start offset toward old position
            enemy.knockbackY = (oldY - opt.y) * TILE_SIZE * 0.5;
            enemy.knockbackTimer = 0.25; // 0.25s knockback animation

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

                    // Knockback visual for fallback pushes too
                    enemy.knockbackX = (oldX - checkX) * TILE_SIZE * 0.3;
                    enemy.knockbackY = (oldY - checkY) * TILE_SIZE * 0.3;
                    enemy.knockbackTimer = 0.2;

                    return true;
                }
            }
        }
    }

    return false;
}

function fryEnemy(enemy) {
    AudioManager.play('zap'); // Electric zap sound
    Haptics.pulse('zap', 0.7, 0.45, 120, 80);
    screenShake.trigger(8, 0.2); // Small shake on zap
    triggerFreezeFrame('electricZap'); // Longer freeze for satisfying zap

    // === CONTRIBUTE TO KILL COMBO! ===
    const comboWindow = 2.5; // Generous window for chaining zaps
    if (gameState.killComboTimer > 0) {
        gameState.killCombo = Math.min(gameState.killCombo + 1, 20);
    } else {
        gameState.killCombo = 1;
    }
    gameState.killComboTimer = comboWindow;
    gameState.killStreak++;

    // Update max combo
    if (gameState.killCombo > gameState.maxComboThisRun) {
        gameState.maxComboThisRun = gameState.killCombo;
    }

    // Show combo celebration for zaps
    if (gameState.killCombo >= 3) {
        showCelebration('electricChain', { count: gameState.killCombo });
    }

    // Drop coins from fried enemies (more generous)
    const coinValue = 5 + Math.floor(Math.random() * 10);
    gameState.coins.push({
        x: enemy.x,
        y: enemy.y,
        value: coinValue
    });

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

            // Spawn fire! - Now starts bigger on later floors
            const startSize = gameState.floor <= 4 ? 2 : 1; // Floors 1-4 start at size 2
            gameState.fires.push({
                x: x,
                y: y,
                size: startSize,
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

// === ENVIRONMENTAL HAZARDS SYSTEM ===
// Spawn and update additional office hazards (start at floor 7, intensify toward floor 1)

function spawnEnvironmentalHazards() {
    const config = getHazardsForFloor(gameState.floor);

    // Spawn sparking wires
    while (gameState.sparkingWires.length < config.sparkingWires) {
        const pos = findValidHazardPosition();
        if (pos) {
            gameState.sparkingWires.push({
                x: pos.x,
                y: pos.y,
                sparkTimer: 0,
                active: true,
                nextSparkTime: 2 + Math.random() * 3 // Random spark interval
            });
        } else break;
    }

    // Spawn coffee spills
    while (gameState.coffeeSpills.length < config.coffeeSpills) {
        const pos = findValidHazardPosition();
        if (pos) {
            gameState.coffeeSpills.push({
                x: pos.x,
                y: pos.y,
                size: 1 + Math.floor(Math.random() * 2), // 1-2 tile radius
                drying: false,
                age: 0
            });
        } else break;
    }

    // Spawn malfunctioning copiers
    while (gameState.malfunctioningCopiers.length < config.malfunctioningCopiers) {
        const pos = findValidHazardPosition();
        if (pos) {
            gameState.malfunctioningCopiers.push({
                x: pos.x,
                y: pos.y,
                paperTimer: 0,
                nextPaperTime: 5 + Math.random() * 5, // Spawn paper enemy every 5-10s
                jammed: false
            });
        } else break;
    }
}

function findValidHazardPosition() {
    let attempts = 0;
    while (attempts < 30) {
        const x = Math.floor(Math.random() * (MAP_WIDTH - 4)) + 2;
        const y = Math.floor(Math.random() * (MAP_HEIGHT - 4)) + 2;

        if (gameState.maze[y] && gameState.maze[y][x] === TILE.FLOOR) {
            // Not too close to player
            const distToPlayer = Math.abs(x - gameState.player.x) + Math.abs(y - gameState.player.y);
            if (distToPlayer < 4) { attempts++; continue; }

            // Not near exits
            let nearExit = false;
            for (const exit of gameState.exits) {
                if (Math.abs(x - exit.x) <= 3 && Math.abs(y - exit.y) <= 3) {
                    nearExit = true;
                    break;
                }
            }
            if (nearExit) { attempts++; continue; }

            // Not on fire or existing hazard
            let occupied = false;
            for (const fire of gameState.fires) {
                if (fire.x === x && fire.y === y) { occupied = true; break; }
            }
            for (const wire of gameState.sparkingWires) {
                if (wire.x === x && wire.y === y) { occupied = true; break; }
            }
            for (const spill of gameState.coffeeSpills) {
                if (Math.abs(spill.x - x) <= spill.size && Math.abs(spill.y - y) <= spill.size) { occupied = true; break; }
            }
            for (const copier of gameState.malfunctioningCopiers) {
                if (copier.x === x && copier.y === y) { occupied = true; break; }
            }
            if (occupied) { attempts++; continue; }

            return { x, y };
        }
        attempts++;
    }
    return null;
}

function updateEnvironmentalHazards(deltaTime) {
    // Update sparking wires
    for (const wire of gameState.sparkingWires) {
        wire.sparkTimer += deltaTime;

        // Spark periodically
        if (wire.sparkTimer >= wire.nextSparkTime) {
            wire.sparkTimer = 0;
            wire.nextSparkTime = 2 + Math.random() * 3;

            // Create spark particles
            for (let i = 0; i < 6; i++) {
                gameState.particles.push({
                    x: wire.x * TILE_SIZE + TILE_SIZE / 2,
                    y: wire.y * TILE_SIZE + TILE_SIZE / 2,
                    vx: (Math.random() - 0.5) * 8,
                    vy: (Math.random() - 0.5) * 8,
                    size: 2 + Math.random() * 3,
                    color: Math.random() < 0.5 ? '#ffff00' : '#00ffff',
                    life: 0.3 + Math.random() * 0.2
                });
            }

            // Damage player if on same tile
            if (gameState.player.x === wire.x && gameState.player.y === wire.y) {
                if (gameState.player.stunned <= 0 && gameState.player.shielded <= 0) {
                    gameState.player.stunned = 1.5; // Electric shock stun
                    showCelebration('shocked');
                    screenShake.trigger(10, 0.2);
                    AudioManager.play('electricCollect', 0.8);
                }
            }
        }
    }

    // Update coffee spills - slow player when walking through
    for (const spill of gameState.coffeeSpills) {
        spill.age += deltaTime;

        // Check if player is in spill area
        const dx = Math.abs(gameState.player.x - spill.x);
        const dy = Math.abs(gameState.player.y - spill.y);
        if (dx <= spill.size && dy <= spill.size) {
            // Player is slowed (handled in movement via gameState.playerSlowed)
            gameState.playerSlowed = true;
            gameState.slowedTimer = 0.5; // Reset slow timer
        }
    }

    // Update player slow effect
    if (gameState.slowedTimer !== undefined && gameState.slowedTimer > 0) {
        gameState.slowedTimer -= deltaTime;
        if (gameState.slowedTimer <= 0) {
            gameState.playerSlowed = false;
        }
    }

    // Update malfunctioning copiers - spawn paper enemies
    for (const copier of gameState.malfunctioningCopiers) {
        if (copier.jammed) continue;

        copier.paperTimer += deltaTime;

        if (copier.paperTimer >= copier.nextPaperTime) {
            copier.paperTimer = 0;
            copier.nextPaperTime = 5 + Math.random() * 5;

            // Spawn a paper enemy (fast, weak intern-type)
            const spawnX = copier.x + (Math.random() < 0.5 ? 1 : -1);
            const spawnY = copier.y;

            if (canMove(spawnX, spawnY)) {
                gameState.enemies.push({
                    x: spawnX,
                    y: spawnY,
                    stunned: 0,
                    frame: 0,
                    enemyType: 'intern', // Fast paper enemy
                    health: 1,
                    maxHealth: 1,
                    special: null,
                    isPaperEnemy: true, // Mark as paper enemy for visual
                    spawnTime: Date.now()
                });

                // Paper burst particles
                for (let i = 0; i < 8; i++) {
                    gameState.particles.push({
                        x: copier.x * TILE_SIZE + TILE_SIZE / 2,
                        y: copier.y * TILE_SIZE + TILE_SIZE / 2,
                        vx: (Math.random() - 0.5) * 6,
                        vy: -Math.random() * 4 - 2,
                        size: 4 + Math.random() * 4,
                        color: '#ffffff',
                        life: 0.5
                    });
                }

                // Only show Paper Jam celebration if player is nearby (within 5 tiles)
                const distToCopier = Math.abs(gameState.player.x - copier.x) + Math.abs(gameState.player.y - copier.y);
                if (distToCopier <= 5) {
                    showCelebration('paperJam');
                }
            }
        }
    }
}

function drawEnvironmentalHazards() {
    // Draw sparking wires
    for (const wire of gameState.sparkingWires) {
        const x = wire.x * TILE_SIZE;
        const y = wire.y * TILE_SIZE;

        // Wire base (dark gray cable)
        ctx.fillStyle = '#333';
        ctx.fillRect(x + 4, y + TILE_SIZE - 8, TILE_SIZE - 8, 4);
        ctx.fillRect(x + TILE_SIZE / 2 - 2, y + TILE_SIZE / 2, 4, TILE_SIZE / 2 - 4);

        // Spark glow (pulsing)
        const sparkIntensity = Math.sin(gameState.animationTime * 15) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(255, 255, 0, ${0.3 + sparkIntensity * 0.4})`;
        ctx.beginPath();
        ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 8 + sparkIntensity * 4, 0, Math.PI * 2);
        ctx.fill();

        // Warning sign
        ctx.fillStyle = '#ff0';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('⚡', x + TILE_SIZE / 2, y + 12);
    }

    // Draw coffee spills
    for (const spill of gameState.coffeeSpills) {
        const x = spill.x * TILE_SIZE;
        const y = spill.y * TILE_SIZE;
        const radius = spill.size * TILE_SIZE / 2;

        // Brown coffee puddle
        ctx.fillStyle = 'rgba(101, 67, 33, 0.7)';
        ctx.beginPath();
        ctx.ellipse(x + TILE_SIZE / 2, y + TILE_SIZE / 2, radius, radius * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Shine highlight
        ctx.fillStyle = 'rgba(150, 100, 50, 0.4)';
        ctx.beginPath();
        ctx.ellipse(x + TILE_SIZE / 2 - 4, y + TILE_SIZE / 2 - 4, radius * 0.3, radius * 0.2, 0.5, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw malfunctioning copiers
    for (const copier of gameState.malfunctioningCopiers) {
        const x = copier.x * TILE_SIZE;
        const y = copier.y * TILE_SIZE;

        // Copier body
        ctx.fillStyle = '#555';
        ctx.fillRect(x + 2, y + 4, TILE_SIZE - 4, TILE_SIZE - 8);

        // Screen (glitching)
        const glitch = Math.sin(gameState.animationTime * 20) > 0;
        ctx.fillStyle = glitch ? '#0f0' : '#0a0';
        ctx.fillRect(x + 6, y + 8, TILE_SIZE - 12, 8);

        // Paper tray
        ctx.fillStyle = '#ddd';
        ctx.fillRect(x + 4, y + TILE_SIZE - 10, TILE_SIZE - 8, 6);

        // Warning light (blinking)
        const blink = Math.sin(gameState.animationTime * 8) > 0;
        ctx.fillStyle = blink ? '#f00' : '#600';
        ctx.beginPath();
        ctx.arc(x + TILE_SIZE - 8, y + 10, 3, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Update spatial audio cues based on nearby threats
function updateSpatialAudio() {
    if (!settings.audioProximityCues) return;

    const px = gameState.player.x;
    const py = gameState.player.y;
    const now = Date.now();
    const timerUrgency = Math.max(0, Math.min(1, (10 - gameState.timer) / 10));
    const floorFactor = gameState.endlessMode
        ? Math.min(1, (gameState.endlessFloor || 1) / 50)
        : Math.min(1, Math.max(0, (13 - gameState.floor) / 12));
    let closeEnemy = false;
    let closeFire = false;
    let closeExit = false;

    // Throttle audio updates to prevent overwhelming
    if (!gameState.lastSpatialAudioTime) gameState.lastSpatialAudioTime = 0;
    if (now - gameState.lastSpatialAudioTime < 300) return;
    gameState.lastSpatialAudioTime = now;

    // Play fire crackle sounds for nearby fires
    for (const fire of gameState.fires) {
        const dist = Math.sqrt(Math.pow(fire.x - px, 2) + Math.pow(fire.y - py, 2));
        const sizeBoost = Math.min(0.3, (fire.size || 1) * 0.1);
        const chance = 0.18 + sizeBoost + timerUrgency * 0.2 + floorFactor * 0.15;
        if (dist < 6 && Math.random() < chance) { // Random chance to avoid constant noise
            const volume = 0.2 + sizeBoost + timerUrgency * 0.2;
            AudioManager.playPositional('fireCrackle', fire.x, fire.y, px, py, volume, 8);
        }
        if (dist <= 3) closeFire = true;
    }

    // Play enemy footstep sounds for nearby enemies
    for (const enemy of gameState.enemies) {
        if (enemy.stunned > 0 || enemy.scared > 0) continue;
        const dist = Math.sqrt(Math.pow(enemy.x - px, 2) + Math.pow(enemy.y - py, 2));
        const chance = 0.12 + timerUrgency * 0.15 + floorFactor * 0.12;
        if (dist < 8 && dist > 2 && Math.random() < chance) {
            const volume = 0.18 + timerUrgency * 0.18;
            AudioManager.playPositional('enemyStep', enemy.x, enemy.y, px, py, volume, 10);
        }
        if (dist <= 3) closeEnemy = true;
    }

    // Play exit hum when near an exit
    for (const exit of gameState.exits) {
        const dist = Math.sqrt(Math.pow(exit.x - px, 2) + Math.pow(exit.y - py, 2));
        const chance = 0.1 + timerUrgency * 0.2;
        if (dist < 5 && Math.random() < chance) {
            const volume = 0.12 + timerUrgency * 0.25;
            AudioManager.playPositional('exitHum', exit.x, exit.y, px, py, volume, 6);
        }
        if (dist <= 2) closeExit = true;
    }

    // Accessibility: subtle proximity haptics for hazards
    if (closeEnemy || closeFire) {
        const dangerLevel = (closeEnemy && closeFire) ? 0.12 : 0.08;
        Haptics.pulse('hazardNear', dangerLevel, dangerLevel + 0.04, 50, 250);
    }

    // Accessibility: gentle exit proximity cue
    if (closeExit) {
        Haptics.pulse('exitNear', 0.06, 0.1, 45, 400);
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
    // Rebalanced for 13-floor game
    if (gameState.floor >= 11) {
        baseInterval = 15;  // Floors 11-13: gentle intro
        randomRange = 5;
    } else if (gameState.floor >= 8) {
        baseInterval = 12;  // Floors 8-10
        randomRange = 4;
    } else if (gameState.floor >= 5) {
        baseInterval = 10;  // Floors 5-7
        randomRange = 4;
    } else {
        baseInterval = 6;   // Floors 1-4: fast spawning
        randomRange = 4;
    }

    if (gameState.fireSpawnTimer > baseInterval + Math.random() * randomRange) {
        spawnFire();
        gameState.fireSpawnTimer = 0;
    }

    // Update each fire
    for (const fire of gameState.fires) {
        fire.age += deltaTime;

        // Fire grows over time (max size 3) - FASTER growth for more intensity
        const growthMultiplier = gameState.floor >= 9 ? 0.8 : (gameState.floor >= 5 ? 0.5 : 0.3);
        const size2Threshold = 3 * growthMultiplier;   // 2.4s / 1.5s / 0.9s
        const size3Threshold = 6 * growthMultiplier;   // 4.8s / 3s / 1.8s
        if (fire.age > size2Threshold && fire.size < 2) fire.size = 2;
        if (fire.age > size3Threshold && fire.size < 3) fire.size = 3;

        // Check if player is on fire (skip player-created fires)
        // Unstoppable perk: immune to fire damage
        if (fire.x === gameState.player.x && fire.y === gameState.player.y && !fire.isPlayerFire) {
            if (!gameState.perks.includes('unstoppable')) {
                // Player is BURNING!
                if (gameState.player.burning <= 0) {
                    gameState.player.burning = 2.0;  // 2 seconds of burn
                    playerStats.timesBurned++;
                    Haptics.pulse('burn', 0.6, 0.4, 140, 200);
                }
            }
        }

        // Auto-extinguish player-created fires after their lifespan
        if (fire.isPlayerFire && fire.age > (fire.lifespan || 5)) {
            fire.expired = true;
        }

        // Player-created fires damage enemies!
        if (fire.isPlayerFire) {
            for (const enemy of gameState.enemies) {
                if (enemy.x === fire.x && enemy.y === fire.y && enemy.stunned <= 0) {
                    // Burn the enemy!
                    enemy.health = (enemy.health || 1) - 1;
                    if (enemy.health <= 0) {
                        enemy.stunned = PUNCH_STUN_DURATION;
                        enemy.health = enemy.maxHealth || 1;
                        gameState.enemiesKnockedOut++;
                        gameState.killStreak++;

                        // Time bonus for fire kill
                        const timeBonus = 3;
                        gameState.timer += timeBonus;
                        showCelebration('fireKill');

                        // Chain reaction for HR Karen
                        if (enemy.special === 'explode') {
                            triggerEnemyExplosion(enemy);
                        }
                    } else {
                        enemy.stunned = 0.5; // Stagger
                    }

                    // Fire kill particle burst
                    for (let p = 0; p < 8; p++) {
                        gameState.particles.push({
                            x: fire.x * TILE_SIZE + TILE_SIZE / 2,
                            y: fire.y * TILE_SIZE + TILE_SIZE / 2,
                            vx: (Math.random() - 0.5) * 6,
                            vy: (Math.random() - 0.5) * 6 - 2,
                            size: 4 + Math.random() * 4,
                            color: Math.random() < 0.5 ? '#e67e22' : '#f1c40f',
                            life: 0.4
                        });
                    }
                }
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

    // Remove expired fires (player-created fires that have timed out)
    gameState.fires = gameState.fires.filter(f => !f.expired);
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

// Add punch visual effect with enemy-type variety
function addPunchEffect(x, y, enemyType = 'coworker') {
    AudioManager.playRandomPunch(); // Random punch variant for variety
    screenShake.trigger(6, 0.15); // Small shake on punch

    // Get enemy-specific colors from ENEMY_ASSETS
    const enemyAsset = ENEMY_ASSETS[enemyType] || ENEMY_ASSETS.coworker;
    const trailColor = enemyAsset.trailColor || { primary: '#e74c3c', secondary: '#c0392b' };

    gameState.punchEffects.push({
        x: x,
        y: y,
        timer: 0.5,  // Half second burst
        scale: 1,
        particles: []
    });

    // Add burst particles - more for tougher enemies
    const particleCount = enemyType === 'it_support' ? 12 : (enemyType === 'hr_karen' ? 10 : 8);
    for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * Math.PI * 2;
        const speed = enemyType === 'it_support' ? 4 : 3;
        gameState.punchEffects[gameState.punchEffects.length - 1].particles.push({
            x: x * TILE_SIZE + TILE_SIZE / 2,
            y: y * TILE_SIZE + TILE_SIZE / 2,
            vx: Math.cos(angle) * speed + (Math.random() - 0.5),
            vy: Math.sin(angle) * speed + (Math.random() - 0.5),
            size: 6 + Math.random() * 4,
            color: i % 2 === 0 ? trailColor.primary : trailColor.secondary
        });
    }

    // Add stun stars that orbit the impact point
    for (let i = 0; i < 3; i++) {
        gameState.particles.push({
            x: x * TILE_SIZE + TILE_SIZE / 2,
            y: y * TILE_SIZE + TILE_SIZE / 2,
            vx: 0,
            vy: -1.5 - Math.random(),
            size: 6,
            color: '#f1c40f',
            lifetime: 0.6,
            type: 'star'
        });
    }
}

function handlePlayerEnemyCollision(enemy) {
    const inBathroom = isInBathroom(gameState.player.x, gameState.player.y);

    // No collision effects in bathroom
    if (inBathroom) return;

    // === UNSTOPPABLE PERK - Immune to stuns and knockbacks ===
    if (gameState.perks.includes('unstoppable')) {
        // Push enemy away but player is unaffected
        enemy.stunned = 1.0;
        pushEnemyAway(enemy, gameState.player.x, gameState.player.y);
        return;
    }

    // === DASH INVINCIBILITY - Player phases through enemies during dash ===
    if (gameState.player.dashInvincible > 0) {
        // Player dashed through enemy - bonus style points!
        gameState.enemiesDodged++;
        // Small particle effect for style
        for (let i = 0; i < 4; i++) {
            gameState.particles.push({
                x: enemy.x * TILE_SIZE + TILE_SIZE / 2,
                y: enemy.y * TILE_SIZE + TILE_SIZE / 2,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                size: 3,
                color: '#00d2d3',
                life: 0.3
            });
        }
        return;
    }

    // Shield protects player from all damage!
    if (gameState.player.shielded > 0) {
        // Push enemy away and stun briefly without hurting player
        enemy.stunned = 1.5;
        pushEnemyAway(enemy, gameState.player.x, gameState.player.y);
        Haptics.pulse('shieldBlock', 0.4, 0.25, 90, 120);
        return;
    }

    // === INVINCIBILITY: Rainbow star power! ===
    if (gameState.player.invincible > 0) {
        // Knock out any enemy on contact!
        enemy.stunned = 3;
        enemy.health = 0;
        gameState.enemiesKnockedOut++;
        pushEnemyAway(enemy, gameState.player.x, gameState.player.y);

        // Rainbow particles!
        const colors = ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#8b00ff'];
        for (let i = 0; i < 10; i++) {
            gameState.particles.push({
                x: enemy.x * TILE_SIZE + TILE_SIZE / 2,
                y: enemy.y * TILE_SIZE + TILE_SIZE / 2,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                size: 5,
                color: colors[Math.floor(Math.random() * colors.length)],
                life: 0.5
            });
        }
        AudioManager.play('punch1', 0.8);
        Haptics.pulse('invincibleHit', 0.35, 0.3, 90, 80);
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
        // Add punch visual effect with enemy-type specific colors
        addPunchEffect(enemy.x, enemy.y, enemy.enemyType || 'coworker');
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
        breakFlow();
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
        Haptics.pulse('playerHit', 0.9, 0.7, 180, 120);
        screenShake.trigger(10, 0.25); // Medium shake when hit
        triggerFreezeFrame('playerHit'); // Impact freeze frame for game feel
        gameState.damageFlashTimer = 0.3; // Red vignette flash for impact feedback

        gameState.player.hitCount++;
        gameState.player.lastHitTime = Date.now();
        const stunDuration = getStunDuration(gameState.player.hitCount);
        gameState.player.stunned = stunDuration;
        playerProgress.wasHitThisRun = true; // Track for perfect run
        breakFlow();

        // === KILL STREAK RESET: Getting hit breaks your streak ===
        if (gameState.killStreak >= 3) {
            showCelebration('comboBreak');
            Haptics.pulse('comboBreak', 0.35, 0.2, 120, 300);
        }
        gameState.killStreak = 0;
        gameState.killCombo = 0;
        gameState.killComboTimer = 0;

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
    if (Date.now() - lastMove < getEffectiveMoveDelay()) return false;

    const newX = gameState.player.x + dx;
    const newY = gameState.player.y + dy;

    if (canMove(newX, newY)) {
        // Play footstep sound (quieter, randomized)
        if (Math.random() < 0.5) AudioManager.play('footstep', 0.3);

        // === DIRECTION CHANGE DUST: Spawn particles on 90° turns ===
        const prevDir = gameState.player.lastDashDir || { x: 0, y: 0 };
        const isDirectionChange = (prevDir.x !== 0 && dx === 0 && dy !== 0) ||
                                  (prevDir.y !== 0 && dy === 0 && dx !== 0);
        if (isDirectionChange && (prevDir.x !== 0 || prevDir.y !== 0)) {
            // Spawn 2-3 dust particles at feet
            for (let p = 0; p < 2 + Math.floor(Math.random() * 2); p++) {
                gameState.particles.push({
                    x: gameState.player.x * TILE_SIZE + TILE_SIZE / 2,
                    y: gameState.player.y * TILE_SIZE + TILE_SIZE * 0.8,
                    vx: (Math.random() - 0.5) * 2 - prevDir.x * 1.5,
                    vy: (Math.random() - 0.5) * 1 - 0.5,
                    size: 3 + Math.random() * 2,
                    color: '#888',
                    lifetime: 0.4
                });
            }
        }

        gameState.player.x = newX;
        gameState.player.y = newY;
        gameState.player.direction = dx !== 0 ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0);
        gameState.player.lastDashDir = { x: dx, y: dy }; // Track for direction change detection
        lastMove = Date.now();

        // Track facing direction for sprite animation (1 = right, -1 = left)
        if (dx !== 0) {
            characterAnimationState.player.facingDirection = dx > 0 ? 1 : -1;
        }
        characterAnimationState.player.isMoving = true;
        characterAnimationState.player.lastMoveTime = Date.now();

        // Trigger stretch animation on movement start (Super Meat Boy feel)
        triggerStretch();
        addFlow(FLOW_GAIN_MOVE);

        // Check secret exit on floor 7 (rebalanced from floor 13)
        if (gameState.floor === 7 && gameState.secretExit) {
            if (gameState.player.x === gameState.secretExit.x && gameState.player.y === gameState.secretExit.y) {
                // Secret path! Jump straight to floor 1
                gameState.floor = 1;
                gameState.won = true;
                playerProgress.secretExitFound = true; // Unlock ghost character
                checkProgressUnlocks();
                showMessage('SECRET ESCAPE!', 'You found the hidden path from floor 7!', true);
                return;
            }
        }

        // Check regular exits
        for (let exitIndex = 0; exitIndex < gameState.exits.length; exitIndex++) {
            const exit = gameState.exits[exitIndex];
            if (gameState.player.x === exit.x && gameState.player.y === exit.y) {
                // === TRACK EXIT USAGE (for wall-breaker secret unlock) ===
                // Exits: 0=TL, 1=TR, 2=BL, 3=BR
                const exitCorners = ['TL', 'TR', 'BL', 'BR'];
                if (!gameState.exitsUsedThisRun) gameState.exitsUsedThisRun = new Set();
                gameState.exitsUsedThisRun.add(exitCorners[exitIndex]);

                // Check if all 4 exits have been used - unlock wall-breaker!
                if (gameState.exitsUsedThisRun.size >= 4 && !gameState.hasWallBreaker) {
                    gameState.hasWallBreaker = true;
                    showCelebration('wallBreakerUnlocked');
                    screenShake.trigger(20, 0.5);
                    AudioManager.play('powerup', 1.0);
                    updateSpecialTouchButtons(); // Show touch button for new ability
                }

                // === CLOSE CALL: Slow-motion + celebration for dramatic escapes ===
                if (gameState.timer <= 2 && gameState.timer > 0) {
                    // Ultra-clutch escape - dramatic slow-mo
                    showCelebration('clutchEscape');
                    triggerFreezeFrame('closeDodge');
                    gameState.slowMoActive = true;
                    gameState.slowMoTimer = 0.5;
                    gameState.slowMoFactor = 0.3;
                    screenShake.trigger(8, 0.3);
                } else if (gameState.timer <= 5 && gameState.timer > 2) {
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
            if (!coin.collected && !coin.collecting && gameState.player.x === coin.x && gameState.player.y === coin.y) {
                // Start pop animation instead of immediately marking collected
                coin.collecting = true;
                coin.collectScale = 1.3; // Pop up
                coin.collectAlpha = 1.0;
                // Coin multiplier perks: Vault Master (3x) > Lucky Coins (2x)
                let coinMultiplier = 1;
                if (gameState.perks.includes('vaultMaster')) coinMultiplier = 3;
                else if (gameState.perks.includes('luckyCoins')) coinMultiplier = 2;
                gameState.coinsCollected += coin.value * coinMultiplier;
                gameState.coinsCollectedCount++;

                // Combo system for rapid collection
                // Each coin extends the combo timer, making it easier to chain!
                const baseComboTime = 3.5; // Increased from 2.0 for easier chaining
                const comboBonus = Math.min(gameState.coinCombo * 0.25, 2.0); // Up to +2s bonus at high combos

                if (gameState.coinComboTimer > 0) {
                    gameState.coinCombo++;
                    if (gameState.coinCombo >= 5 && gameState.coinCombo < 10) {
                        showCelebration('coinStreak', { n: gameState.coinCombo });
                    } else if (gameState.coinCombo >= 10 && gameState.coinCombo < 20) {
                        showCelebration('coinMaster');
                    } else if (gameState.coinCombo >= 20) {
                        showCelebration('coinFrenzy');
                    }
                } else {
                    gameState.coinCombo = 1;
                }
                gameState.coinComboTimer = baseComboTime + comboBonus;

                // Play coin collect sound with pitch scaling (Mario-style ascending notes)
                const pitchScale = 1.0 + (gameState.coinCombo * 0.08); // Higher pitch per combo
                AudioManager.play('powerup', 0.5, Math.min(pitchScale, 2.0)); // Cap at 2x pitch
                Haptics.pulse('coin', 0.12, 0.25, 40, 40);
                if (gameState.coinCombo >= 5) {
                    Haptics.sequence('coinCombo', [
                        { strong: 0.12, weak: 0.2, duration: 35 },
                        { strong: 0.2, weak: 0.25, duration: 45 }
                    ], 120);
                }

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
                // Haptics: type-specific pulse
                let hStrong = 0.3;
                let hWeak = 0.4;
                if (pu.type === 'electric') { hStrong = 0.55; hWeak = 0.45; }
                else if (pu.type === 'knockout') { hStrong = 0.45; hWeak = 0.3; }
                else if (pu.type === 'ghost') { hStrong = 0.2; hWeak = 0.45; }
                else if (pu.type === 'speed') { hStrong = 0.35; hWeak = 0.5; }
                Haptics.pulse('powerup', hStrong, hWeak, 90, 80);
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
                } else if (pu.type === 'timeFreeze') {
                    // TIME FREEZE - Freeze all enemies for 5 seconds
                    gameState.timeFreezeActive = true;
                    gameState.timeFreezeTimer = 5;
                    showCelebration('timeFreeze');
                    screenShake.trigger(10, 0.2);
                    // Freeze all enemies
                    for (const enemy of gameState.enemies) {
                        enemy.frozen = true;
                    }
                    playerStats.powerupsCollected++;
                    saveStats();
                } else if (pu.type === 'coinMagnet') {
                    // COIN MAGNET - Pull all coins toward player for 8 seconds
                    gameState.coinMagnetActive = true;
                    gameState.coinMagnetTimer = 8;
                    showCelebration('coinMagnet');
                    playerStats.powerupsCollected++;
                    saveStats();
                } else if (pu.type === 'clone') {
                    // CLONE - Create a decoy that enemies chase
                    gameState.clone = {
                        x: gameState.player.x,
                        y: gameState.player.y,
                        timer: 12,  // Lasts 12 seconds
                        frame: 0,
                        blinkTimer: 0
                    };
                    showCelebration('cloneActivated');
                    playerStats.powerupsCollected++;
                    saveStats();
                } else if (pu.type === 'invincibility') {
                    // INVINCIBILITY - Complete immunity for 4 seconds (rainbow!)
                    gameState.player.invincible = 4;
                    showCelebration('invincibility');
                    screenShake.trigger(15, 0.3);
                    // Rainbow flash effect
                    const flash = document.createElement('div');
                    flash.style.cssText = `
                        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                        background: linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #8b00ff);
                        opacity: 0.4; pointer-events: none; z-index: 999;
                        animation: flashFade 0.5s ease-out forwards;
                    `;
                    document.body.appendChild(flash);
                    setTimeout(() => flash.remove(), 500);
                    playerStats.powerupsCollected++;
                    saveStats();
                } else if (pu.type === 'overclock') {
                    // OVERCLOCK - Huge speed boost, but no punching
                    gameState.powerup = 'overclock';
                    gameState.powerupTimer = 6;
                    showCelebration('overclock');
                    screenShake.trigger(6, 0.2);
                    playerStats.powerupsCollected++;
                    saveStats();
                } else if (pu.type === 'ghost') {
                    // GHOST WALK - Pass through walls and desks for 3.5 seconds
                    gameState.powerup = 'ghost';
                    // Check for ghostTrail perk - 50% longer duration
                    const ghostDuration = gameState.perks.includes('ghostTrail') ? 5.25 : 3.5;
                    gameState.powerupTimer = ghostDuration;
                    showCelebration('ghostWalk');
                    screenShake.trigger(8, 0.2);
                    // Ethereal blue flash effect
                    const flash = document.createElement('div');
                    flash.style.cssText = `
                        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                        background: rgba(100, 180, 255, 0.4);
                        pointer-events: none; z-index: 999;
                        animation: flashFade 0.3s ease-out forwards;
                    `;
                    document.body.appendChild(flash);
                    setTimeout(() => flash.remove(), 300);
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

// === DASH SYSTEM (Core Fun Mechanic) ===
// Spacebar: Dash 3 tiles in facing direction with i-frames
function performDash() {
    // Can't dash if on cooldown, stunned, or already dashing
    if (gameState.player.dashCooldown > 0) return false;
    if (gameState.player.stunned > 0) return false;
    if (gameState.player.isDashing) return false;

    // === APPLY PERK MODIFIERS ===
    let dashRange = DASH_DISTANCE;
    let dashCooldown = DASH_COOLDOWN;
    let dashInvincibility = DASH_INVINCIBILITY;

    if (gameState.perks.includes('dashRange')) dashRange += 1;
    if (gameState.perks.includes('dashSpeed')) dashCooldown *= 0.6;
    if (gameState.perks.includes('invincibleDash')) dashInvincibility *= 2;

    // Get dash direction from last movement or facing direction
    let dx = 0, dy = 0;
    const dir = gameState.player.direction;
    if (dir === 0) dy = -1;      // up
    else if (dir === 1) dx = 1;  // right
    else if (dir === 2) dy = 1;  // down
    else if (dir === 3) dx = -1; // left

    // If no direction, use last dash direction or default down
    if (dx === 0 && dy === 0) {
        dx = gameState.player.lastDashDir.x;
        dy = gameState.player.lastDashDir.y;
    }
    if (dx === 0 && dy === 0) dy = 1; // fallback

    // Store dash direction
    gameState.player.lastDashDir = { x: dx, y: dy };

    // Calculate how far we can dash (stop at walls)
    // deskVault perk: Can dash through desks (but not walls)
    // ghostPhase (Phase Dash) perk: Can dash through BOTH walls and desks
    const hasDeskVault = gameState.perks.includes('deskVault');
    const hasPhaseDash = gameState.perks.includes('ghostPhase');
    let dashDistance = 0;
    let finalX = gameState.player.x;
    let finalY = gameState.player.y;

    for (let i = 1; i <= dashRange; i++) {
        const checkX = gameState.player.x + dx * i;
        const checkY = gameState.player.y + dy * i;

        // Check map boundaries
        if (checkX < 0 || checkX >= MAP_WIDTH || checkY < 0 || checkY >= MAP_HEIGHT) {
            break; // Out of bounds, stop here
        }

        const tile = gameState.maze[checkY] && gameState.maze[checkY][checkX];

        // Check if we can move to this position
        let canPass = canMove(checkX, checkY);

        // Phase Dash (Legendary): Allow passing through walls AND desks
        if (!canPass && hasPhaseDash) {
            if (tile === TILE.WALL || tile === TILE.DESK) {
                canPass = true; // Phase through everything!
            }
        }
        // deskVault perk: Allow passing through desks only
        else if (!canPass && hasDeskVault) {
            if (tile === TILE.DESK) {
                canPass = true; // Can vault over desks!
            }
        }

        if (canPass) {
            finalX = checkX;
            finalY = checkY;
            dashDistance = i;
        } else {
            break; // Hit obstacle, stop here
        }
    }

    if (dashDistance === 0) {
        // Can't dash anywhere - still trigger cooldown but shorter
        gameState.player.dashCooldown = dashCooldown * 0.3;
        return false;
    }

    // Execute dash!
    gameState.player.isDashing = true;
    gameState.player.dashInvincible = dashInvincibility;
    gameState.player.dashCooldown = dashCooldown;

    // === DASH SOUND: Quick whoosh effect ===
    if (AudioManager.context) {
        // Descending frequency sweep for satisfying whoosh
        const osc = AudioManager.context.createOscillator();
        const gain = AudioManager.context.createGain();
        osc.connect(gain);
        gain.connect(AudioManager.sfxGain);
        osc.type = 'square';
        osc.frequency.setValueAtTime(400, AudioManager.context.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, AudioManager.context.currentTime + 0.08);
        gain.gain.setValueAtTime(0.12, AudioManager.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, AudioManager.context.currentTime + 0.1);
        osc.start();
        osc.stop(AudioManager.context.currentTime + 0.1);
    }
    Haptics.pulse('dash', 0.25, 0.45, 70, 80);

    // === DASH DAMAGE PERK: Stun enemies we dash through ===
    if (gameState.perks.includes('dashDamage')) {
        for (const enemy of gameState.enemies) {
            // Check if enemy is along dash path
            for (let i = 1; i <= dashDistance; i++) {
                const pathX = gameState.player.x - dx * (dashDistance - i);
                const pathY = gameState.player.y - dy * (dashDistance - i);
                if (enemy.x === pathX && enemy.y === pathY && enemy.stunned <= 0) {
                    enemy.stunned = 2;
                    gameState.enemiesKnockedOut++;
                    gameState.killStreak++;
                    // Give time for dash-stuns too
                    const timeBonus = 2;
                    gameState.timer += timeBonus;
                    showCelebration('dashThrough');
                    break;
                }
            }
        }
    }

    // Move player to final position
    gameState.player.x = finalX;
    gameState.player.y = finalY;

    // Update facing direction for sprite
    if (dx !== 0) {
        characterAnimationState.player.facingDirection = dx > 0 ? 1 : -1;
    }
    characterAnimationState.player.isMoving = true;
    characterAnimationState.player.lastMoveTime = Date.now();

    // Visual feedback - dash trail particles
    const startX = (gameState.player.x - dx * dashDistance) * TILE_SIZE + TILE_SIZE / 2;
    const startY = (gameState.player.y - dy * dashDistance) * TILE_SIZE + TILE_SIZE / 2;
    const endX = gameState.player.x * TILE_SIZE + TILE_SIZE / 2;
    const endY = gameState.player.y * TILE_SIZE + TILE_SIZE / 2;

    // Create trail particles along dash path
    for (let i = 0; i < dashDistance * 3; i++) {
        const t = i / (dashDistance * 3);
        gameState.particles.push({
            x: startX + (endX - startX) * t + (Math.random() - 0.5) * 10,
            y: startY + (endY - startY) * t + (Math.random() - 0.5) * 10,
            vx: -dx * 2 + (Math.random() - 0.5) * 2,
            vy: -dy * 2 + (Math.random() - 0.5) * 2,
            size: 4 + Math.random() * 4,
            color: '#00d2d3',  // Cyan trail
            life: 0.3 + Math.random() * 0.2
        });
    }

    // === DASH TRAIL PERK: Leave damaging fire tiles along dash path ===
    if (gameState.perks.includes('dashTrail')) {
        const maxTrailFires = Math.min(dashDistance, 3); // Cap at 3 fire tiles

        for (let i = 1; i <= maxTrailFires; i++) {
            const fireX = gameState.player.x - dx * i;
            const fireY = gameState.player.y - dy * i;

            // Check if tile is valid floor (not wall, not already on fire)
            if (gameState.maze[fireY] && gameState.maze[fireY][fireX] === 0) { // 0 = FLOOR
                let alreadyOnFire = false;
                for (const f of gameState.fires) {
                    if (f.x === fireX && f.y === fireY) {
                        alreadyOnFire = true;
                        break;
                    }
                }

                if (!alreadyOnFire) {
                    gameState.fires.push({
                        x: fireX,
                        y: fireY,
                        size: 1,
                        age: 0,
                        spreadTimer: 0,
                        isPlayerFire: true, // Mark as player-created (won't damage player)
                        lifespan: 5 // Auto-extinguish after 5 seconds
                    });

                    // Fire spawn particle effect
                    for (let p = 0; p < 6; p++) {
                        gameState.particles.push({
                            x: fireX * TILE_SIZE + TILE_SIZE / 2,
                            y: fireY * TILE_SIZE + TILE_SIZE / 2,
                            vx: (Math.random() - 0.5) * 4,
                            vy: -Math.random() * 4 - 2,
                            size: 4 + Math.random() * 4,
                            color: Math.random() < 0.5 ? '#e67e22' : '#e74c3c',
                            life: 0.4
                        });
                    }
                }
            }
        }
    }

    // Audio feedback
    AudioManager.play('powerup', 0.6);

    // Screen shake for impact feel
    screenShake.trigger(5, 0.1);

    // Check for coin collection along dash path (bonus!)
    for (let i = 1; i <= dashDistance; i++) {
        const checkX = gameState.player.x - dx * (dashDistance - i);
        const checkY = gameState.player.y - dy * (dashDistance - i);

        for (let j = gameState.coins.length - 1; j >= 0; j--) {
            const coin = gameState.coins[j];
            if (!coin.collected && coin.x === checkX && coin.y === checkY) {
                coin.collected = true;
                // Coin multiplier perks: Vault Master (3x) > Lucky Coins (2x)
                let coinMultiplier = 1;
                if (gameState.perks.includes('vaultMaster')) coinMultiplier = 3;
                else if (gameState.perks.includes('luckyCoins')) coinMultiplier = 2;
                gameState.coinsCollected += coin.value * coinMultiplier;
                gameState.coinsCollectedCount++;
                gameState.coinCombo++;
                gameState.coinComboTimer = 2.0;
            }
        }
    }

    // Check exit collision at destination
    for (const exit of gameState.exits) {
        if (gameState.player.x === exit.x && gameState.player.y === exit.y) {
            if (gameState.timer <= 5 && gameState.timer > 0) {
                showCelebration('clutchEscape');
                triggerFreezeFrame('closeDodge');
            } else if (gameState.timer <= 10 && gameState.timer > 5) {
                showCelebration('closeCall');
            }
            nextFloor();
            return true;
        }
    }

    // End dash state after brief moment
    setTimeout(() => {
        gameState.player.isDashing = false;
    }, DASH_SPEED * dashDistance * 1000);

    addFlow(FLOW_GAIN_DASH);
    return true;
}

// === PUNCH SYSTEM (Default Attack - Z Key) ===
// Punch enemies in range, stun them, and gain TIME scaled by COMBO MULTIPLIER
function performPunch() {
    // Can't punch if on cooldown or stunned
    if (gameState.player.punchCooldown > 0) return false;
    if (gameState.player.stunned > 0) return false;
    if (gameState.powerup === 'overclock') return false;

    // Apply perk modifiers
    let punchRange = PUNCH_RANGE;
    let punchCooldown = PUNCH_COOLDOWN;
    if (gameState.perks.includes('punchRange')) punchRange += 1;
    if (gameState.perks.includes('punchSpeed')) punchCooldown *= 0.6;
    // Omnipunch (Legendary): Massive punch radius - hit enemies in a 3-tile radius
    if (gameState.perks.includes('omnipunch')) punchRange = 3;

    gameState.player.isPunching = true;
    gameState.player.punchCooldown = punchCooldown;

    let enemiesHit = 0;
    let timeGained = 0;

    // Find all enemies in punch range
    for (const enemy of gameState.enemies) {
        if (enemy.stunned > 0) continue; // Already stunned

        const dist = Math.abs(enemy.x - gameState.player.x) + Math.abs(enemy.y - gameState.player.y);

        if (dist <= punchRange) {
            // HIT!
            enemiesHit++;

            // === CRITICAL HIT SYSTEM: 15% chance for double damage + extra effects ===
            const critChance = gameState.perks.includes('criticalHit') ? 0.25 : 0.15;
            const isCriticalHit = Math.random() < critChance;
            const damageDealt = isCriticalHit ? 2 : 1;

            // === ENEMY HEALTH SYSTEM: Tanks need multiple hits ===
            enemy.health = (enemy.health || 1) - damageDealt;

            if (isCriticalHit) {
                showCelebration('criticalHit');
                screenShake.trigger(12, 0.2);
                // Extra crit particles (yellow/gold)
                for (let c = 0; c < 8; c++) {
                    gameState.particles.push({
                        x: enemy.x * TILE_SIZE + TILE_SIZE / 2,
                        y: enemy.y * TILE_SIZE + TILE_SIZE / 2,
                        vx: (Math.random() - 0.5) * 10,
                        vy: (Math.random() - 0.5) * 10 - 3,
                        size: 5,
                        color: '#ffd700',
                        life: 0.6
                    });
                }
            }

            if (enemy.health <= 0) {
                // Enemy is fully defeated - stun them
                enemy.stunned = PUNCH_STUN_DURATION;
                enemy.health = enemy.maxHealth || 1; // Reset health for respawn
                gameState.enemiesKnockedOut++;
                gameState.killStreak++;

                // === SPECIAL ABILITY: Exploder (HR Karen) ===
                if (enemy.special === 'explode') {
                    triggerEnemyExplosion(enemy);
                }

                // === PUNCH CHAIN PERK: Punched enemies create chain reaction ===
                if (gameState.perks.includes('punchChain') && enemy.special !== 'explode') {
                    triggerPunchChainExplosion(enemy);
                }

                // === SHOP ECONOMY: Enemies drop coins when defeated ===
                const coinDrop = 5 + Math.floor(Math.random() * 10); // 5-14 coins
                gameState.coinsCollected += coinDrop;

                // Coin drop visual effect
                for (let c = 0; c < 3; c++) {
                    gameState.particles.push({
                        x: enemy.x * TILE_SIZE + TILE_SIZE / 2,
                        y: enemy.y * TILE_SIZE + TILE_SIZE / 2,
                        vx: (Math.random() - 0.5) * 4,
                        vy: -Math.random() * 4 - 2,
                        size: 4,
                        color: '#f1c40f', // Gold coin color
                        life: 0.5
                    });
                }
            } else {
                // Tank enemy - show damage but don't stun yet
                enemy.stunned = 0.3; // Brief stagger
                showCelebration('tankHit', { remaining: enemy.health });
                // Particle effect for hit
                for (let k = 0; k < 5; k++) {
                    gameState.particles.push({
                        x: enemy.x * TILE_SIZE + TILE_SIZE / 2,
                        y: enemy.y * TILE_SIZE + TILE_SIZE / 2,
                        vx: (Math.random() - 0.5) * 6,
                        vy: (Math.random() - 0.5) * 6,
                        size: 4,
                        color: '#9b59b6', // Purple for IT
                        life: 0.3
                    });
                }
                continue; // Don't give full rewards for non-killing blow
            }

            enemy.hitCount = (enemy.hitCount || 0) + 1;

            // === COMBO SYSTEM: Build combo for multiplied time rewards ===
            const now = Date.now();
            if (gameState.killComboTimer > 0) {
                // Continue combo
                gameState.killCombo = Math.min(gameState.killCombo + 1, COMBO_MAX_MULTIPLIER);
            } else {
                // Start new combo
                gameState.killCombo = 1;
            }
            // Perk: Momentum - combo timer lasts 50% longer
            const comboWindow = gameState.perks.includes('comboExtend') ? COMBO_WINDOW * 1.5 : COMBO_WINDOW;
            gameState.killComboTimer = comboWindow;
            gameState.lastKillTime = now;

            // Track max combo
            if (gameState.killCombo > gameState.maxComboThisRun) {
                gameState.maxComboThisRun = gameState.killCombo;
            }

            // === TIME REWARD SCALED BY COMBO ===
            const comboMultiplier = gameState.killCombo;
            let baseReward = PUNCH_TIME_REWARD;
            // Perk: Time Vampire - 50% more time per kill
            if (gameState.perks.includes('punchVampire')) baseReward = Math.floor(baseReward * 1.5);
            // Perk: Time Lord (Legendary) - 50% more time per kill (nerfed from 100%, stacks with Time Vampire!)
            if (gameState.perks.includes('timeLord')) baseReward = Math.floor(baseReward * 1.5);
            const timeReward = Math.floor(baseReward * (1 + (comboMultiplier - 1) * 0.5)); // 4, 6, 8, 10...
            gameState.timer += timeReward;
            timeGained += timeReward;

            // Push enemy away from player
            const dx = enemy.x - gameState.player.x;
            const dy = enemy.y - gameState.player.y;
            const pushDist = 2;

            for (let i = pushDist; i >= 1; i--) {
                const pushX = enemy.x + (dx !== 0 ? Math.sign(dx) * i : 0);
                const pushY = enemy.y + (dy !== 0 ? Math.sign(dy) * i : 0);
                if (canMove(pushX, pushY)) {
                    enemy.x = pushX;
                    enemy.y = pushY;
                    break;
                }
            }

            // Visual punch effect
            gameState.punchEffects.push({
                x: enemy.x * TILE_SIZE + TILE_SIZE / 2,
                y: enemy.y * TILE_SIZE + TILE_SIZE / 2,
                frame: 0,
                maxFrames: 8
            });

            // Particles - more particles for higher combos
            const particleCount = 8 + gameState.killCombo * 2;
            for (let j = 0; j < particleCount; j++) {
                gameState.particles.push({
                    x: enemy.x * TILE_SIZE + TILE_SIZE / 2,
                    y: enemy.y * TILE_SIZE + TILE_SIZE / 2,
                    vx: (Math.random() - 0.5) * (8 + gameState.killCombo),
                    vy: (Math.random() - 0.5) * (8 + gameState.killCombo) - 2,
                    size: 3 + Math.random() * 3,
                    color: getComboColor(gameState.killCombo),
                    life: 0.4 + gameState.killCombo * 0.05
                });
            }
        }
    }

    // Audio and visual feedback based on hits
    if (enemiesHit > 0) {
        // Escalating combo audio - pitch increases with kill combo
        const comboBoost = Math.min(gameState.killCombo || 0, 10) / 10;
        Haptics.pulse('punch', 0.35 + comboBoost * 0.25, 0.2 + comboBoost * 0.15, 90, 70);
        const comboPitch = 1.0 + Math.min(gameState.killCombo, 10) * 0.06; // Up to 1.6x at combo 10
        AudioManager.play('punch1', 0.8, comboPitch);

        // === SLOW-MO ON MULTI-KILLS ===
        if (enemiesHit >= 5) {
            triggerSlowMo(SLOWMO_5_KILLS);
            showCelebration('massacre', { count: enemiesHit });
            playKillStreakAnnouncer('massacre');
        } else if (enemiesHit >= 3) {
            triggerSlowMo(SLOWMO_3_KILLS);
            showCelebration('multiPunch', { count: enemiesHit });
            playKillStreakAnnouncer('triple');
        } else if (enemiesHit >= 2) {
            triggerSlowMo(SLOWMO_2_KILLS);
            showCelebration('multiPunch', { count: enemiesHit });
            playKillStreakAnnouncer('double');
        }

        // Screen shake scales with combo
        screenShake.trigger(8 + enemiesHit * 3 + gameState.killCombo * 2, 0.15 + gameState.killCombo * 0.02);
        triggerFreezeFrame('playerHit');

        // Show combo and time gained
        if (gameState.killCombo >= 3) {
            showCelebration('comboKill', { combo: gameState.killCombo, time: timeGained });
        } else if (timeGained > 0) {
            showCelebration('timeBonus', { seconds: timeGained, enemies: enemiesHit });
        }

        // === KILL STREAK ANNOUNCEMENTS ===
        if (gameState.killStreak === STREAK_GODLIKE) {
            playKillStreakAnnouncer('godlike');
            showCelebration('godlike');
        } else if (gameState.killStreak === STREAK_UNSTOPPABLE) {
            playKillStreakAnnouncer('unstoppable');
            showCelebration('unstoppable');
        } else if (gameState.killStreak === STREAK_RAMPAGE) {
            playKillStreakAnnouncer('rampage');
            showCelebration('rampage');
        }
    } else {
        // Whiff - still play a sound but quieter
        AudioManager.play('footstep', 0.4);
    }

    // === EXPLOSIVE PUNCH PERK: Shockwave pushes ALL nearby enemies ===
    if (gameState.perks.includes('explosivePunch') && enemiesHit > 0) {
        const shockwaveRadius = 4; // Larger than punch range

        for (const enemy of gameState.enemies) {
            const dist = Math.abs(enemy.x - gameState.player.x) + Math.abs(enemy.y - gameState.player.y);

            if (dist <= shockwaveRadius && dist > 0) {
                // Calculate push direction (away from player)
                const dx = enemy.x - gameState.player.x;
                const dy = enemy.y - gameState.player.y;
                const pushDist = Math.max(1, 4 - Math.floor(dist)); // Closer = pushed further

                // Find valid push position
                for (let i = pushDist; i >= 1; i--) {
                    let pushX = enemy.x;
                    let pushY = enemy.y;

                    // Push in dominant direction
                    if (Math.abs(dx) >= Math.abs(dy)) {
                        pushX += Math.sign(dx) * i;
                    } else {
                        pushY += Math.sign(dy) * i;
                    }

                    if (canMove(pushX, pushY)) {
                        enemy.x = pushX;
                        enemy.y = pushY;
                        break;
                    }
                }

                // Brief stagger for pushed enemies
                if (enemy.stunned <= 0) {
                    enemy.stunned = 0.3;
                }
            }
        }

        // Shockwave visual effect (ring expanding outward)
        const px = gameState.player.x * TILE_SIZE + TILE_SIZE / 2;
        const py = gameState.player.y * TILE_SIZE + TILE_SIZE / 2;

        for (let i = 0; i < 16; i++) {
            const angle = (i / 16) * Math.PI * 2;
            const speed = 8;
            gameState.particles.push({
                x: px,
                y: py,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 5,
                color: '#9b59b6', // Purple shockwave
                life: 0.4
            });
        }

        screenShake.trigger(12, 0.2);
        AudioManager.play('punch1', 0.9);
        showCelebration('shockwave');
    }

    // End punch animation after brief moment
    setTimeout(() => {
        gameState.player.isPunching = false;
    }, 150);

    return enemiesHit > 0;
}

// Get particle color based on combo level
function getComboColor(combo) {
    if (combo >= 8) return '#ff00ff'; // Magenta - GODLIKE
    if (combo >= 6) return '#ff4500'; // Orange-red
    if (combo >= 4) return '#ffd700'; // Gold
    if (combo >= 2) return '#ff6b6b'; // Light red
    return '#e74c3c'; // Base red
}

// === WALL BREAKER (Secret Ability - Unlocked by using all 4 exits) ===
// Shift: Break through walls in facing direction
const WALL_BREAK_COOLDOWN = 3; // 3 second cooldown
const WALL_BREAK_RANGE = 3; // Can break up to 3 walls

function performWallBreak() {
    // Can't break walls if on cooldown or stunned
    if (gameState.player.wallBreakCooldown > 0) {
        showCelebration('cooldown');
        return false;
    }
    if (gameState.player.stunned > 0) return false;

    // Get direction from facing
    let dx = 0, dy = 0;
    const dir = gameState.player.direction;
    if (dir === 0) dy = -1;      // up
    else if (dir === 1) dx = 1;  // right
    else if (dir === 2) dy = 1;  // down
    else if (dir === 3) dx = -1; // left

    // If no direction, default down
    if (dx === 0 && dy === 0) dy = 1;

    // Find walls to break in that direction
    let wallsBroken = 0;
    const brokenPositions = [];

    for (let i = 1; i <= WALL_BREAK_RANGE; i++) {
        const checkX = gameState.player.x + dx * i;
        const checkY = gameState.player.y + dy * i;

        // Stop at map boundaries
        if (checkX < 1 || checkX >= MAP_WIDTH - 1 || checkY < 1 || checkY >= MAP_HEIGHT - 1) {
            break;
        }

        const tile = gameState.maze[checkY][checkX];

        // Break walls and desks
        if (tile === TILE.WALL || tile === TILE.DESK) {
            gameState.maze[checkY][checkX] = TILE.FLOOR;
            wallsBroken++;
            brokenPositions.push({ x: checkX, y: checkY });
        }
    }

    if (wallsBroken > 0) {
        // Set cooldown
        gameState.player.wallBreakCooldown = WALL_BREAK_COOLDOWN;

        // Audio - heavy impact sound
        AudioManager.play('punch1', 1.0);
        Haptics.pulse('wallBreak', 0.85, 0.6, 160, 120);

        // Screen shake - big one!
        screenShake.trigger(15 + wallsBroken * 5, 0.3);
        triggerFreezeFrame('playerHit');

        // Visual effects for each broken wall
        for (const pos of brokenPositions) {
            const centerX = pos.x * TILE_SIZE + TILE_SIZE / 2;
            const centerY = pos.y * TILE_SIZE + TILE_SIZE / 2;

            // Debris particles (gray stone/concrete)
            for (let j = 0; j < 12; j++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 3 + Math.random() * 5;
                gameState.particles.push({
                    x: centerX,
                    y: centerY,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed - 3,
                    size: 4 + Math.random() * 4,
                    color: ['#7f8c8d', '#95a5a6', '#bdc3c7'][Math.floor(Math.random() * 3)],
                    life: 0.6 + Math.random() * 0.3
                });
            }

            // Dust cloud particles (lighter, slower)
            for (let j = 0; j < 8; j++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 1 + Math.random() * 2;
                gameState.particles.push({
                    x: centerX,
                    y: centerY,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed - 1,
                    size: 8 + Math.random() * 6,
                    color: 'rgba(200, 200, 200, 0.5)',
                    life: 0.8 + Math.random() * 0.4
                });
            }
        }

        // Show celebration
        if (wallsBroken >= 3) {
            showCelebration('wallSmash', { count: wallsBroken });
        } else {
            showCelebration('wallBreak');
        }

        // Push any enemies that were behind the walls
        for (const enemy of gameState.enemies) {
            for (const pos of brokenPositions) {
                if (enemy.x === pos.x && enemy.y === pos.y) {
                    // Stun enemy caught in debris
                    enemy.stunned = 2;
                    enemy.health = (enemy.health || 1) - 1;
                    if (enemy.health <= 0) {
                        enemy.health = enemy.maxHealth || 1;
                        gameState.enemiesKnockedOut++;
                    }
                }
            }
        }

        return true;
    } else {
        // No walls in range
        AudioManager.play('footstep', 0.3);
        Haptics.pulse('wallBreakFail', 0.15, 0.1, 70, 200);
        return false;
    }
}

// === THE VAULT: Severance Package - Ultimate EMP Weapon ===
function activateSeverancePackage() {
    // Can only use once per run
    if (!gameState.severanceAvailable) {
        showCelebration('cooldown');
        return false;
    }

    // Mark as used for this run
    gameState.severanceAvailable = false;
    updateSpecialTouchButtons(); // Hide touch button since it's been used

    // Audio - epic activation sound
    AudioManager.play('victory', 0.8);
    Haptics.sequence('severance', [
        { strong: 1.0, weak: 0.7, duration: 120 },
        { strong: 0.5, weak: 1.0, duration: 200 }
    ], 500);

    // Massive screen shake
    screenShake.trigger(25, 0.5);
    triggerSlowMo(2.0, 0.2); // 2 second slow-mo at 20% speed

    // Visual: Papers flying everywhere from briefcase
    const playerCenterX = gameState.player.x * TILE_SIZE + TILE_SIZE / 2;
    const playerCenterY = gameState.player.y * TILE_SIZE + TILE_SIZE / 2;

    // Create paper particle burst
    for (let i = 0; i < 50; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 3 + Math.random() * 8;
        gameState.particles.push({
            x: playerCenterX,
            y: playerCenterY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 2,
            size: 8 + Math.random() * 8,
            color: ['#fff', '#ecf0f1', '#f5f5dc', '#fffacd'][Math.floor(Math.random() * 4)],
            life: 1.5 + Math.random() * 1.0,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.3
        });
    }

    // EMP wave effect - expanding circle
    for (let i = 0; i < 3; i++) {
        setTimeout(() => {
            // Create expanding EMP ring particles
            for (let j = 0; j < 20; j++) {
                const angle = (j / 20) * Math.PI * 2;
                const distance = 50 + i * 80;
                gameState.particles.push({
                    x: playerCenterX + Math.cos(angle) * distance,
                    y: playerCenterY + Math.sin(angle) * distance,
                    vx: Math.cos(angle) * 2,
                    vy: Math.sin(angle) * 2,
                    size: 6,
                    color: '#3498db',
                    life: 0.5
                });
            }
        }, i * 150);
    }

    // STUN ALL ENEMIES for 5 seconds
    const SEVERANCE_STUN_DURATION = 5;
    for (const enemy of gameState.enemies) {
        enemy.stunned = SEVERANCE_STUN_DURATION;
        enemy.severanceStunned = true; // Mark for special visual

        // "TERMINATED" text particle above each enemy
        const enemyX = enemy.x * TILE_SIZE + TILE_SIZE / 2;
        const enemyY = enemy.y * TILE_SIZE;
        gameState.particles.push({
            x: enemyX,
            y: enemyY - 10,
            vx: 0,
            vy: -0.5,
            size: 8,
            color: '#e74c3c',
            life: 2.0,
            text: 'TERMINATED',
            textSize: 8
        });
    }

    // Show epic celebration
    showCelebration('severance');

    // Add to stats
    gameState.enemiesKnockedOut += gameState.enemies.length;

    return true;
}

// === SLOW-MO SYSTEM ===
function triggerSlowMo(duration) {
    gameState.slowMoActive = true;
    gameState.slowMoTimer = duration;
    gameState.slowMoFactor = SLOWMO_FACTOR;

    // Visual flash effect
    const flash = document.createElement('div');
    flash.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(255, 255, 255, 0.3);
        pointer-events: none; z-index: 999;
        animation: flashFade 0.2s ease-out forwards;
    `;
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 200);
}

// === ENEMY EXPLOSION (HR Karen Special) ===
// When HR Karen is defeated, she explodes and damages nearby enemies
function triggerEnemyExplosion(enemy) {
    const explosionRadius = 3; // Tiles
    let chainKills = 0;

    // Find all enemies in explosion radius
    for (const otherEnemy of gameState.enemies) {
        if (otherEnemy === enemy) continue;
        if (otherEnemy.stunned > 0) continue;

        const dist = Math.abs(otherEnemy.x - enemy.x) + Math.abs(otherEnemy.y - enemy.y);
        if (dist <= explosionRadius) {
            // Chain damage!
            otherEnemy.health = (otherEnemy.health || 1) - 1;
            if (otherEnemy.health <= 0) {
                otherEnemy.stunned = PUNCH_STUN_DURATION;
                otherEnemy.health = otherEnemy.maxHealth || 1;
                gameState.enemiesKnockedOut++;
                chainKills++;

                // If this enemy ALSO explodes, trigger chain reaction
                if (otherEnemy.special === 'explode') {
                    setTimeout(() => triggerEnemyExplosion(otherEnemy), 100);
                }
            } else {
                otherEnemy.stunned = 0.5; // Stagger
            }
        }
    }

    // Explosion visual effect
    const centerX = enemy.x * TILE_SIZE + TILE_SIZE / 2;
    const centerY = enemy.y * TILE_SIZE + TILE_SIZE / 2;

    // Orange/red explosion particles
    for (let i = 0; i < 20; i++) {
        const angle = (i / 20) * Math.PI * 2;
        const speed = 5 + Math.random() * 5;
        gameState.particles.push({
            x: centerX,
            y: centerY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 6 + Math.random() * 6,
            color: Math.random() < 0.5 ? '#e67e22' : '#e74c3c',
            life: 0.5 + Math.random() * 0.3
        });
    }

    // Screen shake and sound
    screenShake.trigger(15, 0.3);
    AudioManager.play('punch1', 1.0);

    // Slow-mo if chain kills
    if (chainKills >= 2) {
        triggerSlowMo(SLOWMO_3_KILLS);
        showCelebration('explosion');

        // Bonus time for chain reaction
        const chainBonus = chainKills * 3;
        gameState.timer += chainBonus;
        gameState.killCombo += chainKills;
    }
}

// === PUNCH CHAIN EXPLOSION (smaller radius than HR Karen) ===
function triggerPunchChainExplosion(enemy) {
    const explosionRadius = 2; // Smaller than HR Karen's 3
    let chainKills = 0;

    // Find all enemies in explosion radius
    for (const otherEnemy of gameState.enemies) {
        if (otherEnemy === enemy) continue;
        if (otherEnemy.stunned > 0) continue;

        const dist = Math.abs(otherEnemy.x - enemy.x) + Math.abs(otherEnemy.y - enemy.y);
        if (dist <= explosionRadius) {
            // Chain damage!
            otherEnemy.health = (otherEnemy.health || 1) - 1;
            if (otherEnemy.health <= 0) {
                otherEnemy.stunned = PUNCH_STUN_DURATION;
                otherEnemy.health = otherEnemy.maxHealth || 1;
                gameState.enemiesKnockedOut++;
                gameState.killStreak++;
                chainKills++;

                // Chain explosions propagate (with delay to prevent infinite loops)
                if (gameState.perks.includes('punchChain') && otherEnemy.special !== 'explode') {
                    setTimeout(() => {
                        if (otherEnemy.stunned > 0) { // Still stunned = hasn't recovered
                            triggerPunchChainExplosion(otherEnemy);
                        }
                    }, 150);
                }

                // HR Karen still explodes normally
                if (otherEnemy.special === 'explode') {
                    setTimeout(() => triggerEnemyExplosion(otherEnemy), 100);
                }
            } else {
                otherEnemy.stunned = 0.3; // Brief stagger
            }
        }
    }

    // Smaller visual effect than HR Karen (yellow instead of orange)
    const centerX = enemy.x * TILE_SIZE + TILE_SIZE / 2;
    const centerY = enemy.y * TILE_SIZE + TILE_SIZE / 2;

    for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const speed = 3 + Math.random() * 3;
        gameState.particles.push({
            x: centerX,
            y: centerY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 4 + Math.random() * 4,
            color: Math.random() < 0.5 ? '#f1c40f' : '#f39c12', // Yellow/gold for chain
            life: 0.3 + Math.random() * 0.2
        });
    }

    // Feedback
    if (chainKills > 0) {
        showCelebration('chainReaction', { count: chainKills });
        screenShake.trigger(8, 0.15);

        // Bonus time for chain kills
        const chainBonus = chainKills * 2;
        gameState.timer += chainBonus;
        gameState.killCombo += chainKills;
    } else {
        // Even without kills, show small effect
        screenShake.trigger(4, 0.1);
    }

    AudioManager.play('punch1', 0.7);
}

// === KILL STREAK ANNOUNCER ===
function playKillStreakAnnouncer(type) {
    // Generate announcer-style sound effects
    const sounds = {
        double: { freq: 400, duration: 0.15 },
        triple: { freq: 500, duration: 0.2 },
        rampage: { freq: 600, duration: 0.25 },
        unstoppable: { freq: 700, duration: 0.3 },
        godlike: { freq: 800, duration: 0.4 },
        massacre: { freq: 900, duration: 0.35 }
    };

    const sound = sounds[type];
    if (sound && AudioManager.context) {
        const osc = AudioManager.context.createOscillator();
        const gain = AudioManager.context.createGain();
        osc.connect(gain);
        gain.connect(AudioManager.sfxGain);
        osc.frequency.setValueAtTime(sound.freq, AudioManager.context.currentTime);
        osc.frequency.exponentialRampToValueAtTime(sound.freq * 1.5, AudioManager.context.currentTime + sound.duration);
        gain.gain.setValueAtTime(0.3, AudioManager.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, AudioManager.context.currentTime + sound.duration);
        osc.start();
        osc.stop(AudioManager.context.currentTime + sound.duration);
    }
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
    const weeklyMods = getWeeklyModifiers();
    const enemyVisionMult = weeklyMods && weeklyMods.enemyVisionMultiplier ? weeklyMods.enemyVisionMultiplier : 1;

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
        if (enemy.frozen) continue;  // Time freeze - enemy can't move!

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

        // === ENEMY TYPE SPEED: Apply speed multiplier from enemy type ===
        const speedMult = enemy.speedMultiplier || 1.0;
        baseMoveThreshold = Math.floor(baseMoveThreshold / speedMult);

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
        // === CLONE DECOY: Most enemies chase clone instead of player ===
        else if (gameState.clone && enemy.target === 'clone') {
            // Chase the decoy clone!
            const distX = Math.abs(gameState.clone.x - enemy.x);
            const distY = Math.abs(gameState.clone.y - enemy.y);
            const totalDist = distX + distY + 0.1;

            if (Math.random() < (distX / totalDist)) {
                if (gameState.clone.x < enemy.x) dx = -1;
                else if (gameState.clone.x > enemy.x) dx = 1;
            } else {
                if (gameState.clone.y < enemy.y) dy = -1;
                else if (gameState.clone.y > enemy.y) dy = 1;
            }
        }
        else {
            const chaseChance = enemy.difficulty === 'easy' ? 0.4 : (enemy.difficulty === 'hard' ? 0.95 : 0.7);
            const adjustedChaseChance = Math.min(1, chaseChance * enemyVisionMult);

            // If on cooldown or player is stunned, use patrol behavior instead of pure random
            if (!canAttack || gameState.player.stunned > 0) {
                // Patrol in current direction, change on collision
                const patrolMoves = [[0, -1], [0, 1], [-1, 0], [1, 0]]; // up, down, left, right
                dx = patrolMoves[enemy.patrolDir][0];
                dy = patrolMoves[enemy.patrolDir][1];
            } else if (Math.random() < adjustedChaseChance && !playerInBathroom) {
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
            Haptics.pulse('enemyThreat', 0.18, 0.26, 60, 400);
            handlePlayerEnemyCollision(enemy);
            playerAlreadyHitThisFrame = true;  // Prevent other enemies from attacking this frame
        }
    }
}

function nextFloor() {
    // AudioManager.play('exit'); // Exit door sound (disabled for floor transition)

    // Record time spent on this floor (for run recap)
    if (gameState.floorStartTime) {
        const floorTime = (Date.now() - gameState.floorStartTime) / 1000;
        gameState.floorTimes.push({ floor: gameState.floor, time: floorTime });
    }

    // === FLOW BONUS: Reward clean momentum on exit ===
    const flowBonus = Math.floor(((gameState.flow || 0) / FLOW_MAX) * 4);
    gameState.flowBonusLastFloor = flowBonus;
    if (flowBonus > 0) {
        gameState.timer += flowBonus;
        showCelebration('flowBonus', { seconds: flowBonus });
    }
    // Spend some flow on the bonus to keep the loop dynamic
    gameState.flow = Math.max(0, (gameState.flow || 0) - 40);
    gameState.flowStateActive = false;

    // Check for celebration triggers before advancing
    checkCelebrationTriggers('floorComplete');

    // === ENDLESS MODE: No win condition, always continue ===
    if (gameState.endlessMode) {
        // Track time bonus for this floor
        if (gameState.timer > 0) {
            gameState.endlessStats.totalTimeBonus += Math.floor(gameState.timer);
        }

        // Track perfect floor (no hits)
        if (gameState.floorHits === 0) {
            gameState.endlessStats.perfectFloors++;
        }

        // Update max combo
        if (gameState.maxComboThisRun > gameState.endlessStats.maxCombo) {
            gameState.endlessStats.maxCombo = gameState.maxComboThisRun;
        }

        // === THE VAULT: Check for vault discovery at Floor -100 ===
        if (gameState.endlessFloor === 100 && !playerStats.vaultDiscovered) {
            // Trigger vault discovery!
            showVaultDiscovery();
            return;
        }

        // Advance to next floor
        gameState.endlessFloor++;
        gameState.floor = -gameState.endlessFloor; // Display as negative

        // Update score
        gameState.endlessScore = calculateEndlessScore(gameState.endlessFloor - 1, {
            ...gameState.endlessStats,
            enemiesKnockedOut: gameState.enemiesKnockedOut,
            enemiesZapped: gameState.enemiesZapped,
            coinsCollected: gameState.coinsCollected
        });

        // Reset floor hits for flawless tracking
        gameState.floorHits = 0;

        // Show transition with endless floor number
        showEndlessLevelTransition(gameState.endlessFloor);
        return;
    }

    // Standard mode
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
        Haptics.sequence('victory', [
            { strong: 0.3, weak: 0.6, duration: 120 },
            { strong: 0.5, weak: 0.4, duration: 100 },
            { strong: 0.2, weak: 0.7, duration: 160 }
        ], 700);
        showVictoryScreen();
        return;
    }
    showLevelTransition(gameState.floor);
}

// Endless mode level transition
function showEndlessLevelTransition(floor) {
    const transition = document.getElementById('levelTransition');
    const floorNum = document.getElementById('nextFloorNum');
    const flowBonusEl = document.getElementById('flowBonus');

    // Display floor as negative (descending into the abyss)
    floorNum.textContent = `-${floor}`;
    if (flowBonusEl) {
        flowBonusEl.textContent = gameState.flowBonusLastFloor > 0
            ? `FLOW BONUS +${gameState.flowBonusLastFloor}s`
            : '';
    }

    // Set random atmospheric background
    const bg = getRandomBackground('levelTransition');
    transition.style.backgroundImage = `url('${bg}')`;

    transition.style.display = 'flex';

    // Triumphant stinger on floor clear
    AudioManager.play('floorClear', 0.8);
    Haptics.sequence('floorClear', [
        { strong: 0.35, weak: 0.55, duration: 90 },
        { strong: 0.2, weak: 0.4, duration: 70 },
        { strong: 0.4, weak: 0.6, duration: 120 }
    ], 500);

    // Start falling debris particle effect
    transitionParticles.start();

    // Show perk selection after brief delay (same as standard mode)
    setTimeout(() => {
        transition.style.display = 'none';
        transitionParticles.stop();
        showPerkSelection(floor);
    }, 1500);
}

// === THE VAULT: Discovery Animation ===
function showVaultDiscovery() {
    gameState.vaultAnimationPlaying = true;

    // Create vault discovery overlay
    const overlay = document.createElement('div');
    overlay.id = 'vaultDiscovery';
    overlay.innerHTML = `
        <div class="vault-content">
            <div class="vault-door-anim">🔐</div>
            <h1 class="vault-title">THE VAULT</h1>
            <p class="vault-subtitle">You've found what they were hiding...</p>
            <div class="vault-coins-container">
                <div class="coin-waterfall"></div>
                <div class="vault-reward">+10,000 COINS</div>
            </div>
            <div class="vault-weapon">
                <div class="briefcase-icon">💼</div>
                <div class="weapon-name">SEVERANCE PACKAGE UNLOCKED</div>
                <div class="weapon-desc">Press V to stun ALL enemies (once per run)</div>
            </div>
            <button class="vault-continue" onclick="completeVaultDiscovery()">CONTINUE DESCENT</button>
        </div>
    `;

    // Add styles
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        animation: vaultFadeIn 1s ease-out;
    `;

    // Add CSS animations via style tag
    const style = document.createElement('style');
    style.textContent = `
        @keyframes vaultFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes vaultDoorOpen {
            0% { transform: scale(1) rotate(0deg); }
            50% { transform: scale(1.2) rotate(-10deg); }
            100% { transform: scale(1.5) rotate(0deg); opacity: 0.5; }
        }
        @keyframes coinFall {
            0% { transform: translateY(-100px) rotate(0deg); opacity: 0; }
            10% { opacity: 1; }
            100% { transform: translateY(50px) rotate(720deg); opacity: 0; }
        }
        @keyframes pulseGold {
            0%, 100% { text-shadow: 0 0 20px #f1c40f, 0 0 40px #f39c12; }
            50% { text-shadow: 0 0 40px #f1c40f, 0 0 80px #f39c12, 0 0 120px #e67e22; }
        }
        @keyframes briefcaseGlow {
            0%, 100% { filter: drop-shadow(0 0 10px #3498db); }
            50% { filter: drop-shadow(0 0 30px #3498db) drop-shadow(0 0 60px #2980b9); }
        }
        .vault-content {
            text-align: center;
            color: white;
            font-family: 'Press Start 2P', monospace;
        }
        .vault-door-anim {
            font-size: 80px;
            animation: vaultDoorOpen 2s ease-out forwards;
            margin-bottom: 20px;
        }
        .vault-title {
            font-size: 48px;
            color: #f1c40f;
            animation: pulseGold 1.5s ease-in-out infinite;
            margin: 0 0 10px 0;
            text-transform: uppercase;
            letter-spacing: 8px;
        }
        .vault-subtitle {
            font-size: 14px;
            color: #bdc3c7;
            margin: 0 0 30px 0;
            font-style: italic;
        }
        .vault-coins-container {
            position: relative;
            height: 100px;
            margin: 20px 0;
        }
        .coin-waterfall {
            position: absolute;
            width: 100%;
            height: 100%;
            pointer-events: none;
        }
        .vault-reward {
            font-size: 36px;
            color: #f1c40f;
            animation: pulseGold 1s ease-in-out infinite;
        }
        .vault-weapon {
            margin: 30px 0;
            padding: 20px;
            background: rgba(52, 152, 219, 0.2);
            border: 2px solid #3498db;
            border-radius: 10px;
        }
        .briefcase-icon {
            font-size: 60px;
            animation: briefcaseGlow 2s ease-in-out infinite;
        }
        .weapon-name {
            font-size: 18px;
            color: #3498db;
            margin: 10px 0;
        }
        .weapon-desc {
            font-size: 12px;
            color: #95a5a6;
        }
        .vault-continue {
            margin-top: 30px;
            padding: 15px 40px;
            font-size: 16px;
            font-family: 'Press Start 2P', monospace;
            background: linear-gradient(180deg, #27ae60 0%, #1e8449 100%);
            border: 3px solid #2ecc71;
            color: white;
            cursor: pointer;
            transition: all 0.2s;
        }
        .vault-continue:hover {
            transform: scale(1.05);
            box-shadow: 0 0 20px #2ecc71;
        }
    `;
    document.head.appendChild(style);
    document.body.appendChild(overlay);

    // Create falling coins animation
    const coinContainer = overlay.querySelector('.coin-waterfall');
    for (let i = 0; i < 30; i++) {
        setTimeout(() => {
            const coin = document.createElement('div');
            coin.textContent = '🪙';
            coin.style.cssText = `
                position: absolute;
                font-size: 24px;
                left: ${Math.random() * 80 + 10}%;
                animation: coinFall ${1 + Math.random()}s ease-in forwards;
            `;
            coinContainer.appendChild(coin);
            setTimeout(() => coin.remove(), 2000);
        }, i * 100);
    }

    // Play discovery sound
    AudioManager.play('victory');
}

// Complete vault discovery and continue game
function completeVaultDiscovery() {
    // Mark vault as discovered
    playerStats.vaultDiscovered = true;
    playerStats.vaultDiscoveredDate = new Date().toISOString();
    playerStats.hasSeverancePackage = true;
    playerStats.vaultCoins = 10000;
    playerStats.escapePoints += 10000; // Add to persistent currency
    saveStats();
    updateSpecialTouchButtons(); // Show touch button for new ability

    // Remove overlay
    const overlay = document.getElementById('vaultDiscovery');
    if (overlay) overlay.remove();

    // Reset animation flag
    gameState.vaultAnimationPlaying = false;

    // Continue to next floor
    gameState.endlessFloor++;
    gameState.floor = -gameState.endlessFloor;

    // Reset floor hits
    gameState.floorHits = 0;

    // Show transition to floor -101
    showEndlessLevelTransition(gameState.endlessFloor);
}

// Level transition particle system - Enhanced with more variety
const transitionParticles = {
    particles: [],
    active: false,
    flashAlpha: 0,      // Screen flash effect
    slideOffset: 0,     // Vertical slide effect

    start() {
        this.particles = [];
        this.active = true;
        this.flashAlpha = 0.8;  // Start with bright flash
        this.slideOffset = 0;

        // Create 60 falling debris particles (increased from 40)
        for (let i = 0; i < 60; i++) {
            const type = Math.random();
            this.particles.push({
                x: Math.random() * canvas.width,
                y: -20 - Math.random() * 200,
                vy: 2 + Math.random() * 4,
                vx: (Math.random() - 0.5) * 2,
                size: type < 0.3 ? 1 + Math.random() * 2 : 3 + Math.random() * 8, // Mix of dust and debris
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.3,
                color: ['#1a1a1a', '#2c2c2c', '#454545', '#8b4513', '#666', '#4a3a2a', '#333'][Math.floor(Math.random() * 7)],
                alpha: 0.6 + Math.random() * 0.4,
                type: type < 0.3 ? 'dust' : (type < 0.7 ? 'debris' : 'paper') // Different particle types
            });
        }

        // Add paper particles (flutter effect)
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: Math.random() * canvas.width,
                y: -30 - Math.random() * 100,
                vy: 1 + Math.random() * 2,
                vx: (Math.random() - 0.5) * 3,
                size: 8 + Math.random() * 6,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.15,
                color: ['#f5f5f5', '#e8e8e8', '#fffacd'][Math.floor(Math.random() * 3)],
                alpha: 0.8,
                type: 'paper',
                flutter: Math.random() * Math.PI * 2 // Flutter phase
            });
        }
    },

    update(deltaTime) {
        if (!this.active) return;

        // Fade out flash
        if (this.flashAlpha > 0) {
            this.flashAlpha -= deltaTime * 2;
        }

        for (const p of this.particles) {
            p.y += p.vy;
            p.x += p.vx;
            p.rotation += p.rotationSpeed;

            // Different physics per particle type
            if (p.type === 'paper') {
                // Flutter effect for paper
                p.flutter = (p.flutter || 0) + deltaTime * 5;
                p.vx += Math.sin(p.flutter) * 0.3;
                p.vy += 0.02; // Slower gravity for paper
            } else if (p.type === 'dust') {
                p.vy += 0.03; // Slower gravity for dust
                p.alpha -= deltaTime * 0.3; // Dust fades
            } else {
                p.vy += 0.08; // Normal gravity for debris
            }
        }

        // Remove particles that have fallen off screen or faded
        this.particles = this.particles.filter(p => p.y < canvas.height + 50 && p.alpha > 0);
        if (this.particles.length === 0 && this.flashAlpha <= 0) {
            this.active = false;
        }
    },

    draw() {
        if (!this.active) return;

        // Draw flash effect
        if (this.flashAlpha > 0) {
            ctx.fillStyle = `rgba(255, 255, 255, ${this.flashAlpha * 0.5})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        for (const p of this.particles) {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.globalAlpha = Math.max(0, p.alpha);
            ctx.fillStyle = p.color;

            if (p.type === 'paper') {
                // Draw paper as rectangle with slight skew
                ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
            } else if (p.type === 'dust') {
                // Draw dust as small circles
                ctx.beginPath();
                ctx.arc(0, 0, p.size, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Draw debris as squares
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            }
            ctx.restore();
        }
    },

    stop() {
        this.active = false;
        this.particles = [];
        this.flashAlpha = 0;
    }
};

function showLevelTransition(floor) {
    const transition = document.getElementById('levelTransition');
    const floorNum = document.getElementById('nextFloorNum');
    const flowBonusEl = document.getElementById('flowBonus');
    floorNum.textContent = floor;
    if (flowBonusEl) {
        flowBonusEl.textContent = gameState.flowBonusLastFloor > 0
            ? `FLOW BONUS +${gameState.flowBonusLastFloor}s`
            : '';
    }

    // Set random atmospheric background
    const bg = getRandomBackground('levelTransition');
    transition.style.backgroundImage = `url('${bg}')`;

    transition.style.display = 'flex';

    // Triumphant stinger on floor clear
    AudioManager.play('floorClear', 0.8);
    Haptics.sequence('floorClear', [
        { strong: 0.35, weak: 0.55, duration: 90 },
        { strong: 0.2, weak: 0.4, duration: 70 },
        { strong: 0.4, weak: 0.6, duration: 120 }
    ], 500);

    // Start falling debris particle effect
    transitionParticles.start();

    // === PERK SELECTION: Show perk choices every floor ===
    // Generate perk choices (slot count scales with floor progression)
    const slotCount = getShopSlotCount(gameState.floor);
    gameState.perkChoices = getRandomPerkChoices(slotCount);

    // Show perk selection UI after brief delay
    setTimeout(() => {
        transition.style.display = 'none';
        transitionParticles.stop();
        showPerkSelection(floor);
    }, 1500);
}

// === PERK SELECTION UI ===
// Flat pricing by rarity - legendary/ultimate are premium (1-2 per run max)
const PERK_PRICES = {
    common: 50,
    rare: 100,
    epic: 200,
    legendary: 800,   // Requires dedicated coin saving
    ultimate: 1200    // True endgame purchase
};

// Simple pricing - flat rates with optional Penny Pincher discount
function getPerkPrice(rarity, floor) {
    const basePrice = PERK_PRICES[rarity] || 100;
    // Penny Pincher perk gives 15% discount
    const discount = gameState.perks.includes('coinHoarder') ? 0.85 : 1.0;
    return Math.round(basePrice * discount);
}

// Legacy constant for backwards compatibility
const BASE_PERK_PRICES = PERK_PRICES;

function showPerkSelection(floor) {
    // Create perk selection overlay if it doesn't exist
    let perkScreen = document.getElementById('perkSelection');
    if (!perkScreen) {
        perkScreen = document.createElement('div');
        perkScreen.id = 'perkSelection';
        perkScreen.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0, 0, 0, 0.95);
            display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            z-index: 1000; font-family: 'Courier New', monospace;
        `;
        document.body.appendChild(perkScreen);
    }

    const perks = gameState.perkChoices;
    const rarityColors = {
        common: '#4ecdc4',
        rare: '#9b59b6',
        epic: '#f39c12',
        legendary: '#ffd700',
        ultimate: '#ff1493'  // Hot pink for ultimate tier
    };

    // Dynamic card width based on number of perks
    const cardWidth = perks.length <= 3 ? '220px' : (perks.length <= 4 ? '190px' : '160px');
    const maxWidth = perks.length <= 3 ? '900px' : '1100px';

    perkScreen.innerHTML = `
        <h2 style="color: #fff; margin-bottom: 10px; font-size: 24px;">FLOOR ${floor} - SUPPLY CLOSET</h2>
        <p style="color: #f1c40f; font-size: 20px; margin-bottom: 20px;">Coins: ${gameState.coinsCollected}</p>
        <div style="display: flex; gap: 15px; flex-wrap: wrap; justify-content: center; max-width: ${maxWidth};">
            ${perks.map((perk, index) => {
                const price = getPerkPrice(perk.rarity, floor);
                const canAfford = gameState.coinsCollected >= price;
                return `
                <div class="perk-card"
                    data-perk-id="${perk.id}"
                    data-perk-price="${price}"
                    data-disabled="${!canAfford}"
                    data-rarity="${perk.rarity}"
                    tabindex="${canAfford ? '0' : '-1'}"
                    style="
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                    border: 3px solid ${canAfford ? rarityColors[perk.rarity] || '#4ecdc4' : '#444'};
                    border-radius: 15px;
                    padding: 20px;
                    width: ${cardWidth};
                    cursor: ${canAfford ? 'pointer' : 'not-allowed'};
                    transition: all 0.2s ease;
                    text-align: center;
                    opacity: ${canAfford ? 1 : 0.5};
                    ${perk.rarity === 'legendary' ? 'box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);' : ''}
                    ${perk.rarity === 'ultimate' ? 'box-shadow: 0 0 30px rgba(255, 20, 147, 0.5); animation: ultimate-pulse 1.5s ease-in-out infinite;' : ''}
                ">
                    <div style="font-size: 40px; margin-bottom: 12px;">${perk.icon}</div>
                    <div style="color: ${canAfford ? rarityColors[perk.rarity] || '#4ecdc4' : '#666'}; font-size: 10px; text-transform: uppercase; margin-bottom: 6px; ${perk.rarity === 'legendary' ? 'text-shadow: 0 0 10px #ffd700;' : ''}${perk.rarity === 'ultimate' ? 'text-shadow: 0 0 15px #ff1493; font-weight: bold;' : ''}">${perk.rarity}</div>
                    <div style="color: #fff; font-size: 16px; font-weight: bold; margin-bottom: 8px;">${perk.name}</div>
                    <div style="color: #aaa; font-size: 12px; line-height: 1.3;">${perk.description}</div>
                    <div style="margin-top: 12px; color: ${canAfford ? '#f1c40f' : '#666'}; font-size: 13px; font-weight: bold;">${price} coins</div>
                    <div style="margin-top: 4px; color: #666; font-size: 11px;">[${index + 1}]</div>
                </div>
            `;}).join('')}
        </div>
        <button class="skip-shop-btn" style="
            margin-top: 30px;
            padding: 15px 40px;
            font-size: 16px;
            background: transparent;
            border: 2px solid #666;
            color: #888;
            cursor: pointer;
            border-radius: 8px;
            transition: all 0.2s ease;
        ">
            SKIP (Save coins) [Space]
        </button>
        <p style="color: #444; margin-top: 20px; font-size: 11px;">Current perks: ${gameState.perks.length > 0 ? gameState.perks.map(p => PERKS[p]?.icon || '?').join(' ') : 'None'}</p>
    `;

    perkScreen.style.display = 'flex';

    // Reset gamepad navigation to pick up the new perk screen
    // This ensures controller can navigate perk cards immediately
    menuNavigation.enabled = false;
    menuNavigation.buttons = [];
    menuNavigation.currentIndex = 0;

    // Add click/keyboard handlers to perk cards for gamepad/keyboard navigation
    perkScreen.querySelectorAll('.perk-card').forEach(card => {
        const canAfford = card.dataset.disabled !== 'true';
        const rarity = card.dataset.rarity;
        const rarityColor = rarityColors[rarity];

        if (canAfford) {
            // Click handler
            card.addEventListener('click', () => {
                purchasePerk(card.dataset.perkId, parseInt(card.dataset.perkPrice));
            });
            // Keyboard handler (Enter/Space)
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    purchasePerk(card.dataset.perkId, parseInt(card.dataset.perkPrice));
                }
            });
            // Mouse hover effects
            card.addEventListener('mouseover', () => {
                card.style.transform = 'scale(1.05)';
                card.style.boxShadow = `0 0 30px ${rarityColor}`;
            });
            card.addEventListener('mouseout', () => {
                if (!card.classList.contains('gamepad-focus')) {
                    card.style.transform = 'scale(1)';
                    card.style.boxShadow = rarity === 'legendary' ? '0 0 20px rgba(255, 215, 0, 0.3)' : 'none';
                }
            });
        }
    });

    // Add skip button handler
    const skipBtn = perkScreen.querySelector('.skip-shop-btn');
    if (skipBtn) {
        skipBtn.addEventListener('click', skipShop);
        skipBtn.addEventListener('mouseover', () => {
            skipBtn.style.borderColor = '#fff';
            skipBtn.style.color = '#fff';
        });
        skipBtn.addEventListener('mouseout', () => {
            if (!skipBtn.classList.contains('gamepad-focus')) {
                skipBtn.style.borderColor = '#666';
                skipBtn.style.color = '#888';
            }
        });
    }

    // Keyboard shortcuts for shop (supports up to 6 perks)
    const shopKeyHandler = (e) => {
        const perks = gameState.perkChoices;
        const keyNum = parseInt(e.key);
        if (keyNum >= 1 && keyNum <= 6 && perks[keyNum - 1]) {
            const perk = perks[keyNum - 1];
            const price = getPerkPrice(perk.rarity, floor);
            if (gameState.coinsCollected >= price) {
                purchasePerk(perk.id, price);
            }
        } else if (e.key === ' ' || e.key === 'Escape') {
            skipShop();
        }
    };
    document.addEventListener('keydown', shopKeyHandler, { once: true });

    // Store handler for cleanup
    perkScreen.keyHandler = shopKeyHandler;
}

// Purchase a perk from the shop
function purchasePerk(perkId, price) {
    const perk = PERKS[perkId];
    if (!perk) return;

    // Check if can afford
    if (gameState.coinsCollected < price) {
        AudioManager.play('footstep', 0.5); // Error sound
        return;
    }

    // Deduct coins
    gameState.coinsCollected -= price;

    // Add perk to player's collection
    gameState.perks.push(perkId);
    gameState.perksPicked++;

    // Play sound
    AudioManager.play('powerup', 0.8);

    // Show celebration
    showCelebration('perkPurchased', { perk: perk.name, price: price });

    // Apply immediate effects for some perks
    if (perkId === 'startTime') {
        gameState.timer += 5;
    }
    if (perkId === 'timeLord') {
        gameState.timer += 10; // Immediate +10s bonus on purchase (nerfed from +15s)
    }
    if (perkId === 'shieldStart') {
        gameState.player.shielded = 5;
    }

    // Close shop
    closeShop();
}

// Skip the shop and continue
function skipShop() {
    showCelebration('shopSkipped');
    closeShop();
}

// Close the shop screen and continue to level
function closeShop() {
    const perkScreen = document.getElementById('perkSelection');
    if (perkScreen) {
        perkScreen.style.display = 'none';
    }

    // Clear perk choices
    gameState.perkChoices = null;

    // Continue to level
    initLevel();
}

function showVictoryScreen() {
    // Stop background music
    AudioManager.stopProceduralMusic();

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
    playerStats.totalFloorsCleared += 13;
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
    const floorsDescended = gameState.quickRunMode ? 5 : 13;
    const modeLabel = gameState.quickRunMode ? ' (Quick Run)' : '';

    const fastestFloor = gameState.floorTimes.length > 0
        ? gameState.floorTimes.reduce((best, cur) => cur.time < best.time ? cur : best)
        : null;
    const fastestFloorText = fastestFloor
        ? `Fastest floor: ${fastestFloor.floor} (${fastestFloor.time.toFixed(1)}s)`
        : 'Fastest floor: --';
    const statusLine = getEndRunStatus();

    stats.innerHTML = `
        <span style="font-size: 24px; color: #ffe66d;">⏱️ ${timeString}</span>${newRecord ? ' <span style="color: #4ecdc4;">NEW RECORD!</span>' : ''}${dailyInfo}<br><br>
        Floors descended: ${floorsDescended}${modeLabel}<br>
        Coins collected: 🪙 ${gameState.coinsCollectedCount || 0}<br>
        Coworkers punched: ${gameState.enemiesKnockedOut || 0}<br>
        Coworkers zapped: ${gameState.enemiesZapped || 0}<br>
        Best combo: x${gameState.maxComboThisRun || 0}<br>
        ${fastestFloorText}<br>
        Best time: ${bestTimeStr}<br>
        Total wins: ${playerStats.totalWins}<br>
        <span style="color: #f39c12;">Escape Points: +${calculateEscapePoints(true)} (Total: ${playerStats.escapePoints || 0})</span><br>
        Status: ${statusLine}
    `;
    victory.style.display = 'flex';
}

// === NEW: Calculate escape points for display ===
function calculateEscapePoints(won) {
    const floorsDescended = (gameState.quickRunMode ? 5 : 13) - gameState.floor;
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

const STATUS_THEME_PACKS = {
    core: {
        id: 'core',
        name: 'Core Statuses',
        description: 'Base set of snarky survival lines.',
        unlockCondition: () => true,
        statuses: [
            'Unemployed but alive',
            'Promoted to Intern (Trial Period)',
            'Clocked out with style',
            'HR says: "Try a different exit next time."',
            'The elevator remembers your name now',
            'Overtime survivor, barely',
            'Rivalized by Accounting',
            'Stapler secured, morale questionable',
            'Floor 7 sends its regards',
            'You live to file another day',
            '"Speed is a policy, not a perk." - Director Kane',
            '"Corners are just promises you keep." - M. Bell, Safety Lead',
            '"The clock is honest. Are you?" - Warden of 13',
            '"Punch first, ask later." - Coach R. Knox',
            '"Beat the timer, beat the system." - The Night Shift',
            '"Your exit is a habit, not a miracle." - J. Mercer',
            '"Don’t panic. Route." - Facilities Chief D. Pike',
            '"You can’t out-run bad decisions, but you can out-turn them." - S. Vale',
            '"Every floor teaches. Learn faster." - The Auditor',
            '"Better run. The building already is." - L. Crow'
        ]
    },
    night_shift: {
        id: 'night_shift',
        name: 'Night Shift',
        description: 'Bleak, neon, after-hours survival tips.',
        unlockCondition: () => playerProgress.totalRuns >= 10,
        statuses: [
            'Security footage looks great, actually',
            'Break room champion, now run again',
            '"The exit is a rumor until you prove it." - Night Ops',
            '"You’re late. The timer isn’t." - Shift Lead Q',
            'You smell like smoke and success',
            'Overtime granted. It was not optional',
            '"Move fast, leave fewer regrets." - A. Nightingale',
            'Coffee spills fear you'
        ]
    },
    hr_memo: {
        id: 'hr_memo',
        name: 'HR Memo',
        description: 'Passive-aggressive corporate motivation.',
        unlockCondition: () => playerProgress.totalPunches >= 50 || playerProgress.totalZaps >= 25,
        statuses: [
            'HR Memo: "Please stop stunning coworkers."',
            'Quarterly review: Needs more dodging',
            '"Your KPIs include living." - HR Bot 4',
            'Filed a complaint with the floor itself',
            'Promotion pending: Escape velocity required',
            '"We value resilience. And exits." - People Team',
            'Calendar invite: "Run faster" (mandatory)',
            'Expense report: 1 broken wall, 0 regrets'
        ]
    },
    survivor: {
        id: 'survivor',
        name: 'Survivor Notes',
        description: 'Veteran wisdom and grudging praise.',
        unlockCondition: () => playerProgress.totalWins >= 1 || playerProgress.perfectRunAchieved,
        statuses: [
            'You made it out. The rest is paperwork',
            '"Speed is mercy." - Old Escapee',
            '"Learn the corners, own the clock." - J. Rook',
            'You escaped. The building didn’t',
            'Break glass in case of slow run',
            '"Every floor is a lesson plan." - The Veteran',
            'You are now a cautionary success story',
            'No overtime today. Maybe tomorrow'
        ]
    },
    vault_legends: {
        id: 'vault_legends',
        name: 'Vault Legends',
        description: 'Mythic lines for those who found it.',
        unlockCondition: () => playerStats.vaultDiscovered,
        statuses: [
            'The Vault remembers your footsteps',
            '"You saw it. Now run like it." - Vault Keeper',
            'Legend filed under: classified survival',
            'You escaped with interest',
            '"Gold buys time. You buy exits." - The Broker',
            'Vault-cleared. Ego increased',
            'You’re on the rumor board now',
            '"Every exit has a price." - The Auditor'
        ]
    }
};

function checkStatusThemeUnlocks() {
    let newUnlocks = [];
    for (const [id, theme] of Object.entries(STATUS_THEME_PACKS)) {
        if (!playerProgress.unlockedStatusThemes.includes(id) && theme.unlockCondition()) {
            playerProgress.unlockedStatusThemes.push(id);
            newUnlocks.push(theme);
        }
    }
    for (const theme of newUnlocks) {
        showStatusThemeUnlock(theme);
    }
    if (newUnlocks.length > 0) {
        saveProgress();
    }
    return newUnlocks;
}

function getEndRunStatus() {
    const unlockedIds = playerProgress.unlockedStatusThemes || ['core'];
    const selected = playerProgress.selectedStatusTheme || 'auto';

    let candidatePacks = [];
    if (selected !== 'auto' && unlockedIds.includes(selected) && STATUS_THEME_PACKS[selected]) {
        candidatePacks = [STATUS_THEME_PACKS[selected]];
    } else {
        candidatePacks = unlockedIds
            .map(id => STATUS_THEME_PACKS[id])
            .filter(Boolean);
    }

    if (candidatePacks.length === 0) {
        candidatePacks = [STATUS_THEME_PACKS.core];
    }

    const allStatuses = candidatePacks.flatMap(pack => pack.statuses);
    return allStatuses[Math.floor(Math.random() * allStatuses.length)];
}

function showGameOverScreen(message) {
    // Stop background music
    AudioManager.stopProceduralMusic();

    // Save ghost replay if this was a good run
    saveGhostReplay();

    // Record time spent on final floor if not already captured
    if (gameState.floorStartTime && !gameState.floorTimes.some(t => t.floor === gameState.floor)) {
        const floorTime = (Date.now() - gameState.floorStartTime) / 1000;
        gameState.floorTimes.push({ floor: gameState.floor, time: floorTime });
    }

    // Update progress
    updateProgressAfterRun(false);

    const gameOver = document.getElementById('gameOver');
    const msg = document.getElementById('gameOverMessage');
    const stats = document.getElementById('gameOverStats');

    // Set random game over background
    const bg = getRandomBackground('gameOver');
    gameOver.style.backgroundImage = `url('${bg}')`;

    // === ENDLESS MODE: Special game over screen ===
    if (gameState.endlessMode) {
        showEndlessGameOverScreen(message);
        return;
    }

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
    const startFloor = gameState.quickRunMode ? 5 : 13;
    const percentile = Math.min(95, Math.floor((startFloor - floorNum) / startFloor * 100) + 10);
    statsHtml += `<br><span style="color: #aaa; font-size: 12px;">That's better than ~${percentile}% of attempts!</span>`;
    const fastestFloor = gameState.floorTimes.length > 0
        ? gameState.floorTimes.reduce((best, cur) => cur.time < best.time ? cur : best)
        : null;
    const fastestFloorText = fastestFloor
        ? `Fastest floor: ${fastestFloor.floor} (${fastestFloor.time.toFixed(1)}s)`
        : 'Fastest floor: --';

    statsHtml += `<br><span style="color: #f1c40f;">🪙 Coins: ${gameState.coinsCollectedCount || 0}</span>`;
    statsHtml += `<br><span style="color: #aaa;">Best combo: x${gameState.maxComboThisRun || 0}</span>`;
    statsHtml += `<br><span style="color: #aaa;">${fastestFloorText}</span>`;
    statsHtml += `<br><span style="color: #f39c12;">Escape Points: +${calculateEscapePoints(false)} (Total: ${playerStats.escapePoints || 0})</span>`;
    statsHtml += `<br><span style="color: #aaa;">Status: ${getEndRunStatus()}</span>`;

    // Show continue option if checkpoint available
    if (gameState.continuesRemaining > 0 && gameState.lastCheckpoint && !gameState.zenMode) {
        statsHtml += `<br><br><button onclick="continueFromCheckpoint()" class="continue-btn" style="background: #27ae60; border: none; padding: 10px 20px; color: white; font-family: monospace; font-size: 14px; cursor: pointer; border-radius: 5px;">CONTINUE from Floor ${gameState.lastCheckpoint} (${gameState.continuesRemaining} left)</button>`;
    }

    stats.innerHTML = statsHtml;
    gameOver.style.display = 'flex';
}

// Endless mode game over screen
function showEndlessGameOverScreen(message) {
    const gameOver = document.getElementById('gameOver');
    const msg = document.getElementById('gameOverMessage');
    const stats = document.getElementById('gameOverStats');

    const finalFloor = gameState.endlessFloor;
    const finalScore = calculateEndlessScore(finalFloor, {
        ...gameState.endlessStats,
        enemiesKnockedOut: gameState.enemiesKnockedOut,
        enemiesZapped: gameState.enemiesZapped,
        coinsCollected: gameState.coinsCollected
    });
    const earnedEP = calculateEndlessEscapePoints(finalFloor, finalScore);

    // Check for new personal best
    const isNewBest = finalFloor > (playerStats.endlessBestFloor || 0);

    // Update stats
    playerStats.endlessTotalFloors += finalFloor;
    if (isNewBest) {
        playerStats.endlessBestFloor = finalFloor;
        playerStats.endlessBestScore = finalScore;
    }
    const totalRuns = playerStats.endlessRuns || 1;
    playerStats.endlessAverageFloor = Math.round(playerStats.endlessTotalFloors / totalRuns);

    // Track milestones reached
    gameState.endlessStats.milestonesReached.forEach(m => {
        if (!playerStats.endlessMilestonesReached.includes(m)) {
            playerStats.endlessMilestonesReached.push(m);
        }
    });

    // Add escape points
    playerStats.escapePoints = (playerStats.escapePoints || 0) + earnedEP;
    saveStats();

    // Build display
    msg.innerHTML = isNewBest ?
        `<span style="color: #ffd700;">🏆 NEW PERSONAL BEST! 🏆</span>` :
        'CLOCKED OUT';

    let statsHtml = `<div style="font-size: 32px; color: #e74c3c; margin-bottom: 10px;">FLOOR -${finalFloor}</div>`;
    statsHtml += `<div style="font-size: 20px; color: #4ecdc4; margin-bottom: 15px;">SCORE: ${finalScore.toLocaleString()}</div>`;

    if (isNewBest) {
        statsHtml += `<div style="color: #ffd700; margin-bottom: 10px;">New record filed: Floor -${playerStats.endlessBestFloor - (finalFloor - (playerStats.endlessBestFloor || 0))}</div>`;
    } else {
        statsHtml += `<div style="color: #aaa; margin-bottom: 10px;">Best on file: Floor -${playerStats.endlessBestFloor} | Score: ${playerStats.endlessBestScore.toLocaleString()}</div>`;
    }

    // Milestones reached
    if (gameState.endlessStats.milestonesReached.length > 0) {
        statsHtml += `<div style="margin: 10px 0; padding: 8px; background: rgba(0,0,0,0.3); border-radius: 5px;">`;
        statsHtml += `<div style="color: #f39c12; font-size: 12px; margin-bottom: 5px;">AUDITS CLEARED</div>`;
        gameState.endlessStats.milestonesReached.forEach(m => {
            statsHtml += `<span style="color: #2ecc71; margin: 0 5px;">✓ ${m}</span>`;
        });
        statsHtml += `</div>`;
    }

    // Stats
    statsHtml += `<div style="margin-top: 10px; font-size: 12px; color: #aaa;">`;
    statsHtml += `Perfect Floors: ${gameState.endlessStats.perfectFloors} | `;
    statsHtml += `Max Combo: ${gameState.endlessStats.maxCombo}x | `;
    statsHtml += `Coins: ${gameState.coinsCollectedCount || 0}`;
    statsHtml += `</div>`;

    // Escape points
    statsHtml += `<div style="margin-top: 10px; color: #f39c12;">`;
    statsHtml += `Escape Points: +${earnedEP} (Total: ${playerStats.escapePoints})`;
    statsHtml += `</div>`;

    // Average stats
    statsHtml += `<div style="margin-top: 5px; font-size: 11px; color: #666;">`;
    statsHtml += `Endless Runs: ${playerStats.endlessRuns} | Avg Floor: -${playerStats.endlessAverageFloor}`;
    statsHtml += `</div>`;

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
    gameState.floor = 13;
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
    gameState.flow = 0;
    gameState.flowStateActive = false;
    gameState.lastFlowActionTime = 0;
    gameState.flowBonusLastFloor = 0;
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
    const moveDelay = getEffectiveMoveDelay();
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
    if (!settings.inputBufferingEnabled) return false;
    if (!gameState.inputBuffer) return false;

    const now = Date.now();
    const bufferExpiry = 150; // Buffered inputs expire after 150ms
    let movementProcessed = false;

    // Process buffered movement
    if (gameState.inputBuffer.direction) {
        if (now - gameState.inputBuffer.timestamp < bufferExpiry) {
            const { dx, dy } = gameState.inputBuffer.direction;
            const timeSinceMove = now - lastMove;
            const moveDelay = getEffectiveMoveDelay();

            if (timeSinceMove >= moveDelay) {
                if (movePlayer(dx, dy)) {
                    movementProcessed = true;
                }
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

    return movementProcessed;
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
    Haptics.sequence('collapse', [
        { strong: 0.9, weak: 0.6, duration: 200 },
        { strong: 0.6, weak: 0.9, duration: 260 },
        { strong: 0.4, weak: 0.7, duration: 220 }
    ], 800);
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
    msg.querySelector('button').textContent = isWin ? 'RUN AGAIN' : 'RUN IT BACK';
    msg.style.display = 'block';
}

function update(deltaTime) {
    gameState.animationTime += deltaTime;
    updateFlow(deltaTime);

    // Update character animation state - reset isMoving if player hasn't moved recently
    if (characterAnimationState.player.lastMoveTime &&
        Date.now() - characterAnimationState.player.lastMoveTime > 150) {
        // Trigger squash when player just stopped moving (Super Meat Boy feel)
        if (characterAnimationState.player.isMoving) {
            triggerSquash();

            // === LANDING PARTICLES: 3-5 dust particles when player stops ===
            for (let p = 0; p < 3 + Math.floor(Math.random() * 3); p++) {
                gameState.particles.push({
                    x: gameState.player.x * TILE_SIZE + TILE_SIZE / 2 + (Math.random() - 0.5) * TILE_SIZE * 0.5,
                    y: gameState.player.y * TILE_SIZE + TILE_SIZE * 0.85,
                    vx: (Math.random() - 0.5) * 3,
                    vy: -Math.random() * 1.5 - 0.5,
                    size: 2 + Math.random() * 2,
                    color: '#aaa',
                    lifetime: 0.35
                });
            }
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

    // === ENDLESS MODE: Update milestone flash decay ===
    if (gameState.milestoneFlash && gameState.milestoneFlash > 0) {
        gameState.milestoneFlash -= deltaTime * 2; // Fade out over 0.5s
        if (gameState.milestoneFlash < 0) gameState.milestoneFlash = 0;
    }

    // === ENDLESS MODE: Unstable floor wall shifting ===
    if (gameState.endlessMode && gameState.endlessDangerZone === 'unstable' && gameState.started && !gameState.gameOver) {
        gameState.endlessWallShiftTimer -= deltaTime;
        if (gameState.endlessWallShiftTimer <= 0) {
            shiftUnstableWalls();
            gameState.endlessWallShiftTimer = 20; // Reset timer
        }
    }

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
        // === SLOW-MO: Timer ticks slower during slow-mo (player advantage) ===
        const slowMoMultiplier = gameState.slowMoActive ? gameState.slowMoFactor : 1.0;
        // === CHRONO SHIFT PERK: Time slows 50% when timer is below 10s ===
        const chronoShiftMultiplier = (gameState.perks.includes('chronoShift') && gameState.timer <= 10 && gameState.timer > 0) ? 0.5 : 1.0;
        gameState.timer -= deltaTime * cafeteriaMultiplier * burnMultiplier * speedMultiplier * slowMoMultiplier * chronoShiftMultiplier;
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

    // === COIN POP ANIMATION: Update collecting coins ===
    for (const coin of gameState.coins) {
        if (coin.collecting) {
            // Shrink scale and fade out
            coin.collectScale = (coin.collectScale || 1.3) * 0.85;
            coin.collectAlpha = (coin.collectAlpha || 1.0) - deltaTime * 4;
            if (coin.collectAlpha <= 0) {
                coin.collecting = false;
                coin.collected = true;
            }
        }
    }

    // === TIMER PULSE ANIMATION: Update timer scale ===
    if (gameState.timerPulseScale > 1.0) {
        gameState.timerPulseScale = Math.max(1.0, gameState.timerPulseScale - deltaTime * 3);
    }

    // === ENEMY SPAWN FLASH: Decay flash effect ===
    if (gameState.enemySpawnFlash > 0) {
        gameState.enemySpawnFlash -= deltaTime * 3;
    }

    // === DAMAGE FLASH: Decay red vignette when hit ===
    if (gameState.damageFlashTimer > 0) {
        gameState.damageFlashTimer -= deltaTime;
    }

    // === SMOOTH MOVEMENT: Lerp visual position toward logical position ===
    const lerpSpeed = 18; // Tiles per second (higher = snappier)
    const player = gameState.player;
    if (player.visualX === undefined) player.visualX = player.x;
    if (player.visualY === undefined) player.visualY = player.y;

    const dxVis = player.x - player.visualX;
    const dyVis = player.y - player.visualY;
    const distVis = Math.sqrt(dxVis * dxVis + dyVis * dyVis);

    if (distVis > 0.01) {
        // Lerp toward target position
        const moveAmount = Math.min(distVis, lerpSpeed * deltaTime);
        player.visualX += (dxVis / distVis) * moveAmount;
        player.visualY += (dyVis / distVis) * moveAmount;
    } else {
        // Snap when very close
        player.visualX = player.x;
        player.visualY = player.y;
    }

    // Clamp to prevent overshooting
    if (Math.abs(player.visualX - player.x) > 2) player.visualX = player.x;
    if (Math.abs(player.visualY - player.y) > 2) player.visualY = player.y;

    // === COIN MAGNET PERK: Attract coins from 3 tiles away ===
    if (gameState.perks.includes('coinMagnet')) {
        for (const coin of gameState.coins) {
            if (coin.collected) continue;

            const dist = Math.abs(coin.x - gameState.player.x) + Math.abs(coin.y - gameState.player.y);
            if (dist <= 3 && dist > 0) {
                // Initialize magnet animation state if not present
                if (!coin.magnetizing) {
                    coin.magnetizing = true;
                    coin.magnetTimer = 0;
                }

                // Update magnet timer
                coin.magnetTimer += deltaTime;

                // Move coin toward player every 0.15 seconds
                if (coin.magnetTimer >= 0.15) {
                    coin.magnetTimer = 0;

                    // Move on longer axis first
                    const dx = gameState.player.x - coin.x;
                    const dy = gameState.player.y - coin.y;

                    if (Math.abs(dx) >= Math.abs(dy) && dx !== 0) {
                        coin.x += Math.sign(dx);
                    } else if (dy !== 0) {
                        coin.y += Math.sign(dy);
                    }

                    // Create attraction particle trail
                    gameState.particles.push({
                        x: coin.x * TILE_SIZE + TILE_SIZE / 2,
                        y: coin.y * TILE_SIZE + TILE_SIZE / 2,
                        vx: (Math.random() - 0.5) * 2,
                        vy: (Math.random() - 0.5) * 2,
                        size: 2,
                        color: '#f1c40f',
                        life: 0.2
                    });

                    // Auto-collect if reached player
                    if (coin.x === gameState.player.x && coin.y === gameState.player.y) {
                        coin.collected = true;
                        // Coin multiplier perks: Vault Master (3x) > Lucky Coins (2x)
                        let coinMultiplier = 1;
                        if (gameState.perks.includes('vaultMaster')) coinMultiplier = 3;
                        else if (gameState.perks.includes('luckyCoins')) coinMultiplier = 2;
                        gameState.coinsCollected += coin.value * coinMultiplier;
                        gameState.coinsCollectedCount++;

                        // Coin combo
                        if (gameState.coinComboTimer > 0) {
                            gameState.coinCombo++;
                        } else {
                            gameState.coinCombo = 1;
                        }
                        gameState.coinComboTimer = 2.0;

                        // Pitch-scaled coin sound
                        const pitchScale = 1.0 + (gameState.coinCombo * 0.08);
                        AudioManager.play('powerup', 0.5, Math.min(pitchScale, 2.0));
                        Haptics.pulse('coin', 0.12, 0.25, 40, 40);
                        if (gameState.coinCombo >= 5) {
                            Haptics.sequence('coinCombo', [
                                { strong: 0.12, weak: 0.2, duration: 35 },
                                { strong: 0.2, weak: 0.25, duration: 45 }
                            ], 120);
                        }
                    }
                }
            }
        }
    }

    // Timer warning sound (scaled intensity as time runs out)
    if (gameState.timer <= 5 && gameState.timer > 0 && !gameState.lastChance) {
        if (!gameState.lastWarningTime || Date.now() - gameState.lastWarningTime > 500) {
            const urgency = Math.max(0, Math.min(1, (5 - gameState.timer) / 5));
            const volume = 0.35 + urgency * 0.35;
            const pitch = 1.0 + urgency * 0.25;
            AudioManager.play('warning', volume, pitch);
            Haptics.pulse('timerWarning', 0.2 + urgency * 0.25, 0.25 + urgency * 0.3, 80, 350);
            gameState.lastWarningTime = Date.now();
        }
    }

    // Low-timer ramp rumble for accessibility (continuous tension cue)
    if (gameState.timer <= 5 && gameState.timer > 0 && !gameState.lastChance) {
        const urgency = Math.max(0, Math.min(1, (5 - gameState.timer) / 5));
        const interval = gameState.timer <= 3 ? 400 : 600;
        if (!gameState.lastLowTimerRumble || Date.now() - gameState.lastLowTimerRumble > interval) {
            Haptics.pulse('lowTimerRamp', 0.12 + urgency * 0.18, 0.18 + urgency * 0.2, 70, interval - 50);
            gameState.lastLowTimerRumble = Date.now();
        }
    }

    // Panic stinger under 3 seconds (extra urgency layer)
    if (gameState.timer <= 3 && gameState.timer > 0 && !gameState.lastChance) {
        if (!gameState.lastPanicTime || Date.now() - gameState.lastPanicTime > 900) {
            const urgency = Math.max(0, Math.min(1, (3 - gameState.timer) / 3));
            const volume = 0.4 + urgency * 0.4;
            const pitch = 1.0 + urgency * 0.3;
            AudioManager.play('panicStinger', volume, pitch);
            Haptics.pulse('panic', 0.35 + urgency * 0.35, 0.4 + urgency * 0.3, 120, 600);
            gameState.lastPanicTime = Date.now();
        }
    }

    // Enhanced audio - heartbeat pulse when timer is low
    if (settings.audioProximityCues && gameState.timer <= 10 && gameState.timer > 0) {
        // Heartbeat rate increases as timer gets lower
        const heartbeatInterval = gameState.timer <= 5 ? 400 : 700;
        if (!gameState.lastHeartbeatTime || Date.now() - gameState.lastHeartbeatTime > heartbeatInterval) {
            const intensity = 1 - (gameState.timer / 10);
            AudioManager.playHeartbeat(intensity);
            Haptics.pulse('heartbeat', 0.15 + intensity * 0.2, 0.12 + intensity * 0.18, 70, heartbeatInterval - 100);
            gameState.lastHeartbeatTime = Date.now();
        }
    }

    // Enhanced audio - spatial proximity cues for enemies and fires
    updateSpatialAudio();

    // Update burn effect
    if (gameState.player.burning > 0) {
        gameState.player.burning -= deltaTime;
    }

    // Accessibility: periodic rumble while stunned or shielded
    if (gameState.player.stunned > 0) {
        if (!gameState.lastStunRumble || Date.now() - gameState.lastStunRumble > 500) {
            Haptics.pulse('stunned', 0.15, 0.2, 70, 450);
            gameState.lastStunRumble = Date.now();
        }
    }
    if (gameState.player.shielded > 0) {
        if (!gameState.lastShieldRumble || Date.now() - gameState.lastShieldRumble > 800) {
            Haptics.pulse('shielded', 0.1, 0.18, 60, 700);
            gameState.lastShieldRumble = Date.now();
        }
    }

    // Update fires - spawn new ones and grow existing
    updateFires(deltaTime);

    // Update environmental hazards (sparking wires, coffee spills, copiers)
    // Spawn hazards after initial delay
    if (gameState.hazardSpawnTimer > 0) {
        gameState.hazardSpawnTimer -= deltaTime;
        if (gameState.hazardSpawnTimer <= 0) {
            spawnEnvironmentalHazards();
        }
    }
    updateEnvironmentalHazards(deltaTime);

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

    // === DASH COOLDOWN UPDATE ===
    const prevDashCooldown = gameState.player.dashCooldown;
    if (gameState.player.dashCooldown > 0) {
        gameState.player.dashCooldown -= deltaTime;
        if (prevDashCooldown > 0 && gameState.player.dashCooldown <= 0) {
            Haptics.pulse('dashReady', 0.12, 0.18, 60, 200);
        }
    }
    if (gameState.player.dashInvincible > 0) {
        gameState.player.dashInvincible -= deltaTime;
    }

    // === PUNCH COOLDOWN UPDATE ===
    const prevPunchCooldown = gameState.player.punchCooldown;
    if (gameState.player.punchCooldown > 0) {
        gameState.player.punchCooldown -= deltaTime;
        if (prevPunchCooldown > 0 && gameState.player.punchCooldown <= 0) {
            Haptics.pulse('punchReady', 0.12, 0.18, 60, 200);
        }
    }

    // === WALL BREAK COOLDOWN UPDATE ===
    const prevWallBreakCooldown = gameState.player.wallBreakCooldown;
    if (gameState.player.wallBreakCooldown > 0) {
        gameState.player.wallBreakCooldown -= deltaTime;
        if (prevWallBreakCooldown > 0 && gameState.player.wallBreakCooldown <= 0 && gameState.hasWallBreaker) {
            Haptics.pulse('wallBreakReady', 0.14, 0.2, 70, 200);
        }
    }

    // === COMBO TIMER DECAY ===
    if (gameState.killComboTimer > 0) {
        // Apply slow-mo factor to combo decay (combo lasts longer in slow-mo)
        gameState.killComboTimer -= deltaTime * (gameState.slowMoActive ? 0.5 : 1);
        if (gameState.killComboTimer <= 0) {
            // Combo expired
            if (gameState.killCombo >= 3) {
                showCelebration('comboBreak');
                Haptics.pulse('comboBreak', 0.35, 0.2, 120, 300);
            }
            gameState.killCombo = 0;
        }
    }

    // === SLOW-MO SYSTEM UPDATE ===
    if (gameState.slowMoActive) {
        gameState.slowMoTimer -= deltaTime; // Real time, not slowed
        if (gameState.slowMoTimer <= 0) {
            gameState.slowMoActive = false;
            gameState.slowMoFactor = 1.0;
        }
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
        // === KNOCKBACK VISUAL: Decay knockback offset ===
        if (enemy.knockbackTimer > 0) {
            enemy.knockbackTimer -= deltaTime;
            const t = enemy.knockbackTimer / 0.25; // Normalized time (1 to 0)
            const ease = t * t; // Ease out
            enemy.knockbackX = (enemy.knockbackX || 0) * ease;
            enemy.knockbackY = (enemy.knockbackY || 0) * ease;
            if (enemy.knockbackTimer <= 0) {
                enemy.knockbackX = 0;
                enemy.knockbackY = 0;
            }
        }
    }

    if (gameState.powerupTimer > 0) {
        gameState.powerupTimer -= deltaTime;
        if (gameState.powerupTimer <= 0 && (gameState.powerup === 'speed' || gameState.powerup === 'electric' || gameState.powerup === 'overclock')) {
            AudioManager.play('powerupExpire'); // Power-down sound
            Haptics.pulse('powerupExpire', 0.2, 0.35, 90, 200);
            gameState.powerup = null;
        }
    }

    // Update shield timer
    if (gameState.player.shielded > 0) {
        gameState.player.shielded -= deltaTime;
    }

    // Update invincibility timer
    if (gameState.player.invincible > 0) {
        gameState.player.invincible -= deltaTime;
        if (gameState.player.invincible <= 0) {
            AudioManager.play('powerupExpire');
            Haptics.pulse('powerupExpire', 0.2, 0.35, 90, 200);
        }
    }

    // === UPDATE NEW POWERUP TIMERS ===

    // Time Freeze - unfreeze enemies when timer expires
    if (gameState.timeFreezeActive) {
        gameState.timeFreezeTimer -= deltaTime;
        if (gameState.timeFreezeTimer <= 0) {
            gameState.timeFreezeActive = false;
            for (const enemy of gameState.enemies) {
                enemy.frozen = false;
            }
            AudioManager.play('powerupExpire');
            Haptics.pulse('powerupExpire', 0.2, 0.35, 90, 200);
        }
    }

    // Coin Magnet - pull coins toward player
    if (gameState.coinMagnetActive) {
        gameState.coinMagnetTimer -= deltaTime;

        // Pull all coins toward player
        for (const coin of gameState.coins) {
            const dx = gameState.player.x - coin.x;
            const dy = gameState.player.y - coin.y;
            const dist = Math.abs(dx) + Math.abs(dy);

            if (dist > 0 && dist <= 10) { // Affect coins within 10 tiles
                // Move coin toward player
                if (Math.abs(dx) > Math.abs(dy)) {
                    coin.x += dx > 0 ? 1 : -1;
                } else if (dy !== 0) {
                    coin.y += dy > 0 ? 1 : -1;
                }
            }
        }

        if (gameState.coinMagnetTimer <= 0) {
            gameState.coinMagnetActive = false;
            AudioManager.play('powerupExpire');
            Haptics.pulse('powerupExpire', 0.2, 0.35, 90, 200);
        }
    }

    // Ghost Walk powerup expiration (already handled in powerupTimer, but need to handle ghost specifically)
    if (gameState.powerup === 'ghost' && gameState.powerupTimer <= 0) {
        AudioManager.play('powerupExpire');
        Haptics.pulse('powerupExpire', 0.2, 0.35, 90, 200);
        gameState.powerup = null;
    }

    // Clone decoy - enemies chase it instead of player
    if (gameState.clone) {
        gameState.clone.timer -= deltaTime;
        gameState.clone.frame += deltaTime * 8;
        gameState.clone.blinkTimer += deltaTime;

        // Make enemies target the clone instead of player
        for (const enemy of gameState.enemies) {
            if (enemy.stunned <= 0 && !enemy.frozen) {
                const distToPlayer = Math.abs(enemy.x - gameState.player.x) + Math.abs(enemy.y - gameState.player.y);
                const distToClone = Math.abs(enemy.x - gameState.clone.x) + Math.abs(enemy.y - gameState.clone.y);

                // 80% of enemies chase clone, 20% still chase player
                if (distToClone < distToPlayer || Math.random() < 0.8) {
                    enemy.target = 'clone';
                }
            }
        }

        if (gameState.clone.timer <= 0) {
            gameState.clone = null;
            showCelebration('decoyExpired');
        }
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

    // === UNIFIED INPUT SYSTEM ===
    // Get combined input from all sources (keyboard, gamepad, touch)
    const currentInput = updateInputActions();

    // Handle pause from any input source
    if (currentInput.pause) {
        togglePause();
    }

    // Handle all action buttons from any input source
    // These are already edge-detected, so they only fire once per press
    if (!gameState.paused && gameState.started && !gameState.gameOver && !gameState.won) {
        if (currentInput.dash) {
            performDash();
        }
        if (currentInput.punch) {
            performPunch();
        }
        if (currentInput.action) {
            usePowerup();
        }
        if (currentInput.wallBreak && gameState.hasWallBreaker) {
            performWallBreak();
        }
        if (currentInput.severance && playerStats.hasSeverancePackage && gameState.severanceAvailable) {
            activateSeverancePackage();
        }
    }

    // Update squash & stretch animation
    updateSquashStretch(deltaTime);

    // Process any buffered inputs first
    const bufferedMoveProcessed = processInputBuffer();

    // Movement using combined input (with input buffering support)
    // Only process current input if no buffered move was just executed
    // Use else-if to ensure only one direction per frame
    // Movement with diagonal support and tap/hold detection
    // Calculate movement direction based on all held keys
    if (!bufferedMoveProcessed) {
        let dx = 0;
        let dy = 0;

        // Accumulate direction from all held keys
        if (currentInput.up) dy -= 1;
        if (currentInput.down) dy += 1;
        if (currentInput.left) dx -= 1;
        if (currentInput.right) dx += 1;

        // If any direction is requested, try to move
        if (dx !== 0 || dy !== 0) {
            let moved = false;

            // For diagonal movement, try the combined direction first
            if (dx !== 0 && dy !== 0) {
                // Try diagonal move
                if (movePlayer(dx, dy)) {
                    moved = true;
                } else {
                    // Diagonal blocked - try horizontal first, then vertical
                    if (movePlayer(dx, 0)) {
                        moved = true;
                    } else if (movePlayer(0, dy)) {
                        moved = true;
                    } else {
                        // Both blocked, buffer the diagonal
                        bufferMovementInput(dx, dy);
                    }
                }
            } else {
                // Single direction movement
                if (movePlayer(dx, dy)) {
                    moved = true;
                } else {
                    bufferMovementInput(dx, dy);
                }
            }

            // Mark direction keys as "moved" so tap detection works
            if (moved) {
                const controls = settings.controls || DEFAULT_SETTINGS.controls;
                if (dy < 0) controls.up.forEach(key => { if (keys[key]) keyMoved[key] = true; });
                if (dy > 0) controls.down.forEach(key => { if (keys[key]) keyMoved[key] = true; });
                if (dx < 0) controls.left.forEach(key => { if (keys[key]) keyMoved[key] = true; });
                if (dx > 0) controls.right.forEach(key => { if (keys[key]) keyMoved[key] = true; });
            }
        }
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

    // Always update gamepad menu navigation (works even when game is paused/in menu)
    updateGamepadMenuNavigation();

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

        // Update procedural music tempo based on timer
        if (gameState.started && !gameState.gameOver && !gameState.won) {
            AudioManager.setMusicTempo(gameState.timer);
            AudioManager.updateProceduralMusic();
        }
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
    Haptics.pulse('menuSelect', 0.2, 0.25, 60, 120);

    // Start procedural background music
    AudioManager.startProceduralMusic();

    document.getElementById('message').style.display = 'none';

    // === ENDLESS DESCENT MODE ===
    const isEndless = mode === 'endless';
    gameState.endlessMode = isEndless;
    gameState.firstRunTutorial = !isEndless && !dailyChallenge.active && playerProgress.totalRuns === 0;

    if (isEndless) {
        // Endless mode starts at floor 1 internally, displayed as negative
        gameState.floor = -1;  // Display as negative
        gameState.endlessFloor = 1;  // Internal counter
        gameState.endlessScore = 0;
        gameState.endlessDangerZone = null;
        gameState.endlessIsBreatherFloor = false;
        gameState.endlessWallShiftTimer = 0;
        gameState.endlessBlackoutRadius = 0;
        gameState.endlessStats = {
            totalTimeBonus: 0,
            maxCombo: 0,
            perfectFloors: 0,
            milestoneBonus: 0,
            milestonesReached: []
        };
        playerStats.endlessRuns++;
        saveStats();
    }

    // === NEW: Quick Run Mode (5 floors instead of 13) ===
    // Check if mode includes 'quick' prefix
    const isQuickRun = !isEndless && mode.startsWith('quick');
    const actualMode = isQuickRun ? mode.replace('quick_', '') : (isEndless ? 'normal' : mode);

    gameState.quickRunMode = isQuickRun;
    if (!isEndless) {
        gameState.floor = isQuickRun ? 5 : 13; // Quick run starts at floor 5
        gameState.quickRunStartFloor = isQuickRun ? 5 : 13;
    }

    gameState.gameOver = false;
    gameState.won = false;
    gameState.started = true;
    gameState.paused = false;
    gameState.player.hitCount = 0;
    gameState.player.lastHitTime = 0;
    gameState.player.burning = 0;
    // === DASH/PUNCH: Reset for new run ===
    gameState.player.dashCooldown = 0;
    gameState.player.dashInvincible = 0;
    gameState.player.isDashing = false;
    gameState.player.punchCooldown = 0;
    gameState.player.isPunching = false;
    // === COMBO/STREAK: Full reset for new run ===
    gameState.killCombo = 0;
    gameState.killComboTimer = 0;
    gameState.killStreak = 0;
    gameState.maxComboThisRun = 0;
    gameState.lastKillTime = 0;
    // === SLOW-MO: Reset for new run ===
    gameState.slowMoActive = false;
    gameState.slowMoTimer = 0;
    gameState.slowMoFactor = 1.0;
    // === PERKS: Reset for new run ===
    gameState.perks = [];
    gameState.perkChoices = null;
    gameState.perksPicked = 0;
    gameState.enemiesKnockedOut = 0;
    gameState.enemiesZapped = 0;
    gameState.enemiesDodged = 0;
    gameState.fires = [];
    gameState.fireSpawnTimer = 0;

    // === SHOP ECONOMY: Start with coins to buy first upgrade ===
    gameState.coinsCollected = 50; // Starting coins for first shop purchase
    gameState.coinsCollectedCount = 0;
    gameState.coinCombo = 0;
    gameState.coinComboTimer = 0;

    // Checkpoint system reset (Playtest Feature #2)
    gameState.lastCheckpoint = null;
    gameState.continuesRemaining = MAX_CONTINUES;
    gameState.floorHits = 0;
    gameState.celebrations = [];

    // === THE VAULT: Reset Severance Package for new run ===
    gameState.severanceAvailable = playerStats.hasSeverancePackage;  // Only available if unlocked
    gameState.vaultAnimationPlaying = false;
    gameState.showingVaultFloor = false;

    // Update touch buttons for special abilities
    updateSpecialTouchButtons();

    // Set difficulty mode (Playtest Feature #1)
    gameState.zenMode = (actualMode === 'zen');
    settings.difficulty = actualMode;

    // Start run timer
    gameState.runStartTime = Date.now();
    gameState.runTotalTime = 0;
    gameState.floorTimes = [];
    gameState.floorStartTime = Date.now();

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
        Haptics.pulse('pause', 0.18, 0.28, 80, 150);
    } else {
        pauseScreen.style.display = 'none';
        Haptics.pulse('resume', 0.12, 0.2, 60, 150);
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

    // Register keypress - track when key was first pressed (ignore repeats)
    // Actions are now processed in the game loop via updateInputActions()
    if (!e.repeat) {
        keys[e.code] = true;
        keyPressTime[e.code] = Date.now();
        keyMoved[e.code] = false; // Reset - this key hasn't triggered a move yet
    }

    // Prevent default for action keys to avoid browser shortcuts
    if (e.code === 'Space' || e.code === 'KeyZ' || e.code === 'KeyX' ||
        e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyV') {
        e.preventDefault();
    }
    const actionKeys = (settings.controls && settings.controls.action) ? settings.controls.action : DEFAULT_SETTINGS.controls.action;
    if (actionKeys.includes(e.code)) {
        e.preventDefault();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
    keyPressTime[e.code] = 0;
    keyMoved[e.code] = false;
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

    // Update device profile label + auto-detect toggle
    const deviceLabel = document.getElementById('deviceProfileLabel');
    if (deviceLabel) {
        const info = getDeviceProfileInfo();
        deviceLabel.textContent = `${info.label} — Suggested: ${info.suggested}`;
    }
    const autoDetectToggle = document.getElementById('autoDetectToggle');
    if (autoDetectToggle) {
        autoDetectToggle.checked = settings.autoDetectResolution !== false;
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

    const hapticsStrength = document.getElementById('hapticsStrength');
    if (hapticsStrength) {
        const val = Math.round((settings.hapticsStrength !== undefined ? settings.hapticsStrength : 1.0) * 100);
        hapticsStrength.value = val;
        document.getElementById('hapticsStrengthVal').textContent = val + '%';
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
    settings.autoDetectResolution = false;
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
        btn.textContent = 'Assign key...';
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
    Haptics.pulse('menuSlider', 0.05, 0.08, 25, 40);
}

function setMusicVolume(value) {
    settings.musicVolume = value / 100;
    document.getElementById('musicVolumeVal').textContent = value + '%';
    saveSettings();
    AudioManager.setMusicVolume(settings.musicVolume);
    Haptics.pulse('menuSlider', 0.05, 0.08, 25, 40);
}

function setSfxVolume(value) {
    settings.sfxVolume = value / 100;
    document.getElementById('sfxVolumeVal').textContent = value + '%';
    saveSettings();
    AudioManager.setSfxVolume(settings.sfxVolume);
    Haptics.pulse('menuSlider', 0.05, 0.08, 25, 40);
}

function setHapticsStrength(value) {
    settings.hapticsStrength = value / 100;
    Haptics.strength = settings.hapticsStrength;
    const span = document.getElementById('hapticsStrengthVal');
    if (span) span.textContent = value + '%';
    saveSettings();
    Haptics.pulse('menuSlider', 0.05, 0.08, 25, 40);
}

// Add settings button to title screen
function addSettingsToTitle() {
    const tertiaryRow = document.getElementById('tertiaryButtons');
    if (tertiaryRow && !document.getElementById('titleSettingsBtn')) {
        const settingsBtn = document.createElement('button');
        settingsBtn.id = 'titleSettingsBtn';
        settingsBtn.className = 'btn-tertiary';
        settingsBtn.textContent = 'SYSTEMS';
        settingsBtn.onclick = showSettingsMenu;
        tertiaryRow.appendChild(settingsBtn);
    }
}

// === HIGH SCORE DISPLAY: Show best floor on title screen ===
function updateTitleHighScore() {
    const middleContent = document.querySelector('#message .middle-content');
    if (!middleContent) return;

    // Remove existing high score display
    let existing = document.getElementById('titleHighScore');
    if (existing) existing.remove();

    // Only show if player has actually played (best floor < 13)
    if (playerProgress.bestFloor < 13) {
        const highScoreDiv = document.createElement('div');
        highScoreDiv.id = 'titleHighScore';
        highScoreDiv.style.cssText = `
            margin-top: 12px;
            padding: 8px 20px;
            background: linear-gradient(90deg, rgba(78,205,196,0.1), rgba(78,205,196,0.2), rgba(78,205,196,0.1));
            border-radius: 20px;
            display: inline-block;
        `;

        // Determine achievement level
        let badge = '';
        let badgeColor = '#4ecdc4';
        if (playerProgress.bestFloor === 1) {
            badge = '🏆 ';
            badgeColor = '#ffd700';
        } else if (playerProgress.bestFloor <= 3) {
            badge = '⭐ ';
            badgeColor = '#e74c3c';
        } else if (playerProgress.bestFloor <= 5) {
            badge = '🎯 ';
            badgeColor = '#f39c12';
        }

        highScoreDiv.innerHTML = `
            <span style="color: ${badgeColor}; font-size: 14px; letter-spacing: 2px; font-family: 'Courier New', monospace;">
                ${badge}BEST: FLOOR ${playerProgress.bestFloor}
            </span>
        `;

        // Insert after tagline-small
        const tagline = middleContent.querySelector('.tagline-small');
        if (tagline && tagline.parentNode) {
            tagline.parentNode.insertBefore(highScoreDiv, tagline.nextSibling);
        } else {
            middleContent.appendChild(highScoreDiv);
        }
    }
}

// Initialize settings on load
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    loadProgress();
    initDifficultyButtons();
    addResumeButtonToTitle();
    updatePlayerColors();
    initTouchControls();

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
updateVaultBadge(); // Show vault badge if discovered
updateTitleHighScore(); // Show best floor reached
initTouchControls();

// Watch for modal visibility changes to toggle HUD/canvas visibility
const messageModal = document.getElementById('message');
const modalObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.attributeName === 'style') {
            const isVisible = messageModal.style.display !== 'none';
            document.body.classList.toggle('menu-active', isVisible);
        }
    });
});
modalObserver.observe(messageModal, { attributes: true, attributeFilter: ['style'] });
// Set initial state
document.body.classList.add('menu-active');

// Fit canvas to viewport on init
fitCanvasToViewport();

requestAnimationFrame(gameLoop);
