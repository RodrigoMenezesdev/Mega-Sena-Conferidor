// Constantes e referências
const jogosContainer = document.getElementById("jogos-container");
const btnAdicionar = document.getElementById("adicionar-jogo");
const btnApurar = document.getElementById("apurar");
const btnSalvar = document.getElementById("salvar-jogos");
const btnCarregar = document.getElementById("carregar-jogos");
const btnLimpar = document.getElementById("limpar-jogos");
const resultadoFinal = document.getElementById("resultado-final");
const inputResultado = document.getElementById("resultado");
const inputData = document.getElementById("dataSorteio");

let totalJogos = 0;
const maxJogos = 30;
const STORAGE_KEY = "mega_sena_jogos_v1";

// Função utilitária: cria um elemento jogo com controles (excluir)
function criarJogoDOM(nome = "", dezenas = "") {
  if (totalJogos >= maxJogos) {
    alert("Limite de 30 jogos atingido!");
    return null;
  }

  totalJogos++;
  const div = document.createElement("div");
  div.className = "jogo";
  div.dataset.idx = Date.now() + Math.random(); // id leve
  div.innerHTML = `
    <div class="row">
      <label>Nome:</label>
      <input type="text" class="nome" placeholder="Ex: Rodrigo ADM" value="${escapeHtml(nome)}">
    </div>
    <div class="row">
      <label>Dezenas:</label>
      <input type="text" class="dezenas" placeholder="Ex: 06, 15, 22, 36, 41, 60" value="${escapeHtml(dezenas)}">
    </div>
    <div class="controls">
      <button class="btn-pequeno btn-excluir">Excluir participante</button>
    </div>
  `;

  // Excluir
  const btnExcluir = div.querySelector(".btn-excluir");
  btnExcluir.addEventListener("click", () => {
    if (confirm("Excluir este participante?")) {
      div.remove();
      totalJogos--;
    }
  });

  jogosContainer.appendChild(div);
  return div;
}

// Escape simples para evitar injeção de tags no value (proteção mínima)
function escapeHtml(str) {
  return String(str || "").replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Adicionar novo jogo em branco
btnAdicionar.addEventListener("click", () => {
  criarJogoDOM();
});

// Apurar resultado
btnApurar.addEventListener("click", () => {
  const resultadoTexto = inputResultado.value.trim();
  const dataTexto = inputData.value;

  if (!resultadoTexto) {
    alert("Digite o resultado do sorteio (6 dezenas).");
    return;
  }

  // Normaliza resultado: array de strings com 2 dígitos
  const resultado = resultadoTexto.split(",")
    .map(n => n.trim())
    .filter(Boolean)
    .map(n => n.padStart(2, "0"));

  if (resultado.length < 1) {
    alert("Resultado inválido.");
    return;
  }

  // Título do resultado com data e dezenas
  resultadoFinal.innerHTML = "";
  const header = document.createElement("div");
  header.className = "result-line";
  header.innerHTML = `<strong>Resultado do Sorteio:</strong> ${resultado.join(", ")}${dataTexto ? " — Data: " + dataTexto : ""}`;
  resultadoFinal.appendChild(header);

  let encontrados = 0;
  const jogos = Array.from(document.querySelectorAll(".jogo"));

  jogos.forEach((jogoDiv) => {
    const nome = jogoDiv.querySelector(".nome").value.trim();
    const dezenasTexto = jogoDiv.querySelector(".dezenas").value.trim();
    if (!nome || !dezenasTexto) return;

    // Normaliza dezenas do jogador
    const dezenas = dezenasTexto.split(",")
      .map(d => d.trim())
      .filter(Boolean)
      .map(d => d.padStart(2, "0"));

    // Verifica acertos
    const acertos = dezenas.filter(d => resultado.includes(d));

    if (acertos.length > 0) {
      encontrados++;
      const dezenasMarcadas = dezenas.map(d =>
        acertos.includes(d) ? `<span class="dezena-acerto">${d}</span>` : d
      ).join(", ");

      const bloco = document.createElement("div");
      bloco.className = "resultado";
      bloco.innerHTML = `
        <strong>${escapeHtml(nome)}</strong> - ${acertos.length} ponto(s)<br>
        Dezenas: ${dezenasMarcadas}
      `;
      resultadoFinal.appendChild(bloco);
    }
  });

  if (encontrados === 0) {
    const p = document.createElement("p");
    p.textContent = "Nenhum participante acertou alguma dezena.";
    resultadoFinal.appendChild(p);
  }
});

// SALVAR jogos no localStorage
btnSalvar.addEventListener("click", () => {
  const jogos = [];
  const jogosDOM = Array.from(document.querySelectorAll(".jogo"));
  jogosDOM.forEach(j => {
    const nome = j.querySelector(".nome").value.trim();
    const dezenas = j.querySelector(".dezenas").value.trim();
    if (nome || dezenas) {
      jogos.push({ nome, dezenas });
    }
  });

  if (jogos.length === 0) {
    if (!confirm("Não há jogos preenchidos. Deseja salvar mesmo assim (limpa a chave)?")) return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(jogos));
  alert("Jogos salvos localmente.");
});

// CARREGAR jogos do localStorage
btnCarregar.addEventListener("click", () => {
  const dados = localStorage.getItem(STORAGE_KEY);
  if (!dados) {
    alert("Não há jogos salvos.");
    return;
  }
  try {
    const jogos = JSON.parse(dados);
    // limpa DOM atual
    jogosContainer.innerHTML = "";
    totalJogos = 0;
    if (Array.isArray(jogos)) {
      jogos.slice(0, maxJogos).forEach(j => criarJogoDOM(j.nome || "", j.dezenas || ""));
      alert(`Carregados ${Math.min(jogos.length, maxJogos)} jogo(s).`);
    } else {
      alert("Formato de dados inválido.");
    }
  } catch (e) {
    console.error(e);
    alert("Erro ao carregar os jogos salvos.");
  }
});

// LIMPAR todos os jogos do DOM (não apaga localStorage a menos que confirme)
btnLimpar.addEventListener("click", () => {
  if (!confirm("Remover todos os participantes da tela? (Os jogos salvos no dispositivo não serão alterados)")) return;
  jogosContainer.innerHTML = "";
  totalJogos = 0;
});

// Se desejar, ao abrir a página carregamos automaticamente (opcional).
// Comentado por padrão para evitar sobregravar sem consentimento.
// loadOnStart();

function loadOnStart(){
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const arr = JSON.parse(saved);
      if (Array.isArray(arr) && arr.length){
        jogosContainer.innerHTML = "";
        totalJogos = 0;
        arr.slice(0, maxJogos).forEach(j => criarJogoDOM(j.nome || "", j.dezenas || ""));
      }
    } catch(e){ console.warn("Não foi possível carregar autosave"); }
  }
}

// opcional: chamar se quiser auto-load
// loadOnStart();