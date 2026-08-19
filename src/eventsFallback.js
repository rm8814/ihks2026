// Bundled copy of the program-book data, extracted from the official IHKS 2026
// program book PDF (plus PIC/LO assignments cross-checked against the committee
// recap sheet). Used automatically whenever Supabase isn't configured yet, so the
// app is fully browsable out of the box — and used as the seed source for
// `npm run seed` once you do wire up Supabase.
import raw from '../data/events.json'

export default raw
