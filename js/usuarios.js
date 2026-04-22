const API_USUARIOS = 'http://localhost:5031/api/usuarios';

// Variável para controlar se estamos Criando ou Editando
let usuarioEditandoId = null;

// ==========================================
// NOTIFICAÇÕES (TOAST)
// ==========================================
function mostrarNotificacao(mensagem, tipo = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    let icone = tipo === 'success' ? 'fa-circle-check' : (tipo === 'info' ? 'fa-circle-info' : 'fa-circle-exclamation');
    toast.innerHTML = `<i class="fa-solid ${icone}" style="font-size: 18px;"></i> ${mensagem}`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'fadeOutToast 0.4s forwards';
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}

// ==========================================
// 1. LISTAR USUÁRIOS
// ==========================================
async function carregarUsuarios() {
    const tbody = document.getElementById('corpoTabelaUsuarios');
    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px;"><i class="fa-solid fa-spinner fa-spin"></i> Carregando contas...</td></tr>';

    try {
        const resposta = await fetch(API_USUARIOS);
        const usuarios = await resposta.json();
        tbody.innerHTML = '';

        usuarios.forEach(u => {
            let corBadge = u.role.toLowerCase() === 'admin' ? '#c0392b' : '#27ae60';
            
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid #eee';
            tr.innerHTML = `
                <td style="padding: 15px;"><b>${u.name}</b></td>
                <td style="padding: 15px;">${u.login}</td>
                <td style="padding: 15px;">
                    <span style="background-color: ${corBadge}; color: white; padding: 5px 10px; border-radius: 5px; font-size: 12px; font-weight: bold;">
                        ${u.role}
                    </span>
                </td>
                <td style="padding: 15px;">
                    <button onclick="prepararEdicao(${u.id})" style="color: #f39c12; background: none; border: none; cursor: pointer; font-size: 16px; margin-right: 15px;" title="Editar Acesso">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button onclick="deletarUsuario(${u.id})" style="color: var(--vermelho-sair); background: none; border: none; cursor: pointer; font-size: 16px;" title="Remover Acesso">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (erro) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px; color: red;">Erro ao carregar usuários.</td></tr>';
    }
}

// ==========================================
// 2. PREPARAR EDIÇÃO (Puxa os dados para o Form)
// ==========================================
async function prepararEdicao(id) {
    try {
        // Busca a lista para pegar os dados do usuário específico
        const resposta = await fetch(API_USUARIOS);
        const usuarios = await resposta.json();
        const u = usuarios.find(user => user.id === id);

        if (u) {
            // Preenche os campos
            document.getElementById('nomeUsuario').value = u.name;
            document.getElementById('emailUsuario').value = u.login;
            document.getElementById('senhaUsuario').value = u.password;
            
            // Tratamento para garantir que o Select marque a opção correta
            const selectPerfil = document.getElementById('perfilUsuario');
            if(u.role.toLowerCase() === 'admin') selectPerfil.value = 'Admin';
            else selectPerfil.value = 'Operador';

            usuarioEditandoId = id;

            // Muda o visual do botão
            const btnSubmit = document.querySelector('#formUsuario .btn-submit');
            btnSubmit.innerHTML = '<i class="fa-solid fa-arrows-rotate"></i> Atualizar Usuário';
            btnSubmit.style.backgroundColor = '#f39c12'; // Laranja
            
            window.scrollTo({ top: 0, behavior: 'smooth' });
            mostrarNotificacao('Modo de edição ativado', 'info');
        }
    } catch (erro) {
        mostrarNotificacao('Erro ao buscar dados do usuário.', 'error');
    }
}

// Função auxiliar para voltar o form ao normal
function cancelarEdicao() {
    usuarioEditandoId = null;
    document.getElementById('formUsuario').reset();
    const btnSubmit = document.querySelector('#formUsuario .btn-submit');
    btnSubmit.innerHTML = '<i class="fa-solid fa-user-plus"></i> Cadastrar Usuário';
    btnSubmit.style.backgroundColor = ''; // Volta a cor original
}

// ==========================================
// 3. SALVAR (POST) ou ATUALIZAR (PUT)
// ==========================================
async function salvarUsuario(event) {
    event.preventDefault();
    
    const dados = {
        Name: document.getElementById('nomeUsuario').value,
        Login: document.getElementById('emailUsuario').value,
        Password: document.getElementById('senhaUsuario').value,
        Role: document.getElementById('perfilUsuario').value
    };

    let metodo = 'POST';
    let url = API_USUARIOS;

    // Se estivermos editando, muda a rota para o PUT e injeta o ID no pacote
    if (usuarioEditandoId) {
        metodo = 'PUT';
        url = `${API_USUARIOS}/${usuarioEditandoId}`;
        dados.Id = usuarioEditandoId; // O C# exige o Id no corpo também
    }

    try {
        const resposta = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        if (resposta.ok) {
            mostrarNotificacao(usuarioEditandoId ? 'Conta atualizada com sucesso!' : 'Conta criada com sucesso!', 'success');
            cancelarEdicao();
            carregarUsuarios();
        } else {
            mostrarNotificacao('Erro ao salvar conta.', 'error');
        }
    } catch (erro) {
        mostrarNotificacao('Erro de conexão com o servidor.', 'error');
    }
}

// ==========================================
// 4. EXCLUIR USUÁRIO
// ==========================================
async function deletarUsuario(id) {
    // Evita que o Admin delete a si mesmo acidentalmente
    const userLogado = JSON.parse(localStorage.getItem('techpaper_user'));
    if (userLogado && userLogado.id === id) {
        mostrarNotificacao('Você não pode excluir a sua própria conta em uso!', 'error');
        return;
    }

    if (!confirm("Tem certeza que deseja remover permanentemente o acesso desta conta?")) return;

    try {
        const resposta = await fetch(`${API_USUARIOS}/${id}`, { method: 'DELETE' });
        if (resposta.ok) {
            mostrarNotificacao('Conta removida.', 'success');
            carregarUsuarios();
        } else {
            mostrarNotificacao('Erro ao remover conta.', 'error');
        }
    } catch (erro) {
        mostrarNotificacao('Erro de conexão.', 'error');
    }
}

// Inicializa a tela
document.addEventListener('DOMContentLoaded', () => {
    carregarUsuarios();
    document.getElementById('formUsuario').addEventListener('submit', salvarUsuario);
});