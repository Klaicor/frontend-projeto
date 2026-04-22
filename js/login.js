const API_LOGIN = 'http://localhost:5031/api/usuarios/login';

// ==========================================
// SISTEMA DE NOTIFICAÇÕES (TOAST)
// ==========================================
function mostrarNotificacao(mensagem, tipo = 'error') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    
    // Ícone de erro por padrão, mas pode ser de sucesso se precisarmos
    let icone = tipo === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation';

    toast.innerHTML = `<i class="fa-solid ${icone}" style="font-size: 18px;"></i> ${mensagem}`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'fadeOutToast 0.4s forwards';
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}


async function tentarLogin(event) {
    event.preventDefault(); // Impede a página de recarregar

    const btnSubmit = document.querySelector('button[type="submit"]');
    btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Entrando...';
    btnSubmit.disabled = true;

    // Pega os valores digitados na sua tela
    const emailDigitado = document.getElementById('emailLogin').value;
    const senhaDigitada = document.getElementById('senhaLogin').value;

    // Monta o pacote de dados EXATAMENTE com os nomes do seu arquivo C# (Usuario.cs)
    const dados = {
        Login: emailDigitado,
        Password: senhaDigitada,
        Name: "Temporario", // Mandamos um texto qualquer porque o C# exige [Required] no model
        Role: "Temporario"
    };

    try {
        const resposta = await fetch(API_LOGIN, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        if (resposta.ok) {
            const usuarioLogado = await resposta.json();
            
            // Salva a "Chave VIP" no navegador para lembrarmos quem é
            localStorage.setItem('techpaper_user', JSON.stringify(usuarioLogado));
            
            // Redireciona para o Dashboard!
            window.location.href = 'dashboard.html';
        } else {
            // Usa o Toast vermelho bonito no lugar do alert()
            mostrarNotificacao('Acesso Negado: E-mail ou senha incorretos.', 'error');
            btnSubmit.innerHTML = 'Entrar no Sistema <i class="fa-solid fa-arrow-right-to-bracket"></i>';
            btnSubmit.disabled = false;
        }
    } catch (erro) {
        console.error(erro);
        // Usa o Toast vermelho para erro de servidor
        mostrarNotificacao('Erro de conexão com o servidor.', 'error');
        btnSubmit.innerHTML = 'Entrar no Sistema <i class="fa-solid fa-arrow-right-to-bracket"></i>';
        btnSubmit.disabled = false;
    }
}

// Liga a função ao formulário
document.addEventListener('DOMContentLoaded', () => {
    // Confirme se o formulário do login.html tem esse id
    const form = document.getElementById('formLogin'); 
    if (form) {
        form.addEventListener('submit', tentarLogin);
    }
});