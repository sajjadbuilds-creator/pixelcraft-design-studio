// ============================================================
// history.test.ts — Unit tests for Command pattern undo/redo stack
// ============================================================
import { describe, it, expect } from 'vitest';
import { History } from '../model/history';

describe('Command Pattern Undo / Redo History', () => {
  it('pushes and executes a command', () => {
    const history = new History();
    let value = 0;

    history.push({
      label: 'Increment',
      execute() { value += 1; },
      undo() { value -= 1; },
    });

    expect(value).toBe(1);
    expect(history.canUndo).toBe(true);
    expect(history.canRedo).toBe(false);
  });

  it('undoes and redoes commands in correct order', () => {
    const history = new History();
    let text = '';

    history.push({
      label: 'Type A',
      execute() { text += 'A'; },
      undo() { text = text.slice(0, -1); },
    });

    history.push({
      label: 'Type B',
      execute() { text += 'B'; },
      undo() { text = text.slice(0, -1); },
    });

    expect(text).toBe('AB');

    history.undo();
    expect(text).toBe('A');
    expect(history.canRedo).toBe(true);

    history.undo();
    expect(text).toBe('');
    expect(history.canUndo).toBe(false);

    history.redo();
    expect(text).toBe('A');

    history.redo();
    expect(text).toBe('AB');
  });

  it('wipes redo stack when a new command is pushed after undo', () => {
    const history = new History();
    let state = 'initial';

    history.push({
      label: 'First',
      execute() { state = 'first'; },
      undo() { state = 'initial'; },
    });

    history.undo();
    expect(history.canRedo).toBe(true);

    // Branch history by pushing new action
    history.push({
      label: 'Second',
      execute() { state = 'second'; },
      undo() { state = 'initial'; },
    });

    expect(history.canRedo).toBe(false);
    expect(state).toBe('second');
  });

  it('replaces the top command when coalescing drag moves', () => {
    const history = new History();
    let x = 0;

    // First micro-move
    history.push({
      label: 'Move',
      execute() { x = 10; },
      undo() { x = 0; },
    });

    // Replace with final drag position
    history.replace({
      label: 'Move',
      execute() { x = 50; },
      undo() { x = 0; },
    });

    history.undo();
    expect(x).toBe(0);

    history.redo();
    expect(x).toBe(50);
  });
});
