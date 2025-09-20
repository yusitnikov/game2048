import "./style.css";
import {
  formatCellLabel,
  getCellClasses,
  POWERS_OF_2,
  setCellSizeStyles,
} from "./gameHelpers";

const gridWidth = 6;
const gridHeight = 7;

const padding = 0.3;
const cellGap = 0.1;
const gridTop = 2 + cellGap + padding * 2;
const fullWidth = gridWidth + (gridWidth - 1) * cellGap + padding * 2;
const fullHeight = gridTop + gridHeight + (gridHeight - 1) * cellGap + padding;

const columnAnimationTime = 0.1;
const dropAnimationTime = 0.5;
const mergeAnimationTime = 0.3;

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
  private animationsQueue = Promise.resolve();

  constructor() {
    const app = document.querySelector<HTMLDivElement>("#app")!;
    app.innerHTML = `<div class="grid" id="grid"></div>`;
    this.gridElement = document.getElementById("grid")!;

    this.calculateCellSize();
    this.setupResizeListener();

    this.startNewGame();
  }

  private animate(callback: () => Promise<void> | void) {
    this.animationsQueue = this.animationsQueue.then(callback);
    return this.animationsQueue;
  }

  private sleep(seconds: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, seconds * 1000));
  }

  private raf() {
    return new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );
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
    button.addEventListener("click", () =>
      this.animate(() => this.startNewGame()),
    );
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

      columnArea.addEventListener("click", () =>
        this.animate(() => this.dropPiece(col)),
      );

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
    this.activeColumnIndicator.style.transitionDuration = `${columnAnimationTime}s`;
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

    element.style.transitionDuration = `${columnAnimationTime}s`;
    setCellSizeStyles(element, {
      top: padding + 1 + padding,
      left: padding + this.gameState.selectedColumn * (1 + cellGap),
    });
  }

  private generateNextPieces(): void {
    while (this.gameState.nextPieces.length < 3) {
      const randomIndex = Math.floor(Math.random() * 6);
      const newValue = POWERS_OF_2[randomIndex];
      this.gameState.nextPieces.unshift(this.createNewQueueElement(newValue));
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

  private createNewPiece(
    value: number,
    position: { top: number; left: number },
    transitionDuration = 0.5,
  ): PieceHandler {
    const element = document.createElement("div");
    element.className = getCellClasses(value);
    element.textContent = formatCellLabel(value);

    setCellSizeStyles(element, position);

    element.style.transitionDuration = `${transitionDuration}s`;

    this.gridElement.appendChild(element);

    return { value, element };
  }

  private createNewQueueElement(value: number) {
    // Position the new element outside the grid initially
    return this.createNewPiece(value, { top: padding, left: -1 });
  }

  private async dropPiece(col: number) {
    const row = this.getLowestEmptyRow(col);
    if (row < 0) {
      return;
    }

    const piece = this.gameState.nextPieces.pop()!;
    this.generateNextPieces();

    this.gameState.grid[row][col] = piece;

    // Move the first queue element (next piece) to the grid position
    piece.element.style.transitionDuration = `${dropAnimationTime}s`;
    this.setPiecePosition(piece, row, col);
    await this.sleep(dropAnimationTime);

    const directions = [
      { col: -1, row: 0 },
      { col: 0, row: 1 },
      { col: 1, row: 0 },
    ];
    for (let mergeRow = row, mergeCol = col, mergePiece = piece; ; ) {
      const newPiecesToMerge = directions
        .map(({ row, col }) => ({
          row: mergeRow + row,
          col: mergeCol + col,
        }))
        .map((cell) => ({
          ...cell,
          piece: this.gameState.grid[cell.row]?.[cell.col],
        }))
        .filter(({ piece }) => piece?.value === mergePiece.value)
        .map((cell) => ({ ...cell, piece: cell.piece! }));
      if (newPiecesToMerge.length === 0) {
        break;
      }

      const piecesToMerge = [
        { row: mergeRow, col: mergeCol, piece: mergePiece },
        ...newPiecesToMerge,
      ];
      for (const { row, col } of piecesToMerge) {
        this.gameState.grid[row][col] = undefined;
      }

      const newCell = piecesToMerge
        .filter(({ col }) => col === mergeCol)
        .sort((a, b) => b.row - a.row)[0];
      mergeRow = newCell.row;
      mergeCol = newCell.col;

      const newValue = mergePiece.value * Math.pow(2, newPiecesToMerge.length);
      const pieceClones = piecesToMerge.map(({ row, col }) => {
        const piece = this.createNewPiece(
          newValue,
          this.getPiecePosition(row, col),
          mergeAnimationTime,
        );
        piece.element.style.opacity = "0";
        return piece;
      });
      this.gameState.grid[mergeRow][mergeCol] = mergePiece = pieceClones[0];
      await this.raf();
      for (const { piece } of piecesToMerge) {
        this.setPiecePosition(piece, mergeRow, mergeCol);
        piece.element.style.opacity = "0";
      }
      for (const piece of pieceClones) {
        this.setPiecePosition(piece, mergeRow, mergeCol);
        piece.element.style.opacity = "1";
      }
      await this.sleep(mergeAnimationTime);
      for (const { piece } of piecesToMerge) {
        piece.element.remove();
      }
      for (const piece of pieceClones) {
        if (piece !== mergePiece) {
          piece.element.remove();
        }
      }
    }
  }

  private getPiecePosition(row: number, col: number) {
    return {
      top: gridTop + row * (1 + cellGap),
      left: padding + col * (1 + cellGap),
    };
  }

  private setPiecePosition(piece: PieceHandler, row: number, col: number) {
    setCellSizeStyles(piece.element, this.getPiecePosition(row, col));
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
