import './adminPanelStyle.css'

const adminPanel = () => {
    return (
        <div className='adminPanel-container'>
            <div className='adminPanel-inner-container'>
                <div className="tableAdmin-container">
                    <div className='headingText'>
                        Список пользователей
                    </div>
                    <div className='filterAdmin'>
                        <input
                            type="text"
                            placeholder="Поиск по ФИО"
                            // value={search}
                            // onChange={(e) => setSearch(e.target.value)}
                            aria-label="Поиск по ФИО"
                            className='inputSearch'
                        />
                        <button className='buttonAdmin'>Зарегистрировать</button>
                        <button className='buttonAdmin'>Список админов</button>

                    </div>
                    <table className="surveyAdmin-table">
                        <thead>
                            <tr>
                                <th>id</th>
                                <th>Фамилия И.О</th>
                                <th>Дата и время создания аккаунта</th>
                                <th>Действие</th>
                            </tr>
                        </thead>
                        <tbody>
                            <td>
                                123
                            </td>
                            <td>
                                3
                            </td>
                            <td>
                                2
                            </td>
                            <td>
                                <div className="dropdown">
                                    <button className="action-btn">⋯</button>
                                    <div className="dropdown-content">
                                        <div className="context-button">
                                            <button
                                                className="menu-item"
                                            >
                                                Изменить роль
                                            </button>
                                            <button
                                                className="menu-item danger"
                                            >
                                                Удалить
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </td>

                        </tbody>
                    </table>

                    <div className='headingText'>
                        Журнал изменений
                    </div>

                    <table className="surveyAdmin-table">
                        <thead>
                            <tr>
                                <th>Дата и время</th>
                                <th>Сотрудник</th>
                                <th>Действие</th>
                            </tr>
                        </thead>
                        <tbody>
                            <td>
                                123
                            </td>
                            <td>
                                123
                            </td>
                            <td>
                                123
                            </td>


                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export default adminPanel;
