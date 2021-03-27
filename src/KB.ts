import { Field, MetaResultMap, Quad, Schema } from './defs';

const { is, windowDoc } = require('./util');

export { };

export class KB {
  concepts = {};

  source = undefined;

  origin = undefined;

  statements: MetaResultMap = {};

  schemas = {};

  /**
   *
   * @param origin to localize
   */

  constructor(origin: string) {
    this.origin = origin;
  }

  withSchema(name, location, type): string {
    let fullschema = this.findSchema(name, location);
    if (!fullschema) {
      fullschema = this.addSchema(name, { type });
    }
    return fullschema;
  }

  /**
   * find a schema for this name.
   * start in the current directory, down to the root
   * or return undefined
   */

  private findSchema(name, location): string | undefined {
    let schemabase = location;
    while (schemabase.match('://.')) {
      const fullschema = `${schemabase}/${name}`;
      if (this.schemas[fullschema]) {
        return fullschema;
      }
      schemabase = schemabase.substr(0, schemabase.lastIndexOf('/'));
    }
    return undefined;
  }

  clearSource(source = windowDoc()) {
    if (this.statements[source]) {
      this.statements[source].mdld = [];
    }
  }

  addQuad(quad: Quad) {
    const schema = this.schemas[quad.predicate];
    const source = this.withoutOrigin(quad.source);
    this.statements[source] = this.statements[source] || { mdld: [] };
    if (schema && is[schema.type] && is[schema.type](quad.object)) {
      this.statements[source].mdld.push(this.localized(quad));
    } else {
      this.statements[source].mdld.push(this.localized({ ...quad, predicate: `notvalid_${quad.predicate}` }));
    }
  }

  private addSchema(name: string, schema: Schema): string {
    const fullschema = `${name}`;
    this.schemas[fullschema] = schema;
    return fullschema;
  }

  withoutOrigin(what) {
    return what.replace(this.origin, '');
  }

  private localized(quad: Quad) {
    // FIXME should check upper refs
    const type = this.schemas[quad.predicate] && this.schemas[quad.predicate].type;
    return {
      ...quad,
      source: this.withoutOrigin(quad.source),
      subject: this.withoutOrigin(quad.subject),
      predicate: this.withoutOrigin(quad.predicate),
      object: type === 'URL' ? this.withoutOrigin(quad.object) : quad.object,
      _type: type,
      blank: quad.blank,
    };
  }

  statementsAsQuads() {
    return Object.entries(this.statements).reduce((all, [, v]) => [...all, ...v.mdld], []);
  }
}

export const allFields: Field[] = ['subject', 'predicate', 'object', 'source'];
