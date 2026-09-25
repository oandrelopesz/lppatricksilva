# LP do Dr. Patrick Santos

Página de agendamento (Vite, React e pré-renderização), publicada na Vercel no projeto `lp-dr-santos`.

## Domínio e redirecionamentos

- Domínio principal: `https://drpatricksantos.com.br` (`SITE_URL` em `src/config.ts`). O canonical de todas as páginas e o JSON-LD usam esse endereço, e o `scripts/verificar-build.mjs` confere o canonical.
- Os redirecionamentos de domínio ficam no painel da Vercel, em Settings > Domains do projeto, e não no código: `www.drpatricksantos.com.br` e `lp-dr-santos.vercel.app` têm 301 para `drpatricksantos.com.br`, com caminho e query mantidos (o `gclid` chega ao domínio principal).
- O `vercel.json` não tem regra por host, para haver uma fonte só; o teste `src/test/redirecionamentos.test.ts` confere isso.
- Os previews da Vercel (`lp-dr-santos-<hash>-oandrelopesz1.vercel.app` e os de branch) não redirecionam.
