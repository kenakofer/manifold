import { PlaygroundState } from '../playground/playground-state'
import { NestedLogger, logIndent, codeUrl } from '../playground/nested-logger'
declare global { interface Window { logger: NestedLogger; pState: PlaygroundState } }
const raw_github_file_url = 'https://raw.githubusercontent.com/manifoldmarkets/manifold/74ab5cae/common/src/util/adjective-animal.ts'
const github_file_url = 'https://github.com/manifoldmarkets/manifold/blob/74ab5cae/common/src/util/adjective-animal.ts'
const adjectives = [
  'unlucky',
  'lucky',
  'risky',
  'bullish',
  'bearish',
  'diversified',
  'speculative',
  'predictive',
  'calculated',
  'fortuitous',
  'serendipitous',
  'prophetic',
  'futuristic',
  'clairvoyant',
  'prescient',
  'auspicious',
  'profitable',
  'farsighted',
  'uncanny',
  'astrological',
  'astute',
  'optimistic',
  'pessimistic',
  'mystical',
  'psychic',
  'hedged',
  'leveraged',
  'shrewd',
  'savvy',
  'canny',
  'prudent',
  'fortunate',
  'enigmatic',
  'volatile',
  'contrarian',
  'adventurous',
  'unerring',
  'intrepid',
  'proactive',
  'opportunistic',
  'tenacious',
  'fierce',
  'exponential',
  'visionary',
  'innovative',
  'disruptive',
  'quirky',
  'stellar',
  'futuristic',
  'cryptic',
  'mystic',
  'galactic',
  'quantum',
  'cunning',
  'zealous',
  'wily',
  'hyperactive',
  'dauntless',
  'supersonic',
  'giga',
  'iridescent',
  'audacious',
  'mantic',
  'unpredictable',
  'calibrated',
  'sage',
  'based',
  'bayesian',
  'degenerate',
  'shy',
  'brilliant',
  'mega',
  'turbo',
  'slick',
  'ultra',
  'apocalyptic',
  'gargantuan',
  'motley',
  'exploitative',
  'explosive',
  'spicy',
]

const animals = [
  'prophets',
  'seers',
  'augurs',
  'oracles',
  'diviners',
  'sibyls',
  'druids',
  'shamans',
  'clairvoyants',
  'predictors',
  'witches',
  'wizards',
  'sorcerers',
  'conjurers',
  'magicians',
  'enchanters',
  'necromancers',
  'warlocks',
  'alchemists',
  'illusionists',
  'charmers',
  'mystics',
  'telepaths',
  'psychics',
  'soothsayers',
  'dreamers',
  'prodigies',
  'jinxes',
  'totems',
  'ogres',
  'griffins',
  'sphinxes',
  'goblins',
  'nymphs',
  'pixies',
  'elves',
  'genies',
  'banshees',
  'centaurs',
  'werewolves',
  'basilisks',
  'chimeras',
  'gargoyles',
  'hydras',
  'krakens',
  'minotaurs',
  'phoenixes',
  'unicorns',
  'yetis',
  'zombies',
  'leviathans',
  'thunderbirds',
  'valkyries',
  'poltergeists',
  'wraiths',
  'leprechauns',
  'sirens',
  'mermaids',
  'medusas',
  'cyclopes',
  'dragons',
  'hobgoblins',
  'wererats',
  'gnomes',
  'banshees',
  'brownies',
  'faeries',
  'gremlins',
  'sprites',
  'cranes',
  'rats',
  'ravens',
  'owls',
  'bulls',
  'bears',
  'golems',
  'neanderthals',
  'foxes',
  'hedgehogs',
  'beasts',
  'giants',
  'dealers',
  'hustlers',
  'misfits',
  'titans',
  'demigods',
  'heros',
  'villains',
]

export const getRandomAdjectiveAnimal = () => {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
  const animal = animals[Math.floor(Math.random() * animals.length)]
  return `${adj}-${animal}`
}

export const genNewAdjectiveAnimal = (ids: Set<string>) => {
  let adjAnimal = getRandomAdjectiveAnimal()
  while (ids.has(adjAnimal)) {
    adjAnimal = getRandomAdjectiveAnimal()
  }
  return adjAnimal
}

export const toLabel = (adjAnimal: string) => {
  return adjAnimal
    .split('-')
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ')
}
