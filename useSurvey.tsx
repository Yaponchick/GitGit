import { useState, useEffect, useRef, useCallback, useMemo, DragEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { AxiosInstance } from 'axios';
import { Question, Answer } from './Question'
import { usePublishToggle } from '../../hook/usePublishToggle';

const ANIMATION_DURATION = 450;
const typedApiClient: AxiosInstance = apiClient;

export type QuestionType = "Открытый" | "Закрытый" | "Множественный выбор" | "Шкала" | "Выпадающий список";

interface QuestionErrors {
    [key: string]: string;
}

export const useSurvey = (surveyId?: string) => {
    const navigate = useNavigate();
    const isEditMode = !!surveyId;

    const [title, setTitle] = useState('');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [questionErrors, setQuestionErrors] = useState<QuestionErrors>({});
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [dropdownsOpen, setDropdownsOpen] = useState<{ [key: string]: boolean }>({});
    const [deletedQuestionIds, setDeletedQuestionIds] = useState<string[]>([]);
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [dragOverId, setDragOverId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [pendingQuestions, setPendingQuestions] = useState<Question[] | null>(null);
    const { isPublished, setIsPublished, handleTogglePublish } = usePublishToggle(false, surveyId);

    const questionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

    const questionIndices = useMemo(() => {
        const indices: { [key: string]: number } = {};
        questions.forEach((q, index) => {
            indices[q.uniqueId] = index;
        });
        return indices;
    }, [questions]);

    const draggedIndex = useMemo(() => (draggedId ? questionIndices[draggedId] : -1), [draggedId, questionIndices]);

    const getQuestionIdentifier = (q: Question): string => q.uniqueId;
    const getAnswerIdentifier = (a: Answer): string => a.uniqueId;

    const questionTypeMapping = {
        "Открытый": 1, "Закрытый": 2, "Множественный выбор": 3, "Шкала": 4, "Выпадающий список": 5,
        "text": 1, "radio": 2, "checkbox": 3, "scale": 4, "select": 5
    };

    const updateDisplayIds = (currentQuestions: Question[]): Question[] => {
        return currentQuestions.map((q, index) => ({ ...q, displayId: index + 1 }));
    };

    const setQuestionRef = (id: string, element: HTMLDivElement | null) => {
        if (element) {
            questionRefs.current[id] = element;
        } else {
            delete questionRefs.current[id];
        }
    };

    const clearAnimationState = (uniqueId: string) => {
        setQuestions(prev => prev.map(q =>
            getQuestionIdentifier(q) === uniqueId && q.animationState ? { ...q, animationState: null } : q
        ));
    };

    useEffect(() => {
        if (isEditMode && surveyId) {
            fetchSurveyData(surveyId);
        }
    }, [surveyId, isEditMode]);

    useEffect(() => {
        questions.forEach(q => {
            if (q.isNew) {
                const element = questionRefs.current[getQuestionIdentifier(q)];
                if (element) {
                    element.classList.add('question-enter');
                    requestAnimationFrame(() => {
                        element.classList.remove('question-enter');
                    });
                }
                const timer = setTimeout(() => {
                    setQuestions(prev => prev.map(pq => getQuestionIdentifier(pq) === getQuestionIdentifier(q) ? { ...pq, isNew: false } : pq));
                }, ANIMATION_DURATION);
                return () => clearTimeout(timer);
            }
        });
    }, [questions]);

    useEffect(() => {
        if (dragOverId === null) {
            setQuestions(prev => prev.map(q =>
                q.animationState?.startsWith('make-space') ? { ...q, animationState: null } : q
            ));
        }
    }, [dragOverId]);

    const fetchSurveyData = async (qId: string) => {
        setIsLoading(true);
        try {
            setError("");
            const { data } = await typedApiClient.get(`/questionnaire/${qId}`);
            if (!data || !Array.isArray(data.questions)) {
                throw new Error("Некорректный формат данных анкеты.");
            }

            const processedQuestions = data.questions.map((q: any, index: number) => {
                const typeId = q.questionType ?? questionTypeMapping[q.type as keyof typeof questionTypeMapping];
                const displayType = Object.keys(questionTypeMapping).find(key =>
                    questionTypeMapping[key as keyof typeof questionTypeMapping] === typeId && isNaN(parseInt(key))
                ) as QuestionType || "Открытый";

                let baseQuestion: Question = {
                    id: q.id,
                    uniqueId: q.uniqueId || `client_${q.id || Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                    displayId: index + 1,
                    type: displayType,
                    text: q.text || "",
                    answers: [],
                    leftScaleValue: "",
                    rightScaleValue: "",
                    divisions: 5,
                    isNew: false,
                    isDeleting: false,
                    animationState: null,
                };

                if (displayType === "Шкала") {
                    const parts = q.text.split('|');
                    if (parts.length >= 4) {
                        baseQuestion.text = parts[0] || '';
                        baseQuestion.leftScaleValue = parts[1] || '';
                        baseQuestion.rightScaleValue = parts[2] || '';
                        baseQuestion.divisions = parseInt(parts[3], 10) || 5;
                    } else {
                        baseQuestion.text = q.text;
                    }
                }

                if (["Закрытый", "Множественный выбор", "Выпадающий список"].includes(displayType)) {
                    baseQuestion.answers = q.options?.map((o: any) => ({
                        id: o.id, uniqueId: `temp_opt_${o.id}`, text: o.optionText || "",
                        isNew: false, isDeleting: false,
                    })) || [];
                }
                return baseQuestion;
            });

            setTitle(data.title);
            setIsPublished(!!data.isPublished);
            setQuestions(updateDisplayIds(processedQuestions));
        } catch (err: any) {
            console.error('Ошибка при загрузке анкеты:', err);
            setError(`Не удалось загрузить анкету: ${err.response?.data?.message || err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const validateQuestions = (): boolean => {
        const errors: QuestionErrors = {};
        let isValid = true;

        if (!title.trim()) {
            setError("Название анкеты должно быть заполнено");
            isValid = false;
        } else if (title.length > 250) {
            setError("Название анкеты не может превышать 250 символов");
            isValid = false;
        }

        questions.forEach((question) => {
            if (question.isDeleting) return;
            const errorKey = question.displayId;

            if (!question.text.trim() && question.type !== "Шкала") {
                errors[errorKey] = "Текст вопроса не может быть пустым";
                isValid = false;
            } else if (question.text.length > 250) {
                errors[errorKey] = "Текст вопроса не может превышать 250 символов";
                isValid = false;
            }

            if (question.type === "Шкала") {
                const hasLeft = question.leftScaleValue.trim();
                const hasRight = question.rightScaleValue.trim();

                if (!hasLeft) {
                    errors[errorKey] = "Левое значение шкалы обязательно";
                    isValid = false;
                } else if (!hasRight) {
                    errors[errorKey] = "Правое значение шкалы обязательно";
                    isValid = false;
                } else if (question.divisions < 2) {
                    errors[errorKey] = "Минимум 2 деления";
                    isValid = false;
                } else if (question.divisions > 10) {
                    errors[errorKey] = "Максимум 10 делений";
                    isValid = false;
                } else if (question.leftScaleValue.length > 250 || question.rightScaleValue.length > 250) {
                    errors[errorKey] = "Значения шкалы не могут превышать 250 символов";
                    isValid = false;
                }
            }

            if (["Закрытый", "Множественный выбор", "Выпадающий список"].includes(question.type)) {
                if (!question.answers || question.answers.length < 2) {
                    errors[errorKey] = "Необходимо как минимум два варианта ответа";
                    isValid = false;
                } else {
                    const emptyAnswers = question.answers.filter(a => !a.text.trim());
                    if (emptyAnswers.length > 0) {
                        errors[errorKey] = "Варианты ответов не могут быть пустыми";
                        isValid = false;
                    } else {
                        const invalidAnswers = question.answers.filter(a => a.text.length > 250);
                        if (invalidAnswers.length > 0) {
                            errors[errorKey] = "Варианты ответов не могут превышать 250 символов";
                            isValid = false;
                        }
                    }
                }
            }
        });

        setQuestionErrors(errors);
        return isValid;
    };

    const handleSaveOrUpdate = () => {
        if (!validateQuestions()) {
            return;
        }
        if (isEditMode) {
            handleUpdate();
        } else {
            handleCreate();
        }

    };

    const handleUpdate = async () => {
        if (!surveyId || isLoading) return;
        setIsLoading(true);

        try {
            await typedApiClient.put(`/questionnaire/${surveyId}/title`, { NewTitle: title });

            const questionsToProcess = questions.filter(q => !q.isDeleting);
            for (const question of questionsToProcess) {
                const isNewQuestion = !question.id;
                let backendId = question.id;
                const questionTypeId = questionTypeMapping[question.type as keyof typeof questionTypeMapping];
                const questionTextPayload = (question.type === "Шкала")
                    ? `${question.text || ''}|${question.leftScaleValue || ""}|${question.rightScaleValue || ""}|${question.divisions || 5}`
                    : question.text;

                if (isNewQuestion) {
                    const response = await typedApiClient.post(`/questionnaire/${surveyId}/questions/add-question`, {
                        Text: questionTextPayload, QuestionType: questionTypeId,
                    });
                    backendId = response.data.questionId;


                } else if (backendId) {
                    await typedApiClient.put(`/questionnaire/${surveyId}/questions/${backendId}/text`, { NewText: questionTextPayload });
                    await typedApiClient.put(`/questionnaire/${surveyId}/questions/${backendId}/type`, { NewQuestionType: questionTypeId });
                }

                if (["Закрытый", "Множественный выбор", "Выпадающий список"].includes(question.type) && backendId) {
                    for (const answer of question.answers) {
                        if (answer.isDeleting && answer.id) {
                            await typedApiClient.delete(`/questionnaire/${surveyId}/questions/${backendId}/options/${answer.id}`);

                        } else if (!answer.id && !answer.isDeleting && answer.text.trim()) {
                            await typedApiClient.post(`/questionnaire/${surveyId}/questions/${backendId}/options`, { OptionText: answer.text });
                        } else if (answer.id && !answer.isDeleting && answer.text.trim()) {
                            await typedApiClient.put(`/questionnaire/${surveyId}/questions/${backendId}/options/${answer.id}`, { NewOptionText: answer.text });
                        }
                    }
                }
            }

            for (const deletedId of deletedQuestionIds) {
                await typedApiClient.delete(`/questionnaire/${surveyId}/questions/${deletedId}`);
            }

            setDeletedQuestionIds([]);
            navigate('/account');

        } catch (err: any) {
            console.error('Ошибка при сохранении анкеты:', err);
            setError(`Ошибка при сохранении: ${err.response?.data?.message || err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = () => {
        setPendingQuestions(questions.filter(q => !q.isDeleting));
        setIsModalOpen(true);
    };

    const confirmSave = async (publish: boolean): Promise<{ link: string; id: string } | undefined> => {
        if (!pendingQuestions || isLoading) return;
        setIsLoading(true);
        try {
            const res = await typedApiClient.post('/questionnaire/create', { Title: title });
            const questionnaireId = res.data.questionnaireId;
            const link = res.data.link;

            // Добавляем вопросы
            for (const question of pendingQuestions) {
                const questionTypeId = questionTypeMapping[question.type as keyof typeof questionTypeMapping];
                const questionTextPayload = (question.type === "Шкала")
                    ? `${question.text || ''}|${question.leftScaleValue || ""}|${question.rightScaleValue || ""}|${question.divisions || 5}`
                    : question.text;

                const qRes = await typedApiClient.post(`/questionnaire/${questionnaireId}/questions/add-question`, {
                    Text: questionTextPayload, QuestionType: questionTypeId,
                });
                const newQuestionId = qRes.data.questionId;

                if (["Закрытый", "Множественный выбор", "Выпадающий список"].includes(question.type)) {
                    for (const answer of question.answers.filter(a => !a.isDeleting && a.text.trim())) {
                        await typedApiClient.post(`/questionnaire/${questionnaireId}/questions/${newQuestionId}/options`, { OptionText: answer.text });
                    }
                }
            }

            if (publish) {
                await typedApiClient.put(`/questionnaire/${questionnaireId}/status`, { IsPublished: true });
            }

            setIsModalOpen(false);
            setPendingQuestions(null);

            return { link, id: questionnaireId };
        } catch (err: any) {
            console.error('Ошибка при создании анкеты:', err);
            setError(`Ошибка при создании: ${err.response?.data?.message || err.message}`);
            return undefined;
        } finally {
            setIsLoading(false);
        }
    };

    const cancelSave = () => {
        setIsModalOpen(false);
        setPendingQuestions(null);
    };

    const addNewQuestion = (afterIdentifier: string, type: QuestionType = "Открытый") => {
        if (questions.filter(q => !q.isDeleting).length >= 10) return;
        const newQuestion: Question = {
            id: null,
            uniqueId: `q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            displayId: 0,
            type,
            text: "",
            answers: [],
            leftScaleValue: "",
            rightScaleValue: "",
            divisions: 5,
            isNew: true,
            isDeleting: false,
            animationState: null,
        };

        if (["Закрытый", "Множественный выбор", "Выпадающий список"].includes(type)) {
            newQuestion.answers = [
                { id: null, uniqueId: `a_${Date.now()}_1`, text: "", isNew: true, isDeleting: false },
                { id: null, uniqueId: `a_${Date.now()}_2`, text: "", isNew: true, isDeleting: false }
            ];
        }

        setQuestions(prev => {
            const index = prev.findIndex(q => getQuestionIdentifier(q) === afterIdentifier);
            const insertIndex = index !== -1 ? index + 1 : prev.length;
            const updated = [...prev];
            updated.splice(insertIndex, 0, newQuestion);
            return updateDisplayIds(updated);
        });
    };

    const deleteQuestion = useCallback((identifier: string) => {

        const questionToDelete = questions.find(q => getQuestionIdentifier(q) === identifier);

        if (questionToDelete?.id) {
            setDeletedQuestionIds(prev => Array.from(new Set([...prev, questionToDelete.id!])));
        }

        setQuestions(prev => prev.map(q =>
            getQuestionIdentifier(q) === identifier
                ? { ...q, isDeleting: true, animationState: 'question-exit-active' }
                : q
        ));
        setTimeout(() => {
            setQuestions(prev => updateDisplayIds(prev.filter(q => getQuestionIdentifier(q) !== identifier)));
        }, ANIMATION_DURATION);
    }, [questions]);

    const moveQuestion = useCallback((uniqueId: string, direction: 'up' | 'down') => {
        const index = questionIndices[uniqueId];
        let targetIndex = -1;
        if (direction === 'up' && index > 0) targetIndex = index - 1;
        else if (direction === 'down' && index < questions.length - 1) targetIndex = index + 1;

        if (targetIndex !== -1) {
            setQuestions(prev => {
                const updated = [...prev];
                [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];
                return updateDisplayIds(updated);
            });
        }
    }, [questions, questionIndices]);

    const handleQuestionTextChange = (identifier: string, newText: string) => {
        setQuestions(prev => prev.map(q => getQuestionIdentifier(q) === identifier ? { ...q, text: newText } : q));
    };

    const handleOptionSelect = (identifier: string, option: QuestionType) => {
        setQuestions(prev => prev.map(q => {
            if (getQuestionIdentifier(q) === identifier) {
                const needsDefaultAnswers = ["Закрытый", "Множественный выбор", "Выпадающий список"].includes(option) && q.answers.filter(a => !a.isDeleting).length === 0;
                return {
                    ...q,
                    type: option,
                    answers: needsDefaultAnswers
                        ? [
                            { id: null, uniqueId: `a_${Date.now()}_1`, text: "", isNew: true, isDeleting: false },
                            { id: null, uniqueId: `a_${Date.now()}_2`, text: "", isNew: true, isDeleting: false }
                        ]
                        : q.answers,
                };
            }
            return q;
        }));
        setDropdownsOpen(prev => ({ ...prev, [identifier]: false }));
    };

    const addAnswer = (questionIdentifier: string) => {
        setQuestions(prev => prev.map(q => {
            if (getQuestionIdentifier(q) === questionIdentifier) {
                if (q.answers.filter(a => !a.isDeleting).length >= 10) {
                    setDeleteError("Нельзя добавить больше 10 ответов");
                    setTimeout(() => setDeleteError(null), 3000);
                    return q;
                }
                const newAnswer: Answer = {
                    id: null,
                    uniqueId: `a_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
                    text: "",
                    isNew: true,
                    isDeleting: false,
                };
                return { ...q, answers: [...q.answers, newAnswer] };
            }
            return q;
        }));
    };
    const deleteAnswer = (questionUniqueId: string, answerUniqueId: string) => {
        setQuestions(prev => prev.map(q => {
            if (q.uniqueId === questionUniqueId) {
                const activeAnswers = q.answers.filter(a => !a.isDeleting).length;
                if (activeAnswers <= 2) {
                    setDeleteError("Минимум 2 ответа");
                    setTimeout(() => setDeleteError(null), 3000);
                    return q;
                }
                return {
                    ...q,
                    answers: q.answers.map(a =>
                        a.uniqueId === answerUniqueId
                            ? { ...a, isDeleting: true }
                            : a
                    )
                };
            }
            return q;
        }));
    };

    const handleAnswerChange = (questionIdentifier: string, answerIdentifier: string, newText: string) => {
        setQuestions(prev => prev.map(q => {
            if (getQuestionIdentifier(q) === questionIdentifier) {
                return {
                    ...q,
                    answers: q.answers.map(a => getAnswerIdentifier(a) === answerIdentifier ? { ...a, text: newText } : a)
                };
            }
            return q;
        }));
    };

    const handleScaleChange = (identifier: string, field: "leftScaleValue" | "rightScaleValue" | "divisions", value: string | number) => {
        setQuestions(prev => prev.map(q => getQuestionIdentifier(q) === identifier ? { ...q, [field]: value } : q));
    };

    const handleDragStart = useCallback((e: DragEvent<HTMLDivElement>, uniqueId: string) => {
        e.dataTransfer.effectAllowed = 'move';
        setDraggedId(uniqueId);
        setTimeout(() => {
            const element = questionRefs.current[uniqueId];
            if (element) element.classList.add('dragging');
        }, 0);
    }, []);

    const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>, targetUniqueId: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (targetUniqueId === draggedId) {
            if (dragOverId && dragOverId !== targetUniqueId) clearAnimationState(dragOverId);
            setDragOverId(null);
            return;
        }
        if (targetUniqueId !== dragOverId) {
            if (dragOverId) clearAnimationState(dragOverId);
            setDragOverId(targetUniqueId);
            const targetIndex = questionIndices[targetUniqueId];
            if (draggedIndex !== -1 && targetIndex !== -1) {
                const direction = draggedIndex < targetIndex ? 'make-space-up' : 'make-space-down';
                setQuestions(prev => prev.map(q => getQuestionIdentifier(q) === targetUniqueId ? { ...q, animationState: direction } : q));
            }
        }
    }, [draggedId, dragOverId, questionIndices, draggedIndex]);

    const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>, uniqueId: string) => {
        const container = questionRefs.current[uniqueId];
        if (container && !container.contains(e.relatedTarget as Node)) {
            if (uniqueId === dragOverId) {
                clearAnimationState(uniqueId);
                setDragOverId(null);
            }
        }
    }, [dragOverId]);

    const handleDrop = useCallback((e: DragEvent<HTMLDivElement>, targetUniqueId: string) => {
        e.preventDefault();
        if (!draggedId || draggedId === targetUniqueId) {
            if (dragOverId) clearAnimationState(dragOverId);
            setDragOverId(null);
            if (draggedId && questionRefs.current[draggedId]) {
                questionRefs.current[draggedId]?.classList.remove('dragging');
            }
            setDraggedId(null);
            return;
        }
        const targetIndex = questionIndices[targetUniqueId];
        if (draggedIndex === -1 || targetIndex === -1) return;
        clearAnimationState(targetUniqueId);
        setQuestions(prevQuestions => {
            const updatedQuestions = [...prevQuestions];
            const [draggedItem] = updatedQuestions.splice(draggedIndex, 1);
            const cleanDraggedItem = { ...draggedItem, animationState: null, isNew: false, isDeleting: false };
            updatedQuestions.splice(targetIndex, 0, cleanDraggedItem);
            return updateDisplayIds(updatedQuestions.map(q => ({ ...q, isNew: false, isDeleting: false })));
        });
        if (questionRefs.current[draggedId]) {
            questionRefs.current[draggedId]?.classList.remove('dragging');
        }
        setDraggedId(null);
        setDragOverId(null);
    }, [draggedId, draggedIndex, questionIndices]);

    const handleDragEnd = useCallback(() => {
        if (draggedId && questionRefs.current[draggedId]) {
            questionRefs.current[draggedId]?.classList.remove('dragging');
        }
        if (dragOverId) clearAnimationState(dragOverId);
        setDraggedId(null);
        setDragOverId(null);
    }, [draggedId, dragOverId]);


    return {
        isEditMode,
        title,
        setTitle,
        questions,
        isLoading,
        error,
        questionErrors,
        deleteError,
        dropdownsOpen,
        setDropdownsOpen,
        draggedId,
        dragOverId,
        isModalOpen,
        getQuestionIdentifier,
        getAnswerIdentifier,
        handleSaveOrUpdate,
        addNewQuestion,
        deleteQuestion,
        moveQuestion,
        handleQuestionTextChange,
        handleOptionSelect,
        addAnswer,
        deleteAnswer,
        handleAnswerChange,
        handleScaleChange,
        setQuestionRef,
        handleDragStart,
        handleDragOver,
        handleDrop,
        handleDragEnd,
        handleDragLeave,
        confirmSave,
        cancelSave,
        isPublished,
        setIsPublished,
        handleTogglePublish,
    };
};

