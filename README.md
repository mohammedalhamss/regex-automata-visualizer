# 🚀 Visual Regex Engine (NFA & DFA)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)]()
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)]()

> **An interactive Automata Laboratory that visualizes the transformation of Regular Expressions into NFA and DFA. Built with vanilla JavaScript and Vis.js to bridge the gap between theoretical computation and interactive simulation.**

**Automata Theory Visualizer** is a comprehensive educational tool designed to demystify the core concepts of Formal Language Theory. By providing a visual pipeline from abstract mathematical expressions to functional state machines, it allows users to witness the "engineering behind the scenes" of a regex engine.

Originally developed for the **Theory of Computation** course under the instruction of **Dr. ROA'A MOHAMMEDQASEM**.

---

## ✨ Key Features

* **The Compiler Pipeline:** Converts Infix Regex → Postfix (Shunting-Yard) → Thompson’s NFA → Subset Construction DFA.
* **The Constructor:** Manually define states, alphabets, and transitions for custom automata with "from-scratch" simplicity.
* **The Simulator:** Watch strings flow through states with live highlighting and detailed $\epsilon$-closure processing logs.
* **Smart Visualization:** Implements a hierarchical layout algorithm and smart edge merging (via Vis.js) to ensure clarity even in complex state machines.

## 🛠️ Technologies Used

* **Logic:** Vanilla JavaScript (ES6+)
* **Visualization:** [Vis.js Network](https://visjs.github.io/vis-network/docs/network/)
* **Styling:** Modern CSS3 with a responsive, slate-themed layout.
* **Documentation:** Microsoft PowerPoint (Included in `/docs`).

## 🚀 Installation & Usage

### Local Setup
Since this is a client-side application, no installation or specialized environment is required.

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/YOUR_USERNAME/regex-automata-visualizer.git](https://github.com/YOUR_USERNAME/regex-automata-visualizer.git)
    ```
2.  **Open the app:**
    Navigate to the project folder and open `index.html` in any modern web browser.

### How to Use
1.  **Regex Mode:** Enter a pattern (e.g., `(a|b)*abb`), toggle DFA if desired, and click **Generate Machine**.
2.  **Manual Mode:** Click "Initialize & Define Rules" to build your own state machine transition by transition.
3.  **Simulation:** Enter a test string and click **Run Simulation**. The interface will highlight the active states in real-time.

## 💡 Why It Matters
Traditional textbooks represent NFAs and DFAs as static diagrams. This tool transforms them into a **living laboratory**, making complex transitions and non-determinism visible and intuitive for students and educators alike.

## 📊 Performance & Constraints
* **Algorithmic Limits:** Optimized for standard alphabets; conversion for regex with 8+ unique symbols may prompt a complexity warning.
* **Visualization:** Uses a hierarchical layout; for machines exceeding 200 nodes, it is recommended to switch to force-directed rendering.

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author
**Mohammed Alhamss**
* Course: Theory of Computation
