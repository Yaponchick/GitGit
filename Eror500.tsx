import { useNavigate } from 'react-router-dom';


import './Eror404.css'

import eror404 from '../../img/Eror/Eror500Icon.png';


function Eror500() {
    const navigate = useNavigate();

    return (
        <div className="Eror-container">
            <div className="Eror-container-inner">
                <img src={eror404} alt="Ошибка 404" className="eror-icon" />
                <div className="eror-text">Ошибка сервера<br />
                    <div className='eror-text-inner'>
                        На сервера произошла непредвиденная ошибка <br />
                        Пожалуйста, подождите, вскоре она будет исправлена 
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Eror500;