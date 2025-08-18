
export interface Questionnaire {
    id: string;
    title: string;
    description?: string;
    questions: Question[];
    link: string;
}

export interface Question {
    id?: string;
    text: string;
    type: string;
    options?: { optionText: string }[];
    answers?: Answer[];
}

export interface Answer {
    userId?: string;
    userName?: string;
    isAnonymous?: boolean;
    selectedOptionText?: string;
    text?: string;
    createdAt: string;
}

export interface Attempt {
    attemptId: string;
    userId: string;
    userName: string;
    isAnonymous: boolean;
    startTime: Date;
    answers: Record<string, AnswerGroup>;
    groupedAnswers: AnswerGroup[];
    lastAnswerTimestamp: number;
    attemptNumber: number;
}

export interface AnswerGroup {
    questionRealId?: string;
    questionText: string;
    questionType: string;
    answerTexts: string[];
    firstAnswerTime: number;
}

export interface UserAttempts {
    userId: string;
    userName: string;
    isAnonymous: boolean;
    attempts: Attempt[];
    firstAttemptTime: number;
    lastAttemptTime: number;
}