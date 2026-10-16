/* ==========================================================================
   PakCFacts script

   How this file is organized
     1. Helpers          small tools used by everything below
     2. Mobile menu      works on every page
     3. Hardware page    DATA: HARDWARE        + search and filter
     4. Troubleshooting  DATA: GUIDES          + expandable guide list
     5. Diagnose page    DATA: DECISION_TREE   + question-by-question tool
     6. Maintenance page DATA: CHECKLIST_ITEMS + checklist with progress bar
     7. Start-up         runs each feature

   TO CHANGE CONTENT: edit the DATA blocks (the lists in capital letters).
   You do not need to touch the code underneath them.

   Every feature looks for its own elements on the page (for example
   "hardwareList"). If the element is not there, that feature does nothing,
   so one script can safely be used by all pages.
   ========================================================================== */


/* ==========================================================================
   1. HELPERS
   ========================================================================== */

// Shortcut: byId('menuButton') finds the element with id="menuButton".
// It gives null when the page does not have that element.
function byId(id) {
  return document.getElementById(id);
}

/* ==========================================================================
   THEME TOGGLE (dark/light mode)
   Runs on every page. Reads saved preference from localStorage,
   falls back to system preference, applies to <html> element.
   ========================================================================== */
const THEME_STORAGE_KEY = 'pakcfacts-theme';

function setupThemeToggle() {
  const toggleButton = byId('themeToggle');
  if (!toggleButton) return;

  // Get saved theme or detect system preference
  function getInitialTheme() {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') return saved;
    } catch (e) { /* ignore localStorage errors */ }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  // Apply theme to document
  function applyTheme(theme) {
    document.documentElement.classList.toggle('dark-mode', theme === 'dark');
    toggleButton.textContent = theme === 'dark' ? '☀️' : '🌙';
    toggleButton.setAttribute('aria-pressed', theme === 'dark');
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (e) { /* ignore localStorage errors */ }
  }

  // Initialize
  applyTheme(getInitialTheme());

  // Toggle on click
  toggleButton.addEventListener('click', () => {
    const isDark = document.documentElement.classList.contains('dark-mode');
    applyTheme(isDark ? 'light' : 'dark');
  });

  // Listen for system preference changes (only if user hasn't set a preference)
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (!saved) {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    } catch (e) { /* ignore */ }
  });
}

/* ==========================================================================
   BACK TO TOP BUTTON
   Shows/hides based on scroll position and scrolls to top when clicked
   ========================================================================== */
function setupBackToTop() {
  const backToTopButton = byId('backToTop');
  if (!backToTopButton) return;

  // Show/hide button based on scroll position
  function toggleBackToTop() {
    if (window.scrollY > 300) {
      backToTopButton.classList.add('visible');
    } else {
      backToTopButton.classList.remove('visible');
    }
  }

  // Scroll to top when clicked
  backToTopButton.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });

  // Initial check and scroll event listener
  toggleBackToTop();
  window.addEventListener('scroll', () => {
    // Throttle scroll events for performance
    if (!window.scrollTimeout) {
      window.scrollTimeout = setTimeout(() => {
        toggleBackToTop();
        window.scrollTimeout = null;
      }, 100);
    }
  });
}

// Makes text safe to put inside HTML (so a "<" typed by someone is shown as text instead of
// being treated as code).
function escapeHtml(text) {
  const replacements = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
  return String(text).replace(/[&<>"]/g, character => replacements[character]);
}

// Turns a list of texts into HTML:  <ul><li>...</li><li>...</li></ul>
function bulletListHtml(items) {
  const listItems = items.map(item => '<li>' + escapeHtml(item) + '</li>').join('');
  return '<ul>' + listItems + '</ul>';
}

// Same, but numbered:  <ol><li>...</li></ol>
function numberedListHtml(items) {
  const listItems = items.map(item => '<li>' + escapeHtml(item) + '</li>').join('');
  return '<ol>' + listItems + '</ol>';
}


/* ==========================================================================
   2. MOBILE MENU
   On small screens the links are hidden. The Menu button adds or removes
   the "open" class on the nav, and style.css shows the links when it is open.
   ========================================================================== */

function setupMobileMenu() {
  const menuButton = byId('menuButton');
  if (!menuButton) return;

  menuButton.addEventListener('click', () => {
    const isOpen = byId('nav').classList.toggle('open');
    menuButton.setAttribute('aria-expanded', isOpen);   // for screen readers
  });
}


/* ==========================================================================
   3. HARDWARE PAGE (hardware.html)
   ========================================================================== */

/* ---- DATA: one block per component ----
   To add a component, copy one { ... }, block, paste it in the list and
   change the text. "category" must match one of the options in the
   Category drop-down in hardware.html (the search also looks at all fields). */
const HARDWARE = [
  {
    name: 'CPU: Central Processing Unit',
    category: 'Processing',
    icon: '🧠',
    purpose: 'Runs program instructions.',
    location: 'Under the cooler, in the motherboard socket.',
    howItWorks: 'Fetches and executes instructions at billions of cycles per second.',
    failureSigns: 'Random freezes, overheating, no boot.',
    troubleshooting: 'Check cooler contact and fan; check temperatures.',
    compatibility: 'Must match the motherboard socket and chipset. Hold by the edges; do not touch pins.',
  },
  {
    name: 'Motherboard',
    category: 'Connectivity and Housing',
    icon: '🟩',
    purpose: 'Connects and lets all components communicate.',
    location: 'Mounted on the back or side of the case.',
    howItWorks: 'Traces on the board carry data and power between sockets and slots.',
    failureSigns: 'No power, no display, ports not working, swollen capacitors.',
    troubleshooting: 'Check connectors, standoffs and CMOS battery; reseat parts.',
    compatibility: 'Form factor (ATX, mATX) must fit the case. Socket and RAM type must match the parts.',
  },
  {
    name: 'RAM: Random Access Memory',
    category: 'Memory and Storage',
    icon: '🧩',
    purpose: 'Temporary fast memory for open programs.',
    location: 'In the long slots next to the CPU.',
    howItWorks: 'Holds data the CPU needs right now; it is cleared when power is off.',
    failureSigns: 'Beeps at start, no display, crashes, slow multitasking.',
    troubleshooting: 'Reseat modules; test one stick at a time.',
    compatibility: 'Match the type (DDR4/DDR5) and slot layout. Handle by the edges.',
  },
  {
    name: 'HDD: Hard Disk Drive',
    category: 'Memory and Storage',
    icon: '💽',
    purpose: 'Long-term storage on spinning platters.',
    location: 'In a drive bay, connected by SATA and power cables.',
    howItWorks: 'A read/write head moves over magnetic platters.',
    failureSigns: 'Clicking or grinding, slow loading, drive not detected.',
    troubleshooting: 'Back up data at once; check cables; stop using a clicking drive.',
    compatibility: 'Avoid drops and vibration, especially while running.',
  },
  {
    name: 'SSD: Solid State Drive',
    category: 'Memory and Storage',
    icon: '⚡',
    purpose: 'Fast storage with no moving parts.',
    location: 'In a drive bay or an M.2 slot on the motherboard.',
    howItWorks: 'Stores data in flash memory chips.',
    failureSigns: 'Drive disappears, file errors, very slow writes.',
    troubleshooting: 'Check the connection and BIOS detection; update firmware.',
    compatibility: 'Check the interface (SATA or M.2 NVMe) before buying.',
  },
  {
    name: 'PSU: Power Supply Unit',
    category: 'Power and Cooling',
    icon: '🔌',
    purpose: 'Converts wall power to low voltages for components.',
    location: 'Usually at the bottom or top rear of the case.',
    howItWorks: 'Steps down and rectifies AC power into DC rails.',
    failureSigns: 'Will not start, random shutdowns, burning smell.',
    troubleshooting: 'Check the power cord, wall outlet and switch only.',
    compatibility: 'Never open a PSU. Match wattage and connectors to the parts.',
  },
  {
    name: 'GPU: Graphics Processing Unit',
    category: 'Processing',
    icon: '🎮',
    purpose: 'Creates the images shown on the monitor.',
    location: 'In the PCIe slot, or built into the CPU.',
    howItWorks: 'Many small cores process graphics in parallel.',
    failureSigns: 'Artifacts on screen, no display, loud fan, crashes in games.',
    troubleshooting: 'Reseat the card; check power cables and drivers.',
    compatibility: 'Check slot, card length and PSU connectors and wattage.',
  },
  {
    name: 'CPU cooler and heatsink',
    category: 'Power and Cooling',
    icon: '❄️',
    purpose: 'Removes heat from the CPU.',
    location: 'Mounted on top of the CPU.',
    howItWorks: 'Metal fins draw heat away and a fan blows it off.',
    failureSigns: 'High temperatures, loud fan, throttling.',
    troubleshooting: 'Remove dust; confirm the fan spins and the cooler is firmly seated.',
    compatibility: 'Must fit the socket and case height. Thermal paste is needed between CPU and cooler.',
  },
  {
    name: 'Case fans',
    category: 'Power and Cooling',
    icon: '🌀',
    purpose: 'Move air through the case.',
    location: 'Front, rear, top or side of the case.',
    howItWorks: 'Spinning blades push air in or out.',
    failureSigns: 'Grinding or rattling, not spinning, rising temperatures.',
    troubleshooting: 'Clean dust; check the fan header connection.',
    compatibility: 'Check the airflow direction and the 3-pin or 4-pin connector.',
  },
  {
    name: 'NIC: Network Interface Card',
    category: 'Connectivity and Housing',
    icon: '🌐',
    purpose: 'Connects the computer to a network.',
    location: 'Built into the motherboard, or in an expansion slot.',
    howItWorks: 'Converts data into signals for the cable or wireless network.',
    failureSigns: 'No network, dropped connection, no link light.',
    troubleshooting: 'Test another cable and port; check drivers.',
    compatibility: 'Check the slot type and driver support.',
  },
  {
    name: 'CMOS battery',
    category: 'Connectivity and Housing',
    icon: '🔋',
    purpose: 'Keeps BIOS settings and the clock running.',
    location: 'A coin cell on the motherboard.',
    howItWorks: 'Supplies small power when the computer is off.',
    failureSigns: 'Wrong date and time, BIOS settings reset.',
    troubleshooting: 'Replace with the same type after shutting down and unplugging.',
    compatibility: 'Usually a CR2032. Dispose of it properly.',
  },
  {
    name: 'Computer case',
    category: 'Connectivity and Housing',
    icon: '🗄️',
    purpose: 'Holds and protects all internal parts.',
    location: 'The outer enclosure.',
    howItWorks: 'Provides mounting points, airflow paths and shielding.',
    failureSigns: 'Dust buildup, poor airflow, loose panels.',
    troubleshooting: 'Clean vents and check fans.',
    compatibility: 'Confirm it fits the motherboard, GPU and cooler sizes.',
  },
];

// Builds the HTML card for one component.
function hardwareCardHtml(part) {
  return `
    <article class="card">
      <div class="icon" role="img" aria-label="Icon for ${escapeHtml(part.name)}">${part.icon}</div>
      <h2>${escapeHtml(part.name)}</h2>
      <p><b>Function:</b> ${escapeHtml(part.purpose)}</p>
      <p><b>Location:</b> ${escapeHtml(part.location)}</p>
      <p><b>How it works:</b> ${escapeHtml(part.howItWorks)}</p>
      <p><b>Failure signs:</b> ${escapeHtml(part.failureSigns)}</p>
      <p><b>Basic troubleshooting:</b> ${escapeHtml(part.troubleshooting)}</p>
      <p><b>Compatibility and handling:</b> ${escapeHtml(part.compatibility)}</p>
    </article>`;
}

function setupHardwarePage() {
  const list = byId('hardwareList');
  if (!list) return;                          // not the hardware page

  const searchBox      = byId('searchBox');
  const categoryFilter = byId('categoryFilter');
  const noResults      = byId('noResults');
  const resultCount    = byId('resultCount');

  // Works out which components match the search and category, then redraws.
  function showMatchingParts() {
    const keyword  = searchBox.value.trim().toLowerCase();
    const category = categoryFilter.value;

    const matches = HARDWARE.filter(part => {
      const categoryMatches = (category === 'all') || (part.category === category);
      const allText = Object.values(part).join(' ').toLowerCase();   // every field
      const keywordMatches = !keyword || allText.includes(keyword);
      return categoryMatches && keywordMatches;
    });

    list.innerHTML = matches.map(hardwareCardHtml).join('');
    noResults.hidden = matches.length > 0;                  // show message if none
    resultCount.textContent = matches.length + ' of ' + HARDWARE.length + ' components shown';
  }

  searchBox.addEventListener('input', showMatchingParts);       // while typing
  categoryFilter.addEventListener('change', showMatchingParts); // when drop-down changes
  showMatchingParts();                                          // first draw
}


/* ==========================================================================
   4. TROUBLESHOOTING PAGE (troubleshooting.html)
   ========================================================================== */

/* ---- DATA: one block per guide ----
   title              heading you click to open the guide
   symptom            what the person sees
   causes             list of possible causes
   initialChecks      safe things to check first
   steps              numbered troubleshooting steps
   expected           what should happen if the fix worked
   contactTechnician  when to stop and get help */
const GUIDES = [
  {
    title: 'Computer will not power on',
    symptom: 'Nothing happens when you press the power button.',
    causes: [
      'Loose or faulty power cable',
      'Wall outlet or power strip problem',
      'PSU switch off or PSU failure',
      'Loose front panel connector',
    ],
    initialChecks: [
      'Shut down and unplug.',
      'Make sure the PSU switch is on (I).',
    ],
    steps: [
      'Try a different wall outlet.',
      'Replace the power cable with a known good one.',
      'Check that the power button cable is attached to the motherboard header.',
      'Unplug extra USB devices and try again.',
      'Check that the 24-pin motherboard power connector is firmly seated.',
    ],
    expected: 'Fans and lights should start within a second of pressing the button.',
    contactTechnician: 'No response after these steps, or you smell burning. Never open the PSU.',
  },
  {
    title: 'Computer powers on but shows no display',
    symptom: 'Fans spin, but the screen stays black.',
    causes: [
      'Loose monitor cable or wrong input',
      'RAM or GPU not seated well',
      'Faulty monitor or cable',
    ],
    initialChecks: [
      'Check the monitor is on and the right input is selected.',
    ],
    steps: [
      'Reconnect both ends of the video cable.',
      'Try a different cable or monitor.',
      'Shut down, unplug and reseat the RAM.',
      'Reseat the graphics card, then try the motherboard video port.',
    ],
    expected: 'Logo or BIOS screen appears after a short wait.',
    contactTechnician: 'Still no display, or you see damage on the board.',
  },
  {
    title: 'Computer overheats',
    symptom: 'Fans run loud, the case feels hot and speed drops.',
    causes: [
      'Dust buildup',
      'Blocked vents',
      'Failed fan',
      'Dried thermal paste',
    ],
    initialChecks: [
      'Check vents are clear.',
      'Check fans spin.',
    ],
    steps: [
      'Shut down and unplug.',
      'Move the computer to a ventilated spot.',
      'Clean dust with short bursts of compressed air, holding fans still.',
      'Check the CPU cooler is firmly mounted.',
      'Restart and watch the temperatures.',
    ],
    expected: 'Temperatures drop and fan noise decreases.',
    contactTechnician: 'Temperatures stay high or the cooler needs removal and you are unsure how.',
  },
  {
    title: 'Computer unexpectedly shuts down',
    symptom: 'The computer turns off with no warning.',
    causes: [
      'Overheating',
      'Weak or failing PSU',
      'Loose power connection',
      'Failing RAM',
    ],
    initialChecks: [
      'Note when it happens (idle, gaming, heavy load).',
    ],
    steps: [
      'Check for overheating using the previous guide.',
      'Check the power cable and outlet.',
      'Shut down, unplug and reseat the power connectors.',
      'Test with one RAM stick at a time.',
    ],
    expected: 'Shutdowns stop after cleaning or reseating.',
    contactTechnician: 'It keeps happening. A PSU fault needs a technician.',
  },
  {
    title: 'Storage drive is not detected',
    symptom: 'The drive is missing in the operating system or BIOS.',
    causes: [
      'Loose SATA or power cable',
      'Drive failure',
      'Unformatted drive',
    ],
    initialChecks: [
      'Back up what you can first.',
    ],
    steps: [
      'Shut down and unplug, then reseat the SATA and power cables.',
      'Try another SATA port or cable.',
      'Check if the BIOS or UEFI lists the drive.',
      'If the BIOS sees it but the system does not, check Disk Management for an unformatted drive.',
    ],
    expected: 'The drive appears in the BIOS and operating system.',
    contactTechnician: 'The drive clicks, grinds or has important data. Stop using it.',
  },
  {
    title: 'RAM-related boot problems',
    symptom: 'Beeps, a blank screen or repeated restarts at startup.',
    causes: [
      'RAM not seated',
      'Dirty contacts',
      'Incompatible or faulty module',
    ],
    initialChecks: [
      'Shut down and unplug. Touch bare metal.',
    ],
    steps: [
      'Open the slot clips and remove the RAM.',
      'Reseat each module until the clips click.',
      'Try one module at a time in different slots.',
      'Confirm the RAM type matches the board.',
    ],
    expected: 'The system boots with a good module.',
    contactTechnician: 'No module works.',
  },
  {
    title: 'Fan makes unusual noise',
    symptom: 'Grinding, rattling or loud whirring.',
    causes: [
      'Dust',
      'Loose screws or cables touching blades',
      'Worn fan bearing',
    ],
    initialChecks: [
      'Find which fan makes the noise.',
    ],
    steps: [
      'Shut down and unplug.',
      'Clean the fan with short bursts of compressed air.',
      'Move any cables away from the blades.',
      'Tighten the fan screws.',
      'Replace the fan if the noise continues.',
    ],
    expected: 'The fan runs quietly and smoothly.',
    contactTechnician: 'Noise comes from a drive or the PSU. Do not open the PSU.',
  },
  {
    title: 'USB device is not recognized',
    symptom: 'The device does not work or appears with an error.',
    causes: [
      'Loose connection',
      'Bad cable or port',
      'Driver problem',
    ],
    initialChecks: [
      'Try the device on another computer.',
    ],
    steps: [
      'Unplug and reconnect.',
      'Try another USB port, using a rear port on a desktop.',
      'Try a different cable.',
      'Restart and check for driver updates.',
    ],
    expected: 'The device is detected and works.',
    contactTechnician: 'Several devices fail on every port.',
  },
];

function guideHtml(guide, index) {
  const openAttribute = (index === 0) ? ' open' : '';       // first guide starts open
  return `
    <details class="card"${openAttribute}>
      <summary>${escapeHtml(guide.title)}</summary>
      <h3>Symptom</h3>
      <p>${escapeHtml(guide.symptom)}</p>
      <h3>Possible causes</h3>
      ${bulletListHtml(guide.causes)}
      <h3>Safe initial checks</h3>
      ${bulletListHtml(guide.initialChecks)}
      <h3>Troubleshooting steps</h3>
      ${numberedListHtml(guide.steps)}
      <h3>Expected observations</h3>
      <p>${escapeHtml(guide.expected)}</p>
      <h3>When to stop and contact a technician</h3>
      <p>${escapeHtml(guide.contactTechnician)}</p>
    </details>`;
}

function setupTroubleshootingPage() {
  const list = byId('guideList');
  if (!list) return;                          // not the troubleshooting page

  list.innerHTML = GUIDES.map(guideHtml).join('');
}


/* ==========================================================================
   5. DIAGNOSE PAGE (diagnostics.html)
   ========================================================================== */

/* ---- DATA: the decision tree ----
   The tree is a set of named steps. Each step is one of two kinds:

   A QUESTION has "question" and "options". Each option has a button label
   and "next", the name of the step to go to when that button is pressed:
       askExample: {
         question: 'Is it plugged in?',
         options: [
           { label: 'Yes', next: 'resultA' },
           { label: 'No',  next: 'resultB' },
         ],
       },

   A RESULT has "causes" and "steps" (and no question):
       resultA: {
         causes: ['Possible cause 1', 'Possible cause 2'],
         steps:  ['Do this first.', 'Then do this.'],
       },

   The first question shown is always the one named "start".
   Every "next" must match the name of another step exactly. */
const DECISION_TREE = {

  // ----- Start -----
  start: {
    question: 'What problem are you seeing?',
    options: [
      { label: 'No power', next: 'askPower' },
      { label: 'No display', next: 'askDisplay' },
      { label: 'Overheating', next: 'askHeat' },
      { label: 'Slow computer', next: 'askSlow' },
      { label: 'Storage not detected', next: 'askStorage' },
      { label: 'Unusual noise', next: 'askNoise' },
    ],
  },

  // ----- No power -----
  askPower: {
    question: 'When you press the power button, do any lights or fans start?',
    options: [
      { label: 'Yes, something lights or spins', next: 'resultPowerPartial' },
      { label: 'No, nothing at all', next: 'resultPowerNone' },
    ],
  },

  resultPowerPartial: {
    causes: [
      'Loose 24-pin or CPU power connector',
      'RAM not seated',
      'Faulty PSU',
    ],
    steps: [
      'Shut down and unplug.',
      'Reseat RAM and the main power connectors.',
      'Disconnect extra devices and try again.',
      'If it still fails, contact a technician (do not open the PSU).',
    ],
  },

  resultPowerNone: {
    causes: [
      'Power cable or outlet problem',
      'PSU switch off',
      'Failed PSU or loose power button cable',
    ],
    steps: [
      'Try another outlet and cable.',
      'Check the PSU switch is on.',
      'Check the front panel power button connector.',
      'If it still fails, contact a technician.',
    ],
  },

  // ----- No display -----
  askDisplay: {
    question: 'Do the fans spin when the computer is on?',
    options: [
      { label: 'Yes, fans spin', next: 'askBeeps' },
      { label: 'No', next: 'resultPowerNone' },
    ],
  },

  askBeeps: {
    question: 'Do you hear beeps at startup?',
    options: [
      { label: 'Yes, beeps', next: 'resultBeeps' },
      { label: 'No beeps', next: 'resultNoBeeps' },
    ],
  },

  resultBeeps: {
    causes: [
      'RAM not seated',
      'RAM or GPU problem (beep codes vary by motherboard)',
    ],
    steps: [
      'Shut down, unplug, reseat the RAM and graphics card.',
      'Look up your motherboard manual for the beep code.',
      'Try one RAM stick at a time.',
    ],
  },

  resultNoBeeps: {
    causes: [
      'Loose monitor cable or wrong input',
      'Faulty monitor or cable',
      'GPU not seated',
    ],
    steps: [
      'Check the monitor input and cable.',
      'Try another cable or monitor.',
      'Reseat the GPU, or try the motherboard video port.',
    ],
  },

  // ----- Overheating -----
  askHeat: {
    question: 'When does it get hot?',
    options: [
      { label: 'Even when idle', next: 'resultHotIdle' },
      { label: 'Only under heavy use', next: 'resultHotUnderLoad' },
    ],
  },

  resultHotIdle: {
    causes: [
      'Fan not spinning',
      'Cooler loose or poor thermal contact',
      'Heavy dust',
    ],
    steps: [
      'Shut down and unplug.',
      'Check the CPU fan spins on startup.',
      'Clean dust and check the cooler is firmly mounted.',
      'If temperatures stay high, contact a technician.',
    ],
  },

  resultHotUnderLoad: {
    causes: [
      'Dust or blocked airflow',
      'Weak case airflow',
      'Dried thermal paste',
    ],
    steps: [
      'Clean dust and vents.',
      'Make sure fans move air in and out.',
      'Move the computer away from walls and heat.',
      'Consider a technician to reapply thermal paste.',
    ],
  },

  // ----- Slow computer -----
  askSlow: {
    question: 'When is the computer slow?',
    options: [
      { label: 'At startup or opening files', next: 'resultSlowStartup' },
      { label: 'With many programs open', next: 'resultSlowMultitask' },
      { label: 'After running a while (hot)', next: 'askHeat' },
    ],
  },

  resultSlowStartup: {
    causes: [
      'Old HDD or failing drive',
      'Drive nearly full',
      'Too many startup programs',
    ],
    steps: [
      'Back up important files.',
      'Free disk space and disable unneeded startup items.',
      'Consider replacing an HDD with an SSD.',
    ],
  },

  resultSlowMultitask: {
    causes: [
      'Not enough RAM',
      'Background programs',
    ],
    steps: [
      'Close unused programs.',
      'Check memory use in Task Manager.',
      'Consider adding compatible RAM.',
    ],
  },

  // ----- Storage not detected -----
  askStorage: {
    question: 'Is the drive listed in the BIOS or UEFI?',
    options: [
      { label: 'No', next: 'resultStorageNoBios' },
      { label: 'Yes, but not in the operating system', next: 'resultStorageNoOs' },
    ],
  },

  resultStorageNoBios: {
    causes: [
      'Loose SATA or power cable',
      'Failed drive or port',
    ],
    steps: [
      'Shut down, unplug, reseat the cables.',
      'Try another SATA port or cable.',
      'If the drive clicks, stop and contact a technician.',
    ],
  },

  resultStorageNoOs: {
    causes: [
      'Unformatted or unassigned drive',
      'Driver or file system issue',
    ],
    steps: [
      'Open Disk Management and look for the drive.',
      'Do not format it if it holds data you need.',
      'Ask a technician for help recovering data.',
    ],
  },

  // ----- Unusual noise -----
  askNoise: {
    question: 'Where does the noise come from?',
    options: [
      { label: 'A fan (whirring or rattling)', next: 'resultNoiseFan' },
      { label: 'The drive (clicking or grinding)', next: 'resultNoiseDrive' },
    ],
  },

  resultNoiseFan: {
    causes: [
      'Dust on fan blades',
      'Cable touching the fan',
      'Worn fan bearing',
    ],
    steps: [
      'Shut down and unplug.',
      'Clean the fan and move cables away.',
      'Replace the fan if noise continues.',
    ],
  },

  resultNoiseDrive: {
    causes: [
      'Failing HDD',
    ],
    steps: [
      'Back up important data now.',
      'Stop using the drive if possible.',
      'Contact a technician.',
    ],
  },
};

function setupDiagnosisPage() {
  const box = byId('diagnosisBox');
  if (!box) return;                           // not the diagnosis page

  const progressText  = byId('progressText');
  const backButton    = byId('backButton');
  const restartButton = byId('restartButton');

  let path = ['start'];       // names of the steps visited so far; the last one is on screen
  let stepsVisible = false;   // on a result: have the suggested steps been revealed yet?

  // Shows the current step: either a question with answer buttons or a result.
  function showCurrentStep() {
    const stepName = path[path.length - 1];
    const step = DECISION_TREE[stepName];

    backButton.disabled = (path.length === 1);              // nothing to go back to

    if (step.question) {
      showQuestion(step);
    } else {
      showResult(step);
    }
  }

  function showQuestion(step) {
    progressText.textContent = 'Question ' + path.length;

    const buttons = step.options.map((option, index) =>
      `<button class="answer-button outline" data-index="${index}">${escapeHtml(option.label)}</button>`
    ).join('');
    box.innerHTML = `<h2>${escapeHtml(step.question)}</h2>` + buttons;

    // When an answer is pressed, remember it and show the step it leads to.
    box.querySelectorAll('.answer-button').forEach(button => {
      button.addEventListener('click', () => {
        const chosenOption = step.options[button.dataset.index];
        path.push(chosenOption.next);
        stepsVisible = false;
        showCurrentStep();
      });
    });
  }

  function showResult(step) {
    progressText.textContent = 'Result';

    let html = '<h2>Possible causes</h2>' + bulletListHtml(step.causes);

    if (stepsVisible) {
      html += '<h2>Suggested steps</h2>' + numberedListHtml(step.steps)
            + '<p class="muted">This is a suggestion, not a definitive diagnosis.</p>';
    } else {
      html += '<button id="showStepsButton">View Suggested Steps</button>';
    }
    box.innerHTML = html;

    const showStepsButton = byId('showStepsButton');
    if (showStepsButton) {
      showStepsButton.addEventListener('click', () => {
        stepsVisible = true;
        showCurrentStep();
      });
    }
  }

  backButton.addEventListener('click', () => {
    if (path.length > 1) {
      path.pop();                             // forget the last step
      stepsVisible = false;
      showCurrentStep();
    }
  });

  restartButton.addEventListener('click', () => {
    path = ['start'];
    stepsVisible = false;
    showCurrentStep();
  });

  showCurrentStep();                          // first draw
}


/* ==========================================================================
   6. MAINTENANCE PAGE (maintenance.html)
   ========================================================================== */

/* ---- DATA: the checklist tasks (one line each) ----
   Note: ticked boxes are saved in the browser by task position. If you add,
   remove or reorder tasks, old saved ticks are ignored and the list starts
   fresh. */
const CHECKLIST_ITEMS = [
  'Shut down and unplug before any internal work',
  'Clean dust from vents and fans',
  'Check that all fans spin',
  'Inspect power and data cables',
  'Check that vents have free space',
  'Wipe the case outside with a dry cloth',
  'Check drive health and free space',
  'Update the operating system and drivers',
  'Back up important files',
  'Store spare parts in anti-static bags',
];

// Name used to save ticked boxes in the browser (localStorage).
// Keep it the same so people do not lose their saved progress.
const CHECKLIST_STORAGE_KEY = 'pakcfacts-ck';

function setupMaintenancePage() {
  const checklistBox  = byId('checklist');
  if (!checklistBox) return;                  // not the maintenance page

  const progressText  = byId('progressText');
  const progressBar   = byId('progressBar');
  const resetButton   = byId('resetButton');

  // ticked[i] is true when task number i is ticked.
  let ticked = CHECKLIST_ITEMS.map(() => false);

  // Load saved ticks. The browser may block storage, so this is wrapped in
  // try/catch: if it fails, the checklist still works until the page closes.
  try {
    const saved = JSON.parse(localStorage.getItem(CHECKLIST_STORAGE_KEY));
    if (Array.isArray(saved) && saved.length === CHECKLIST_ITEMS.length) {
      ticked = saved;
    }
  } catch (error) { /* ignore */ }

  function saveTicks() {
    try {
      localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(ticked));
    } catch (error) { /* ignore */ }
  }

  // Updates the "3 of 10 tasks completed" text and the progress bar.
  function updateProgress() {
    const doneCount = ticked.filter(Boolean).length;
    progressText.textContent = doneCount + ' of ' + CHECKLIST_ITEMS.length + ' tasks completed';
    progressBar.max = CHECKLIST_ITEMS.length;
    progressBar.value = doneCount;
  }

  // Draw the checkboxes.
  checklistBox.innerHTML = CHECKLIST_ITEMS.map((task, index) => {
    const checkedAttribute = ticked[index] ? ' checked' : '';
    return `<label class="checklist-item"><input type="checkbox" data-index="${index}"${checkedAttribute}> ${escapeHtml(task)}</label>`;
  }).join('');

  // When a box is ticked or unticked: remember it, save it, update progress.
  checklistBox.querySelectorAll('input').forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      ticked[checkbox.dataset.index] = checkbox.checked;
      saveTicks();
      updateProgress();
    });
  });

  // Reset button: untick everything.
  resetButton.addEventListener('click', () => {
    ticked = CHECKLIST_ITEMS.map(() => false);
    checklistBox.querySelectorAll('input').forEach(checkbox => { checkbox.checked = false; });
    saveTicks();
    updateProgress();
  });

  updateProgress();                           // first draw
}


/* ==========================================================================
   7. START-UP
   Runs every feature. Each one quietly does nothing if its page elements
   are missing.
   ========================================================================== */

setupThemeToggle();
setupBackToTop();
setupMobileMenu();
setupHardwarePage();
setupTroubleshootingPage();
setupDiagnosisPage();
setupMaintenancePage();
