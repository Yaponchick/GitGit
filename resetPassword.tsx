
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import info from '../../img/pasRem/infoOutlined.png';

const PasRem = ({ }) => {
	const navigate = useNavigate();

	const [step, setStep] = useState('nameOrEmail');
	const [nameOrEmail, setNameOrEmail] = useState('');
	const [code, setCode] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [publish, setPublish] = useState('');

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		let value = e.target.value.replace(/\D/g, '');

		if (value.length > 3) {
			value = value.slice(0, 3) + '-' + value.slice(3);
		}
		setCode(value);
	}

	//Вывод почты
	const input = document.getElementById('input-nameOrEmail') as HTMLInputElement | null;

	const value = input?.value;
	console.log(value)

	if (input != null) {
		console.log(input.value);
	}

	input?.addEventListener('input', function (event) {
		const target = event.target as HTMLInputElement;
		console.log(target.value);
	});

	useEffect(() => {
	}, []);

	return (
		<div className="Title-screen">
			<div className="Title-box">
				<div className="Title-Name">
					Восстановление пароля
				</div >

				{/* Форма ввода */}
				<form onSubmit={(e) => {
					e.preventDefault();
					if (e.currentTarget.checkValidity()) {
						if (step == 'nameOrEmail') {
							setStep('code');
						}
						if (step == 'code') {
							setStep('newPassword');
						}
					}
				}}>
					{step === 'nameOrEmail' && (
						<div>
							<input
								id="input-nameOrEmail"
								type="email"
								placeholder="Введите почту"
								value={nameOrEmail}
								onChange={(e) => setNameOrEmail(e.target.value)}
								required
							/>
							<button className="auth-button" type="submit">
								Отправить код
							</button>
						</div>
					)}

					{step === 'code' && (
						<div>
							<div className='email-massage'>
								Код был отправлен на почту<br></br>
								{value}
							</div>
							<input
								type="text"
								inputMode='numeric'
								onChange={handleChange}
								minLength={7}
								maxLength={7}
								placeholder="код подтверждения"
								value={code}
								required
							/>
							<div className='reset-massage'>
								Отправить код повторно через { } сек.
							</div>
						</div>
					)}

					{step === 'newPassword' && (
						<div className='newPasswordInput'>
							<input
								type="password"
								placeholder="Новый пароль"
								value={newPassword}
								onChange={(e) => setNewPassword(e.target.value)}
								required
							/>
							<input
								type="password"
								placeholder="Повторите пароль"
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								required
							/>
							<button className="auth-button" type="submit">
								Войти
							</button>

							<div className='prompting-resetPassword'>
								<div className='infoMarkup-text'>
									<img src={info} alt="Qr-auth" className="infoMarkup" />
									Безопасный пароль должен содержать:
								</div>
								<ul className='textMarkup-info'>
									<li>не менее 12 символов</li>
									<li>прописные латинские буквы</li>
									<li>строчные латинские буквы</li>
									<li>специальные символы</li>
									<li>цифры</li>
								</ul>

							</div>
						</div>
					)}
			{step !== 'newPassword' && (

				<div className="reset-password">
					<label
						className="link-button"
						onClick={() => {
							if (step == 'nameOrEmail') {
								navigate("/Auth");
							}
							else if (step == 'code') {
								setStep('nameOrEmail');
							}
						}}
					>
						Назад
					</label>
				</div>
			)}
		</form>
			</div >
		</div >
	);
}

export default PasRem;





