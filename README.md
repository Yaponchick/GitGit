
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import apiClient from '../../api/apiClient';

import logo from './../../img/logo_checklist.png';
import ExitIcon from './../../img/navbar/ExitIcon.png';
import EditPencilIcon from './../../img/navbar/EditPencilIcon.png';

import './Navbar.css';

const Navbar = () => {
    const { isLoggedIn, logout } = useAuth();
    const navigate = useNavigate();

    const [nickname, setNickname] = useState('Гость');
    const [email, setEmail] = useState('Гость@mail.ru');
    const [photoUrl, setPhotoUrl] = useState(null);
    const fileInputRef = useRef(null);

    const fetchUserData = async () => {
        try {
            const response = await apiClient.get('/user/current');
            const userData = response.data;
            setNickname(userData.nick);
            setEmail(userData.email);
            setPhotoUrl(userData.photoUrl); // может быть null
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
            setNickname('Гость');
            setEmail('Гость@mail.ru');
            setPhotoUrl(null);
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await apiClient.post('/user/upload-photo', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setPhotoUrl(response.data.photoUrl);
        } catch (error) {
            console.error('Ошибка загрузки фото:', error);
            alert('Не удалось загрузить фото.');
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleLogout = () => {
        logout();
        navigate('/auth');
    };

    const isAuthPage = location.pathname === '/auth';

    useEffect(() => {
        if (!isAuthPage) {
            fetchUserData();
        }
    }, [isAuthPage]);

    const getInitials = (name) => {
        if (!name) return '';
        const words = name.trim().split(/\s+/);
        return words.length === 1
            ? words[0][0].toUpperCase()
            : (words[0][0] + words[1][0]).toUpperCase();
    };
    const initials = getInitials(nickname);

    if (isAuthPage) {
        return (
            <nav className="nav">
                <div className="container">
                    <div className="nav-row">
                        <img src={logo} alt="Logo" className="project_img" />
                    </div>
                </div>
            </nav>
        );
    }

    return (
        <nav className="nav">
            <div className="container">
                <div className="nav-row">
                    <img src={logo} alt="Logo" className="project_img" />

                    <div className="email-nickname-Content">
                        <div className="outerUserPicture" onClick={handleAvatarClick} style={{ cursor: 'pointer' }}>
                            <div className="innerUserPicture">
                                {photoUrl ? (
                                    <img
                                        src={`http://localhost:5000${photoUrl}`}
                                        alt="Avatar"
                                        style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    initials
                                )}
                                <label className="link-button">
                                    <img src={EditPencilIcon} alt="Edit" className="EditPencilIcon" />
                                </label>
                            </div>
                        </div>

                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/jpeg,image/png"
                            style={{ display: 'none' }}
                        />

                        <span className="NickAndEmail" onClick={() => navigate('/Account')}>
                            <span className="nickNav">{nickname}</span>
                            <span className="emailNav">{email}</span>
                        </span>

                        <div className="verticalLine"></div>

                        <button className="ExitAccauntButton" onClick={handleLogout}>
                            <img src={ExitIcon} alt="Exit" className="ExitIcon" />
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
