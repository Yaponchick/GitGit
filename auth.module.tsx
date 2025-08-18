
import React, { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import './auth.module.scss';
import './authStyle.css';
import apiClient from '../../api/apiClient';
import { Password } from '@mui/icons-material';

const LoginModal = () => {
	const [email, setEmail] = useState('');
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [rememberMe, setRememberMe] = useState(false);
	const [loginType, setLoginType] = useState<'email' | 'username' | 'QRcode'>('email');
	const [error, setError] = useState('');
	const defaultUrl = 'https://enplusgroup.com/ru/';
	const navigate = useNavigate();

	// Восстановление email и nickname, если включено "Запомнить меня"
	React.useEffect(() => {
		const savedEmail = localStorage.getItem('savedEmail');
		const savedUsername = localStorage.getItem('savedUsername');
		const savedRememberMe = localStorage.getItem('rememberMe');

		if (savedRememberMe === 'true' && loginType === 'email') {
			setEmail(savedEmail || '');
			setRememberMe(true);

		}
		else if (savedRememberMe === 'true' && loginType === 'username') {
			setUsername(savedUsername || '');
			setRememberMe(true);
		}
		// Очистка полей при смене типа входа
		if (loginType === 'QRcode') {
			setEmail('');
			setUsername('');
			setPassword('');
		}
	}, [loginType]);

	const handleLogin = async (e: FormEvent) => {
		e.preventDefault();

		try {
			setError('');
			let loginPayload;
			if (loginType === 'email') {
				loginPayload = email;
			} else if (loginType === 'username') {
				loginPayload = username;
			} else {
				return;
			}
			const response = await apiClient.post('/auth/login', {
				Login: loginPayload,
				Password: password,
			});

			const { access_token, refresh_token } = response.data;

			// Сохраняем токены
			localStorage.setItem('access_token', access_token);
			localStorage.setItem('refresh_token', refresh_token);

			// Сохраняем email и nickname
			if (rememberMe && (loginType === 'email')) {
				localStorage.setItem('savedEmail', email);
				localStorage.setItem('rememberMe', 'true');
			} else if (rememberMe && (loginType === 'username')) {
				localStorage.setItem('savedUsername', username);
				localStorage.setItem('rememberMe', 'true');
			} else {
				localStorage.removeItem('savedEmail');
				localStorage.removeItem('saveUsername');
				localStorage.removeItem('rememberMe');
			}
			navigate('/SurveyPage');
		} catch (err: any) {

			console.error('Ошибка входа:', err.response?.data || err.message);
			// Показываем сообщение
			if (err.response?.status === 401) {
				setError('Неверный логин или пароль.');
			} else if (err.response?.data?.message) {
				setError(err.response.data.message);
			} else {
				setError('Ошибка подключения. Попробуйте позже.');
			}
		}
	};

	return (
		<div className="Title-screen">
			<div className="Title-box">
				<div className="Title-Name">Конструктор анкет</div>

				{/* Переключатель типа входа */}
				<div className="Login-Type-box">
					<div className="Login-Type-Switcher">
						<button
							className={`Switch-button ${loginType === 'email' ? 'active' : ''}`}
							onClick={() => setLoginType('email')}
						>
							ПО ПОЧТЕ
						</button>
						<button
							className={`Switch-button ${loginType === 'username' ? 'active' : ''}`}
							onClick={() => setLoginType('username')}
						>
							ПО ЛОГИНУ
						</button>
						<button
							className={`Switch-button ${loginType === 'QRcode' ? 'active' : ''}`}
							onClick={() => setLoginType('QRcode')}
						>
							QR-КОД
						</button>
					</div>
				</div>

				{/* Форма ввода */}
				<form className="formInput" onSubmit={handleLogin}>
					<div className="mediaInput">
						{/* Поле: Email */}
						{loginType === 'email' && (
							<input
								type="email"
								placeholder="Электронная почта"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
							/>
						)}

						{/* Поле: Логин */}
						{loginType === 'username' && (
							<input
								type="text"
								placeholder="Логин"
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								required
							/>
						)}

						{/* QR-код */}
						{loginType === 'QRcode' && (
							<div className="QR-form">
								<div style={{ display: 'flex', justifyContent: 'center' }}>
									<div className="qr-image-wrapper">
										<img
											src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(defaultUrl || 'stateLink')}`}
											alt="QR Code"
											className="qr-image"
										/>
									</div>
								</div>
								<div className="QR-text">
									Отсканируйте QR-код с помощью мобильного телефона, на котором вы уже авторизованы
								</div>
							</div>
						)}

						{/* Поле: Пароль */}
						{loginType !== 'QRcode' && (
							<input
								type="password"
								placeholder="Пароль"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
							/>
						)}

						{/* Чекбокс "Запомнить меня" */}
						{loginType !== 'QRcode' && (
							<label className='rememberMe'>
								<input
									type="checkbox"
									checked={rememberMe}
									onChange={(e) => setRememberMe(e.target.checked)}
								/>
								Запомнить меня
							</label>
						)}

						{/* Кнопка входа */}
						{loginType !== 'QRcode' && (
							<button type="submit" className="auth-button">
								ВОЙТИ
							</button>
						)}

						{/* Ссылка на восстановление пароля */}
						{loginType !== 'QRcode' && (
							<div className="reset-password">
								<label
									className="link-button"
									onClick={() => navigate('/ResPassword')}
								>
									Забыли пароль?
								</label>
							</div>
						)}
						{/* Сообщение об ошибке */}
						{error && <p className="error-message">{error}</p>}
					</div>
				</form>
			</div>
		</div>
	);
};

export default LoginModal;
