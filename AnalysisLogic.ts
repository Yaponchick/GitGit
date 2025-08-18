import { Questionnaire, Question, Answer, Attempt, AnswerGroup, UserAttempts } from "./types";
import apiClient from '../../api/apiClient';
import ExcelJS from 'exceljs';

export const questionTypeTranslations: Record<string, string> = {
    radio: 'Один из списка',
    checkbox: 'Несколько из списка',
    select: 'Выпадающий список',
    scale: 'Шкала',
    text: 'Текстовый ответ',
    default: 'Неизвестный тип'
};

export const translateQuestionType = (type: string): string => {
    return questionTypeTranslations[type] || questionTypeTranslations.default;
};

export const sanitizeFilename = (name: string): string => {
    return name.replace(/[/\\?%*:|"<>]/g, '-').substring(0, 100);
};

export const fetchQuestionnaireData = async (id: string) => {
    try {
        const response = await apiClient.get(`/questionnaire/${id}`);
        return response.data;
    } catch (error) {
        console.error("Ошибка загрузки анкеты:", error);
        throw new Error("Не удалось загрузить данные анкеты");
    }
};

export const processQuestionnaireAnswers = (questionnaire: Questionnaire): Attempt[] => {
    if (!questionnaire?.questions) return [];

    let allAnswersRaw: {
        userId: string;
        userName: string;
        isAnonymous: boolean;
        questionId: string;
        questionRealId?: string;
        questionText: string;
        questionType: string;
        answerText: string;
        createdAt: Date;
    }[] = [];

    questionnaire.questions.forEach((question) => {
        const questionIdentifier = question.id ?? question.text;
        const questionType = question.type || 'unknown';

        if (question.answers?.length) {
            question.answers.forEach((answer) => {
                let currentAnswerText = answer.selectedOptionText ?? answer.text;
                if (currentAnswerText === null || currentAnswerText === undefined || String(currentAnswerText).trim() === '') {
                    return;
                }

                currentAnswerText = String(currentAnswerText);
                allAnswersRaw.push({
                    userId: answer.userId || `anonymous_${Date.now()}_${Math.random()}`,
                    userName: answer.isAnonymous ? "Анонимный пользователь" : (answer.userName || "Пользователь"),
                    isAnonymous: !!answer.isAnonymous,
                    questionId: questionIdentifier,
                    questionRealId: question.id,
                    questionText: question.text,
                    questionType: questionType,
                    answerText: currentAnswerText,
                    createdAt: new Date(answer.createdAt),
                });
            });
        }
    });

    if (allAnswersRaw.length === 0) return [];

    allAnswersRaw.sort((a, b) => {
        if (a.userId < b.userId) return -1;
        if (a.userId > b.userId) return 1;
        return a.createdAt.getTime() - b.createdAt.getTime();
    });

    const attempts: Attempt[] = [];
    let currentAttempt: Attempt | null = null;
    let questionsAnsweredInCurrentAttempt = new Set<string>();

    allAnswersRaw.forEach((answer) => {
        let startNewAttempt = false;
        const isCheckbox = answer.questionType === 'checkbox';

        if (!currentAttempt || answer.userId !== currentAttempt.userId) {
            startNewAttempt = true;
        } else {
            const alreadyAnswered = questionsAnsweredInCurrentAttempt.has(answer.questionId);
            if (alreadyAnswered && !isCheckbox) {
                startNewAttempt = true;
            }
        }

        if (startNewAttempt) {
            currentAttempt = {
                attemptId: `${answer.userId}-${answer.createdAt.getTime()}-${Math.random().toString(16).slice(2)}`,
                userId: answer.userId,
                userName: answer.userName,
                isAnonymous: answer.isAnonymous,
                startTime: answer.createdAt,
                answers: {},
                groupedAnswers: [],
                lastAnswerTimestamp: answer.createdAt.getTime(),
                attemptNumber: 0
            };
            attempts.push(currentAttempt);
            questionsAnsweredInCurrentAttempt = new Set();
        }

        if (currentAttempt) {
            questionsAnsweredInCurrentAttempt.add(answer.questionId);
            const questionId = answer.questionId;

            if (!currentAttempt.answers[questionId]) {
                currentAttempt.answers[questionId] = {
                    questionRealId: answer.questionRealId,
                    questionText: answer.questionText,
                    questionType: answer.questionType,
                    answerTexts: [answer.answerText],
                    firstAnswerTime: answer.createdAt.getTime()
                };
            } else {
                if (!currentAttempt.answers[questionId].answerTexts.includes(answer.answerText)) {
                    currentAttempt.answers[questionId].answerTexts.push(answer.answerText);
                }
            }

            currentAttempt.lastAnswerTimestamp = Math.max(
                currentAttempt.lastAnswerTimestamp,
                answer.createdAt.getTime()
            );
        }
    });

    const finalUserAttemptCounts: Record<string, number> = {};

    attempts.forEach(attempt => {
        attempt.groupedAnswers = Object.values(attempt.answers)
            .sort((a, b) => a.firstAnswerTime - b.firstAnswerTime);

        if (!finalUserAttemptCounts[attempt.userId]) {
            finalUserAttemptCounts[attempt.userId] = 0;
        }
        finalUserAttemptCounts[attempt.userId]++;
        attempt.attemptNumber = finalUserAttemptCounts[attempt.userId];
    });

    return attempts;
};

export const groupAttemptsByUser = (attemptsToGroup: Attempt[]): UserAttempts[] => {
    if (!attemptsToGroup || attemptsToGroup.length === 0) return [];
    const usersData: Record<string, UserAttempts> = {};

    attemptsToGroup.forEach(attempt => {
        if (!usersData[attempt.userId]) {
            usersData[attempt.userId] = {
                userId: attempt.userId,
                userName: attempt.userName,
                isAnonymous: attempt.isAnonymous,
                attempts: [],
                firstAttemptTime: attempt.startTime.getTime(),
                lastAttemptTime: attempt.lastAnswerTimestamp
            };
        }
        usersData[attempt.userId].attempts.push(attempt);
        usersData[attempt.userId].firstAttemptTime = Math.min(
            usersData[attempt.userId].firstAttemptTime,
            attempt.startTime.getTime()
        );
        usersData[attempt.userId].lastAttemptTime = Math.max(
            usersData[attempt.userId].lastAttemptTime,
            attempt.lastAnswerTimestamp
        );
    });

    let usersArray = Object.values(usersData);
    usersArray.sort((a, b) => b.lastAttemptTime - a.lastAttemptTime);
    usersArray.forEach(user => {
        user.attempts.sort((a, b) => a.attemptNumber - b.attemptNumber);
    });

    return usersArray;
};

export const exportToExcel = async (questionnaire: Questionnaire, allAttempts: Attempt[], id: string) => {
    if (!questionnaire || !allAttempts || allAttempts.length === 0) {
        throw new Error("Нет данных для экспорта");
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'AnketaApp';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Лист с вопросами
    const ws_questions = workbook.addWorksheet("Вопросы и опции");
    ws_questions.columns = [
        { header: 'Текст вопроса', key: 'text', width: 60 },
        { header: 'Тип вопроса', key: 'type', width: 20 },
        { header: 'Варианты / Детали шкалы', key: 'options', width: 70 }
    ];
    ws_questions.getRow(1).font = { bold: true };

    questionnaire.questions.forEach(q => {
        let optionsText = "";
        const choiceTypes = ["radio", "checkbox", "select"];

        if (choiceTypes.includes(q.type)) {
            optionsText = q.options?.map(o => o.optionText).join(", ") || "Нет опций";
        } else if (q.type === "scale") {
            const scaleAnswer = q.answers?.find(a => a.text?.includes('|'));
            const scaleParts = scaleAnswer?.text?.split('|') || q.text?.split('|');
            optionsText = scaleParts?.length >= 3 ?
                `Лево: ${scaleParts[1] || "?"} | Право: ${scaleParts[2] || "?"} | Делений: ${scaleParts[3] || "?"}` :
                "(Детали шкалы не найдены)";
        } else if (q.type === "text") {
            optionsText = "(Открытый ответ)";
        } else {
            optionsText = `(Тип: ${q.type})`;
        }

        ws_questions.addRow({
            text: q.text,
            type: translateQuestionType(q.type),
            options: optionsText
        });
    });

    ws_questions.eachRow({ includeEmpty: false }, function (row) {
        row.alignment = { vertical: 'top', wrapText: true };
    });

    // Лист с открытыми ответами
    const ws_open_answers = workbook.addWorksheet("Открытые ответы");
    ws_open_answers.columns = [
        { header: 'ID Попытки', key: 'attemptId', width: 20 },
        { header: 'ID Пользователя', key: 'userId', width: 15 },
        { header: 'Имя Пользователя', key: 'userName', width: 25 },
        { header: 'Аноним', key: 'isAnonymous', width: 10 },
        { header: 'Вопрос', key: 'questionText', width: 50 },
        { header: 'Ответ', key: 'answerText', width: 60 },
        { header: 'Время ответа', key: 'answerTime', width: 20, style: { numFmt: 'dd/mm/yyyy hh:mm:ss' } }
    ];
    ws_open_answers.getRow(1).font = { bold: true };

    let hasOpenAnswers = false;
    allAttempts.forEach(attempt => {
        attempt.groupedAnswers.forEach(answerGroup => {
            if (answerGroup.questionType === 'text') {
                answerGroup.answerTexts.forEach(text => {
                    hasOpenAnswers = true;
                    ws_open_answers.addRow({
                        attemptId: attempt.attemptId.substring(0, 15) + '...',
                        userId: attempt.userId,
                        userName: attempt.userName,
                        isAnonymous: attempt.isAnonymous ? "Да" : "Нет",
                        questionText: answerGroup.questionText,
                        answerText: text,
                        answerTime: new Date(answerGroup.firstAnswerTime)
                    });
                });
            }
        });
    });

    if (!hasOpenAnswers) ws_open_answers.addRow({ questionText: "Нет открытых ответов." });
    ws_open_answers.eachRow({ includeEmpty: false }, function (row) {
        row.alignment = { vertical: 'top', wrapText: true };
    });

    // Лист со всеми ответами
    const ws_all_answers = workbook.addWorksheet("Все ответы");
    ws_all_answers.columns = [
        { header: 'Номер Попытки', key: 'attemptNumber', width: 15 },
        { header: 'Имя Пользователя', key: 'userName', width: 25 },
        { header: 'Текст Вопроса', key: 'questionText', width: 50 },
        { header: 'Тип Вопроса', key: 'questionType', width: 15 },
        { header: 'Текст Ответа', key: 'answerText', width: 60 },
        { header: 'Время Ответа', key: 'answerTime', width: 20, style: { numFmt: 'dd/mm/yyyy hh:mm:ss' } }
    ];
    ws_all_answers.getRow(1).font = { bold: true };

    const sortedAttempts = [...allAttempts].sort((a, b) => {
        const nameA = (a.userName || '').toLowerCase();
        const nameB = (b.userName || '').toLowerCase();
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        return a.attemptNumber - b.attemptNumber;
    });

    const colorPalette = ['FFFFE0B3', 'FFADD8E6', 'FF90EE90', 'FFFFB6C1', 'FFE6E6FA', 'FFFFFACD', 'FFF0E68C', 'FFB0E0E6'];
    const userColorMap = new Map<string, string>();
    let colorIndex = -1;
    let currentUser: string | null = null;
    let hasAnyAnswers = false;

    sortedAttempts.forEach((attempt, index) => {
        if (attempt.userName !== currentUser) {
            if (index > 0) {
                ws_all_answers.addRow([]);
            }
            currentUser = attempt.userName;
            if (!userColorMap.has(currentUser)) {
                colorIndex = (colorIndex + 1) % colorPalette.length;
                userColorMap.set(currentUser, colorPalette[colorIndex]);
            }
        }

        const userColor = userColorMap.get(currentUser);

        attempt.groupedAnswers.forEach(answerGroup => {
            answerGroup.answerTexts.forEach(text => {
                hasAnyAnswers = true;
                const rowData = {
                    attemptNumber: attempt.attemptNumber,
                    userName: attempt.userName,
                    questionText: answerGroup.questionText,
                    questionType: translateQuestionType(answerGroup.questionType),
                    answerText: text,
                    answerTime: new Date(answerGroup.firstAnswerTime)
                };

                ws_all_answers.addRow(rowData);
                const addedRow = ws_all_answers.lastRow;

                if (addedRow && userColor) {
                    addedRow.eachCell({ includeEmpty: true }, cell => {
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: userColor }
                        };
                    });
                }
            });
        });
    });

    if (!hasAnyAnswers) ws_all_answers.addRow({ questionText: "Нет ответов для отображения." });

    ws_all_answers.eachRow({ includeEmpty: true }, function (row, rowNumber) {
        if (rowNumber > 1 && Array.isArray(row.values) && (row.values as any[]).some(v => v !== null && v !== undefined && v !== '')) {
            row.alignment = { vertical: 'top', wrapText: true };
        }
    });
    const buffer = await workbook.xlsx.writeBuffer();
    const filename = sanitizeFilename(`Анализ_Данных_${questionnaire.title || `Анкета_${id}`}.xlsx`);
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

    return { blob, filename };
};