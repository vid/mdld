import { MetaResultMap, TextHit } from '../defs';
import { KB } from '../KB';

const { NoteResultProcessor } = require('../NoteResultProcessor');
const { htmlsafe } = require('../util');

export const getOrigin = () => {
  if (!process.env.CMD_DOMAIN) {
    return undefined;
  }
  return (process.env.CMD_PROTOCOL_USESSL === 'true' ? 'https' : 'http') + `://${process.env.CMD_DOMAIN}`;
};
export const routes = ({ errors, models, logger }) => {
  // FIXME there is probably a better way to do this
  const meNotes = async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    const nrp = new NoteResultProcessor(new KB(getOrigin()));
    const found = await getNotesById(models, req.user.id);
    let noteData: MetaResultMap = {};
    for (const note of found) {
      const { noteId, meta } = nrp.process(note);
      noteData[noteId] = meta;
    }
    res.json({ noteData, schemas: nrp.kb.schemas });
  };
  const meNoteSearch = async (req, res, search) => {
    res.setHeader('Content-Type', 'application/json');
    const nrp = new NoteResultProcessor(new KB(getOrigin()));
    // FIXME why do existing note queries resolve user first?
    const sr = new RegExp(`\\b${decodeURIComponent(search)}`, 'ig');
    const found = await getNotesById(models, req.user.id);
    const results = {};
    for (const note of found) {
      const matches = [...note.content.toLowerCase().matchAll(sr)];
      if (matches.length > 0) {
        const hits: TextHit[] = [];
        const { noteId, meta } = nrp.process(note as any);
        for (const match of matches) {
          const text = htmlsafe(note.content.substr(match.index, 32));
          hits.push({ field: 'text', text });
        }
        meta.hits = hits;
        results[noteId] = meta;
      }
    }
    res.json(results);
  };
  const getNotesById = async (models, id) => {
    const notes = await models.Note.findAll({ where: { ownerId: id } });
    const found: any[] = await Promise.all(notes);
    return found;
  };
  const ifAuthn = (what: Function) => {
    return (req, res, ...rest) => {
      if (!req.isAuthenticated()) {
        logger('forbidden');
        return errors.errorForbidden(res);
      }
      what(...[req, res, ...rest]);
    };
  };
  return {
    meNotes: ifAuthn(meNotes),
    meNoteSearch: ifAuthn(meNoteSearch),
  };
};
