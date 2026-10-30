// Dados brutos fictícios do 9º Ano
const dadosBoletim = [
  { disciplina: "Língua Portuguesa", tri1: 78, tri2: "8,2", tri3: 8.6, faltas: [2, 2, 1] },
  { disciplina: "Matemática", tri1: 55, tri2: "5,4", tri3: null, faltas: [3, 2, 2] },
  { disciplina: "Ciências", tri1: 84, tri2: 7.9, tri3: "8,3", faltas: [1, 1, 1] },
  { disciplina: "História", tri1: "7,1", tri2: 82, tri3: null, faltas: [1, 2, 1] },
  { disciplina: "Geografia", tri1: 69, tri2: "7,5", tri3: 7.8, faltas: [0, 1, 1] },
  { disciplina: "Língua Inglesa", tri1: 88, tri2: 8.4, tri3: null, faltas: [1, 0, 1] },
  { disciplina: "Arte", tri1: "9,2", tri2: 87, tri3: 9.0, faltas: [1, 1, 0] },
  { disciplina: "Educação Física", tri1: 96, tri2: "9,3", tri3: null, faltas: [0, 1, 0] },
  { disciplina: "Educação Digital", tri1: 91, tri2: 8.9, tri3: "9,4", faltas: [1, 1, 0] },
  { disciplina: "Educação Financeira", tri1: 76, tri2: "7,2", tri3: null, faltas: [1, 1, 1] },
  { disciplina: "Rec. Aprend. Matemática", tri1: 58, tri2: "5,9", tri3: 6.2, faltas: [2, 2, 1] },
  { disciplina: "Leitura Rec. Aprend. Lingua Portuguesa", tri1: 72, tri2: "7,6", tri3: null, faltas: [2, 1, 1] },
  { disciplina: "Pensamento Lógico", tri1: 49, tri2: 5.5, tri3: "5,8", faltas: [2, 2, 2] },
  { disciplina: "Literatura Arte e Movimento", tri1: "8,0", tri2: 84, tri3: null, faltas: [1, 1, 0] },
  { disciplina: "Práticas Experimentais", tri1: 64, tri2: "6,6", tri3: 7.0, faltas: [1, 1, 1] }
];

// Função para normalizar notas na escala de 0 a 10
function normalizarNota(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }

  // Converter vírgula para ponto se for texto
  if (typeof valor === "string") {
    valor = valor.replace(",", ".");
  }

  let num = Number(valor);

  if (isNaN(num)) {
    return null;
  }

  // Se a nota estiver na escala 0-100, divide por 10
  if (num > 10 && num <= 100) {
    num = num / 10;
  }

  // Verifica se está dentro do limite valido de 0 a 10
  if (num >= 0 && num <= 10) {
    return num;
  }

  return null;
}

// Função para formatar a nota na exibição (ex: 8.2 vira "8,2")
function formatarExibicao(nota) {
  if (nota === null) return "—";
  return nota.toFixed(1).replace(".", ",");
}

// Inicializar a tabela e os cards
function carregarBoletim() {
  const corpoTabela = document.getElementById("corpo-tabela");
  corpoTabela.innerHTML = "";

  let somaMedias = 0;
  let qtdMediasValidas = 0;
  let totalFaltasGeral = 0;
  let contBomDesempenho = 0;
  let contAtencao = 0;

  dadosBoletim.forEach((item) => {
    // Normalização das notas
    const n1 = normalizarNota(item.tri1);
    const n2 = normalizarNota(item.tri2);
    const n3 = normalizarNota(item.tri3);

    // Cálculo das notas disponíveis para média
    const notasDisponiveis = [n1, n2, n3].filter((n) => n !== null);

    let media = null;
    let situacao = "Nota ainda não disponível";
    let classeSituacao = "situacao-indisponivel";

    if (notasDisponiveis.length > 0) {
      const soma = notasDisponiveis.reduce((acc, curr) => acc + curr, 0);
      media = soma / notasDisponiveis.length;

      somaMedias += media;
      qtdMediasValidas++;

      if (media >= 6.0) {
        situacao = "Bom desempenho";
        classeSituacao = "situacao-bom";
        contBomDesempenho++;
      } else {
        situacao = "Atenção";
        classeSituacao = "situacao-atencao";
        contAtencao++;
      }
    }

    // Soma das faltas da disciplina
    const totalFaltasDisc = item.faltas.reduce((acc, curr) => acc + curr, 0);
    totalFaltasGeral += totalFaltasDisc;

    // Criar linha na tabela
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.disciplina}</td>
      <td>${formatarExibicao(n1)}</td>
      <td>${formatarExibicao(n2)}</td>
      <td>${formatarExibicao(n3)}</td>
      <td><strong>${formatarExibicao(media)}</strong></td>
      <td>${totalFaltasDisc}</td>
      <td class="${classeSituacao}">${situacao}</td>
    `;
    corpoTabela.appendChild(tr);
  });

  // Atualização dos Cards de Resumo
  const mediaGeral = qtdMediasValidas > 0 ? (somaMedias / qtdMediasValidas).toFixed(1).replace(".", ",") : "—";
  document.getElementById("card-media").textContent = mediaGeral;
  document.getElementById("card-faltas").textContent = totalFaltasGeral;
  document.getElementById("card-bom-desempenho").textContent = contBomDesempenho;
  document.getElementById("card-atencao").textContent = contAtencao;

  // NOTA: A frequência de 92% abaixo é apenas demonstrativa/fictícia nesta versão.
}

// Executa a função ao carregar a página
carregarBoletim();