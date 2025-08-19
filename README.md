.error-container{
    margin-top: 20px;
    border-radius: 10px;
    text-align: center;
    background-color:#d32f2f;
}

.error-message{
    font-size: 22px;
    color:white;
}

<div className='error-container'>
							{error && <p className="error-message">{error}</p>}
						</div>
