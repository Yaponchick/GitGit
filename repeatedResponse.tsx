import '../thanks/thanks.css';

function repeatedResponse() {

    return (
        <div className="Thk-container">
            <div className="survey-pageThk">
                <div className="text-thk">Вы уже заполнили эту анкету</div>
                <div className="text-bottom">Отправить ответ на анкету можно только один раз</div>

            </div>
        </div>
    );
}

export default repeatedResponse;