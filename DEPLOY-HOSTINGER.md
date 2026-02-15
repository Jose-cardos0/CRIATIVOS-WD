# Como colocar o Criativos WD online na Hostinger (VPS + domínio)

Domínio: **goldensecret.online**

---

## O que você vai precisar

- Conta na Hostinger
- **VPS** contratado (ver configuração abaixo)
- **Domínio** `goldensecret.online` (já na Hostinger)
- Computador com acesso SSH (Windows: use PowerShell ou [PuTTY](https://www.putty.org/))

---

## Configuração recomendada do VPS

| Recurso | Mínimo | Recomendado |
|---------|--------|-------------|
| **vCPU** | 2 cores | 4 cores |
| **RAM** | 4 GB | 8 GB |
| **Disco** | 50 GB NVMe | 100 GB NVMe |
| **OS** | Ubuntu 22.04 | Ubuntu 22.04 |
| **Localização** | São Paulo (se disponível) | São Paulo |

> **Por que esses valores?** O FFmpeg consome bastante CPU e RAM ao processar vídeo com filtros (phase split + perturbação + ruído). 4 cores + 8 GB dão folga para vídeos grandes (até 2 GB) sem risco de travamento.

Na Hostinger, isso corresponde ao plano **KVM 2** ou **KVM 4**.

---

## Parte 1: Contratar e acessar o VPS

### 1.1 Contratar o VPS

1. Acesse [hostinger.com.br](https://www.hostinger.com.br) e faça login.
2. Vá em **VPS** e escolha o plano **KVM 2** (ou KVM 4 para mais folga).
3. Selecione o sistema operacional **Ubuntu 22.04**.
4. Localização: **São Paulo** (se tiver) ou a mais próxima do Brasil.
5. Finalize a compra.

### 1.2 Ver IP e senha do VPS

1. No painel da Hostinger, vá em **VPS** → seu servidor.
2. Anote:
   - **IP do servidor** (ex.: `123.45.67.89`)
   - **Senha root** (ou crie uma se pedir).

### 1.3 Conectar por SSH

No **PowerShell** (Windows):

```bash
ssh root@SEU_IP_DO_VPS
```

Quando pedir, digite a senha do root. Na primeira vez pode aparecer "Are you sure you want to continue connecting?" — digite `yes`.

Você estará dentro do servidor quando aparecer algo como `root@vps:~#`.

---

## Parte 2: Preparar o servidor (Ubuntu)

Execute os comandos abaixo **um bloco por vez**, na ordem. Todos dentro do VPS via SSH.

### 2.1 Atualizar o sistema

```bash
apt update && apt upgrade -y
```

### 2.2 Instalar Node.js 20 LTS

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node -v   
npm -v
```

### 2.3 Instalar Nginx

```bash
apt install -y nginx
systemctl enable nginx
systemctl start nginx
```

### 2.4 Instalar PM2

```bash
npm install -g pm2
```

### 2.5 Instalar Git

```bash
apt install -y git
```

### 2.6 FFmpeg (opcional, já vem embutido no app)

O projeto usa `ffmpeg-static` que traz o binário. Mas instalar o do sistema também é uma boa prática:

```bash
apt install -y ffmpeg
```

---

## Parte 3: Enviar o projeto para o VPS

### Opção A: Usando Git (recomendado)

**No seu PC (PowerShell, na pasta do projeto):**

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
cd /var/www
git clone https://github.com/SEU_USUARIO/criativos-wd.git
cd criativos-wd
```

### Opção B: Upload manual (ZIP + SCP)

**No seu PC:**

1. Compacte a pasta do projeto em ZIP **sem** `node_modules/`, `uploads/`, `output/`, `temp/`.
2. Envie para o VPS:

```bash
scp "D:\6 - WD\CRIATIVOS WD\criativos-wd.zip" root@SEU_IP:/var/www/
```

**No VPS:**

```bash
apt install -y unzip
cd /var/www
unzip criativos-wd.zip
mv "CRIATIVOS WD" criativos-wd
cd criativos-wd
```

---

## Parte 4: Build e rodar o app no VPS

Dentro da pasta do projeto no VPS (`/var/www/criativos-wd`):

### 4.1 Instalar dependências e gerar o frontend

```bash
npm install --production=false
npm run build
```

Isso gera a pasta `dist/` com o frontend compilado.

### 4.2 Criar pastas necessárias

```bash
mkdir -p uploads output temp
```

### 4.3 Iniciar com PM2

```bash
NODE_ENV=production PORT=3001 pm2 start server.js --name criativos-wd
pm2 save
pm2 startup
```

O `pm2 startup` pode pedir para rodar uma linha extra — rode essa linha para o app iniciar automaticamente ao reiniciar o VPS.

Verificar se está rodando:

```bash
pm2 status
pm2 logs criativos-wd
```

---

## Parte 5: Configurar o domínio goldensecret.online

### 5.1 Apontar o domínio para o IP do VPS

1. No painel da Hostinger, vá em **Domínios** → **goldensecret.online**.
2. Abra **DNS / Zona DNS**.
3. Crie ou edite um registro **A**:
   - **Nome:** `@`
   - **Valor:** `IP_DO_SEU_VPS`  (ex.: `123.45.67.89`)
   - **TTL:** 14400
4. Crie outro registro **A** para **www**:
   - **Nome:** `www`
   - **Valor:** `IP_DO_SEU_VPS`  (mesmo IP)
   - **TTL:** 14400

Salve e aguarde a propagação (pode levar de minutos até 24h, normalmente é rápido na Hostinger).

---

## Parte 6: Nginx (proxy reverso + HTTPS)

### 6.1 Remover site padrão do Nginx

```bash
rm -f /etc/nginx/sites-enabled/default
```

### 6.2 Criar configuração do site

```bash
nano /etc/nginx/sites-available/goldensecret
```

Cole este conteúdo exatamente:

```nginx
server {
    listen 80;
    server_name goldensecret.online www.goldensecret.online;

    client_max_body_size 2048M;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_connect_timeout 600;
        proxy_send_timeout 600;
        proxy_read_timeout 600;
        send_timeout 600;
    }
}
```

Salvar: `Ctrl+O`, Enter, `Ctrl+X`.

### 6.3 Ativar o site e testar

```bash
ln -s /etc/nginx/sites-available/goldensecret /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

Agora acesse: `http://goldensecret.online` — deve mostrar a tela de login do app.

### 6.4 HTTPS com Let's Encrypt (gratuito)

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d goldensecret.online -d www.goldensecret.online
```

Siga as perguntas (email, aceitar termos). O Certbot configura o Nginx para HTTPS automaticamente. Renovação é automática a cada 90 dias.

Depois disso: `https://goldensecret.online` funciona com cadeado verde.

---

## Parte 7: Firewall (se necessário)

Na maioria dos VPS Hostinger as portas já estão abertas. Se o site não carregar:

```bash
ufw allow 22
ufw allow 80
ufw allow 443
ufw enable
```

---

## Checklist rápido

| # | Etapa | Comando / Ação |
|---|-------|----------------|
| 1 | Contratar VPS KVM 2+ (Ubuntu 22.04), anotar IP | Painel Hostinger |
| 2 | Conectar por SSH | `ssh root@IP` |
| 3 | Instalar Node 20, Nginx, PM2, Git | Parte 2 |
| 4 | Enviar projeto para `/var/www/criativos-wd` | Git clone ou SCP |
| 5 | Build do frontend | `npm install --production=false && npm run build` |
| 6 | Iniciar app com PM2 | `NODE_ENV=production PORT=3001 pm2 start server.js --name criativos-wd` |
| 7 | Configurar PM2 no boot | `pm2 save && pm2 startup` |
| 8 | DNS: registros A para `goldensecret.online` e `www` | Painel Hostinger → DNS |
| 9 | Nginx: criar config e ativar | Parte 6 |
| 10 | HTTPS | `certbot --nginx -d goldensecret.online -d www.goldensecret.online` |

---

## Comandos úteis após o deploy

```bash
# Ver status do app
pm2 status

# Ver logs em tempo real
pm2 logs criativos-wd

# Atualizar o app após mudanças no código
cd /var/www/criativos-wd
git pull
npm install
npm run build
pm2 restart criativos-wd

# Reiniciar Nginx
systemctl reload nginx

# Ver espaço em disco
df -h

# Limpar arquivos temporários com mais de 24h (rodar manualmente ou via cron)
find /var/www/criativos-wd/uploads -type f -mmin +1440 -delete
find /var/www/criativos-wd/output -type f -mmin +1440 -delete
find /var/www/criativos-wd/temp -type f -mmin +1440 -delete
```

### (Opcional) Limpeza automática via cron

Para limpar uploads/output/temp automaticamente a cada 6 horas:

```bash
crontab -e
```

Adicionar esta linha:

```
0 */6 * * * find /var/www/criativos-wd/uploads -type f -mmin +1440 -delete && find /var/www/criativos-wd/output -type f -mmin +1440 -delete && find /var/www/criativos-wd/temp -type f -mmin +1440 -delete
```

---

## Observações importantes

- **Upload de vídeos grandes (até 2 GB):** O Nginx está com `client_max_body_size 2048M` e timeout de 600s (10 min). Se precisar de mais, ajuste no Nginx e no `server.js`.
- **Espaço em disco:** Configure a limpeza automática (cron acima) para evitar disco cheio.
- **Firebase Auth:** O domínio `goldensecret.online` precisa ser adicionado como domínio autorizado no Firebase:
  1. [Firebase Console](https://console.firebase.google.com) → seu projeto
  2. **Authentication** → **Settings** → **Authorized domains**
  3. Adicionar: `goldensecret.online`
