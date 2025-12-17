import pkg from 'whatsapp-web.js';
const { Client, LocalAuth, MessageMedia } = pkg;
import qrcode from 'qrcode-terminal';

/* ===== CONFIG ===== */
const GRUPO_ORIGEM = 'Rainha do Bug 41';
const GRUPOS_DESTINO = [
  'ACHEI NA SHÔ 😍🛒',
  'DESCONTO DO DIA🔥🛒'
];

// SEU ID DE AFILIADO DA SHOPEE
const AFF_CODE = '5S3FDMT';

/* ===== FUNÇÃO DE CONVERSÃO ===== */
function converter(link) {
  const encoded = encodeURIComponent(link);
  return `https://affiliate.shopee.com.br/redirect?code=${AFF_CODE}&url=${encoded}`;
}

/* ===== FORMATA A MENSAGEM ===== */
function montarMensagem(original) {
  let texto = original;

  // 1 — Troca "Compre pelo link" pela frase nova
  texto = texto.replace(/compre pelo link[:]?/i, 'PEGUE O CUPOM DE DESCONTO DO DIA AQUI');

  // 2 — Remove links antigos (serão substituídos pelo seu)
  texto = texto.replace(/https?:\/\/[^\s]+/g, '');

  // 3 — Remove duplicação da frase nova e tudo abaixo da segunda ocorrência
  const ocorrencias = [...texto.matchAll(/PEGUE O CUPOM DE DESCONTO DO DIA AQUI/gi)];
  if (ocorrencias.length > 1) {
    const posSegunda = ocorrencias[1].index;
    texto = texto.substring(0, posSegunda).trim();
  }

  return texto.trim();
}

/* ===== BOT WHATSAPP ===== */
const client = new Client({
  authStrategy: new LocalAuth()
});

client.on('message', async msg => {
  if (!msg.from.includes('@g.us')) return;

  const chat = await msg.getChat();

  if (chat.name !== GRUPO_ORIGEM) return;

  const texto = msg.body || '';

  if (!texto.toLowerCase().includes('shopee')) return;

  // Extrai link Shopee
  const linkShopee = texto.match(/https?:\/\/[^\s]+/g);
  if (!linkShopee) return;

  // Converte link para o seu afiliado
  const linkConvertido = converter(linkShopee[0]);

  // Monta texto final
  const corpo = montarMensagem(texto);

  const mensagemFinal =
    `${corpo}\n\n👉 PEGUE O CUPOM DE DESCONTO DO DIA AQUI\n${linkConvertido}`;

  // Pega mídia da mensagem original
  let midia = null;
  if (msg.hasMedia) {
    midia = await msg.downloadMedia();
  }

  // Envia para os dois grupos
  const chats = await client.getChats();
  for (const nome of GRUPOS_DESTINO) {
    const destino = chats.find(c => c.name === nome);
    if (!destino) continue;

    // Envia com a imagem ou sem
    if (midia) {
      await destino.sendMessage(
        new MessageMedia(midia.mimetype, midia.data, midia.filename),
        { caption: mensagemFinal }
      );
    } else {
      await destino.sendMessage(mensagemFinal);
    }
  }
});

/* ===== QR CODE ===== */
client.on('qr', qr => qrcode.generate(qr, { small: true }));
client.on('ready', () => console.log('BOT CONECTADO'));
client.initialize();
