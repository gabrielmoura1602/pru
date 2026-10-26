# Prumo para Android

O mesmo Prumo, empacotado como app Android com o Capacitor.

- Dados salvos só no aparelho.
- Notificações agendadas pelo próprio Android (funcionam com o app fechado): 10 min antes, na hora e, se atrasar, mais algumas vezes.
- Layout para celular, com barra de abas embaixo e botão **+** flutuante.
- Tema claro, escuro ou automático (botão no topo e em Ajustes).

## Como gerar o APK (sem instalar nada no computador)

O GitHub compila o APK para você.

1. Crie uma conta em github.com, se ainda não tiver.
2. Crie um repositório novo, **privado** (a chave de assinatura do app fica dentro dele).
3. Envie o conteúdo desta pasta para o repositório. Na página do repositório: **Add file → Upload files**, arraste tudo (inclusive a pasta oculta `.github`) e confirme com **Commit changes**.
   - Se a pasta `.github` não subir, use **Add file → Create new file**, digite o nome `.github/workflows/build-apk.yml` e cole o conteúdo do arquivo de mesmo nome.
4. Abra a aba **Actions**. O fluxo **Gerar APK do Prumo** começa sozinho (ou clique em **Run workflow**). Leva de 5 a 10 minutos.
5. Quando ficar verde, abra **Releases** (coluna da direita da página inicial do repositório) e baixe o **Prumo.apk**. Dá para fazer isso direto no navegador do celular.
6. No Android, abra o arquivo baixado e permita a instalação de fontes desconhecidas quando ele pedir.

Para atualizar o app depois: troque os arquivos no repositório (por exemplo `src/index.html`) e o APK novo sai sozinho. Ele instala por cima do anterior **sem perder as tarefas**, porque todo build usa a mesma chave de assinatura (`keystore/debug.keystore`).

## Primeira abertura no celular

1. Aceite a permissão de **notificações**.
2. Vá em **Ajustes → Testar notificação** e saia do app: o aviso deve chegar em 5 segundos.
3. Se aparecer "Alarmes no horário exato: não permitidos", toque em **Permitir alarmes exatos**.
4. Em marcas com economia de bateria agressiva (Xiaomi, Samsung, Motorola, Huawei), abra as configurações do Android para o Prumo e escolha bateria **sem restrições**. Sem isso o sistema pode atrasar ou descartar avisos com o app fechado.

## Gerar no próprio computador (opcional)

Precisa de Node 20+, JDK 21 e Android Studio (para o SDK).

```
npm install
npm run android:add     # cria a pasta android/, aplica os ajustes e sincroniza
npm run android:apk     # gera android/app/build/outputs/apk/debug/app-debug.apk
```

Depois de mudar o `src/index.html`, rode `npm run android:sync` e `npm run android:apk` de novo.

## Estrutura

| Caminho | Para que serve |
|---|---|
| `src/index.html` | O app inteiro (HTML, CSS e JavaScript). Dá para abrir direto no navegador para testar o layout. |
| `src/native-bridge.js` | Liga o app às notificações, à barra de status e ao botão voltar do Android. |
| `scripts/build.js` | Monta a pasta `www/` que vai dentro do APK. |
| `scripts/patch-android.js` | Ajusta o projeto Android gerado: permissões, ícones, versão. |
| `resources/android/res` | Ícone do app e ícone das notificações. |
| `keystore/debug.keystore` | Chave de assinatura fixa, para atualizar o app sem desinstalar. |
| `.github/workflows/build-apk.yml` | Receita de compilação no GitHub. |

## Backup

Os dados ficam só no celular. Antes de desinstalar o app ou trocar de aparelho, use **Ajustes → Copiar backup** e guarde o texto. Para voltar, **Restaurar backup** e cole.
