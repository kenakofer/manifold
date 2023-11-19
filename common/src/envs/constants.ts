import { PlaygroundState } from '../playground/playground-state'
import { NestedLogger, logCall, codeUrl } from '../playground/nested-logger'
declare global { interface Window { logger: NestedLogger; pState: PlaygroundState } }
const raw_github_file_url = 'https://raw.githubusercontent.com/manifoldmarkets/manifold/74ab5cae/common/src/envs/constants.ts'
const github_file_url = 'https://github.com/manifoldmarkets/manifold/blob/74ab5cae/common/src/envs/constants.ts'
import { escapeRegExp } from 'lodash'
import { DEV_CONFIG } from './dev'
import { EnvConfig, PROD_CONFIG } from './prod'

export const CONFIGS: { [env: string]: EnvConfig } = {
  PROD: PROD_CONFIG,
  DEV: DEV_CONFIG,
}

export function isTrustworthy(username?: string) {
  if (!username) {
    return false
  }
  return MOD_USERNAMES.includes(username)
}

// TODO: These should maybe be part of the env config?
export const BOT_USERNAMES = [
  'pos',
  'v',
  'acc',
  'jerk',
  'snap',
  'ArbitrageBot',
  'MarketManagerBot',
  'Botlab',
  'JuniorBot',
  'ManifoldDream',
  'ManifoldBugs',
  'ACXBot',
  'JamesBot',
  'RyanBot',
  'trainbot',
  'runebot',
  'LiquidityBonusBot',
  '538',
  'FairlyRandom',
  'Anatolii',
  'JeremyK',
  'Botmageddon',
  'SmartBot',
  'ShifraGazsi',
  'NiciusBot',
  'Bot',
  'Mason',
  'VersusBot',
  'GPT4',
  'EntropyBot',
  'veat',
  'ms_test',
  'arb',
  'Turbot',
  'MiraBot',
  'MetaculusBot',
  'burkebot',
  'Botflux',
  '7',
  'hyperkaehler',
  'NcyBot',
  'ithaca',
  'GigaGaussian',
  'BottieMcBotface',
  'Seldon',
  'OnePercentBot',
  'arrbit',
  'ManaMaximizer',
  'rita',
  'uhh',
  'ArkPoint',
  'EliBot',
  'manifestussy',
  'mirrorbot',
  'JakeBot',
  'loopsbot',
  'breezybot',
  'echo',
]

export const CORE_USERNAMES = [
  'Austin',
  'JamesGrugett',
  'SG',
  'ian',
  'Sinclair',
  'Alice',
  'SirSalty',
  'mqp',
  'IngaWei',
  'rachel',
]

export const MOD_USERNAMES = [
  'Manifold',
  'memestiny',
  'BTE',
  'jack',
  'Yev',
  'itsTomekK',
  'MattP',
  'egroj',
  'dreev',
  'MartinRandall',
  'LivInTheLookingGlass',
  'LarsDoucet',
  'Conflux',
  'NcyRocks',
  'MichaelWheatley',
  'dglid',
  'yaboi69',
  'TheSkeward',
  'Duncn',
  'a',
  'NuñoSempere',
  'CarsonGale',
  'Tetraspace',
  'BoltonBailey',
  'MatthewBarnett',
  'Jacy',
  'Gabrielle',
  'AndrewG',
  'MarcusAbramovitch',
  'KevinBurke',
  'PeterWildeford',
  'ScottLawrence',
  'NoaNabeshima',
  'evergreenemily',
  'SneakySly',
  'Eliza',
  'SirCryptomind',
  'Joshua',
  'jskf',
  'JosephNoonan',
  'CodeandSolder',
  'Stralor',
  'WieDan',
  'Ernie',
  'Gen',
  'NathanpmYoung',
]

export const MVP = ['Eliza']

export const VERIFIED_USERNAMES = [
  'EliezerYudkowsky',
  'ScottAlexander',
  'Aella',
  'ZviMowshowitz',
  'GavrielK',
  'CGPGrey',
  'LexFridman',
  'patio11',
  'RichardHanania',
  'Qualy',
  'Roko',
  'JonathanBlow',
  'DwarkeshPatel',
  'ByrneHobart',
  'RobertWiblin',
  'KelseyPiper',
  'SpencerGreenberg',
  'PaulChristiano',
  'BuckShlegeris',
  'Natalia',
  'zero',
  'OzzieGooen',
  'OliverHabryka',
  'Alicorn',
  'RazibKhan',
  'JamesMedlock',
  'Writer',
  'GeorgeHotz',
  'ShayneCoplan',
  'SanghyeonSeo',
  'KatjaGrace',
  'EmmettShear',
  'CateHall',
  'RobertSKMiles',
  'TarekMansour',
  'DylanMatthews',
  'RobinHanson',
  'KevinRoose18ac',
  'KnowNothing',
]

export const HOUSE_BOT_USERNAME = 'acc'

export const TEN_YEARS_SECS = 60 * 60 * 24 * 365 * 10

export const BLOCKED_BY_DEFAULT_GROUP_SLUGS = ['nsfw']

export const DESTINY_GROUP_SLUGS = [
  'destinygg',
  'destinygg-stocks',
  'eto',
  'mumbowl-stonks',
]

export const GROUP_SLUGS_TO_IGNORE_IN_MARKETS_EMAIL = [
  'manifold-features',
  'manifold-6748e065087e',
  'destinygg',
  'manifold-features-25bad7c7792e',
  'bugs',
  'manifold-leagues',
  'nonpredictive',
]

export const DEEMPHASIZED_GROUP_SLUGS = [
  'fun',
  'selfresolving',
  'experimental',
  'trading-bots',
  'gambling',
  'free-money',
  'whale-watching',
  'spam',
  'test',
  'no-resolution',
  'eto',
  'friend-stocks',
  'austin-less-wrong-2023-predictions',
  'fantasy-football-stock-exchange',
  'ancient-markets',
  'jokes',
  'olivia',
  'planecrash',
  'glowfic',
  'all-stonks',
  'destinygg',
  'the-market',
  'nonpredictive-profits',
  'nonpredictive',
  'personal-goals',
  'personal',
  'rationalussy',
  'uk',
  'uk-politics',
  'crystal-ballin',
  ...GROUP_SLUGS_TO_IGNORE_IN_MARKETS_EMAIL,
  ...DESTINY_GROUP_SLUGS,
  ...BLOCKED_BY_DEFAULT_GROUP_SLUGS,
]

export const GROUP_SLUGS_TO_IGNORE_FOR_NEWS = DEEMPHASIZED_GROUP_SLUGS.filter(
  (slug) => ['uk', 'uk-politics'].includes(slug)
)

export const LIKELY_DUPLICATIVE_GROUP_SLUGS_ON_TOPICS_LIST = [
  // politics, 2024-presidential-election, magaland, donald-trump
  'us-politics',
  'republican-party',
  '2024-republican-primaries',
  'presidential-politics',
  // lk-99
  'superconductivity',
  // ai
  'openai',
  'technical-ai-timelines',
  // crypto-speculation
  'crypto-prices',
  // musk-mania
  'elon-musk',
  // ignore all manifold groups
  'manifold-user-retention',
  'manifold-6748e065087e',
  'manifold-leagues',
  'manifold-features-25bad7c7792e',
  'manifold-users',
  // generally not helpful for browsing
  'new-years-resolutions-2024',
]

export const GROUP_SLUGS_TO_HIDE_FROM_WELCOME_FLOW = [
  'new-years-resolutions-2024',
  'metamarkets',
  'magaland',
  'metaforecasting',
  'nonpredictive-profits',
  'nonpredictive',
  '-sircryptomind-crypto-stock',
  'selfresolving',
  'fun',
  'unranked',
  'bugs',
  'rationalussy',
  'personal',
  'world-default',
  'shortterm-markets',
  'global-macro',
  'video-games',
  'politics-default', // should follow US Politics instead
  '2024-us-presidential-election', // same
  'elon-musk', // listed as Elon Musk
  'elon-musk-14d9d9498c7e',
  'crypto-prices', // same as crypto,
  'technical-ai-timelines', // same as ai
  'presidential-politics', // same as politics
]

export const EXTERNAL_REDIRECTS = ['/umami']

export const DISCORD_INVITE_LINK = 'https://discord.com/invite/eHQBNBqXuh'
export const DISCORD_BOT_INVITE_LINK =
  'https://discord.com/api/oauth2/authorize?client_id=1074829857537663098&permissions=328565385280&scope=bot%20applications.commands'

export const YES_GRAPH_COLOR = '#11b981'

export const RESERVED_PATHS = [
  '_next',
  'about',
  'ad',
  'add-funds',
  'ads',
  'analytics',
  'api',
  'browse',
  'calibration',
  'card',
  'cards',
  'career',
  'careers',
  'charity',
  'common',
  'contact',
  'contacts',
  'cowp',
  'create',
  'date-docs',
  'dashboard',
  'discord',
  'discord-bot',
  'dream',
  'embed',
  'facebook',
  'find',
  'github',
  'google',
  'group',
  'groups',
  'help',
  'home',
  'jobs',
  'latestposts',
  'leaderboard',
  'leaderboards',
  'league',
  'leagues',
  'link',
  'linkAccount',
  'links',
  'live',
  'login',
  'lootbox',
  'mana-auction',
  'manifest',
  'markets',
  'messages',
  'mtg',
  'news',
  'notifications',
  'og-test',
  'payments',
  'portfolio',
  'privacy',
  'profile',
  'public',
  'questions',
  'referral',
  'referrals',
  'send',
  'server-sitemap',
  'sign-in',
  'sign-in-waiting',
  'sitemap',
  'slack',
  'stats',
  'styles',
  'swipe',
  'team',
  'terms',
  'tournament',
  'tournaments',
  'twitch',
  'twitter',
  'umami',
  'user',
  'users',
  'versus',
  'web',
  'welcome',
]
