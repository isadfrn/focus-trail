import { execSync } from "node:child_process";
import { existsSync } from "node:fs";

const BACKEND = "backend";

function run(command, options = {}) {
  execSync(command, { stdio: "inherit", ...options });
}

function step(message) {
  console.log(`\n→ ${message}`);
}

if (!existsSync(`${BACKEND}/.env`)) {
  console.error(
    "backend/.env nao encontrado. Copie backend/.env.example para backend/.env e preencha antes de continuar.",
  );
  process.exit(1);
}

try {
  execSync("docker info", { stdio: "ignore" });
} catch {
  console.error(
    "Docker nao esta acessivel. Abra o Docker Desktop (aguarde o daemon subir) e rode de novo.",
  );
  process.exit(1);
}

step("Removendo container e volume locais anteriores (dados locais serao perdidos)...");
run("docker compose down -v --remove-orphans", { cwd: BACKEND });

step("Subindo o Postgres e aguardando ficar saudavel...");
run("docker compose up -d --wait db", { cwd: BACKEND });

step("Aplicando as migrations...");
run("npx prisma migrate deploy", { cwd: BACKEND });

step("Gerando o Prisma Client...");
run("npx prisma generate", { cwd: BACKEND });

console.log(
  "\n✔ Banco pronto e migrado. Agora suba o app (npm run dev) e crie um usuario pela tela de cadastro para testar.",
);
