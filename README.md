/*Внутренний контейнер фотографии пользователя*/
.innerUserPicture {
    font-family: Geologica;
    font-weight: 400;
    font-style: Regular;
    font-size: 1, 25rem;

    color: white;
    margin: auto;
    position: relative;
    max-width: 100%;
}

.imageUser {
    height: 100%;
    width: 100%;
    pointer-events: none;
}

/*Иконка редактирования профиля*/
.EditPencilIcon {
    width: 18px;
    height: 18px;
    transition: background-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;

    position: absolute;
    top: 22px;
    left: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
}

<div className='outerUserPicture'>
                                <div className='innerUserPicture'>
                                    {photo ? (
                                        <img
                                            src={`https://localhost:7109${photo}`}
                                            alt="Avatar"
                                            className='imageUser'
                                        />
                                    ) : (
                                        initials

                                    )}
                                    <label
                                        className="link-button-nav"
                                        onClick={handleAvatarClick}
                                    >

                                        <img src={EditPencilIcon} alt="EditPencil" className='EditPencilIcon' />
                                    </label>
                                </div>
                            </div>
