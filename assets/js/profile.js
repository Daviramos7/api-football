// Verifica se o usuário está logado
const user = JSON.parse(localStorage.getItem('session'));
if (!user) {
    alert('Você precisa estar logado!');
    window.location.href = 'profile.html';
} else {
    document.getElementById('userName').innerText = `Nome: ${user.name}`;
    document.getElementById('userEmail').innerText = `E-mail: ${user.email}`;
}

// Logout do usuário
document.getElementById('logout').addEventListener('click', () => {
    localStorage.removeItem('session');
    window.location.href = 'main.html';
});

const links = document.querySelectorAll('nav ul li a');
const currentPage = window.location.pathname.split('/').pop();

links.forEach(link => {
  const linkHref = link.getAttribute('href');

  if (linkHref === currentPage) {
    link.classList.add('active');
  }
});