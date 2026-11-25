import type {
  CellarContent,
  LockDef,
  PaperDef,
  Picture,
  ThingDef,
  ToolDef,
  ViewDef,
} from '../../functions/src/goldmaker/shape';

/**
 * File 002, The Gold-Maker: what is in the cellar when a visitor is shut in.
 *
 * The seed script writes this to games/goldmaker/content/cellar. The web app
 * never imports this file: the cellar reaches a browser through Firestore,
 * and only once a visitor has a file of their own.
 *
 * Everything here can be seen by walking in and looking. Nothing here says
 * what happens when a tool is tried on a thing, which setting opens a lock,
 * what is in a box or behind a door, what the captain knows or what is true.
 * All of that is in answers.json, which is not in the repository, and reaches
 * a visitor only as the consequence of something they did.
 */

/** A picture, before the seed has looked up its size. */
export interface PictureSource {
  /** File name in /public/cellar, without width or extension. */
  name: string;
  alt: string;
}

type WithPicture<T> = Omit<T, 'picture'> & { picture: PictureSource };
type MaybePicture<T> = Omit<T, 'picture'> & { picture?: PictureSource };

export type ViewSource = WithPicture<ViewDef>;
export type ThingSource = MaybePicture<ThingDef>;
export type CellarSource = Omit<CellarContent, 'views' | 'things'> & { views: ViewSource[]; things: ThingSource[] };

/** Swaps a picture's name for its real size and the widths on disk. */
export function withSize(source: PictureSource, sizes: Record<string, Omit<Picture, 'alt'>>, problems: string[], where: string): Picture {
  const size = sizes[source.name];
  if (!size) {
    problems.push(`${where}: picture "${source.name}" is not in cellar-images.generated.json. Run: npm run cellar`);
    return { name: source.name, width: 0, height: 0, widths: [], alt: source.alt };
  }
  return { ...size, alt: source.alt };
}

// ------------------------------------------------------------- the views ---

const VIEWS: ViewSource[] = [
  {
    id: 'cellar',
    name: 'The cellar',
    lede: 'One vault, one candle and a furnace that is still warm. Everything is where he left it.',
    picture: {
      name: 'cellar',
      alt: 'A vaulted stone cellar fitted out as a laboratory. On the left wall are a chart, a small wall cupboard, a round mirror and shelves of glass vessels. In front of them stand a lectern with an open book, a writing desk with a small box on it, and an open strongbox on the floor. Against the far wall are a small beehive furnace with a fire in it, a great bellows, a scuttle of charcoal and a great furnace of pale brick with iron doors. Along the right wall runs a workbench with a balance in a glass case, a candle, a stack of paper and a bar of gold on a red cloth, under a rack of iron rods and tongs. A stuffed crocodile hangs from the vault. At the left edge, close to the eye, is the oak and iron of the door.',
    },
  },
  {
    id: 'door',
    name: 'The door',
    lede: 'Behind you. Until this morning it was barred from the inside. It is barred from the outside now.',
    back: 'cellar',
    picture: {
      name: 'door',
      alt: 'The inside of the cellar door: an arched door of oak planks on iron strap hinges, shut. At eye height there is a small iron hatch, and under it a sheet of paper with a red seal. A black cloak hangs on a peg to the left. On the floor lie the two halves of an oak beam, chopped through. A lantern burns in a niche to the right.',
    },
  },
];

// ------------------------------------------------------------ the things ---

const THINGS: ThingSource[] = [
  // ------------------------------------------------- the left-hand wall ---
  {
    id: 'chart',
    view: 'cellar',
    name: 'The chart',
    rect: { x: 6, y: 2, w: 8.2, h: 37 },
    text: 'A sheet of parchment pinned to the stone, older than anything else on the wall. Under a sun, a moon and a still there is a column of seven signs, and beside each sign a line in a careful hand.',
    paper: 'chart',
  },
  {
    id: 'book',
    view: 'cellar',
    name: 'The book on the lectern',
    rect: { x: 6, y: 39.5, w: 14, h: 20.5 },
    text: 'A heavy book, open, on a lectern that was built for it. It is not Rabe’s: the hand is fifty years older than he is. Four of its leaves are worn soft with turning, and one of the four has been cut.',
    paper: 'book',
  },
  {
    id: 'cupboard',
    view: 'cellar',
    name: 'The wall cupboard',
    rect: { x: 15.2, y: 9, w: 8.6, h: 30 },
    text: 'A small oak cupboard, shut. Along its cornice, in the same old hand as the book: SEVEN METALS, SEVEN JARS. A brass bar runs across both doors and carries four rings. Each ring turns, and shows a different colour of enamel as it turns. Above each ring a small bird is cut into the brass, and under the birds, in small letters: TO EACH BIRD ITS COLOUR.',
    picture: {
      name: 'cupboard',
      alt: 'A small oak wall cupboard with two plank doors, shut. A brass bar runs across both doors with four enamelled rings hanging from it, and a small bird is engraved above each ring.',
    },
    lock: 'cupboard',
  },
  {
    id: 'mirror',
    view: 'cellar',
    name: 'The mirror',
    rect: { x: 23.4, y: 13, w: 5, h: 27.5 },
    text: 'A round glass in a brass frame, bulging like an eye. The whole cellar is in it, small and the wrong way about: the bench on the left, the book on the right.',
    picture: {
      name: 'mirror',
      alt: 'A round convex mirror in a brass frame on the stone wall. The whole cellar is reflected in it in miniature: both furnaces, the bench and the lectern.',
    },
  },
  {
    id: 'shelves',
    view: 'cellar',
    name: 'The shelves',
    rect: { x: 28.5, y: 20, w: 9, h: 38 },
    text: 'Three shelves of glass: stills, flasks and receivers, most of them clean. Among them stands a wooden bowl of dark stones, each tied in a loop of cord. A few nails hang from one of the stones. Beside the bowl a tin stands open, with a few yellow crumbs of brimstone left in the bottom of it.',
    picture: {
      name: 'lodestones',
      alt: 'A wooden bowl on a shelf among glass flasks, holding half a dozen rough dark stones, each tied round with cord. Iron nails cling to one of them. Beside the bowl is an open tin, empty but for a few yellow crumbs.',
    },
  },
  {
    id: 'box',
    view: 'cellar',
    name: 'The box on the desk',
    rect: { x: 22.6, y: 46.5, w: 5, h: 8 },
    text: 'A walnut box on the writing desk, the size of a large book. It has an iron lock, and it is locked. The lid is smudged with grey finger-marks: somebody has opened it with ash on his hands.',
    picture: {
      name: 'box',
      alt: 'A plain walnut box with an iron lock plate, shut, on a writing desk beside an inkwell and a quill. There are grey smudged finger-marks on its lid.',
    },
  },
  {
    id: 'strongbox',
    view: 'cellar',
    name: 'The strongbox',
    rect: { x: 15.5, y: 65, w: 13, h: 34 },
    text: 'An iron-bound chest, standing open as the captain found it. Its trays are cut with round hollows for coin, and every hollow is empty. In the bottom lie a thin ledger and a scorched wooden mould with a spatter of grey metal on its lip. The mould is the length and the breadth of the bar on the bench.',
    picture: {
      name: 'strongbox',
      alt: 'An iron-bound chest with its lid thrown back. Two wooden trays inside are cut with rows of round hollows, all empty. In the bottom lie a scorched wooden mould for a bar, with grey metal spattered on its lip, and a thin ledger bound in parchment.',
    },
    paper: 'ledger',
  },

  // ---------------------------------------------------------- the far wall ---
  {
    id: 'athanor',
    view: 'cellar',
    name: 'The small furnace',
    rect: { x: 37, y: 33, w: 9.3, h: 37 },
    text: 'A furnace of brick and clay no taller than your chest, with a fire still alive behind its grate. This is the one that was warm in the morning. At its foot is a little iron door for the ash, cast with a raven. The handle of that door is worn bright, and grey with ash where a hand has gone to it often.',
    picture: {
      name: 'ash-door',
      alt: 'The foot of the small furnace. A little cast-iron door with a raven on it stands ajar, showing a bed of pale ash. Its handle is smeared with ash. Above it a fire burns behind an iron grate.',
    },
  },
  {
    id: 'bellows',
    view: 'cellar',
    name: 'The bellows',
    rect: { x: 46.8, y: 38, w: 9.4, h: 22 },
    text: 'A great bellows on a frame, its nozzle laid toward the big furnace. The leather is cracked along every fold, and a spider has closed the nozzle.',
  },
  {
    id: 'coal',
    view: 'cellar',
    name: 'The charcoal',
    rect: { x: 49.8, y: 59, w: 7, h: 13 },
    text: 'A scuttle of charcoal, heaped full. The small furnace eats a handful in a night.',
  },
  {
    id: 'furnace',
    view: 'cellar',
    name: 'The great furnace',
    rect: { x: 57.5, y: 21, w: 14.5, h: 49 },
    text: 'A furnace big enough to melt a bell, built of pale brick, with a pair of iron doors. There is no soot on the brick, no ash on the hearth and no black on the arch. Where the two doors meet there is an iron plate with four small dials, each numbered from I to VII. Over each dial is a bird: a raven, a swan, an eagle and a phoenix. Under them, cut into the iron: FEED EACH BIRD FROM ITS JAR.',
    picture: {
      name: 'furnace',
      alt: 'The great furnace: pale, clean brick and a tall pair of studded iron doors. On a plate where the doors meet are four cast birds in a row, a raven, a swan, an eagle and a phoenix, and under each bird a small brass dial.',
    },
    lock: 'furnace',
  },
  {
    id: 'crocodile',
    view: 'cellar',
    name: 'The crocodile',
    rect: { x: 37, y: 8, w: 30.5, h: 14 },
    text: 'A crocodile, stuffed, on two chains. Every gold-maker hangs one. It impresses the people who pay.',
    picture: { name: 'crocodile', alt: 'A stuffed crocodile hanging from the brick vault on two chains.' },
  },

  // ------------------------------------------------------ the right-hand wall ---
  {
    id: 'rods',
    view: 'cellar',
    name: 'The rods',
    rect: { x: 80.3, y: 19, w: 4.7, h: 27 },
    text: 'Four iron rods for stirring a crucible hang in a row. Three of them end in plain iron. The foot of the fourth is stopped with black wax, and there are marks of ash on its shaft where it has been handled.',
    picture: {
      name: 'rods',
      alt: 'Four long iron rods hanging from a wooden rack, each with a ball at the top. The foot of the fourth rod, on the right, ends in a plug of black wax. Iron tongs hang beside them.',
    },
  },
  {
    id: 'rack',
    view: 'cellar',
    name: 'The tongs',
    rect: { x: 86.5, y: 17.5, w: 11.2, h: 24 },
    text: 'Four pairs of iron tongs, for lifting what is too hot to hold and for bending what will not bend by hand.',
  },
  {
    id: 'stack',
    view: 'cellar',
    name: 'The paper',
    rect: { x: 74, y: 57.5, w: 7, h: 7.5 },
    text: 'A stack of clean paper. Rabe wrote very little down where anyone could find it.',
  },
  {
    id: 'candle',
    view: 'cellar',
    name: 'The candle',
    rect: { x: 81.2, y: 47.5, w: 4, h: 18 },
    text: 'One candle, a third burned. It is the only naked flame in the cellar.',
  },
  {
    id: 'balance',
    view: 'cellar',
    name: 'The balance',
    rect: { x: 85.2, y: 41.5, w: 11.3, h: 24 },
    text: 'A fine brass balance in a glass case. The pans are as bright as the day they were made. A man who weighs for his living wears his pans dull.',
  },
  {
    id: 'bar',
    view: 'cellar',
    name: 'The bar',
    rect: { x: 81.3, y: 66, w: 12.2, h: 9.5 },
    text: 'A bar of gold the length of your hand, on a red cloth, where the Emperor was meant to find it. It has no stamp and no maker’s mark. It is what a year of the Emperor’s money bought.',
    picture: {
      name: 'bar',
      alt: 'A bar of gold the length of a hand, lying on a folded red velvet cloth on the workbench. A candle and the glass case of the balance stand behind it.',
    },
  },

  // ---------------------------------------------------------------- the way back ---
  {
    id: 'way-door',
    view: 'cellar',
    name: 'The door, behind you',
    rect: { x: 0, y: 8, w: 6, h: 88 },
    text: 'The door you came in by. It was shut behind you, and the bar went down after it.',
    to: 'door',
    toLabel: 'Turn to the door',
  },

  // ------------------------------------------------------------------ at the door ---
  {
    id: 'hatch',
    view: 'door',
    name: 'The hatch',
    rect: { x: 45.5, y: 29.5, w: 8.5, h: 12 },
    text: 'A hatch the size of a hand, with an iron shutter. The captain of the guard is on the other side of it. He will tell you what he can, and he writes down every question you ask.',
    talk: true,
  },
  {
    id: 'order',
    view: 'door',
    name: 'The order',
    rect: { x: 46, y: 42, w: 7.5, h: 13.5 },
    text: 'A sheet nailed to the inside of the door, under the Emperor’s seal.',
    paper: 'order',
  },
  {
    id: 'cloak',
    view: 'door',
    name: 'The cloak',
    rect: { x: 21.5, y: 20, w: 11.5, h: 48 },
    text: 'A black wool cloak on a peg. It is midsummer. He did not need it where he was going.',
  },
  {
    id: 'beam',
    view: 'door',
    name: 'The bar of the door',
    rect: { x: 26, y: 75, w: 50, h: 15 },
    text: 'The oak bar that held this door from the inside, in two pieces. The captain’s axe went through it at first light.',
  },
  {
    id: 'lantern',
    view: 'door',
    name: 'The lantern',
    rect: { x: 70.5, y: 25, w: 7.5, h: 21 },
    text: 'A tin lantern in a niche. The guard left it for you. It will last the night.',
  },
  {
    id: 'threshold',
    view: 'door',
    name: 'The door',
    rect: { x: 37.5, y: 56, w: 25, h: 21 },
    text: 'Oak, four fingers thick, on iron hinges. On the other side a new bar has been dropped into the brackets.',
  },
];

// ------------------------------------------------- in a visitor's hands ---

const TOOLS: ToolDef[] = [
  { id: 'hands', name: 'Your hands', text: 'Lift it, shake it, knock on it, turn it over.' },
  {
    id: 'touchstone',
    name: 'Your touchstone',
    text: 'The black stone of your trade, with its needles for fine gold, ducat gold, crown gold and Rhenish gold, and a phial of strong water. Every assayer knows the rule. Gold made new by art has never seen a mint, so it must touch as fine gold. Gold that touches as ducat gold has been a ducat.',
  },
];

// ---------------------------------------------------------- what can be read ---

const PAPERS: PaperDef[] = [
  {
    id: 'order',
    kind: 'text',
    title: 'By order of His Imperial Majesty',
    body: [
      'Kaspar Rabe, gold-maker, barred this door from the inside on the eve of Saint John. In the morning the bar had to be cut. The small furnace was warm, a bar of gold lay on the bench, and the man was gone.',
      'The Assay-Master is to be shut in the cellar with everything as it was found.',
      'Let the Assay-Master learn three things. What the bar is. Where the gold of his earlier shows came from. Where the man has gone.',
      'A man who leaves a barred room leaves by something. Let the Assay-Master find it, and use it if he can.',
      'The door opens for an answer and for nothing else.',
    ].join('\n\n'),
    note: 'Given at the Castle of Prague, the 24th of June 1593',
  },
  {
    id: 'chart',
    kind: 'chart',
    title: 'Of the seven metals',
    head: 'Their planets, their signs, and how each is known.',
    rows: [
      { metal: 'Gold', planet: 'The Sun', sign: 'sun', known: 'Fears nothing: not the fire, not the water, not the strong water.' },
      { metal: 'Silver', planet: 'The Moon', sign: 'moon', known: 'Blackens in the smoke of brimstone. It answers to nothing else here.' },
      { metal: 'Quicksilver', planet: 'Mercury', sign: 'mercury', known: 'Runs like water and wets nothing.' },
      { metal: 'Copper', planet: 'Venus', sign: 'venus', known: 'Turns the flame green.' },
      { metal: 'Iron', planet: 'Mars', sign: 'mars', known: 'Leaps to the lodestone.' },
      { metal: 'Tin', planet: 'Jupiter', sign: 'jupiter', known: 'Cries when it is bent.' },
      { metal: 'Lead', planet: 'Saturn', sign: 'saturn', known: 'Writes grey on paper. The heaviest of the base metals.' },
    ],
    note: 'In the hand of the man who built the cellar',
  },
  {
    id: 'book',
    kind: 'book',
    title: 'The Four Birds',
    head: 'How the Work goes, and how the great furnace is fed.',
    leaves: [
      {
        bird: 'raven',
        name: 'The Raven',
        colour: 'Black',
        verse: 'The Raven is first, and black. He eats the heaviest of the base metals, the one that writes.',
      },
      {
        bird: 'swan',
        name: 'The Swan',
        colour: 'White',
        verse: 'The Swan is second, and white. She eats the one that answers to nothing here but brimstone.',
      },
      { bird: 'eagle', name: 'The Eagle', colour: 'Gold', verse: 'The Eagle is third, and gold. He eats the one that runs.' },
      {
        bird: 'phoenix',
        name: 'The Phoenix',
        colour: 'Red',
        gone: 'The Phoenix is last, and red. The rest of her verse has been cut out of the leaf with a knife, and the cut is new.',
      },
    ],
    colophon:
      'Seven metals stand in seven jars, and the jars carry numbers only. Let him who would pass the furnace prove each jar, and give each bird the number of the jar that holds its meat.',
    note: 'The book of Master Zacharias, who built this cellar',
  },
  {
    id: 'ledger',
    kind: 'text',
    title: 'The ledger from the strongbox',
    body: [
      'Advanced to Kaspar Rabe out of His Majesty’s chamber, in gold ducats, to be multiplied by his art.',
      'Michaelmas 1592: 100.\nChristmas 1592: 150.\nCandlemas 1593: 200.\nEaster 1593: 250.',
      'In all: 700.',
      'Returned by the said Rabe, as gold made by his art before witnesses at three shows: the weight of 61 ducats.',
    ].join('\n\n'),
    note: 'The hand of the clerk of the chamber. Rabe has signed against every line.',
  },
];

// ------------------------------------------------------------------- the locks ---

const LOCKS: LockDef[] = [
  {
    id: 'cupboard',
    inscription: 'TO EACH BIRD ITS COLOUR',
    wheels: [
      { label: 'The ring under the swan', bird: 'swan' },
      { label: 'The ring under the phoenix', bird: 'phoenix' },
      { label: 'The ring under the raven', bird: 'raven' },
      { label: 'The ring under the eagle', bird: 'eagle' },
    ],
    faces: [
      { id: 'black', label: 'Black' },
      { id: 'white', label: 'White' },
      { id: 'gold', label: 'Gold' },
      { id: 'red', label: 'Red' },
      { id: 'green', label: 'Green' },
      { id: 'blue', label: 'Blue' },
    ],
  },
  {
    id: 'furnace',
    inscription: 'FEED EACH BIRD FROM ITS JAR',
    wheels: [
      { label: 'The dial under the raven', bird: 'raven' },
      { label: 'The dial under the swan', bird: 'swan' },
      { label: 'The dial under the eagle', bird: 'eagle' },
      { label: 'The dial under the phoenix', bird: 'phoenix' },
    ],
    faces: [
      { id: '1', label: 'I' },
      { id: '2', label: 'II' },
      { id: '3', label: 'III' },
      { id: '4', label: 'IV' },
      { id: '5', label: 'V' },
      { id: '6', label: 'VI' },
      { id: '7', label: 'VII' },
    ],
  },
];

export const CELLAR: CellarSource = {
  order: {
    title: 'By order of His Imperial Majesty',
    lines: [
      'Kaspar Rabe, gold-maker, barred this door from the inside on the eve of Saint John. In the morning the bar had to be cut. The small furnace was warm, a bar of gold lay on the bench, and the man was gone.',
      'You are to be shut in the cellar with everything as it was found.',
      'Learn three things. What the bar is. Where the gold of his earlier shows came from. Where the man has gone.',
      'A man who leaves a barred room leaves by something. Find it, and use it if you can.',
    ],
    foot: 'The door opens for an answer and for nothing else.',
  },
  start: 'cellar',
  views: VIEWS,
  things: THINGS,
  tools: TOOLS,
  papers: PAPERS,
  locks: LOCKS,
};
