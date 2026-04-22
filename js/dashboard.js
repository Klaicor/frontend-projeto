const API_PRODUTOS = 'http://localhost:5031/api/produtos';
const API_FORNECEDORES = 'http://localhost:5031/api/fornecedores';
const API_MOVIMENTACOES = 'http://localhost:5031/api/movimentacoes';

async function carregarDashboard() {
    try {
        // 1. Busca os dados de todas as APIs simultaneamente (Performance máxima!)
        const [resProdutos, resFornecedores, resMov] = await Promise.all([
            fetch(API_PRODUTOS),
            fetch(API_FORNECEDORES),
            fetch(API_MOVIMENTACOES)
        ]);

        const produtos = await resProdutos.json();
        const fornecedores = await resFornecedores.json();
        const movimentacoes = await resMov.json();

        // 2. Faz as contas com os dados que chegaram
        const totalProdutos = produtos.length;
        const estoqueBaixo = produtos.filter(p => p.estoque < 20).length;
        const totalFornecedores = fornecedores.length;

        // 3. Calcula as movimentações (Filtrando apenas o que aconteceu HOJE)
        const dataHojeBR = new Date().toLocaleDateString('pt-BR');
        let entradasHoje = 0;
        let saidasHoje = 0;

        movimentacoes.forEach(m => {
            const dataRegistro = new Date(m.dataHora).toLocaleDateString('pt-BR');
            if (dataRegistro === dataHojeBR) {
                if (m.tipo === 'Entrada') entradasHoje++;
                
                // Usando 'Saida' sem acento exatamente como você arrumou no sistema!
                if (m.tipo === 'Saida') saidasHoje++; 
            }
        });

        // 4. Injeta os resultados no HTML e cria uma pequena animação de carregamento
        animarNumero('cardTotalProdutos', totalProdutos);
        animarNumero('cardEstoqueBaixo', estoqueBaixo);
        animarNumero('cardFornecedores', totalFornecedores);
        animarNumero('cardEntradasHoje', entradasHoje);
        animarNumero('cardSaidasHoje', saidasHoje);

        // ==========================================
        // GRÁFICO : ESTOQUE POR CATEGORIA (Doughnut)
        // ==========================================
        const contagemCategorias = {};
        
        // Agrupa as quantidades de estoque por categoria
        produtos.forEach(p => {
            const cat = p.categoria || 'Sem Categoria';
            if (contagemCategorias[cat]) {
                contagemCategorias[cat] += p.estoque;
            } else {
                contagemCategorias[cat] = p.estoque;
            }
        });

        const ctxCategoria = document.getElementById('graficoCategoria');
        if (ctxCategoria) {
            new Chart(ctxCategoria, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(contagemCategorias), // Nomes das categorias
                    datasets: [{
                        data: Object.values(contagemCategorias), // Quantidades
                        backgroundColor: ['#3498db', '#2ecc71', '#f1c40f', '#e74c3c', '#9b59b6'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'right' } }
                }
            });
        }

        // ==========================================
        // GRÁFICO : ENTRADAS VS SAÍDAS (Bar)
        // ==========================================
        let somaEntradas = 0;
        let somaSaidas = 0;

        // Soma o volume total de itens que entraram e saíram
        movimentacoes.forEach(m => {
            if (m.tipo === 'Entrada') somaEntradas += m.quantidade;
            if (m.tipo === 'Saida') somaSaidas += m.quantidade; // Sem acento, como combinamos!
        });

        const ctxMovimentacao = document.getElementById('graficoMovimentacao');
        if (ctxMovimentacao) {
            new Chart(ctxMovimentacao, {
                type: 'bar',
                data: {
                    labels: ['Entradas vs Saídas (Volume Total)'],
                    datasets: [
                        {
                            label: 'Entradas',
                            data: [somaEntradas],
                            backgroundColor: '#27ae60',
                            borderRadius: 5
                        },
                        {
                            label: 'Saídas',
                            data: [somaSaidas],
                            backgroundColor: '#c0392b',
                            borderRadius: 5
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: { y: { beginAtZero: true } }
                }
            });
        }

    } catch (erro) {
        console.error("Erro ao carregar os dados do Dashboard:", erro);
    }
}

// Efeito visual extra: Anima os números subindo do 0 até o valor final
function animarNumero(id, valorFinal) {
    const elemento = document.getElementById(id);
    if (!elemento) return;

    let valorAtual = 0;
    const incremento = Math.ceil(valorFinal / 20); // Divide a animação em passos
    
    const timer = setInterval(() => {
        valorAtual += incremento;
        if (valorAtual >= valorFinal) {
            elemento.innerText = valorFinal;
            clearInterval(timer);
        } else {
            elemento.innerText = valorAtual;
        }
    }, 30);
}

// Dispara a função assim que o usuário entra na tela principal
document.addEventListener('DOMContentLoaded', carregarDashboard);