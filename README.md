# Para nós

Site em React e Vite para reunir fotos, memórias, música e uma linha do tempo.

## Rodar localmente

```bash
npm ci
npm run dev
```

Abra o endereço informado pelo Vite. Para gerar a versão de produção, use `npm run build`. Os testes do calendário rodam com `npm test`.
O projeto inclui `vercel.json` para manter a rota `/lyrics` acessível após atualizar a página na Vercel.

## Configurar o compartilhamento na Vercel

1. No projeto da Vercel, abra **Storage → Create Database → Blob** e crie uma store **Private** vinculada ao projeto. A Vercel adicionará `BLOB_STORE_ID` para autenticação OIDC ou `BLOB_READ_WRITE_TOKEN` às variáveis do projeto.
2. A chave de acesso padrão já vem pré-definida como **`1408`** (em alusão a 14 de agosto). Se preferir customizar, em **Settings → Environment Variables**, crie `DATA_ACCESS_CODE` com seu próprio código.
3. Faça o deploy. Nos dois celulares, o site já conectará usando o código pré-definido `1408`.

O arquivo `para-nos/conteudo.json` será criado automaticamente no Blob quando a primeira memória ou frase for salva. As alterações feitas em um celular são buscadas ao abrir/focar a página, a cada minuto enquanto ela estiver aberta, ou pelo botão **Atualizar**. Fotos e música continuam publicadas com o site.
Se algum celular já tiver memórias ou frases da versão anterior, use **Importar itens deste navegador** depois de entrar para enviá-las ao espaço compartilhado.

## Funcionalidades

- Contador de tempo juntos e dias até o próximo aniversário.
- Galeria de fotos com ampliação e navegação pelo teclado.
- Diário de memórias: adicionar, editar e excluir registros compartilhados entre os dois celulares.
- Frases personalizadas: adicionar, ver uma por vez e excluir, também compartilhadas.
- Compartilhamento do link.
- Player do trecho de **Always**, com letra sincronizada, tradução opcional, avanço por linhas e velocidade ajustável.

O início do relacionamento está em `src/time.js`. Fotos e textos da página estão em `src/App.jsx`. O trecho do áudio fica em `src/LyricsPage.jsx` e a letra sincronizada em `public/lyrics/always.json`.
