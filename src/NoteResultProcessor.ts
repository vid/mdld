import markdownit from 'markdown-it';

import { mdld } from './mdld';
import { uriPath, guessType, htmlsafe, encodeNoteId } from './util';
import { MetaResult } from './defs';

export class NoteResultProcessor {
  md: any;
  kb: any;
  constructor(kb) {
    let md = markdownit('default', {
      kb,
      html: true,
    });
    md.use(mdld);
    this.md = md;
    this.kb = kb;
  }
  /*
   * clear the current mdld and set it from passed content
   */
  setMDLD(content, noteId) {
    this.kb.clearSource(noteId);
    this.kb.source = noteId;
    this.md.parse(content, {});
    this.addNDates(content, noteId);
    this.addTagged(content, noteId);
    this.addQuestions(content, noteId);
    return this.kb;
  }
  process({ dataValues: note }): { noteId: string; meta: MetaResult } {
    const noteId = encodeNoteId(note.id);
    this.kb.source = noteId;
    this.setMDLD(note.content, noteId);

    const title = note.title || note.mdld?.find((m) => m.predicate === 'path')?.replace(/.*\//, '');
    const proto = { title, mdld: this.kb.statements[noteId]?.mdld || [] };
    const meta = Object.keys(note).reduce((a, k) => {
      if (k === 'content' || k.startsWith('_')) {
        return a;
      }
      return { ...a, [k]: note[k] };
    }, proto);
    return { noteId, meta };
  }
  addNDates(content, noteId) {
    const ndates = content.match(/(20\d{6})/g);
    ndates &&
      ndates.forEach((d) => {
        this.addQuadWithSchema({ subject: noteId, predicate: 'date', object: d, source: noteId });
      });
  }
  addQuadWithSchema(quad) {
    const location = uriPath(quad.source);
    let fullschema = this.kb.withSchema(quad.predicate, location, guessType(quad.object));
    quad.predicate = fullschema;
    this.kb.addQuad(quad);
  }
  addTagged(content, noteId) {
    const tagged = /((?:^)|([.!?*]\s))([\w-+ ;]{0,}:)/gm;
    const matches = [...content.matchAll(tagged)];
    if (matches.length > 0) {
      for (const match of matches) {
        const text = match[3];
        const predicate = text.replace(':', '');
        let object = htmlsafe(content.substr(match.index).replace(/.*?: ?/, '')).replace(/[.!?][\s].*/, '');
        if (object.includes('\n')) {
          object = object.substr(0, object.indexOf('\n'));
        }
        this.addQuadWithSchema({ subject: noteId, predicate, object, source: noteId });
      }
    }
  }
  addQuestions(content, noteId) {
    const questions = /(?:^|(?:[.!?]\s)).*?\?/gm;
    const matches = [...content.matchAll(questions)];
    if (matches.length > 0) {
      for (const match of matches) {
        const text = match[0];
        // don't include URIs that end with ?
        if (text.replace(/.* /, '').includes('://')) {
          continue;
        }
        const predicate = 'question';
        // FIXME regex captures previous sentence
        let object = htmlsafe(text.replace(/^.*?[.!*]\s?/g, ''));
        this.addQuadWithSchema({ subject: noteId, predicate, object, source: noteId });
      }
    }
  }
}
