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

interface PieceHandler {
  value: number;
  element: HTMLElement;
}

interface GameState {
  grid: (PieceHandler | undefined)[][];
  nextPieces: PieceHandler[];
  selectedColumn: number;
  isGameRunning: boolean;
}

class TetrisGame {
  private readonly gridElement: HTMLElement;
  private gameState!: GameState;
  private activeColumnIndicator!: HTMLElement;

  constructor() {
    const app = document.querySelector<HTMLDivElement>("#app")!;
    app.innerHTML = `<div class="grid" id="grid"></div>`;
    this.gridElement = document.getElementById("grid")!;

    this.calculateCellSize();
    this.setupResizeListener();

    this.startNewGame();
  }

  private startNewGame(): void {
    this.gameState = {
      grid: Array(gridHeight)
        .fill([])
        .map(() => Array(gridWidth).fill(undefined)),
      nextPieces: [],
      selectedColumn: Math.floor((gridWidth - 1) / 2), // Start with middle column selected
      isGameRunning: true,
    };

    this.gridElement.innerHTML = "";

    this.createGridBackground();
    this.createNewGameButton();
    this.createColumnAreas();
    this.createActiveColumnIndicator();
    this.generateNextPieces();
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

  private createNewGameButton() {
    const button = document.createElement("button");
    button.className = "new-game-button cell";
    setCellSizeStyles(button, {
      top: padding,
      left: fullWidth - padding - 1,
    });
    button.innerText = "⟳";
    button.addEventListener("click", () => this.startNewGame());
    this.gridElement.appendChild(button);
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
    this.updateActiveColumnIndicator();
    this.gridElement.appendChild(this.activeColumnIndicator);
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
    const { element } = this.gameState.nextPieces[2];

    element.style.transitionDuration = "0.1s";
    setCellSizeStyles(element, {
      top: padding + 1 + padding,
      left: padding + this.gameState.selectedColumn * (1 + cellGap),
    });
  }

  private generateNextPieces(): void {
    while (this.gameState.nextPieces.length < 3) {
      const randomIndex = Math.floor(Math.random() * POWERS_OF_2.length);
      const newValue = POWERS_OF_2[randomIndex];
      this.gameState.nextPieces.unshift({
        value: newValue,
        element: this.createNewQueueElement(newValue),
      });
    }

    requestAnimationFrame(() => {
      const queue = this.gameState.nextPieces.slice(0, 2);
      for (const [index, { element }] of queue.entries()) {
        setCellSizeStyles(element, {
          left: padding + index * (1 + cellGap),
          top: padding,
        });
      }

      this.updateNextPiecePosition();
    });
  }

  private createNewQueueElement(value: number) {
    const newElement = document.createElement("div");
    newElement.className = getCellClasses(value);
    newElement.textContent = formatCellLabel(value);

    // Position the new element outside the grid initially
    setCellSizeStyles(newElement, {
      top: padding,
      left: -1,
    });

    newElement.style.transitionDuration = "0.5s";

    this.gridElement.appendChild(newElement);
    return newElement;
  }

  private dropPiece(col: number): void {
    const targetRow = this.getLowestEmptyRow(col);
    if (targetRow < 0) {
      return;
    }

    const nextValue = this.gameState.nextPieces.pop()!;
    this.gameState.grid[targetRow][col] = nextValue;

    // Move the first queue element (next piece) to the grid position
    nextValue.element.style.transitionDuration = "0.5s";
    setCellSizeStyles(nextValue.element, {
      top: gridTop + targetRow * (1 + cellGap),
      left: padding + col * (1 + cellGap),
    });

    // Add new piece to queue and create new element for it
    this.generateNextPieces();
  }

  private getLowestEmptyRow(col: number): number {
    for (let row = gridHeight - 1; row >= 0; row--) {
      if (this.gameState.grid[row][col] === undefined) {
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
}

new TetrisGame();
