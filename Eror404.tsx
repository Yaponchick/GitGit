import { useNavigate } from 'react-router-dom';


import './Eror404.css'

import eror404 from '../../img/Eror/eror404Icon.png';


function Eror404() {
    const navigate = useNavigate();

    return (
        <div className="Eror-container">
            <div className="Eror-container-inner">
                <img src={eror404} alt="Ошибка 404" className="eror-icon" />
                <div className="eror-text">Ошибка 404<br />
                    <div className='eror-text-inner'>
                        К сожалению, запрашиваемая <br />
                        Вами страница не найдена...
                    </div>
                </div>
                <button
                    className="eror-button"
                    onClick={() => navigate('/Account')}
                >
                    В личный кабинет
                </button>
            </div>
        </div>
    );
}

export default Eror404;