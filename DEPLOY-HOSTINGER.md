# Como colocar o Criativos WD online na Hostinger (VPS + domínio)

Este guia explica passo a passo como publicar o projeto em um **VPS da Hostinger** usando um **domínio da Hostinger**.

---

## O que você vai precisar

- Conta na Hostinger
- **VPS** contratado (ex.: KVM1 – 1 vCPU, 4 GB RAM)
- **Domínio** (pode ser o mesmo da Hostinger ou outro)
- Computador com acesso SSH (Windows: use PowerShell ou [PuTTY](https://www.putty.org/))

---

## Parte 1: Contratar e acessar o VPS na Hostinger

### 1.1 Contratar o VPS

1. Acesse [hostinger.com.br](https://www.hostinger.com.br) e faça login.
2. Vá em **VPS** e escolha um plano (para este app, **KVM1** ou superior é suficiente).
3. Selecione o sistema operacional **Ubuntu 22.04** (ou 24.04).
4. Finalize a compra.

### 1.2 Ver IP e senha do VPS

1. No painel da Hostinger, vá em **VPS** → seu servidor.
2. Anote:
   - **IP do servidor** (ex.: `123.45.67.89`)
   - **Senha root** (ou crie uma se pedir).

### 1.3 Conectar por SSH

No **PowerShell** (Windows) ou Terminal (Mac/Linux):

```bash
ssh root@SEU_IP_DO_VPS
```

Quando pedir, digite a senha do root. Na primeira vez pode aparecer uma pergunta “Are you sure you want to continue connecting?” — digite `yes`.

Você estará dentro do servidor quando aparecer algo como `root@vps123:~#`.

---

## Parte 2: Preparar o servidor (Ubuntu)

Execute os comandos abaixo **um bloco por vez**, na ordem.

### 2.1 Atualizar o sistema

```bash
apt update && apt upgrade -y
```

### 2.2 Instalar Node.js (versão 20 LTS)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node -v   # deve mostrar v20.x.x
npm -v
```

### 2.3 Instalar Nginx (proxy reverso)

```bash
apt install -y nginx
systemctl enable nginx
systemctl start nginx
```

### 2.4 Instalar PM2 (manter o Node rodando)

```bash
npm install -g pm2
```

### 2.5 FFmpeg (já vem no app via `ffmpeg-static`)

O projeto usa o binário do FFmpeg embutido (`ffmpeg-static`), então **não é obrigatório** instalar FFmpeg no sistema. Se quiser usar o do sistema (opcional):

```bash
apt install -y ffmpeg
```

---

## Parte 3: Enviar o projeto para o VPS

Você pode usar **Git** ou **upload manual**. O jeito mais prático é com Git.

### Opção A: Usando Git (recomendado)

**No seu PC (no projeto):**

1. Crie um repositório no GitHub (ex.: `criativos-wd`).
2. No PowerShell, na pasta do projeto:

```bash
cd "D:\6 - WD\CRIATIVOS WD"
git init
git add .
git commit -m "Deploy inicial"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/criativos-wd.git
git push -u origin main
```

**No VPS (via SSH):**

```bash
apt install -y git
cd /var/www
git clone https://github.com/SEU_USUARIO/criativos-wd.git
cd criativos-wd
```

### Opção B: Upload manual (ZIP + SCP)

**No seu PC:**

1. Compacte a pasta do projeto em ZIP **sem** a pasta `node_modules` (e sem `uploads/`, `output/`, `temp/` se quiser).
2. Envie para o VPS (troque `SEU_IP` e o caminho do ZIP):

```bash
scp "D:\6 - WD\CRIATIVOS WD\criativos-wd.zip" root@SEU_IP:/var/www/
```

**No VPS:**

```bash
apt install -y unzip
cd /var/www
unzip criativos-wd.zip
mv "CRIATIVOS WD" criativos-wd   # ou o nome que estiver na pasta
cd criativos-wd
```

---

## Parte 4: Build e rodar o app no VPS

**No VPS**, dentro da pasta do projeto (`/var/www/criativos-wd` ou o nome que você usou):

### 4.1 Instalar dependências e gerar o frontend

```bash
npm install --production=false
npm run build
```

Isso gera a pasta `dist/` com o frontend pronto para produção.

### 4.2 Criar pastas de upload/output (se não existirem)

```bash
mkdir -p uploads output temp
```

### 4.3 Iniciar com PM2 em modo produção

```bash
NODE_ENV=production PORT=3001 pm2 start server.js --name criativos-wd
pm2 save
pm2 startup
```

O último comando (`pm2 startup`) pode pedir para você rodar uma linha que ele mostrar — rode essa linha para o app subir automaticamente após reiniciar o VPS.

Para ver se está rodando:

```bash
pm2 status
pm2 logs criativos-wd
```

O app estará escutando na porta **3001** (só dentro do servidor; o usuário acessa pela porta 80/443 via Nginx).

---

## Parte 5: Configurar o domínio na Hostinger

### 5.1 Apontar o domínio para o IP do VPS

1. No painel da Hostinger, vá em **Domínios** → selecione seu domínio.
2. Abra **DNS / Nameservers** (ou **Zona DNS**).
3. Crie ou edite um registro **A**:
   - **Nome:** `@` (ou em branco, para o domínio raiz)
   - **Aponta para / Valor:** **IP do seu VPS**
   - TTL: 14400 ou padrão
4. Se quiser usar **www** também, crie outro registro **A**:
   - **Nome:** `www`
   - **Aponta para:** **mesmo IP do VPS**

Salve e aguarde a propagação (pode levar de alguns minutos a 24 horas).

### 5.2 (Opcional) SSL na Hostinger

Se o domínio estiver **gerenciado pela Hostinger**, você pode ativar SSL pelo painel:

- Domínios → seu domínio → **SSL** → ativar certificado gratuito.

Assim o site pode ser acessado por `https://seusite.com`. O Nginx no VPS pode ser configurado para aceitar HTTPS (veja abaixo) ou você pode usar um proxy/SSL da própria Hostinger se eles oferecerem para VPS.

---

## Parte 6: Nginx no VPS (proxy para o Node e HTTPS)

Aqui o Nginx recebe as requisições no domínio e repassa para o Node (porta 3001). Você pode usar HTTP (porta 80) ou HTTPS (porta 443) com certificado gratuito (Let’s Encrypt).

### 6.1 Criar o arquivo de configuração do site

Troque `SEU_DOMINIO.com.br` pelo seu domínio real.

```bash
nano /etc/nginx/sites-available/criativos-wd
```

Cole (e ajuste o domínio):

```nginx
server {
    listen 80;
    server_name SEU_DOMINIO.com.br www.SEU_DOMINIO.com.br;

    client_max_body_size 2048M;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
        proxy_read_timeout 300;
    }
}
```

Salve: `Ctrl+O`, Enter, depois `Ctrl+X`.

### 6.2 Ativar o site e testar

```bash
ln -s /etc/nginx/sites-available/criativos-wd /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

Acesse no navegador: `http://SEU_DOMINIO.com.br`. Deve abrir o app.

### 6.3 (Opcional) HTTPS com Let’s Encrypt

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d SEU_DOMINIO.com.br -d www.SEU_DOMINIO.com.br
```

Siga as perguntas (e-mail, aceitar termos). O Certbot ajusta o Nginx para usar HTTPS. Renovação é automática.

---

## Parte 7: Resumo rápido (checklist)

| Etapa | O que fazer |
|-------|-------------|
| 1 | Contratar VPS (Ubuntu), anotar IP e senha |
| 2 | Conectar: `ssh root@IP_DO_VPS` |
| 3 | Instalar: Node 20, Nginx, PM2 (`apt` e `npm install -g pm2`) |
| 4 | Enviar projeto (Git clone ou SCP) para `/var/www/criativos-wd` |
| 5 | No projeto: `npm install`, `npm run build`, `mkdir -p uploads output temp` |
| 6 | Rodar: `NODE_ENV=production PORT=3001 pm2 start server.js --name criativos-wd` e `pm2 save` / `pm2 startup` |
| 7 | DNS: registro A do domínio apontando para o IP do VPS |
| 8 | Nginx: criar site em `sites-available`, ativar, `nginx -t` e `reload` |
| 9 | (Opcional) HTTPS: `certbot --nginx -d seu-dominio.com.br` |

---

## Comandos úteis depois do deploy

```bash
# Ver status do app
pm2 status

# Ver logs em tempo real
pm2 logs criativos-wd

# Reiniciar o app após mudar código
cd /var/www/criativos-wd
git pull
npm install
npm run build
pm2 restart criativos-wd

# Reiniciar Nginx
systemctl reload nginx
```

---

## Observações importantes

- **Upload de vídeos grandes (até 2 GB):** O Nginx está configurado com `client_max_body_size 2048M`. Se mudar o limite no `server.js`, ajuste também no Nginx.
- **Espaço em disco:** Vídeos ficam em `uploads/`, `output/` e `temp/`. Configure uma rotina para limpar arquivos antigos se o disco encher (ex.: cron + script que apaga arquivos com mais de 24 h).
- **Firewall:** Em muitos VPS da Hostinger as portas 80 e 443 já vêm abertas. Se não abrir, use `ufw allow 80`, `ufw allow 443`, `ufw enable`.

Se quiser, na próxima etapa podemos montar um script de deploy (ex.: `deploy.sh`) que faz `git pull`, `npm install`, `npm run build` e `pm2 restart` com um único comando.
