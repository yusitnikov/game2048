import "./style.css";
import { POWERS_OF_2, formatCellLabel, getCellClasses } from "./gameHelpers";

const GRID_WIDTH = 6;
const GRID_HEIGHT = 7;

interface GameState {
  grid: (number | null)[][];
  nextPieces: number[];
  selectedColumn: number | null;
  isGameRunning: boolean;
}

class TetrisGame {
  private gameState: GameState;
  private gridElement!: HTMLElement;
  private nextQueueElement!: HTMLElement;

  constructor() {
    this.gameState = {
      grid: Array(GRID_HEIGHT)
        .fill(null)
        .map(() => Array(GRID_WIDTH).fill(null)),
      nextPieces: [],
      selectedColumn: null,
      isGameRunning: false,
    };

    this.calculateCellSize();
    this.initializeDOM();
    this.generateNextPieces();
    this.startGame();
    this.setupResizeListener();
  }

  private initializeDOM(): void {
    const app = document.querySelector<HTMLDivElement>("#app")!;

    app.innerHTML = `
      <div class="game-container">
        <div class="game-board">
          <div class="grid" id="grid"></div>
        </div>
        <div class="sidebar">
          <div class="next-queue">
            <h3>Next Pieces</h3>
            <div id="next-queue"></div>
          </div>
        </div>
      </div>
    `;

    this.gridElement = document.getElementById("grid")!;
    this.nextQueueElement = document.getElementById("next-queue")!;

    this.createGrid();
    this.setupEventListeners();
  }

  private createGrid(): void {
    this.gridElement.innerHTML = "";

    for (let row = 0; row < GRID_HEIGHT; row++) {
      for (let col = 0; col < GRID_WIDTH; col++) {
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.dataset.row = row.toString();
        cell.dataset.col = col.toString();

        const indicator = document.createElement("div");
        indicator.className = "column-indicator";
        cell.appendChild(indicator);

        this.gridElement.appendChild(cell);
      }
    }
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
    this.nextQueueElement.innerHTML = "";

    this.gameState.nextPieces.forEach((value) => {
      const pieceElement = document.createElement("div");
      pieceElement.className = getCellClasses(value);
      pieceElement.textContent = formatCellLabel(value);
      this.nextQueueElement.prepend(pieceElement);
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
    for (let row = GRID_HEIGHT - 1; row >= 0; row--) {
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
      const row = Math.floor(index / GRID_WIDTH);
      const col = index % GRID_WIDTH;
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
    const sidebarWidth = 220; // sidebar width + padding
    const padding = 40; // container padding
    const gridPadding = 20; // grid internal padding
    const gridGap = 2 * (GRID_WIDTH - 1 + GRID_HEIGHT - 1); // gaps between cells

    const availableWidth =
      window.innerWidth - sidebarWidth - padding - gridPadding - gridGap;
    const availableHeight =
      window.innerHeight - padding - gridPadding - gridGap;

    // Calculate maximum cell size that fits both width and height constraints
    const maxCellSizeByWidth = Math.floor(availableWidth / GRID_WIDTH);
    const maxCellSizeByHeight = Math.floor(availableHeight / GRID_HEIGHT);

    // Use the smaller of the two to ensure the grid fits
    const cellSize = Math.min(maxCellSizeByWidth, maxCellSizeByHeight, 120); // max 120px
    const finalCellSize = Math.max(cellSize, 40); // min 40px

    document.documentElement.style.setProperty(
      "--cell-size",
      `${finalCellSize}px`,
    );
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
