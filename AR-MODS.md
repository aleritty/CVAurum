# AR-MODS

Le modifiche del fork (`ar-mods`) rispetto a upstream (`akhil-dara/CVAurum`), cosa fanno e come verificare che siano ancora attive dopo un merge.

## Verifica rapida

Dalla root del progetto:

```sh
npm run typecheck && npx vitest run

check() { grep -q -- "$2" "$1" && echo "ok    $3" || echo "PERSA $3"; }
check src/types/resume.ts 'rating: z.number().min(0).max(6)' 'lingue 0-6: schema'
check src/components/editor/SectionItemEditors.tsx 'max={6}' 'lingue 0-6: editor'
check src/templates/_shared/sections.tsx 'style={prof} max={6}' 'lingue 0-6: canvas'
check src/lib/docx.ts 'C.muted, 6)' 'lingue 0-6: Word'
check src/templates/_shared/sections.tsx 'className="rm-levels"' 'colonna indicatori: markup'
check src/styles/artboard.css 'grid-template-columns: subgrid' 'colonna indicatori: CSS'
check src/templates/_shared/Artboard.tsx 'alignAsideVisualToMain(rootRef.current)' 'foto laterale: dopo il render'
check src/templates/_shared/Artboard.tsx 'alignAsideVisualToMain(root)' 'foto laterale: dopo i font'
check src/lib/pdf/keywordFit.ts 'afterRefit?.()' 'foto laterale: callback font'
check src/lib/pdf/paint.ts 'chromePrefixes' 'sfondo colonna PDF'
check src/templates/templates.css '.tpl-clarity .rm-contacts a:hover' 'link Clarity'
check vite.config.ts 'usePolling: true' 'polling Vite'
check package.json '"allowScripts"' 'allowScripts'
check src/templates/_shared/atoms.tsx 'handle || p.network || prettyUrl' 'ordine testo profili'
check src/types/resume.ts 'migrateProfileText' 'conversione text -> label'
```

Ogni riga deve iniziare con `ok`. I `grep` dicono solo che il codice c'è: per le mod visive fai anche la prova manuale indicata sotto.

## Le modifiche

### 1. Lingue da 0 a 6 (CEFR)

La scala A1-C2 ha sei gradini, quindi le lingue hanno 6 livelli. Le competenze restano a 5.

- **File:** `src/types/resume.ts`, `src/templates/_shared/sections.tsx`, `src/components/editor/SectionItemEditors.tsx`, `src/components/editor/panels/DesignPanel.tsx`, `src/lib/docx.ts`
- **Test automatico:** `npx vitest run src/templates/_shared/sections.levels.test.tsx`
- **Prova manuale:** imposta una lingua a 6 livelli con stile a pallini. Canvas, PDF e Word devono mostrare 6 segni. Dopo aver ricaricato la pagina, il valore 6 deve essere ancora lì.

### 2. Indicatori delle lingue in un'unica colonna

Una griglia con `subgrid` allinea gli indicatori, qualunque sia la lunghezza del nome della lingua. La prima colonna è `minmax(0, max-content)`: così un nome lungo va a capo tra le parole e non esce dalla colonna laterale.

- **File:** `src/styles/artboard.css` (`.rm-levels`), `src/templates/_shared/sections.tsx`
- **Test automatico:** `npx vitest run src/templates/_shared/sections.levels.test.tsx`
- **Prova manuale:** con "EN" e "Mandarin Chinese" nella stessa lista, gli indicatori partono dalla stessa x.

### 3. Foto o monogramma allineati nella colonna laterale

Lo spazio sotto la foto viene misurato, non stimato: la prima sezione della colonna laterale parte alla stessa altezza della prima sezione principale. Il calcolo viene ripetuto quando arrivano i font definitivi, perché cambiano le misure.

- **File:** `src/templates/_shared/asideVisualAlign.ts`, `src/templates/_shared/Artboard.tsx`, `src/lib/pdf/keywordFit.ts` (`afterRefit`)
- **Test automatico:** `npx vitest run src/templates/_shared/asideVisualAlign.test.ts` (copre il calcolo, non il collegamento in `Artboard`)
- **Prova manuale:** su un template a due colonne con foto, scegli un font non ancora caricato. Le due prime sezioni restano allineate.

### 4. Sfondo della colonna laterale sotto il testo nel PDF

Nei PDF a più pagine lo sfondo viene disegnato per primo su ogni pagina. Senza questa modifica lo sfondo copriva il testo della colonna dalla seconda pagina in poi: il testo restava estraibile, ma non si vedeva.

- **File:** `src/lib/pdf/paint.ts` (`assignOpsToPages`, `chromePrefixes`)
- **Test automatico:** `npx vitest run src/lib/pdf/paint.test.ts` (i test esistenti coprono la ripetizione dello sfondo, non l'ordine con testo spostato)
- **Prova manuale:** esporta un PDF di almeno due pagine da un template a due colonne con colonna laterale chiara. Il testo laterale deve vedersi su tutte le pagine.

### 5. Link dei contatti in Clarity

I contatti sembrano testo normale: colore d'accento e sottolineatura compaiono solo al passaggio del mouse.

- **File:** `src/templates/templates.css` (`.tpl-clarity .rm-contacts a`)
- **Prova manuale:** nell'editor scegli il template Clarity. I link dei contatti non sono sottolineati finché non ci passi sopra.

### 6. Vite in polling

Alcune sessioni desktop Linux esauriscono gli inotify prima dell'avvio di Vite.

- **File:** `vite.config.ts` (`server.watch`)
- **Prova manuale:** con `npm run dev` attivo, salvando un file la pagina si aggiorna.

### 7. `allowScripts`

Elenca i pacchetti autorizzati a eseguire script di installazione, con le versioni fissate.

- **File:** `package.json`
- **Verifica:** ogni voce deve corrispondere a una versione presente in `package-lock.json`. Se upstream aggiorna uno di questi pacchetti, va aggiornata anche la voce.

### 8. `AGENTS.md` e `CLAUDE.md`

Istruzioni per gli agenti, che upstream non traccia.

- **Verifica:** `git ls-files AGENTS.md CLAUDE.md` deve elencare entrambi i file.

### 9. Ordine del testo dei link dei profili

Nella riga dei contatti il testo è, nell'ordine: `label` ("Shown as"), username, network e solo alla fine l'indirizzo. Upstream mette l'indirizzo subito dopo `label`. L'ordine vale per canvas, PDF, testo ATS e Word. In Word il testo non ha più il prefisso `Network:`, così coincide con la pagina.

- **File:** `src/templates/_shared/atoms.tsx` (`profileWords`), usata da `contacts.ts`, `Artboard.tsx` e `src/lib/docx.ts`
- **Test automatico:** `npx vitest run src/templates/_shared/profileWords.test.ts`
- **Prova manuale:** su un profilo con username e URL, lascia vuoto "Shown as": sul curriculum compare lo username.

### 10. Conversione da `text` a `label` (da rimuovere in futuro)

I profili salvati con il vecchio campo `text` vengono convertiti in `label` a ogni lettura dello schema, quindi anche importando un JSON. Se `label` è già impostato, resta quello.

- **File:** `src/types/resume.ts` (`migrateProfileText`, marcata `DA RIMUOVERE IN FUTURO`)
- **Test automatico:** `npx vitest run src/templates/_shared/profileWords.test.ts`
- **Rimozione:** quando tutti i curriculum e i JSON esportati sono stati salvati di nuovo, togli la funzione, il suo `z.preprocess` e il relativo blocco di test. Trovi tutto con `grep -rn "DA RIMUOVERE IN FUTURO" src`.

## Modifiche non più attive

Queste modifiche di `793a02f` non sono nel codice attuale:

- **Testo visualizzato dei profili (sostituita):** ora c'è il campo `label` di upstream (`22760b6`), impostabile da "Shown as" nel pannello dei profili e, per il sito, da "Website shown as" (`urlLabel`). L'ordine di fallback e la conversione del vecchio campo `text` sono le mod 9 e 10.
- **Foto centrata (sostituita):** ora `.rm-visual-wrap` è gestita da upstream con margini configurabili.

Anche i link cliccabili nei PDF di `4768d34` non servono più come modifica del fork: upstream ora li gestisce in `src/lib/pdf/links.ts`.

## Come fare i prossimi merge

Upstream ha riscritto parte della sua storia, quindi `git merge-base` può indicare un antenato troppo vecchio e produrre centinaia di conflitti falsi, anche su immagini generate. Se succede:

1. Annulla il merge con `git merge --abort`.
2. Individua il commit upstream da cui `ar-mods` è davvero aggiornato, cioè quello con cui `git diff <commit> ar-mods --stat` mostra solo i file elencati qui.
3. Calcola il merge con quella base: `git merge-tree --write-tree --merge-base=<commit> ar-mods upstream/main`.

Dopo il merge:

1. Esegui `npm run lastmod`: le modifiche del fork cambiano gli hash delle pagine e `src/data/lastmod.test.ts` altrimenti fallisce.
2. Lancia la verifica rapida.
3. Aggiorna questo file se una modifica è stata assorbita da upstream.
