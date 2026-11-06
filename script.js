// ============================================================================
// CONFIGURAÇÃO FIXA DO ALUNO — NÃO ALTERAR PELA PÁGINA
// ============================================================================
const CONFIG_ALUNO = {
  turma: "9B",
  numeroChamada: 30,
  apiUrl: "https://boletim-api.profbt.com.br"
};

// ============================================================================
// DADOS BRUTOS FICTÍCIOS DO 9º ANO (PRESERVADOS DO PROJETO ORIGINAL)
// ============================================================================
const dadosBoletimLocal = [
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

// ============================================================================
// ESTADO EM MEMÓRIA (PIN NUNCA É PERSISTIDO)
// ============================================================================
let pinSessao = null;           // PIN mantido apenas em memória
let dadosAtuais = null;         // dados exibidos no momento (local ou API)
let modoEdicao = false;

// ============================================================================
// NORMALIZAÇÃO DE NOTAS (DADOS ANTIGOS DO PROJETO)
// Aceita: 75 → 7,5 | 82 → 8,2 | 100 → 10 | "8,5" → 8,5 | 8.5 → 8,5 | null
// ============================================================================
function normalizarNota(valor) {
  if (valor === null || valor === undefined || valor === "") return null;
  if (typeof valor === "string") valor = valor.replace(",", ".");

  let num = Number(valor);
  if (isNaN(num)) return null;
  if (num > 10 && num <= 100) num = num / 10;
  if (num >= 0 && num <= 10) return num;

  return null;
}

function formatarExibicao(nota) {
  if (nota === null) return "—";
  return nota.toFixed(1).replace(".", ",");
}

// ============================================================================
// VALIDAÇÃO DE NOTA DIGITADA PELO ALUNO NO EDITOR
// Aceita: número 0–10, ponto ou vírgula decimal, ou vazio (→ null)
// Rejeita: 75, 82, 100, -1, 11, abc
// ============================================================================
function validarNotaEdicao(texto) {
  const bruto = String(texto).trim();
  if (bruto === "") return { ok: true, valor: null };
  const normalizado = bruto.replace(",", ".");
  // Aceita somente formato numérico simples (sem letras, sem múltiplos pontos)
  if (!/^\d+(\.\d+)?$/.test(normalizado)) return { ok: false };
  const num = Number(normalizado);
  if (!isFinite(num)) return { ok: false };
  if (num < 0 || num > 10) return { ok: false };
  return { ok: true, valor: num };
}

// ============================================================================
// VALIDAÇÃO DE FALTAS DIGITADAS PELO ALUNO
// Aceita: inteiro >= 0. Rejeita: -1, 2,5, abc, vazio.
// ============================================================================
function validarFaltaEdicao(texto) {
  const bruto = String(texto).trim();
  if (bruto === "") return { ok: false };
  if (!/^\d+$/.test(bruto)) return { ok: false };
  const num = Number(bruto);
  if (!isFinite(num) || num < 0) return { ok: false };
  return { ok: true, valor: num };
}

// ============================================================================
// RENDERIZAÇÃO: CARDS E TABELA (PERMITE ATUALIZAÇÃO MÚLTIPLA)
// ============================================================================
function carregarBoletim() {
  const corpoTabela = document.getElementById("corpo-tabela");
  corpoTabela.innerHTML = "";

  let somaMedias = 0;
  let qtdMediasValidas = 0;
  let totalFaltasGeral = 0;
  let contBomDesempenho = 0;
  let contAtencao = 0;

  dadosAtuais.forEach((item) => {
    const n1 = normalizarNota(item.tri1);
    const n2 = normalizarNota(item.tri2);
    const n3 = normalizarNota(item.tri3);

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

    const faltasArray = Array.isArray(item.faltas) ? item.faltas : [0, 0, 0];
    const totalFaltasDisc = faltasArray.reduce((acc, curr) => acc + (Number(curr) || 0), 0);
    totalFaltasGeral += totalFaltasDisc;

    const tr = document.createElement("tr");
    tr.dataset.index = dadosAtuais.indexOf(item);

    // Célula da disciplina (textContent por segurança)
    const tdDisc = document.createElement("td");
    tdDisc.textContent = item.disciplina;
    tr.appendChild(tdDisc);

    // Células de notas (1º, 2º, 3º trimestre)
    const tdsNotas = [n1, n2, n3];
    const chavesNotas = ["tri1", "tri2", "tri3"];
    tdsNotas.forEach((notaNorm, idx) => {
      const td = document.createElement("td");
      if (modoEdicao) {
        const input = document.createElement("input");
        input.type = "text";
        input.className = "input-edicao";
        input.dataset.tipo = "nota";
        input.dataset.index = tr.dataset.index;
        input.dataset.campo = chavesNotas[idx];
        input.value = notaNorm === null ? "" : String(notaNorm).replace(".", ",");
        td.appendChild(input);
      } else {
        td.textContent = formatarExibicao(notaNorm);
      }
      tr.appendChild(td);
    });

    // Média
    const tdMedia = document.createElement("td");
    const strong = document.createElement("strong");
    strong.textContent = formatarExibicao(media);
    tdMedia.appendChild(strong);
    tr.appendChild(tdMedia);

    // Faltas (total por disciplina)
    const tdFaltas = document.createElement("td");
    tdFaltas.textContent = String(totalFaltasDisc);
    tr.appendChild(tdFaltas);

    // Situação
    const tdSit = document.createElement("td");
    tdSit.className = classeSituacao;
    tdSit.textContent = situacao;
    tr.appendChild(tdSit);

    corpoTabela.appendChild(tr);
  });

  // Linha de edição de faltas por trimestre (quando em modo edição)
  if (modoEdicao) {
    // Substitui a coluna de "Faltas" por três inputs por trimestre em uma linha extra
    renderizarEdicaoFaltas();
  }

  const mediaGeral = qtdMediasValidas > 0
    ? (somaMedias / qtdMediasValidas).toFixed(1).replace(".", ",")
    : "—";
  document.getElementById("card-media").textContent = mediaGeral;
  document.getElementById("card-faltas").textContent = String(totalFaltasGeral);
  document.getElementById("card-bom-desempenho").textContent = String(contBomDesempenho);
  document.getElementById("card-atencao").textContent = String(contAtencao);
}

// Renderiza inputs de faltas por trimestre dentro da tabela
function renderizarEdicaoFaltas() {
  const corpoTabela = document.getElementById("corpo-tabela");
  const linhas = corpoTabela.querySelectorAll("tr");
  linhas.forEach((tr) => {
    const index = Number(tr.dataset.index);
    const item = dadosAtuais[index];
    const faltasArray = Array.isArray(item.faltas) ? item.faltas : [0, 0, 0];
    const tdFaltas = tr.children[5]; // coluna de faltas
    if (!tdFaltas) return;
    tdFaltas.innerHTML = "";
    for (let i = 0; i < 3; i++) {
      const input = document.createElement("input");
      input.type = "text";
      input.className = "input-edicao";
      input.dataset.tipo = "falta";
      input.dataset.index = String(index);
      input.dataset.trimestre = String(i);
      input.value = String(Number(faltasArray[i]) || 0);
      input.style.marginBottom = "2px";
      input.style.display = "inline-block";
      tdFaltas.appendChild(input);
      if (i < 2) tdFaltas.appendChild(document.createElement("br"));
    }
  });
}

// ============================================================================
// SORTEIO DE 20% DE CHANCE DE CHOVER NO CARREGAMENTO
// ============================================================================
function sortearClima() {
  const chance = Math.random();
  if (chance < 0.20) {
    const camadaChuva = document.getElementById("camada-chuva");
    const camadaRaio = document.getElementById("camada-raio");

    camadaChuva.style.display = "block";
    camadaRaio.style.display = "block";

    for (let i = 0; i < 45; i++) {
      const pingo = document.createElement("div");
      pingo.className = "pingo-chuva";
      pingo.style.left = Math.random() * 100 + "vw";
      pingo.style.animationDelay = Math.random() * 0.8 + "s";
      pingo.style.animationDuration = (0.5 + Math.random() * 0.4) + "s";
      camadaChuva.appendChild(pingo);
    }

    setInterval(() => {
      if (Math.random() < 0.3) {
        camadaRaio.classList.add("animar-raio");
        setTimeout(() => camadaRaio.classList.remove("animar-raio"), 350);
      }
    }, 4500);
  }
}

// ============================================================================
// TELA DE ACESSO POR PIN — POST /abrir
// ============================================================================
function configurarTelaPin() {
  const inputPin = document.getElementById("input-pin");
  const btnEntrar = document.getElementById("btn-entrar");
  const mensagem = document.getElementById("pin-mensagem");

  btnEntrar.addEventListener("click", async () => {
    const pin = inputPin.value.trim();
    if (pin === "") {
      mensagem.textContent = "Digite o PIN.";
      return;
    }

    mensagem.textContent = "Conectando...";
    btnEntrar.disabled = true;

    try {
      const resposta = await fetch(`${CONFIG_ALUNO.apiUrl}/api/v1/boletins/abrir`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          turma: CONFIG_ALUNO.turma,
          numero_chamada: CONFIG_ALUNO.numeroChamada,
          pin: pin
        })
      });

      if (resposta.status === 401) {
        mensagem.textContent = "Turma, chamada ou PIN inválidos.";
        btnEntrar.disabled = false;
        return;
      }
      if (resposta.status === 429) {
        mensagem.textContent = "Muitas tentativas. Aguarde um minuto e tente novamente.";
        btnEntrar.disabled = false;
        return;
      }
      if (!resposta.ok) {
        mensagem.textContent = "Não foi possível conectar ao servidor. Tente novamente.";
        btnEntrar.disabled = false;
        return;
      }

      const json = await resposta.json();
      // PIN permanece somente em memória
      pinSessao = pin;
      // Limpa o campo imediatamente após login bem-sucedido
      inputPin.value = "";
      mensagem.textContent = "";

      // Define dados a exibir: API > local
      if (json && json.dados !== null && json.dados !== undefined) {
        dadosAtuais = normalizarDadosApi(json.dados);
      } else {
        dadosAtuais = JSON.parse(JSON.stringify(dadosBoletimLocal));
      }

      // Alterna telas
      document.getElementById("area-pin").hidden = true;
      document.getElementById("conteudo-boletim").hidden = false;

      carregarBoletim();
      configurarBotoesEdicao();
      atualizarGraficos();
    } catch (erro) {
      mensagem.textContent = "Não foi possível conectar ao servidor. Tente novamente.";
      btnEntrar.disabled = false;
    }
  });

  // Permite Enter no campo PIN
  inputPin.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      btnEntrar.click();
    }
  });
}

// Normaliza o formato dos dados vindos da API para o formato interno do projeto
function normalizarDadosApi(dadosApi) {
  const lista = Array.isArray(dadosApi.disciplinas) ? dadosApi.disciplinas : [];
  return lista.map((d) => {
    let faltas = [0, 0, 0];
    if (Array.isArray(d.faltas)) {
      faltas = [0, 0, 0].map((_, i) => Number(d.faltas[i]) || 0);
    } else if (d.faltas && typeof d.faltas === "object") {
      faltas = [
        Number(d.faltas.tri1) || 0,
        Number(d.faltas.tri2) || 0,
        Number(d.faltas.tri3) || 0
      ];
    }
    return {
      disciplina: String(d.disciplina || ""),
      tri1: d.tri1 !== undefined ? d.tri1 : null,
      tri2: d.tri2 !== undefined ? d.tri2 : null,
      tri3: d.tri3 !== undefined ? d.tri3 : null,
      faltas: faltas
    };
  });
}

// ============================================================================
// BOTÕES DE EDIÇÃO E SALVAMENTO
// ============================================================================
function configurarBotoesEdicao() {
  const btnAlterar = document.getElementById("btn-alterar");
  const btnSalvar = document.getElementById("btn-salvar");
  const btnCancelar = document.getElementById("btn-cancelar");
  const status = document.getElementById("status-salvamento");

  btnAlterar.onclick = () => {
    modoEdicao = true;
    btnAlterar.hidden = true;
    btnSalvar.hidden = false;
    btnCancelar.hidden = false;
    status.textContent = "";
    status.className = "status-salvamento";
    carregarBoletim();
  };

  btnCancelar.onclick = () => {
    modoEdicao = false;
    btnAlterar.hidden = false;
    btnSalvar.hidden = true;
    btnCancelar.hidden = true;
    status.textContent = "";
    status.className = "status-salvamento";
    carregarBoletim();
    atualizarGraficos();
  };

  btnSalvar.onclick = async () => {
    // Valida todos os inputs antes de enviar
    const inputs = document.querySelectorAll(".input-edicao");
    let invalido = false;

    inputs.forEach((input) => {
      input.classList.remove("invalido");
      const tipo = input.dataset.tipo;
      const texto = input.value;

      if (tipo === "nota") {
        const r = validarNotaEdicao(texto);
        if (!r.ok) {
          input.classList.add("invalido");
          invalido = true;
        } else {
          const index = Number(input.dataset.index);
          const campo = input.dataset.campo;
          dadosAtuais[index][campo] = r.valor;
        }
      } else if (tipo === "falta") {
        const r = validarFaltaEdicao(texto);
        if (!r.ok) {
          input.classList.add("invalido");
          invalido = true;
        } else {
          const index = Number(input.dataset.index);
          const tri = Number(input.dataset.trimestre);
          if (!Array.isArray(dadosAtuais[index].faltas)) {
            dadosAtuais[index].faltas = [0, 0, 0];
          }
          dadosAtuais[index].faltas[tri] = r.valor;
        }
      }
    });

    if (invalido) {
      status.textContent = "Verifique os campos destacados em vermelho.";
      status.className = "status-salvamento erro";
      return;
    }

    status.textContent = "Salvando...";
    status.className = "status-salvamento";
    btnSalvar.disabled = true;

    // Prepara dados no formato esperado pela API
    const dadosParaSalvar = {
      disciplinas: dadosAtuais.map((d) => ({
        disciplina: d.disciplina,
        tri1: d.tri1,
        tri2: d.tri2,
        tri3: d.tri3,
        faltas: Array.isArray(d.faltas) ? d.faltas : [0, 0, 0]
      }))
    };

    try {
      const resposta = await fetch(`${CONFIG_ALUNO.apiUrl}/api/v1/boletins/salvar`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          turma: CONFIG_ALUNO.turma,
          numero_chamada: CONFIG_ALUNO.numeroChamada,
          pin: pinSessao,
          dados: dadosParaSalvar
        })
      });

      if (resposta.status === 401) {
        status.textContent = "Sessão inválida. Entre novamente.";
        status.className = "status-salvamento erro";
        btnSalvar.disabled = false;
        return;
      }
      if (resposta.status === 429) {
        status.textContent = "Muitas tentativas. Aguarde um minuto e tente novamente.";
        status.className = "status-salvamento erro";
        btnSalvar.disabled = false;
        return;
      }
      if (!resposta.ok) {
        status.textContent = "Não foi possível salvar. Tente novamente.";
        status.className = "status-salvamento erro";
        btnSalvar.disabled = false;
        return;
      }

      // Sucesso
      modoEdicao = false;
      btnAlterar.hidden = false;
      btnSalvar.hidden = true;
      btnSalvar.disabled = false;
      btnCancelar.hidden = true;
      status.textContent = "Dados salvos com sucesso.";
      status.className = "status-salvamento sucesso";
      carregarBoletim();
      atualizarGraficos();
    } catch (erro) {
      status.textContent = "Não foi possível salvar. Tente novamente.";
      status.className = "status-salvamento erro";
      btnSalvar.disabled = false;
    }
  };
}

// ============================================================================
// GRÁFICOS — CAMADA SOMENTE LEITURA
// Utiliza exclusivamente o estado `dadosAtuais` que já monta tabela e cards.
// Nenhuma função abaixo escreve em `dadosAtuais`, em notas, em faltas ou no
// payload da API. Nenhuma requisição nova é feita.
// ============================================================================

let graficoMedias = null;
let graficoEvolucao = null;
let graficoFaltas = null;

// Referência interna de risco (usada APENAS para avaliar o estado de perigo).
// Nunca é exibida na interface.
const REFERENCIA_FALTAS_RISCO = 350;

// Calcula a média de uma disciplina replicando a regra de `carregarBoletim`.
// Somente leitura — não altera nada.
function _mediaDisciplinaGrafico(item) {
  const n1 = normalizarNota(item.tri1);
  const n2 = normalizarNota(item.tri2);
  const n3 = normalizarNota(item.tri3);
  const validas = [n1, n2, n3].filter((n) => n !== null);
  if (validas.length === 0) return null;
  return validas.reduce((a, c) => a + c, 0) / validas.length;
}

// Gráfico 1 — Média por disciplina (barras horizontais)
function atualizarGraficoMedias() {
  const canvas = document.getElementById("graficoMediasDisciplinas");
  if (!canvas || typeof Chart === "undefined") return;
  if (!Array.isArray(dadosAtuais)) return;

  // Cópia somente leitura dos dados
  const disciplinas = dadosAtuais.map((d) => d.disciplina);
  const medias = dadosAtuais.map((d) => {
    const m = _mediaDisciplinaGrafico(d);
    return m === null ? null : Number(m.toFixed(2));
  });

  if (graficoMedias) {
    graficoMedias.destroy();
    graficoMedias = null;
  }

  const ctx = canvas.getContext("2d");
  graficoMedias = new Chart(ctx, {
    type: "bar",
    data: {
      labels: disciplinas,
      datasets: [{
        label: "Média",
        data: medias,
        backgroundColor: "rgba(30, 37, 48, 0.85)",
        borderColor: "#1e2530",
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function (ctx) {
              const v = ctx.parsed.x;
              if (v === null || v === undefined) return "Sem nota";
              return "Média: " + Number(v).toFixed(1).replace(".", ",");
            }
          }
        }
      },
      scales: {
        x: {
          min: 0,
          max: 10,
          ticks: {
            color: "#5a6578",
            font: { size: 11 }
          },
          grid: { color: "rgba(90, 101, 120, 0.15)" }
        },
        y: {
          ticks: {
            color: "#1e2530",
            font: { size: 11 }
          },
          grid: { color: "rgba(90, 101, 120, 0.08)" }
        }
      }
    }
  });
}

// Gráfico 2 — Evolução da média geral (linha)
function atualizarGraficoEvolucao() {
  const canvas = document.getElementById("graficoEvolucaoTrimestres");
  if (!canvas || typeof Chart === "undefined") return;
  if (!Array.isArray(dadosAtuais)) return;

  const trimestres = ["tri1", "tri2", "tri3"];
  const mediasPorTri = trimestres.map((campo) => {
    let soma = 0;
    let qtd = 0;
    dadosAtuais.forEach((d) => {
      const n = normalizarNota(d[campo]);
      if (n !== null) {
        soma += n;
        qtd++;
      }
    });
    return qtd > 0 ? Number((soma / qtd).toFixed(2)) : null;
  });

  if (graficoEvolucao) {
    graficoEvolucao.destroy();
    graficoEvolucao = null;
  }

  const ctx = canvas.getContext("2d");
  graficoEvolucao = new Chart(ctx, {
    type: "line",
    data: {
      labels: ["1º Tri", "2º Tri", "3º Tri"],
      datasets: [{
        label: "Média geral",
        data: mediasPorTri,
        borderColor: "#15803d",
        backgroundColor: "rgba(21, 128, 61, 0.15)",
        pointBackgroundColor: "#15803d",
        pointBorderColor: "#ffffff",
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.3,
        spanGaps: false,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function (ctx) {
              const v = ctx.parsed.y;
              if (v === null || v === undefined) return "Sem nota";
              return "Média: " + Number(v).toFixed(1).replace(".", ",");
            }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: "#5a6578", font: { size: 11 } },
          grid: { display: false }
        },
        y: {
          min: 0,
          max: 10,
          ticks: { color: "#5a6578", font: { size: 11 } },
          grid: { color: "rgba(90, 101, 120, 0.15)" }
        }
      }
    }
  });
}

// Gráfico 3 — Faltas por trimestre (três barras) + badge Perigo interno
function atualizarGraficoFaltas() {
  const canvas = document.getElementById("graficoFaltasTrimestres");
  if (!canvas || typeof Chart === "undefined") return;
  if (!Array.isArray(dadosAtuais)) return;

  let faltasTri1 = 0;
  let faltasTri2 = 0;
  let faltasTri3 = 0;

  dadosAtuais.forEach((d) => {
    const arr = Array.isArray(d.faltas) ? d.faltas : [0, 0, 0];
    faltasTri1 += Number(arr[0]) || 0;
    faltasTri2 += Number(arr[1]) || 0;
    faltasTri3 += Number(arr[2]) || 0;
  });

  const totalFaltas = faltasTri1 + faltasTri2 + faltasTri3;

  if (graficoFaltas) {
    graficoFaltas.destroy();
    graficoFaltas = null;
  }

  const ctx = canvas.getContext("2d");
  graficoFaltas = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["1º Tri", "2º Tri", "3º Tri"],
      datasets: [{
        label: "Faltas",
        data: [faltasTri1, faltasTri2, faltasTri3],
        backgroundColor: "rgba(185, 28, 28, 0.75)",
        borderColor: "#b91c1c",
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function (ctx) {
              const v = ctx.parsed.y;
              return v + " faltas";
            }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: "#5a6578", font: { size: 11 } },
          grid: { display: false }
        },
        y: {
          beginAtZero: true,
          ticks: { color: "#5a6578", font: { size: 11 }, precision: 0 },
          grid: { color: "rgba(90, 101, 120, 0.15)" }
        }
      }
    }
  });

  // Badge interno de perigo — APENAS a palavra "Perigo". Nenhuma referência
  // numérica, percentual ou regra é exposta na interface.
  const cardFaltas = document.getElementById("grafico-card-faltas");
  const estadoFaltas = document.getElementById("estadoFaltas");
  if (cardFaltas && estadoFaltas) {
    const emPerigo = totalFaltas >= REFERENCIA_FALTAS_RISCO;
    cardFaltas.classList.toggle("perigo", emPerigo);
    estadoFaltas.innerHTML = "";
    if (emPerigo) {
      const badge = document.createElement("span");
      badge.className = "badge-perigo";
      badge.textContent = "Perigo";
      estadoFaltas.appendChild(badge);
    }
  }
}

// Atualiza os três gráficos. Chamada somente após processos já concluídos.
function atualizarGraficos() {
  atualizarGraficoMedias();
  atualizarGraficoEvolucao();
  atualizarGraficoFaltas();
}

// ============================================================================
// INICIALIZAÇÃO
// ============================================================================
configurarTelaPin();
sortearClima();
