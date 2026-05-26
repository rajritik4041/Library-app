export type AlertDialogRequest = {
  kind: 'alert';
  id: number;
  title: string;
  message: string;
  resolve: () => void;
};

export type ConfirmDialogRequest = {
  kind: 'confirm';
  id: number;
  title: string;
  message: string;
  confirmLabel: string;
  destructive?: boolean;
  resolve: (ok: boolean) => void;
};

export type DialogRequest = AlertDialogRequest | ConfirmDialogRequest;

type Listener = (current: DialogRequest | null) => void;

let queue: DialogRequest[] = [];
let idSeq = 0;
const listeners = new Set<Listener>();

function notify() {
  const current = queue[0] ?? null;
  listeners.forEach((l) => l(current));
}

export function subscribeAppDialog(listener: Listener): () => void {
  listeners.add(listener);
  listener(queue[0] ?? null);
  return () => listeners.delete(listener);
}

export function dismissAppDialog(id: number, result?: boolean) {
  const head = queue[0];
  if (!head || head.id !== id) return;
  if (head.kind === 'alert') {
    head.resolve();
  } else {
    head.resolve(Boolean(result));
  }
  queue.shift();
  notify();
}

export function enqueueAlert(title: string, message: string): Promise<void> {
  return new Promise((resolve) => {
    queue.push({
      kind: 'alert',
      id: ++idSeq,
      title,
      message,
      resolve,
    });
    notify();
  });
}

export function enqueueConfirm(
  title: string,
  message: string,
  options?: { confirmLabel?: string; destructive?: boolean },
): Promise<boolean> {
  return new Promise((resolve) => {
    queue.push({
      kind: 'confirm',
      id: ++idSeq,
      title,
      message,
      confirmLabel: options?.confirmLabel ?? 'OK',
      destructive: options?.destructive,
      resolve,
    });
    notify();
  });
}
