// ==========================================
// CONFIGURAÇÕES INICIAIS
// ==========================================
// URL da API de Fornecedores (Confirme se a porta 5031 é a mesma)
const API_URL = 'http://localhost:5031/api/fornecedores';

// Variável para saber se estamos Editando ou Criando um novo
let fornecedorEditandoId = null;

// ==========================================
// 1. SISTEMA DE NOTIFICAÇÕES (TOAST)
// ==========================================
function mostrarNotificacao(mensagem, tipo = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    
    let icone = 'fa-circle-info';
    if(tipo === 'success') icone = 'fa-circle-check';
    if(tipo === 'error') icone = 'fa-circle-exclamation';

    toast.innerHTML = `<i class="fa-solid ${icone}" style="font-size: 18px;"></i> ${mensagem}`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'fadeOutToast 0.4s forwards';
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}

// ==========================================
// 2. SALVAR OU ATUALIZAR FORNECEDOR (POST / PUT)
// ==========================================
async function salvarFornecedor(event) {
    event.preventDefault(); // Impede a página de recarregar

    // UX: Muda o botão para "Salvando..."
    const btnSubmit = event.target.querySelector('button[type="submit"]');
    const textoOriginal = btnSubmit.innerHTML;
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processando...';
    btnSubmit.style.opacity = '0.7';

    // Coleta os dados exatos do HTML para enviar ao C#
    const dadosFornecedor = {
        cnpj: document.getElementById('cnpj').value,
        razaoSocial: document.getElementById('razaoSocial').value,
        nomeFantasia: document.getElementById('nomeFantasia').value,
        segmento: document.getElementById('categoriaFornecedor').value,
        telefone: document.getElementById('telefone').value,
        email: document.getElementById('emailContato').value,
        prazoEntregaDias: parseInt(document.getElementById('prazoEntrega').value) || 0 // Garante que seja número
    };

    // Define a rota e o método dependendo se é Novo Cadastro ou Edição
    let metodo = 'POST';
    let url = API_URL;

    if (fornecedorEditandoId) {
        metodo = 'PUT';
        url = `${API_URL}/${fornecedorEditandoId}`;
        dadosFornecedor.id = parseInt(fornecedorEditandoId); // O C# precisa do ID no PUT
    }

    try {
        const resposta = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosFornecedor)
        });

        if (resposta.ok) {
            mostrarNotificacao(fornecedorEditandoId ? 'Fornecedor atualizado com sucesso!' : 'Fornecedor cadastrado com sucesso!', 'success');
            
            // Limpa o formulário e reseta o estado
            document.getElementById('formCadastroFornecedor').reset();
            cancelarEdicao(); // Função auxiliar para voltar o botão ao normal
            
            // Atualiza a tabela imediatamente (se ela já existir na tela)
            carregarFornecedores(); 
        } else {
            const erroData = await resposta.text();
            console.error("Erro da API:", erroData);
            mostrarNotificacao('Erro ao salvar. Verifique os dados.', 'error');
        }
    } catch (erro) {
        console.error('Erro de requisição:', erro);
        mostrarNotificacao('Erro de conexão com o servidor.', 'error');
    } finally {
        // Volta o botão ao estado normal
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = textoOriginal;
        btnSubmit.style.opacity = '1';
    }
}

// ==========================================
// 3. LISTAR FORNECEDORES NA TABELA (GET)
// ==========================================
async function carregarFornecedores() {
    const tbody = document.getElementById('corpoTabelaFornecedores');
    if (!tbody) return; // Se a tabela não existir no HTML, não faz nada

    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;"><i class="fa-solid fa-spinner fa-spin"></i> Carregando fornecedores...</td></tr>';

    try {
        const resposta = await fetch(API_URL);
        if (!resposta.ok) throw new Error('Falha ao buscar fornecedores');

        const fornecedores = await resposta.json();
        tbody.innerHTML = '';

        if (fornecedores.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">Nenhum fornecedor cadastrado.</td></tr>';
            return;
        }

        // Desenha as linhas da tabela
        fornecedores.forEach(f => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="padding: 15px;"><b>${f.cnpj}</b></td>
                <td style="padding: 15px;">${f.nomeFantasia || f.razaoSocial}</td>
                <td style="padding: 15px;">${f.segmento}</td>
                <td style="padding: 15px;">${f.telefone}</td>
                <td style="padding: 15px;">${f.email}</td>
                <td style="padding: 15px;">
                    <button class="btn-action" onclick="prepararEdicao(${f.id})" title="Editar"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button class="btn-action" onclick="deletarFornecedor(${f.id})" title="Excluir" style="color: var(--vermelho-sair);"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });

    } catch (erro) {
        console.error('Erro ao listar:', erro);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px; color: red;">Erro ao carregar lista.</td></tr>';
    }
}

// ==========================================
// 4. PREPARAR PARA EDITAR (Puxa os dados para o formulário)
// ==========================================
async function prepararEdicao(id) {
    try {
        const resposta = await fetch(`${API_URL}/${id}`);
        if (!resposta.ok) throw new Error('Fornecedor não encontrado');
        
        const f = await resposta.json();
        
        // Preenche o formulário
        document.getElementById('cnpj').value = f.cnpj;
        document.getElementById('razaoSocial').value = f.razaoSocial;
        document.getElementById('nomeFantasia').value = f.nomeFantasia;
        document.getElementById('categoriaFornecedor').value = f.segmento;
        document.getElementById('telefone').value = f.telefone;
        document.getElementById('emailContato').value = f.email;
        document.getElementById('prazoEntrega').value = f.prazoEntregaDias;

        // Muda as variáveis e botões
        fornecedorEditandoId = id;
        
        const btnSubmit = document.querySelector('button[type="submit"]');
        btnSubmit.innerHTML = '<i class="fa-solid fa-arrows-rotate"></i> Atualizar Fornecedor';
        btnSubmit.style.backgroundColor = '#f39c12'; // Laranja
        
        // Rola a tela para o topo para o usuário ver o formulário
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        mostrarNotificacao('Modo de edição ativado', 'info');
    } catch (error) {
        console.error('Erro ao preparar edição:', error);
        mostrarNotificacao('Erro ao buscar dados do fornecedor.', 'error');
    }
}

// ==========================================
// 5. CANCELAR EDIÇÃO (Volta ao modo normal)
// ==========================================
function cancelarEdicao() {
    fornecedorEditandoId = null;
    const btnSubmit = document.querySelector('button[type="submit"]');
    btnSubmit.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Salvar Fornecedor';
    btnSubmit.style.backgroundColor = ''; // Volta a cor original
}

// ==========================================
// 6. EXCLUIR FORNECEDOR (Abre o modal bonito)
// ==========================================
function deletarFornecedor(id) {
    idFornecedorParaDeletar = id;
    document.getElementById('modalExcluir').classList.add('active');
}

// ==========================================
// 7. EXECUTA A EXCLUSÃO DE FATO
// ==========================================
async function executarExclusaoFornecedor() {
    if (!idFornecedorParaDeletar) return;

    try {
        const resposta = await fetch(`${API_URL}/${idFornecedorParaDeletar}`, { 
            method: 'DELETE' 
        });
        
        if(resposta.ok){
            document.getElementById('modalExcluir').classList.remove('active');
            mostrarNotificacao('Fornecedor excluído com sucesso!', 'success');
            carregarFornecedores(); // Atualiza a tabela
        } else {
            mostrarNotificacao('Erro ao excluir no banco de dados.', 'error');
        }
    } catch(erro) { // Corrigido a variável de erro aqui!
        console.error('Erro:', erro);
        mostrarNotificacao('Erro de conexão com o servidor.', 'error');
    } finally {
        idFornecedorParaDeletar = null;
    }
}
// ==========================================
// INICIALIZAÇÃO DA PÁGINA
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    carregarFornecedores(); // Tenta listar assim que a página abre
    
    // Liga o formulário à nossa função de salvar
    const form = document.getElementById('formCadastroFornecedor');
    if (form) {
        form.addEventListener('submit', salvarFornecedor);
    }
});
// ==========================================
// FUNÇÃO DE BUSCA (LIVE SEARCH)
// ==========================================
function filtrarFornecedores() {
    const termoBusca = document.getElementById('buscaFornecedor').value.toLowerCase();
    const linhas = document.querySelectorAll('#corpoTabelaFornecedores tr');

    linhas.forEach(linha => {
        // Ignora a linha se for a mensagem de "Carregando..." ou "Nenhum fornecedor"
        if (linha.cells.length < 2) return; 
        
        // Busca na coluna de CNPJ (0) e de Empresa (1)
        const cnpj = linha.cells[0].textContent.toLowerCase();
        const empresa = linha.cells[1].textContent.toLowerCase();

        if (cnpj.includes(termoBusca) || empresa.includes(termoBusca)) {
            linha.style.display = '';
        } else {
            linha.style.display = 'none';
        }
    });
}