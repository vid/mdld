const natural = require('natural');

const notes = require('../notes.json');

go();

async function go() {
  const kb = { statements: notes };
  // const classifier = new natural.BayesClassifier();
  const classifier = new natural.LogisticRegressionClassifier();

  for (const nn in kb.statements) {
    const note = notes[nn];
    if (note.content) {
      const path = note.mdld.find(m => m.predicate === 'path') ?.object.replace(/\/[^/]*?$/, '') || 'nopath';
      classifier.addDocument(note.content, path);
    } else {
      console.log('no content for', nn)
    }
  }
  classifier.train();
  const tests = ['kubernetes is a thing', 'Susan is a person', 'Sony is a company', 'SK works there', 'Verifiable Credentials are a topic']

  console.log(JSON.stringify(classifier));

  for (const t of tests) {
    console.log(t, classifier.classify(t), classifier.getClassifications(t).filter((c, i) => i < 3));
  }

};
