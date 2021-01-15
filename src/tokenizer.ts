
export class Tokenizer {
  s: string;
  constructor(s: string) {
    this.s = s;
    return this;
  }
  hasNext() {
    return this.s?.length > 0;
  }
  next() {
    const nextSpace = this.s.indexOf(' ');
    const isQuote = this.s.substr(0, 1) === '"';
    if (nextSpace === -1 && !isQuote) {
      const nextToken = this.s;
      this.s = undefined;
      return nextToken;
    }
    if (isQuote) {
      const closeQuote = this.s.indexOf('"', 1);
      if (closeQuote < 0) {
        throw Error(`Quote not closed ${this.s}`);
      }
      const nextToken = this.s.substr(1, closeQuote - 1);

      this.s = this.s.substr(closeQuote + 1).trim();
      return nextToken;
    }
    const nextToken = this.s.substr(0, nextSpace);
    this.s = this.s.substr(nextSpace + 1);
    return nextToken;

  }
}