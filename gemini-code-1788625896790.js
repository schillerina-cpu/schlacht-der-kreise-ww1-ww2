// ==========================================
// 1. UNIT MANAGER KLASSE (Logik & Steuerung)
// ==========================================
class UnitManager {
  constructor() {
    this.units = [];          // Alle Soldaten im Spiel
    this.selectedUnits = [];  // Aktuell ausgewählte Einheiten
    this.groups = {};         // Truppengruppen (Strg + 1-9)
    this.controlledUnit = null; // Einzelne direkt gesteuerte Einheit
    
    // Hilfsvariablen für den Auswahlrahmen (Drag Select)
    this.isSelecting = false;
    this.selectionStart = { x: 0, y: 0 };
    this.selectionEnd = { x: 0, y: 0 };
  }

  // Einheit registrieren
  addUnit(unit) {
    this.units.push(unit);
  }

  // Einheiten im Rechteck auswählen
  selectInRect(startPos, endPos) {
    this.controlledUnit = null;
    const minX = Math.min(startPos.x, endPos.x);
    const maxX = Math.max(startPos.x, endPos.x);
    const minY = Math.min(startPos.y, endPos.y);
    const maxY = Math.max(startPos.y, endPos.y);

    this.selectedUnits = this.units.filter(unit => 
      unit.x >= minX && unit.x <= maxX &&
      unit.y >= minY && unit.y <= maxY
    );
  }

  // Bewegungsbefehl an ausgewählte Einheiten erteilen
  moveSelectedTo(targetX, targetY) {
    this.selectedUnits.forEach((unit, index) => {
      // Formation: Leicht versetzt positionieren, damit sie nicht überlappen
      const offsetX = (index % 4) * 25 - 30;
      const offsetY = Math.floor(index / 4) * 25 - 30;
      unit.targetX = targetX + offsetX;
      unit.targetY = targetY + offsetY;
    });
  }

  // Gruppe speichern (Strg + Zahl)
  assignGroup(groupNumber) {
    if (this.selectedUnits.length > 0) {
      this.groups[groupNumber] = [...this.selectedUnits];
    }
  }

  // Gruppe auswählen (Zahl drücken)
  selectGroup(groupNumber) {
    if (this.groups[groupNumber]) {
      this.selectedUnits = [...this.groups[groupNumber]];
      this.controlledUnit = null;
    }
  }

  // Übernahme der direkten manuellen Steuerung
  takeDirectControl(unit) {
    this.selectedUnits = [unit];
    this.controlledUnit = unit;
  }

  // Manuelle Steuerung per Tastatur (WASD / Pfeiltasten)
  handleManualInput(keys) {
    if (!this.controlledUnit) return;
    const speed = this.controlledUnit.speed || 3;

    if (keys['ArrowUp'] || keys['w'] || keys['W']) this.controlledUnit.y -= speed;
    if (keys['ArrowDown'] || keys['s'] || keys['S']) this.controlledUnit.y += speed;
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) this.controlledUnit.x -= speed;
    if (keys['ArrowRight'] || keys['d'] || keys['D']) this.controlledUnit.x += speed;
  }

  // Bewegungs-Update für Einheiten mit Zielkoordinaten
  updateUnits() {
    this.units.forEach(unit => {
      // Wenn die Einheit nicht manuell gesteuert wird, bewegt sie sich zum Ziel
      if (unit !== this.controlledUnit && unit.targetX !== undefined && unit.targetY !== undefined) {
        const dx = unit.targetX - unit.x;
        const dy = unit.targetY - unit.y;
        const distance = Math.hypot(dx, dy);
        const speed = unit.speed || 2;

        if (distance > speed) {
          unit.x += (dx / distance) * speed;
          unit.y += (dy / distance) * speed;
        } else {
          unit.x = unit.targetX;
          unit.y = unit.targetY;
        }
      }
    });
  }
}

// ==========================================
// 2. INITIALISIERUNG & EVENT LISTENERS
// ==========================================
const unitManager = new UnitManager();
const keysPressed = {};

// --- Tastatur-Events ---
window.addEventListener('keydown', (e) => {
  keysPressed[e.key] = true;

  // Truppengruppenverwaltung (1-9)
  if (e.key >= '1' && e.key <= '9') {
    if (e.ctrlKey) {
      unitManager.assignGroup(e.key);
    } else {
      unitManager.selectGroup(e.key);
    }
  }
});

window.addEventListener('keyup', (e) => {
  keysPressed[e.key] = false;
});

// --- Maus-Events ---

// Linksklick drücken: Rahmen ziehen starten oder Einzelübernahme
window.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return; // Nur Haupttaste (Links)

  const clickedUnit = unitManager.units.find(u => 
    Math.hypot(u.x - e.clientX, u.y - e.clientY) < 20
  );

  if (clickedUnit) {
    unitManager.takeDirectControl(clickedUnit);
  } else {
    unitManager.isSelecting = true;
    unitManager.selectionStart = { x: e.clientX, y: e.clientY };
    unitManager.selectionEnd = { x: e.clientX, y: e.clientY };
  }
});

// Maus bewegen: Auswahlrahmen aktualisieren
window.addEventListener('mousemove', (e) => {
  if (unitManager.isSelecting) {
    unitManager.selectionEnd = { x: e.clientX, y: e.clientY };
  }
});

// Linksklick loslassen: Auswahl abschließen
window.addEventListener('mouseup', (e) => {
  if (e.button === 0 && unitManager.isSelecting) {
    unitManager.isSelecting = false;
    unitManager.selectionEnd = { x: e.clientX, y: e.clientY };
    unitManager.selectInRect(unitManager.selectionStart, unitManager.selectionEnd);
  }
});

// Rechtsklick: Bewegungsbefehl erteilen
window.addEventListener('contextmenu', (e) => {
  e.preventDefault(); // Kontextmenü des Browsers unterdrücken
  unitManager.moveSelectedTo(e.clientX, e.clientY);
});

// ==========================================
// 3. INTEGRATION IN DIE GAME-LOOP
// ==========================================
function updateGameSystem() {
  // 1. Manuelle WASD/Pfeiltasten-Eingabe verarbeiten
  unitManager.handleManualInput(keysPressed);

  // 2. Automatische Bewegung der Soldaten zu ihren Zielpunkten verarbeiten
  unitManager.updateUnits();
}

// Rufen Sie `updateGameSystem()` einfach in Ihrer bestehenden Hauptschleife (requestAnimationFrame) auf!