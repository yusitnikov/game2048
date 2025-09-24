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
const mergeAnimationTime = 0.3;
const saveKey = "game2048-save";

const directions: Position[] = [
  { col: -1, row: 0 },
  { col: 0, row: 1 },
  { col: 1, row: 0 },
  { col: 0, row: -1 },
];

interface PieceHandler {
  value: number;
  element: HTMLElement;
}

interface Position {
  row: number;
  col: number;
}

interface PieceWithPosition extends Position {
  piece: PieceHandler;
}

interface GameState {
  grid: (PieceHandler | undefined)[][];
  nextPieces: PieceHandler[];
  selectedColumn: number;
  isGameRunning: boolean;
}

interface SerializableGameState {
  grid: (number | null)[][];
  nextPieces: number[];
}

class TetrisGame {
  private readonly gridElement: HTMLElement;
  private activeColumnElement!: HTMLElement;
  private gridBackgroundElement!: HTMLElement;

  private gameState!: GameState;

  private animationsQueue = Promise.resolve();

  constructor() {
    const app = document.querySelector<HTMLDivElement>("#app")!;
    app.innerHTML = `<div class="grid" id="grid"></div>`;
    this.gridElement = document.getElementById("grid")!;

    this.calculateCellSize();
    this.setupResizeListener();

    if (!this.loadGame()) {
      this.startNewGame();
    }
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

  private loadGame() {
    const savedStateStr = localStorage.getItem(saveKey);
    if (!savedStateStr) {
      return false;
    }

    try {
      const savedState = JSON.parse(savedStateStr) as SerializableGameState;

      this.reset();

      for (const [row, rowArray] of savedState.grid.entries()) {
        for (const [col, value] of rowArray.entries()) {
          if (value) {
            this.gameState.grid[row][col] = this.createNewPiece(
              value,
              this.getPiecePosition({ row, col }),
              0,
            );
          }
        }
      }

      this.gameState.nextPieces = savedState.nextPieces.map((value) =>
        this.createNewQueueElement(value),
      );
      this.updateNextPiecePositions();

      return true;
    } catch (error) {
      console.log("Failed to load game:", error);
      return false;
    }
  }

  private saveGame(): void {
    if (this.gameState.isGameRunning) {
      const serializableState: SerializableGameState = {
        grid: this.gameState.grid.map((row) =>
          row.map((piece) => piece?.value ?? null),
        ),
        nextPieces: this.gameState.nextPieces.map((piece) => piece.value),
      };

      localStorage.setItem(saveKey, JSON.stringify(serializableState));
    } else {
      localStorage.removeItem(saveKey);
    }
  }

  private reset() {
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
  }

  private startNewGame() {
    this.reset();
    this.generateNextPieces();
    this.saveGame();
  }

  private createGridBackground(): void {
    this.gridBackgroundElement = document.createElement("div");
    this.gridBackgroundElement.className = "grid-background";
    setCellSizeStyles(this.gridBackgroundElement, {
      top: gridTop - cellGap / 2,
      left: padding - cellGap / 2,
      width: gridWidth * (1 + cellGap),
      height: gridHeight * (1 + cellGap),
    });
    this.gridElement.appendChild(this.gridBackgroundElement);
  }

  private createNewGameButton() {
    const button = document.createElement("button");
    button.className = "new-game-button cell";
    setCellSizeStyles(button, {
      top: padding,
      left: fullWidth - padding - 1,
    });
    button.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="38 5" transform="rotate(30 12 12)"/>
      <polygon fill="currentColor" points="20,4 20,10 14,10"/>
    </svg>`;
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
    this.activeColumnElement = document.createElement("div");
    this.activeColumnElement.className = "active-column-indicator";
    setCellSizeStyles(this.activeColumnElement, {
      top: gridTop - cellGap / 2 - 1 - cellGap,
      width: 1 + cellGap,
      height: (gridHeight + 1) * (1 + cellGap),
    });
    this.activeColumnElement.style.transitionDuration = `${columnAnimationTime}s`;
    this.updateActiveColumnIndicator();
    this.gridElement.appendChild(this.activeColumnElement);
  }

  private setSelectedColumn(col: number): void {
    this.gameState.selectedColumn = col;

    // Move active column indicator to selected column
    this.updateActiveColumnIndicator();

    // Update next piece position to follow selected column
    this.updateVeryNextPiecePosition();
  }

  private updateActiveColumnIndicator(): void {
    const col = this.gameState.selectedColumn;
    setCellSizeStyles(this.activeColumnElement, {
      left: padding + col * (1 + cellGap) - cellGap / 2,
    });
  }

  private updateVeryNextPiecePosition(): void {
    const { element } = this.gameState.nextPieces[3];

    element.style.transitionDuration = `${columnAnimationTime}s`;
    setCellSizeStyles(element, {
      top: padding + 1 + padding,
      left: padding + this.gameState.selectedColumn * (1 + cellGap),
    });
  }

  private generateNextPieces(): void {
    const minDigitIndex = this.getMinAvailableDigitIndex();

    while (this.gameState.nextPieces.length < 4) {
      const randomIndex = Math.floor(minDigitIndex + 0.5 + Math.random() * 5);
      const newValue = POWERS_OF_2[randomIndex];
      this.gameState.nextPieces.unshift(this.createNewQueueElement(newValue));
    }

    requestAnimationFrame(() => this.updateNextPiecePositions());
  }

  private updateNextPiecePositions() {
    const queue = this.gameState.nextPieces.slice(0, 3);
    for (const [index, { element }] of queue.entries()) {
      setCellSizeStyles(element, {
        left: padding + index * (1 + cellGap),
        top: padding,
      });
    }

    this.updateVeryNextPiecePosition();
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
    if (!this.gameState.isGameRunning) {
      return;
    }

    const row = this.getLowestEmptyRow(col);
    if (row < 0) {
      return;
    }

    const piece = this.gameState.nextPieces.pop()!;
    this.generateNextPieces();

    let droppingPieces: PieceWithPosition[] = [{ row, col, piece }];
    let activePieces = droppingPieces;

    for (let step = 0; activePieces.length; step++) {
      if (droppingPieces.length) {
        const animationTime = step === 0 ? 0.5 : 0.2;

        for (const item of droppingPieces) {
          const { row, col, piece } = item;

          piece.element.style.transitionDuration = `${animationTime}s`;
          this.setPiecePosition(piece, item);
          this.gameState.grid[row][col] = piece;
        }

        await this.sleep(animationTime);
      }

      const mergedPieces = await this.mergePieces(activePieces);

      await this.removeSmallPieces();

      const newDroppingPieces = this.getPiecesToDrop();
      activePieces = [...newDroppingPieces, ...mergedPieces];
      droppingPieces = newDroppingPieces;
    }

    if (this.gameState.grid[0].some(Boolean)) {
      this.gameState.isGameRunning = false;

      this.gridBackgroundElement.classList.add("game-over");
    }

    this.saveGame();
  }

  private async removeSmallPieces() {
    const minDigit = POWERS_OF_2[this.getMinAvailableDigitIndex()];

    const removedPieces = this.gameState.nextPieces
      .filter(({ value }) => value < minDigit)
      .map(({ element }) => ({ element, top: -1 }));
    this.gameState.nextPieces = this.gameState.nextPieces.filter(
      ({ value }) => value >= minDigit,
    );

    for (const [row, rowArray] of this.gameState.grid.entries()) {
      for (const [col, piece] of rowArray.entries()) {
        if (piece && piece.value < minDigit) {
          this.gameState.grid[row][col] = undefined;
          removedPieces.push({ element: piece.element, top: fullHeight + 1 });
        }
      }
    }

    if (!removedPieces.length) {
      return;
    }

    const animationTime = 0.5;
    for (const { element, top } of removedPieces) {
      setCellSizeStyles(element, { top });
      element.style.opacity = "0";
      element.style.transitionDuration = `${animationTime}s`;
    }
    this.generateNextPieces();
    await this.sleep(animationTime);
    for (const { element } of removedPieces) {
      element.remove();
    }
  }

  private getPieceMergeGroups(): PieceWithPosition[][] {
    const mergeGroupsSet = new Set<(typeof mergeGroupsMap)[0][0]>();

    const mergeGroupsMap = this.gameState.grid.map((rowArray, row) =>
      rowArray.map((piece, col) => ({
        pieces: piece ? [{ row, col, piece }] : [],
        value: piece?.value,
      })),
    );

    for (const row of mergeGroupsMap.keys()) {
      for (const col of mergeGroupsMap[row].keys()) {
        const group1 = mergeGroupsMap[row][col];
        if (!group1.value) {
          continue;
        }

        for (const direction of directions) {
          const group2 =
            mergeGroupsMap[row + direction.row]?.[col + direction.col];
          if (group2 === group1 || group2?.value !== group1.value) {
            continue;
          }

          group1.pieces = [...group1.pieces, ...group2.pieces];

          for (const { row, col } of group2.pieces) {
            mergeGroupsMap[row][col] = group1;
          }

          mergeGroupsSet.add(group1);
          mergeGroupsSet.delete(group2);
        }
      }
    }

    return Array.from(mergeGroupsSet).map(({ pieces }) => pieces);
  }

  private async mergePieces(
    activePieces: PieceWithPosition[],
  ): Promise<PieceWithPosition[]> {
    const pieceMergeGroups = this.getPieceMergeGroups().map((piecesToMerge) => {
      // Start merging from one of the dropping pieces if exists, or a middle piece otherwise
      const mergeCol = (
        piecesToMerge.find((piece1) =>
          activePieces.some(
            (piece2) => piece2.row === piece1.row && piece2.col === piece1.col,
          ),
        ) ?? piecesToMerge[Math.floor(piecesToMerge.length / 2)]
      ).col;
      const mergeCell = piecesToMerge
        .filter(({ col }) => col === mergeCol)
        .sort((a, b) => b.row - a.row)[0];

      const newValue =
        mergeCell.piece.value * Math.pow(2, piecesToMerge.length - 1);
      const pieceClones = piecesToMerge.map((position) => {
        const piece = this.createNewPiece(
          newValue,
          this.getPiecePosition(position),
          mergeAnimationTime,
        );
        piece.element.style.opacity = "0";
        return piece;
      });

      return {
        piecesToMerge,
        pieceClones,
        mergedPiece: {
          ...mergeCell,
          piece: pieceClones[0],
        },
      };
    });

    if (pieceMergeGroups.length === 0) {
      return [];
    }

    for (const { piecesToMerge, mergedPiece } of pieceMergeGroups) {
      for (const { row, col } of piecesToMerge) {
        this.gameState.grid[row][col] = undefined;
      }

      this.gameState.grid[mergedPiece.row][mergedPiece.col] = mergedPiece.piece;
    }

    await this.raf();

    for (const {
      piecesToMerge,
      pieceClones,
      mergedPiece,
    } of pieceMergeGroups) {
      for (const { piece } of piecesToMerge) {
        this.setPiecePosition(piece, mergedPiece);
        piece.element.style.opacity = "0";
      }
      for (const piece of pieceClones) {
        this.setPiecePosition(piece, mergedPiece);
        piece.element.style.opacity = "1";
      }
    }

    await this.sleep(mergeAnimationTime);

    for (const {
      piecesToMerge,
      pieceClones,
      mergedPiece,
    } of pieceMergeGroups) {
      for (const { piece } of piecesToMerge) {
        piece.element.remove();
      }
      for (const piece of pieceClones) {
        if (piece !== mergedPiece.piece) {
          piece.element.remove();
        }
      }
    }

    return pieceMergeGroups.map(({ mergedPiece }) => mergedPiece);
  }

  private getPiecesToDrop() {
    const result: PieceWithPosition[] = [];

    for (let col = 0; col < gridWidth; col++) {
      let rowToDrop = this.getLowestEmptyRow(col);

      for (let row = rowToDrop - 1; row >= 0; row--) {
        const piece = this.gameState.grid[row][col];
        if (!piece) {
          continue;
        }

        this.gameState.grid[row][col] = undefined;
        result.push({ row: rowToDrop, col, piece });
        --rowToDrop;
      }
    }

    return result;
  }

  private getPiecePosition({ row, col }: Position) {
    return {
      top: gridTop + row * (1 + cellGap),
      left: padding + col * (1 + cellGap),
    };
  }

  private setPiecePosition(piece: PieceHandler, position: Position) {
    setCellSizeStyles(piece.element, this.getPiecePosition(position));
  }

  private getLowestEmptyRow(col: number): number {
    for (let row = gridHeight - 1; row >= 0; row--) {
      if (this.gameState.grid[row][col] === undefined) {
        return row;
      }
    }
    return -1;
  }

  private getMaxDigitInGrid() {
    let max = 2;

    for (const row of this.gameState.grid) {
      for (const piece of row) {
        if (piece?.value !== undefined) {
          max = Math.max(max, piece.value);
        }
      }
    }

    return max;
  }

  private getMinAvailableDigitIndex() {
    const maxDigitInGrid = this.getMaxDigitInGrid();
    if (maxDigitInGrid >= 1024 * 1024) {
      return 4;
    }
    if (maxDigitInGrid >= 128 * 1024) {
      return 3;
    }
    if (maxDigitInGrid >= 16 * 1024) {
      return 2;
    }
    if (maxDigitInGrid >= 2 * 1024) {
      return 1;
    }
    return 0;
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
