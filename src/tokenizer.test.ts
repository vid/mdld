import { Tokenizer } from './tokenizer';

describe('tokenizer', () => {
  test('tokenizes single token', () => {
    const t = new Tokenizer('hi');
    expect(t.next()).toEqual('hi');
    expect(t.hasNext()).toBe(false);
  });
  test('tokenizes token with spaces', () => {
    const t = new Tokenizer('hi there');
    expect(t.next()).toEqual('hi');
    expect(t.hasNext()).toBe(true);
    expect(t.next()).toEqual('there');
    expect(t.hasNext()).toBe(false);
  });
  test('tokenizes token with quote', () => {
    const t = new Tokenizer('"hi"');
    expect(t.next()).toEqual('hi');
    expect(t.hasNext()).toBe(false);
  });
  test('tokenizes token with spaces in quote', () => {
    const t = new Tokenizer('"hi eh"');
    expect(t.next()).toEqual('hi eh');
    expect(t.hasNext()).toBe(false);
  });
  test('tokenizes token with quotes', () => {
    const t = new Tokenizer('"hi" "there eh"');
    expect(t.next()).toEqual('hi');
    expect(t.hasNext()).toBe(true);
    expect(t.next()).toEqual('there eh');
    expect(t.hasNext()).toBe(false);
  });
  test('throws missing quote', () => {
    const t = new Tokenizer('"hi');
    let threw = false;
    try {
      t.next();
    } catch (e) {
      threw = true;
    }
    expect(threw).toBe(true);
  });
});
