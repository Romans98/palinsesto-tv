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
  - [x] 6b. Motore di ricalcolo del palinsesto, con test
  - [x] 6c. Backend simulato con versioni e "altri utenti" fittizi
  - [x] 6d. Lista dei programmi
  - [x] 6e. Modifica della durata
  - [x] 6f. Aggiunta di un programma
  - [x] 6g. Gestione dei conflitti di modifica concorrente
  - [x] 6h. Feedback visivo quando i dati cambiano
  - [x] 6i. Pannello "Strumenti demo" (utente simulato)
- [x] **7. Chiusura del documento**: "Cosa ho lasciato per strada" e "Come si può migliorare"
- [ ] **8. Consegna**: README, deploy online pubblico su Netlify, video demo nel README
- [ ] **9. Preparazione del colloquio**: punti da raccontare e domande probabili

---

## 3. Analisi dei requisiti

### 3.1 Glossario

- **Palinsesto**: la sequenza ordinata dei programmi di un canale, su uno o più giorni consecutivi (vedi D-016).
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
| RF9 | Eliminare un programma (aggiunto in corso d'opera, vedi D-014) |

### 3.3 Requisiti non funzionali

- **Calcoli corretti**: il tempo è salvato come numero intero di frame, quindi non ci sono errori di arrotondamento.
- **Testabilità**: la logica di dominio è scritta come funzioni pure, separate da React.
- **Backend sostituibile**: un'interfaccia (pattern Repository) separa la UI dalla sorgente dei dati. Oggi i dati sono simulati, domani possono arrivare da un'API REST o da un WebSocket.
- **Semplicità**: l'esercizio vale circa 2 ore, quindi la chiarezza viene prima della completezza.
- **Target**: solo desktop, perché lo strumento lo usano operatori alla scrivania.

### 3.4 Ipotesi

- Un solo canale. Il palinsesto copre **più giorni consecutivi** e i programmi possono attraversare la mezzanotte. *Inizialmente* l'ipotesi era una giornata singola, superata con D-016.
- I dati sono simulati: un finto backend nel browser e alcuni "altri utenti" simulati.
- Non c'è autenticazione: ogni tab riceve un nome utente progressivo ("Utente Test 1", "Utente Test 2", …).
- La pubblicità **non viene salvata**: si ricava ogni volta dagli orari, così non può diventare incoerente con i programmi. In compenso è **visibile**, come riga dedicata con la sua durata.
- Fuori ambito: riordinare i programmi, più canali o giorni, autenticazione, persistenza reale, annulla/ripeti, versione mobile.

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
- **Revisione dopo una prova: lo sforamento è un problema dell'ancora**:
  - *Problema emerso*: allungando molto un programma (Talk Show + 3 ore), diversi flottanti finivano **interamente** dopo l'ancora delle 20:00. Solo l'ultimo era segnalato, gli altri sembravano normali pur avendo orari impossibili (es. 22:05 sopra un TG delle 20:00), e la causa non era evidente.
  - *Alternative valutate*: (A) rifiutare le modifiche che spingono programmi interi oltre l'ancora. Non basta: due modifiche diverse di due utenti, valide da sole, possono produrlo insieme, quindi la visualizzazione andava sistemata comunque. (B) Spostare automaticamente dopo l'ancora i programmi che non ci stanno. Riordina programmi che nessuno ha toccato, a cascata, ed è sorprendente e difficile da annullare. (C) Rappresentare lo sforamento a livello di **segmento** (i programmi tra due ancore).
  - *Scelta*: **C**.
    - L'**ancora** riporta lo sforamento complessivo ("I programmi precedenti sforano di 02:54:30:00"): è lì che il problema esiste, perché è lei a non poter andare in onda.
    - **Ogni programma coinvolto** è segnalato. Quello che attraversa l'orario mostra "Sfora … di …". Quelli che iniziano dopo hanno l'orario di inizio barrato e "Dopo l'inizio di …".
    - Il riepilogo conta i **limiti superati**, non le righe.
    - "Tronca" resta sull'ultimo programma. Quando non basta, il tooltip indica quanto bisogna accorciare in totale.
- **Come si risolve uno sforamento**:
  1. **Modificare a mano la durata** di uno o più flottanti tra le due ancore, oppure **eliminarne** qualcuno (D-014).
  2. **Azione rapida "Tronca all'ancora"**, solo sull'ultimo flottante prima dell'ancora sforata: imposta la durata in modo che finisca esattamente all'inizio dell'ancora.
     - Non è una nuova operazione di dominio. È una normale modifica della durata con un valore calcolato, e quindi passa dallo stesso blocco ottimistico (D-004).
     - Chiede una **conferma esplicita** con la durata prima e dopo, perché nella realtà troncare un programma significa tagliarne il contenuto.
     - È **disabilitata** quando lo sforamento è più lungo del programma stesso, perché andrebbe sotto il minimo di 1 frame (D-005). In quel caso un tooltip invita ad accorciare anche altri programmi.
  - **Casi limite decisi in fase di implementazione**:
    - un'**ancora** che sfora l'ancora successiva è segnalata e troncabile come un flottante: troncarla ne cambia la durata, non l'orario di inizio, che resta fisso. "Tronca" vale quindi per l'ultimo *programma* prima dell'ancora, non solo per l'ultimo flottante;
    - ~~superare la fine della giornata (24:00) è uno sforamento come gli altri~~ → *superato da D-016*: il palinsesto continua nel giorno successivo e la mezzanotte non è più un limite;
    - **gli orari mostrati non superano mai le 24 ore**: con il palinsesto su più giorni, ogni programma è mostrato sotto il giorno in cui inizia. Se finisce dopo la mezzanotte, la fine appare come orario del giorno successivo con `+1` (es. `00:50:00:00 +1`). Le `24:00:00:00` restano valide come fine esatta del giorno. Internamente il tempo resta un conteggio continuo di frame dall'inizio del palinsesto. *Nota*: nel broadcast esiste anche la convenzione della "giornata televisiva" con orari come `25:00` per le 01:00 della notte. È stata scartata perché poco intuitiva per chi non è del settore.
    - lo spazio **prima del primo programma** è fuori palinsesto, non pubblicità. Altrimenti un palinsesto che parte alle 06:00 mostrerebbe 6 ore di "pubblicità".
  - **Concorrenza anche su "Tronca"**: la proposta (durata attuale e nuova) viene **fissata all'apertura** della conferma insieme alla versione del programma. Se nel frattempo qualcuno modifica quel programma, la conferma si blocca e lo segnala invece di applicare un calcolo fatto su dati vecchi. Se la modifica altrui arriva proprio mentre si conferma, il server risponde con un conflitto, come per ogni altra modifica.
  - *Lasciato per strada*: altre risoluzioni possibili, come spostare un flottante dopo l'ancora o trasformare l'ancora in flottante. Richiedono operazioni fuori ambito (riordino, modifica del tipo).

### D-004: modifiche concorrenti sullo stesso programma

- **Contesto**: più persone lavorano sullo stesso palinsesto e i dati possono cambiare mentre li si guarda.
- **Quando si salva**: ogni modifica si salva da sola con Invio, sulla singola cella. Non c'è un pulsante "Salva" globale. Le modifiche piccole e atomiche riducono il tempo in cui i dati possono diventare vecchi, e quindi riducono i conflitti.
- **Alternative per i conflitti**: (A) vince l'ultimo che salva (*last write wins*); (B) blocco ottimistico con numero di versione; (C) blocco pessimistico della riga; (D) CRDT.
- **Scelta**: **B, blocco ottimistico**. Ogni programma ha una `version`. Il salvataggio indica la versione su cui l'utente stava lavorando, e se nel frattempo è cambiata il backend lo rifiuta. La UI mostra entrambi i valori e lascia scegliere ("Tieni la tua / Usa la sua").
- **Perché non le altre**: (A) fa perdere una modifica senza che nessuno se ne accorga. (C) rischia righe bloccate per sempre, per esempio se qualcuno chiude il browser. (D) è eccessivo per un singolo campo numerico.
- **Caso sottile**: due utenti allungano due programmi **diversi**. Ogni modifica è valida da sola, ma insieme sforano un'ancora. Non è un conflitto sui dati, perché gli orari sono calcolati. Si vede come sforamento (D-003) e nessuna modifica va persa.

### D-014: eliminazione di un programma (aggiunta in corso d'opera)

- **Contesto**: inizialmente era fuori ambito. È stata aggiunta su richiesta, dopo aver visto che con sforamenti grandi accorciare le durate non sempre basta.
- **Scelta**: un nuovo comando `applyDeleteProgram` con lo **stesso controllo di versione** della modifica. Eliminare un programma che qualcun altro ha appena cambiato, senza averlo visto, è un conflitto: il server lo rifiuta.
- **Interfaccia**: un'icona cestino in fondo a ogni riga, sempre visibile (nascosta fino al passaggio del mouse risultava poco scopribile), e una conferma che spiega l'effetto:
  - per un flottante, i successivi si anticipano e la pubblicità prima dell'ancora aumenta;
  - per un'ancora, i programmi che la seguono ripartono dalla fine del programma precedente.
- **Concorrenza**: come per "Tronca", la richiesta viene fissata all'apertura della conferma. Se nel frattempo il programma viene modificato o eliminato da un altro, la conferma si blocca e lo segnala.
- **Lasciato per strada**: annullare l'eliminazione (undo) e un cestino da cui recuperare i programmi.

### D-016: palinsesto su più giorni (aggiunta in corso d'opera)

- **Contesto**: all'inizio il palinsesto copriva una sola giornata, dalle 00:00 alle 24:00, e superare la mezzanotte era uno sforamento. Il bug P-4 (orari come `25:00`) ha mostrato che il vincolo era artificiale.
- **Alternative**:
  - (A) tenere la giornata singola e documentare il limite;
  - (B) palinsesto su più giorni, con una colonna "Data" in ogni riga;
  - (C) palinsesto su più giorni, con una **riga di separazione per ogni giorno**.
- **Scelta**: **C**. È lo standard di palinsesti ed EPG, e la stessa data non si ripete su decine di righe. È stata realizzata nel modo più semplice possibile:
  - **il modello non cambia**: il tempo è un conteggio continuo di frame dalle 00:00 del primo giorno. Un'ancora del giorno 2 alle 06:00 ha semplicemente `fixedStartFrames = 24 h + 6 h`. Il tipo `Program` e il formato dei dati salvati restano identici;
  - **le date non vengono salvate**: il giorno 1 è il giorno in cui si apre la demo, il giorno N è oggi + (N−1);
  - **scompare lo sforamento della fine giornata**: lo sforamento esiste solo verso le ancore, e codice e tipi si semplificano (`OverflowTarget` indica solo un'ancora);
  - ogni programma è mostrato sotto il **giorno in cui inizia**. La fine oltre la mezzanotte mostra `+1`;
  - la riga del giorno è una **fascia grigio ardesia al 30%** con testo scuro. Una prima versione in grigio chiaro si confondeva con le righe della pubblicità; la versione piena (scura con testo bianco) risultava troppo pesante;
  - per aggiungere un'ancora si sceglie **giorno** (quelli presenti più il successivo) e **ora**;
  - dati demo su **due giorni consecutivi, 24 ore su 24**, compresa la programmazione notturna, così non ci sono buchi notturni segnalati come pubblicità lunga;
  - nessuna migrazione dei dati: dopo l'aggiornamento basta "Ripristina demo".
- **Lasciato per strada**:
  - una **data di inizio salvata**: oggi, se si riapre la demo un altro giorno, le date "scorrono";
  - la regola **"Fine trasmissioni"** per i canali che non trasmettono 24 ore su 24: oggi un vuoto notturno di ore sarebbe segnalato come pubblicità troppo lunga.

### D-005: limiti di durata

- **Scelta**: durata minima 1 frame (`00:00:00:01`), massima 24 ore (`24:00:00:00`). La validazione del timecode accetta frame da 0 a 24 e minuti e secondi da 0 a 59.

### D-006: segnalazione dei blocchi pubblicitari troppo lunghi

- **Contesto reale**: in Italia non esiste un tetto fisso per singolo blocco. Gli spot sono limitati come **percentuale del tempo di trasmissione per fascia oraria** (es. 6–18 e 18–24), con limiti diversi per il servizio pubblico e per le emittenti private (riferimento: TUSMA, D.Lgs. 208/2021).
- **Scelta semplificata**: un avviso **che non blocca nulla** quando un singolo blocco pubblicitario supera i **12 minuti**. La soglia è una costante, facile da cambiare.
- **Lasciato per strada**: il calcolo vero dell'affollamento a percentuale per fascia oraria.

### D-007: aggiunta di un programma

- **Scelta**: un form con titolo, durata e tipo.
  - **Flottante**: si inserisce dopo il programma selezionato.
  - **A orario fisso**: si indicano **giorno e ora** di inizio (D-016) e il programma si colloca da solo. Viene rifiutato se si sovrappone a un'altra ancora.
- **Dettagli emersi in implementazione**:
  - **senza nessuna riga selezionata**, il flottante va **in coda** al palinsesto (più naturale di "in cima", che lo farebbe partire alle 00:00);
  - per il flottante la finestra mostra **dove finirà e a che ora inizierà** ("Dopo «Meteo», inizio previsto alle 08:34:50:12"). L'utente capisce l'effetto prima di confermare;
  - dopo l'aggiunta il nuovo programma viene **selezionato e portato in vista**, quindi l'utente vede subito dove è finito, anche se è un'ancora molto più in basso;
  - gli errori di compilazione (titolo vuoto) compaiono solo **dopo il primo tentativo** di conferma, non appena si apre la finestra. Gli errori del server (es. sovrapposizione tra ancore) compaiono in fondo alla finestra, che resta aperta con i dati inseriti;
  - la finestra usa l'elemento **`<dialog>` nativo** del browser in modalità modale: sfondo oscurato, focus confinato nella finestra ed Esc gestiti dal browser, senza librerie.

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
  updatedAt: number;                 // quando (millisecondi epoch), assegnato dal server
};
// Il palinsesto è un array ordinato di Program.
// Inizi dei flottanti, fine e pubblicità sono sempre calcolati, mai salvati.
```

### D-010: simulazione multiutente e vincoli del sito statico

- **Scelta**: due meccanismi che lavorano insieme.
  1. **Più tab dello stesso browser**: il "database" è il `localStorage` e l'evento `storage` avvisa le altre tab. Con due finestre affiancate si vedono le modifiche propagarsi in tempo reale.
  2. **Pannello "Simula altro utente"**: un utente fittizio compie modifiche su richiesta. Serve a riprodurre **apposta** conflitti e sforamenti, anche con una sola tab.
- **Perché**: il primo rende il realismo, il secondo rende la demo controllabile.
- **Limiti dichiarati**:
  - il `localStorage` non è transazionale tra le tab. Per una simulazione è accettabile, e il controllo di versione resta in un unico punto (il finto server);
  - su Netlify il sito è statico, quindi **due visitatori diversi non si vedono a vicenda**: il multiutente funziona solo tra le tab dello stesso browser. Va scritto nel README;
  - i dati restano nel browser, quindi serve un pulsante **"Ripristina dati demo"**.
- **Dettagli concordati**:
  - ogni tab riceve un nome progressivo **"Utente Test N"**, condiviso tra le tab tramite un contatore nel `localStorage`. Il nome resta nella tab (`sessionStorage`), quindi non cambia ricaricando la pagina;
  - l'utente simulato agisce **solo quando si premono i pulsanti** del pannello, così la demo è controllabile e ripetibile;
  - **nessun ritardo di rete** simulato nell'app. Inizialmente era di 0,5 s, regolabile dal pannello; è stato tolto perché rallentava la demo senza aggiungere valore, dato che i conflitti si mostrano già con il pannello e con due tab. Il server simulato conserva l'opzione `latencyMs`, usata in un test per riprodurre la corsa tra un client lento e uno veloce.
- **Struttura del codice**:
  - `domain/commands.ts`: le regole dei comandi come funzioni pure (stato + comando → nuovo stato + esito): controllo di versione, validazione, posizione di inserimento, sovrapposizione tra ancore. È la logica che un backend reale eseguirebbe lato server;
  - `data/FakeScheduleServer.ts`: solo il "trasporto" (storage, notifiche, ritardo opzionale). Lo storage e la sorgente delle notifiche esterne sono **iniettati**, quindi nei test si simulano due tab senza browser;
  - `data/SimulatedUser.ts`: usa lo stesso `ScheduleRepository` di qualunque client, senza scorciatoie. Se lavora su dati non aggiornati riceve anche lui un conflitto.
- **Il ritardo di rete, quando è attivo, viene applicato prima di eseguire il comando**: il comando viene valutato sullo stato presente *all'arrivo* al "server", come nella realtà. Un test lo verifica con un client lento e uno veloce.
- **Pannello "Strumenti demo"**, richiudibile, in fondo alla pagina e volutamente separato dall'interfaccia "vera" (bordo tratteggiato). L'utente simulato agisce sulla **riga selezionata**: allunga o accorcia di 2 minuti, aggiunge una promo dopo, elimina. Il pannello mostra l'esito dell'ultima azione, conflitti compresi.
  - **I pulsanti del pannello non rubano il focus**: si può tenere aperta la modifica di una durata e far agire l'utente simulato sullo stesso programma. Così l'avviso immediato e il dialogo di conflitto si mostrano con una sola tab, al colloquio e nel video.
- **Evoluzione**: un vero backend in tempo reale (vedi "Come si può migliorare").

### D-013: dependency injection e ViewModel

- **Dependency injection con un Context React**: `AppServicesProvider`, in cima all'app, fornisce repository, utente corrente e utente simulato. I componenti li ottengono con `useAppServices()`. È l'equivalente di un *dependency container* passato al coordinator o al view controller in UIKit. Nei test basta fornire un provider con implementazioni finte.
- **`useScheduleViewModel`** (schermata): si collega al repository con `useSyncExternalStore`, ricalcola il palinsesto solo quando cambiano i dati (`useMemo`) e gestisce selezione e riga in modifica. La regola "una sola riga in modifica alla volta" è garantita in un unico punto.
- **`useEditDurationViewModel`** (sessione di modifica): lo usa solo il componente `DurationEditor`, che esiste solo mentre la riga è in modifica. Il ciclo di vita del ViewModel coincide quindi con la sessione, e alla chiusura lo stato viene scartato da solo.
  - all'apertura memorizza la **versione di partenza**, che viene inviata come `expectedVersion`;
  - stati: `editing → saving → (chiuso | editing con errore | conflict)`;
  - l'avviso "qualcuno ha cambiato questo programma" è **derivato** (la versione attuale è diversa da quella di partenza), non è uno stato da sincronizzare;
  - se la durata non è cambiata, Invio chiude senza chiamare il server.
- **Campo timecode a maschera fissa**, che si scrive **da sinistra verso destra** come i campi data: la cifra sotto il cursore è evidenziata e viene sovrascritta, i `:` vengono saltati, frecce, Home/Fine e clic spostano il cursore, Backspace torna indietro, incollare `00:30:00:00` funziona. Il campo contiene sempre un timecode formattato, quindi gli unici errori possibili sono di dominio (es. frame > 24, durata zero).
  - *Prima versione scartata*: inserimento "da destra" come nei software di montaggio (digitando `3000` si otteneva `00:00:30:00`). Provandolo è risultato scomodo per chi non viene dal montaggio.
- **Uscire dal campo equivale ad annullare** (come Esc), ma solo mentre si sta scrivendo: non durante il salvataggio né con il conflitto aperto. **Eccezione voluta**: se è l'intera finestra a perdere il focus (si passa a un'altra tab o applicazione) la modifica resta aperta. Altrimenti sarebbe impossibile lavorare con due tab affiancate, che è proprio lo scenario multiutente da mostrare.

### Struttura delle cartelle

```text
src/
  app/      services.ts (dipendenze condivise), AppServicesProvider.tsx
  domain/   timecode.ts, schedule.ts, commands.ts, types.ts (+ test)
  data/     ScheduleRepository.ts, FakeScheduleServer.ts, seed.ts
  hooks/    useScheduleViewModel.ts, useEditDurationViewModel.ts
  ui/       ScheduleScreen, ScheduleHeader, ScheduleTable, ProgramRow, AdBreakRow,
            DurationEditor, TimecodeInput, (ConflictDialog, AddProgramDialog, SimulationPanel)
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
│ 📺 Canale 1 · Palinsesto di venerdì 20/11     Tu sei: ● Utente Test 1           │
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
│  20:30:00:00 │ 00:45:00:00  │ 21:15:00:00  │ Film ●Utente Test 2 · adesso     │
└──────────────┴──────────────┴──────────────┴─────────────────────────────────┘
┌ Strumenti demo (richiudibile) ───────────────────────────────────────────────┐
│ Simula Utente Test 2: [Allunga un programma] [Modifica il programma che sto   │
│ modificando] [Aggiungi un programma]                                         │
└──────────────────────────────────────────────────────────────────────────────┘
```

### D-011: comportamenti dell'interfaccia

| Situazione | Comportamento |
|------------|---------------|
| Modificare la durata | Clic sulla cella: si apre un campo timecode con la maschera `HH:MM:SS:FF` (si digitano solo le cifre). Invio salva, Esc annulla, bordo rosso se il valore non è valido |
| Clic su una riga | La seleziona (azzurro): la selezione indica dove inserire un nuovo flottante e su quale programma agisce l'utente simulato. Un secondo clic la deseleziona, tranne mentre se ne modifica la durata |
| Riga a orario fisso | Icona 🔒, bordo sinistro marcato, inizio in grassetto |
| Riga pubblicità | Calcolata e non modificabile, stile grigio tratteggiato. Gialla oltre i 12 minuti (D-006) |
| Sforamento | Riga rossa con la quantità sforata e il pulsante [Tronca], che apre la conferma con la durata prima e dopo (D-003) |
| Qualcuno modifica un'altra riga | La riga si illumina e sfuma in circa 2 s, con il badge "● Utente Test 2 · adesso". Lo scroll non salta mai: righe ad altezza fissa, niente si riordina sotto il cursore |
| Qualcuno modifica la riga che sto modificando io | Il mio campo **non viene toccato**. Compare subito un avviso con il nuovo valore. Se salvo comunque, il server rifiuta la versione non aggiornata e si apre il dialogo di conflitto |
| Dialogo di conflitto (D-004) | Mostra originale / il mio valore / quello dell'altro utente. Pulsanti: [Usa il mio valore], che riprova sulla versione nuova, e [Tieni il suo] |
| Aggiungere un programma | Finestra modale con titolo, durata e tipo (flottante dopo la riga selezionata / orario fisso con inizio) |

- **Finestra di conflitto**: mostra i tre valori (quando ho iniziato / il mio / quello dell'altro utente, con l'orario della sua modifica). L'azione predefinita, col focus, è "Usa il mio", perché è quella che l'utente stava facendo. **Esc equivale a "Tieni il suo"**: chiudere senza scegliere non deve mai sovrascrivere il lavoro di un altro.
- **Finestre modali**: un unico componente `Modal`, basato sull'elemento `<dialog>` nativo, condiviso da aggiunta, conflitto e troncamento. Viene montato nel `body` con un *portal* di React. La finestra di conflitto nasce dentro la cella della durata, e senza portal ne ereditava gli stili: il testo non andava a capo e la finestra scorreva in orizzontale.
- **Perché sia l'avviso immediato sia il dialogo**: l'avviso **previene** la sorpresa ("sto lavorando su un dato vecchio"). Il dialogo è la **rete di sicurezza** quando l'utente salva comunque, ed è l'unico punto dove la decisione viene davvero applicata.

### D-015: feedback sulle modifiche degli altri utenti

- **Contesto**: la traccia chiede cosa vede l'utente quando i dati cambiano mentre li sta guardando.
- **Rilevamento**: una funzione pura, `detectRemoteChanges(prima, dopo, utente)`, confronta due snapshot e trova i programmi modificati (versione cresciuta), aggiunti o eliminati da altri. Non servono log di eventi né infrastruttura aggiuntiva.
- **Cosa vede l'utente**:
  - la **riga modificata** si colora di azzurro per circa 2,5 s e poi torna normale, **senza animazioni**. Una nuova modifica alla stessa riga prolunga l'evidenziazione. *Prima versione scartata*: una dissolvenza di 0,9 s, che per errore si applicava anche alla selezione e al passaggio del mouse, rendendoli lenti;
  - una **notifica** in basso a destra ("Utente Test 2 ha modificato «Quiz Show»"). È indispensabile per le **eliminazioni**, che non hanno più una riga da evidenziare. Se l'eliminazione riguarda il programma che sto modificando, la notifica lo dice esplicitamente;
  - se arrivano più modifiche insieme, un'**unica notifica riassuntiva** ("Palinsesto aggiornato da altri utenti: N modifiche"), invece di una raffica;
  - le colonne "Modificato da / alle" restano come traccia permanente di chi ha toccato cosa.
- **Cosa non succede, di proposito**: niente scroll automatico verso le modifiche altrui e niente riordino sotto il cursore. L'utente non perde il punto in cui stava lavorando.
- **Non sono segnalate**: le mie modifiche (le conosco già), le mie eliminazioni e il ritorno dei dati demo alla versione iniziale.

### D-012: stile visivo (rivisto dopo la prima prova)

- **Prima versione**: tema scuro "da regia", timecode in monospazio, emoji come icone.
- **Problema emerso provandola**: contrasto basso e lettura faticosa. Soprattutto l'aspetto era quello tipico di un'interfaccia generata dall'IA (sfondo nero, emoji, righe a strisce), poco credibile come strumento di lavoro.
- **Scelta attuale**: le convenzioni dei **software gestionali** su cui si basano i tool di palinsesto professionali (griglie in stile AG Grid o Google Sheets):
  - tema **chiaro**, griglia densa con bordi sottili e intestazioni fisse;
  - font di sistema con **cifre a larghezza fissa** (`tabular-nums`) invece del monospazio, così le colonne restano allineate;
  - **icone vettoriali** (SVG) al posto delle emoji;
  - colore **solo dove c'è un significato**: rosso per gli sforamenti, ambra per gli avvisi, blu per azioni e selezione; tutto il resto è in scala di grigi;
  - una barra con il riepilogo dei problemi e una legenda (orario fisso, pubblicità calcolata, 25 fps);
  - le colonne **"Modificato da"** e **"Modificato alle"** mostrano chi ha toccato ogni programma e quando (solo l'ora se è oggi, altrimenti anche la data; nel tooltip la data completa). Sono due colonne separate, così nomi e orari restano allineati. È utile per il lavoro a più mani e prepara il feedback sui cambiamenti.
  - L'istante della modifica lo assegna il **server**, non il browser di chi modifica: gli orologi dei client possono essere sbagliati o non allineati. Le funzioni dei comandi lo ricevono come parametro, quindi restano pure e testabili.
  - Cambiando la forma dei dati salvati è cambiata anche la chiave nel `localStorage` (`…/v2`): i dati vecchi di chi aveva già aperto la demo vengono ignorati invece di rompere l'app.
- **Lezione**: le scelte estetiche vanno validate guardando il risultato, non solo sulla carta.

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
| 2026-11-20 | 6b. Motore di ricalcolo `computeSchedule` (`src/domain/schedule.ts`) con 20 test | Funzione pura: riceve i programmi salvati e restituisce righe pronte per la UI (orari, pubblicità, sforamenti, proposta di troncamento) più il riepilogo dei problemi. Casi di test concordati prima di scrivere il codice |
| 2026-11-20 | 6c. Backend simulato: `domain/commands.ts`, `data/` (repository, server simulato, utente simulato, identità, dati demo) | 76 test in totale. Utenti chiamati "Utente Test N" su richiesta. Il vincolo `erasableSyntaxOnly` del template vieta le *parameter properties* nei costruttori, quindi i campi sono dichiarati in modo esplicito |
| 2026-11-20 | 6d + 6e. Prima UI: dependency injection, ViewModel, tabella in tema scuro, modifica della durata (D-013) | Il conflitto ha già una prima versione inline nell'editor; la versione definitiva (dialogo + avviso immediato) arriva al passo 6g |
| 2026-11-20 | Revisione dopo la prima prova | Interfaccia rifatta in stile gestionale chiaro (D-012), timecode da sinistra verso destra e chiusura dell'editor alla perdita del focus (D-013). Corretto un bug: uscendo dal campo l'editor restava aperto ma non rispondeva più a Invio ed Esc |
| 2026-11-20 | Autore e orario dell'ultima modifica, in due colonne separate | Nuovo campo `updatedAt`, assegnato dal server simulato (D-012) |
| 2026-11-20 | 6f. Aggiunta di un programma: `AddProgramDialog` + `useAddProgramViewModel` | Riusa `applyAddProgram` (già testato) e il campo timecode. Dettagli in D-007 |
| 2026-11-20 | 6g. Concorrenza nella UI: avviso immediato, finestra di conflitto, "Tronca" con conferma, componente `Modal` comune | Il pannello demo per provocare conflitti con una sola tab diventa il passo 6i |
| 2026-11-20 | Correzione: finestra di conflitto con scorrimento orizzontale | Ereditava `white-space: nowrap` dalla cella della tabella. Risolto montando `Modal` nel `body` con un portal e fermando la propagazione dei clic, che nei portal React risalgono comunque l'albero dei componenti |
| 2026-11-20 | Revisione di D-003: sforamento a livello di segmento | Bug segnalato provando l'app: con sforamenti grandi i programmi spinti oltre l'ancora non erano segnalati. `computeSchedule` ora segnala tutti i programmi coinvolti e l'ancora riporta il totale; 8 nuovi test sul caso concreto |
| 2026-11-20 | D-014: eliminazione di un programma | Nuovo comando con controllo di versione, conferma con l'effetto sul palinsesto; 92 test in totale |
| 2026-11-20 | 6h + 6i. Feedback sulle modifiche altrui (D-015) e pannello "Strumenti demo" (D-010) | `detectRemoteChanges` con 7 test, 99 test in totale. Il lint ha segnalato una dipendenza mancante in un effetto: risolta leggendo i valori di contesto da un ref invece di silenziare l'avviso |
| 2026-11-20 | Rimosso il ritardo di rete simulato e il relativo selettore del pannello | Rallentava la demo senza aggiungere valore; l'opzione resta nel server per i test |
| 2026-11-20 | Correzione: orari oltre la mezzanotte mostrati come `25:00:00:00` | Ora appaiono come orari del giorno successivo con `+1` (`formatTimeOfDay`, 4 test). Corretto anche il testo del badge ("Oltre la fine della giornata") |
| 2026-11-20 | Nuova sezione "Problemi riscontrati" (P-1 … P-4) | Raccoglie i bug trovati provando l'app, con causa, correzione e lezione |
| 2026-11-20 | D-016: palinsesto su più giorni | Proposta discussa e approvata prima del codice. Modello invariato (frame continui), righe di separazione per giorno, scelta del giorno per le ancore, dati demo su 2 giorni 24 ore su 24; 109 test |
| 2026-11-20 | Un secondo clic su una riga selezionata la deseleziona | Valutato e scartato di rendere le righe non cliccabili: la selezione serve all'inserimento dei flottanti e al pannello demo |
| 2026-11-20 | Rimosse le animazioni sulle righe | La transizione pensata per far sparire l'evidenziazione delle modifiche altrui si applicava a tutte le righe, rallentando selezione e passaggio del mouse |
| 2026-11-20 | 7. Chiusura del documento | "Cosa ho lasciato per strada" e "Come si può migliorare" riorganizzati per area, con il motivo di ogni scelta e il rimando alle decisioni |
| 2026-11-20 | 8. README | Pensato per chi apre il repository: le tre domande della traccia con la risposta in breve, funzionalità, avvio, come provare il multiutente, architettura, scelte tecniche, test e limiti. Screenshot in `docs/screenshot.png`. Video demo e deploy rimandati |

---

## 8. Problemi riscontrati

Problemi emersi **provando l'app**, non dai test automatici. Per ognuno: come si manifestava, la causa, la correzione e cosa ne ho imparato.

### P-1: l'editor della durata restava aperto ma "morto"
- **Sintomo**: cliccando su una durata e poi su un'altra riga, il campo restava aperto ma non rispondeva più a Invio ed Esc.
- **Causa**: la tastiera arriva solo all'elemento con il focus. Uscendo dal campo, il campo restava a schermo senza più ricevere i tasti.
- **Correzione**: perdere il focus equivale a Esc, tranne quando è l'intera finestra a perderlo (passaggio a un'altra tab), per non rompere la demo con due tab affiancate (D-013).
- **Lezione**: ogni stato "aperto" della UI deve avere un'uscita per tutte le strade con cui l'utente può andarsene.

### P-2: finestra di conflitto con scorrimento orizzontale
- **Sintomo**: il testo della finestra non andava a capo e la finestra scorreva in orizzontale.
- **Causa**: la finestra era annidata nella cella della durata ed ereditava `white-space: nowrap`, pensato per non spezzare il timecode.
- **Correzione**: tutte le finestre modali vengono montate nel `body` con un *portal* React. I clic vengono fermati in modo esplicito, perché nei portal React gli eventi risalgono comunque l'albero dei componenti (D-011).
- **Lezione**: l'ereditarietà CSS segue la posizione nel DOM, non la posizione visiva sullo schermo.

### P-3: programmi oltre l'ancora non segnalati
- **Sintomo**: allungando di 3 ore il Talk Show, diversi programmi finivano interamente dopo il TG delle 20:00 con orari impossibili (es. 22:05 sopra il TG delle 20:00). Solo l'ultimo era segnalato.
- **Causa**: lo sforamento era attribuito a un solo programma, il che funziona solo se lo sforamento è piccolo.
- **Correzione**: lo sforamento diventa un problema del **segmento** e dell'ancora. L'ancora riporta il totale e ogni programma coinvolto è segnalato (revisione di D-003, 8 nuovi test sul caso concreto).
- **Lezione**: un modello va provato con i casi estremi, non solo con quelli "di tutti i giorni".

### P-4: orari oltre le 24 ore (`25:00:00:00`)
- **Sintomo**: allungando il Telegiornale della Notte (23:30) a 1 h 20', le fine e gli inizi dopo la mezzanotte apparivano come `24:50:00:00` e `25:00:00:00`. Anche il badge era sgrammaticato ("Dopo l'inizio di la fine della giornata").
- **Causa**: internamente il tempo è un conteggio continuo di frame dall'inizio della giornata, ed era mostrato così com'era anche oltre le 24 ore. Il testo del badge era costruito componendo frasi pensate solo per le ancore.
- **Correzione**: oltre la mezzanotte l'orario riparte da 00 con l'indicatore `+1` (giorno successivo), mentre le `24:00:00:00` restano valide solo come fine della giornata (`formatTimeOfDay`, 4 test). Il badge ha ora un testo dedicato: "Oltre la fine della giornata".
- **Lezione**: un buon modello interno (frame continui) non va mostrato così com'è. La conversione verso il linguaggio dell'utente è un passaggio a sé, da testare.
- **Sviluppo successivo**: il bug ha mostrato che il vincolo della giornata singola era **artificiale**. Nella realtà un film delle 23:00 finisce all'01:00. Da qui la decisione **D-016**: palinsesto su più giorni. L'indicatore `+1` introdotto per questo bug è rimasto, con un significato più corretto: "finisce nel giorno successivo a quello in cui inizia".

## 9. Cosa ho lasciato per strada

Scelte consapevoli per restare nel perimetro di un esercizio. Per ognuna c'è il motivo; i dettagli sono nella decisione indicata.

### Dominio

- **Riordino dei programmi e modifica di titolo, orario o tipo** (flottante ↔ ancora): la traccia chiede di modificare la durata; aggiungere ed eliminare sono arrivati dalle risposte del cliente e dalle prove. Ogni operazione in più è un comando in più con le sue regole di concorrenza.
- **Altre risoluzioni dello sforamento** (spostare un flottante dopo l'ancora, trasformare l'ancora in flottante): richiedono proprio il riordino e il cambio di tipo (D-003).
- **Affollamento pubblicitario reale**: la norma ragiona in percentuale per fascia oraria. Qui c'è una soglia fissa di 12 minuti per blocco, solo come avviso (D-006).
- **Data di inizio del palinsesto salvata**: il giorno 1 è "oggi", quindi riaprendo la demo un altro giorno le date scorrono (D-016).
- **Regola "Fine trasmissioni"** per i canali che non trasmettono 24 ore su 24: oggi un vuoto notturno di ore verrebbe segnalato come pubblicità lunga (D-016).
- **Più canali**: il modello ne gestisce uno solo.

### Concorrenza e dati

- **Backend reale**: il "server" è simulato nel browser. Il multiutente funziona tra le tab dello stesso browser, non tra visitatori diversi del sito pubblicato (D-010).
- **Transazionalità vera tra le tab**: il `localStorage` non offre un *compare-and-set* atomico tra processi diversi. La finestra di rischio è minima, ma un backend reale la eliminerebbe (D-010).
- **Annulla / ripeti e cestino**: un'eliminazione è definitiva (D-014).
- **Migrazioni dei dati salvati**: quando la forma dei dati cambia si riparte dai dati demo ("Ripristina demo").
- **Modalità automatica dell'utente simulato** (modifiche casuali ogni N secondi): scartata a favore di pulsanti espliciti, per una demo ripetibile (D-010).
- **Ritardo di rete simulato**: tolto dall'app perché rallentava la demo; resta solo nei test (D-010).

### Interfaccia

- **Barra temporale** della giornata sopra la tabella (D-011).
- **Versione mobile / tablet**: lo strumento è pensato per operatori alla scrivania (requisiti non funzionali).
- **Navigazione completa da tastiera** tra le righe e **verifica di accessibilità**: le basi ci sono (`<dialog>` nativo, etichette ARIA, focus gestito), ma non è stato fatto un controllo sistematico.

### Qualità e strumenti

- **Test dei componenti React** (Testing Library + jsdom) e **test end-to-end** (es. Playwright): la logica non banale è in funzioni pure coperte da oltre 100 test; hook e componenti sono volutamente sottili. Con più tempo aggiungerei test di interazione sul campo timecode e sul flusso di conflitto.
- **Tipo "marcato" per i frame** (*branded type*, es. `number & { __brand: 'Frames' }`): impedirebbe in compilazione di sommare per errore frame e secondi. Oggi `Frames` è un alias di `number`, quindi la protezione è solo documentale.
- **Integrazione continua** (es. GitHub Actions che eseguono test, lint e build a ogni push).

---

## 10. Come si può migliorare

Proposte per un'evoluzione verso un prodotto reale, in ordine di valore per chi usa lo strumento.

### Per chi lavora sul palinsesto

1. **Prevenire invece di segnalare**: un'**anteprima** nell'editor della durata, prima di premere Invio ("questa modifica fa sforare il TG di 02:54:30:00").
2. **Indicatore di presenza** ("Utente Test 2 sta modificando «Quiz Show»"): riduce i conflitti invece di limitarsi a risolverli. Con un backend reale si ottiene con poco, inviando il "sto modificando X" sullo stesso canale in tempo reale.
3. **Storico delle modifiche e annulla**: chi ha cambiato cosa e quando, con la possibilità di tornare indietro. Utile anche per le verifiche a posteriori, frequenti nel broadcast.
4. **Barra temporale** con ancore, pubblicità e sforamenti visibili a colpo d'occhio, e magari trascinamento per riordinare.
5. **Calcolo reale dell'affollamento pubblicitario** per fascia oraria, con regole diverse per servizio pubblico ed emittenti private.
6. **Più canali** e passaggio tra canali.
7. **Esportazione** del palinsesto verso i sistemi di messa in onda (playout) e verso le guide TV (EPG).

### Architettura

1. **Backend reale in tempo reale**: un'API con WebSocket, oppure servizi come Supabase o Firebase. Sostituisce `FakeScheduleServer` dietro la **stessa interfaccia** `ScheduleRepository`, senza toccare la UI. Le regole di dominio (`domain/commands.ts`) sono già funzioni pure, riutilizzabili lato server.
2. **Autenticazione e permessi**: utenti reali al posto di "Utente Test N", e ruoli diversi (es. solo un responsabile può modificare o eliminare un programma a orario fisso).
3. **Registro delle operazioni** (*event log*) lato server: abilita storico, annulla e verifiche, e rende più robusta la sincronizzazione tra client.
4. **Persistenza con data reale** del palinsesto e migrazioni dei dati versionate.
5. **Virtualizzazione della tabella**: con settimane di palinsesto le righe diventano migliaia, e conviene disegnare solo quelle visibili.

### Qualità

1. Test dei componenti e test end-to-end sui flussi principali (modifica, conflitto, aggiunta, eliminazione).
2. Integrazione continua con test, lint e build a ogni pull request, e deploy automatico.
3. Verifica di accessibilità (navigazione da tastiera, lettori di schermo, contrasti).
