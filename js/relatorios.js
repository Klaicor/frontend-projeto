const API_PRODUTOS = 'http://localhost:5031/api/produtos';
const API_MOVIMENTACOES = 'http://localhost:5031/api/movimentacoes';

async function gerarRelatorio() {
    const tipo = document.getElementById('tipoRelatorio').value;
    const categoria = document.getElementById('categoriaFiltro').value;
    const dataInicio = document.getElementById('dataInicio').value;
    const dataFim = document.getElementById('dataFim').value;
    
    const thead = document.getElementById('cabecalhoTabela');
    const tbody = document.getElementById('corpoTabelaRelatorio');
    
    // Atualiza os títulos
    const textoTipo = document.getElementById('tipoRelatorio').options[document.getElementById('tipoRelatorio').selectedIndex].text;
    document.getElementById('tituloResultado').innerHTML = `<i class="fa-solid fa-list-check"></i> Resultados: ${textoTipo}`;
    document.getElementById('tituloImpressao').innerText = `Relatório: ${textoTipo}`;

    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;"><i class="fa-solid fa-spinner fa-spin"></i> Carregando dados...</td></tr>';

    try {
        // LÓGICA 1: RELATÓRIOS DE ESTOQUE (Usa a API de Produtos)
        if (tipo === 'estoque_atual' || tipo === 'estoque_critico') {
            const resposta = await fetch(API_PRODUTOS);
            let produtos = await resposta.json();

            // Filtra por Categoria
            if (categoria !== 'Todas') {
                produtos = produtos.filter(p => p.categoria.toLowerCase() === categoria.toLowerCase());
            }

            // Filtra por Estoque Crítico (< 20)
            if (tipo === 'estoque_critico') {
                produtos = produtos.filter(p => p.estoque < 20);
            }

            // Desenha o Cabeçalho de Estoque
            thead.innerHTML = `
                <tr>
                    <th style="padding: 15px;">Código SKU</th>
                    <th style="padding: 15px;">Produto</th>
                    <th style="padding: 15px;">Categoria</th>
                    <th style="padding: 15px;">Estoque Atual</th>
                    <th style="padding: 15px;">Valor Unit. (Custo)</th>
                    <th style="padding: 15px;">Valor Total (Estoque)</th>
                </tr>
            `;

            tbody.innerHTML = '';
            let valorTotalGeral = 0;

            if (produtos.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">Nenhum produto encontrado.</td></tr>';
                return;
            }

            produtos.forEach(p => {
                const valorTotalItem = p.estoque * p.precoCusto;
                valorTotalGeral += valorTotalItem;

                const tr = document.createElement('tr');
                tr.style.borderBottom = '1px solid #eee';
                tr.innerHTML = `
                    <td style="padding: 12px; font-weight: bold;">${p.sku}</td>
                    <td style="padding: 12px;">${p.nome}</td>
                    <td style="padding: 12px;">${p.categoria}</td>
                    <td style="padding: 12px; color: ${p.estoque < 20 ? 'red' : 'black'}; font-weight: bold;">${p.estoque}</td>
                    <td style="padding: 12px;">R$ ${p.precoCusto.toFixed(2).replace('.', ',')}</td>
                    <td style="padding: 12px; font-weight: bold;">R$ ${valorTotalItem.toFixed(2).replace('.', ',')}</td>
                `;
                tbody.appendChild(tr);
            });

            // Linha de Total Geral no rodapé
            const trTotal = document.createElement('tr');
            trTotal.style.backgroundColor = '#e8f4f8';
            trTotal.innerHTML = `
                <td colspan="5" style="padding: 15px; text-align: right; font-weight: bold; color: var(--azul-escuro);">TOTAL GERAL EM ESTOQUE:</td>
                <td style="padding: 15px; font-weight: bold; color: var(--azul-primario);">R$ ${valorTotalGeral.toFixed(2).replace('.', ',')}</td>
            `;
            tbody.appendChild(trTotal);

        } 
        // LÓGICA 2: RELATÓRIOS DE MOVIMENTAÇÃO (Usa a API de Movimentacoes)
        else {
            const resposta = await fetch(API_MOVIMENTACOES);
            let movs = await resposta.json();

            // Filtra Entrada ou Saída
            const tipoBusca = tipo === 'entradas' ? 'Entrada' : 'Saida';
            movs = movs.filter(m => m.tipo === tipoBusca);

            // Filtro de Datas
            if (dataInicio) movs = movs.filter(m => new Date(m.dataHora) >= new Date(dataInicio + 'T00:00:00'));
            if (dataFim) movs = movs.filter(m => new Date(m.dataHora) <= new Date(dataFim + 'T23:59:59'));

            // Desenha Cabeçalho de Movimentação
            thead.innerHTML = `
                <tr>
                    <th style="padding: 15px;">Data/Hora</th>
                    <th style="padding: 15px;">Produto</th>
                    <th style="padding: 15px;">Qtd.</th>
                    <th style="padding: 15px;">Motivo/Nota</th>
                    <th style="padding: 15px;">Responsável</th>
                </tr>
            `;

            tbody.innerHTML = '';

            if (movs.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">Nenhum registro encontrado para este período.</td></tr>';
                return;
            }

            movs.forEach(m => {
                const dataFormatada = new Date(m.dataHora).toLocaleDateString('pt-BR') + ' ' + new Date(m.dataHora).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
                const tr = document.createElement('tr');
                tr.style.borderBottom = '1px solid #eee';
                tr.innerHTML = `
                    <td style="padding: 12px;">${dataFormatada}</td>
                    <td style="padding: 12px; font-weight: bold;">${m.produtoNome}</td>
                    <td style="padding: 12px; color: ${tipoBusca === 'Entrada' ? '#27ae60' : '#c0392b'}; font-weight: bold;">${tipoBusca === 'Entrada' ? '+' : '-'}${m.quantidade}</td>
                    <td style="padding: 12px;">${m.motivo}</td>
                    <td style="padding: 12px;">${m.responsavel}</td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (erro) {
        console.error(erro);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px; color: red;">Erro de conexão com a API.</td></tr>';
    }
}

// ==========================================
// FUNÇÃO EXPORTAR PDF
// ==========================================
function exportarPDF() {
    window.print();
}

// ==========================================
// FUNÇÃO EXPORTAR EXCEL (Gera um CSV nativo)
// ==========================================
function exportarExcel() {
    let tabela = document.getElementById("tabelaRelatorio");
    let linhas = tabela.querySelectorAll("tr");
    let csv = [];

    for (let i = 0; i < linhas.length; i++) {
        let linha = [], colunas = linhas[i].querySelectorAll("td, th");
        
        for (let j = 0; j < colunas.length; j++) {
            // Limpa o texto para evitar quebras no Excel
            let dado = colunas[j].innerText.replace(/(\r\n|\n|\r)/gm, "").trim();
            // Se tiver vírgula (ex: R$ 10,00), coloca entre aspas para o Excel não separar a coluna
            linha.push('"' + dado + '"');
        }
        csv.push(linha.join(";")); // Ponto e vírgula é o separador padrão do Excel em PT-BR
    }

    // Cria o arquivo virtual e força o download
    let csvString = csv.join("\n");
    let blob = new Blob(["\uFEFF" + csvString], { type: "text/csv;charset=utf-8;" }); // \uFEFF arruma os acentos (UTF-8)
    let link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "Relatorio_TechPaper.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Roda a função quando a tela abre para não ficar vazia
document.addEventListener('DOMContentLoaded', gerarRelatorio);