import React, { useContext, useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../api/AuthContext';
import { useAuth } from './useAuth';
import apiClient, { getUserSurveys } from '../../api/apiClient';

import logo from './../../img/logo_checklist.png';
import ExitIcon from './../../img/navbar/ExitIcon.png';
import EditPencilIcon from './../../img/navbar/EditPencilIcon.png';


import './Navbar.css';

const Navbar = () => {
    const { isLoggedIn, logout } = useAuth();
    const navigate = useNavigate();
    const [nickname, setNickname] = useState<string>('Гость');
    const [email, setEmail] = useState<string>('Гость@mail.ru');
    const [loading, setLoading] = useState<boolean>(true);

    // Вывод имени пользователя
    const fetchUserData = async (): Promise<void> => {
        try {
            const response = await apiClient.get('/User/current');
            const userData = response.data;
            setNickname(userData.nick || 'Гость');
            setEmail(userData.email || 'Гость@mail.ru');
        } catch (error: any) {
            console.error('Ошибка при загрузке данных пользователя:', error.response?.data || error.message);
            setNickname('Гость');
            setEmail('Гость@mail.ru');
        } finally {
            setLoading(false);
        }
    };

    // Проверка для исключения отображения некоторых элементов
    const isAuthPage = location.pathname === '/auth';

    useEffect(() => {
        if (!isAuthPage) {
            fetchUserData();
        }
    }, [isAuthPage]);

    // Выход из аккаунта
    const handleLogout = () => {
        logout();
        navigate('/auth');
    };

    const getInitials = (name: string) => {
        if (!name) {
            return '';
        }
        const words = name.trim().split(/\s+/);

        if (words.length == 1) {
            return words[0][0].toUpperCase();
        } else {
            return words[0][0] + words[1][0].toUpperCase();
        }
    };
    const initials = getInitials(nickname);

    return (
        <nav className="nav">
            <div className="container">
                <div className="nav-row">
                    <img src={logo} alt="Project img" className="project_img" />

                    {!isAuthPage && (
                        <div className='email-nickname-Content'>
                            <div className='outerUserPicture'>
                                <div className='innerUserPicture'>
                                    {initials}
                                    <label
                                        className="link-button"
                                        onClick={() => navigate('/ResPassword')}
                                    >
                                        <img src={EditPencilIcon} alt="EditPencil" className='EditPencilIcon' />
                                    </label>
                                </div>
                            </div>

                            <span className='NickAndEmail' onClick={() => navigate('/Account')}>
                                <span className='nickNav'> {nickname} </span>
                                <span className='emailNav'> {email} </span>
                            </span>
                            <div className="verticalLine"></div>
                            <button className='ExitAccauntButton' onClick={handleLogout}>
                                <img src={ExitIcon} alt="ExitIcon" className="ExitIcon" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
