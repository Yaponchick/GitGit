import React, { useEffect, useState, useMemo } from "react";
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { QuestionsList } from '../../component/AnswersComponent/QuestionRenderer';
import { usePublishToggle } from '../../hook/usePublishToggle';

import {
    fetchQuestionnaireData,
    processQuestionnaireAnswers,
    groupAttemptsByUser,
    exportToExcel,
} from "./AnalysisLogic";
import "./analysis.css";
import GraphComponent from "./GraphComponent";
import ButtonMenuComponent from '../../component/ButtonMenu/ButtonMenuComponent';
import ModalLink from '../../component/modal/modalLinik/modalLink';
import DiagrammIcon from '../../img/analysis/DiagrammIcon.png';
import AnswersIcon from '../../img/analysis/AnswersIcon.png';
import { Questionnaire, Attempt, UserAttempts } from "./types";

// Компонент для отображения загрузки
const LoadingSpinner: React.FC = () => {
    return (
        <div className="loading-spinner-container">
            <div className="loading-spinner"></div>
            <p>Загрузка данных...</p>
        </div>
    );
};

const AnalysisPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const navigate = useNavigate();

    const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
    const [publishedLink, setPublishedLink] = useState<string | null>(location.state?.link || null);
    const [loading, setLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const [createType, setCreateType] = useState('anketa');
    const [createTypeAnalysis, setCreateTypeAnalysis] = useState('diagram');
    const [isModalOpenLink, setIsModalOpenLink] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const { isPublished, setIsPublished, handleTogglePublish } = usePublishToggle(false, id);

    // Обработчик для кнопки "Редактировать"
    const handleEditClick = () => {
        if (id) {
            navigate(`/edit-survey/${id}`);
        } else {
            console.error("Нет ID для редактирования");
            alert("Не удалось определить ID анкеты для редактирования.");
        }
    };

    // Обработчик для кнопки "Удалить"
    const handleDelete = async () => {
        if (!id) return;

        setIsDeleting(true);
        try {
            await apiClient.delete(`/questionnaire/${id}`);
            navigate('/account');
        } catch (error) {
            console.error('Ошибка при удалении:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            if (!id) return;
            setLoading(true);
            try {
                const data = await fetchQuestionnaireData(id);
                setQuestionnaire(data);
                if (data.link) {
                    setPublishedLink(data.link);
                }
                setIsPublished(!!data.isPublished);
            } catch (error) {
                console.error("Ошибка загрузки данных анкеты:", error);
                alert("Не удалось загрузить данные анкеты. Пожалуйста, попробуйте позже.");
                navigate("/account");
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [id, navigate]);

    const allAttempts = useMemo<Attempt[]>(() => {
        if (!questionnaire) return [];
        return processQuestionnaireAnswers(questionnaire);
    }, [questionnaire]);

    const usersWithGroupedAttempts = useMemo<UserAttempts[]>(() => {
        return groupAttemptsByUser(allAttempts);
    }, [allAttempts]);

    const handleExportToExcel = async () => {
        if (!questionnaire || !allAttempts || allAttempts.length === 0) {
            alert("Нет данных для экспорта.");
            return;
        }

        setIsExporting(true);
        try {
            const { blob, filename } = await exportToExcel(questionnaire, allAttempts, id!);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Ошибка при экспорте в Excel:", error);
            alert("Произошла ошибка при формировании Excel файла.");
        } finally {
            setIsExporting(false);
        }
    };

    const filteredUsers = usersWithGroupedAttempts.filter((user) =>
        user.userName.toLowerCase().includes(searchTerm.toLowerCase().trim())
    );

    if (loading) {
        return <div className="analysis-page"><LoadingSpinner /></div>;
    }

    if (!questionnaire || !Array.isArray(questionnaire.questions)) {
        return (
            <div className="analysis-page error-page">
                <h1 className="analysis-title error-title">Ошибка</h1>
                <p className="error-message">Анкета не найдена или в ней нет вопросов.</p>
                <button onClick={() => navigate("/account")} className="btn btn-back">Вернуться</button>
            </div>
        );
    }

    function linkModal() {
        setIsModalOpenLink(true);
    }

    const mapQuestionType = (type: string): number => {
        switch (type) {
            case 'text': return 1;
            case 'radio': return 2;
            case 'checkbox': return 3;
            case 'scale': return 4;
            case 'select': return 5;
            default: return 1;
        }
    };

    const adaptedQuestions = questionnaire.questions.map(q => ({
        id: parseInt(q.id || '0') || 0,
        text: q.text,
        questionTypeId: mapQuestionType(q.type),
        options: q.options?.map((opt, idx) => ({
            id: idx + 1,
            optionText: opt.optionText,
            order: idx + 1
        })) || [],
        divisions: 5,
        leftScaleValue: 'Минимум',
        rightScaleValue: 'Максимум'
    }));

    return (
        <div className="analysis-page-vh">
            <div className="analysis-page-contaier">

                <ButtonMenuComponent
                    createType={createType}
                    setCreateType={setCreateType}
                    isLoading={isDeleting}
                    publishedLink={publishedLink}
                    linkModal={linkModal}
                    onDeleteClick={handleDelete}
                    disabled={false}
                    width={'1200px'}
                    handleEditClick={handleEditClick}
                    isPublished={isPublished}
                    onTogglePublish={handleTogglePublish}


                />

                <div className="analysis-title-container">
                    <div className="analysis-title"> {questionnaire.title || "Анализ ответов"} </div>
                </div>

                {createType === 'analysis' ? (
                    <div className="analysis-page">
                        <div className="ButtonMenuContainer-inner">
                            <div className="Type-Switcher-inner">
                                <button className={`Switch-button-inner ${createTypeAnalysis === 'diagram' ? 'active' : ''}`}
                                    onClick={() => setCreateTypeAnalysis('diagram')}>
                                    <img src={DiagrammIcon} alt="icons-diagram-question" className="InnerMenuIcon" />
                                    ДИАГРАММЫ
                                </button>
                                <button className={`Switch-button-inner ${createTypeAnalysis === 'AnalysisAnswers' ? 'active' : ''}`}
                                    onClick={() => setCreateTypeAnalysis('AnalysisAnswers')}>
                                    <img src={AnswersIcon} alt="icons-answers-question" className="InnerMenuIcon" />
                                    ОТВЕТЫ
                                </button>
                            </div>
                            <button className="publishButton-inner" type="button" onClick={handleExportToExcel} disabled={isExporting}>
                                {isExporting ? 'ЭКСПОРТ...' : 'СКАЧАТЬ XLS'}
                            </button>
                        </div>

                        {createTypeAnalysis === 'AnalysisAnswers' ? (
                            <div className="detailed-answers-section">
                                <div className="searchTermInput">
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Поиск по имени"
                                    />
                                </div>

                                {filteredUsers.length > 0 ? (
                                    <div className="table-wrapper" style={{ overflowX: 'auto' }}>
                                        <table className="survey-table">
                                            <thead>
                                                <tr>
                                                    <th style={{ minWidth: '130px' }}>Фамилия И.О.</th>
                                                    <th style={{ minWidth: '130px' }}>Дата</th>
                                                    {questionnaire.questions.map((q) => (
                                                        <th key={q.id || q.text} style={{ minWidth: '180px' }}>
                                                            {q.text}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredUsers.map((user) => {
                                                    const attempt = user.attempts[0];
                                                    if (!attempt) return null;

                                                    const answerMap = new Map<string, string>();
                                                    attempt.groupedAnswers.forEach((ag) => {
                                                        answerMap.set(ag.questionText, ag.answerTexts.join(', ') || '(нет ответа)');
                                                    });

                                                    const activityDate = new Date(attempt.startTime).toLocaleString('ru-RU');

                                                    return (
                                                        <tr key={user.userId}>
                                                            <td>{user.userName}</td>
                                                            <td>{activityDate}</td>
                                                            {questionnaire.questions.map((q) => (
                                                                <td key={`${user.userId}-${q.id || q.text}`}>
                                                                    {answerMap.get(q.text) || '(нет ответа)'}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="no-answers">Нет данных для отображения — пока никто не ответил на анкету.</p>
                                )}
                            </div>
                        ) : (
                            <GraphComponent questions={questionnaire.questions} />
                        )}
                    </div>
                ) : (
                    <div className="analysis-page">
                        <QuestionsList
                            questions={adaptedQuestions}
                            answers={{}}
                            validationErrors={{}}
                            handleInputChange={() => { }}
                            handleCheckboxChange={() => { }}
                            readOnly={false}
                        />
                    </div>
                )}
            </div>
            {isModalOpenLink && (
                <ModalLink
                    isOpen={isModalOpenLink}
                    onClose={() => setIsModalOpenLink(false)}
                    link={publishedLink || 'https://ссылкиНет.ru'}
                />
            )}
        </div>
    );
};

export default AnalysisPage;