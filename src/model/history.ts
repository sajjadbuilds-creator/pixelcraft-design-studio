// ============================================================
// history.ts — Command pattern undo/redo system
// Every mutating action is a Command { do, undo }
// Coalescing: actions while dragging are merged into one step
// ============================================================
export interface Command {
  label: string;
  execute(): void;
  undo(): void;
}

export class History {
  private past: Command[] = [];
  private future: Command[] = [];
  private limit = 200;

  push(cmd: Command) {
    cmd.execute();
    this.past.push(cmd);
    if (this.past.length > this.limit) this.past.shift();
    this.future = [];           // branching wipes redo stack
  }

  /** Replace the top command with a merged one (for drag coalescing) */
  replace(cmd: Command) {
    if (this.past.length > 0) this.past[this.past.length - 1] = cmd;
    else this.past.push(cmd);
  }

  undo(): boolean {
    const cmd = this.past.pop();
    if (!cmd) return false;
    cmd.undo();
    this.future.push(cmd);
    return true;
  }

  redo(): boolean {
    const cmd = this.future.pop();
    if (!cmd) return false;
    cmd.execute();
    this.past.push(cmd);
    return true;
  }

  get canUndo() { return this.past.length > 0; }
  get canRedo() { return this.future.length > 0; }
  get undoLabel() { return this.past[this.past.length - 1]?.label ?? ''; }
  get redoLabel() { return this.future[this.future.length - 1]?.label ?? ''; }
}
