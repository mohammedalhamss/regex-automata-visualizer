// ==========================================
//      GLOBAL VARIABLES
// ==========================================

let config = {
    states: [],
    alphabet: [],
    start: '',
    accept: [],
    transitions: {} // Format: "q0|a" -> ["q1"]
};

const EPSILON = 'ε';
const EPSILON_KEY = 'EPSILON';

// Vis.js
let network = null;
let allNodes = new vis.DataSet();
let allEdges = new vis.DataSet();

// Colors
const NODE_COLOR = '#ffffff';
const ACTIVE_COLOR = '#4f46e5';
const ACCEPT_BORDER = '#16a34a';

// ==========================================
//      PART 1: REGEX COMPILER
// ==========================================

function processRegex() {
    const regex = document.getElementById('regexInput').value.trim();
    if (!regex) return alert("Please enter a regex!");

    try {
        // 1. Preprocess & Postfix
        const formatted = addConcatSymbols(regex);
        const postfix = infixToPostfix(formatted);

        // 2. Build NFA (Thompson's)
        const nfaGraph = buildNFAFromPostfix(postfix);
        let machineConfig = graphToConfig(nfaGraph);

        // 3. Handle DFA Conversion if checked
        const isDfa = document.getElementById('dfaToggle').checked;

        if (isDfa) {
            log(`Generating NFA... (${machineConfig.states.length} states)`);
            machineConfig = convertNFAtoDFA(machineConfig);
            log(`Converted to DFA... (${machineConfig.states.length} states)`);
            document.getElementById('mode-badge').innerText = "DFA";
        } else {
            document.getElementById('mode-badge').innerText = "NFA";
        }

        // 4. Update Global Config
        config = machineConfig;

        // 5. Visualize
        setupVisualization();

        // UI Switch
        document.getElementById('config-step').style.display = 'none';
        document.getElementById('rules-step').style.display = 'none';
        document.getElementById('run-step').style.display = 'block';

        log(`Successfully compiled: /${regex}/`);

    } catch (e) {
        alert("Invalid Regex: " + e.message);
        console.error(e);
    }
}

// --- NFA to DFA Conversion Logic ---
function convertNFAtoDFA(nfaConfig) {

    // Helper: Epsilon Closure for a SET of states
    function getSetClosure(states, transitions) {
        let stack = Array.from(states);
        let closure = new Set(states);
        while (stack.length) {
            let u = stack.pop();
            const targets = transitions[`${u}|${EPSILON_KEY}`] || [];
            targets.forEach(v => {
                if (!closure.has(v)) {
                    closure.add(v);
                    stack.push(v);
                }
            });
        }
        return closure;
    }

    // 1. Start State = Closure of NFA Start
    const startSet = getSetClosure(new Set([nfaConfig.start]), nfaConfig.transitions);
    const startKey = Array.from(startSet).sort().join(',');

    // Mapping: "q0,q1" -> "q0" (DFA name)
    const dfaMap = {};
    dfaMap[startKey] = "q0";

    let dfaCounter = 1;
    const queue = [startSet];
    const visited = new Set([startKey]);

    const dfaTrans = {};
    const dfaAccept = [];

    // 2. Process Queue
    while (queue.length > 0) {
        const currentSet = queue.shift();
        const currentKey = Array.from(currentSet).sort().join(',');
        const dfaNodeName = dfaMap[currentKey];

        // Check Accept Status
        if (Array.from(currentSet).some(s => nfaConfig.accept.includes(s))) {
            if (!dfaAccept.includes(dfaNodeName)) dfaAccept.push(dfaNodeName);
        }

        // For every alphabet char (DFA has no epsilon transitions)
        nfaConfig.alphabet.forEach(char => {
            let nextSet = new Set();

            // Move
            currentSet.forEach(nfaState => {
                const targets = nfaConfig.transitions[`${nfaState}|${char}`] || [];
                targets.forEach(t => nextSet.add(t));
            });

            // Closure
            nextSet = getSetClosure(nextSet, nfaConfig.transitions);

            if (nextSet.size > 0) {
                const nextKey = Array.from(nextSet).sort().join(',');

                // New DFA State?
                if (!visited.has(nextKey)) {
                    visited.add(nextKey);
                    dfaMap[nextKey] = "q" + (dfaCounter++);
                    queue.push(nextSet);
                }

                // Add Transition
                const targetName = dfaMap[nextKey];
                const key = `${dfaNodeName}|${char}`;
                dfaTrans[key] = [targetName];
            }
        });
    }

    return {
        states: Object.values(dfaMap),
        alphabet: nfaConfig.alphabet,
        start: "q0",
        accept: dfaAccept,
        transitions: dfaTrans
    };
}

// --- Regex Parsing Helpers ---
function addConcatSymbols(regex) {
    let output = "";
    const operators = ['|', '*', ')'];
    for (let i = 0; i < regex.length; i++) {
        const c1 = regex[i];
        output += c1;
        if (i + 1 < regex.length) {
            const c2 = regex[i + 1];
            const isC1Op = (c1 === '(' || c1 === '|');
            const isC2Op = (operators.includes(c2));
            if (!isC1Op && !isC2Op) output += '.';
        }
    }
    return output;
}

function infixToPostfix(regex) {
    let output = "";
    let stack = [];
    const precedence = {
        '*': 3,
        '.': 2,
        '|': 1,
        '(': 0
    };

    for (let char of regex) {
        if (/[a-zA-Z0-9]/.test(char)) output += char;
        else if (char === '(') stack.push(char);
        else if (char === ')') {
            while (stack.length && stack[stack.length - 1] !== '(') output += stack.pop();
            stack.pop();
        } else {
            while (stack.length && precedence[stack[stack.length - 1]] >= precedence[char])
                output += stack.pop();
            stack.push(char);
        }
    }
    while (stack.length) output += stack.pop();
    return output;
}

// --- Thompson's Construction ---
let stateCounter = 0;

function newState() {
    return 'q' + (stateCounter++);
} // Changed to 'q'

function buildNFAFromPostfix(postfix) {
    stateCounter = 0;
    let stack = [];

    for (let char of postfix) {
        if (/[a-zA-Z0-9]/.test(char)) {
            const start = newState(),
                end = newState();
            stack.push({
                start,
                end,
                transitions: [{
                    from: start,
                    to: end,
                    char
                }]
            });
        } else if (char === '.') {
            const n2 = stack.pop(),
                n1 = stack.pop();
            n1.transitions.push({
                from: n1.end,
                to: n2.start,
                char: EPSILON
            });
            stack.push({
                start: n1.start,
                end: n2.end,
                transitions: [...n1.transitions, ...n2.transitions]
            });
        } else if (char === '|') {
            const n2 = stack.pop(),
                n1 = stack.pop();
            const start = newState(),
                end = newState();
            const newTrans = [{
                from: start,
                to: n1.start,
                char: EPSILON
            }, {
                from: start,
                to: n2.start,
                char: EPSILON
            }, {
                from: n1.end,
                to: end,
                char: EPSILON
            }, {
                from: n2.end,
                to: end,
                char: EPSILON
            }];
            stack.push({
                start,
                end,
                transitions: [...n1.transitions, ...n2.transitions, ...newTrans]
            });
        } else if (char === '*') {
            const n1 = stack.pop(),
                start = newState(),
                end = newState();
            const newTrans = [{
                from: start,
                to: n1.start,
                char: EPSILON
            }, {
                from: start,
                to: end,
                char: EPSILON
            }, {
                from: n1.end,
                to: n1.start,
                char: EPSILON
            }, {
                from: n1.end,
                to: end,
                char: EPSILON
            }];
            stack.push({
                start,
                end,
                transitions: [...n1.transitions, ...newTrans]
            });
        }
    }
    return stack[0];
}

function graphToConfig(nfa) {
    const allStates = new Set();
    const allChars = new Set();
    const transitions = {};

    nfa.transitions.forEach(t => {
        allStates.add(t.from);
        allStates.add(t.to);
        if (t.char !== EPSILON) allChars.add(t.char);

        const key = t.char === EPSILON ? `${t.from}|${EPSILON_KEY}` : `${t.from}|${t.char}`;
        if (!transitions[key]) transitions[key] = [];
        transitions[key].push(t.to);
    });

    return {
        states: Array.from(allStates),
        alphabet: Array.from(allChars),
        start: nfa.start,
        accept: [nfa.end],
        transitions: transitions
    };
}

// ==========================================
//      PART 2: MANUAL UI & DRAWING
// ==========================================

function initializeManualMachine() {
    const sInput = document.getElementById('statesInput').value;
    const aInput = document.getElementById('alphabetInput').value;

    config.states = sInput.split(',').map(s => s.trim()).filter(s => s);
    config.alphabet = aInput.split(',').map(s => s.trim()).filter(s => s);
    config.start = document.getElementById('startStateInput').value.trim();
    config.accept = document.getElementById('acceptStatesInput').value.split(',').map(s => s.trim());

    generateTransitionTable();
    document.getElementById('config-step').style.display = 'none';
    document.getElementById('rules-step').style.display = 'block';
}

function generateTransitionTable() {
    const container = document.getElementById('transition-inputs');
    let html = '<table style="width:100%; border-collapse:collapse;"><tr><th>From</th>';
    config.alphabet.forEach(c => html += `<th>${c}</th>`);
    html += `<th style="color:var(--primary)">${EPSILON}</th></tr>`;

    config.states.forEach(state => {
        html += `<tr><td><b>${state}</b></td>`;
        config.alphabet.forEach(char => {
            html += `<td><input type="text" id="trans-${state}-${char}" placeholder="Next q" style="width:90%"></td>`;
        });
        html += `<td><input type="text" id="trans-${state}-${EPSILON_KEY}" placeholder="Next q" style="width:90%; border-color:var(--primary)"></td></tr>`;
    });
    container.innerHTML = html + '</table>';
}

function saveTransitions() {
    config.transitions = {};
    config.states.forEach(state => {
        config.alphabet.forEach(char => {
            const val = document.getElementById(`trans-${state}-${char}`).value;
            if (val) config.transitions[`${state}|${char}`] = val.split(',').map(s => s.trim());
        });
        const epsVal = document.getElementById(`trans-${state}-${EPSILON_KEY}`).value;
        if (epsVal) config.transitions[`${state}|${EPSILON_KEY}`] = epsVal.split(',').map(s => s.trim());
    });

    document.getElementById('mode-badge').innerText = "Manual";
    setupVisualization();
    document.getElementById('rules-step').style.display = 'none';
    document.getElementById('run-step').style.display = 'block';
}

function resetConfig() {
    location.reload();
}

function setupVisualization() {
    allNodes.clear();
    allEdges.clear();

    // Nodes
    config.states.forEach(state => {
        allNodes.add({
            id: state,
            label: state,
            shape: 'circle',
            color: {
                background: NODE_COLOR,
                border: config.accept.includes(state) ? ACCEPT_BORDER : '#94a3b8',
                highlight: {
                    background: ACTIVE_COLOR,
                    border: ACTIVE_COLOR
                }
            },
            borderWidth: config.accept.includes(state) ? 4 : 2,
            font: {
                size: 16
            }
        });
    });

    // Mark Start
    const startNode = allNodes.get(config.start);
    if (startNode) {
        startNode.label = "▶ " + startNode.label;
        allNodes.update(startNode);
    }

    // Edges
    for (const key in config.transitions) {
        const [from, rawChar] = key.split('|');
        const char = rawChar === EPSILON_KEY ? EPSILON : rawChar;
        config.transitions[key].forEach(to => {
            const existing = allEdges.get().find(e => e.from === from && e.to === to);
            if (existing) {
                allEdges.update({
                    id: existing.id,
                    label: existing.label + ", " + char
                });
            } else {
                allEdges.add({
                    from: from,
                    to: to,
                    label: char,
                    arrows: 'to',
                    color: {
                        color: char === EPSILON ? '#fbbf24' : '#64748b'
                    },
                    dashes: char === EPSILON
                });
            }
        });
    }

    const container = document.getElementById('visualization-area');
    const options = {
        nodes: {
            fixed: {
                x: false,
                y: false
            }
        },
        edges: {
            smooth: {
                type: 'cubicBezier',
                forceDirection: 'horizontal',
                roundness: 0.4
            }
        },
        layout: {
            hierarchical: {
                enabled: true,
                direction: 'LR',
                sortMethod: 'directed',
                levelSeparation: 150,
                nodeSpacing: 100
            }
        },
        physics: {
            enabled: false
        }
    };

    if (network) network.destroy();
    network = new vis.Network(container, {
        nodes: allNodes,
        edges: allEdges
    }, options);
}

// ==========================================
//      PART 3: SIMULATION
// ==========================================

function getEpsilonClosure(activeStates) {
    let stack = Array.from(activeStates);
    let closure = new Set(activeStates);
    while (stack.length) {
        let u = stack.pop();
        let targets = config.transitions[`${u}|${EPSILON_KEY}`] || [];
        targets.forEach(v => {
            if (!closure.has(v)) {
                closure.add(v);
                stack.push(v);
            }
        });
    }
    return closure;
}

function log(msg, type = '') {
    const d = document.getElementById('log');
    d.innerHTML += `<div style="color:${type==='err'?'#ef4444':type==='success'?'#22c55e':'#e2e8f0'}">${msg}</div>`;
    d.scrollTop = d.scrollHeight;
}

async function runSimulation() {
    const input = document.getElementById('testString').value;
    const logDiv = document.getElementById('log');
    logDiv.innerHTML = "--- Starting Simulation ---\n";

    // Reset colors
    allNodes.update(config.states.map(s => ({
        id: s,
        color: {
            background: NODE_COLOR,
            border: config.accept.includes(s) ? ACCEPT_BORDER : '#94a3b8'
        }
    })));

    let currentStates = new Set([config.start]);
    currentStates = getEpsilonClosure(currentStates);
    updateHighlights(currentStates);
    log(`Start: {${Array.from(currentStates).join(',')}}`);

    for (let char of input) {
        await new Promise(r => setTimeout(r, 1000));

        let nextStates = new Set();
        for (let s of currentStates) {
            let targets = config.transitions[`${s}|${char}`] || [];
            targets.forEach(t => nextStates.add(t));
        }

        if (nextStates.size === 0) log(`Input '${char}': Dead end (Trap)`, 'err');
        else log(`Input '${char}': Moved to {${Array.from(nextStates).join(',')}}`);

        nextStates = getEpsilonClosure(nextStates);
        currentStates = nextStates;
        updateHighlights(currentStates);
    }

    await new Promise(r => setTimeout(r, 500));
    const isAccepted = Array.from(currentStates).some(s => config.accept.includes(s));
    if (isAccepted) log("✅ ACCEPTED", 'success');
    else log("❌ REJECTED", 'err');
}

function updateHighlights(states) {
    allNodes.forEach(n => {
        const isActive = states.has(n.id);
        const isAccept = config.accept.includes(n.id);
        allNodes.update({
            id: n.id,
            color: {
                background: isActive ? ACTIVE_COLOR : NODE_COLOR,
                border: isActive ? ACTIVE_COLOR : (isAccept ? ACCEPT_BORDER : '#94a3b8')
            }
        });
    });
}