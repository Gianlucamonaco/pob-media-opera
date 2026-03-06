import { Scenes } from "./constants";

/** References:
 *  The Value of Science: https://calteches.library.caltech.edu/1575/1/Science.pdf
 *  Plenty of Room at the Bottom: https://web.pa.msu.edu/people/yang/RFeynman_plentySpace.pdf
 */
export const strings: Partial<Record<Scenes, string[]>> = {

  [Scenes.SISTEMA]: [
    // from: The Value of Science
    'Deep in the sea,', 'all molecules repeat the patterns of one another', 'till complex new ones are formed.',
    'They make others like themselves...', 'and a new dance starts.',

  ],

  // 
  [Scenes.SOLO_01]: [
    // from: The Value of Science
    'There are the rushing waves...',
    'mountains of molecules', 'each stupidly minding its own business...',
    'trillions apart...', 'yet forming white surf in unison.',
    'Ages on ages...', 'before any eyes could see...',
    'year after year...', 'thunderously pounding the shore as now.',

    'For whom, for what?', '...on a dead planet, with no life to entertain.',
    'Never at rest...', 'tortured by energy...',
    'wasted prodigiously by the sun...', 'poured into space.',
    'A mite makes the sea roar.', 
  ],

  [Scenes.SOLO_02]: [
    // from: Plenty of Space at the Bottom
    'Atoms on a small scale', 'behave like nothing on a large scale,',
    'for they satisfy the laws of quantum mechanics.',

    'So, as we go down and fiddle around', 'with the atoms down there,',
    'we are working with different laws,',
    'and we can expect to do different things.',

    // 'if we go down far enough,',
    // 'all of our devices can be mass produced',
    // 'so that they are absolutely perfect copies of one another.',
  ],

  [Scenes.SOLO_03]: [
    // from: Plenty of Space at the Bottom
    'Biology is not simply writing information',
    'it is doing something about it.',

    'Many of the cells are very tiny,',
    'but they are very active',
    'they manufacture various substances',
    'they walk around',
    'they wiggle',
    'and they do all kinds of marvelous things',
    'all on a very small scale.',

    'Also, they store information.',
  ],

  [Scenes.SOLO_04]: [
    // from: The Value of Science
    'Growing in size and complexity...',
    'living things, masses of atoms, DNA, protein...',
    'dancing a pattern ever more intricate.',
    'Out of the cradle onto the dry land...',
    'here it is standing...',
    'atoms with consciousness...',
    'matter with curiosity.',

    'Stands at the sea...',
    'wonders at wondering',
    '...I...',
    'a universe of atoms...',
    'an atom in the universe.',

  ],

  [Scenes.TUFTEEE]: ['00000'],
}