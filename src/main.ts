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

    this.initializeDOM();
    this.generateNextPieces();
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

    // Row 1: 1st in queue (next to drop) - will be positioned above selected column
    const nextPieceCell = document.createElement("div");
    nextPieceCell.className = "cell";
    this.gridElement.appendChild(nextPieceCell);
    this.queueElements.push(nextPieceCell);

    // Row 0: 2nd and 3rd in queue (fixed position)
    const secondPieceCell = document.createElement("div");
    secondPieceCell.className = "cell";
    setCellSizeStyles(secondPieceCell, {
      top: padding,
      left: padding + 1 + cellGap,
    });
    this.gridElement.appendChild(secondPieceCell);
    this.queueElements.push(secondPieceCell);

    const thirdPieceCell = document.createElement("div");
    thirdPieceCell.className = "cell";
    setCellSizeStyles(thirdPieceCell, {
      top: padding,
      left: padding,
    });
    this.gridElement.appendChild(thirdPieceCell);
    this.queueElements.push(thirdPieceCell);
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
      this.gameState.nextPieces.push(POWERS_OF_2[randomIndex]);
    }
    this.updateNextQueueDisplay();
  }

  private updateNextQueueDisplay(): void {
    this.gameState.nextPieces.forEach((value, index) => {
      if (index < this.queueElements.length) {
        const queueElement = this.queueElements[index];
        queueElement.className = getCellClasses(value);
        queueElement.textContent = formatCellLabel(value);
      }
    });
  }

  private dropPiece(col: number): void {
    if (!this.canDropInColumn(col)) return;

    const nextValue = this.gameState.nextPieces.shift()!;
    this.generateNextPieces();

    const targetRow = this.getLowestEmptyRow(col);
    if (targetRow !== -1) {
      this.gameState.grid[targetRow][col] = nextValue;
      this.createGameCell(targetRow, col, nextValue);
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

  private createGameCell(row: number, col: number, value: number): void {
    const cell = document.createElement("div");
    cell.className = getCellClasses(value);
    cell.textContent = formatCellLabel(value);
    setCellSizeStyles(cell, {
      top: gridTop + row * (1 + cellGap),
      left: padding + col * (1 + cellGap),
    });
    this.gridElement.appendChild(cell);
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
