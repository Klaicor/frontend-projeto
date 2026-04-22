// ==========================================
// CONFIGURAÇÕES DAS APIs
// ==========================================
const API_MOVIMENTACOES = 'http://localhost:5031/api/movimentacoes';
const API_PRODUTOS = 'http://localhost:5031/api/produtos';

// ==========================================
// 1. SISTEMA DE NOTIFICAÇÕES (TOAST)
// ==========================================
function mostrarNotificacao(mensagem, tipo = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

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
// 2. PREENCHER O DROPDOWN DE PRODUTOS
// ==========================================
async function carregarProdutosSelect() {
    const select = document.getElementById('produtoSelect');
    
    try {
        const resposta = await fetch(API_PRODUTOS);
        if (resposta.ok) {
            const produtos = await resposta.json();
            
            select.innerHTML = '<option value="" disabled selected>Selecione o produto...</option>';

            produtos.forEach(p => {
                const option = document.createElement('option');
                option.value = p.id; // O C# precisa do ID do produto
                option.textContent = `${p.sku} - ${p.nome} (Estoque atual: ${p.estoque})`; // Mostra o estoque na tela!
                select.appendChild(option);
            });
        }
    } catch (erro) {
        console.error('Erro ao buscar produtos:', erro);
        select.innerHTML = '<option value="" disabled selected>Erro ao carregar produtos</option>';
    }
}

// ==========================================
// 3. REGISTRAR NOVA MOVIMENTAÇÃO (POST)
// ==========================================
async function registrarMovimentacao(event) {
    event.preventDefault();

    const btnSubmit = event.target.querySelector('.btn-submit');
    const textoOriginal = btnSubmit.innerHTML;
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Registrando...';
    btnSubmit.style.opacity = '0.7';

    // Monta o pacote de dados
    const dados = {
        tipo: document.getElementById('tipoMovimentacao').value,
        produtoId: parseInt(document.getElementById('produtoSelect').value),
        quantidade: parseInt(document.getElementById('quantidadeMovimentacao').value),
        motivo: document.getElementById('motivoMovimentacao').value || "Não informado"
    };

    try {
        const resposta = await fetch(API_MOVIMENTACOES, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        if (resposta.ok) {
            mostrarNotificacao('Movimentação registrada com sucesso!', 'success');
            document.getElementById('formMovimentacao').reset();
            
            // Recarrega tudo para atualizar os números na tela
            carregarHistoricoMovimentacoes();
            carregarProdutosSelect(); 
        } else {
            // Pega a mensagem de erro amigável que fizemos no C# (Ex: "Não há estoque suficiente")
            const erroData = await resposta.text();
            mostrarNotificacao(erroData, 'error');
        }
    } catch (erro) {
        console.error('Erro:', erro);
        mostrarNotificacao('Erro de conexão com o servidor.', 'error');
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = textoOriginal;
        btnSubmit.style.opacity = '1';
    }
}

// ==========================================
// 4. CARREGAR HISTÓRICO NA TABELA (GET)
// ==========================================
async function carregarHistoricoMovimentacoes() {
    const tbody = document.getElementById('corpoTabelaMovimentacao');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;"><i class="fa-solid fa-spinner fa-spin"></i> Carregando histórico...</td></tr>';

    try {
        const resposta = await fetch(API_MOVIMENTACOES);
        if (!resposta.ok) throw new Error('Erro na API');

        const movimentacoes = await resposta.json();
        tbody.innerHTML = '';

        if (movimentacoes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">Nenhuma movimentação registrada hoje.</td></tr>';
            return;
        }

        movimentacoes.forEach(m => {
            // Formata a data para o padrão Brasileiro
            const dataObjeto = new Date(m.dataHora);
            const dataFormatada = dataObjeto.toLocaleDateString('pt-BR') + ' - ' + dataObjeto.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});

            // Estiliza a setinha e a cor baseada no tipo (Entrada = Verde, Saída = Vermelho)
            let badgeHTML = '';
            let sinalMatematico = '';
            
            if (m.tipo === "Entrada") {
                badgeHTML = `<span class="status-badge" style="background-color: #e8f8f5; color: #27ae60;"><i class="fa-solid fa-arrow-down"></i> Entrada</span>`;
                sinalMatematico = '+';
            } else {
                badgeHTML = `<span class="status-badge" style="background-color: #fceceb; color: var(--vermelho-sair);"><i class="fa-solid fa-arrow-up"></i> Saída</span>`;
                sinalMatematico = '-';
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="padding: 15px;">${dataFormatada}</td>
                <td style="padding: 15px;"><b>${m.produtoNome}</b></td>
                <td style="padding: 15px;">${badgeHTML}</td>
                <td style="padding: 15px; font-weight: bold;">${sinalMatematico}${m.quantidade}</td>
                <td style="padding: 15px;">${m.motivo}</td>
                <td style="padding: 15px;">${m.responsavel}</td>
            `;
            tbody.appendChild(tr);
        });

    } catch (erro) {
        console.error('Erro histórico:', erro);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px; color: red;">Erro ao carregar o histórico.</td></tr>';
    }
}

// ==========================================
// INICIALIZAÇÃO
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    carregarProdutosSelect();
    carregarHistoricoMovimentacoes();

    const form = document.getElementById('formMovimentacao');
    if (form) {
        form.addEventListener('submit', registrarMovimentacao);
    }
});