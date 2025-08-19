.error-container {
    margin-top: 20px;
    padding: 16px 24px;
    border-radius: 12px;
    text-align: center;
    background-color: #d32f2f;
    color: white;
    font-size: 18px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(211, 47, 47, 0.2); /* мягкая тень */
    border: 1px solid rgba(255, 255, 255, 0.2); /* легкая кайма для глубины */
    animation: slideDown 0.3s ease-out forwards;

    /* Центрирование иконки (если добавим) */
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    max-width: 500px;
    margin: 20px auto;
}

.error-message {
    font-size: 18px;
    color: white;
    margin: 0;
}

/* Анимация появления */
@keyframes slideDown {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Плавное появление/исчезновение (если ошибка убирается) */
.error-container.fade-out {
    animation: fadeOut 0.3s ease-in forwards;
}

@keyframes fadeOut {
    to {
        opacity: 0;
        transform: translateY(-10px);
        margin-top: 0;
        margin-bottom: 0;
        padding: 0;
        height: 0;
        overflow: hidden;
    }
}
