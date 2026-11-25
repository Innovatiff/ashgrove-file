import { initializeApp } from 'firebase-admin/app';

// All server logic. The web app is a static export with no server of its
// own.
//
// The Ashgrove File has four callables, and they are the only code that can
// write a player's progress or see an answer. The Gold-Maker has one, which
// does everything that room needs. The main website has one: the contact
// form.

initializeApp();

export { accuse } from './handlers/accuse';
export { checkAnswer } from './handlers/checkAnswer';
export { goldmaker } from './goldmaker/handler';
export { sendMessage } from './handlers/sendMessage';
export { signOath } from './handlers/signOath';
export { takeHint } from './handlers/takeHint';
