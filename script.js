document.getElementById('year').textContent = new Date().getFullYear();

/* ---------- terminal boot sequence ---------- */
const body = document.getElementById('terminal-body');

const lines = [
  { type: 'cmd', text: 'whoami' },
  { type: 'out', text: 'Tayyab — Software Engineering student, Faisalabad, Pakistan' },
  { type: 'cmd', text: 'cat focus.txt' },
  { type: 'out', text: 'AI-assisted development · React & Node · Python & C++ · learning how LLMs are actually built' },
  { type: 'cmd', text: 'ls availability/' },
  { type: 'out', text: 'freelance-projects/  internships/  interesting-problems/', dim: true },
];

let lineIndex = 0;

function typeLine(el, text, speed, onDone){
  let i = 0;
  const cursor = document.createElement('span');
  cursor.className = 'term-cursor';
  el.appendChild(cursor);

  function step(){
    if (i < text.length){
      cursor.insertAdjacentText('beforebegin', text[i]);
      i++;
      setTimeout(step, speed);
    } else {
      cursor.remove();
      if (onDone) onDone();
    }
  }
  step();
}

function renderNextLine(){
  if (lineIndex >= lines.length){
    // leave a resting cursor on a fresh prompt line
    const restLine = document.createElement('div');
    restLine.className = 'term-line';
    const prompt = document.createElement('span');
    prompt.className = 'term-prompt';
    prompt.textContent = '$ ';
    restLine.appendChild(prompt);
    const cursor = document.createElement('span');
    cursor.className = 'term-cursor';
    restLine.appendChild(cursor);
    body.appendChild(restLine);
    return;
  }

  const line = lines[lineIndex];
  const row = document.createElement('div');
  row.className = 'term-line';

  if (line.type === 'cmd'){
    const prompt = document.createElement('span');
    prompt.className = 'term-prompt';
    prompt.textContent = '$ ';
    row.appendChild(prompt);
    body.appendChild(row);
    typeLine(row, line.text, 38, () => {
      lineIndex++;
      setTimeout(renderNextLine, 250);
    });
  } else {
    const out = document.createElement('span');
    out.className = 'term-out' + (line.dim ? ' dim' : '');
    row.appendChild(out);
    body.appendChild(row);
    typeLine(row, line.text, 12, () => {
      lineIndex++;
      setTimeout(renderNextLine, 350);
    });
  }
}

// respect reduced-motion: just print everything instantly
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (prefersReduced){
  lines.forEach(line => {
    const row = document.createElement('div');
    row.className = 'term-line';
    if (line.type === 'cmd'){
      row.innerHTML = `<span class="term-prompt">$ </span>${line.text}`;
    } else {
      row.innerHTML = `<span class="term-out${line.dim ? ' dim' : ''}">${line.text}</span>`;
    }
    body.appendChild(row);
  });
} else {
  renderNextLine();
}
