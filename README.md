import React, { useState, useEffect } from 'react';
import apiClient from '../../api/apiClient'; // ваш экземпляр axios
import './adminPanelStyle.css';

interface User {
  id: string;
  fullName: string;
  createdAt: string;
}

interface LogEntry {
  id: string;
  timestamp: string;
  employee: string;
  action: string;
}

const AdminPanel = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [usersRes, logsRes] = await Promise.all([
          apiClient.get<User[]>('/api/users'),
          apiClient.get<LogEntry[]>('/api/logs'),
        ]);

        setUsers(usersRes.data);
        setLogs(logsRes.data);
      } catch (err: any) {
        console.error('Ошибка загрузки данных:', err);
        setError('Не удалось загрузить данные. Проверьте подключение или права доступа.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredUsers = users.filter((user) =>
    user.fullName.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="adminPanel-container">Загрузка данных...</div>;
  }

  if (error) {
    return <div className="adminPanel-container error">{error}</div>;
  }

  return (
    <div className="adminPanel-container">
      <div className="adminPanel-inner-container">
        {/* Таблица пользователей */}
        <div className="tableAdmin-container">
          <div className="headingText">Список пользователей</div>

          <div className="filterAdmin">
            <input
              type="text"
              placeholder="Поиск по ФИО"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="inputSearch"
            />
            <button className="buttonAdmin">Зарегистрировать</button>
            <button className="buttonAdmin">Список админов</button>
          </div>

          <table className="surveyAdmin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Фамилия И.О.</th>
                <th>Дата и время создания аккаунта</th>
                <th>Действие</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.fullName}</td>
                    <td>{new Date(user.createdAt).toLocaleString('ru-RU')}</td>
                    <td>
                      <div className="dropdown">
                        <button className="action-btn">⋯</button>
                        <div className="dropdown-content">
                          <div className="context-button">
                            <button className="menu-item">Изменить роль</button>
                            <button className="menu-item danger">Удалить</button>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="no-data">
                    Пользователи не найдены
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Журнал изменений */}
        <div className="tableAdmin-container">
          <div className="headingText">Журнал изменений</div>

          <table className="surveyAdmin-table">
            <thead>
              <tr>
                <th>Дата и время</th>
                <th>Сотрудник</th>
                <th>Действие</th>
              </tr>
            </thead>
            <tbody>
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td>{new Date(log.timestamp).toLocaleString('ru-RU')}</td>
                    <td>{log.employee}</td>
                    <td>{log.action}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="no-data">
                    Нет записей
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
