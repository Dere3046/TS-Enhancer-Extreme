// ── Mock data generator ─────────────────────────────────────

const APP_PREFIXES = [
  'com', 'cn', 'org', 'net', 'io', 'tv', 'app', 'cc', 'me', 'info',
]

const APP_NAMES = [
  'WeChat', 'Alipay', 'TikTok', 'Instagram', 'Twitter', 'Facebook',
  'YouTube', 'Netflix', 'Spotify', 'WhatsApp', 'Telegram', 'Discord',
  'Snapchat', 'Pinterest', 'Reddit', 'LinkedIn', 'Twitch', 'Tinder',
  'Uber', 'Lyft', 'Airbnb', 'Booking', 'Expedia', 'TripAdvisor',
  'Amazon', 'eBay', 'AliExpress', 'Wish', 'Shopee', 'Lazada',
  'Taobao', 'JD', 'Pinduoduo', 'Meituan', 'Dianping', 'Eleme',
  'Bilibili', 'Douyu', 'Huya', 'Kuaishou', 'Xiaohongshu', 'Zhihu',
  'Weibo', 'QQ', 'TIM', 'DingTalk', 'Lark', 'Feishu',
  'WPS', 'Microsoft', 'Google', 'Apple', 'Samsung', 'Huawei',
  'Xiaomi', 'OPPO', 'vivo', 'OnePlus', 'Realme', 'Honor',
  'Chrome', 'Firefox', 'Edge', 'Safari', 'Opera', 'Brave',
  'Gmail', 'Outlook', 'Yahoo', 'ProtonMail', 'QQMail', '163Mail',
  'Maps', 'Waze', 'Gaode', 'BaiduMap', 'TencentMap', 'HERE',
  'Drive', 'Dropbox', 'OneDrive', 'GoogleDrive', 'iCloud', 'Box',
  'Calendar', 'Keep', 'Notion', 'Evernote', 'OneNote', 'Bear',
  'Photos', 'GooglePhotos', 'iCloudPhotos', 'AmazonPhotos', 'Flickr',
  'Translate', 'DeepL', 'GoogleTranslate', 'BaiduTranslate', 'Youdao',
  'Weather', 'AccuWeather', 'WeatherChannel', 'Windy', 'MyRadar',
  'News', 'Flipboard', 'Feedly', 'Inoreader', 'Reddit', 'Hackernews',
  'Finance', 'Robinhood', 'Coinbase', 'Binance', 'PayPal', 'Venmo',
  'Fitness', 'Strava', 'NikeRun', 'Keep', 'Peloton', 'MyFitnessPal',
  'Music', 'AppleMusic', 'AmazonMusic', 'YouTubeMusic', 'SoundCloud',
  'Podcast', 'ApplePodcast', 'GooglePodcast', 'SpotifyPodcast', 'Overcast',
  'Books', 'Kindle', 'AppleBooks', 'GoogleBooks', 'Kobo', 'Audible',
  'Shopping', 'SHEIN', 'Zara', 'H&M', 'Nike', 'Adidas',
  'Food', 'McDonald', 'KFC', 'Starbucks', 'PizzaHut', 'Domino',
  'Bank', 'Chase', 'BankOfAmerica', 'WellsFargo', 'Citibank',
  'Travel', 'GoogleFlight', 'Skyscanner', 'Kayak', 'Momondo',
  'Health', 'MyChart', 'Teladoc', 'GoodRx', 'Calm', 'Headspace',
  'Education', 'Duolingo', 'KhanAcademy', 'Coursera', 'Udemy', 'edX',
  'Game', 'PUBG', 'HonorOfKings', 'GenshinImpact', 'AmongUs', 'Roblox',
  'Tool', 'Speedtest', 'FileManager', 'Zip', 'QRScanner', 'Compass',
  'Social', 'Clubhouse', 'BeReal', 'Mastodon', 'Bluesky', 'Threads',
  'Video', 'iQIYI', 'Youku', 'TencentVideo', 'MangoTV', 'SohuVideo',
  'Live', 'Inke', 'YY', 'Momo', 'Bigo', 'UpLive',
  'Payment', 'Stripe', 'Square', 'CashApp', 'Zelle', 'AlipayHK',
  'Cloud', 'AWS', 'Azure', 'GCP', 'DigitalOcean', 'Linode',
  'Dev', 'GitHub', 'GitLab', 'Bitbucket', 'StackOverflow', 'Jira',
  'Design', 'Figma', 'Sketch', 'AdobeXD', 'Canva', 'Pixso',
  'Office', 'Slack', 'Zoom', 'Teams', 'Webex', 'Meet',
  'VPN', 'ExpressVPN', 'NordVPN', 'Surfshark', 'ProtonVPN', 'Clash',
  'Security', 'Authy', 'Bitwarden', '1Password', 'LastPass', 'Duo',
  'Storage', 'SanDisk', 'WD', 'Seagate', 'Toshiba', 'SamsungSSD',
  'Remote', 'TeamViewer', 'AnyDesk', 'ChromeRemote', 'RustDesk', 'ToDesk',
  'Scanner', 'CamScanner', 'AdobeScan', 'MicrosoftLens', 'GeniusScan',
  'PDF', 'AdobeAcrobat', 'Foxit', 'PDFExpert', 'Xodo', 'WPSPDF',
  'Note', 'Simplenote', 'StandardNotes', 'Joplin', 'Obsidian', 'Logseq',
  'Browser', 'DuckDuckGo', 'Tor', 'Vivaldi', 'Arc', 'Sigma',
  'Mail', 'Spark', 'Newton', 'Canary', 'FairEmail', 'AquaMail',
  'Chat', 'Signal', 'Threema', 'Wire', 'Session', 'Status',
  'File', 'ESFile', 'SolidExplorer', 'FXFile', 'MiXplorer', 'Amaze',
  'Launcher', 'Nova', 'Lawnchair', 'MicrosoftLauncher', 'SmartLauncher',
  'Wallpaper', 'Backdrops', 'Zedge', 'Walli', 'Muzei', 'Tapet',
  'Keyboard', 'Gboard', 'SwiftKey', 'Fleksy', 'Grammarly', 'OpenBoard',
  'Recorder', 'VoiceRecorder', 'EasyVoice', 'RecForge', 'HiQMP3',
  'Radio', 'TuneIn', 'iHeartRadio', 'SiriusXM', 'Audacy', 'RadioGarden',
  'TV', 'Hulu', 'DisneyPlus', 'HBO', 'AppleTV', 'Peacock',
  'Sports', 'ESPN', 'NBA', 'NFL', 'MLB', 'FIFA',
  'Betting', 'DraftKings', 'FanDuel', 'BetMGM', 'Caesars', 'PointsBet',
  'Dating', 'Bumble', 'Hinge', 'OkCupid', 'Match', 'PlentyOfFish',
  'Parent', 'FamilyLink', 'Qustodio', 'Bark', 'NetNanny', 'Circle',
  'Baby', 'BabyTracker', 'Huckleberry', 'GlowBaby', 'PiyoLog', 'Sprout',
  'Pet', 'Chewy', 'Rover', 'Wag', 'Petco', 'BarkBox',
  'Car', 'Tesla', 'FordPass', 'MySubaru', 'Toyota', 'BMW',
  'Home', 'SmartThings', 'GoogleHome', 'HomeKit', 'Alexa', 'Hue',
  'Garden', 'Planter', 'PictureThis', 'PlantNet', 'iNaturalist', 'Seek',
  'Cook', 'Yummly', 'Tasty', 'Allrecipes', 'KitchenStories', 'ChefTap',
  'Wine', 'Vivino', 'Delectable', 'WineSearcher', 'Drizly', 'Minibar',
  'Beer', 'Untappd', 'BeerAdvocate', 'RateBeer', 'Taphunter', 'BreweryDB',
  'Coffee', 'Beanhunter', 'Foursquare', 'Yelp', 'GoogleMaps', 'Tripadvisor',
  'Hotel', 'Marriott', 'Hilton', 'IHG', 'Hyatt', 'Accor',
  'Flight', 'FlightAware', 'Flightradar24', 'PlaneFinder', 'ADS-B',
  'Train', 'Trainline', 'Omio', 'Wanderu', 'Rome2Rio', 'FlixBus',
  'Bike', 'Strava', 'Komoot', 'AllTrails', 'Relive', 'RideWithGPS',
  'Ski', 'OnTheSnow', 'OpenSnow', 'SkiTracks', 'Slopes', 'Trace',
  'Surf', 'Surfline', 'MagicSeaweed', 'MSW', 'SurfForecast', 'Buoyweather',
  'Dive', 'DiveLog', 'Subsurface', 'DiveMate', 'MacDive', 'DiveComputer',
  'Fish', 'Fishbrain', 'Anglr', 'FishAngler', 'BassForecast', 'Navionics',
  'Hunt', 'onX', 'HuntStand', 'BaseMap', 'GoHunt', 'Avenza',
  'Golf', 'GolfNow', '18Birdies', 'TheGrint', 'Golfshot', 'Arccos',
  'Tennis', 'TennisTV', 'ATP', 'WTA', 'TennisChannel', 'UniversalTennis',
  'Soccer', 'FIFA', 'UEFA', 'OneFootball', 'SofaScore', 'FlashScore',
  'Basketball', 'NBA', 'WNBA', 'EuroLeague', 'NCAA', 'BleacherReport',
  'Baseball', 'MLB', 'MiLB', 'NCAA_Baseball', 'BaseballReference', 'FanGraphs',
  'Hockey', 'NHL', 'AHL', 'KHL', 'IIHF', 'HockeyReference',
  'Racing', 'F1', 'MotoGP', 'NASCAR', 'IndyCar', 'WRC',
  'Boxing', 'DAZN', 'ESPNPlus', 'Showtime', 'HBOBoxing', 'TopRank',
  'MMA', 'UFC', 'Bellator', 'ONE', 'PFL', 'Invicta',
  'Wrestling', 'WWE', 'AEW', 'NJPW', 'Impact', 'ROH',
  'Esports', 'Twitch', 'YouTubeGaming', 'FacebookGaming', 'Discord', 'Steam',
  'Chess', 'Chess_com', 'Lichess', 'Chess24', 'PlayMagnus', 'ChessBase',
  'Poker', 'PokerStars', 'ZyngaPoker', 'WorldSeriesOfPoker', 'GGPoker',
  'Casino', 'Slotomania', 'DoubleDown', 'HouseOfFun', 'BingoBlitz',
  'Lottery', 'Powerball', 'MegaMillions', 'Lotto', 'EuroMillions',
  'Crypto', 'CoinMarketCap', 'CoinGecko', 'CryptoCom', 'Kraken', 'Gemini',
  'NFT', 'OpenSea', 'Rarible', 'SuperRare', 'Foundation', 'Nifty',
  'Metaverse', 'Decentraland', 'Sandbox', 'Roblox', 'Horizon', 'Spatial',
  'AI', 'ChatGPT', 'Claude', 'Gemini', 'Copilot', 'Perplexity',
  'Search', 'Google', 'Bing', 'DuckDuckGo', 'Yandex', 'Baidu',
  'Browser', 'Chrome', 'Firefox', 'Edge', 'Safari', 'Opera',
]

const SYSTEM_NAMES = [
  'SystemUI', 'Settings', 'Phone', 'Messages', 'Contacts', 'Calendar',
  'Camera', 'Gallery', 'Clock', 'Calculator', 'FileManager', 'Notes',
  'Music', 'Video', 'Browser', 'Email', 'Weather', 'Maps',
  'VoiceRecorder', 'DownloadManager', 'PackageInstaller', 'Bluetooth',
  'NFC', 'WiFi', 'Hotspot', 'VPN', 'Firewall', 'Antivirus',
  'Backup', 'Restore', 'Update', 'Diagnostics', 'Feedback', 'Help',
  'Search', 'Launcher', 'Wallpaper', 'Theme', 'Font', 'Sound',
  'Display', 'Battery', 'Storage', 'Memory', 'CPU', 'GPU',
  'Sensor', 'GPS', 'Compass', 'Gyroscope', 'Accelerometer', 'Barometer',
  'Fingerprint', 'FaceID', 'Iris', 'Voice', 'SmartLock', 'Keychain',
  'Certificate', 'Credential', 'Keystore', 'TrustZone', 'SafetyNet',
  'PlayServices', 'PlayStore', 'PlayProtect', 'PlayGames', 'PlayBooks',
  'PlayMovies', 'PlayMusic', 'Duo', 'Meet', 'Messages_Google',
  'Dialer_Google', 'Contacts_Google', 'Calendar_Google', 'Photos_Google',
  'Drive_Google', 'Docs_Google', 'Sheets_Google', 'Slides_Google',
  'Keep_Google', 'Tasks_Google', 'Translate_Google', 'Lens_Google',
  'Assistant', 'Home_Google', 'Pay_Google', 'Wallet_Google', 'Health_Google',
  'Fit', 'WearOS', 'AndroidAuto', 'DigitalWellbeing', 'ParentalControls',
  'Accessibility', 'SwitchAccess', 'TalkBack', 'BrailleBack', 'SelectToSpeak',
  'SoundAmplifier', 'LiveTranscribe', 'SoundNotifications', 'ActionBlocks',
  'Lookout', 'VoiceAccess', 'HearingAid', 'ColorCorrection', 'Magnification',
  'HighContrast', 'RemoveAnimations', 'StickyKeys', 'SlowKeys', 'BounceKeys',
]

function randSeed(seed: number) {
  let s = seed || 1
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

function generatePackageName(seed: number, isSystem: boolean): string {
  const rng = randSeed(seed)
  const prefix = APP_PREFIXES[Math.floor(rng() * APP_PREFIXES.length)]
  const name = isSystem
    ? SYSTEM_NAMES[Math.floor(rng() * SYSTEM_NAMES.length)]
    : APP_NAMES[Math.floor(rng() * APP_NAMES.length)]
  const suffix = Math.floor(rng() * 1000).toString().padStart(3, '0')
  return `${prefix}.${name.toLowerCase().replace(/[^a-z0-9]/g, '')}${suffix}`
}

function generateAppName(seed: number, isSystem: boolean): string {
  const rng = randSeed(seed + 100000)
  if (isSystem) {
    return SYSTEM_NAMES[Math.floor(rng() * SYSTEM_NAMES.length)]
  }
  const base = APP_NAMES[Math.floor(rng() * APP_NAMES.length)]
  const modifiers = ['Pro', 'Lite', 'Plus', 'Max', 'Mini', 'Go', 'HD', 'Beta', 'Alpha', 'Dev']
  const modifier = rng() > 0.7 ? modifiers[Math.floor(rng() * modifiers.length)] : ''
  const num = rng() > 0.8 ? ` ${Math.floor(rng() * 10)}` : ''
  return `${base}${modifier}${num}`
}

export interface MockApp {
  packageName: string
  appName: string
  isSystem: boolean
}

export const MOCK_APPS: MockApp[] = []
export const MOCK_USR_TXT: string[] = []
export const MOCK_SYS_TXT: string[] = []
export let MOCK_BLACKLIST = false

// Generate apps
const THIRD_PARTY_COUNT = 1000
const SYSTEM_COUNT = 200

for (let i = 0; i < THIRD_PARTY_COUNT; i++) {
  MOCK_APPS.push({
    packageName: generatePackageName(i, false),
    appName: generateAppName(i, false),
    isSystem: false,
  })
}

for (let i = 0; i < SYSTEM_COUNT; i++) {
  MOCK_APPS.push({
    packageName: generatePackageName(i + 100000, true),
    appName: generateAppName(i + 100000, true),
    isSystem: true,
  })
}

// Randomly populate usr.txt and sys.txt (~30% each)
for (const app of MOCK_APPS) {
  if (app.isSystem) {
    if (Math.random() < 0.3) MOCK_SYS_TXT.push(app.packageName)
  } else {
    if (Math.random() < 0.3) MOCK_USR_TXT.push(app.packageName)
  }
}

export const MODULE_PROP = `id=ts_enhancer_extreme
name=TS Enhancer Extreme
version=v2.1.0
versionCode=2100
author=XtrLumen
description=Enhanced Tricky Store module with WebUI
updateJson=https://raw.githubusercontent.com/XtrLumen/TS-Enhancer-Extreme/main/update.json`

export const DEVICE_PROPS: Record<string, string> = {
  'ro.product.model': 'Pixel 8 Pro',
  'ro.build.version.release': '14',
  'ro.build.version.sdk': '34',
  'ro.product.cpu.abi': 'arm64-v8a',
  'ro.product.manufacturer': 'Google',
  'ro.product.brand': 'google',
  'ro.product.name': 'husky',
  'ro.build.id': 'AP2A.240905.003',
  'ro.build.type': 'user',
  'ro.build.tags': 'release-keys',
}

export const MOCK_LOGS = `[2024-05-09 10:23:45] [INFO] TS-Enhancer-Extreme service started
[2024-05-09 10:23:46] [INFO] Tricky Store state: active
[2024-05-09 10:23:47] [INFO] Module version: v2.1.0
[2024-05-09 10:23:48] [INFO] Device: Pixel 8 Pro (arm64-v8a)
[2024-05-09 10:23:49] [INFO] Android version: 14 (API 34)
[2024-05-09 10:23:50] [INFO] SELinux status: Enforcing
[2024-05-09 10:23:51] [INFO] Checking keybox... OK
[2024-05-09 10:23:52] [INFO] Checking target list... 1200 apps
[2024-05-09 10:23:53] [INFO] Service ready
[2024-05-09 10:24:15] [INFO] Package list update requested
[2024-05-09 10:24:16] [INFO] Processing whitelist mode
[2024-05-09 10:24:17] [INFO] Writing target.txt... Done
[2024-05-09 10:24:18] [INFO] Reloading Tricky Store... Done
[2024-05-09 10:24:19] [INFO] Package list updated successfully
[2024-05-09 10:25:01] [INFO] Root detection: passed
[2024-05-09 10:25:02] [INFO] Conflict check: no conflicts found
[2024-05-09 10:25:03] [INFO] Security patch sync: 2024-05-01
[2024-05-09 10:26:00] [INFO] Periodic state refresh
[2024-05-09 10:26:01] [INFO] All systems operational
[2024-05-09 10:30:00] [INFO] User toggled app: com.tencent.mm
[2024-05-09 10:30:01] [INFO] Updating configuration... Done
[2024-05-09 10:30:02] [INFO] Package list update requested
[2024-05-09 10:30:03] [INFO] Processing complete`

export function setMockBlacklist(v: boolean) { MOCK_BLACKLIST = v }
