export type FAQIntent = 'holiday' | 'deadline' | 'documents' | 'admission' | 'scholarship' | 'unknown';

export type FAQ = {
  intent: Exclude<FAQIntent, 'holiday' | 'unknown'>;
  keywords: string[];
  question: string;
  title: string;
  text: string;
  documents: string[];
  note: string;
  /** True when the answer is based on an older (2024–25) sample notice and must not be shown as current. */
  historical: boolean;
  /** Name of the source notice, only when the sample data actually lists one. */
  source?: string;
};

export type AnswerResult = {
  intent: FAQIntent;
  kind: 'verified' | 'unknown';
  text: string;
  faq?: FAQ;
};

export const HOLIDAY_FALLBACK = 'College holiday information is not available in the current verified data. Please check the official college notice board.';
export const UNKNOWN_FALLBACK = 'We could not verify this information in the available official college documents.';

export const faqs: FAQ[] = [
  {
    intent: 'documents',
    keywords: ['document', 'documents', 'दस्तावेज', 'फॉर्म'],
    question: 'Which documents are needed for the exam form?',
    title: 'BCA Semester 5 exam form भरने के लिए ये 4 documents चाहिए',
    text: 'BCA Semester 5 का एग्जाम फॉर्म भरने के लिए नीचे दिए गए दस्तावेज़ तैयार रखें।',
    documents: [
      'BCA Semester 4 की original / इंटरनेट marksheet की कॉपी',
      'College fee receipt (sample notice में सत्र 2024–25 लिखा है)',
      '2 हालिया passport-size फोटो (white background)',
      'College ID card या Aadhaar card की कॉपी',
    ],
    note: 'Exam form के साथ fee challan / ATM slip की photocopy भी लगाना अनिवार्य है।',
    historical: true,
  },
  {
    intent: 'deadline',
    keywords: ['deadline', 'date', 'last date', 'late fee', 'तारीख', 'अंतिम', 'डेडलाइन'],
    question: 'How can I check the exam form deadline?',
    title: 'The sample circular lists November 28, 2024 as a historical deadline',
    text: 'A sample circular (Notice #2024/EX-09) lists November 28, 2024 as the last date without late fee. This is historical sample information, not a current deadline. No current exam form deadline is available in the data, so please check the official notice board.',
    documents: ['Official Notice #2024/EX-09', 'Examination Department circular'],
    note: 'Because this notice is from 2024, check the official notice board for any current deadline before submitting.',
    historical: true,
    source: 'Official Notice #2024/EX-09',
  },
  {
    intent: 'admission',
    keywords: ['lateral', 'admission process', 'admission', 'प्रवेश'],
    question: 'What is the admission process for lateral entry?',
    title: 'Lateral entry applications follow the university admission schedule',
    text: 'Eligible diploma holders can apply through the admissions desk. Bring your diploma marksheet, transfer certificate, and ID proof for verification.',
    documents: ['Admissions Handbook 2024–25', 'Lateral Entry Notice #ADM-17'],
    note: 'The admissions desk confirms eligibility and the next available counselling date.',
    historical: true,
    source: 'Admissions Handbook 2024–25',
  },
  {
    intent: 'scholarship',
    keywords: ['scholarship', 'scholarships', 'छात्रवृत्ति'],
    question: 'Where can I find scholarship information?',
    title: 'Scholarship updates are published by the Student Welfare Office',
    text: 'Check the Student Welfare Office notice board for state and national scholarship announcements, eligibility rules, and application windows.',
    documents: ['Student Welfare Circular #SW-08'],
    note: 'Keep your income certificate, bank details, and previous marksheet ready when a scheme opens.',
    historical: false,
    source: 'Student Welfare Circular #SW-08',
  },
];

// Matching rules:
// - Latin terms must match a whole word or an exact word sequence ("off" does not match "office").
// - Devanagari terms match from the start of a word, because Hindi suffixes and matras attach to the end
//   (e.g. the stem "छुट्ट" matches both "छुट्टी" and "छुट्टियां").
const holidayTerms = [
  'holiday', 'holidays', 'off', 'band', 'bandh', 'closed', 'closure',
  'chhutti', 'chutti', 'chhuttiyan', 'chuttiyan',
  'छुट्ट', 'बंद', 'बन्द', 'अवकाश',
];
const deadlineTerms = ['deadline', 'last date', 'late fee', 'date', 'dates', 'तारीख', 'अंतिम', 'डेडलाइन'];
const deadlineContextTerms = [
  'exam', 'exams', 'examination', 'form', 'forms', 'fee', 'fees',
  'एग्जाम', 'परीक्षा', 'फॉर्म', 'फीस', 'शुल्क',
];
const documentTerms = ['document', 'documents', 'docs', 'form', 'forms', 'दस्तावेज', 'फॉर्म'];
const documentContextTerms = [
  'exam', 'exams', 'examination', 'form', 'forms', 'bca',
  'एग्जाम', 'परीक्षा', 'फॉर्म', 'बीसीए',
];
const admissionTerms = ['lateral', 'admission', 'admissions', 'प्रवेश'];
const scholarshipTerms = ['scholarship', 'scholarships', 'छात्रवृत्ति'];

function normalize(query: string): string {
  return query
    .normalize('NFC')
    .toLowerCase()
    .replace(/[\u200c\u200d]/g, '')
    .replace(/[^\p{L}\p{M}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function includesTerm(normalized: string, term: string): boolean {
  const t = term.normalize('NFC');
  // Pad with spaces so the term must start at a word boundary; Latin terms must also end at one.
  const isLatin = /^[a-z0-9 ]+$/.test(t);
  return isLatin ? ` ${normalized} `.includes(` ${t} `) : ` ${normalized}`.includes(` ${t}`);
}

function hasAny(normalized: string, terms: string[]): boolean {
  return terms.some((term) => includesTerm(normalized, term));
}

export function classifyIntent(query: string): FAQIntent {
  const normalized = normalize(query);
  if (hasAny(normalized, holidayTerms)) return 'holiday';

  const asksAboutDate = hasAny(normalized, deadlineTerms);
  const mentionsOtherTopic = hasAny(normalized, admissionTerms) || hasAny(normalized, scholarshipTerms);

  // The only deadline in the data is the exam-form one. A date question about admission or
  // scholarship has no verified answer, so it must not fall back to the exam-form deadline.
  if (asksAboutDate && mentionsOtherTopic) return 'unknown';
  if (asksAboutDate && hasAny(normalized, deadlineContextTerms)) return 'deadline';

  // The document list is for the exam form; do not reuse it for admission or scholarship questions.
  if (!mentionsOtherTopic && hasAny(normalized, documentTerms) && hasAny(normalized, documentContextTerms)) return 'documents';
  if (hasAny(normalized, admissionTerms)) return 'admission';
  if (hasAny(normalized, scholarshipTerms)) return 'scholarship';
  return 'unknown';
}

export function answerQuestion(query: string): AnswerResult {
  const intent = classifyIntent(query);
  if (intent === 'holiday') return { intent, kind: 'unknown', text: HOLIDAY_FALLBACK };
  const faq = faqs.find((entry) => entry.intent === intent);
  if (!faq) return { intent: 'unknown', kind: 'unknown', text: UNKNOWN_FALLBACK };
  return { intent, kind: 'verified', text: faq.text, faq };
}

export function findFAQ(query: string): FAQ | undefined {
  return answerQuestion(query).faq;
}
