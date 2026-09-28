// Client-side only: readable-but-not-guessable starting passwords for accounts
// a platform admin creates on someone else's behalf (new library owner, or a
// forgotten-password reset) — handed over by call/WhatsApp, never emailed.
const WORDS = ["River", "Falcon", "Maple", "Comet", "Harbor", "Cedar", "Delta", "Ember", "Willow", "Granite"];

export function generatePassword(): string {
  const pick = () => WORDS[Math.floor(Math.random() * WORDS.length)];
  return `${pick()}-${pick()}-${Math.floor(100 + Math.random() * 900)}`;
}
