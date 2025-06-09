import { getLoggedUser, updateAuthUser, logout, showModalMessage } from './auth.js';

function loadUserProfile() {
    const loggedUser = getLoggedUser();
    if (loggedUser) {
        document.getElementById('profileUserId').value = loggedUser.id;
        document.getElementById('profileUsername').value = loggedUser.name;
        document.getElementById('profileEmail').value = loggedUser.email;
        document.getElementById('profileCity').value = loggedUser.city || '';
        document.getElementById('profileCountry').value = loggedUser.country || '';
        document.getElementById('profileRole').value = loggedUser.role || 'Usuário Padrão';
    } else {
        showModalMessage('Você precisa estar logado para acessar esta página.', () => {
            window.location.href = 'index.html';
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadUserProfile();

    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', (event) => {
            event.preventDefault();

            const loggedUser = getLoggedUser();
            if (!loggedUser) {
                showModalMessage('Erro: Nenhum usuário logado para salvar o perfil.');
                return;
            }

            const userId = document.getElementById('profileUserId').value;
            const username = document.getElementById('profileUsername').value;
            const newPassword = document.getElementById('profilePassword').value;
            const city = document.getElementById('profileCity').value;
            const country = document.getElementById('profileCountry').value;

            const userDataToUpdate = {
                id: parseInt(userId),
                name: username,
                email: loggedUser.email,
                password: newPassword ? newPassword : undefined,
                city: city,
                country: country,
                role: loggedUser.role
            };

            if (updateAuthUser(userDataToUpdate)) {
                showModalMessage('Dados do perfil salvos com sucesso!');
                loadUserProfile();
                const profilePasswordField = document.getElementById('profilePassword');
                if (profilePasswordField) {
                    profilePasswordField.value = '';
                }
            } else {
                showModalMessage('Erro ao salvar os dados do perfil.');
            }
        });
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    const links = document.querySelectorAll('nav ul li a');
    const currentPage = window.location.pathname.split('/').pop() || 'profile.html';
    links.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === currentPage);
    });
});