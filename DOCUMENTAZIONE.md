# Palinsesto TV: documentazione di progetto

> Documento vivo: lo aggiorno a ogni passo con quello che faccio, cosa decido e perché.
> Ogni decisione indica le alternative che ho valutato e cosa ho scelto di lasciare fuori.

---

## 1. Contesto

Il compito è un esercizio per un colloquio tecnico: una schermata in **React + TypeScript** per chi prepara il palinsesto di un canale TV.

- Dati: una lista di programmi, ognuno con **titolo**, **orario di inizio** e **durata**.
- Azioni richieste: **modificare la durata** di un programma e **aggiungere** un programma.
- Più persone lavorano sugli stessi dati, quindi i dati possono cambiare mentre l'utente li sta guardando.
- Vincolo tecnico: le durate si esprimono come **timecode a 25 FPS**.
- Tempo indicativo: circa 2 ore. Il cliente ha chiesto esplicitamente di non complicare le cose: gli interessano i ragionamenti, i problemi che mi pongo e come imposto UI e componenti.

### Domande al cliente e risposte

| # | Domanda | Risposta |
|---|---------|----------|
| 1 | Cosa succede agli altri programmi quando uno si allunga o si accorcia? Esistono programmi a orario fisso? | Sì, esistono programmi a orario fisso. Il resto lo decido io. |
| 2 | Modifiche in tempo reale o modalità di modifica con pulsante "Salva"? | Lo decido io. |
| 3 | Quali azioni può fare l'utente? | Modificare la durata e **aggiungere** programmi. |
| — | (Nota del cliente) | Le durate si esprimono come timecode a 25 FPS. |

---

## 2. Scaletta di lavoro

- [x] **0. Setup**: questo documento, `.gitignore`, nome del progetto (`palinsesto-tv`)
- [x] **1. Analisi dei requisiti**: requisiti funzionali e non funzionali, glossario, ipotesi, domande aperte
- [x] **2. Decisioni di dominio**: le tre situazioni ambigue della traccia, più il timecode
- [x] **3. Architettura**: stack, livelli, pattern, simulazione del backend multiutente
- [x] **4. UI**: riferimenti, wireframe, albero dei componenti
- [ ] **5. GitHub**: repository e primo push
- [ ] **6. Sviluppo incrementale**, un commit per ogni passo:
  - [x] 6a. Timecode: parse, format e aritmetica, con test
  - [ ] 6b. Motore di ricalcolo del palinsesto, con test
  - [ ] 6c. Backend simulato con versioni e "altri utenti" fittizi
  - [ ] 6d. Lista dei programmi
  - [ ] 6e. Modifica della durata
  - [ ] 6f. Aggiunta di un programma
  - [ ] 6g. Gestione dei conflitti di modifica concorrente
  - [ ] 6h. Feedback visivo quando i dati cambiano
- [ ] **7. Chiusura del documento**: "Cosa ho lasciato per strada" e "Come si può migliorare"
- [ ] **8. Consegna**: README, deploy online pubblico su Netlify, video demo nel README
- [ ] **9. Preparazione del colloquio**: punti da raccontare e domande probabili

---

## 3. Analisi dei requisiti

### 3.1 Glossario

- **Palinsesto**: la sequenza ordinata dei programmi di un canale in una giornata.
- **Programma**: ha titolo, inizio e durata. La fine è un valore **calcolato**, non salvato.
- **Programma a orario fisso** ("ancora"): l'inizio lo decide l'utente e il sistema non lo sposta mai. Esempio: il TG delle 20:00:00:00.
- **Programma flottante**: l'inizio è **calcolato** e coincide con la fine del programma precedente.
- **Timecode**: formato `HH:MM:SS:FF` a 25 FPS, con i frame da 00 a 24. 1 secondo = 25 frame, 1 ora = 90.000 frame. A 25 FPS non esiste il drop-frame, che riguarda solo i 29,97 FPS.
- **Blocco pubblicitario**: il tempo libero tra la fine di un programma e l'inizio dell'ancora successiva. Il sistema lo **calcola** e lo **mostra in modo esplicito** come elemento del palinsesto.
- **Sforamento**: un programma flottante finisce dopo l'inizio dell'ancora successiva, quindi i due si sovrappongono.
- **Versione**: un numero che cresce a ogni modifica di un programma. Serve a capire se un utente sta modificando dati non più aggiornati.

### 3.2 Requisiti funzionali

| ID | Requisito |
|----|-----------|
| RF1 | Vedere il palinsesto in ordine di orario: inizio, durata, fine, titolo e se è fisso o flottante |
| RF2 | Modificare la durata di un programma in timecode, rifiutando i valori non validi |
| RF3 | Aggiungere un programma con titolo, durata, posizione ed eventuale orario fisso |
| RF4 | Ricalcolare automaticamente gli orari dei programmi che seguono quello modificato |
| RF5 | Mostrare in modo esplicito i blocchi pubblicitari (con la loro durata) e gli sforamenti rispetto ai programmi a orario fisso |
| RF6 | Ricevere in tempo reale le modifiche fatte dagli altri utenti |
| RF7 | Gestire il caso in cui due utenti modificano lo stesso programma |
| RF8 | Far capire all'utente cosa è cambiato, senza disorientarlo |

### 3.3 Requisiti non funzionali

- **Calcoli corretti**: il tempo è salvato come numero intero di frame, quindi non ci sono errori di arrotondamento.
- **Testabilità**: la logica di dominio è scritta come funzioni pure, separate da React.
- **Backend sostituibile**: un'interfaccia (pattern Repository) separa la UI dalla sorgente dei dati. Oggi i dati sono simulati, domani possono arrivare da un'API REST o da un WebSocket.
- **Semplicità**: l'esercizio vale circa 2 ore, quindi la chiarezza viene prima della completezza.
- **Target**: solo desktop, perché lo strumento lo usano operatori alla scrivania.

### 3.4 Ipotesi

- Un solo canale e un solo giorno, dalle 00:00:00:00 alle 24:00:00:00. Nessun programma attraversa la mezzanotte.
- I dati sono simulati: un finto backend nel browser e alcuni "altri utenti" simulati.
- Non c'è autenticazione: ogni sessione riceve un nome utente casuale.
- La pubblicità **non viene salvata**: si ricava ogni volta dagli orari, così non può diventare incoerente con i programmi. In compenso è **visibile**, come riga dedicata con la sua durata.
- Fuori ambito: cancellare e riordinare i programmi, più canali o giorni, autenticazione, persistenza reale, annulla/ripeti, versione mobile.

### 3.5 Domande aperte (si chiudono al passo 2)

1. Sforamento di un'ancora: blocco la modifica, la accetto segnalando il conflitto, oppure sposto l'ancora?
2. Concorrenza: salvataggio immediato o pulsante "Salva"? Se due utenti modificano lo stesso programma, vince l'ultimo che salva o il sistema rileva il conflitto?
3. Limiti di durata: minimo 1 frame? C'è un massimo?
4. Blocco pubblicitario: esiste una durata massima oltre la quale va segnalato, per esempio i limiti di affollamento pubblicitario?

---

## 4. Decisioni

_Ogni decisione segue lo schema: contesto → alternative → scelta → conseguenze._

### D-001: repository pubblico
- **Contesto**: i valutatori devono poter vedere codice, documento e video demo senza attriti.
- **Alternative**: repo privato con invito ai valutatori; repo pubblico.
- **Scelta**: pubblico. Il file con la traccia originale e i contatti del selezionatore resta **fuori dalla cartella del repository** (il progetto vive nella sottocartella `palinsesto-tv/`), quindi non può essere caricato per errore.
- **Conseguenze**: basta un link e il progetto resta nel portfolio. Nel repo non devono finire dati personali.

### D-002: nome del progetto `palinsesto-tv`
- **Scelta**: un nome descrittivo, in italiano come il dominio. Se ci viene in mente un nome più accattivante possiamo cambiarlo.

### D-003: effetto di allungamenti e accorciamenti sul resto del palinsesto

- **Contesto**: la traccia chiede cosa succede al resto del palinsesto quando un programma cambia durata. Il cliente ha confermato che esistono programmi a orario fisso (ancore).
- **Scelta di modello: gli orari dei flottanti non si salvano.** Si salvano solo la durata di ogni programma e l'orario di inizio delle ancore. L'inizio di un flottante si **calcola** sempre come fine del programma precedente.
  - *Perché*: un'unica regola, nessun dato duplicato da tenere allineato. Lo slittamento a cascata è una conseguenza naturale del modello, non una procedura da scrivere e mantenere.
  - *Costo*: non si può "parcheggiare" un flottante a un orario preciso senza trasformarlo in ancora.
- **Allungamento**: il programma consuma prima la pubblicità che lo separa dall'ancora successiva. Se la pubblicità non basta:
  - *Alternative*: (A) bloccare la modifica; (B) accettarla e segnalare lo sforamento; (C) spostare l'ancora.
  - *Scelta*: **B**. La modifica viene accettata e lo sforamento viene evidenziato con la sua entità (es. "sfora il TG di 00:02:00:00").
  - *Perché*: (A) è troppo rigida per chi lavora su una bozza e deve poter sistemare il resto dopo. (C) contraddice la definizione stessa di orario fisso.
  - *Conseguenza*: le ancore fanno da **paratia**. Lo slittamento si ferma all'ancora e non tocca nulla dopo, quindi l'effetto di ogni modifica resta locale.
- **Accorciamento**:
  - *Alternative*: (simmetrico) i flottanti successivi si anticipano e la pubblicità si accumula subito prima dell'ancora; (asimmetrico) i successivi restano fermi e la pubblicità compare subito dopo il programma accorciato.
  - *Scelta*: **simmetrico**. È la stessa regola dell'allungamento, applicata al contrario. L'asimmetrico richiederebbe di salvare gli orari dei flottanti e quindi una seconda regola.
- **Come si risolve uno sforamento**:
  1. **Modificare a mano la durata** di uno o più flottanti tra le due ancore. Usa la stessa azione già prevista, quindi non serve codice in più.
  2. **Azione rapida "Tronca all'ancora"**, solo sull'ultimo flottante prima dell'ancora sforata: imposta la durata in modo che finisca esattamente all'inizio dell'ancora.
     - Non è una nuova operazione di dominio. È una normale modifica della durata con un valore calcolato, e quindi passa dallo stesso blocco ottimistico (D-004).
     - Chiede una **conferma esplicita** con la durata prima e dopo, perché nella realtà troncare un programma significa tagliarne il contenuto.
     - È **disabilitata** quando lo sforamento è più lungo del programma stesso, perché andrebbe sotto il minimo di 1 frame (D-005). In quel caso un tooltip invita ad accorciare anche altri programmi.
  - *Lasciato per strada*: altre risoluzioni possibili, come cancellare un programma, spostare un flottante dopo l'ancora o trasformare l'ancora in flottante. Richiedono operazioni fuori ambito.

### D-004: modifiche concorrenti sullo stesso programma

- **Contesto**: più persone lavorano sullo stesso palinsesto e i dati possono cambiare mentre li si guarda.
- **Quando si salva**: ogni modifica si salva da sola con Invio, sulla singola cella. Non c'è un pulsante "Salva" globale. Le modifiche piccole e atomiche riducono il tempo in cui i dati possono diventare vecchi, e quindi riducono i conflitti.
- **Alternative per i conflitti**: (A) vince l'ultimo che salva (*last write wins*); (B) blocco ottimistico con numero di versione; (C) blocco pessimistico della riga; (D) CRDT.
- **Scelta**: **B, blocco ottimistico**. Ogni programma ha una `version`. Il salvataggio indica la versione su cui l'utente stava lavorando, e se nel frattempo è cambiata il backend lo rifiuta. La UI mostra entrambi i valori e lascia scegliere ("Tieni la tua / Usa la sua").
- **Perché non le altre**: (A) fa perdere una modifica senza che nessuno se ne accorga. (C) rischia righe bloccate per sempre, per esempio se qualcuno chiude il browser. (D) è eccessivo per un singolo campo numerico.
- **Caso sottile**: due utenti allungano due programmi **diversi**. Ogni modifica è valida da sola, ma insieme sforano un'ancora. Non è un conflitto sui dati, perché gli orari sono calcolati. Si vede come sforamento (D-003) e nessuna modifica va persa.

### D-005: limiti di durata

- **Scelta**: durata minima 1 frame (`00:00:00:01`), massima la fine della giornata. La validazione del timecode accetta frame da 0 a 24 e minuti e secondi da 0 a 59.

### D-006: segnalazione dei blocchi pubblicitari troppo lunghi

- **Contesto reale**: in Italia non esiste un tetto fisso per singolo blocco. Gli spot sono limitati come **percentuale del tempo di trasmissione per fascia oraria** (es. 6–18 e 18–24), con limiti diversi per il servizio pubblico e per le emittenti private (riferimento: TUSMA, D.Lgs. 208/2021).
- **Scelta semplificata**: un avviso **che non blocca nulla** quando un singolo blocco pubblicitario supera i **12 minuti**. La soglia è una costante, facile da cambiare.
- **Lasciato per strada**: il calcolo vero dell'affollamento a percentuale per fascia oraria.

### D-007: aggiunta di un programma

- **Scelta**: un form con titolo, durata e tipo.
  - **Flottante**: si inserisce dopo il programma selezionato.
  - **A orario fisso**: si indica l'orario di inizio e il programma si colloca da solo. Viene rifiutato se si sovrappone a un'altra ancora.

---

## 5. Architettura

### D-008: stack tecnologico

| Cosa | Scelta | Perché |
|------|--------|--------|
| Build | Vite | È lo standard attuale per un progetto React, con zero configurazione |
| Linguaggio | TypeScript con `strict: true` | TypeScript è richiesto dalla traccia; `strict` è una **mia scelta**: attiva i controlli più severi (es. `null`/`undefined` da gestire in modo esplicito, come gli optional di Swift) e fa emergere gli errori quando si compila invece che quando si usa l'app |
| Test | Vitest | Si integra con Vite e ha la stessa API di Jest |
| Gestione dello stato | Nessuna libreria (niente Redux o Zustand) | Bastano gli strumenti di React (`useSyncExternalStore`, `useMemo`). Una dipendenza in meno da giustificare |
| Stile | CSS Modules, nessuna libreria di componenti | I componenti sono pochi; i CSS Modules sono CSS normale, limitato al singolo componente |
| Hosting | Netlify (sito statico) | Deploy automatico a ogni push sul repo GitHub |

### D-009: pattern MVVM

- **Contesto**: io sviluppo su iOS con **UIKit + MVVM**. Volevo un'architettura che potessi difendere con cognizione di causa e che restasse idiomatica per React.
- **Scelta**: MVVM, realizzato con i **custom hook come ViewModel**. I nomi sono volutamente espliciti (`useScheduleViewModel`, `useEditDurationViewModel`): un React developer di solito li chiamerebbe `useSchedule`. Il nome rende l'architettura riconoscibile a colpo d'occhio.
- **Alternativa scartata**: MVVM "a classi" con MobX, molto vicino ai ViewModel UIKit con Combine. Aggiunge però una dipendenza e un modello di reattività diverso da quello di React.

**Corrispondenza UIKit ↔ React**

| UIKit (MVVM) | React (questo progetto) |
|--------------|-------------------------|
| `UIViewController` che possiede il ViewModel | Componente "schermata" (`ScheduleScreen`) |
| `ViewModel` (classe) con output osservabili (Combine, closure) | Custom hook che restituisce stato e azioni |
| Binding a mano in `viewDidLoad` (`vm.$rows.sink { … }`) | Automatico: quando lo stato cambia, React ridisegna |
| `UITableViewCell.configure(with:)` | Componente `ProgramRow` che riceve le props |
| Delegate e target-action | Callback passate come props (`onEditDuration`) |
| `UITableViewDiffableDataSource` + `apply(snapshot)` | Il diff di React: si descrive la lista completa e React aggiorna solo ciò che è cambiato |
| Repository `protocol` + implementazione iniettata | Interfaccia `ScheduleRepository` + `FakeScheduleServer` |
| `NotificationCenter` / `PassthroughSubject` | `subscribe()` + `useSyncExternalStore` |
| `viewDidLoad` / `deinit` | Montaggio e smontaggio del componente (`useEffect` con funzione di pulizia) |

La differenza di fondo: UIKit è **imperativo** (si dice alla UI *come* cambiare), React è **dichiarativo** (si dice *cosa* mostrare per un certo stato). `UITableViewDiffableDataSource` è il punto di UIKit più vicino al modello di React.

### Livelli

Le dipendenze puntano solo verso l'interno: `ui → hooks → data → domain`.

```text
┌──────────────────────────────────────────────┐
│ ui/        Componenti React (solo vista)      │  ← View
├──────────────────────────────────────────────┤
│ hooks/     use…ViewModel                      │  ← ViewModel
├──────────────────────────────────────────────┤
│ data/      ScheduleRepository (interfaccia)   │  ← Repository
│            └ FakeScheduleServer (simulato)    │
├──────────────────────────────────────────────┤
│ domain/    TypeScript puro, zero React        │  ← Model / logica di dominio
└──────────────────────────────────────────────┘
```

- **domain/**:
  - `timecode.ts`: conversioni frame ↔ `HH:MM:SS:FF` e validazione;
  - `schedule.ts`: la funzione pura `computeSchedule(programmi) → righe`. Calcola gli orari dei flottanti, i blocchi pubblicitari, gli sforamenti e gli avvisi sulla pubblicità (D-003, D-006).

  Tutto è testabile senza browser.
- **data/**: l'interfaccia `ScheduleRepository` espone `subscribe`, `getSnapshot`, `updateDuration(id, durata, versioneAttesa)` e `addProgram(...)`. `updateDuration` restituisce `ok` oppure `conflict` (D-004). Per passare a REST + WebSocket basta cambiare l'implementazione, non la UI.
- **hooks/**: i ViewModel. Si iscrivono al repository, derivano le righe con `computeSchedule` e gestiscono lo stato della modifica in corso e del conflitto.
- **ui/**: solo vista, flusso dei dati in una sola direzione.

### Modello dati salvato

```ts
type Program = {
  id: string;
  title: string;
  durationFrames: number;            // intero, 25 frame = 1 secondo
  fixedStartFrames: number | null;   // presente solo per le ancore (D-003)
  version: number;                   // blocco ottimistico (D-004)
  updatedBy: string;                 // chi ha fatto l'ultima modifica, per il feedback visivo (RF8)
};
// Il palinsesto è un array ordinato di Program.
// Inizi dei flottanti, fine e pubblicità sono sempre calcolati, mai salvati.
```

### D-010: simulazione multiutente e vincoli del sito statico

- **Scelta**: due meccanismi che lavorano insieme.
  1. **Più tab dello stesso browser**: il "database" è il `localStorage` e l'evento `storage` avvisa le altre tab. Con due finestre affiancate si vedono le modifiche propagarsi in tempo reale.
  2. **Pannello "Simula altro utente"**: un utente fittizio compie modifiche su richiesta, con un ritardo di rete simulato. Serve a riprodurre **apposta** conflitti e sforamenti, anche con una sola tab.
- **Perché**: il primo rende il realismo, il secondo rende la demo controllabile.
- **Limiti dichiarati**:
  - il `localStorage` non è transazionale tra le tab. Per una simulazione è accettabile, e il controllo di versione resta in un unico punto (il finto server);
  - su Netlify il sito è statico, quindi **due visitatori diversi non si vedono a vicenda**: il multiutente funziona solo tra le tab dello stesso browser. Va scritto nel README;
  - i dati restano nel browser, quindi serve un pulsante **"Ripristina dati demo"**.
- **Evoluzione**: un vero backend in tempo reale (vedi "Come si può migliorare").

### Struttura delle cartelle

```text
src/
  domain/   timecode.ts, schedule.ts, types.ts (+ test)
  data/     ScheduleRepository.ts, FakeScheduleServer.ts, seed.ts
  hooks/    useScheduleViewModel.ts, useEditDurationViewModel.ts
  ui/       ScheduleScreen, ScheduleTable, ProgramRow, AdBreakRow,
            TimecodeInput, ConflictDialog, AddProgramForm, SimulationPanel
```

---

## 6. UI

### Riferimenti

- **Software professionali di palinsesto e automazione** (Mediagenix WHATS'ON, Provys, le playlist di automazione broadcast): tabelle dense con Inizio | Durata | Fine | Titolo, colori legati allo stato, ancore ben visibili. È uno strumento per **operatori**, non una guida TV per il pubblico: la densità di informazione conta più dell'estetica.
- **Google Sheets e Figma** per la collaborazione: chi ha modificato cosa, evidenziazione breve delle modifiche altrui.
- **Programmi di montaggio video** (Premiere, DaVinci Resolve) per l'inserimento del timecode.

### Wireframe

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ 📺 Canale 1 · Palinsesto di venerdì 20/11     Tu sei: ● Utente Blu           │
│ ⚠ 1 sforamento · ⓘ 1 blocco pubblicitario lungo   [+ Aggiungi] [↺ Demo]     │
├──────────────┬──────────────┬──────────────┬─────────────────────────────────┤
│ INIZIO       │ DURATA       │ FINE         │ TITOLO                          │
├──────────────┼──────────────┼──────────────┼─────────────────────────────────┤
│🔒06:00:00:00 │ 00:30:00:00  │ 06:30:00:00  │ Buongiorno Italia               │
│  06:30:00:00 │ 01:00:00:00  │ 07:30:00:00  │ Documentario Natura             │
│  07:30:00:00 │ 00:05:00:00  │ 07:35:00:00  │ ▒▒ Pubblicità                   │
│ …            │              │              │                                 │
│  19:30:00:00 │[00:32:00:00] │ 20:02:00:00  │ Quiz Show ⚠ sfora TG1 di        │
│              │              │              │   00:02:00:00       [Tronca]    │
│🔒20:00:00:00 │ 00:30:00:00  │ 20:30:00:00  │ TG1                             │
│  20:30:00:00 │ 00:45:00:00  │ 21:15:00:00  │ Film ●Utente Rosso · adesso     │
└──────────────┴──────────────┴──────────────┴─────────────────────────────────┘
┌ Strumenti demo (richiudibile) ───────────────────────────────────────────────┐
│ Simula Utente Rosso: [Allunga un programma] [Modifica il programma che sto   │
│ modificando] [Aggiungi un programma]   Ritardo di rete: [0,5 s ▾]            │
└──────────────────────────────────────────────────────────────────────────────┘
```

### D-011: comportamenti dell'interfaccia

| Situazione | Comportamento |
|------------|---------------|
| Modificare la durata | Clic sulla cella: si apre un campo timecode con la maschera `HH:MM:SS:FF` (si digitano solo le cifre). Invio salva, Esc annulla, bordo rosso se il valore non è valido |
| Riga a orario fisso | Icona 🔒, bordo sinistro marcato, inizio in grassetto |
| Riga pubblicità | Calcolata e non modificabile, stile grigio tratteggiato. Gialla oltre i 12 minuti (D-006) |
| Sforamento | Riga rossa con la quantità sforata e il pulsante [Tronca], che apre la conferma con la durata prima e dopo (D-003) |
| Qualcuno modifica un'altra riga | La riga si illumina e sfuma in circa 2 s, con il badge "● Utente Rosso · adesso". Lo scroll non salta mai: righe ad altezza fissa, niente si riordina sotto il cursore |
| Qualcuno modifica la riga che sto modificando io | Il mio campo **non viene toccato**. Compare subito un avviso con il nuovo valore. Se salvo comunque, il server rifiuta la versione non aggiornata e si apre il dialogo di conflitto |
| Dialogo di conflitto (D-004) | Mostra originale / il mio valore / quello dell'altro utente. Pulsanti: [Usa il mio valore], che riprova sulla versione nuova, e [Tieni il suo] |
| Aggiungere un programma | Finestra modale con titolo, durata e tipo (flottante dopo la riga selezionata / orario fisso con inizio) |

- **Perché sia l'avviso immediato sia il dialogo**: l'avviso **previene** la sorpresa ("sto lavorando su un dato vecchio"). Il dialogo è la **rete di sicurezza** quando l'utente salva comunque, ed è l'unico punto dove la decisione viene davvero applicata.

### D-012: stile visivo

- **Tema scuro**, come i software di regia e broadcast.
- **Timecode in carattere monospazio**, con cifre di larghezza fissa (`tabular-nums`), così le colonne non "ballano" quando i valori cambiano.
- **Colori solo con un significato preciso**: rosso per gli sforamenti, giallo per gli avvisi, blu per gli aggiornamenti da altri utenti, grigio per la pubblicità.

### Albero dei componenti

```text
ScheduleScreen                 ← useScheduleViewModel
├─ ScheduleHeader              (canale, utente, riepilogo dei problemi, azioni)
├─ ScheduleTable
│  ├─ ProgramRow               ← useEditDurationViewModel
│  │  ├─ TimecodeInput
│  │  └─ RemoteChangeNotice
│  └─ AdBreakRow
├─ ConflictDialog
├─ TruncateConfirmDialog
├─ AddProgramDialog
└─ SimulationPanel
```

---

## 7. Diario di sviluppo

| Data | Cosa | Note |
|------|------|------|
| 2026-11-20 | Lettura della traccia, impostazione del documento e della scaletta | — |
| 2026-11-20 | Setup: repo pubblico (D-001), nome `palinsesto-tv` (D-002), `.gitignore` | Il repository GitHub lo crea Mattia a mano |
| 2026-11-20 | Analisi dei requisiti | Modifica rispetto alla bozza: la pubblicità non è un semplice vuoto ma un blocco segnalato in modo esplicito (calcolato, non salvato) |
| 2026-11-20 | Decisioni di dominio D-003 … D-007 | Accorciamento simmetrico, blocco ottimistico, soglia pubblicità di 12 min. Sforamenti: si risolvono modificando le durate o con "Tronca all'ancora" |
| 2026-11-20 | Architettura D-008 … D-010 | MVVM con hook come ViewModel, allineato alla mia esperienza UIKit. Simulazione multiutente con tab + pannello. Deploy su Netlify |
| 2026-11-20 | UI D-011, D-012 | Tema scuro, avviso immediato + dialogo di conflitto. Barra temporale rimandata |
| 2026-11-20 | Struttura del progetto: Vite (template `react-ts`), React 19, TypeScript con `strict` esplicito, Vitest, oxlint, `netlify.toml`, `git init` | Rimossi i contenuti demo del template. Build, lint e test verificati |
| 2026-11-20 | Il progetto è stato spostato nella sottocartella `palinsesto-tv/` | I file privati (la traccia) restano fuori dal repository invece di essere solo ignorati |
| 2026-11-20 | 6a. Timecode (`src/domain/timecode.ts`) con 24 test | Frame interi; `parseTimecode` controlla solo il formato, `validateDuration` applica i limiti di dominio (D-005). Gli errori sono valori di ritorno (`Result`, come in Swift), non eccezioni: un input sbagliato dell'utente è un caso previsto, non un'anomalia |

---

## 8. Cosa ho lasciato per strada

- **Tipo "marcato" per i frame** (branded type, es. `number & { __brand: 'Frames' }`): impedirebbe a compile time di sommare per errore frame e secondi. Per ora `Frames` è un semplice alias di `number`: costa meno e si legge meglio, ma la protezione è solo documentale.

---

## 9. Come si può migliorare

- Autenticazione e permessi (ruoli diversi: chi può spostare un programma a orario fisso?)
- Multiutente reale tra dispositivi diversi: un backend in tempo reale (es. Supabase o Firebase Realtime, oppure un'API con WebSocket) che sostituisce `FakeScheduleServer` dietro la stessa interfaccia `ScheduleRepository`
- Barra temporale della giornata sopra la tabella (ancore, pubblicità e sforamenti visibili a colpo d'occhio). _Da fare solo se avanza tempo._
- Indicatore di presenza ("Utente Rosso sta modificando…") per prevenire i conflitti invece di limitarsi a risolverli
- _…altre proposte durante lo sviluppo_
