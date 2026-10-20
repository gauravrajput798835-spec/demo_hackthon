import assert from 'node:assert/strict';
import { test } from 'node:test';
import { answerQuestion, classifyIntent, faqs, HOLIDAY_FALLBACK, UNKNOWN_FALLBACK } from './assistantLogic.ts';

test('holiday duration questions never use an exam answer', () => {
  const result = answerQuestion('Kitne din college off hai?');
  assert.equal(result.intent, 'holiday');
  assert.equal(result.kind, 'unknown');
  assert.equal(result.text, HOLIDAY_FALLBACK);
  assert.equal(result.faq, undefined);
});

test('tomorrow closure questions use the holiday fallback', () => {
  const result = answerQuestion('Kal college band hai kya?');
  assert.equal(result.intent, 'holiday');
  assert.equal(result.text, HOLIDAY_FALLBACK);
});

test('exam deadline questions return only the historical deadline source', () => {
  const result = answerQuestion('Exam form ki last date kya hai?');
  assert.equal(result.intent, 'deadline');
  assert.equal(result.kind, 'verified');
  assert.match(result.text, /historical/i);
  assert.doesNotMatch(result.text, /current deadline is November|latest verified.*2024/i);
});

test('exam document questions return the document FAQ', () => {
  const result = answerQuestion('BCA exam ke liye kaun se documents chahiye?');
  assert.equal(result.intent, 'documents');
  assert.equal(result.kind, 'verified');
  assert.match(result.text, /दस्तावेज़/);
  assert.ok(result.faq?.documents.length);
});

// --- Regression tests: substring false positives -------------------------------------------

test('"office" does not trigger the holiday intent', () => {
  assert.notEqual(classifyIntent('Where is the exam office?'), 'holiday');
  assert.equal(answerQuestion('Where is the exam office?').intent, 'unknown');
});

test('"offer" does not trigger the holiday intent', () => {
  assert.notEqual(classifyIntent('What is the scholarship offer for BCA?'), 'holiday');
  assert.equal(answerQuestion('What is the scholarship offer for BCA?').intent, 'scholarship');
});

test('"husband" does not trigger the holiday intent', () => {
  assert.notEqual(classifyIntent('My husband asked about exam form documents'), 'holiday');
  assert.equal(answerQuestion('My husband asked about exam form documents').intent, 'documents');
});

test('"update" does not trigger the deadline intent', () => {
  const result = answerQuestion('Exam update kab aayega?');
  assert.notEqual(result.intent, 'deadline');
  assert.equal(result.kind, 'unknown');
  assert.equal(result.text, UNKNOWN_FALLBACK);
});

test('"information" does not trigger the documents intent', () => {
  const result = answerQuestion('I need information about the exam schedule');
  assert.notEqual(result.intent, 'documents');
  assert.equal(result.kind, 'unknown');
  assert.equal(result.text, UNKNOWN_FALLBACK);
});

// --- Regression tests: topic-aware deadline routing ----------------------------------------

for (const query of [
  'Scholarship form ki last date kya hai?',
  'Scholarship ki last date kya hai?',
  'Scholarship application deadline',
  'Admission form ki last date?',
  'Lateral entry admission last date kab hai?',
  'Admission fee late fee deadline',
]) {
  test(`scholarship/admission date question never returns the exam-form deadline: ${query}`, () => {
    const result = answerQuestion(query);
    assert.equal(result.kind, 'unknown');
    assert.equal(result.text, UNKNOWN_FALLBACK);
    assert.equal(result.faq, undefined);
    assert.doesNotMatch(result.text, /2024/);
  });
}

test('non-date scholarship and admission questions still return their own FAQ', () => {
  assert.equal(answerQuestion('Scholarship ke baare mein batao').faq?.intent, 'scholarship');
  assert.equal(answerQuestion('Lateral entry admission process kya hai?').faq?.intent, 'admission');
});

test('scholarship/admission document questions do not return the exam-form document list', () => {
  assert.equal(answerQuestion('Scholarship form ke liye kaun se documents chahiye?').faq?.intent, 'scholarship');
  assert.equal(answerQuestion('Admission ke liye kaun se documents chahiye?').faq?.intent, 'admission');
});

// --- Regression tests: Hindi / Hinglish holiday queries ------------------------------------

for (const query of [
  'छुट्टी कब है?',
  'कल कॉलेज बंद है क्या?',
  'कॉलेज में कितने दिन की छुट्टियां हैं?',
  'दिवाली का अवकाश कब से है',
  'Diwali ki chhutti kab se hai',
  'Kal holiday hai kya',
]) {
  test(`holiday query uses the holiday fallback: ${query}`, () => {
    const result = answerQuestion(query);
    assert.equal(result.intent, 'holiday');
    assert.equal(result.kind, 'unknown');
    assert.equal(result.text, HOLIDAY_FALLBACK);
    assert.equal(result.faq, undefined);
  });
}

test('Hindi exam-form deadline question still reaches the deadline FAQ', () => {
  assert.equal(answerQuestion('एग्जाम फॉर्म की अंतिम तारीख क्या है?').intent, 'deadline');
});

test('Hindi documents question still reaches the documents FAQ', () => {
  assert.equal(answerQuestion('BCA एग्जाम फॉर्म के लिए कौन से दस्तावेज़ चाहिए?').intent, 'documents');
});

// --- Honesty guards for historical sample data ---------------------------------------------

test('the deadline answer is flagged historical and never claims to be current or verified', () => {
  const result = answerQuestion('Exam form ki last date kya hai?');
  assert.equal(result.faq?.historical, true);
  assert.match(result.text, /historical/i);
  assert.match(result.text, /not a current deadline/i);
  assert.doesNotMatch(result.text, /\bverified\b/i);
});

test('every FAQ that cites a 2024 source is flagged historical', () => {
  for (const faq of faqs) {
    const mentions2024 = [faq.title, faq.text, faq.note, ...faq.documents, faq.source ?? ''].some((value) => /2024/.test(value));
    if (mentions2024) assert.equal(faq.historical, true, `FAQ "${faq.intent}" mentions 2024 but is not flagged historical`);
  }
});

test('the four original queries keep their intents', () => {
  assert.equal(classifyIntent('Kitne din college off hai?'), 'holiday');
  assert.equal(classifyIntent('Kal college band hai kya?'), 'holiday');
  assert.equal(classifyIntent('Exam form ki last date kya hai?'), 'deadline');
  assert.equal(classifyIntent('BCA exam ke liye kaun se documents chahiye?'), 'documents');
});
