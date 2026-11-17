import { initializeApp } from 'firebase-admin/app';

// All server logic for The Ashgrove File. The web app is a static export with
// no server of its own: these three callables are the only code that can
// write a player's progress or see an answer.

initializeApp();

export { checkAnswer } from './handlers/checkAnswer';
export { signOath } from './handlers/signOath';
export { takeHint } from './handlers/takeHint';
