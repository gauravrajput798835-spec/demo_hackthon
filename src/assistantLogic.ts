export type FAQIntent = 'holiday' | 'deadline' | 'documents' | 'admission' | 'scholarship' | 'unknown';

export type FAQ = {
  intent: Exclude<FAQIntent, 'holiday' | 'unknown'>;
  keywords: string[];
  question: string;
  title: string;
  text: string;
  documents: string[];
  note: string;
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
      'चालू सत्र (2024–25) की college fee receipt',
      '2 हालिया passport-size फोटो (white background)',
      'College ID card या Aadhaar card की कॉपी',
    ],
    note: 'Exam form के साथ fee challan / ATM slip की photocopy भी लगाना अनिवार्य है।',
  },
  {
    intent: 'deadline',
    keywords: ['deadline', 'date', 'last date', 'late fee', 'तारीख', 'अंतिम', 'डेडलाइन'],
    question: 'How can I check the exam form deadline?',
    title: 'The sample circular lists November 28, 2024 as a historical deadline',
    text: 'The verified sample circular lists November 28, 2024 as the last date without late fee. This is historical information, not a current deadline; no current deadline is available in the verified data.',
    documents: ['Official Notice #2024/EX-09', 'Examination Department circular'],
    note: 'Because this notice is from 2024, check the official notice board for any current deadline before submitting.',
  },
  {
    intent: 'admission',
    keywords: ['lateral', 'admission process', 'admission', 'प्रवेश'],
    question: 'What is the admission process for lateral entry?',
    title: 'Lateral entry applications follow the university admission schedule',
    text: 'Eligible diploma holders can apply through the admissions desk. Bring your diploma marksheet, transfer certificate, and ID proof for verification.',
    documents: ['Admissions Handbook 2024–25', 'Lateral Entry Notice #ADM-17'],
    note: 'The admissions desk confirms eligibility and the next available counselling date.',
  },
  {
    intent: 'scholarship',
    keywords: ['scholarship', 'scholarships', 'छात्रवृत्ति'],
    question: 'Where can I find scholarship information?',
    title: 'Scholarship updates are published by the Student Welfare Office',
    text: 'Check the Student Welfare Office notice board for state and national scholarship announcements, eligibility rules, and application windows.',
    documents: ['Student Welfare Circular #SW-08'],
    note: 'Keep your income certificate, bank details, and previous marksheet ready when a scheme opens.',
  },
];

const holidayTerms = ['holiday', 'holidays', 'off', 'band', 'closed', 'closure', 'chhutti', 'छुट्टी', 'बंद', 'अवकाश'];
const deadlineTerms = ['deadline', 'last date', 'late fee', 'date', 'तारीख', 'अंतिम', 'डेडलाइन'];
const documentTerms = ['document', 'documents', 'दस्तावेज', 'फॉर्म', 'form'];

function normalize(query: string): string {
  return query.toLowerCase().replace(/[?!.:,]/g, ' ').replace(/\s+/g, ' ').trim();
}

function includesTerm(query: string, term: string): boolean {
  return query.includes(term);
}

export function classifyIntent(query: string): FAQIntent {
  const normalized = normalize(query);
  if (holidayTerms.some((term) => includesTerm(normalized, term))) return 'holiday';
  if (deadlineTerms.some((term) => includesTerm(normalized, term)) && (normalized.includes('exam') || normalized.includes('form') || normalized.includes('fee'))) return 'deadline';
  if (documentTerms.some((term) => includesTerm(normalized, term)) && (normalized.includes('exam') || normalized.includes('form') || normalized.includes('bca'))) return 'documents';
  if (normalized.includes('lateral') || normalized.includes('admission') || normalized.includes('प्रवेश')) return 'admission';
  if (normalized.includes('scholarship') || normalized.includes('छात्रवृत्ति')) return 'scholarship';
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
