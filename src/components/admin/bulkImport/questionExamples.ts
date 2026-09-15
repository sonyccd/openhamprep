/**
 * Example downloads for the question importer.
 *
 * Both are built from the exam's ID prefix so a Technician example never hands
 * back IDs the Technician importer would reject.
 */

export const exampleQuestionsCSV = (prefix: string) =>
  `id,question,option_a,option_b,option_c,option_d,correct_answer,subelement,question_group,explanation
${prefix}1A01,"What is the purpose of the amateur radio service?","Commercial broadcasting","Emergency communications and self-training","Government communications","Military operations",B,${prefix}1,${prefix}1A,"The amateur radio service exists for emergency communications and self-training in radio communications."
${prefix}1A02,"Which agency regulates amateur radio in the United States?","FBI","FCC","FAA","EPA",B,${prefix}1,${prefix}1A,"The Federal Communications Commission (FCC) regulates amateur radio in the United States."
${prefix}1A03,"What is the minimum age requirement for an amateur radio license?","18 years old","21 years old","16 years old","No minimum age",D,${prefix}1,${prefix}1A,"There is no minimum age requirement for an amateur radio license."`;

export const exampleQuestionsJSON = (prefix: string) => [
  {
    id: `${prefix}1A01`,
    question: 'What is the purpose of the amateur radio service?',
    options: [
      'Commercial broadcasting',
      'Emergency communications and self-training',
      'Government communications',
      'Military operations',
    ],
    correct_answer: 1,
    subelement: `${prefix}1`,
    question_group: `${prefix}1A`,
    explanation:
      'The amateur radio service exists for emergency communications and self-training in radio communications.',
  },
  {
    id: `${prefix}1A02`,
    question: 'Which agency regulates amateur radio in the United States?',
    options: ['FBI', 'FCC', 'FAA', 'EPA'],
    correct_answer: 1,
    subelement: `${prefix}1`,
    question_group: `${prefix}1A`,
    explanation:
      'The Federal Communications Commission (FCC) regulates amateur radio in the United States.',
  },
  {
    id: `${prefix}1A03`,
    question: 'What is the minimum age requirement for an amateur radio license?',
    options: ['18 years old', '21 years old', '16 years old', 'No minimum age'],
    correct_answer: 3,
    subelement: `${prefix}1`,
    question_group: `${prefix}1A`,
    explanation: 'There is no minimum age requirement for an amateur radio license.',
  },
];
