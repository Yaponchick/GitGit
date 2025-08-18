
import React, { useState } from 'react';

import './Answers.css';
import { useAnswersLogic, PopupState } from './useAnswersLogic';
import { QuestionsList } from '../../component/AnswersComponent/QuestionRenderer';
import ErrorOutline from '../../img/Answers/ErrorOutline.png';


const AnswersPage: React.FC = () => {
  const [
    {
      ansTitle,
      questions,
      answers,
      isLoading,
      apiError,
      validationErrors,
      popup,
    },
    {
      handleSubmit,
      handleInputChange,
      handleCheckboxChange,
      showPopup,
    },
  ] = useAnswersLogic();

  if (isLoading && !questions.length && !apiError) {
    return <div className="loading-indicator">Загрузка анкеты...</div>;
  }

  if (apiError && !isLoading && questions.length === 0) {
    return (
      <div className="ans-page-vh">
        <div className="ans-page">
          <div className="error-message-answers">{apiError}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="ans-page-vh">
      <div className="ans-page">
        {apiError && <div className="error-message-answers api-error-top">{apiError}</div>}
        {questions.length > 0 && (
          <>
            <div className="answers-title">
              <span className="ans-title">{ansTitle}</span>
            </div>

            <QuestionsList
              questions={questions}
              answers={answers}
              validationErrors={validationErrors}
              handleInputChange={handleInputChange}
              handleCheckboxChange={handleCheckboxChange}
            />
            {popup.visible && (
              <div
                className="error-popup"
              >
                <div className='popup-container'>
                  <img src={ErrorOutline} alt="icons-tick-question" className="ErrorOutlineIcon" />
                  {popup.text}
                </div>
              </div>
            )}
            <div className="ButtonSaveContainerAnswers">
              <button
                className="ButtonSaveAnswers"
                onClick={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? 'Отправка...' : 'ОТПРАВИТЬ'}
              </button>
            </div>

          </>
        )}
        {!isLoading && questions.length === 0 && !apiError && (
          <div className="no-questions-message">В этой анкете пока нет вопросов</div>
        )}
      </div>

    </div>
  );
};

export default AnswersPage;