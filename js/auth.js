// ==========================================
// FUNÇÃO GLOBAL DE LOGOUT
// ==========================================
function fazerLogout() {
    localStorage.removeItem('techpaper_user');
    window.location.href = 'login.html';
}

// ==========================================
// CONTROLE DE SESSÃO E PERMISSÕES (RBAC)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const userString = localStorage.getItem('techpaper_user');
    const isLoginPage = window.location.pathname.includes('login.html');

    // Se NÃO tem chave e NÃO está no login -> Expulsa pro login
    if (!userString && !isLoginPage) {
        window.location.href = 'login.html';
        return;
    }

    // Se TEM chave e está dentro do sistema
    if (userString && !isLoginPage) {
        const usuario = JSON.parse(userString);
        
        // Verifica se é Admin (ignorando letras maiúsculas/minúsculas)
        const isAdmin = usuario.role.toLowerCase() === 'admin';

        // ----------------------------------------------------
        // PROTEÇÃO DE ROTA (O Segurança)
        // ----------------------------------------------------
        // 1. Se não for admin e estiver na página de usuários, expulsa pro Dashboard!
        if (!isAdmin && window.location.pathname.includes('usuarios.html')) {
            window.location.href = 'dashboard.html';
            return; // Para a execução do código aqui
        }

        // 2. Esconde o menu lateral de "Usuários" para quem não é Admin
        if (!isAdmin) {
            const linkMenuUsuarios = document.querySelector('a[href="usuarios.html"]');
            if (linkMenuUsuarios) {
                // Esconde a tag <li> inteira que segura o link
                linkMenuUsuarios.parentElement.style.display = 'none'; 
            }
        }
        // ----------------------------------------------------

        // Atualiza o "Olá, Nome"
        const spanNome = document.querySelector('.user-trigger span');
        if (spanNome) {
            spanNome.innerText = `Olá, ${usuario.name}`;
        }

        // Atualiza o Modal "Meu Perfil"
        const inputsPerfil = document.querySelectorAll('#modalMeusDados .form-input');
        if (inputsPerfil.length >= 3) {
            inputsPerfil[0].value = usuario.name;
            inputsPerfil[1].value = usuario.login;
            
            if (isAdmin) {
                inputsPerfil[2].value = 'Administrador do Sistema';
                inputsPerfil[2].style.color = '#c0392b'; 
            } else {
                inputsPerfil[2].value = 'Operador Padrão';
                inputsPerfil[2].style.color = '#27ae60'; 
            }
        }
    }
});