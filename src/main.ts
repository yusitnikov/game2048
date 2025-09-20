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
const fullHeight = gridTop + gridHeight + (gridWidth - 1) * cellGap + padding;

interface GameState {
  grid: (number | null)[][];
  nextPieces: number[];
  selectedColumn: number | null;
  isGameRunning: boolean;
}

class TetrisGame {
  private gameState: GameState;
  private gridElement!: HTMLElement;
  private queueElements: HTMLElement[] = [];

  constructor() {
    this.gameState = {
      grid: Array(gridHeight)
        .fill(null)
        .map(() => Array(gridWidth).fill(null)),
      nextPieces: [],
      selectedColumn: null,
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
    this.setupEventListeners();
  }

  private createGrid(): void {
    this.gridElement.innerHTML = "";

    // Create main game grid cells
    for (let row = 0; row < gridHeight; row++) {
      for (let col = 0; col < gridWidth; col++) {
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.dataset.row = row.toString();
        cell.dataset.col = col.toString();
        setCellSizeStyles(cell, {
          top: gridTop + row * (1 + cellGap),
          left: padding + col * (1 + cellGap),
        });

        const indicator = document.createElement("div");
        indicator.className = "column-indicator";
        cell.appendChild(indicator);

        this.gridElement.appendChild(cell);
      }
    }

    // Create queue elements in the grid
    this.createQueueElements();
  }

  private createQueueElements(): void {
    this.queueElements = [];

    // Row 1: 1st in queue (next to drop)
    const nextPieceCell = document.createElement("div");
    nextPieceCell.className = "cell";
    setCellSizeStyles(nextPieceCell, {
      top: padding + 1 + cellGap,
      left: padding,
    });
    this.gridElement.appendChild(nextPieceCell);
    this.queueElements.push(nextPieceCell);

    // Row 0: 2nd and 3rd in queue
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

  private setupEventListeners(): void {
    this.gridElement.addEventListener("mouseover", (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains("cell")) {
        const col = parseInt(target.dataset.col!);
        this.setSelectedColumn(col);
      }
    });

    this.gridElement.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains("cell")) {
        const col = parseInt(target.dataset.col!);
        this.dropPiece(col);
      }
    });

    this.gridElement.addEventListener("mouseleave", () => {
      this.setSelectedColumn(null);
    });
  }

  private setSelectedColumn(col: number | null): void {
    this.gameState.selectedColumn = col;

    const allIndicators =
      this.gridElement.querySelectorAll(".column-indicator");
    allIndicators.forEach((indicator) => indicator.classList.remove("active"));

    if (col !== null) {
      const columnCells = this.gridElement.querySelectorAll(
        `[data-col="${col}"]`,
      );
      columnCells.forEach((cell) => {
        const indicator = cell.querySelector(".column-indicator");
        if (indicator) {
          indicator.classList.add("active");
        }
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
      this.updateGridDisplay();
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

  private updateGridDisplay(): void {
    const cells = this.gridElement.querySelectorAll(".cell");

    cells.forEach((cell, index) => {
      const htmlCell = cell as HTMLElement;
      const row = Math.floor(index / gridWidth);
      const col = index % gridWidth;
      const value = this.gameState.grid[row][col];

      // Remove all piece classes
      htmlCell.className = htmlCell.className.replace(/piece-\d+/g, "").trim();

      if (value !== null) {
        htmlCell.textContent = formatCellLabel(value);
        htmlCell.className = `${getCellClasses(value)} occupied`;
      } else {
        htmlCell.textContent = "";
        htmlCell.className = "cell";
      }
    });
  }

  private calculateCellSize(): void {
    // Calculate maximum cell size that fits both width and height constraints
    const maxCellSizeByWidth = Math.floor(window.innerWidth / fullWidth);
    const maxCellSizeByHeight = Math.floor(window.innerHeight / fullHeight);

    // Use the smaller of the two to ensure the grid fits
    const cellSize = Math.min(maxCellSizeByWidth, maxCellSizeByHeight); // max 120px

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
    this.updateGridDisplay();
    this.updateNextQueueDisplay();
  }
}

new TetrisGame();
