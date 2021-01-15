export type Quad = {
  subject: string;
  predicate: string;
  object: string;
  source: string;
  blank: boolean;
};
export type Schema = {
  type?: string;
};

export type FindHit = QuadHit | TextHit;
export type Field = 'subject' | 'predicate' | 'object' | 'source';
export type QuadHit = {
  fields: Field[];
  quad: Quad;
};
export type TextHit = {
  field: 'text';
  text: string;
};

export type MetaResult = {
  mdld: Quad[];
  hits?: FindHit[];
};
export type MetaResultMap = {
  [noteId: string]: MetaResult;
};
