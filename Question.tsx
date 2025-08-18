import React, { FC, DragEvent, useState } from 'react';
import DeleteIcons from '../../img/SurveyPage/DeleteIcons.png';
import Plus from '../../img/SurveyPage/Plus.png';
import OpenIcon from '../../img/SurveyPage/Open_Icon.png';
import CloseIcon from '../../img/SurveyPage/Close_Icon.png';
import MultiIcon from '../../img/SurveyPage/Multi_Icon.png';
import ScaleIcon from '../../img/SurveyPage/Scale_Icon.png';

// Определяем возможные типы вопросов
export type QuestionType = "Открытый" | "Закрытый" | "Множественный выбор" | "Шкала" | "Выпадающий список";

// Объект с путями к иконкам
const questionTypeIcons = {
    "Открытый": OpenIcon,
    "Закрытый": CloseIcon,
    "Множественный выбор": MultiIcon,
    "Шкала": ScaleIcon,
    "Выпадающий список": MultiIcon,
};

// Интерфейс для объекта ответа
export interface Answer {
    id: string | null;
    uniqueId: string;
    text: string;
    isNew: boolean;
    isDeleting: boolean;
}

// Интерфейс для объекта вопроса
export interface Question {
    id: string | null;
    uniqueId: string;
    displayId: number;
    type: QuestionType;
    text: string;
    answers: Answer[];
    leftScaleValue: string;
    rightScaleValue: string;
    divisions: number;
    isNew: boolean;
    isDeleting: boolean;
    animationState: string | null;
}

// Тип для объекта с ошибками валидации
export interface QuestionErrors {
    [key: number]: string;
}

// --- Интерфейс для props компонента ---

interface QuestionComponentProps {
    question: Question;
    questionErrors: QuestionErrors;
    deleteError: string | null;
    dropdownsOpen: { [key: string]: boolean };
    onDropdownToggle: (uniqueId: string) => void;
    onOptionSelect: (uniqueId: string, option: QuestionType) => void;
    onTextChange: (uniqueId: string, newText: string) => void;
    onAnswerChange: (questionUniqueId: string, answerId: string, newText: string) => void;
    onAddAnswer: (questionUniqueId: string) => void;
    onDeleteAnswer: (questionUniqueId: string, answerId: string) => void;
    onScaleChange: (uniqueId: string, field: "leftScaleValue" | "rightScaleValue" | "divisions", value: string | number) => void;
    onAddNew: (uniqueId: string) => void;
    onMove: (uniqueId: string, direction: 'up' | 'down') => void;
    onDelete: (uniqueId: string) => void;
    onDragStart: (e: DragEvent<HTMLDivElement>, uniqueId: string) => void;
    onDragOver: (e: DragEvent<HTMLDivElement>, uniqueId: string) => void;
    onDrop: (e: DragEvent<HTMLDivElement>, uniqueId: string) => void;
    onDragEnd: () => void;
    onDragLeave: (e: DragEvent<HTMLDivElement>, uniqueId: string) => void;
    setQuestionRef: (id: string, element: HTMLDivElement | null) => void;
    isOnlyQuestion: boolean;
    isLastQuestion: boolean;
    canAddMoreQuestions: boolean;
}

const QuestionComponent: FC<QuestionComponentProps> = ({
    question,
    questionErrors,
    deleteError,
    dropdownsOpen,
    onDropdownToggle,
    onOptionSelect,
    onTextChange,
    onAnswerChange,
    onAddAnswer,
    onDeleteAnswer,
    onScaleChange,
    onAddNew,
    onMove,
    onDelete,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
    onDragLeave,
    setQuestionRef,
    isOnlyQuestion,
    isLastQuestion,
    canAddMoreQuestions,

}) => {

    const getQuestionContainerClassName = (q: Question): string => {
        let classes = ['question-container'];
        if (q.isDeleting) classes.push('question-exit-active');
        if (q.animationState) classes.push(q.animationState);
        return classes.join(' ');
    };

    const options: QuestionType[] = ["Открытый", "Закрытый", "Множественный выбор", "Шкала", "Выпадающий список"];

    return (
        <div
            ref={(el) => setQuestionRef(question.uniqueId, el)}
            className={getQuestionContainerClassName(question)}
            key={question.uniqueId}
            id={`question-cont-${question.uniqueId}`}
            draggable={!question.isDeleting}
            onDragStart={(e) => onDragStart(e, question.uniqueId)}
            onDragOver={(e) => onDragOver(e, question.uniqueId)}
            onDrop={(e) => onDrop(e, question.uniqueId)}
            onDragEnd={onDragEnd}
            onDragLeave={(e) => onDragLeave(e, question.uniqueId)}
        >

            <div className="question">
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', }}>
                        <img
                            src={questionTypeIcons[question.type]}
                            alt={question.type}
                            className='IconType-question'

                        />
                        <span className='Type_question'>{question.type}</span>

                        <div className="swap">
                            <button type="button" onClick={() => onMove(question.uniqueId, 'up')} disabled={question.displayId === 1 || !!question.animationState} style={{ opacity: (question.displayId === 1 || !!question.animationState) ? 0.3 : 1 }} title="Переместить вверх">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-arrow-up" viewBox="0 0 16 16"><path fillRule="evenodd" d="M8 15a.5.5 0 0 0 .5-.5V2.707l3.146 3.147a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0l-4 4a.5.5 0 1 0 .708.708L7.5 2.707V14.5a.5.5 0 0 0 .5.5" /></svg>
                            </button>
                            <button type="button" onClick={() => onMove(question.uniqueId, 'down')} disabled={isLastQuestion || !!question.animationState} style={{ opacity: (isLastQuestion || !!question.animationState) ? 0.3 : 1 }} title="Переместить вниз">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-arrow-down" viewBox="0 0 16 16"><path fillRule="evenodd" d="M8 1a.5.5 0 0 1 .5.5v11.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L7.5 13.293V1.5A.5.5 0 0 1 8 1" /></svg>
                            </button>
                            <button type="button" className="trash" onClick={() => onDelete(question.uniqueId)} disabled={isOnlyQuestion || !!question.animationState} style={{ opacity: (isOnlyQuestion || !!question.animationState) ? 0.3 : 1 }} title={isOnlyQuestion ? "Нельзя удалить единственный вопрос" : "Удалить этот вопрос"}>
                                <img src={DeleteIcons} alt="icons-delete-question" className="q-type-icon-box" />
                            </button>
                        </div>
                    </div>
                </div>

                <input
                    type="text"
                    placeholder={question.type === "Шкала" ? " Текст вопроса (необязательно)" : "Текст вопроса"}
                    value={question.text}
                    onChange={(e) => onTextChange(question.uniqueId, e.target.value)}
                    maxLength={200}
                    id={`question-text-${question.uniqueId}`}
                    aria-label={`Текст вопроса ${question.displayId}`}
                />

                {question.type === 'Открытый' && questionErrors[question.displayId] && <p className="error-message-create">{questionErrors[question.displayId]}</p>}

                {["Закрытый", "Множественный выбор", "Выпадающий список"].includes(question.type) && (
                    <div>
                        {question.answers
                            .filter(answer => !answer.isDeleting)
                            .map((answer, index) => (
                                <div key={answer.uniqueId} className="answer-container">
                                    <input
                                        type="text"
                                        placeholder={`Текст ответа ${index + 1}`}
                                        value={answer.text}
                                        onChange={(e) => onAnswerChange(question.uniqueId, answer.uniqueId, e.target.value)}
                                        maxLength={250}
                                    />
                                    {question.answers.filter(a => !a.isDeleting).length > 2 && (
                                        <button
                                            type="button"
                                            onClick={() => onDeleteAnswer(question.uniqueId, answer.uniqueId)}
                                            title="Удалить этот вариант"
                                            className="delete-button"
                                        >
                                            <img src={DeleteIcons} alt="icons-delete-question" className="q-type-icon-box" />
                                        </button>
                                    )}
                                </div>
                            ))
                        }

                        <div className='Error-transfer'>
                            {questionErrors[question.displayId] && <p className="error-message-create">{questionErrors[question.displayId]}</p>}
                        </div>

                        {deleteError && <p className="error-message-create">{deleteError}</p>}

                        <button type="button" className="add-button" onClick={() => onAddAnswer(question.uniqueId)} disabled={question.answers.length >= 10}>
                            {question.answers.length < 10 && (
                                <img src={Plus} alt="icons-delete-question" className="plus" />
                            )}
                            {question.answers.length >= 10 ? "Максимум вариантов" : "ДОБАВИТЬ ВАРИАТ"}
                        </button>
                    </div>
                )}

                {question.type === "Шкала" && (
                    <div>
                        <input
                            type="text"
                            placeholder="Левое значение шкалы"
                            value={question.leftScaleValue}
                            onChange={(e) => onScaleChange(question.uniqueId, "leftScaleValue", e.target.value)}
                            maxLength={50}
                        />
                        <input
                            type="text"
                            placeholder="Правое значение шкалы"
                            value={question.rightScaleValue}
                            onChange={(e) => onScaleChange(question.uniqueId, "rightScaleValue", e.target.value)}
                            maxLength={50}
                        />
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "gray", fontSize: "16px", marginTop: '10px' }}>
                            <label htmlFor={`divisions-${question.uniqueId}`}>количество делений:</label>
                            <input
                                id={`divisions-${question.uniqueId}`}
                                type="number"
                                min="2" max="10"
                                value={question.divisions}
                                onChange={(e) => onScaleChange(question.uniqueId, "divisions", parseInt(e.target.value, 10) || 2)}
                                style={{ width: "60px", textAlign: "center", padding: '3px', border: '1px solid #ccc', borderRadius: '4px' }}
                            />
                        </div>
                        {questionErrors[question.displayId] && <p className="error-message-create">{questionErrors[question.displayId]}</p>}
                    </div>
                )}
            </div>
        </div>

    );
};

export default QuestionComponent;


