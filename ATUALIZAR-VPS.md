# Como atualizar o app no VPS (goldensecret.online)

Quando você fizer alterações no código no seu PC e enviar para o GitHub, use este passo a passo para atualizar o app rodando na VPS.

---

## Pré-requisito

O código novo já deve estar no GitHub (você fez `git add`, `git commit` e `git push` no seu PC).

---

## Passo a passo na VPS

### 1. Conectar na VPS por SSH

No PowerShell (Windows):

```bash
ssh root@72.60.13.187
```

Digite a senha do root quando pedir.

---

### 2. Ir até a pasta do projeto

```bash
cd /var/www/CRIATIVOS-WD
```

---

### 3. Baixar as alterações do GitHub

```bash
git pull origin main
```

Se o seu branch for outro (por exemplo `master`), use:

```bash
git pull origin master
```

Se aparecer conflito, avise e seguimos com a resolução.

---

### 4. Instalar dependências (se tiver mudado o package.json)

```bash
npm install --production=false
```

---

### 5. Gerar o frontend de produção

```bash
npm run build
```

Isso recria a pasta `dist/` com o frontend atualizado.

---

### 6. Reiniciar o app com PM2

```bash
pm2 restart criativos-wd
```

---

### 7. Conferir se está rodando

```bash
pm2 status
pm2 logs criativos-wd --lines 20
```

O status deve estar `online`. Nos logs não deve aparecer erro.

---

## Resumo em um único bloco (copiar e colar)

Depois de conectar na VPS (`ssh root@72.60.13.187`), rode:

```bash
cd /var/www/CRIATIVOS-WD
git pull origin main
npm install --production=false
npm run build
pm2 restart criativos-wd
pm2 status
```

---

## Se der erro no `git pull`

**“You have divergent branches” ou pedir merge:**

```bash
git pull origin main --no-rebase
```

Se pedir mensagem de merge, salve e saia (no nano: `Ctrl+O`, Enter, `Ctrl+X`).

**“Permission denied” ou “Could not read from remote”:**

O repositório é público; não precisa de senha. Se tiver mudado para privado, configure token ou SSH no VPS (posso te passar os passos se precisar).

---

## Fluxo completo (PC → GitHub → VPS)

| Onde      | O que fazer |
|----------|-------------|
| **No PC** | Editar código → `git add .` → `git commit -m "Descrição"` → `git push origin main` |
| **Na VPS** | `ssh root@72.60.13.187` → `cd /var/www/CRIATIVOS-WD` → `git pull` → `npm install` → `npm run build` → `pm2 restart criativos-wd` |

Depois disso, **https://goldensecret.online** já estará com a versão nova (pode precisar dar F5 ou abrir em aba anônima para não pegar cache do navegador).
