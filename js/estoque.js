const API_URL = 'http://localhost:5031/api/produtos';

// Função para buscar os produtos na API e montar a tabela
async function carregarEstoque() {
    const tbody = document.getElementById('corpoTabelaEstoque');
    // Mostra uma mensagem de carregando enquanto busca os dados
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;"><i class="fa-solid fa-spinner fa-spin"></i> Carregando estoque...</td></tr>';

    try{
        // Faz a requisição GET para o C#
        const resposta = await fetch(API_URL);

        if(!resposta.ok) {
            throw new Error('Erro ao buscar dados da API');
        } 
        const produtos = await resposta.json();

        //LImpa a mensagem de carregando
        tbody.innerHTML = '';

        //Verfifica se a tabela está vazia 
        if(produtos.lenght === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">Nenhum produto cadastrado no momento.</td></tr>';
            return;
        }

        // Para cada produto que veio do banco , cria uma linha (<tr>) na tabela HTML
        produtos.forEach(produto => {

            // lógica para definir a cor do Status
            let badgeClass = 'badge-nomral';
            let statusTexto= 'Normal';

            if(produto.estoque === 0){
                badgeClass = 'badget-esgotado';
                statusTexto = 'Esgotado'
            }
            else if (produto.estoque <20 ){ // Se estiver menos de 2- , considerar estoque baixo
                badgeClass = 'badge-baixo';
                statusTexto = 'Baixo';
            }
            // Monta o HTML da linha com os dados do banco
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1xp solid #eee'

            tr.innerHTML = `
                <td style="padding: 15px;"><b>${produto.sku}</b></td>
                <td style="padding: 15px;">${produto.nome}</td>
                <td style="padding: 15px;">${produto.categoria}</td>
                <td style="padding: 15px;">R$ ${produto.precoVenda.toFixed(2).replace('.', ',')}</td>
                <td style="padding: 15px;">${produto.estoque}</td>
                <td style="padding: 15px;"><span class="status-badge ${badgeClass}">${statusTexto}</span></td>
                <td style="padding: 15px;">
                    <button class="btn-action" onclick="editarProduto(${produto.id})" title="Editar"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button class="btn-action" onclick="deletarProduto(${produto.id})" title="Excluir" style="color: var(--vermelho-sair);"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });

    } catch(erro) {
        console.error('Erro: ', erro);
        tbody.innerHTML= '<tr><td colspan="7" style="text-align: center; padding: 20px; color: red;">Erro ao carregar o estoque. Verifique se a API está rodando.</td></tr>';
    }

}
// ==========================================
// Função para delear (DELETE)
// ==========================================

// Variável global para guardar o ID do produto que o usuário clicou para deletar
let idProdutoParaDeletar = null;

// ==========================================
// FUNÇÃO UNIVERSAL DE NOTIFICAÇÃO (TOAST)
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
// 1. ABRE A JANELA BONITA DE CONFIRMAÇÃO
// ==========================================
function deletarProduto(id) {
    idProdutoParaDeletar = id; // Guarda o ID selecionado
    
    // Mostra o modal na tela (usamos a mesma classe 'active' que já existe no seu CSS)
    document.getElementById('modalExcluir').classList.add('active');
}

// ==========================================
// 2. VAI NA API E DELETA DE FATO
// ==========================================
async function executarExclusao() {
    if (!idProdutoParaDeletar) return;

    try {
        const resposta = await fetch(`${API_URL}/${idProdutoParaDeletar}`, {
            method: 'DELETE'
        });

        if (resposta.ok) {
            // Fecha o modal
            document.getElementById('modalExcluir').classList.remove('active');
            
           mostrarNotificacao('Produto excluído com sucesso!', 'success');
            
            // Recarrega a tabela imediatamente
            carregarEstoque(); 
        } else {
            mostrarNotificacao('Erro ao excluir. O servidor recusou a requisição.', 'error');
        }
    } catch (erro) {
        console.error('Erro ao deletar:', erro);
        alert("Erro de conexão com a API ao tentar excluir.");
    } finally {
        // Limpa a variável por segurança
        idProdutoParaDeletar = null; 
    }
}

// Função auxiliar (caso não esteja declarada no seu estoque.html)
function fecharModal(idModal) {
    document.getElementById(idModal).classList.remove('active');
}

// ==========================================
// Função para editar (O redirecionamento)
// ==========================================
function editarProduto(id) {
    // A melhor prática de UX/UI não é abrir um prompt feio na tela.
    // Nós redirecionamos o usuário de volta para a tela de Produtos, 
    // mas "escondemos" o ID do produto na URL (ex: produtos.html?id=5)
    window.location.href = `produtos.html?id=${id}`;
}

// Assim que a página HTML carregar completamente, chama a função para buscar os dados
document.addEventListener('DOMContentLoaded', carregarEstoque);

// ==========================================
// FUNÇÃO DE BUSCA (LIVE SEARCH)
// ==========================================
function filtrarEstoque() {
    // 1. Pega o que o usuário digitou e transforma em letras minúsculas (para não ter problema de maiúscula/minúscula)
    const termoBusca = document.getElementById('inputBusca').value.toLowerCase();
    
    // 2. Pega todas as linhas (<tr>) que estão dentro da nossa tabela
    const linhas = document.querySelectorAll('#corpoTabelaEstoque tr');

    // 3. Passa por cada linha verificando se bate com a busca
    linhas.forEach(linha => {
        // Se a linha for aquela mensagem de "Nenhum produto" ou "Carregando", pula ela
        if (linha.cells.length < 2) return;

        // Pega o texto da coluna 0 (SKU) e da coluna 1 (Nome)
        const sku = linha.cells[0].textContent.toLowerCase();
        const nome = linha.cells[1].textContent.toLowerCase();

        // Se o termo buscado existir no SKU OU no Nome, mostra a linha. Senão, esconde.
        if (sku.includes(termoBusca) || nome.includes(termoBusca)) {
            linha.style.display = ''; // Mostra a linha
        } else {
            linha.style.display = 'none'; // Esconde a linha invisivelmente
        }
    });
}
