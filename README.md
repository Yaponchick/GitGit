 const openModal = (link: string | null) => {
        setCurrentLink(link);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentLink(null);
    };

    const openModalDelete = (id: string | null) => {
        setCurrentDelete(id);
        setIsModalOpenDelete(true);
    };

    const closeModalDelete = () => {
        setIsModalOpenDelete(false);
    };
    if (loading) {
        return <div className="ac-page">Загрузка...</div>;
    }
