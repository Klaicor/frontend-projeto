// URL da API
const API_URL = 'http://localhost:5031/api/produtos';

// Variável global para sabermos se estamos criando ou editando
let produtoEditandoId = null;

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
// PREENCHE O DROPDOWN DE FORNECEDORES
// ==========================================
async function carregarFornecedoresSelect() {
    const select = document.getElementById('fornecedor');
    const URL_FORNECEDORES = 'http://localhost:5031/api/fornecedores';

    try {
        const resposta = await fetch(URL_FORNECEDORES);
        
        if (resposta.ok) {
            const fornecedores = await resposta.json();
            
            // Garante que o select está limpo (mantendo só a opção inicial)
            select.innerHTML = '<option value="" disabled selected>Selecione o fornecedor...</option>';

            fornecedores.forEach(f => {
                const option = document.createElement('option');
                // Usa o Nome Fantasia se existir, senão usa a Razão Social
                const nomeExibicao = f.nomeFantasia || f.razaoSocial; 
                
                option.value = nomeExibicao; // Valor que será salvo no banco
                option.textContent = nomeExibicao; // Texto que o usuário lê
                select.appendChild(option);
            });
        }
    } catch (erro) {
        console.error('Erro ao carregar fornecedores:', erro);
        select.innerHTML = '<option value="" disabled selected>Erro ao carregar fornecedores</option>';
    }
}
// ==========================================
// VERIFICA SE É EDIÇÃO AO ABRIR A PÁGINA
// ==========================================
async function verificarModoEdicao() {
    // Lê a URL do navegador
    const parametrosUrl = new URLSearchParams(window.location.search);
    produtoEditandoId = parametrosUrl.get('id'); // Pega o número que está no ?id=

    // Se existir um ID, significa que o usuário clicou no Lápis!
    if (produtoEditandoId) {
        // 1. Muda os textos da tela para "Editar"
        document.querySelector('.form-header h2').innerHTML = '<i class="fa-solid fa-pen-to-square" style="color: var(--azul-primario); margin-right: 10px;"></i> Editar Produto';
        const btnSubmit = document.querySelector('.btn-submit');
        btnSubmit.innerHTML = '<i class="fa-solid fa-arrows-rotate"></i> Atualizar Produto';
        btnSubmit.style.backgroundColor = '#f39c12'; // Deixa o botão laranja para dar destaque

        try {
            // 2. Busca os dados desse produto específico na API (GET por ID)
            const resposta = await fetch(`${API_URL}/${produtoEditandoId}`);
            
            if (resposta.ok) {
                const produto = await resposta.json();
                
                // 3. Preenche os campos do HTML automaticamente
                document.getElementById('codigoSku').value = produto.sku;
                document.getElementById('nomeProduto').value = produto.nome;
                document.getElementById('categoria').value = produto.categoria;
                document.getElementById('precoCusto').value = produto.precoCusto;
                document.getElementById('precoVenda').value = produto.precoVenda;
                document.getElementById('estoqueInicial').value = produto.estoque;

                // Encontra e seleciona o Fornecedor correto no Dropdown
                const selectFornecedor = document.getElementById('fornecedor');
                for (let i = 0; i < selectFornecedor.options.length; i++) {
                    if (selectFornecedor.options[i].text === produto.fornecedor) {
                        selectFornecedor.selectedIndex = i;
                        break;
                    }
                }
            } else {
                mostrarNotificacao('Produto não encontrado no banco de dados.', 'error');
            }
        } catch (erro) {
            console.error('Erro:', erro);
            mostrarNotificacao('Erro de conexão ao buscar os dados.', 'error');
        }
    }
}

// ==========================================
// FUNÇÃO PARA SALVAR OU ATUALIZAR
// ==========================================
async function salvarProduto(event) {
    event.preventDefault();

    const btnSubmit = event.target.querySelector('.btn-submit');
    const textoOriginal = btnSubmit.innerHTML;

    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processando...';
    btnSubmit.style.opacity = '0.7';

    // Monta o pacote de dados (O C# precisa receber os números em formato americano com Ponto)
    const dadosProduto = {
        sku: document.getElementById('codigoSku').value,
        nome: document.getElementById('nomeProduto').value,
        categoria: document.getElementById('categoria').value,
        fornecedor: document.getElementById('fornecedor').value,
        precoCusto: parseFloat(document.getElementById('precoCusto').value.toString().replace(',', '.')),
        precoVenda: parseFloat(document.getElementById('precoVenda').value.toString().replace(',', '.')),
        estoque: parseInt(document.getElementById('estoqueInicial').value)
    };

    // A MÁGICA: Define se é POST (Novo) ou PUT (Editar)
    let metodoFetch = 'POST';
    let urlFetch = API_URL;

    if (produtoEditandoId) {
        metodoFetch = 'PUT'; // Muda o método
        urlFetch = `${API_URL}/${produtoEditandoId}`; // Adiciona o ID na URL da API
        dadosProduto.id = parseInt(produtoEditandoId); // O C# exige que mandemos o ID junto no pacote JSON
    }

    try {
        const resposta = await fetch(urlFetch, {
            method: metodoFetch,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosProduto)
        });

        if (resposta.ok) {
            if (produtoEditandoId) {
                mostrarNotificacao('Produto atualizado com sucesso!', 'success');
                // Se estava editando, joga o usuário de volta para a tela de Estoque após 1.5s
                setTimeout(() => window.location.href = 'estoque.html', 1500);
            } else {
                mostrarNotificacao('Produto cadastrado com sucesso!', 'success');
                document.getElementById('formCadastroProduto').reset();
            }
        } else {
            mostrarNotificacao('Erro ao processar. Verifique os dados.', 'error');
        }

    } catch (erro) {
        mostrarNotificacao('Erro de conexão com o servidor.', 'error');
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = textoOriginal;
        btnSubmit.style.opacity = '1';
    }
}

// ==========================================
// INICIALIZAÇÃO (NÃO ALTERAR A ORDEM)
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    // 1º: Traz os fornecedores do banco e monta as opções no select
    await carregarFornecedoresSelect(); 
    
    // 2º: Só depois de ter os fornecedores na tela, verifica se precisa preencher dados para Editar
    verificarModoEdicao(); 
});