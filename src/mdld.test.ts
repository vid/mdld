const { mdld } = require('./mdld');
const { KB } = require('./KB');

describe('non blank quad', () => {
  it('finds property', () => {
    const kb = new KB('https://nicer.info');
    const md = require('markdown-it')({ kb }).use(mdld);
    kb.source = '/test';
    md.render('[:test](1)');
    expect(kb.statements['/test'].mdld[0].blank).toBe(false);
  });

  it('finds blank', () => {
    const kb = new KB('https://nicer.info');
    const md = require('markdown-it')({ kb }).use(mdld);
    kb.source = '/test';
    md.render('[label:test](1)');
    expect(kb.statements['/test'].mdld[0].blank).toBe(true);
  });
  it('finds label with spaces', () => {
    const kb = new KB('https://nicer.info');
    const md = require('markdown-it')({ kb }).use(mdld);
    kb.source = '/test';
    md.render('[a label:test](1)');
    expect(kb.statements['/test'].mdld[0]).toEqual({
      _type: 'Numeric',
      blank: true,
      object: '1',
      predicate: 'test',
      source: '/test',
      subject: 'a label',
    });
  });
});

describe('statements and schemas', () => {
  const tests = {
    'https://nicer.info/test/text': `
# Heading

Paragraph.

1. List

* List

`,
    'https://nicer.info/test/date': '[test:date](<Sept 6, 2020 >)',
    'https://nicer.info/test/spacestext': '[test:text](<some text>)',
    'https://nicer.info/test/texturl': '[test:urltext](urltext)',
    'https://nicer.info/test/url': '[test:url](https://nicer.info/test/something)',
    'https://nicer.info/rdate': '[a test:rdate](<Sept 5, 2020>)',
    'https://nicer.info/test/datestring': '[test:rdate](<Sept 4, 2020>)',
    'https://nicer.info/test/broken': '[test:broken](to nowhere)',
    'https://nicer.info/test/link': '[some link](somewhere)',
    'https://somewhere.else/test/link': '[offsite link](elsewhere)',
  };

  const kb = new KB('https://nicer.info');
  const md = require('markdown-it')({ kb }).use(mdld);

  Object.entries(tests).forEach(([t, text]) => {
    // FIXME not the nicest way to carry doc name
    kb.source = t;
    md.render(text);
  });

  it('has quads', () => {
    expect(Object.keys(kb.statements).length).toBe(8);
  });
  it('has schemas', () => {
    expect(Object.keys(kb.schemas).length).toBe(6);
  });
  it('schemas have the correct types', () => {
    Object.keys(kb.schemas).forEach((schema) => {
      expect(schema.endsWith(kb.schemas[schema].type.toLowerCase()));
    });
  });

  it('localizes source', () => {
    expect(kb.statementsAsQuads().filter((q) => q.source.includes('://')).length).toBe(1);
  });
});
