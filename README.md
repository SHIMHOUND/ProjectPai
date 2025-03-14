# pai2024

## Zadanie zaliczeniowe

### Część obowiązkowa (na 3)
Rozszerzyć model o zadania wg zasady, że każdy projekt składa się z zestawu zadań posiadających nazwę, datę rozpoczęcia i opcjonalną datę zakończenia (jej ustawienie oznacza że zadanie zostało zakończone) oraz zbiór osób realizujących. GUI do zarządzania zadaniami nie jest odrębną pozycją nawigacji, można je wywołać nowym przyciskiem [Zadania] wewnątrz dialogu do edycji projektu. Ten nowy dialog modalny pozwala na dodawanie, edycję i usuwanie zadań z projektu. Zbiór wykonawców jest realizowany przez wybór wielokrotny.

### Na 4
Nowa pozycja nawigacji, "Analiza", dostępna dla roli 0. Widok zawiera diagram Gantta wszystkich projektów na podstawie ich daty startu i końca. Dodatkowo, po wybraniu jednego projektu za pomocą comboboxa, pokazuje się drugi diagram Gantta dla zadań w projekcie. W obu diagramach projekty i zadania niezakończone są wyróżnione i "trwają" do aktualnego dnia.

### Na 5
Diagramy z punktu 4 automatycznie odświeżają się w przypadku gdy ktoś z innej sesji przeglądarkowej zmodyfikuje odpowiednie dane.

## Pobranie/aktualizacja projektu

Pobranie ostatniej wersji do nowego katalogu ``pai2024``
```
git clone https://gitlab.com/mariusz.jarocki/pai2024.git
```
Aktualizacja posiadanego kodu do ostatniej wersji
```
cd pai2024
git reset
git pull
```

## Instalacja zależności
```
npm install
cd pai2024-vue
npm install
```

## Uruchomienie backendu
```
npm start
```
Backend będzie dostępny pod adresem http://localhost:8000

## Kompilacja frontendu do wersji produkcyjnej
```
cd pai2024-vue
npm run build
```

## Uruchomienie serwera frontendu developerskiego
```
cd pai2024-vue
npm run dev
```
Serwer będzie dostępny pod adresem http://localhost:5173# ProjectPai
