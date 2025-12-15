window.showModal = (title, message) => {
    const modalContainer = document.getElementById('app-modal');
    const modalContent = document.getElementById('modal-content');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const modalCloseBtn = document.getElementById('modal-close-btn');

    const closeModal = () => {
        modalContent.classList.remove('translate-y-0', 'opacity-100');
        modalContent.classList.add('translate-y-4', 'opacity-0');
        
        modalContainer.classList.remove('opacity-100', 'pointer-events-auto');
        modalContainer.classList.add('opacity-0', 'pointer-events-none');

        modalCloseBtn.removeEventListener('click', closeModal);
        modalContainer.removeEventListener('click', handleOutsideClick);
    };

    const handleOutsideClick = (event) => {
        if (event.target === modalContainer) {
            closeModal();
        }
    };

    modalTitle.textContent = title;
    modalMessage.textContent = message;

    modalCloseBtn.addEventListener('click', closeModal);
    modalContainer.addEventListener('click', handleOutsideClick);

    modalContainer.classList.remove('opacity-0', 'pointer-events-none');
    modalContainer.classList.add('opacity-100', 'pointer-events-auto');

    setTimeout(() => {
        modalContent.classList.remove('translate-y-4', 'opacity-0');
        modalContent.classList.add('translate-y-0', 'opacity-100');
    }, 10);
};