# MyMusicQuest
Hier soll ein Musik-Rate-Spiel entstehen.
## Story
Ziel ist es, Musik anzuhören und entsprechend der jahreszahl korrekt einzuordnen. außerdem kann man auch titel und interpret erraten. dabei spielen 2 teams gegeneinander
## Verlauf
Zu Begin haben beide teams noch keine jahreszahl als anhaltspunkt. es wird das erste lied abgespielt. das team, das den interpret/titel kennt, erhält dieses lied und hat somit den ersten zug geschafft. 
dann geht es weiter immer abwechselnd:
1. ein lied wird abgespielt
2. das team, das an der reihe ist, überlegt, wann das lied veröffentlicht wurde, und ordnet es entsprechend in die zeitleiste der bereits gewonnenen karten ein. (in der ersten runde gibt es noch keine karte)
3. liegt das lied korrekt, wird das lied in der zeitleiste eingeordnet und man hat eine lied mehr. liegt das lied nicht korrekt, wird es verworfen und das andere team ist an der reihe. die jahreszahlen werden mit >= und <= verglichen
4. anderes team ist an der reihe

## Technologie
### lieder auswahl
die lieder je spiel sollen vor einem durchlauf zufällig gewählt werden. hier kann man nach genre wählen etc. im ersten schritt kann das noch manuell erfolgen, erst in weiterer folge automatisiert. erstelle zum testen eine liste von 40 songs.
### runtime
das spiel soll am tablet funktionieren. am liebsten würde ich eine PWA erstellen. sollte das aufgrund der möglichkeiten zum abspielen von liedern nicht möglich sein, werden wir wohl eine mobile app bauen müssen
### audio quelle
eine möglichkeit wäre, spotify anzusprechen. ich habe spotify pro. ist das technisch möglich? evtl auch youtube möglich? wir brauchen jedenfalls eine korrekte liste aus titel/interpreten und jahreszahl.
## Hosting
wenn mobile app: wäre rein client seitig möglich? wenn pwa: gerne render.com o.ä., ich könnte zur not auch selber hosten

## Doku
Erstelle bitte eine README.md und warte bei jeder Änderung eine CLAUDE.md.
Wir sind die einzigen entwickler, wir können direkt in main committen.
