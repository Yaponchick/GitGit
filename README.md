import './ButtonMenuStyle.css'

import SendIcon from '../../img/SurveyPage/SendIcon.png';
import DeleteAnketaIcon from '../../img/SurveyPage/DeleteAnketaIcon.png';
import EyeIcon from '../../img/SurveyPage/EyeIcon.png';
import StatisticIcon from '../../img/SurveyPage/StatisticIcon.png';

interface ButtonMenuProps {
    createType: string;
    setCreateType: (type: string) => void;
    isLoading: boolean;
    publishedLink: string | null;
    linkModal: () => void;
    onDeleteClick?: () => void;
    disabled: boolean;
    width?: string | number;
    handleEditClick?: () => void;
    showButton?: boolean;
    isPublished?: boolean;
    onTogglePublish?: () => void;
}

const ButtonMenuComponent: React.FC<ButtonMenuProps> = ({
    createType,
    setCreateType,
    isLoading,
    publishedLink,
    linkModal,
    onDeleteClick,
    disabled,
    width = '800px',
    handleEditClick,
    showButton = true,
    isPublished,
    onTogglePublish,

}) => {
    
    return (
        <div className="ButtonMenuContainer" style={{ maxWidth: width }}>
            <div className="Type-Switcher">
                <button className={`Switch-button-create 
                            ${createType === 'anketa' ? 'active' : ''}`}
                    onClick={() => setCreateType('anketa')}
                >
                    <img src={EyeIcon} alt="icons-eye-question" className="TickIconEyeStatistics" />
                    Анкета
                </button>
                <button disabled={disabled} className={`Switch-button-create
                            ${createType === 'analysis' ? 'active' : ''}`}
                    onClick={() => setCreateType('analysis')}
                >
                    <img src={StatisticIcon} alt="icons-statistic-question" className="TickIconEyeStatistics" />
                    Статистика
                </button>
            </div>
            <div className='buttonContainerLeft'>
                {showButton &&
                    <button className="btnEdit" onClick={handleEditClick}>
                        Редактировать
                    </button>
                }
                <button className={`publishButton ${isPublished ? 'unpublish' : 'publish'}`} onClick={onTogglePublish}
                    disabled={disabled}>
                    {isPublished ? 'Снять с публикации' : 'Опубликовать'}
                </button>
            </div>

            <button disabled={!publishedLink} onClick={linkModal} className="ButtonSendIcon" type="button">
                <img src={SendIcon} alt="icons-tick-question" className="TickIcon" />
            </button>
            <button disabled={disabled} onClick={onDeleteClick} className="ButtonSendIcon" type="button">
                <img src={DeleteAnketaIcon} alt="icons-tick-question" className="TickIcon" />
            </button>
        </div>
    );

}

export default ButtonMenuComponent;
