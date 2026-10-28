# GPA Calculator

A modern, responsive GPA calculator for university students. Enter your Continuous Assessment (CA), Exam score and credit units for each course, and get your GPA on the 4.0 scale with a letter grade and degree classification.

Built with plain HTML, CSS and JavaScript. No frameworks, no build step, no dependencies.

---

## Features

- **Live grading**: total score and letter grade update as you type
- **Flexible courses**: add or remove as many courses as you need
- **Weighted calculation**: GPA is weighted by credit units
- **Input validation**: out-of-range or incomplete entries are highlighted with clear messages
- **Result dashboard**: GPA ring, letter grade, degree class, total credits, quality points and course count
- **History**: past calculations are saved in the browser (localStorage)
- **CSV export**: download your history as `gpa_history.csv`
- **Dark mode**: follows your system preference and remembers your choice
- **Responsive**: works on phones, tablets and desktops
- **Keyboard friendly**: press `Enter` in any field to calculate

---

## Project Structure

```
gpa-calculator/
├── index.html    # Page structure
├── styles.css    # Styling, theming and responsive layout
├── script.js     # Calculation logic, validation, history and theme
└── README.md
```

---

## Getting Started

1. Download or clone the project.
2. Make sure the files are named `index.html`, `styles.css` and `script.js` and sit in the same folder.
3. Open `index.html` in any modern browser.

That's it. No installation required.

---

## Grading Scale

| Score   | Grade | Grade Points |
|---------|-------|--------------|
| 80–100  | A     | 4.0 |
| 70–79   | B+    | 3.5 |
| 60–69   | B     | 3.0 |
| 55–59   | C+    | 2.5 |
| 50–54   | C     | 2.0 |
| 45–49   | D+    | 1.5 |
| 40–44   | D     | 1.0 |
| 0–39    | F     | 0.0 |

### Degree Classification

| GPA         | Class               |
|-------------|---------------------|
| 3.5 – 4.0   | First Class         |
| 3.0 – 3.49  | Second Class Upper  |
| 2.5 – 2.99  | Second Class Lower  |
| 2.0 – 2.49  | Third Class         |
| Below 2.0   | Pass / Fail         |

---

## How the GPA Is Calculated

For each course:

```
Total score  = CA + Exam
Grade point  = looked up from the grading scale
Quality pts  = Grade point × Credit units
```

Then:

```
GPA = Sum of quality points ÷ Sum of credit units
```

Courses with no credit units entered are ignored.

---

## Customization

All settings are at the top of `script.js`.

**Change the CA and Exam maximums** (default 30 and 70, totalling 100):

```js
const CA_MAX = 30;
const EXAM_MAX = 70;
```

**Change the grading scale** (list from highest to lowest):

```js
const GRADE_SCALE = [
    { min: 80, letter: "A",  point: 4.0 },
    { min: 70, letter: "B+", point: 3.5 },
    // ...
];
```

**Change degree classes**:

```js
const CLASSES = [
    { min: 3.5, name: "First Class" },
    // ...
];
```

**Change the theme colors** by editing the CSS variables in the `:root` and `[data-theme="dark"]` blocks of `styles.css`.

---

## Browser Support

Works in the latest versions of Chrome, Edge, Firefox and Safari.

---

## Data and Privacy

Everything runs locally in your browser. No data is sent to any server. History and theme preference are stored in your browser's localStorage and can be removed with the **Clear** button or by clearing site data.

---

## Roadmap

- Cumulative GPA (CGPA) across multiple semesters
- Target GPA planner ("what do I need to score?")
- Print / PDF export
- Save and load named semesters

---

## License

Released under the MIT License. Free to use, modify and distribute.
