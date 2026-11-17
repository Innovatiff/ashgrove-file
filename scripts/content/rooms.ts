import type { RoomId } from '../../functions/src/config/game';
import type { RoomContent, Suspect, VerdictContent, Witness } from './types';

/**
 * What a detective is shown inside each room, before it is solved.
 *
 * The seed script writes these to rooms/{roomId}. The web app never imports
 * this file: a room's documents reach the browser only through Firestore, and
 * only once the rules say the room is open.
 *
 * Nothing in here may give a code away. Codes, hints, the evidence a solved
 * room gives up, and the name of the one who did it live in answers.json,
 * which is not in the repository.
 *
 * Everything here is true as far as it goes. The papers do not lie. One
 * person's statement does, once, and the rooms give a detective what they
 * need to catch it.
 */

type WithImage<T> = Omit<T, 'src' | 'width' | 'height'> & {
  /** File name in /public/images, without the extension. */
  image: string;
};

type SceneSource = WithImage<Omit<NonNullable<RoomContent['scene']>, 'treatment'>>;
export type WitnessSource = WithImage<Witness>;
export type SuspectSource = WithImage<Suspect>;

export type RoomSource = Omit<RoomContent, 'scene' | 'witness'> & { scene?: SceneSource; witness?: WitnessSource };
export type VerdictSource = Omit<VerdictContent, 'suspects'> & { suspects: SuspectSource[] };

// ------------------------------------------------------------- the five ---
// Each is met in the room their exhibit points at, and all five hang on the
// wall at the accusation. One statement each, word for word in both places.

const CRANE: SuspectSource = {
  id: 'crane',
  image: 'suspect-crane',
  alt: 'A man in his sixties in a tweed suit and wire spectacles, a doctor’s bag held on his knee. He is almost smiling. Half his face is in shadow.',
  caption: 'Suspect 01 — The Doctor',
  name: 'Dr Alban Crane',
  role: 'Physician to the Hall. Deputy Coroner for the district.',
  reference: 'II-S',
  statement: [
    'I was at Fen End Farm from ten until twenty to one. Nurse Garth has it in her book. From one I sat with Agnes Holt at Marsh Row until she died at twenty past three, with the Vicar across the bed.',
    'They fetched me to the Hall at seven. The door was locked, the clock said 3.17, and the lamp was burning in his window. My father signed five of these and I have signed three.',
    'I did not look in the cup. Nobody in Ashgrove would have thanked me.',
  ],
};

const IRIS: SuspectSource = {
  id: 'iris',
  image: 'suspect-iris',
  alt: 'A young woman in a knitted cardigan, writing in a small notebook. Her fingers are stained with ink. She is looking up from the page, and she does not look pleased to be watched.',
  caption: 'Suspect 02 — The Assistant',
  name: 'Miss Iris Calloway',
  role: 'The Professor’s assistant. Keeper of his herbarium.',
  reference: 'III-S',
  statement: [
    'I shut the herbarium at six on Sunday. The cabinet was locked and its key was on the board in the passage, where it lives. I gave it to nobody.',
    'At nine I brewed his pot from his own caddy, the one on the herbarium bench. Nobody else in the house will drink that tea. I carried it up. He was well.',
    'At ten I walked his letters down to the marsh lodge. Mrs Garrick took them from my hand at a quarter past. Then I typed in the library until midnight.',
    'On Monday I counted the leaves. I have counted them every hour since.',
  ],
};

const MARGOT: SuspectSource = {
  id: 'margot',
  image: 'suspect-margot',
  alt: 'A woman in her fifties in a dark dress and a double string of pearls. Her face is composed and gives nothing away. One side of it is in shadow.',
  caption: 'Suspect 03 — The Widow',
  name: 'Mrs Margot Varn',
  role: 'The Professor’s wife. The Hall is hers.',
  reference: 'IV-S',
  statement: [
    'My husband was churchwarden. He kept the parish’s accounts and his own counsel, and he wrote in cipher even to himself.',
    'The Vicar took tea with me at four on Sunday. He had not called in three years. He excused himself for a quarter of an hour to wash his hands. The cloakroom is in the passage, by the key board.',
    'I went up at ten. Ada brought my milk and sat with me. I did not hear my husband die. I have asked myself since why I slept so well.',
  ],
};

const PIKE: SuspectSource = {
  id: 'pike',
  image: 'suspect-pike',
  alt: 'An elderly clergyman in a clerical collar and a dark coat, holding a closed ledger flat against his chest with one hand. His mouth is set. Half his face is in shadow.',
  caption: 'Suspect 04 — The Vicar',
  name: 'The Reverend Theodore Pike',
  role: 'Vicar of Ashgrove since 1921. Keeper of the register.',
  reference: 'V-S',
  statement: [
    'The note in my margins records a call in the night. It does not record a ghost. Ashgrove prefers the ghost.',
    'On Sunday night I was alone at the vicarage with my sermon until the Holt girl knocked at half past midnight. I went at once. Agnes Holt died at twenty past three, with Dr Crane across the bed.',
    'At the hour the Professor died I was holding a dying woman’s hand. Ask the doctor.',
    'Three leaves are gone from my register. The Professor had the book in his study for a week. I draw no conclusion. You may.',
  ],
};

const TOBIAS: SuspectSource = {
  id: 'tobias',
  image: 'suspect-tobias',
  alt: 'A weathered man in his forties in a flat cap and an oilskin coat, gripping the front of the coat with both hands. His hands are black with lamp soot. He is looking away to one side.',
  caption: 'Suspect 05 — The Lampman',
  name: 'Tobias Fenn',
  role: 'Groundskeeper at the Hall. Keeper of the marsh lamps.',
  reference: 'VI-S',
  statement: [
    'I keep thirteen lamps. Twelve stay where I hang them. The seventh is sent for, and I do not ask whose hand lifts it. My father did not ask. His father did not.',
    'On Monday it was not on its hook and it was not at Marsh Row. I looked up at the tower and I saw where it was. I went home and I said nothing.',
    'Who takes a lampman’s word?',
  ],
};

/** A suspect, as the witness of one room: the same person, without the id an accusation uses. */
function witness(suspect: SuspectSource): WitnessSource {
  const copy: Partial<SuspectSource> = { ...suspect };
  delete copy.id;
  return copy as WitnessSource;
}

// ------------------------------------------------------------ the rooms ---

export const ROOMS: Partial<Record<RoomId, RoomSource>> = {
  study: {
    title: 'The Study',
    status: 'open',
    lede: [
      'The tower study, as the constable left it. Nothing has been moved since.',
      'Three papers. One clock. They do not agree.',
    ],
    scene: {
      image: 'study-scene',
      alt: 'The tower study as it was found. A wooden desk covered in papers. A teacup on its side in spilled tea, with a short candle lying in the tea. An oil lamp burning on the windowsill. An empty chair pushed back from the desk.',
      caption: 'Exhibit 03 — The tower study, as found',
      // The cup on its side, in the spilled tea.
      anchor: { x: 33, y: 62 },
    },
    documents: [
      {
        id: 'maid-statement',
        label: 'Maid’s statement',
        reference: 'I-A',
        body: 'I lit the Professor’s new six-inch candle at ten o’clock, as always.',
      },
      {
        id: 'candle-box-label',
        label: 'Candle box label',
        reference: 'I-B',
        body: 'Ashgrove Chandlery — burns one inch per hour.',
      },
      {
        id: 'constable-note',
        label: 'Constable’s note',
        reference: 'I-C',
        body: 'Candle found tipped into the spilled tea, five inches remaining. Mantel clock stopped at 03:17.',
      },
    ],
    figures: [
      { id: 'teacup', caption: 'Fig. I-1 — The cup, on its side' },
      { id: 'candle', caption: 'Fig. I-2 — The candle, as found' },
    ],
    prompt: 'THE CLOCK SAYS 03:17. WHEN DID ELIAS VARN ACTUALLY DIE? (HH:MM)',
    answerFormat: 'time',
    redaction: { label: 'Time of death', evidence: 'study-time-of-death' },
    next: { label: 'Room II — The Coroner' },
  },

  coroner: {
    title: 'The Coroner',
    status: 'open',
    lede: [
      'One certificate closed this file. It is typed, stamped and signed.',
      'Read what the doctor saw. Then read what he wrote.',
    ],
    scene: {
      image: 'coroner-report',
      alt: 'A typed certificate under a royal crest, on worn paper that has been folded once. A fountain pen lies beside it. There is a signature in ink at the foot of the page.',
      caption: 'Exhibit 05 — The certificate that sealed the file',
      // The signature.
      anchor: { x: 62, y: 86 },
      side: 'left',
    },
    witness: witness(CRANE),
    documents: [
      {
        id: 'certificate',
        label: 'Certificate of the Deputy Coroner',
        reference: 'II-A',
        span: 2,
        tall: true,
        body: [
          'District of Ashgrove.',
          'Deceased: Elias Varn, Professor of Botany, aged 68.',
          'Found: 7 a.m., Monday 14 November 1949. Tower study, Ashgrove Hall. Door locked.',
          'Seen by me at 7.40 a.m. No wound. No sign of a struggle. The face congested. Vomit on the desk and on the floor. Mantel clock stopped at 3.17.',
          'Cause of death: syncope. Natural causes.',
          'Time of death: 3.17 a.m., by the clock.',
          'Remarks: the ninth such death in this parish since 1871. As with the eight before it, no inquest is required.',
        ].join('\n\n'),
        note: 'Signed A. Crane, M.B.',
      },
      {
        id: 'maid-second-statement',
        label: 'Housemaid’s statement, continued',
        reference: 'II-B',
        body: [
          'At ten, when I lit his candle, the Professor was grey. He said his supper had turned on him and he had been sick.',
          'He said the candle had a yellow ring round it. He held his own wrist and said his heart was keeping bad time, slow and dropping beats.',
          'He would not have the doctor sent for. He said it would pass.',
        ].join('\n\n'),
        note: 'Ada Pell, housemaid at the Hall',
      },
      {
        id: 'nurse-casebook',
        label: 'District nurse’s casebook',
        reference: 'II-C',
        body: [
          'Sun. 13 Nov. Fen End Farm, six miles by the road. Mrs Dunn, first child.',
          'Dr Crane sent for at half past nine. With me from ten. Boy born 12.25 a.m.',
          'Doctor left at 12.40 for Marsh Row, where Agnes Holt was going.',
        ].join('\n\n'),
        note: 'Nurse Garth',
      },
      {
        id: 'poison-card',
        label: 'Six poisons of the English hedge',
        reference: 'II-D',
        span: 3,
        table: {
          columns: ['Poison', 'First signs', 'The pulse', 'The eyes', 'Death'],
          rows: [
            { cells: ['Aconite (monkshood)', 'Tingling and numbness of the mouth', 'Weak, irregular', 'Sight blurred', 'In 1 to 6 hours'] },
            { cells: ['Atropine (deadly nightshade)', 'Dry mouth, flushed skin, raving', 'Very fast', 'Pupils wide, light hurts', 'Seldom, after many hours'] },
            { cells: ['Coniine (hemlock)', 'Weakness creeping up from the feet', 'Fast', 'Lids droop', 'In 1 to 3 hours, the mind clear'] },
            { cells: ['Digitalis (foxglove)', 'Sickness and vomiting', 'Slow, dropping beats', 'A yellow ring round every flame', 'In 2 to 3 hours, the heart stops'] },
            { cells: ['Taxine (yew)', 'None. Sudden collapse', 'Slow', 'Nothing', 'Within the hour'] },
            { cells: ['Colchicine (meadow saffron)', 'Burning throat, purging', 'Fast, thready', 'Nothing', 'After 2 or 3 days'] },
          ],
        },
        note: 'The Professor’s own lecture card, found in his desk',
      },
    ],
    prompt: 'THE CERTIFICATE SAYS SYNCOPE. WHAT STOPPED HIS HEART? NAME THE POISON. ONE WORD.',
    answerFormat: 'text',
    redaction: { label: 'Cause of death', evidence: 'coroner-cause' },
    next: { label: 'Room III — The Herbarium' },
  },

  herbarium: {
    title: 'The Herbarium',
    status: 'open',
    lede: [
      'The poison grew in a drawer. The Professor pressed it himself, two summers ago.',
      'He counted its leaves every Sunday at noon. Count them again.',
    ],
    scene: {
      image: 'foxglove',
      alt: 'A pressed foxglove on yellowed herbarium paper, held down with strips of tape. A tall stem of dried bells. Three large lower leaves are left on it. Faded ink notes run down the right-hand margin.',
      caption: 'Exhibit 06 — Cabinet II, sheet 14: foxglove',
      // The lowest leaf.
      anchor: { x: 52, y: 79 },
    },
    witness: witness(IRIS),
    documents: [
      {
        id: 'sheet-margin',
        label: 'In the margin of the sheet',
        reference: 'III-A',
        body: ['Digitalis purpurea L.', 'Cab. II, sheet 14.', 'Coll. E.V., churchyard wall, Ashgrove, vii.1947.', 'Fol. inf.: xj.', 'Pond. fol. sicc.: gr. v.'].join('\n'),
        note: 'The Professor’s hand',
      },
      {
        id: 'hand-key',
        label: 'A key to his hand',
        reference: 'III-B',
        body: [
          'Fol. inf.: the lower leaves, counted.',
          'Pond. fol. sicc.: the weight of one leaf, dried.',
          'gr.: grains. scr.: scruples.',
          'He writes his numbers the apothecary’s way: small Roman figures, the last i drawn as a j.',
        ].join('\n'),
        note: 'Written out by Miss Calloway for the constable',
      },
      {
        id: 'apothecaries-weight',
        label: 'Apothecaries’ weight',
        reference: 'III-C',
        body: ['20 grains make 1 scruple.', '3 scruples make 1 drachm.', '8 drachms make 1 ounce.'].join('\n'),
        note: 'Card on the herbarium wall',
      },
      {
        id: 'door-card',
        label: 'Pinned inside the cabinet door',
        reference: 'III-D',
        body: 'Digitalis leaf. As physic, one grain. As poison, two scruples in one strong infusion. No more is needed. No less will do.',
        note: 'The Professor’s hand',
      },
      {
        id: 'day-book',
        label: 'Day book of the herbarium',
        reference: 'III-E',
        span: 2,
        body: [
          'Sun. 13 Nov.\n12.00 The Professor’s count. Sheet 14: xj. All sheets entire. Cabinet locked. Key to the board in the passage.\nNo consultations. Sunday.\n18.00 Room shut.',
          'Mon. 14 Nov.\n08.40 Cabinet opened for P.C. Hollis. Sheet 14 is short: see his drawing.\nThe Professor’s caddy is on the bench with its lid unseated. I always seat the lid.',
        ].join('\n\n'),
        note: 'Miss Calloway’s hand',
      },
    ],
    figures: [
      {
        id: 'foxglove-sheet',
        caption: 'Fig. III-1 — Sheet 14, as P.C. Hollis drew it on the 14th',
        alt: 'Line drawing of the pressed foxglove. A stem of bells. Three lower leaves are still on the stem. Eight short stalks have been cut clean where leaves were taken.',
      },
    ],
    prompt: 'HOW MUCH LEAF LEFT THE SHEET FOR THE POT? ANSWER IN GRAINS.',
    answerFormat: 'number',
    redaction: { label: 'In the pot', evidence: 'herbarium-dose' },
    next: { label: 'Room IV — The Journal' },
  },

  journal: {
    title: 'The Journal',
    status: 'open',
    lede: [
      'His field notebook. Plants at the front. At the back, something he did not want read.',
      'A leaf has been cut out. The page after it is in cipher.',
    ],
    scene: {
      image: 'journal',
      alt: 'A leather field notebook lying open with a pencil across it. The left page is close handwriting. The right page is rows of capital letters in short groups, with no words in them. A strap with a stud holds the cover.',
      caption: 'Exhibit 07 — The Professor’s notebook, last written page',
      // The page of cipher.
      anchor: { x: 68, y: 52 },
      side: 'left',
    },
    witness: witness(MARGOT),
    documents: [
      {
        id: 'flyleaf',
        label: 'Inside the cover',
        reference: 'IV-A',
        body: [
          'E. Varn. Field notes, Ashgrove.',
          'What is private is set in Gronsfeld’s cipher. Key: the hour they are all afraid of. Three figures.',
          'Write the figures over the letters, again and again, beginning afresh at every line. Set each letter back along the alphabet by the figure above it.',
          'So with a key of 1 2 3, B D F reads A B C.',
        ].join('\n\n'),
        note: 'The Professor’s hand',
      },
      {
        id: 'last-page',
        label: 'The last page',
        reference: 'IV-B',
        span: 2,
        cipher: [
          'WIYHF SHHHF JLVBU GOVFM VFL',
          'KFJRN LVBAK BSIQH VUAHO DLUOW ILEPV NT',
          'LGAKF FGPUR UIDMH QDLLH VWPAK FJROZ WBIOF VQUOH GVXSA HFUWI',
          'FPBQU AKFSH HHFJL V',
        ],
        note: 'Four lines, in pencil',
      },
      {
        id: 'notebook-note',
        label: 'Constable’s note',
        reference: 'IV-C',
        body: 'One leaf has been cut from the notebook with a blade, close to the spine, before the last page. The cut is fresh. The cipher is in the Professor’s hand throughout.',
        note: 'P.C. Hollis',
      },
      {
        id: 'maid-third-statement',
        label: 'Housemaid’s statement, continued',
        reference: 'IV-D',
        span: 2,
        body: [
          'When I lit his candle at ten he told me to leave the garden door of the tower on the latch. He expected a caller, and it was no business of mine who.',
          'I took Madam her milk at a quarter past ten and sat with her until she slept. That was gone eleven. You cannot hear the tower from Madam’s room.',
        ].join('\n\n'),
        note: 'Ada Pell',
      },
    ],
    figures: [
      {
        id: 'alphabet',
        caption: 'Fig. IV-1 — The alphabet, for counting back',
        alt: 'The alphabet from A to Z on a ruled strip, in two rows, with an arrow pointing back toward A. Before A comes Z.',
      },
    ],
    prompt: 'DECODE THE LAST LINE OF THE LAST PAGE. WHAT DID HE MEAN TO COUNT? ONE WORD.',
    answerFormat: 'text',
    redaction: { label: 'To be counted', evidence: 'journal-last-page' },
    next: { label: 'Room V — The Register' },
  },

  register: {
    title: 'The Register',
    status: 'open',
    lede: [
      'The parish keeps its dead in one book. Three leaves are gone from it.',
      'The index at the back was not torn. Whoever tore the leaves forgot the index.',
    ],
    scene: {
      image: 'parish-register',
      alt: 'A heavy parish register lying open. Ruled columns of handwritten entries fill both pages. Along the outer edge of the left page, three ragged stubs show where leaves have been torn out.',
      caption: 'Exhibit 08 — Register of burials, parish of Ashgrove',
      // The stubs.
      anchor: { x: 13, y: 60 },
    },
    witness: witness(PIKE),
    documents: [
      {
        id: 'register-state',
        label: 'The register, as it stands',
        reference: 'V-A',
        body: [
          'Leaves 40, 42 and 43 have been torn out by hand. The stubs are ragged. Nothing else in the book is disturbed.',
          'The index pasted inside the back cover is whole.',
        ].join('\n\n'),
        note: 'P.C. Hollis',
      },
      {
        id: 'clock-fund',
        label: 'The Clock Fund',
        reference: 'V-B',
        span: 2,
        body: [
          'Receipts.\n1945: legacy, Miss A. Wray, £100.\n1946: nil.\n1947: nil.\n1948: nil.\n1949: nil.\nIn hand: £100.',
          'In pencil, E.V.: The church clock stopped at 3.17 in the storm of 1871. It has not been touched since.',
        ].join('\n\n'),
        note: 'The Vicar’s ledger, as shown to the churchwardens',
      },
      {
        id: 'burial-index',
        label: 'Index of burials',
        reference: 'V-C',
        span: 3,
        table: {
          columns: ['Leaf', 'Name', 'Abode', 'Year', 'In the margin'],
          rows: [
            { cells: ['3', 'Thomas Wray', 'Marsh Row', '1871', 'Sent for in the night'] },
            { cells: ['9', 'Hannah Sykes', 'The Staithe', '1883', 'Sent for in the night'] },
            { cells: ['15', 'Josiah Bell', 'Marsh Row', '1896', 'Sent for in the night'] },
            { cells: ['22', 'Ruth Garrick', 'Fen Cottages', '1911', 'Sent for in the night'] },
            { cells: ['29', 'Amos Reed', 'The Staithe', '1924', 'Sent for in the night'] },
            { cells: ['39', 'Ada Wray', 'Church Lane', '1945', '—'] },
            { cells: ['40', 'Hester Bell', 'Marsh Row', '1946', 'Sent for in the night'] },
            { cells: ['41', 'John Sykes', 'Church Lane', '1946', '—'] },
            { cells: ['42', 'Walter Reed', 'The Staithe', '1947', 'Sent for in the night'] },
            { cells: ['43', 'Mabel Garrick', 'Fen Cottages', '1948', 'Sent for in the night'] },
            { cells: ['44', 'Edith Wray', 'Church Lane', '1949', '—'] },
          ],
        },
        note: 'In three vicars’ hands. Eight names carry the note. Ashgrove counts the Professor as the ninth.',
      },
      {
        id: 'wills-proved',
        label: 'Wills proved',
        reference: 'V-D',
        span: 3,
        table: {
          columns: ['Name', 'Died', 'Left', 'To'],
          rows: [
            { cells: ['Ada Wray', '1945', '£100', 'The Vicar and Churchwardens, to mend the church clock'] },
            { cells: ['Hester Bell', '1946', '£400', 'The Vicar and Churchwardens, to mend the church clock'] },
            { cells: ['John Sykes', '1946', '£250', 'The county lifeboat'] },
            { cells: ['Walter Reed', '1947', '£350', 'The Vicar and Churchwardens, to mend the church clock'] },
            { cells: ['Mabel Garrick', '1948', '£400', 'The Vicar and Churchwardens, to mend the church clock'] },
            { cells: ['Edith Wray', '1949', '£50', 'The church, for flowers'] },
          ],
        },
        note: 'Cuttings from the Gazette, pinned together by E.V.',
      },
    ],
    prompt: 'HOW MANY POUNDS WERE LEFT TO MEND THE CHURCH CLOCK AND NEVER REACHED THE LEDGER? FIGURES ONLY.',
    answerFormat: 'number',
    redaction: { label: 'Missing from the Clock Fund', evidence: 'register-clock-fund' },
    next: { label: 'Room VI — The Marsh' },
  },

  marsh: {
    title: 'The Marsh',
    status: 'open',
    lede: [
      'Thirteen lamps cross the marsh, from the church to the Hall. Twelve are bolted down.',
      'On Sunday night the seventh was sent for. Three people watched where it went.',
    ],
    scene: {
      image: 'marsh-lamps',
      alt: 'The marsh boardwalk at night. Iron lamp posts run along a wet plank walk into the fog, each with a small orange flame, except one. The second post from the camera has an empty hook.',
      caption: 'Exhibit 09 — The boards. The seventh hook, empty',
      // The empty hook.
      anchor: { x: 49, y: 31 },
    },
    witness: witness(TOBIAS),
    documents: [
      {
        id: 'lamp-book',
        label: 'The lamp book',
        reference: 'VI-A',
        span: 2,
        body: [
          'Thirteen posts. No. 1 at the church, No. 13 at the Hall’s marsh gate. Eighty yards from post to post.',
          'No. 7 sent for before now: 1871, 1883, 1896, 1911, 1924, 1946, 1947, 1948.',
          'Sun. 13 Nov. All thirteen filled to the brim and lit at half past four.\nNo. 7 sent for: Holt, Marsh Row. Off its hook at ten past ten.',
          'Mon. 14 Nov. No. 7 not on its hook. Not at Marsh Row.',
        ].join('\n\n'),
        note: 'T. Fenn',
      },
      {
        id: 'reed-statement',
        label: 'Statement of Jacob Reed',
        reference: 'VI-B',
        body: 'I was at my eel trunks on the staithe, by the tenth post. A light went by me on the boards at sixteen minutes past ten by my watch, going toward the Hall at a walk. I did not look at who carried it. Nobody looks.',
        note: 'Eel-catcher, the Staithe',
      },
      {
        id: 'holt-statement',
        label: 'Statement of Ellen Holt',
        reference: 'VI-C',
        span: 2,
        body: [
          'Mother was going. At a quarter to ten I knocked at the vicarage, and the Vicar said he would come directly with the light. I told Tobias Fenn at the Eel, as you must, and went home.',
          'From our door I saw the seventh lamp lift off its hook at ten past ten. It should have come down the spur to us. It went the other way, along the boards toward the Hall.',
          'It was half past midnight when the Vicar came. He came in the dark.',
        ].join('\n\n'),
        note: 'Marsh Row',
      },
      {
        id: 'hollis-notebook',
        label: 'Constable’s notebook',
        reference: 'VI-D',
        body: [
          'Mrs Garrick, marsh lodge: Miss Calloway put the Professor’s letters in her hand at a quarter past ten. Both saw a light out on the boards. At twenty-two minutes past it came off the boards and in at the marsh gate. Mrs Garrick bolted her door.',
          'Tobias Fenn was in the Eel and Lantern from eight. I saw him out at closing, half past ten, and walked him to his door.',
          'Paced by me: marsh gate to the tower door, 320 yards by the park path.',
        ].join('\n\n'),
        note: 'P.C. Hollis',
      },
    ],
    figures: [
      {
        id: 'boardwalk',
        caption: 'Fig. VI-1 — The boards, from the church to the Hall',
        alt: 'A plan of the boardwalk, to scale. Thirteen lamp posts in a line, eighty yards apart, numbered from 1 at the church and vicarage to 13 at the Hall’s marsh gate and lodge. The seventh post has an empty hook, and a spur leaves it for Marsh Row. The staithe is at the tenth post. From the marsh gate a park path runs 320 yards to the tower door.',
      },
    ],
    prompt: 'THE SEVENTH LAMP LEFT ITS HOOK AT 22:10. WHEN DID IT REACH THE TOWER DOOR? (HH:MM)',
    answerFormat: 'time',
    redaction: { label: 'At the tower door', evidence: 'marsh-wrong-way' },
    next: { label: 'Room VII — The Seventh Lamp' },
  },

  lamp: {
    title: 'The Seventh Lamp',
    status: 'open',
    lede: [
      'The lamp in the Professor’s window was never his.',
      'It was lit on the marsh at half past four and put out on his sill at seven. It burned too much oil in between.',
    ],
    scene: {
      image: 'lamp-7',
      alt: 'An old brass storm lantern hanging from an iron hook, its flame lit. A small tin tag is wired to the bail. The tag is stamped with a 7.',
      caption: 'Exhibit 10 — The lamp from the study sill. Tag: 7',
      // The tin tag.
      anchor: { x: 86, y: 33 },
      side: 'left',
    },
    documents: [
      {
        id: 'study-inventory',
        label: 'Inventory of the tower study',
        reference: 'VII-A',
        span: 2,
        body: [
          'On the window sill: one brass storm lantern, burning, the wick turned full up. Put out by me at 7.00. Oil left in the font: two measures by the dipstick.',
          'Wired to the bail, a tin tag stamped 7. I took the lamp for the Professor’s own.',
          'Mantel clock stopped at 3.17. The hands turn freely. It was stopped and set by hand.',
          'Door locked. No key in the room or on the body. Mrs Varn’s spare opened it.',
        ].join('\n\n'),
        note: 'P.C. Hollis, 14 November, 7 a.m.',
      },
      {
        id: 'lampman-rule',
        label: 'The lampman’s rule',
        reference: 'VII-B',
        body: [
          'No. 7 holds twenty-four measures to the brim.',
          'On the marsh setting it burns one measure an hour. With the wick full up it burns two.',
          'It is carried and hung on the marsh setting. Always.',
        ].join('\n\n'),
        note: 'Inside the cover of the lamp book. T. Fenn',
      },
      {
        id: 'lamp-book-sunday',
        label: 'The lamp book, 13 November',
        reference: 'VII-C',
        body: 'All thirteen filled to the brim and lit at half past four.',
        note: 'T. Fenn',
      },
      {
        id: 'holt-second-statement',
        label: 'Statement of Ellen Holt, continued',
        reference: 'VII-D',
        span: 2,
        body: 'Near midnight the tower window came up bright, brighter than a lamp should be. All Marsh Row saw it. We said the Warden had gone to the Hall.',
        note: 'Marsh Row',
      },
    ],
    figures: [
      {
        id: 'dipstick',
        caption: 'Fig. VII-1 — The dipstick of No. 7, as read at seven',
        alt: 'The lamp’s dipstick against a scale of twenty-four measures. The oil line stands at two measures. The brim is at twenty-four.',
      },
    ],
    prompt: 'LIT AT 16:30. PUT OUT AT 07:00. WHEN WAS THE WICK TURNED UP IN THE STUDY WINDOW? (HH:MM)',
    answerFormat: 'time',
    redaction: { label: 'Wick turned up', evidence: 'lamp-window' },
    next: { label: 'The Accusation' },
  },
};

// -------------------------------------------------------- the accusation ---

export const VERDICT_DOSSIER: VerdictSource = {
  title: 'The Accusation',
  lede: [
    'Seven rooms are behind you. Five people are on the wall.',
    'Every one of them told you something true. One of them told you one thing that cannot be.',
  ],
  prompt: 'WHO KILLED ELIAS VARN?',
  account: 'verdict-account',
  suspects: [CRANE, IRIS, MARGOT, PIKE, TOBIAS],
};
