import "./style.css";
import {
  POWERS_OF_2,
  formatCellLabel,
  getCellClasses,
  setCellSizeStyles,
} from "./gameHelpers";

const gridWidth = 6;
const gridHeight = 7;

const padding = 0.3;
const cellGap = 0.1;
const gridTop = 2 + cellGap + padding * 2;
const fullWidth = gridWidth + (gridWidth - 1) * cellGap + padding * 2;
const fullHeight = gridTop + gridHeight + (gridHeight - 1) * cellGap + padding;

interface GameState {
  grid: (number | null)[][];
  nextPieces: number[];
  selectedColumn: number;
  isGameRunning: boolean;
}

class TetrisGame {
  private gameState: GameState;
  private gridElement!: HTMLElement;
  private queueElements: HTMLElement[] = [];
  private activeColumnIndicator!: HTMLElement;

  constructor() {
    this.gameState = {
      grid: Array(gridHeight)
        .fill(null)
        .map(() => Array(gridWidth).fill(null)),
      nextPieces: [],
      selectedColumn: Math.floor((gridWidth - 1) / 2), // Start with middle column selected
      isGameRunning: false,
    };

    this.generateNextPieces();
    this.initializeDOM();
    this.startGame();
    this.setupResizeListener();
  }

  private initializeDOM(): void {
    const app = document.querySelector<HTMLDivElement>("#app")!;

    app.innerHTML = `<div class="grid" id="grid"></div>`;

    this.gridElement = document.getElementById("grid")!;

    this.calculateCellSize();

    this.createGrid();
  }

  private createGridBackground(): void {
    const gridBg = document.createElement("div");
    gridBg.className = "grid-background";
    setCellSizeStyles(gridBg, {
      top: gridTop - cellGap / 2,
      left: padding - cellGap / 2,
      width: gridWidth * (1 + cellGap),
      height: gridHeight * (1 + cellGap),
    });
    this.gridElement.appendChild(gridBg);
  }

  private createGrid(): void {
    this.gridElement.innerHTML = "";

    // Create header background
    this.createGridBackground();

    // Create clickable column areas
    this.createColumnAreas();

    // Create active column indicator
    this.createActiveColumnIndicator();

    // Create queue elements in the grid
    this.createQueueElements();
  }

  private createColumnAreas(): void {
    for (let col = 0; col < gridWidth; col++) {
      const columnArea = document.createElement("div");
      columnArea.className = "column-area";
      columnArea.dataset.col = col.toString();
      setCellSizeStyles(columnArea, {
        left: padding + col * (1 + cellGap) - cellGap / 2,
        top: gridTop - cellGap / 2 - 1 - cellGap,
        width: 1 + cellGap,
        height: (gridHeight + 1) * (1 + cellGap),
      });

      // Add event listeners directly to the column
      columnArea.addEventListener("mouseenter", () => {
        this.setSelectedColumn(col);
      });

      columnArea.addEventListener("click", () => {
        this.dropPiece(col);
      });

      this.gridElement.appendChild(columnArea);
    }
  }

  private createActiveColumnIndicator(): void {
    this.activeColumnIndicator = document.createElement("div");
    this.activeColumnIndicator.className = "active-column-indicator";
    setCellSizeStyles(this.activeColumnIndicator, {
      top: gridTop - cellGap / 2 - 1 - cellGap,
      width: 1 + cellGap,
      height: (gridHeight + 1) * (1 + cellGap),
    });
    this.gridElement.appendChild(this.activeColumnIndicator);
  }

  private createQueueElements(): void {
    this.queueElements = [];

    // Create elements for the initial 3 pieces in the queue
    for (let i = 0; i < 3; i++) {
      const value = this.gameState.nextPieces[i];
      const element = document.createElement("div");
      element.className = getCellClasses(value);
      element.textContent = formatCellLabel(value);

      if (i === 0) {
        // First element (next to drop) - will be positioned above selected column
        // Position will be set by updateNextPiecePosition()
      } else if (i === 1) {
        // Second element
        setCellSizeStyles(element, {
          top: padding,
          left: padding + 1 + cellGap,
        });
      } else if (i === 2) {
        // Third element
        setCellSizeStyles(element, {
          top: padding,
          left: padding,
        });
      }

      this.gridElement.appendChild(element);
      this.queueElements.push(element);
    }
  }

  private setSelectedColumn(col: number): void {
    this.gameState.selectedColumn = col;

    // Move active column indicator to selected column
    this.updateActiveColumnIndicator();

    // Update next piece position to follow selected column
    this.updateNextPiecePosition();
  }

  private updateActiveColumnIndicator(): void {
    const col = this.gameState.selectedColumn;
    setCellSizeStyles(this.activeColumnIndicator, {
      left: padding + col * (1 + cellGap) - cellGap / 2,
    });
  }

  private updateNextPiecePosition(): void {
    if (this.queueElements[0]) {
      const col = this.gameState.selectedColumn;
      setCellSizeStyles(this.queueElements[0], {
        top: padding + 1 + padding,
        left: padding + col * (1 + cellGap),
      });
    }
  }

  private generateNextPieces(): void {
    while (this.gameState.nextPieces.length < 3) {
      const randomIndex = Math.floor(Math.random() * POWERS_OF_2.length);
      const newValue = POWERS_OF_2[randomIndex];
      this.gameState.nextPieces.push(newValue);

      // If we need a new queue element, create it (only if DOM is initialized)
      if (this.gridElement && this.queueElements.length < 3) {
        this.createNewQueueElement(newValue);
      }
    }
    // Only update display if DOM is ready
    if (this.gridElement) {
      this.updateNextQueueDisplay();
    }
  }

  private shiftQueueElements(): void {
    // Move remaining queue elements to their new positions
    this.queueElements.forEach((element, index) => {
      if (index === 0) {
        // First element becomes the next piece - position above selected column
        this.updateNextPiecePosition();
      } else if (index === 1) {
        // Second element moves to position 1,1
        setCellSizeStyles(element, {
          top: padding,
          left: padding + 1 + cellGap,
        });
      } else if (index === 2) {
        // Third element moves to position 0,0
        setCellSizeStyles(element, {
          top: padding,
          left: padding,
        });
      }
    });
  }

  private createNewQueueElement(value: number): void {
    const newElement = document.createElement("div");
    newElement.className = getCellClasses(value);
    newElement.textContent = formatCellLabel(value);

    // Position the new element at the third position initially
    setCellSizeStyles(newElement, {
      top: padding,
      left: padding,
    });

    this.gridElement.appendChild(newElement);
    this.queueElements.push(newElement);
  }

  private updateNextQueueDisplay(): void {
    // Only update the display of existing queue elements, don't change their content
    // The content is set when elements are created and should preserve their identity
  }

  private dropPiece(col: number): void {
    if (!this.canDropInColumn(col)) return;

    const nextValue = this.gameState.nextPieces.shift()!;

    const targetRow = this.getLowestEmptyRow(col);
    if (targetRow !== -1) {
      this.gameState.grid[targetRow][col] = nextValue;

      // Move the first queue element (next piece) to the grid position
      const droppedElement = this.queueElements.shift()!;
      setCellSizeStyles(droppedElement, {
        top: gridTop + targetRow * (1 + cellGap),
        left: padding + col * (1 + cellGap),
      });

      // Shift remaining queue elements to new positions
      this.shiftQueueElements();

      // Add new piece to queue and create new element for it
      this.generateNextPieces();
    }
  }

  private canDropInColumn(col: number): boolean {
    return this.gameState.grid[0][col] === null;
  }

  private getLowestEmptyRow(col: number): number {
    for (let row = gridHeight - 1; row >= 0; row--) {
      if (this.gameState.grid[row][col] === null) {
        return row;
      }
    }
    return -1;
  }

  private calculateCellSize(): void {
    // Calculate maximum cell size that fits both width and height constraints
    const maxCellSizeByWidth = window.innerWidth / fullWidth;
    const maxCellSizeByHeight = window.innerHeight / fullHeight;

    // Use the smaller of the two to ensure the grid fits
    const cellSize = Math.min(maxCellSizeByWidth, maxCellSizeByHeight);

    document.documentElement.style.setProperty("--cell-size", `${cellSize}px`);
    this.gridElement.style.width = `${cellSize * fullWidth}px`;
    this.gridElement.style.height = `${cellSize * fullHeight}px`;
  }

  private setupResizeListener(): void {
    window.addEventListener("resize", () => {
      this.calculateCellSize();
    });
  }

  private startGame(): void {
    this.gameState.isGameRunning = true;
    this.updateNextQueueDisplay();
    // Apply the initial column selection
    this.setSelectedColumn(this.gameState.selectedColumn);
  }
}

new TetrisGame();
